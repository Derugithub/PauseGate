import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AppProvider, useApp } from '@/state/store';
import { palette } from '@/theme/tokens';

import '../global.css';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.bg,
    card: palette.bgRaised,
    text: palette.text,
    border: palette.cardBorder,
    primary: palette.accent,
    notification: palette.accent,
  },
};

function RootNavigator() {
  const { ready, state } = useApp();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(palette.bg);
  }, []);

  useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: palette.bg }} />;
  }

  return (
    <Stack
      initialRouteName={state.settings.onboardingComplete ? '(tabs)' : 'onboarding'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
        animation: 'fade',
      }}>
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pause" options={{ gestureEnabled: true }} />
      <Stack.Screen name="complete" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="habits"
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          title: 'Habit stack',
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '600', color: palette.text },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </ThemeProvider>
  );
}
