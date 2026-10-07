# Autumn: additional discard actions

October 7, 2026. Implemented locally; publication verification pending.

## Resolved rule

Under the user's [delegated authority](RULE_RESOLUTION.md), the ambiguous
“discard pool grows” draft is resolved as **one extra discard action when each
normal Autumn is drawn**, usable only in that round. The existing +20% Yaku
modifier is preserved. Repeated Autumns add one action each. This replaces the
unused `getDiscardPoolModifier()` helper's unconnected ×1.2 calculation with
an integer action grant, rather than silently rounding a percentage or creating
physical duplicate tiles in the river. The larger budget lets players reject
more unwanted tiles while still paying for each discard.

This decision is separate from **Plum/Autumn river recursion**, which remains
unfinished; it does not redefine that interaction as extra discard actions.

## Connected behavior

- The authoritative bonus-draw path grants only the increase in the normal
  Autumn stack. Starting deals, explicit draws, discard replacement, redraw,
  post-play refill and bonus-replacement chains share the same path.
- Availability checks do not collect the Season, consume an Omen lock, change
  RNG or grant actions. An Omen changing the Season changes the granted effect.
  Corrupted Autumn (Decay) gives no normal Autumn grant.
- A spent action is not erased from Decree scoring when a new action is granted.
  The scoring allowance includes round/Omen/Decree/Autumn resources, rather than
  comparing the current counter only with the original base of three. Recycler
  still counts the expenditure and Waste Not does not regain its condition.
- The extra action is usable after the original budget reaches zero. It spends
  normally, refills the rack and triggers ordinary discard effects. The grant
  itself is not a discard: it does not earn River Tax or increase Decay.
- Exhausted replacement walls do not invent tiles or revoke an already drawn
  Season. Draw cycles still settle their Mandate once.
- Round cleanup clears the stack; the next round resets its own resource budget.
  No save field, random stream or new action/button is added. Existing saved
  counters restore exactly; loading does not retroactively grant actions.
- All thirteen locales describe the actual grant, and Autumn's optional details
  use a generated maple illustration. The compact track and corrupted Autumn
  retain the Mahjong tile artwork. Native-speaker review is separate.

## Verification ledger

Evidence directory: `/tmp/tensho-autumn-wziwOp`.

- Initial focused run: **84/86**. Two new test assumptions were wrong: a raw
  +20 Chips contribution was compared with final points after Autumn scaling,
  and seeds 1–20 happened to have no starting Autumn. A follow-up assertion
  used a nonexistent equation field. Final tests use the public additive bonus
  and 100 natural starting seeds, retaining the explicit nonzero-Autumn check.
  These test failures are not claimed as runtime defect reproductions.
- Thirteen new engine tests cover four real action paths, read-only preflight,
  chained stacks, exhaustion, exact strict save/restore, corrupted draws, Omen
  locks, round expiry, Recycler/Waste Not and naturally dealt Autumns.
- First full suite: **1,783 passed / 6 failed**. Six existing copied-resource
  tests assumed a fixed budget despite a naturally drawn Autumn. Their updated
  assertions retain the expected Decree resources and independently count normal
  Autumns. Corrected full suite: **1,789/1,789 across 153 files**.
- Initial native browser run: **8/8**, English/Spanish, desktop/320×568 touch,
  one/two Autumns. Real pointer/touch drags spend the earned actions, exhausted
  drags preserve the snapshot, forecasts match payouts, and Skip expires the
  Season. Inspector/reload checks preserve full snapshots. Fixture setup is
  controlled, not an organic acquisition-frequency claim.
- Screenshot review prompted shorter all-locale descriptions so the first
  Autumn card fits fully on a 320px phone (Spanish screenshot reviewed). Final
  copy/unit recheck: **84/85**, one inspector test exceeded five seconds; unchanged
  inspector recheck passes **11/11**. Final native batch: **7/8**; the first
  desktop case reached next-round checks before its overall 30-second deadline.
  Its isolated repeat also exceeded that deadline under rising host load.
  Both traces are retained; this is not a green final native batch. No timeout
  was increased. The final Pages-base build passes, and all **8/8 built-production
  journeys pass** with the shortened copy, genuine desktop/touch gestures and
  exact saved-fixture replay (no source imports). Publication verification remains
  pending.
- TypeScript, normal and Pages-base builds, lint (zero errors, 211 existing
  warnings) and all 13 release checks pass before that text-only refinement.

Broader Winter legality, Flower interactions/mutations, catalysts, full item
semantics, organic balance and newcomer evaluation remain required work.

## Generated artwork

The imagegen skill was used in built-in-tool mode, with genuine transparency;
no model selector or verifiable model ID was exposed. The tool output was
visually inspected, then mechanically converted with `cwebp -q 85 -resize 512 512`.

- Saved asset: `public/assets/illustrations/autumn-maple.webp`, 512×512 alpha,
  65,342 bytes.
- SHA-256: `16215ca857b84205420e811bd415eed464b3cdf2b9781b41d51d82a35445437f`.
- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-1b2d3f12-bd8b-4195-bf8f-41886313d40d.png`.

Exact prompt:

> Use case: stylized-concept. Asset type: compact Autumn-season illustration for Tensho, an East Asian mahjong fantasy game. Primary request: a small dark-jade lacquer bowl with an antique-gold rim holding a graceful miniature maple branch with a few vivid amber and russet leaves. Premium hand-painted game-object illustration with worn lacquer, restrained gold ornament and warm ivory highlights, matching a forest-green, antique-gold and ivory game palette. Three-quarter view, complete centered object, bold readable silhouette at 64 pixels, generous transparent padding, square composition. Genuine transparent alpha background. No text, numerals, characters, calligraphy, labels, people, mahjong faces, tabletop, background scene, logo or watermark.
