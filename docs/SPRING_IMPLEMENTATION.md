# Spring rack expansion

October 7, 2026. Implemented locally; final verification/publication pending.

## Chosen rule

Under the user's [delegated rules authority](RULE_RESOLUTION.md), Spring's old
“+2 draws per hand” draft is resolved as **two additional rack spaces per normal
Spring for the current round**, not two extra scoring actions or endlessly
accumulating tiles. New spaces are filled from the live wall when Spring is
drawn, subject to available tiles. Ordinary post-play/discard refills maintain
the expanded capacity. Repeated Springs add two each; corrupted Spring
(Monsoon) retains only its corruption effect.

This creates a bounded selection advantage and more room to assemble a hand,
without another modal, resource button, automatic play or permanent wall change.
The [expanded-rack declaration](COMPLETE_HAND_SUBSETS.md) already lets a player
stage a legal complete subset while retaining spare tiles.

## Actual loop

- Starting deals evaluate their capacity as Seasons arrive. Ordinary refill
  loops also reevaluate the target instead of caching the pre-Spring size.
- Explicit draw, redraw and Serpent cycles fill only newly created spaces, not
  unrelated holes in the rack. Redraw draws the bonus before returning selected
  tiles to circulation, so the returned tile cannot immediately draw itself.
- Each cycle settles its Mandate once after all its draws. Bell still retains
  one latest lock; bonus filling does not trigger a second Hook/Bell cycle.
  Redraw announces each new physical tile once.
- Serpent retains its three normal replacements on subsequent plays/discards;
  the Spring expansion is granted once when that Spring activates, not every
  Serpent cycle. Fixed draw count and rack capacity are distinct rules.
- Short/exhausted walls do not manufacture tiles. The held rack is not erased
  when a bonus cannot fill. Clearing Seasons at the round boundary removes the
  capacity bonus; it is not a permanent Charter or Script modifier.
- Saves need no new field: the existing Season stack determines capacity. Old
  saves retain their exact held tiles on restore; subsequent ordinary refills
  use the newly connected capacity. No reward is granted merely by loading.

The inspector and shared tile descriptions now state the connected rule in all
13 languages. Normal Spring details use a compact generated blossom; compact
track tiles and corrupted Spring keep the established Mahjong artwork. Rules
remain real localized text outside the image. Native-speaker review is separate.
Orchid/Spring's extra Honor-draw interaction remains to implement; this does not
declare every Flower/Season rule complete.

## Verification so far

Evidence directory: `/tmp/tensho-drought-S5F1Fz`.

The initial combined engine run passed **45/45**: ten new Spring cases plus
Monsoon, Summer and Drought regressions. Spring cases exercise actual draw,
discard, redraw and play; replacement-chain stacking; stable subsequent rack
size; exact save/restore; exhausted walls; corrupted Spring; Bell; Serpent; and
round expiry. Availability checks preserve the exact snapshot. They use
controlled deals, not claims about natural Season frequency or player enjoyment.
The combined native browser run passes **16/16** with no retries: Drought and
Spring, English/Spanish, desktop and 320×568 touch. Spring cases use one or two
real Season draws through redraw, inspect localized rules and decoded artwork,
confirm exact score payment, and compare complete saved snapshots after reload.
The 320px Spanish inspector screenshot was visually checked: content stays in
the scrollable panel without horizontal clipping. Controlled saved deals are
not organic acquisition or usability research.

The initial full suite was not green: 1,565 tests passed, five failed and 18
workers failed to start under severe host load. Failures included two legacy
fixed-rack expectations, two new portal-artwork assertions and an existing hint
animation deadline. The portal assertions were corrected to inspect the actual
dialog; starting-deal assertions now count normal Springs independently and
retain the expected base table/Manacle sizes. A first edit used the wrong test
property (`variant` instead of `type`); that test-only typo was corrected too.
No runtime feature was disabled and no deadline was increased to obtain a pass.
The next full suite completed all **1,772 tests**: **1,770 passed**, with only
the two already-corrected `variant` test assertions failing. The corrected
starting-deal/GameOrchestrator files pass **85/85**; no runtime source changed
after that complete run began. TypeScript and the Pages-base production build
pass; lint has zero errors and 211 existing warnings, and all **13** release
workflow checks pass. Built-production replay passes **16/16**, restoring the
native fixtures through normal persistence without source imports. The initial
preview launch omitted the Pages base path and failed its first save-indicator
check; setting the preview's matching `/tensho-web/` base corrected that harness
error. No application change or timeout extension was needed. Independent
release CI and hosted verification remain pending.

## Generated artwork

The imagegen skill guided a new transparent illustration with the built-in image
tool. No model-version selector or verified model ID was exposed, so this does
not claim a specific latest model. Mechanical `cwebp -q 85 -resize 512 512`
conversion preserved alpha. Final asset:

- `public/assets/illustrations/spring-blossom.webp`, 512×512, 60,002 bytes.
- SHA-256: `11f4090a8f238a37e785dab8108f44db33e750834c357f31c7b9920bb1a2fb4c`.
- Original retained at `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-427a2839-910d-4d81-907b-876627b01e8c.png`.

Exact prompt:

> Use case: stylized-concept. Asset type: compact Spring-season illustration for Tensho, an East Asian mahjong fantasy game. Primary request: a miniature dark-jade lacquer planter holding an elegant budding branch with a few pale ivory and soft pink blossoms and fresh green shoots; a restrained aged-gold rim and warm hand-painted highlights. Premium painterly game-object illustration with worn lacquer and delicate botanical detail, matching a forest-green, antique-gold and ivory game palette. Three-quarter view, complete centered object, bold readable silhouette at 64 pixels, generous transparent padding, square composition. Genuine transparent alpha background. No text, numerals, characters, calligraphy, labels, UI, people, mahjong faces, tabletop, background scene, logo or watermark.
