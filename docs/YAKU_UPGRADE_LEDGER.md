# Illustrated run-wide Yaku upgrade ledger

October 6, 2026 local work date. This closes a progression-visibility gap, not
the whole implementation or the pending Orb-leveling design conflict.

## Runtime behavior

The engine already stores Yaku levels and scored-occurrence counts. Players
could use an Orb but had no gameplay-facing view of its persistent upgrade.
`GameOrchestrator.getYakuUpgradeState()` now supplies a detached, read-only list
from the same `CelestialOrbSystem` bonus calculations used by scoring.

- Only upgraded families appear; an Orb held in inventory is not an upgrade.
  Level 1 contributes no Orb bonus. Black Hole upgrades produce twelve real
  family entries, not a thirteenth invented “All” scoring family.
- The optional ledger is available in gameplay and the Tea House. It displays
  current level, base-point/Mult additions and actual scored occurrences.
  Occurrences are not advertised as distinct hands: a family can score more
  than once in a hand.
- Opening, scrolling, explaining and closing do not select tiles, spend
  resources, reveal concealed identities, change RNG or advance the counters.
  Existing staged tiles survive. The shared native dialog handles focus return,
  keyboard dismissal, touch and reduced motion.
- At 320px, the first actual upgrade card fits without scrolling through an
  introduction. The generated header illustration is compact; explanatory
  prose is an optional disclosure after the numbers. Longer lists scroll within
  the ornamental frame. All thirteen locales have the new copy; existing
  translated Yaku names and localized number formatting are reused.
- These are base Orb additions, not a promise of a final score. The explanation
  directs players to the real forecast for the total after other rules.

The panel reports current runtime semantics without changing them. The item
library describes permanent per-level upgrades, while `GAME_SYSTEMS.md` says
attuned Yaku should grow through scoring. The user has been asked which rule
should be authoritative; no unanswered selection is treated as consent.

## Verification

Evidence: `/tmp/tensho-yaku-ledger-OEz1Hu`.

- Three engine checks cover actual Orb use, inventory-versus-upgrade state,
  twelve-family Black Hole upgrades, detached results, non-mutating forecasts,
  real complete-hand scoring, strict save/restore and new-run reset.
- Fourteen component checks cover optional opening, empty/live state, artwork,
  focus return and all thirteen localized number/name surfaces. Locale tests
  require owned keys and matching placeholders; asset tests require a compact
  512px WebP with alpha.
- The initial focused run passed 81/84. Two failures came from a matcher
  normalizing French/Russian nonbreaking separators; checking raw text preserves
  the exact numeric assertion. The third incorrectly rejected Indonesian
  “Level” for matching English. Own-key/placeholder checks remain for every
  field, with distinct-language checks on explanatory prose. Final focused
  runs pass **84/84** before and after the layout follow-up.
- An early engine-test draft called a nonexistent Orb factory. That fixture was
  corrected; its two failures are not represented as two reproduced game bugs.
  TypeScript also caught readonly fixture assignments and an unsupported
  `Object.hasOwn` target; the test uses the typed mutable fixture and the
  existing compatible own-property check.
- Full unit regression passed **1,747/1,747 in 149 files** before the compact
  layout follow-up. The affected 84 checks pass afterward. Final TypeScript,
  Pages-base production/PWA build, lint (zero errors, 211 existing warnings)
  and all **13 release-workflow checks** pass.
- The initial native browser batch passed 12/12. Screenshot review nevertheless
  found that prose/art pushed the numbers below the phone fold. The layout was
  corrected and a first-card-within-scroll-viewport assertion added.
- The next batch passed 11/12, retaining one overall deadline failure. Its
  three-repeat recheck passed 1/3: one failure occurred during browser-context
  teardown after the assertion body completed, another exceeded the overall
  deadline. No deadline or assertion was relaxed. Final unchanged native batch
  passes **12/12**, one worker, no retries, with no concurrent build/unit jobs.
  Earlier logs/traces remain in `browser-layout` and `browser-recheck`.
- All **12 built-production journeys** pass from persisted fixtures, without
  development imports: single/Black Hole upgrades × English/Spanish/Russian ×
  desktop/320px touch. They verify image decoding, actual UI use, read-only
  inspection/explanation while fourteen tiles are staged, forecast/payment,
  scored counts, shop inspection, exact reload, next-round retention, focus
  return, first-card visibility, no horizontal overflow and no page errors.
  Final English and Russian phone screenshots were visually inspected.

Controlled Orb grants, deals and targets establish these boundaries, not organic
acquisition, balance, native-speaker certification or human enjoyment. Publication
verification is pending.

## Generated artwork

Workspace asset: `public/assets/illustrations/yaku-ledger.webp`, 512×512 with
alpha, 40,904 bytes. SHA-256:
`f4370407923e39dae5ebe17f842a02d071da2f1314fad01df0d897e0f858c7b1`.

The imagegen skill guided a new transparent-background generation using the
built-in image tool, followed by mechanical `cwebp -q 85 -resize 512 512`
conversion. The tool exposed no model-version selector or verified model ID;
this record does not claim a specific “latest” model. Original preserved at:
`/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-9c3f12e0-7e77-43b3-8528-08762b368709.png`.

Exact prompt:

> Use case: stylized-concept. Asset type: small illustrated Yaku upgrade ledger for Tensho, an East Asian mahjong fantasy board game. Primary request: a single open ivory parchment folio with a dark forest-green cover and aged-gold corners, showing a simple constellation of luminous jade and pale-blue stars connected by delicate gold lines across its open pages. Premium hand-painted game-object illustration, gently worn paper and lacquer, warm restrained highlights. Three-quarter overhead view, complete centered object with generous transparent padding; bold silhouette readable at 48px, square composition. Genuine transparent alpha background. No readable text, letters, numerals, calligraphy, badges, labels, UI, scene, table, ground, people, extra loose objects, logo or watermark.
