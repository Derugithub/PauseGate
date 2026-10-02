import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Mark } from '@/components/mark';
import { Button, Screen } from '@/components/ui';
import { useApp } from '@/state/store';
import { palette } from '@/theme/tokens';

const STEPS = [
  { index: '01', text: 'When you want a feed, open PauseGate first.' },
  { index: '02', text: 'A short timer runs, with a few small things you can do while you wait.' },
  { index: '03', text: 'When it ends, open the feed or stay. The pause counts either way.' },
];

export default function OnboardingScreen() {
  const { ready, state, completeOnboarding } = useApp();
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);

  if (ready && state.settings.onboardingComplete) {
    return <Redirect href="/" />;
  }

  async function begin() {
    if (saving) return;
    setSaving(true);
    try {
      await completeOnboarding();
      router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll={false}>
      <View style={styles.body}>
        <Mark size={64} />
        {page === 0 ? (
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>Before the feed</Text>
            <Text style={styles.title}>Pause, then decide.</Text>
            <Text style={styles.bodyText}>
              A short wait makes the urge to scroll easier to notice. PauseGate waits with you.
              When the timer ends, you can still open the feed.
            </Text>
          </View>
        ) : (
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>On your phone</Text>
            <Text style={styles.title}>It stays here.</Text>
            <Text style={styles.bodyText}>
              No account. Your pauses, prompts, and streak stay on this phone.
            </Text>
            <View style={styles.steps}>
              {STEPS.map((step) => (
                <View key={step.index} style={styles.step}>
                  <Text style={styles.stepIndex}>{step.index}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1].map((dot) => (
            <View key={dot} style={[styles.dot, dot === page && styles.dotActive]} />
          ))}
        </View>
        {page === 0 ? (
          <Button label="Continue" onPress={() => setPage(1)} testID="onboarding-continue" />
        ) : (
          <Button
            label="Begin"
            onPress={() => void begin()}
            disabled={saving}
            testID="onboarding-begin"
          />
        )}
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
    gap: 14,
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
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '600',
    letterSpacing: -0.7,
  },
  bodyText: {
    color: palette.textMuted,
    fontSize: 17,
    lineHeight: 26,
  },
  steps: {
    gap: 14,
    marginTop: 8,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepIndex: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    width: 24,
    marginTop: 3,
  },
  stepText: {
    flex: 1,
    color: palette.text,
    fontSize: 16,
    lineHeight: 23,
  },
  footer: {
    gap: 18,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.track,
  },
  dotActive: {
    width: 18,
    backgroundColor: palette.accent,
  },
});
