# PauseGate

A soft, local-first pause before you scroll.

When you want a feed, open PauseGate first. A short timer runs — 45 seconds by default, from 30 seconds to 3 minutes — with a few small prompts. When it ends, you can still open the feed. PauseGate does not block other apps.

There is no account and no server. Pauses, prompts, streaks, and settings stay on the device with AsyncStorage (`pausegate.v1`). Optional daily reminders are on-device notifications for iOS and Android.

## Run

Expo app for iOS and Android (SDK 57). From this directory:

```bash
npm install
npx expo start
```

Press `i` for the iOS simulator or `a` for Android. Expo Go needs SDK 57. The app is portrait and dark.

## Tests

```bash
npm test
```

## Icons

| Path | Use |
| --- | --- |
| `assets/images/icon.png` | App icon |
| `assets/images/splash-icon.png` | Splash mark on `#0C0F12` |
| `assets/images/android-icon-foreground.png` | Android adaptive foreground |
| `assets/images/android-icon-background.png` | Android adaptive background |
| `assets/images/android-icon-monochrome.png` | Android themed icon |
| `assets/images/favicon.png` | Web favicon |

## License

MIT. See [LICENSE](LICENSE).
