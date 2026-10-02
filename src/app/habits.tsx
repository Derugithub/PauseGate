import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Screen } from '@/components/ui';
import { MAX_HABITS, MAX_LABEL_LENGTH, type Habit } from '@/lib/types';
import { useApp } from '@/state/store';
import { palette, radius } from '@/theme/tokens';

export default function HabitsScreen() {
  const { ready, state, renameHabit, addHabit, removeHabit, setHabitEnabled } = useApp();
  if (ready && !state.settings.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  const atLimit = state.habits.length >= MAX_HABITS;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen topInset={false}>
        <Text style={styles.intro}>
          Turn prompts on or off, rename them, or add your own. The next pause uses whatever is on.
        </Text>
        <Card>
          {state.habits.map((habit, index) => (
            <View key={habit.id} style={index > 0 ? styles.divided : undefined}>
              <HabitField
                key={`${habit.id}:${habit.label}`}
                habit={habit}
                onRename={(label) => void renameHabit(habit.id, label)}
                onToggle={(enabled) => void setHabitEnabled(habit.id, enabled)}
                onRemove={habit.builtIn ? undefined : () => void removeHabit(habit.id)}
              />
            </View>
          ))}
        </Card>
        {atLimit ? (
          <Text style={styles.limit}>Eight prompts is the stack limit.</Text>
        ) : (
          <Button label="Add a prompt" variant="ghost" onPress={() => void addHabit()} testID="add-habit" />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function HabitField({
  habit,
  onRename,
  onToggle,
  onRemove,
}: {
  habit: Habit;
  onRename: (label: string) => void;
  onToggle: (enabled: boolean) => void;
  onRemove?: () => void;
}) {
  const [label, setLabel] = useState(habit.label);

  function commit() {
    const trimmed = label.trim();
    if (!trimmed) {
      setLabel(habit.label);
      return;
    }
    if (trimmed !== habit.label) onRename(trimmed);
  }

  return (
    <View style={styles.field}>
      <TextInput
        value={label}
        onChangeText={setLabel}
        onEndEditing={commit}
        onSubmitEditing={commit}
        maxLength={MAX_LABEL_LENGTH}
        placeholder="Prompt"
        placeholderTextColor={palette.textFaint}
        style={[styles.input, !habit.enabled && styles.inputOff]}
        accessibilityLabel={`Prompt ${habit.label}`}
      />
      <View style={styles.fieldActions}>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: habit.enabled }}
          accessibilityLabel={habit.enabled ? `Turn off ${habit.label}` : `Turn on ${habit.label}`}
          onPress={() => onToggle(!habit.enabled)}
          style={[styles.chip, habit.enabled && styles.chipOn]}>
          <Text style={[styles.chipText, habit.enabled && styles.chipTextOn]}>
            {habit.enabled ? 'In stack' : 'Off'}
          </Text>
        </Pressable>
        {onRemove ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${habit.label}`} onPress={onRemove}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  intro: {
    color: palette.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: palette.cardBorder,
    marginTop: 4,
    paddingTop: 12,
  },
  field: {
    gap: 10,
    paddingVertical: 6,
  },
  input: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '500',
    paddingVertical: 4,
  },
  inputOff: {
    color: palette.textMuted,
  },
  fieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accentLine,
  },
  chipText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextOn: {
    color: palette.accent,
  },
  remove: {
    color: palette.textFaint,
    fontSize: 14,
  },
  limit: {
    color: palette.textFaint,
    fontSize: 14,
  },
});
