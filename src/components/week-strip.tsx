import { StyleSheet, Text, View } from 'react-native';

import type { WeekDay } from '@/lib/streaks';
import { palette } from '@/theme/tokens';

export function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <View style={styles.row} accessibilityRole="summary">
      {days.map((day) => {
        const filled = day.count > 0;
        return (
          <View key={day.date} style={styles.cell} accessibilityLabel={labelFor(day)}>
            <Text style={[styles.letter, day.isToday && styles.letterToday]}>{day.label}</Text>
            <View
              style={[
                styles.dot,
                filled && styles.dotFilled,
                !filled && day.isToday && styles.dotToday,
                day.isFuture && styles.dotFuture,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

function labelFor(day: WeekDay): string {
  if (day.isFuture) return `${day.label}, ahead`;
  if (day.count > 0) return `${day.label}, ${day.count} pause${day.count === 1 ? '' : 's'}`;
  return `${day.label}, no pause`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    alignItems: 'center',
    gap: 10,
    minWidth: 28,
  },
  letter: {
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: '600',
  },
  letterToday: {
    color: palette.accent,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.track,
  },
  dotFilled: {
    backgroundColor: palette.accent,
  },
  dotToday: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: palette.accent,
  },
  dotFuture: {
    opacity: 0.45,
  },
});
