# App Store listing

Store copy and artwork for the iOS app (`com.evgenyvinnik.tensho`). The app is
iPhone-only and portrait-only (`TARGETED_DEVICE_FAMILY = 1`), so App Store
Connect needs iPhone screenshots only, with no iPad set.

## Contents

| Path | Use |
|------|-----|
| `metadata/en-US/*.txt` | One file per App Store Connect field: name, subtitle, promotional text, keywords, description. The file names follow `fastlane deliver`. |
| `screenshots/en-US/iphone-1320x2868-*.png` | The 6.9" iPhone set. |
| `screenshots/en-US/iphone-1206x2622-*.png` | The 6.3" iPhone set. |
| `art/app-icon-1024.png` | The icon master. It is already installed as `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`. |
| `art/store-background.png` | The jade-and-gold background behind the screenshot headlines. |
| `captures/` | The simulator captures shown inside each screenshot. |

The store icon comes from the uploaded build, not from a separate upload, so
the new icon goes live with the next archive.

## Screenshots

| # | Headline | Subline | Capture |
|---|----------|---------|---------|
| 1 | Build your hand. / Find your edge. | A fresh take on mahjong strategy | `01-full-house.png`: a Full House selected, 325 × 17 = 5,525 |
| 2 | Shape your run. / Choose your path. | Pick upgrades for your next challenge | `02-tea-house.png`: the Tea House after Round 1 |
| 3 | Bend the rules. / Build your strategy. | Discover powerful Decree combinations | `03-decree-details.png`: Simples Dispensation's details |
| 4 | Learn the patterns. / Find your own way. | Explore the in-game Codex | `04-codex-sequences.png`: Codex, Hand Building, Sequences |

The captures come from ordinary play in the iOS app on the iPhone 17 Pro
simulator (1206 × 2622), with the status bar fixed at 09:41 and full battery.
They were taken on 30 October 2026, so if any of these screens change before
you submit, capture that screen again with:

```bash
xcrun simctl io booted screenshot --type=png app-store/captures/<name>.png
```

Then rebuild both sets. This needs ImageMagick 7 (`magick`):

```bash
node scripts/compose-store-screenshots.mjs
```

The headlines and sublines live in that script.

## Still to fill in App Store Connect

- **Privacy Policy URL:** `public/privacy/` serves it at
  `https://evgenyvinnik.github.io/tensho-web/privacy/` once deployed.
- **Support URL:** use a page with real contact details. The privacy policy
  points to `https://github.com/evgenyvinnik/tensho-web/issues`.
- **App Privacy:** declare the data Google AdMob collects (device ID for
  advertising, usage and diagnostics). Local saves alone don't make the app
  "no data collected".
- **Copyright, age rating, review notes and contact:** the copy doesn't fill
  these in.
- **Name:** check that "Tensho: Mahjong Roguelike" is still free when you create
  the app record.
