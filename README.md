# PauseGate

## Overview

PauseGate is a soft, local-first pause before you scroll. Version 1.0.0 (`package.json`, `app.json`). It is an Expo app for iOS and Android (SDK 57). The app is portrait and dark.

When you want a feed, open PauseGate first. A short timer runs — 45 seconds by default, from 30 seconds to 3 minutes — with a few small prompts. When it ends, you can still open the feed. PauseGate does not block other apps.

There is no account and no server. Pauses, prompts, streaks, and settings stay on the device with AsyncStorage (`pausegate.v1`). Optional daily reminders are on-device notifications for iOS and Android.

## Features

- Pause length from 30 seconds to 3 minutes, in 5-second steps. The default is 45 seconds. The countdown is `endsAt - now`, so it does not drift while the app is backgrounded. There is no early skip.
- Optional habit stack during the pause. Built-in prompts are Breathe 3×, Drink water, Stretch, and Open a book. Up to 8 prompts. Labels are trimmed to 48 characters. Custom prompts can be added. Built-in prompts can be renamed or turned off; only custom prompts can be removed. The next pause uses whatever is enabled.
- When the timer ends, the pause is logged. An optional note is `opened` (“I still want to scroll”) or `stayed` (“I’ll stay”). The pause counts either way. Home offers that note for 12 hours if it was skipped.
- History keeps completed pauses (up to 400 stored, 30 listed). A day counts when you finish at least one pause. The current streak runs through today, or through yesterday when today has no pause yet. Streak credit uses the moment the timer finished (`endsAt`), not the next time the app opened.
- Home shows the current streak, today’s pause count, and a Monday–Sunday week strip.
- Settings cover pause length, habit toggles, a haptic when a pause ends (on by default), and a daily reminder (off by default, 8:00 PM). Reminder time moves by one hour or 15 minutes; minutes snap to 0, 15, 30, or 45. The reminder UI is omitted on web. Notification title is “A moment before the feed”; body is “If you feel like scrolling, open PauseGate first.”
- Erase data on this device clears pauses, streaks, habits, and settings, restores defaults, and leaves onboarding complete.
- Two-step onboarding, then tabs: Pause, History, and Settings. URL scheme `pausegate`. iOS bundle identifier and Android package are `app.pausegate`. iOS `supportsTablet` is true. `npm run web` starts the Expo web target (`output` is `static` in `app.json`).

## Requirements

- [TODO: minimum Node.js version]. `package.json` does not set `engines`.
- npm, with `package-lock.json` (lockfile version 3).
- Expo SDK 57 (`expo` ~57.0.26). Expo Go needs SDK 57.
- React 19.2.3 and React Native 0.86.3, as declared in `package.json`.
- An iOS or Android device or simulator for the native app. The app is portrait and dark.
- [TODO: minimum iOS and Android OS versions]. `app.json` does not set them.

## Installation

From this directory:

```bash
npm install
npx expo start
```

Press `i` for the iOS simulator or `a` for Android.

Scripts in `package.json`:

| Script | Command |
| --- | --- |
| `npm start` | `expo start` |
| `npm run ios` | `expo start --ios` |
| `npm run android` | `expo start --android` |
| `npm run web` | `expo start --web` |

## Configuration

Project config is `app.json`:

- Name `PauseGate`, slug `pausegate`, version `1.0.0`.
- Orientation `portrait`, `userInterfaceStyle` `dark`.
- Background `#101413`. Splash background `#0C0F12`, image `assets/images/splash-icon.png`, image width 96.
- Scheme `pausegate`.
- iOS bundle identifier `app.pausegate`, `supportsTablet` true.
- Android package `app.pausegate`, adaptive icon background `#0C0F12`, `predictiveBackGestureEnabled` false.
- Web `output` `static`, favicon `assets/images/favicon.png`, background `#101413`.
- Plugins: `expo-router`, `expo-splash-screen`, `expo-notifications` (color `#7ECFC2`).
- Experiments: `typedRoutes`, `reactCompiler`.

No source file reads environment variables. `.gitignore` ignores `.env` and `.env.*` except `.env.example`. The repository has no `.env.example`.

In-app defaults in `src/lib/persist.ts`: pause 45 seconds, haptics on, reminders off, reminder time 20:00, onboarding incomplete. State is stored with AsyncStorage under `pausegate.v1` (`src/lib/types.ts`).

## Usage

1. Open the app and finish onboarding: Continue, then Begin.
2. On Pause, tap Start pause. The timer runs with the enabled prompts. Marking a prompt is optional; the timer is the gate.
3. When the timer ends, the pause is logged. Choose “I still want to scroll”, “I’ll stay”, or skip with “Not now”.
4. History shows the current streak, the longest streak, today’s count, this week, and recent pauses.
5. Settings changes pause length, prompts (Edit prompts), the daily reminder on iOS and Android, haptics, and can erase data on this device.

PauseGate does not block or close other apps. When the timer ends, opening the feed is still up to you.

## Project structure

```
app.json                 Expo config
package.json             scripts and dependencies
package-lock.json        npm lockfile
LICENSE                  MIT license
README.md
eslint.config.js         Expo flat ESLint config
tsconfig.json            strict TypeScript; @/* → src/*
assets/images/           app, splash, Android, and web icons
src/app/                 expo-router screens (onboarding, pause, complete, habits)
src/app/(tabs)/          Pause, History, Settings
src/components/          UI, mark, tab glyphs, week strip
src/hooks/use-now.ts     ticking clock while a pause or note is open
src/lib/                 pause, streaks, storage, notifications, haptics
src/state/store.tsx      in-memory store persisted with AsyncStorage
src/theme/tokens.ts      palette, space, radius
src/global.css           web root colors
__tests__/               Node tests for pause and streaks
.vscode/                 editor settings; recommends expo.vscode-expo-tools
```

### Icons

| Path | Use |
| --- | --- |
| `assets/images/icon.png` | App icon |
| `assets/images/splash-icon.png` | Splash mark on `#0C0F12` |
| `assets/images/android-icon-foreground.png` | Android adaptive foreground |
| `assets/images/android-icon-background.png` | Android adaptive background |
| `assets/images/android-icon-monochrome.png` | Android themed icon |
| `assets/images/favicon.png` | Web favicon |

## Development

```bash
npm test
```

`npm test` runs `tsx --test __tests__/streaks.test.ts __tests__/pause.test.ts` with Node’s test runner. `__tests__` is excluded from `tsconfig.json`.

```bash
npm run lint
```

Lint is `expo lint` with ESLint ^9 and `eslint-config-expo` ~57.0.2 (`eslint.config.js`, which ignores `dist/*`). TypeScript is strict (`typescript` ~6.0.3). Path aliases: `@/*` → `src/*`, `@/assets/*` → `assets/*`.

`.vscode/extensions.json` recommends `expo.vscode-expo-tools`. `.vscode/settings.json` sets explicit save actions for fix-all, organize imports, and sort members.

[TODO: continuous integration]. The repository has no workflow files.

## Contributing

[TODO: contribution guidelines]. The repository has no `CONTRIBUTING` file, issue template, or pull request template.

## License

MIT. See [LICENSE](LICENSE).
