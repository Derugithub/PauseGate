import { Redirect, router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Screen } from '@/components/ui';
import { MAX_HABITS, MAX_LABEL_LENGTH, type Habit } from '@/lib/types';
import { useApp } from '@/state/store';
import { palette, radius } from '@/theme/tokens';

export default function HabitsScreen() {
  const navigation = useNavigation();
  const { ready, state, renameHabit, addHabit, removeHabit, setHabitEnabled } = useApp();
  const drafts = useRef(new Map<string, string>());
  const renameRef = useRef(renameHabit);
  useEffect(() => {
    renameRef.current = renameHabit;
  }, [renameHabit]);

  const flush = useCallback(() => {
    for (const [id, label] of drafts.current) {
      void renameRef.current(id, label);
    }
  }, []);

  const finish = useCallback(() => {
    flush();
    router.back();
  }, [flush]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      flush();
    });
    return unsubscribe;
  }, [flush, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done"
          onPress={finish}
          hitSlop={12}
          testID="habits-done-header"
          style={styles.headerDone}>
          <Text style={styles.headerDoneLabel}>Done</Text>
        </Pressable>
      ),
    });
  }, [finish, navigation]);

  if (ready && !state.settings.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  const atLimit = state.habits.length >= MAX_HABITS;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        topInset={false}
        footer={<Button label="Done" onPress={finish} testID="habits-done" />}>
        <Text style={styles.intro}>
          Rename a prompt, turn it on or off, or add your own. The next pause uses whatever is on.
        </Text>
        <Card>
          {state.habits.map((habit, index) => (
            <View key={habit.id} style={index > 0 ? styles.divided : undefined}>
              <HabitField
                habit={habit}
                onDraft={(label) => {
                  drafts.current.set(habit.id, label);
                  void renameHabit(habit.id, label);
                }}
                onToggle={(enabled) => void setHabitEnabled(habit.id, enabled)}
                onRemove={habit.builtIn ? undefined : () => void removeHabit(habit.id)}
              />
            </View>
          ))}
        </Card>
        {atLimit ? (
          <Text style={styles.limit}>Eight prompts is the limit.</Text>
        ) : (
          <Button label="Add a prompt" variant="ghost" onPress={() => void addHabit()} testID="add-habit" />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function HabitField({
  habit,
  onDraft,
  onToggle,
  onRemove,
}: {
  habit: Habit;
  onDraft: (label: string) => void;
  onToggle: (enabled: boolean) => void;
  onRemove?: () => void;
}) {
  const [label, setLabel] = useState(habit.label);

  function change(next: string) {
    setLabel(next);
    onDraft(next);
  }

  return (
    <View style={styles.field}>
      <TextInput
        value={label}
        onChangeText={change}
        onEndEditing={() => onDraft(label)}
        onSubmitEditing={() => onDraft(label)}
        maxLength={MAX_LABEL_LENGTH}
        placeholder="Prompt"
        placeholderTextColor={palette.textFaint}
        style={[styles.input, !habit.enabled && styles.inputOff]}
        accessibilityLabel={`Prompt ${habit.label}`}
        testID={`habit-label-${habit.id}`}
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
  headerDone: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerDoneLabel: {
    color: palette.accent,
    fontSize: 16,
    fontWeight: '600',
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
