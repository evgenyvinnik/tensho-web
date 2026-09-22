# Double Omen: earned copies and visible pending rewards

September 22, 2026. This implements one documented feature; it is not a
whole-project completion or deployment claim.

## Rule and implementation

`ITEM_LIBRARIES.md` lists Double Omen as copying the next selected Tag. The live
catalog lacked it. Its dormant store branch created a duplicate, then overwrote
that duplicate with a second update based on stale state.

Double Omen now appears as a Rare reward in both Small and Large skip pools.
It remains an active, visible tag until the next non-Double reward. Consecutive
Doubles bank one copy each; they do not recursively duplicate each other.
This explicit non-recursive interpretation is described in the item text.
It is not a change to the separate, unapproved Season/Decree proposals.

Acquisition atomically removes the armed copies and adds the original reward
plus distinct copied instances to active and delayed queues. History records
each spent Double and each subsequently consumed reward once. Invalid or locked
store acquisitions preserve the copy. New-run reset clears it. A legacy
flag-only state still grants one copy without inventing a historical instance.

Immediate gold, skip-scaled gold, slot and interest-cap rewards count acquired
instances; immediate rewards are consumed together. Existing round, next-hand,
shop and Script consumers process separate instances. Script protection covers
separate uses; impossible shop guarantees remain pending with their costs.
Copies preserve tradeoffs: two Rare+ guarantees incur two five-gold shop fees.
Next-Season locks and next-round no-interest restrictions retain their existing
idempotent timing; duplication does not extend them into additional rounds.

## UI and localization

Pending Omens now have an optional, initially closed native disclosure on the
game screen. It has no timer, overlay or automatic focus change and does not
require hovering. Names/descriptions use the item-localization helper. Double
Omen and the disclosure label have text in all thirteen locales. Other legacy
Omen translations may still fall back to English; native-speaker review remains
open. The new image appears while copies are armed and in the discovered Archive
card/detail; undiscovered cards retain their existing hidden presentation.

## Artwork

The image-generation skill guided the paired silhouette, established jade/gold
palette, transparent output and separate localized rule text.

- Built-in image generation; no CLI fallback or API key.
- The tool exposes no model selector or model ID. A named/latest model cannot be guaranteed.
- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-173b134f-8564-42d2-97a2-d4cff0ebca23.png`.
- Project: `public/assets/illustrations/omens/double-omen.png`.
- Copied unchanged: 1254×1254, alpha present, 1,255,164 bytes.
- SHA-256: `781ef59bf64edef8d005ab3a2136e3a6643d15ec0708f65c7e25e8f635dd69e0`.
- Generated output visually reviewed; rendered-UI checks are recorded below.

Exact prompt:

> Use case: stylized-concept. Asset type: miniature painted item illustration for Tensho, a mahjong roguelike. Create a new Double Omen emblem: two matching jade-green lacquer fortune tags, one slightly behind the other, with antique-gold rims and matching simple raised circular motifs, joined by a short emerald silk knot and tiny gold tassels. Premium hand-painted board-game inventory art, tactile aged gold and translucent jade, warm ivory highlights, restrained emerald and gold palette. Center the entire pair on a square canvas with generous transparent margins and a bold silhouette recognizable at 40 pixels. Slight elevated three-quarter view. Genuinely transparent alpha background. No scenery, paper scroll, coins, characters, hands, numbers, letters, writing, logos, watermark, white background or checkerboard. Keep both tags distinct; the image should suggest one object mirrored into a second, not a single shield.

## Verification ledger

The initial nine tests reproduced **8 failures / 1 pass**. After implementation,
all nine passed. The first surrounding set retained three old seed-expectation
failures: adding a weighted reward changes the selected catalog entries.
The expanded set then passed **67/68**: seed 32 also earned a Seal before Rare+,
so the test incorrectly treated its first shop offer as the Decree. The final
fixture uses seed 73 (Precision then Rare+), preserving the original first-offer
and fee assertions. Abundance uses seed 16 and Precision uses seed 24.

Fourteen engine cases now include real seeded game skips for copied Rivers,
Speed and Rare+ rewards, plus isolated duplication, deferred delivery, sequential
protection, preview/consumption and interest duration. Thirteen component cases
cover localized Double text, initially closed disclosure, live copied queues and
empty-state removal. Full regression passed **1049/1049 in 95 files**, 120.97
seconds. Strict TypeScript and targeted lint passed.

The first browser set finished **12/14**, 141.76 seconds: one English startup
readiness timeout and one new fixture that read the fee immediately after URL
navigation, before the ShopScreen effect opened the visit. The fixture now waits
for the authoritative shop-open state before checking both fees and offers, and
also purchases both copied Decrees and checks ownership/currency. No gameplay
code or test deadline changed to address those observations.

The second set finished **12/14**, 345.06 seconds. The earlier startup check and
shop assertion passed, but the existing desktop stacked-shop scenario and the
new Spanish touch purchase scenario exceeded their original 30-second deadlines.
Their traces reached final revisit/readback and both purchases respectively;
timeout causes remain unproven. Each passed three unchanged isolated repetitions:
**3/3 touch purchases** in 26.54 seconds and **3/3 stacked shops** in 18.1 seconds.
This does not retroactively make either broad browser run a pass.

Spanish desktop and 320×568 touch screenshots were reviewed: illustration
decoded, full description wrapped within the optional disclosure, and no automatic
opening was introduced. The eight new journeys use actual seeded skip acquisition
and real gold/shop transactions. Boss winning tiles and starting gold are controlled
fixtures, not proof of organic progression, balance or human enjoyment. Existing
four acquisition and two stacked-shop journeys remain covered.

Artifacts: `/tmp/tensho-double-w59DT3/{browser,final-browser,mobile-repeat,shop-repeat}.json`
and corresponding directories. The owned server was stopped after verification.
The Pages-base production build completed, including offline-cache generation:
342 modules, entry `index-Bmd6daKf.js`, 268 precache entries / 63,921.39 KiB.
The new source asset and built copy have identical SHA-256 hashes. Large-chunk
and stale Browserslist warnings remain; the added illustration increases the
offline payload by about 1.2 MiB. This is not a deployment or PWA-upgrade check.

Remaining work includes the other unapproved mechanics choices, legacy Omen and
pack-skip catalog discrepancies, fuller tradeoff disclosure, native-speaker and
device review, real newcomer playtesting, main/default promotion and hosted/PWA
upgrade verification. Passing these tests does not close that broader scope.

No new commit, merge, push or deployment has been performed in this checkpoint.
The workspace was clean at its start on `table-loop-prototype`, commit
`bae2f71` (“Intermediate progress”). Earlier checkpoint statements about
uncommitted files describe their historical state, not the current baseline.
