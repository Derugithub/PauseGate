import { Redirect, Tabs } from 'expo-router';

import { TabGlyph } from '@/components/tab-glyph';
import { useApp } from '@/state/store';
import { palette } from '@/theme/tokens';

export default function TabsLayout() {
  const { ready, state } = useApp();
  if (ready && !state.settings.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarStyle: {
          backgroundColor: palette.bgRaised,
          borderTopColor: palette.cardBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pause',
          tabBarIcon: ({ color }) => <TabGlyph name="pause" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabGlyph name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabGlyph name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
