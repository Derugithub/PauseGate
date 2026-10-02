import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { WeekStrip } from '@/components/week-strip';
import { Button, Card, Screen, SectionLabel } from '@/components/ui';
import { formatRemaining, formatTimestamp, plural } from '@/lib/format';
import { remainingMs } from '@/lib/pause';
import { useNow } from '@/hooks/use-now';
import { useApp } from '@/state/store';
import { palette } from '@/theme/tokens';

const NOTE_WINDOW_MS = 12 * 60 * 60 * 1000;

export default function HomeScreen() {
  const { state, summary, week, startPause } = useApp();
  const latest = state.sessions[0];
  const noteOpen = !state.active && latest != null && latest.checkIn == null;
  const now = useNow(state.active != null || noteOpen);
  const [starting, setStarting] = useState(false);
  const enabled = state.habits.filter((habit) => habit.enabled);
  const pendingNote = noteOpen && latest != null && now - latest.completedAt < NOTE_WINDOW_MS;

  async function onStart() {
    if (starting) return;
    setStarting(true);
    try {
      await startPause();
      router.push('/pause');
    } finally {
      setStarting(false);
    }
  }

  const streakLabel =
    summary.currentStreak > 0 ? `${summary.currentStreak}-day streak` : 'No streak yet';

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>PauseGate</Text>
        <View style={styles.pill} testID="current-streak">
          <Text style={styles.pillText}>{streakLabel}</Text>
        </View>
      </View>

      <View style={styles.intro}>
        <Text style={styles.headline}>Before the feed.</Text>
        <Text style={styles.sub}>
          A short pause, then you choose. PauseGate does not block other apps.
        </Text>
      </View>

      {state.active ? (
        <Card>
          <SectionLabel>Pause in progress</SectionLabel>
          <Text style={styles.countdown} accessibilityRole="timer">
            {formatRemaining(remainingMs(state.active.endsAt, now))}
          </Text>
          <Text style={styles.meta}>Ends at {formatTimestamp(state.active.endsAt, true)}</Text>
          <Button label="Return to pause" onPress={() => router.push('/pause')} testID="return-pause" />
        </Card>
      ) : (
        <Card>
          <SectionLabel>Next pause</SectionLabel>
          <Text style={styles.duration} testID="home-duration">
            {state.settings.pauseDurationSec}s
          </Text>
          <Text style={styles.meta}>
            {enabled.length > 0 ? enabled.map((habit) => habit.label).join(' · ') : 'Quiet timer'}
          </Text>
          <Button
            label="Start pause"
            onPress={() => void onStart()}
            disabled={starting}
            testID="start-pause"
          />
        </Card>
      )}

      {pendingNote ? (
        <Card>
          <Text style={styles.noteTitle}>{"You're free to open the feed."}</Text>
          <Text style={styles.meta}>Noting what you did next is optional, and it stays on this phone.</Text>
          <Button
            label="Add a note"
            variant="ghost"
            onPress={() => router.push({ pathname: '/complete', params: { id: latest.id } })}
            testID="pending-checkin"
          />
        </Card>
      ) : null}

      <View style={styles.weekBlock}>
        <View style={styles.weekHeader}>
          <SectionLabel>This week</SectionLabel>
          <Text style={styles.todayCount} testID="today-count">
            Today · {plural(summary.todayCount, 'pause')}
          </Text>
        </View>
        <WeekStrip days={week} />
      </View>

      <Text style={styles.footer}>
        Open PauseGate before the app you crave. When the timer ends, the feed is still yours to open.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pill: {
    backgroundColor: palette.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  intro: {
    gap: 8,
  },
  headline: {
    color: palette.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: -0.6,
  },
  sub: {
    color: palette.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  countdown: {
    color: palette.text,
    fontSize: 56,
    fontWeight: '600',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  duration: {
    color: palette.text,
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  meta: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  noteTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  weekBlock: {
    gap: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  todayCount: {
    color: palette.textMuted,
    fontSize: 13,
  },
  footer: {
    color: palette.textFaint,
    fontSize: 14,
    lineHeight: 21,
  },
});
