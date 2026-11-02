# Android app and Google Play

The Android app (`com.evgenyvinnik.tensho`, the same ID as iOS) wraps the same
`--mode native` web build as the iOS app, with Capacitor 8. `android/` is the
Gradle project; `bun run build:android` rebuilds the web layer, stamps the
version and copies it in.

## Setup

1. Install Android Studio and finish its setup wizard once (Standard), which
   puts the SDK in `~/Library/Android/sdk`.
2. `bun install`, then `bun run build:android`.
3. `bun run android:open` opens the project in Android Studio; Run (▶) starts
   it in an emulator or on a phone with USB debugging.

From a terminal, Gradle needs the SDK and a JDK, both from Android Studio:

```bash
export ANDROID_HOME=~/Library/Android/sdk
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
(cd android && ./gradlew assembleDebug)   # android/app/build/outputs/apk/debug/
```

The wrapper is pinned to **Gradle 9.5.1**, between two limits: Android
Studio's bundled JDK 25 needs Gradle 9.1 or newer (Capacitor's template ships
8.14.3, which fails with "Unsupported class file major version 69"), and
Capacitor 8's Android Gradle Plugin 8.13 uses an internal API that Gradle 9.6
removed. Keep it there until Capacitor moves to AGP 9.

## What differs from iOS

| | iOS | Android |
|---|---|---|
| Version | `1.0.261102` build `261102.6` | name `1.0.261102-6`, code `26110206` (`scripts/lib/native-versions.mjs`) |
| Lock and background | `SceneDelegate.swift` sends `appinactive` / `appactive` | `MainActivity.java` sends the same events from `onPause` / `onResume` |
| Back | none | `src/native/androidBack.ts`: closes the top dialog, popover or reveal, else moves the app to the background; never router history |
| Tracking prompt | App Tracking Transparency | none (the AdMob plugin reports it authorized) |
| AdMob app ID | `GADApplicationIdentifier` in `Info.plist` | `com.google.android.gms.ads.APPLICATION_ID` in `AndroidManifest.xml` |
| Ad unit | `VITE_ADMOB_INTERSTITIAL_IOS` | `VITE_ADMOB_INTERSTITIAL_ANDROID` (both in `.env.native`) |
| Icons and splash | `Assets.xcassets` | their own Red Dragon tile (masters in `app-store/android/`): adaptive icon on `#123B32`, a themed monochrome layer (Android 13+), legacy square and round PNGs, and a 288 dp splash icon |

Android ships Google's **test** AdMob app and ad unit until both are replaced:
create an Android app in AdMob, then set its app ID in `AndroidManifest.xml`
and its interstitial unit as `VITE_ADMOB_INTERSTITIAL_ANDROID` together. A real
unit under the sample app ID serves nothing.

## Icons and splash

`android/app/src/main/res` holds the exported densities: `tensho_launcher_*`
and `tensho_splash` drawables, `ic_launcher` / `ic_launcher_round` mipmaps, and
adaptive XML for API 26 and, with the themed layer, API 33. Capacitor never
regenerates them. The masters sit in `app-store/android/`:

| File | Use |
|---|---|
| `tensho_launcher_foreground.png` | 1080 px adaptive foreground (108 dp; the tile stays in the 66 dp safe circle) |
| `tensho_launcher_background.png` | the same square in `#123B32` (`tensho_launcher_background`) |
| `tensho_launcher_monochrome.png` | alpha mask for themed icons; the system tints it |
| `tensho_android_splash.png` | 1152 px splash icon (288 dp; content inside 192 dp) |
| `tensho_google_play_512.png` | the Play listing icon; Play rounds the corners |

Android 12+ draws the splash itself from `windowSplashScreenAnimatedIcon` on
`tensho_splash_background`. Android 7–11 show `drawable/splash.xml`, the same
icon centred on the same green. Keep the transparent margins when re-exporting.

## Release build

Play needs an Android App Bundle signed with your upload key. Create the key
once and back it up outside the repo; a lost upload key needs a reset through
Play support.

```bash
keytool -genkeypair -v -keystore ~/keys/tensho-upload.jks -alias upload -keyalg RSA -keysize 4096 -validity 10000
```

Then write `android/keystore.properties` (gitignored, like `*.jks`):

```properties
storeFile=/Users/you/keys/tensho-upload.jks
storePassword=…
keyAlias=upload
keyPassword=…
```

```bash
bun run build:android
(cd android && ./gradlew bundleRelease)   # android/app/build/outputs/bundle/release/app-release.aab
```

Each upload needs a higher version code. The code comes from `package.json`,
which the release workflow bumps on every push to main, so build from a fresh
version rather than re-uploading one.

## Google Play Console

- **Account:** a one-time $25 fee and identity verification. A new *personal*
  account must run a closed test with at least 12 testers for 14 days in a row
  before it can apply for production access; organization accounts skip this.
  Start the closed test early.
- **App signing:** enrol in Play App Signing (the default) and upload the AAB
  signed with the upload key above.
- **Store listing:** title (30 characters), short description (80) and full
  description (4,000) can adapt `app-store/metadata/en-US/`. Play also needs
  a 512 × 512 icon (`app-store/android/tensho_google_play_512.png`), a
  1024 × 500 feature graphic, and phone screenshots. **Play rejects the iOS
  screenshots:** a side may be at most twice the other, and 1206 × 2622 is
  2.17 : 1. Compose a 1080 × 1920 set instead.
- **App content:** privacy policy `https://tensho.app/privacy/`; Ads: yes;
  Data safety: AdMob collects the advertising ID, approximate location from IP,
  app interactions and diagnostics, for advertising and analytics, shared with
  Google; advertising ID: used for advertising; content rating questionnaire;
  target audience (including children under 13 brings Google's Families rules
  and restricts ads).
- **Testing tracks:** internal testing (up to 100 testers, no review) is the
  fastest way to get a build onto your own phone from Play.
