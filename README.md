# PauseGate

A soft pause before you scroll.

When you want Instagram, TikTok, or another feed, open PauseGate first. A short timer runs with a small habit stack — breathe, drink water, stretch, open a book. When it ends, you can still open the feed. PauseGate does not block other apps.

There is no account and no cloud. Pauses, habits, streaks, and settings stay on the device.

## Install

```bash
npm install
npx expo start
```

Then press `i` for the iOS simulator, `a` for an Android emulator, or scan the QR code with Expo Go for SDK 57. The app is portrait and dark.

## What “soft gate” means

The timer is mandatory inside PauseGate. You cannot mark the pause done early, and “I still want to scroll” appears only after the countdown finishes. The countdown uses an absolute end time, so leaving the app does not make it drift.

PauseGate never closes, locks, or filters other apps. If you leave, the pause keeps running until that end time. Finishing it counts toward a daily streak. Noting whether you opened the feed is optional and local.

## Offline

The app works fully offline. Nothing is sent to a server. There are no accounts, analytics, or cloud sync. Optional reminders are scheduled on the phone with `expo-notifications`, and only after you turn them on. If notification permission is denied, the rest of the app keeps working.

Data is stored with AsyncStorage under the key `pausegate.v1`.

## Tests

```bash
npm test
```

Unit tests cover streak day counting (including “today is still open” and timezone credit) and pause-completion rules (duration bounds, absolute countdown, no early complete, one record per pause).

## Brand assets

The icon and splash are placeholders. Replace them with a brand pack later:

| Path | Use |
| --- | --- |
| `assets/images/icon.png` | 1024×1024 app icon |
| `assets/images/splash-icon.png` | Splash mark on `#101413` |
| `assets/images/android-icon-foreground.png` | Android adaptive foreground |
| `assets/images/android-icon-background.png` | Android adaptive background |
| `assets/images/android-icon-monochrome.png` | Android themed icon |
| `assets/images/favicon.png` | Web favicon |

Splash and icon colors live in `app.json`.

## Manual check

- Fresh install shows onboarding, then the home gate.
- Start a pause. Background the app and return: the countdown matches the original end time.
- There is no way to finish early. The feed choice appears only at zero.
- Habit checks survive leaving and returning mid-pause.
- Completing a pause updates today’s count and the streak, and both survive a reload.
- “I still want to scroll” and “I’ll stay” save on the device and show in History.
- Duration stays between 30 and 90 seconds and persists.
- Habit toggles change the next pause’s stack.
- Turning reminders on asks for permission. Denying it leaves the app usable.
- The completion haptic fires only when that setting is on.
