# Frostbite repeat rewards and Treasure Hunter

October 7, 2026 local / October 8 UTC — published and verified in **v1.0.261008-3**.
This closes these specific mechanics gaps, not whole-project or balance work.

## Chosen rules and actual integration

The user delegated unresolved design choices; [rule resolutions](RULE_RESOLUTION.md)
record fractional repeat rewards, stable binary/resource powers and Treasure
Hunter's win-only remaining-rack timing. Confirmed Bell, Merchant and defeat
settlement rules are unchanged.

- The scorer separates native rewards from whole Decree repeats and retains
  `0.5 ** frostbiteCount` of the added tile points, modifier Chips/Mult, gold,
  red-five chips and combined tile-multiplier gain. Do not floor repeat counts.
- Red Seal's native repeat stays whole, including face points/red-five chips
  that the old pipeline omitted. Echo Dimension/copies combine before scaling.
  Suppressed tiles contribute no repeat reward; shapes/Yaku do not repeat.
- Glass/Polychrome tile multipliers now reach the actual final score/equation;
  previously only the inner scoring result used them, and the orchestrator
  discarded them. This was a real paid-score defect, not just display polish.
- One physical tile resolves Lucky/Glass once; repeats reuse the resolved reward.
  A shatter cannot skip later repeats in the same paid score. Previews remain
  pure and show guaranteed Lucky outcomes; positive luck can exceed them.
- Frostbite leaves binary permissions, budgets, capacity, costs and rescue
  consumption unchanged. Mandate disabling still applies. The inspector now
  explains the boundary in thirteen locales and removes the old unfinished-rule
  warning. Other copied-effect lifecycle gaps are not declared complete here.
- Treasure Hunter counts distinct remaining physical suits on ordinary wins:
  three numbered suits, Winds and Dragons. Bonuses do not count; empty racks
  earn zero. Copies and disabled sources use the existing shared resolver.
  Shared Frostbite/gold-multiplier settlement performs final rounding. No income
  on skips, rescue or final defeat; Rental's defeat charge is preserved.
- Known legacy Treasure Hunter records missing the adapter's suit condition
  receive the condition on read without rewriting inventory or save bytes.
- Echo Stone's shared portrait mapping supplies shop, inventory and Archive art.

## Evidence so far

- Initial ten new engine tests: **2 passed / 8 failed**, reproducing unweakened
  repeat rewards and dropped native tile multipliers (`/tmp/tensho-echo-red.log`).
- After correction, six focused mechanics files pass **74/74**.
- Expanded batch passes **79/80**: the failed test assumed Wide Grip grants two
  spaces; its actual authored bonus is one. Corrected that fixture expectation,
  not the gameplay rule. No deadlines were changed.
- Final focused mechanics/localization pass **33/33**: twenty engine cases and
  thirteen actual-language rule renderings. The full suite passes **2,025/2,025
  in 167 files** before two additional complete-hand cases; all **22/22** engine
  cases then pass. TypeScript, Pages-base build, lint (zero errors, 211 existing
  warnings) and thirteen release checks pass.
- New browser fixture uses a Bonus/Polychrome/Gold-sealed tile with Echo Stone
  under one Frostbite. Its tactical sequence forecasts/pays 173, grants four
  tile gold, and leaves five physical suits for 2.5 raw Decree gold at the win.
  This is a controlled integration fixture, not organic acquisition or balance.
- Native English/Spanish desktop and 320px touch journeys pass **4/4** without
  retries or longer deadlines: Echo portrait decode, read-only translated
  inspectors, exact 173 payment, four tile gold, 2.5 Decree gold, five held suits
  and saved shop-state reload. The Spanish inspector screenshot was inspected:
  text remains accessible by scrolling, though the narrow layout is verbose.
  Evidence folder: `/tmp/tensho-echo-evidence-4bzDfi`.
- Final full regression passes **2,027/2,027 in 167 files**. Final description
  wording and fixture-isolation cleanup also pass a targeted **35/35**. Final
  Pages-base build and targeted lint pass. Built-production replay passes
  **4/4**, no retries, with the same exact payments/persistence as native.

## Artwork provenance

Mode: built-in image generation with the imagegen skill. The tool does not expose
an exact model selector; no specific/latest model ID was verified. Output was
visually inspected, then converted with `cwebp -q 85 -resize 512 512`, preserving
alpha and leaving the original intact.

- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-4d9b0e73-e8f1-47ba-a2c8-a9badde999dd.png`.
- Workspace: `public/assets/illustrations/decrees/echo-stone.webp`, 512×512 with
  alpha, 64,738 bytes.
- SHA-256: `08800fa214a515174ea45a819dd5ee9d040e5e2cdb0faf6d540b93710c14ca18`.

Exact prompt:

```text
Use case: stylized-concept
Asset type: transparent illustrated inventory portrait for Echo Stone, a retrigger Decree in Tensho mahjong roguelike.
Primary request: one upright unfurled ivory parchment scroll with deep jade rollers and antique-gold end caps. Its central painted emblem is a luminous carved jade resonance stone, surrounded by two concentric gilded echo rings, with a single ivory mahjong tile and a smaller translucent echo of that tile behind it. No written symbols on the tile.
Style/medium: refined hand-painted East Asian fantasy game inventory illustration; tactile jade, aged ivory parchment, restrained gold engraving, navy fabric trim, tiny red wax seal; polished compact silhouette readable at 64 pixels.
Composition/framing: centered square, entire upright scroll and tassels visible with generous transparent margins. Object fills about 80 percent of the canvas.
Constraints: genuinely transparent background; isolated object; no scene, floor, cast shadow, letters, numbers, text, watermark or UI frame.
```

## Published verification

- Implementation: `241a1108b5cc10765b07ea0f5a14addd4cc3ff6a` on `main`.
- Version commit / fetched tag / public manifest:
  `40730549723de06c9770cbfa9cae5220f1f5242b`, `v1.0.261008-3`.
- [Release workflow 37712009351](https://github.com/evgenyvinnik/tensho-web/actions/runs/37712009351)
  succeeds without retry: build `113099820528`, deploy `113100608873`.
  Independent CI passes **2,027/2,027 tests in 167 files**, thirteen release
  checks and the production build. Existing action/runner migration annotations
  remain warnings, not failed deployment steps.
- Hosted EN/ES desktop and 320px touch journeys pass **4/4** without retries or
  longer deadlines, matching the native and built-production batches. Real
  controls verify illustrated/translated inspectors, forecast/payment, tile gold,
  win settlement and exact saved shop-state reload. These are controlled fixtures,
  not proof of organic acquisition, physical-device behavior or player enjoyment.
- Hosted entry `/tensho-web/assets/index-BDpXwoeh.js` contains the matching
  runtime version; public manifest/tag agree. The hosted Echo Stone checksum
  matches the workspace SHA-256 above.
- Reports, screenshots, initial failed tests, CI output and provenance are in
  `/tmp/tensho-echo-evidence-4bzDfi`. Both owned fixture servers are stopped;
  the pre-existing 4173 server was not touched.

## Remaining project work

Other item reconciliation, copied-effect lifecycles, Fate Seal/Negative lifetime,
layout, organic balance and newcomer fun evaluation remain project requirements.
The small-screen Season inspector remains verbose and scrollable; automated
no-overflow checks are not a claim of perfect layout or native-language review.
