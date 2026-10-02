import { router } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, SectionLabel, ToggleRow } from '@/components/ui';
import { formatClock, shiftReminder } from '@/lib/format';
import { MAX_PAUSE_SECONDS, MIN_PAUSE_SECONDS, PAUSE_STEP_SECONDS } from '@/lib/pause';
import { useApp } from '@/state/store';
import { palette } from '@/theme/tokens';

export default function SettingsScreen() {
  const {
    state,
    reminderNote,
    setDuration,
    setHabitEnabled,
    setHaptics,
    setReminders,
    setReminderTime,
    resetAll,
  } = useApp();
  const { settings, habits } = state;
  const duration = settings.pauseDurationSec;
  const ratio = (duration - MIN_PAUSE_SECONDS) / (MAX_PAUSE_SECONDS - MIN_PAUSE_SECONDS);

  function confirmErase() {
    Alert.alert(
      'Erase data on this device?',
      'Pauses, streaks, habits, and settings on this phone will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase', style: 'destructive', onPress: () => void resetAll() },
      ],
    );
  }

  function moveTime(deltaMinutes: number) {
    const next = shiftReminder(settings.reminderHour, settings.reminderMinute, deltaMinutes);
    void setReminderTime(next.hour, next.minute);
  }

  return (
    <Screen>
      <View style={styles.intro}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.sub}>Pause length, the stack, and a few options that stay on this device.</Text>
      </View>

      <View style={styles.group}>
        <SectionLabel>Pause length</SectionLabel>
        <Card>
          <View style={styles.stepper}>
            <RoundButton
              label="−"
              accessibilityLabel="Shorten pause"
              disabled={duration <= MIN_PAUSE_SECONDS}
              onPress={() => void setDuration(duration - PAUSE_STEP_SECONDS)}
              testID="duration-decrease"
            />
            <Text style={styles.duration} testID="duration-value">
              {duration}s
            </Text>
            <RoundButton
              label="+"
              accessibilityLabel="Lengthen pause"
              disabled={duration >= MAX_PAUSE_SECONDS}
              onPress={() => void setDuration(duration + PAUSE_STEP_SECONDS)}
              testID="duration-increase"
            />
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
          </View>
          <Text style={styles.help}>Between 30 seconds and 3 minutes. The default is 45.</Text>
        </Card>
      </View>

      <View style={styles.group}>
        <SectionLabel>Habit stack</SectionLabel>
        <Card>
          {habits.map((habit, index) => (
            <View key={habit.id} style={index > 0 ? styles.divided : undefined}>
              <ToggleRow
                title={habit.label}
                value={habit.enabled}
                onValueChange={(enabled) => void setHabitEnabled(habit.id, enabled)}
                testID={`habit-toggle-${habit.id}`}
              />
            </View>
          ))}
          <Button label="Edit prompts" variant="ghost" onPress={() => router.push('/habits')} testID="edit-habits" />
        </Card>
      </View>

      {Platform.OS === 'web' ? null : (
        <View style={styles.group}>
          <SectionLabel>Reminder</SectionLabel>
          <Card>
            <ToggleRow
              title="Daily reminder"
              subtitle="A gentle nudge, once a day."
              value={settings.remindersEnabled}
              onValueChange={(enabled) => void setReminders(enabled)}
              testID="reminder-toggle"
            />
            {settings.remindersEnabled ? (
              <View style={styles.timeBlock}>
                <Text style={styles.clock} testID="reminder-clock">
                  {formatClock(settings.reminderHour, settings.reminderMinute)}
                </Text>
                <View style={styles.timeRow}>
                  <Button label="− hour" variant="ghost" onPress={() => moveTime(-60)} style={styles.timeButton} />
                  <Button label="+ hour" variant="ghost" onPress={() => moveTime(60)} style={styles.timeButton} />
                </View>
                <View style={styles.timeRow}>
                  <Button label="− 15 min" variant="ghost" onPress={() => moveTime(-15)} style={styles.timeButton} />
                  <Button label="+ 15 min" variant="ghost" onPress={() => moveTime(15)} style={styles.timeButton} />
                </View>
              </View>
            ) : null}
            {reminderNote ? <Text style={styles.help}>{reminderNote}</Text> : null}
          </Card>
        </View>
      )}

      <View style={styles.group}>
        <SectionLabel>Haptics</SectionLabel>
        <Card>
          <ToggleRow
            title="Haptic when a pause ends"
            subtitle="A short tap on this device."
            value={settings.hapticsEnabled}
            onValueChange={(enabled) => void setHaptics(enabled)}
            testID="haptics-toggle"
          />
        </Card>
      </View>

      <View style={styles.group}>
        <SectionLabel>About</SectionLabel>
        <Card>
          <Text style={styles.about}>
            PauseGate does not block or close other apps. When the timer ends, opening the feed
            is still up to you. Your pauses stay on this phone.
          </Text>
        </Card>
      </View>

      <Button label="Erase data on this device" variant="quiet" onPress={confirmErase} testID="erase-data" />
    </Screen>
  );
}

function RoundButton({
  label,
  accessibilityLabel,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.round, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
      <Text style={styles.roundLabel}>{label}</Text>
    </Pressable>
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
  group: {
    gap: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duration: {
    color: palette.text,
    fontSize: 36,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.accentLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundLabel: {
    color: palette.text,
    fontSize: 22,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.35,
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.track,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    backgroundColor: palette.accent,
  },
  help: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: palette.cardBorder,
  },
  timeBlock: {
    gap: 10,
  },
  clock: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeButton: {
    flex: 1,
  },
  about: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
});
