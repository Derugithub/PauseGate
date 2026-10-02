import * as Haptics from 'expo-haptics';

export async function playCompleteHaptic(enabled: boolean): Promise<void> {
  if (!enabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics are optional feedback. A missing motor should not block the pause.
  }
}
