import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WeekStrip } from '@/components/week-strip';
import { Card, Screen, SectionLabel } from '@/components/ui';
import { formatDateKey, formatTimestamp, plural } from '@/lib/format';
import { dateKeyFromTimestamp } from '@/lib/streaks';
import { streakCreditTimestamp } from '@/lib/pause';
import { useApp } from '@/state/store';
import { palette, radius } from '@/theme/tokens';

export default function HistoryScreen() {
  const { state, summary, week, todayKey } = useApp();

  return (
    <Screen>
      <View style={styles.intro}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.sub}>A day counts when you finish at least one pause.</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Current" value={String(summary.currentStreak)} testID="stat-current" />
        <Stat label="Longest" value={String(summary.longestStreak)} testID="stat-longest" />
        <Stat label="Today" value={String(summary.todayCount)} testID="stat-today" />
      </View>

      <View style={styles.weekBlock}>
        <SectionLabel>This week</SectionLabel>
        <WeekStrip days={week} />
      </View>

      <View style={styles.list}>
        <SectionLabel>Recent pauses</SectionLabel>
        {state.sessions.length === 0 ? (
          <Text style={styles.empty}>Your first completed pause will show up here.</Text>
        ) : (
          state.sessions.slice(0, 30).map((session) => {
            const credit = streakCreditTimestamp(session) ?? session.endsAt;
            const day = formatDateKey(dateKeyFromTimestamp(credit), todayKey);
            const prompts = session.habits.filter((habit) => habit.done).length;
            const note =
              session.checkIn === 'opened'
                ? 'Opened the feed'
                : session.checkIn === 'stayed'
                  ? 'Stayed'
                  : 'No note';
            return (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                accessibilityLabel={`${day}, ${session.durationSec} seconds, ${note}`}
                onPress={() => router.push({ pathname: '/complete', params: { id: session.id } })}
                style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>
                    {day} · {formatTimestamp(session.endsAt)}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {session.durationSec}s
                    {session.habits.length > 0
                      ? ` · ${prompts} of ${session.habits.length} prompts`
                      : ''}
                    {' · '}
                    {note}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })
        )}
        {summary.longestStreak > 0 ? (
          <Text style={styles.longestNote}>
            Longest run is {plural(summary.longestStreak, 'day')}.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

function Stat({ label, value, testID }: { label: string; value: string; testID: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue} testID={testID}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: 8,
  },
  title: {
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
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
  },
  statValue: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  weekBlock: {
    gap: 16,
  },
  list: {
    gap: 10,
  },
  empty: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    minHeight: 68,
    borderRadius: radius.md,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '500',
  },
  rowMeta: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    color: palette.textFaint,
    fontSize: 22,
    lineHeight: 22,
  },
  longestNote: {
    color: palette.textFaint,
    fontSize: 13,
    marginTop: 4,
  },
});
