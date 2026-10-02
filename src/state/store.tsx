import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { playCompleteHaptic } from '@/lib/haptics';
import { syncReminder } from '@/lib/notifications';
import { clampPauseDuration, createPauseWindow } from '@/lib/pause';
import { createId, defaultState, sanitizeState } from '@/lib/persist';
import { completionDateKeys, withCompletion } from '@/lib/records';
import { buildWeekStrip, dateKeyFromTimestamp, summarizeStreak, type StreakSummary, type WeekDay } from '@/lib/streaks';
import { loadState, saveState } from '@/lib/storage';
import {
  MAX_HABITS,
  MAX_LABEL_LENGTH,
  type CheckIn,
  type PersistedState,
} from '@/lib/types';

type AppStore = {
  ready: boolean;
  state: PersistedState;
  todayKey: string;
  summary: StreakSummary;
  week: WeekDay[];
  reminderNote: string | null;
  completeOnboarding: () => Promise<void>;
  startPause: () => Promise<void>;
  toggleActiveHabit: (habitId: string) => Promise<void>;
  setCheckIn: (sessionId: string, checkIn: CheckIn) => Promise<void>;
  setDuration: (seconds: number) => Promise<void>;
  setHaptics: (enabled: boolean) => Promise<void>;
  setReminders: (enabled: boolean) => Promise<void>;
  setReminderTime: (hour: number, minute: number) => Promise<void>;
  setHabitEnabled: (habitId: string, enabled: boolean) => Promise<void>;
  renameHabit: (habitId: string, label: string) => Promise<void>;
  addHabit: () => Promise<void>;
  removeHabit: (habitId: string) => Promise<void>;
  resetAll: () => Promise<void>;
};

const AppContext = createContext<AppStore | null>(null);

function useTodayKey(): string {
  const [todayKey, setTodayKey] = useState(() => dateKeyFromTimestamp(Date.now()));
  useEffect(() => {
    const update = () => setTodayKey(dateKeyFromTimestamp(Date.now()));
    const id = setInterval(update, 30_000);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') update();
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, []);
  return todayKey;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => defaultState());
  const [ready, setReady] = useState(false);
  const [reminderNote, setReminderNote] = useState<string | null>(null);
  const stateRef = useRef(state);
  const queue = useRef(Promise.resolve());
  const todayKey = useTodayKey();

  const commit = useCallback(async (next: PersistedState) => {
    stateRef.current = next;
    setState(next);
    try {
      await saveState(next);
    } catch {
      // Keep the in-memory pause if local storage is briefly unavailable.
    }
  }, []);

  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(task, task);
    queue.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const completeDue = useCallback(
    (haptic: boolean) =>
      enqueue(async () => {
        const before = stateRef.current;
        const next = withCompletion(before, Date.now());
        if (next === before) return;
        const didRecord = next.sessions.length > before.sessions.length;
        await commit(next);
        if (didRecord && haptic) {
          await playCompleteHaptic(next.settings.hapticsEnabled);
        }
      }),
    [commit, enqueue],
  );

  useEffect(() => {
    let cancelled = false;
    void enqueue(async () => {
      const loaded = sanitizeState(await loadState());
      const next = withCompletion(loaded, Date.now());
      if (cancelled) return;
      await commit(next);
      if (next.settings.remindersEnabled) {
        const result = await syncReminder(next.settings, { requestPermission: false });
        if (!result.enabled && stateRef.current.settings.remindersEnabled) {
          await commit({
            ...stateRef.current,
            settings: { ...stateRef.current.settings, remindersEnabled: false },
          });
        }
      }
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [commit, enqueue]);

  useEffect(() => {
    if (!ready || !state.active) return;
    const delay = Math.max(0, state.active.endsAt - Date.now());
    const timer = setTimeout(() => {
      void completeDue(true);
    }, delay);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void completeDue(true);
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [completeDue, ready, state.active]);

  const summary = useMemo(
    () => summarizeStreak(completionDateKeys(state.sessions), todayKey),
    [state.sessions, todayKey],
  );
  const week = useMemo(() => buildWeekStrip(todayKey, summary.countsByDate), [summary.countsByDate, todayKey]);

  const value = useMemo<AppStore>(
    () => ({
      ready,
      state,
      todayKey,
      summary,
      week,
      reminderNote,
      completeOnboarding: () =>
        enqueue(async () => {
          await commit({
            ...stateRef.current,
            settings: { ...stateRef.current.settings, onboardingComplete: true },
          });
        }),
      startPause: () =>
        enqueue(async () => {
          const settled = withCompletion(stateRef.current, Date.now());
          if (settled.active) {
            if (settled !== stateRef.current) await commit(settled);
            return;
          }
          const recorded = settled.sessions.length > stateRef.current.sessions.length;
          const window = createPauseWindow(Date.now(), settled.settings.pauseDurationSec);
          await commit({
            ...settled,
            active: {
              id: createId('pause'),
              startedAt: window.startedAt,
              endsAt: window.endsAt,
              durationSec: window.durationSec,
              habits: settled.habits
                .filter((habit) => habit.enabled)
                .map((habit) => ({ id: habit.id, label: habit.label, done: false })),
            },
          });
          if (recorded) await playCompleteHaptic(settled.settings.hapticsEnabled);
        }),
      toggleActiveHabit: (habitId) =>
        enqueue(async () => {
          const active = stateRef.current.active;
          if (!active) return;
          await commit({
            ...stateRef.current,
            active: {
              ...active,
              habits: active.habits.map((habit) =>
                habit.id === habitId ? { ...habit, done: !habit.done } : habit,
              ),
            },
          });
        }),
      setCheckIn: (sessionId, checkIn) =>
        enqueue(async () => {
          await commit({
            ...stateRef.current,
            sessions: stateRef.current.sessions.map((session) =>
              session.id === sessionId ? { ...session, checkIn } : session,
            ),
          });
        }),
      setDuration: (seconds) =>
        enqueue(async () => {
          await commit({
            ...stateRef.current,
            settings: {
              ...stateRef.current.settings,
              pauseDurationSec: clampPauseDuration(seconds),
            },
          });
        }),
      setHaptics: (enabled) =>
        enqueue(async () => {
          await commit({
            ...stateRef.current,
            settings: { ...stateRef.current.settings, hapticsEnabled: enabled },
          });
        }),
      setReminders: (enabled) =>
        enqueue(async () => {
          setReminderNote(null);
          if (!enabled) {
            const next = {
              ...stateRef.current,
              settings: { ...stateRef.current.settings, remindersEnabled: false },
            };
            await commit(next);
            await syncReminder(next.settings, { requestPermission: false });
            return;
          }
          const requested = { ...stateRef.current.settings, remindersEnabled: true };
          const result = await syncReminder(requested, { requestPermission: true });
          await commit({
            ...stateRef.current,
            settings: { ...stateRef.current.settings, remindersEnabled: result.enabled },
          });
          setReminderNote(result.message);
        }),
      setReminderTime: (hour, minute) =>
        enqueue(async () => {
          const next = sanitizeState({
            ...stateRef.current,
            settings: { ...stateRef.current.settings, reminderHour: hour, reminderMinute: minute },
          });
          await commit(next);
          if (next.settings.remindersEnabled) {
            const result = await syncReminder(next.settings, { requestPermission: false });
            if (!result.enabled) {
              await commit({
                ...stateRef.current,
                settings: { ...stateRef.current.settings, remindersEnabled: false },
              });
              setReminderNote(result.message);
            }
          }
        }),
      setHabitEnabled: (habitId, enabled) =>
        enqueue(async () => {
          await commit({
            ...stateRef.current,
            habits: stateRef.current.habits.map((habit) =>
              habit.id === habitId ? { ...habit, enabled } : habit,
            ),
          });
        }),
      renameHabit: (habitId, label) =>
        enqueue(async () => {
          const trimmed = label.trim().slice(0, MAX_LABEL_LENGTH);
          if (!trimmed) return;
          const current = stateRef.current.habits.find((habit) => habit.id === habitId);
          if (!current || current.label === trimmed) return;
          await commit({
            ...stateRef.current,
            habits: stateRef.current.habits.map((habit) =>
              habit.id === habitId ? { ...habit, label: trimmed } : habit,
            ),
          });
        }),
      addHabit: () =>
        enqueue(async () => {
          if (stateRef.current.habits.length >= MAX_HABITS) return;
          await commit({
            ...stateRef.current,
            habits: [
              ...stateRef.current.habits,
              { id: createId('habit'), label: 'New prompt', enabled: true, builtIn: false },
            ],
          });
        }),
      removeHabit: (habitId) =>
        enqueue(async () => {
          await commit({
            ...stateRef.current,
            habits: stateRef.current.habits.filter((habit) => habit.builtIn || habit.id !== habitId),
          });
        }),
      resetAll: () =>
        enqueue(async () => {
          const next = defaultState();
          next.settings.onboardingComplete = true;
          await commit(next);
          await syncReminder(next.settings, { requestPermission: false });
          setReminderNote(null);
        }),
    }),
    [commit, enqueue, ready, reminderNote, state, summary, todayKey, week],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppStore {
  const store = useContext(AppContext);
  if (!store) throw new Error('useApp must be used within AppProvider');
  return store;
}
