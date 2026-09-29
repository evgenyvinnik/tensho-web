# Decree expiry and readable modifiers

Updated September 29, 2026. Local implementation in verification; not project completion.

## Requirements and reproduced defects

`GAME_MECHANICS.md` sections 6 and 12, and `ITEM_LIBRARIES.md`'s edition/sticker
tables, describe persistent costs, expiry, protection and edition benefits.
Players need those rules before buying and while inspecting their owned scrolls.
The existing images are retained; this change does not need another bitmap.

Five failing-first regressions reproduced:

1. Perishable timers became negative on rounds after expiry. The public save
   parser permits only nonnegative counters, so later checkpoints could fail.
2. A concealed Eternal Decree's disabled Sell button exposed its real name in
   the accessible label.
3. Owned details omitted edition effects and the actual Rental fee.
4. Owned details omitted the remaining Perishable countdown and expiry state.
5. The Decree popup ignored the app's reduced-motion setting.

## Changes

- Expired counters stop at zero; the Decree remains debuffed. No lifetime,
  acquisition probability, rental settlement or scoring rule is changed.
- Shared modifier text describes the actual offered/owned copy. Shop purchase
  controls include it in their accessible description; owned popups show the
  same rules. Zero fees and zero counters are not replaced with default values.
- Edition text reuses the existing localized catalog. Sticker names, costs,
  countdowns and expiry copy are supplied in all thirteen locales. Placeholder
  and key coverage are tested; native-speaker review is not claimed.
- Concealed popups omit modifier details and unique portraits. Disabled sale
  labels use the generic hidden name, while Eternal sale protection remains.
- Popup animation and scroll hover motion respect both system and app settings.
  Resize observation uses untransformed layout height so translations, modifier
  changes and viewport changes can reflow within the available space.
- Existing jade/gold scroll artwork, including the generated Half Suited
  portrait from the preceding release, is reused without adding download weight.
- Screenshot review found blank Russian decorative titles despite passing DOM
  assertions. A browser rasterization probe painted **0 pixels** for
  “Полумасть” with Go3v2 and **1,388 pixels** with Noto Sans JP (English Go3v2
  painted 2,704). Go3v2 is now limited to the basic Latin range, with the UI
  font as the decorative fallback. The browser regression now checks actual
  title ink, not just text presence. Post-fix browser and production checks pass.

## Verification

- Five baseline regressions failed, then all **50 focused checks** passed.
- The first strict check caught two test-fixture typing issues, subsequently
  fixed. Strict TypeScript, targeted ESLint and whitespace checks passed.
- Full regression passed **1,442/1,442 tests in 124 files** (123.79 seconds).
  A subsequent small fix suppresses the global illustration hover transform
  under reduced motion; all four detail-component regressions pass after it.
- The initial browser batch passed **46/48**. Both failures were a test that
  changed i18next without changing `/es/`; the app correctly restored Spanish
  from its authoritative route. After the fixture used a native history/route
  change, the whole batch passed **48/48** (2.2 minutes), including owned/shop
  modifiers, real round entry after expiry, reload, concealment, popup reflow,
  live motion preferences, existing exact-copy/Script actions and shop flows.
  No timeout or assertion was relaxed. The font defect above was found by
  screenshot review after this pass, so this is not final visual verification.
- The post-font full regression finished **1,439 passed / 3 timed out** in
  124 files (412.59 seconds). MenuScreen, DecreeArtwork and UpdateNotice exceeded
  their five-second deadlines while measured host load exceeded 280. This
  correlation does not prove their cause. The same three files then passed
  **6/6** unchanged in 4.82 seconds. The unsuccessful full-run report remains
  `units-final.json`; it is not relabeled green.
- The final post-font browser batch passed **48/48** in 2.4 minutes, including
  actual title-ink checks, with no retry or deadline changes. The 320×400 Russian
  title/modifier/sale screenshot was visually inspected and is readable.
- Final strict TypeScript, targeted ESLint, whitespace, **13/13 release checks**,
  and Pages-base build passed (363 modules, 274 precache entries / 68,337.60 KiB).
  Existing large-chunk/Browserslist warnings remain.
- Built-production desktop and touch checks passed real play, expired-copy
  reload, localized edition/zero-rent explanations, readable title (1,693 ink
  pixels), exact-copy sale/capacity and reload, without JavaScript errors.
- Independent CI and public deployment verification remain pending. Artifacts:
  `/tmp/tensho-decree-details-HnQj3u/`.

## Remaining requirements

This does not implement combined Rental/Eternal or Rental/Perishable stickers,
reconcile documented Sticker exclusion rules, or resolve other pending mechanics
choices. The runtime currently stores a single sticker. It does not certify all
catalog translations, physical-device accessibility, organic late-run balance,
or whether newcomers find the game enjoyable. Those are still part of the
whole-project completion audit.
