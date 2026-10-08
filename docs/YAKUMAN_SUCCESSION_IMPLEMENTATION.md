# Yakuman Succession

October 7, 2026 — local implementation, not published. The live site remains
at the preceding Flower catalyst release, v1.0.261008-1.

## Rule and integration

The delegated [decision record](RULE_RESOLUTION.md#yakuman-succession-advanced-patterns-ascend-while-two-flowers-are-held)
specifies the distinct 12G mythic Decree. Two held Flowers permit the five native
advanced patterns to ascend to tier-four Yakuman at base ×4: Honitsu, Chinitsu,
Ryanpeikou, Junchan and Seven Pairs. Existing detection/exclusion rules still apply.

- Eligibility uses actual held Flowers at scoring time, including copied effects.
  Consumption below two suspends the power; recollection restores it. Drought
  does not erase the ownership condition. Disabled sources do not grant it.
- Mandate filtering and lowering happen before eligibility. Nexus cannot turn
  basic patterns into ascension candidates. Copies do not stack this permission.
- The actual detector's pattern IDs and Orb families are retained. Canonical
  definitions are never mutated. Forecast and payment share the same calculation.
- The new classification qualifies for Yakuman-gated Decrees and paid Yakuman
  events. Natural Yakuman retain existing behavior. Table Yakuman bonuses apply
  to ascensions; Frostbite scales the Decree-created numeric gain, not the
  discrete identity. Existing unrelated amplification remains composable.
- The shared shop/pack/generated candidate pools include the new item. Ordinary
  acquisition requires two Flowers; optional Flower payment requires three
  beforehand so two remain. This is not an additional activation sacrifice.
- Inventory, shop and Archive reuse the shared portrait mapping. All thirteen
  locales have an authored item description and optional ascension badge.
  Gameplay now subscribes to paid Yakuman events for the existing tier-four
  reveal; those events carry the actual base Yaku multiplier.

## Evidence and corrections

- Initial integration mistakenly imported the legacy YakuDefinition catalog,
  rather than the active YakuDetector types/IDs. TypeScript and an existing
  gate test caught it. Corrected imports use the actual runtime registry;
  this was not evidence that the old runtime's Yakuman IDs were broken.
- The first broad focused batch passed 130/131 before that registry correction.
  The subsequent expanded batch passed 107/109: a Ryanpeikou fixture also formed
  Seven Pairs (which the current parser prefers), and another tried mutating
  frozen table modifiers. Use overlapping duplicate sequences for the former
  and an actual Dragon's Den run for the latter. Do not alter scoring or unfreeze
  rules to accommodate a bad fixture.
- Corrected focused mechanics/localization batch passes **30/30**: seventeen
  engine tests and thirteen locale rendering cases. Earlier expanded output
  also passes all 45 Decree mechanics, 18 secondary scoring and 16 catalyst
  cases. TypeScript passes after the active-registry/signature corrections.
- Tests cover real detection/payment/events for all five patterns, thresholds,
  sacrifice/recovery, Drought, disabled copies, two Frostbite stack sizes, The
  Arm, no promotion from lower tiers, zero-resale catalyst acquisition, exact
  save/reload, unchanged pattern IDs and table Yakuman bonuses.
- Initial native browser attempt was explicitly interrupted to correct a known
  test selector: inventory descriptions are outside-dismissed popovers, not
  modals with Close buttons. The next batch passed 0/4: one initial-save deadline
  and three incorrect assertions that staging would leave the saved selection
  empty. Corrected the assertion to permit exactly the chosen IDs and no other
  state changes; selections intentionally persist.
- Corrected native batch still passes **0/4**, with three overall 30-second
  deadlines and one five-second initial-save deadline. No retries or deadline
  changes. The host was heavily loaded (observed load averages above 100);
  this does not substitute for a successful isolated/built-site recheck.
- The Spanish 320px inventory screenshot was inspected: portrait, full rule,
  rarity and sale control fit within the popover. This is layout evidence, not
  a passing complete browser journey. Localized ascension badges were reached
  in the earlier three selection-assertion failures.
- The first full two-worker suite finished **1,965/1,988** in 165 files:
  23 failures in 18 files, all deadline failures (including a child-process
  timeout in the balance matrix). These are not a passing regression run.
- After the host load dropped, the Pages-base production replay passes **4/4**
  without retries or deadline changes: English/Spanish, desktop/320px touch.
  It verifies portrait decoding and complete rule text, read-only inspection,
  staged selection-only changes, the ascended badge, exact forecast/payment,
  reload and next-round persistence. This is a controlled fixture, not organic
  acquisition or a balance claim. Evidence: `/tmp/tensho-succession-evidence-PDnPNK`.
- Added three engine interaction cases: exact original Orb-family paid counters,
  combined Succession/Nexus/Amplifier under Frostbite, and unchanged natural
  Kokushi identity/multiplier/event payload. All **20/20** engine cases pass.
- Pages-base production build passes. Lint has zero errors and 211 existing
  warnings; all thirteen release-workflow checks pass. Final TypeScript passes.
- All 18 previously failing files pass unchanged on isolated recheck:
  **152/152**, with original deadlines. The fresh native desktop/touch batch
  passes **4/4**, with no retries. Its fixture is created through the live app
  singleton and captured as a validated save for production/hosted replay.
  The fresh full regression passes **1,991/1,991 in 165 files**, with the
  original deadlines and two workers. Earlier failures remain recorded above.
- Logs/reports: `/tmp/tensho-succession-first.log`, `...-expanded.log`,
  `...-focused-final.log`, `...-tsc.log`, `...-full.log`, `...-native.json`,
  `...-native-final.json`, `...-native-corrected.json`.

## Artwork

Mode: built-in image generation with the imagegen skill. The tool exposes no
exact model selector, so the exact/latest model ID is not verified. The output
was visually inspected and converted with `cwebp -q 85 -resize 512 512`, preserving
alpha and the original source.

- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-e07e8acd-2dd2-4ffb-b423-d53c4a2c0293.png`.
- Workspace: `public/assets/illustrations/decrees/yakuman-succession.webp`,
  512×512 with alpha, 63,610 bytes.
- SHA-256: `4987b7f25fe2495ad1cc1ec09859b9f2425b026062a0ba1f4ddbb6ee0edcf674`.

Exact prompt:

```text
Use case: stylized-concept
Asset type: transparent inventory portrait for Yakuman Succession, a mythic Decree in Tensho mahjong roguelike.
Primary request: a single ornate jade-and-antique-gold ceremonial seal with a rising golden dragon carved around an ascending stepped jade pedestal; two small botanical blossoms, one ivory orchid and one red plum, integrated symmetrically at its base to signify the two-Flower requirement.
Style/medium: finely hand-painted fantasy inventory illustration, tactile aged jade, engraved antique gold, restrained warm highlights, deep forest green shadows, matching a refined East Asian illustrated mahjong game.
Composition/framing: centered square canvas, complete object visible with 8 percent transparent padding, strong compact silhouette readable at 64 pixels.
Constraints: genuinely transparent background, isolated artifact, no scene, no frame, no lettering, no numbers, no watermark, no glow cloud, no background cast shadow.
```

## Still required

Independent release CI and hosted
verification remain before publication. Full Frostbite semantics, other item reconciliation and organic
balance/newcomer evaluation retain their scope; this is not project completion.
