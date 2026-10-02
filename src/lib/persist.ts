import {
  clampPauseDuration,
  completionCountsForStreak,
  DEFAULT_PAUSE_SECONDS,
  MAX_PAUSE_SECONDS,
  MIN_PAUSE_SECONDS,
} from './pause';
import {
  MAX_HABITS,
  MAX_LABEL_LENGTH,
  MAX_SESSIONS,
  type ActivePause,
  type CheckIn,
  type Habit,
  type HabitSnapshot,
  type PauseRecord,
  type PersistedState,
  type Settings,
} from './types';

export const DEFAULT_HABITS: Habit[] = [
  { id: 'breathe', label: 'Breathe 3×', enabled: true, builtIn: true },
  { id: 'water', label: 'Drink water', enabled: true, builtIn: true },
  { id: 'stretch', label: 'Stretch', enabled: true, builtIn: true },
  { id: 'book', label: 'Open a book', enabled: true, builtIn: true },
];

export const DEFAULT_SETTINGS: Settings = {
  pauseDurationSec: DEFAULT_PAUSE_SECONDS,
  hapticsEnabled: true,
  remindersEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
  onboardingComplete: false,
};

export function defaultState(): PersistedState {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    habits: DEFAULT_HABITS.map((habit) => ({ ...habit })),
    sessions: [],
    active: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function clampHour(hour: number): number {
  if (!Number.isFinite(hour)) return DEFAULT_SETTINGS.reminderHour;
  return Math.min(23, Math.max(0, Math.round(hour)));
}

export function clampQuarterHour(minute: number): number {
  const steps = [0, 15, 30, 45];
  if (!Number.isFinite(minute)) return 0;
  return steps.reduce((best, step) => (Math.abs(step - minute) < Math.abs(best - minute) ? step : best));
}

function sanitizeLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, MAX_LABEL_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeHabits(raw: unknown): Habit[] {
  if (!Array.isArray(raw)) return DEFAULT_HABITS.map((habit) => ({ ...habit }));
  const habits: Habit[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isRecord(item) || typeof item.id !== 'string' || seen.has(item.id)) continue;
    const label = sanitizeLabel(item.label);
    if (!label) continue;
    seen.add(item.id);
    habits.push({
      id: item.id,
      label,
      enabled: boolOr(item.enabled, true),
      builtIn: boolOr(item.builtIn, false),
    });
    if (habits.length >= MAX_HABITS) break;
  }
  return habits.length > 0 ? habits : DEFAULT_HABITS.map((habit) => ({ ...habit }));
}

function sanitizeSnapshot(raw: unknown): HabitSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const habits: HabitSnapshot[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.id !== 'string') continue;
    const label = sanitizeLabel(item.label);
    if (!label) continue;
    habits.push({ id: item.id, label, done: boolOr(item.done, false) });
  }
  return habits;
}

function durationFromWindow(startedAt: number, endsAt: number, fallback: number): number {
  const derived = Math.round((endsAt - startedAt) / 1000);
  if (derived >= MIN_PAUSE_SECONDS && derived <= MAX_PAUSE_SECONDS) return derived;
  return clampPauseDuration(fallback);
}

function sanitizeSession(raw: unknown): PauseRecord | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id.length === 0) return null;
  const startedAt = numberOr(raw.startedAt, Number.NaN);
  const endsAt = numberOr(raw.endsAt, Number.NaN);
  const completedAt = numberOr(raw.completedAt, Number.NaN);
  if (!Number.isFinite(startedAt) || !Number.isFinite(endsAt) || !Number.isFinite(completedAt)) {
    return null;
  }
  if (!completionCountsForStreak({ completedAt, endsAt })) return null;
  const checkIn: CheckIn | null = raw.checkIn === 'opened' || raw.checkIn === 'stayed' ? raw.checkIn : null;
  return {
    id: raw.id,
    startedAt,
    endsAt,
    completedAt,
    durationSec: durationFromWindow(startedAt, endsAt, numberOr(raw.durationSec, DEFAULT_PAUSE_SECONDS)),
    habits: sanitizeSnapshot(raw.habits),
    checkIn,
  };
}

function sanitizeActive(raw: unknown): ActivePause | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id.length === 0) return null;
  const startedAt = numberOr(raw.startedAt, Number.NaN);
  const endsAt = numberOr(raw.endsAt, Number.NaN);
  if (!Number.isFinite(startedAt) || !Number.isFinite(endsAt) || endsAt <= startedAt) return null;
  return {
    id: raw.id,
    startedAt,
    endsAt,
    durationSec: durationFromWindow(startedAt, endsAt, numberOr(raw.durationSec, DEFAULT_PAUSE_SECONDS)),
    habits: sanitizeSnapshot(raw.habits),
  };
}

export function sanitizeState(raw: unknown): PersistedState {
  const base = defaultState();
  if (!isRecord(raw)) return base;
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const sessions = Array.isArray(raw.sessions)
    ? raw.sessions
        .map(sanitizeSession)
        .filter((session): session is PauseRecord => session != null)
        .sort((a, b) => b.endsAt - a.endsAt)
        .slice(0, MAX_SESSIONS)
    : [];

  return {
    version: 1,
    settings: {
      pauseDurationSec: clampPauseDuration(
        numberOr(settings.pauseDurationSec, DEFAULT_PAUSE_SECONDS),
      ),
      hapticsEnabled: boolOr(settings.hapticsEnabled, DEFAULT_SETTINGS.hapticsEnabled),
      remindersEnabled: boolOr(settings.remindersEnabled, false),
      reminderHour: clampHour(numberOr(settings.reminderHour, DEFAULT_SETTINGS.reminderHour)),
      reminderMinute: clampQuarterHour(numberOr(settings.reminderMinute, 0)),
      onboardingComplete: boolOr(settings.onboardingComplete, false),
    },
    habits: sanitizeHabits(raw.habits),
    sessions,
    active: sanitizeActive(raw.active),
  };
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
