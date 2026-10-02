import { DarkTheme, Stack, ThemeProvider, router, useGlobalSearchParams, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { completionRedirectId } from '@/lib/records';
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

function CompletionGate() {
  const { ready, state } = useApp();
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ id?: string | string[] }>();
  const previousActiveId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!ready || !state.settings.onboardingComplete) return;
    const id = completionRedirectId(previousActiveId.current, state, Date.now());
    previousActiveId.current = state.active?.id ?? null;
    if (!id) return;
    const currentId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (pathname === '/complete' && currentId === id) return;
    router.replace({ pathname: '/complete', params: { id } });
  }, [params.id, pathname, ready, state]);

  return null;
}

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
    <>
      <CompletionGate />
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
    </>
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
