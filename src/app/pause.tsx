import { Redirect, router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import { useNow } from '@/hooks/use-now';
import { formatRemaining, formatTimestamp } from '@/lib/format';
import { remainingMs } from '@/lib/pause';
import { useApp } from '@/state/store';
import { palette, radius } from '@/theme/tokens';

export default function PauseScreen() {
  const { ready, state, toggleActiveHabit } = useApp();
  const active = state.active;
  const now = useNow(true);
  const watchedId = useRef<string | null>(null);
  const left = useRef(false);

  useEffect(() => {
    if (active) watchedId.current = active.id;
  }, [active]);

  useEffect(() => {
    if (!ready || left.current || active) return;
    // The screen can mount a beat before the new pause reaches React state.
    const timer = setTimeout(() => {
      if (left.current) return;
      left.current = true;
      const id = watchedId.current;
      const match = id ? state.sessions.some((session) => session.id === id) : false;
      if (match && id) {
        router.replace({ pathname: '/complete', params: { id } });
      } else {
        router.replace('/');
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [active, ready, state.sessions]);

  if (ready && !state.settings.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  if (!active) {
    return <View style={styles.empty} />;
  }

  const remaining = remainingMs(active.endsAt, now);
  const total = Math.max(1, active.endsAt - active.startedAt);
  const progress = Math.min(1, Math.max(0, 1 - remaining / total));
  const secondsLeft = Math.ceil(remaining / 1000);

  return (
    <Screen
      footer={
        <Text style={styles.footer}>Stay with this until the timer ends. There is no early skip.</Text>
      }>
      <View style={styles.top}>
        <Text style={styles.eyebrow}>Pause</Text>
        <Text
          style={styles.countdown}
          accessibilityRole="timer"
          accessibilityLabel={`${secondsLeft} seconds remaining`}
          testID="pause-countdown">
          {formatRemaining(remaining)}
        </Text>
        <Text style={styles.ends}>Ends at {formatTimestamp(active.endsAt, true)}</Text>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: active.durationSec,
            now: Math.min(active.durationSec, Math.max(0, active.durationSec - secondsLeft)),
          }}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.stack}>
        <Text style={styles.stackLabel}>Habit stack</Text>
        <Text style={styles.stackHelp}>Optional. The timer is the gate.</Text>
        {active.habits.length === 0 ? (
          <Text style={styles.emptyHabits}>No prompts in this stack. The timer is enough.</Text>
        ) : (
          active.habits.map((habit) => (
            <Pressable
              key={habit.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: habit.done }}
              accessibilityLabel={habit.label}
              onPress={() => void toggleActiveHabit(habit.id)}
              testID={`habit-${habit.id}`}
              style={[styles.habit, habit.done && styles.habitDone]}>
              <View style={[styles.mark, habit.done && styles.markDone]} />
              <Text style={[styles.habitLabel, habit.done && styles.habitLabelDone]}>{habit.label}</Text>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  top: {
    gap: 8,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  countdown: {
    color: palette.text,
    fontSize: 76,
    lineHeight: 84,
    fontWeight: '600',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  ends: {
    color: palette.textMuted,
    fontSize: 15,
  },
  track: {
    marginTop: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.track,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    backgroundColor: palette.accent,
  },
  stack: {
    gap: 10,
  },
  stackLabel: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
  },
  stackHelp: {
    color: palette.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  emptyHabits: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  habit: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  habitDone: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accentLine,
  },
  mark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: palette.textFaint,
  },
  markDone: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  habitLabel: {
    color: palette.text,
    fontSize: 16,
    flex: 1,
  },
  habitLabelDone: {
    color: palette.text,
  },
  footer: {
    color: palette.textFaint,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
