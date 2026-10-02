import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';

import { Mark } from '@/components/mark';
import { Button, Screen } from '@/components/ui';
import { plural } from '@/lib/format';
import { useApp } from '@/state/store';
import { palette } from '@/theme/tokens';
import type { CheckIn } from '@/lib/types';

export default function CompleteScreen() {
  const { ready, state, setCheckIn } = useApp();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const session = state.sessions.find((item) => item.id === id);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/');
      return true;
    });
    return () => subscription.remove();
  }, []);

  if (ready && !state.settings.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  if (!session) {
    return (
      <Screen scroll={false}>
        <View style={styles.body}>
          <Text style={styles.title}>{"That pause isn't on this device."}</Text>
          <Button label="Back home" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const doneCount = session.habits.filter((habit) => habit.done).length;
  const choice = session.checkIn;

  function choose(next: CheckIn) {
    if (!session) return;
    void setCheckIn(session.id, next);
  }

  return (
    <Screen scroll={false}>
      <View style={styles.body}>
        <Mark size={76} />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Pause complete</Text>
          <Text style={styles.title}>{"You're free to open the feed."}</Text>
          <Text style={styles.bodyText}>
            This pause is logged. Opening an app is still your choice.
          </Text>
          {session.habits.length > 0 && doneCount > 0 ? (
            <Text style={styles.meta}>
              You marked {plural(doneCount, 'prompt')} of {session.habits.length}.
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <Button
            label="I still want to scroll"
            variant={choice === 'opened' ? 'primary' : 'ghost'}
            onPress={() => choose('opened')}
            testID="checkin-opened"
          />
          <Button
            label="I'll stay"
            variant={choice === 'stayed' ? 'primary' : 'ghost'}
            onPress={() => choose('stayed')}
            testID="checkin-stayed"
          />
          <Button
            label={choice ? 'Done' : 'Not now'}
            variant="quiet"
            onPress={() => router.replace('/')}
            testID="complete-done"
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
  copy: {
    gap: 12,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: -0.6,
  },
  bodyText: {
    color: palette.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  meta: {
    color: palette.textFaint,
    fontSize: 14,
  },
  actions: {
    gap: 12,
  },
});
