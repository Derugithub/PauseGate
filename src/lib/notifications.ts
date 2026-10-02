import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { Settings } from './types';

const CHANNEL_ID = 'pausegate-reminders';
const NOTIFICATION_ID = 'pausegate-daily-reminder';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export type ReminderSync = {
  enabled: boolean;
  message: string | null;
};

export async function syncReminder(
  settings: Pick<Settings, 'remindersEnabled' | 'reminderHour' | 'reminderMinute'>,
  options: { requestPermission: boolean },
): Promise<ReminderSync> {
  if (Platform.OS === 'web') {
    return { enabled: false, message: null };
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
  } catch {
    // The previous reminder may already be gone.
  }

  if (!settings.remindersEnabled) {
    return { enabled: false, message: null };
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Pause reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'A daily nudge to open PauseGate before a feed.',
        sound: null,
        enableVibrate: false,
        showBadge: false,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted' && options.requestPermission) {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== 'granted') {
      return {
        enabled: false,
        message: options.requestPermission
          ? 'Notifications stay off. PauseGate still works without them.'
          : null,
      };
    }

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: 'A moment before the feed',
        body: 'If you feel like scrolling, open PauseGate first.',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.reminderHour,
        minute: settings.reminderMinute,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });

    return { enabled: true, message: null };
  } catch {
    return {
      enabled: false,
      message: 'Reminders could not be scheduled. The rest of PauseGate is unaffected.',
    };
  }
}
