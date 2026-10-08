# Supernova and Perfectionist: qualify the play that actually scores

October 7, 2026 local / October 8 UTC. Local implementation checkpoint;
production/publication checks are pending. Whole-project completion remains open.

## Failure and delegated decision

Supernova checked the already-banked round score against twice the target. Normal
rounds end as soon as the target is reached, making that benefit unreachable.
Perfectionist checked only whether the play was first, ignoring its promised win.

Both now qualify against this play's paid score **before all Supernova and
Perfectionist effect bonuses**, including copied instances. Add that neutral score
to the already-banked score:

- Supernova earns ×2.5 when the projected round total is at least twice the target.
- Perfectionist earns ×3 when the opening play reaches the target.
- Neither bonus qualifies itself or the other; inventory order cannot create
  a circular qualification chain. Once qualified, effects still use the ordinary
  physical Decree order and copy rules, including editions and suppression.
- Neutral score includes ordinary Decrees, editions, Flowers, Seasons, tile
  modifiers, Orb/Charter bonuses, Mandates, Immortal penalty, rounding and Decay.
  Frostbite weakens the earned numerical bonus through the existing final formula.
- The neutral pass is read-only. Tile RNG and Orb trigger accounting run only
  once; preview keeps its existing policy of not predicting random Lucky procs.
  Actual Lucky outcomes may therefore qualify a bonus the deterministic preview
  did not promise. This is not a new forecast guarantee for random outcomes.
- An active threshold effect alone enables the extra pass. Ordinary inventories
  do not repeat their Decree calculations. No save schema migration is needed.

This resolves the circular wording under the user's delegated authority. It does
not change targets, prices, acquisition rarity, rescue settlement, Merchant's
once-per-round exchange, Rental income policy or Cerulean Bell's latest-only lock.

The analysis-only shop model intentionally omits final Season/penalty settlement.
It now treats these threshold powers as unpriced: it neither buys them using a
false estimate nor sells owned ones as worthless. This model limitation is not a
restriction in the real shop. Historical balance sweeps remain historical evidence,
not measurements of this changed scoring rule. Future threshold-aware strategy
valuation and broader balance/human-fun work remain open.

## Player-facing changes

The shared item-text path supplies the exact qualification rule in all thirteen
languages, including catalogs missing these item entries. Existing translated
catalog descriptions are updated too. Shop, collection and owned hover/tap
inspectors consume the same descriptions. Supernova gains a distinct illustrated
scroll through the shared portrait mapping; ordinary unknown/face-down behavior
continues to use the existing fallback.

## Verification ledger

Evidence root: `/tmp/tensho-score-threshold-2CmVEF`.

- Initial eleven regressions: **2 passed / 9 failed**. Five failures reproduced
  the missing Supernova trigger, incorrect opening-hand Perfectionist benefit,
  missing copied benefit and incorrect penalty qualification. Four additional
  failures were a new fixture's duplicate wall-template IDs; the fixture now
  deduplicates physical IDs before validated save restoration.
- Corrected initial set: **11/11**. Expanded first run: **56/57**; the new Lucky
  test incorrectly assumed its chance award was ×21 rather than +20 chips.
  Correcting the expectation/threshold retains the one-RNG-draw assertion.
- Final focused checks: **72/72 in five files**. Sixteen new engine cases cover
  boundaries, cumulative versus opening score, non-circular/order-independent
  qualification, copied/suppressed sources, native tile multipliers, editions,
  Frostbite, persistent penalty, RNG purity and exact validated save restoration.
  Thirteen new locale cases, one portrait case, two analysis-policy guards and
  existing secondary-scoring/policy cases also pass.
- First native browser batch: **0/4** due to the new expected two-tile forecast
  being +5 instead of +4. Existing scoring floors each ungrouped tile separately;
  the expectation was corrected without changing production scoring or deadlines.
- Corrected native journeys: **4/4**, 16.3 seconds, no retries. EN/ES 1280×800
  desktop and 320×568 touch. Inspect both localized rules, decode the new portrait,
  stage two unqualified tiles (+4), complete the sequence (+337), verify preview
  RNG purity, commit the exact 337 points, enter the shop and reload it exactly.
  No JavaScript page errors or horizontal overflow. These constructed valid saves
  prove integration, not organic rarity, balance or enjoyment.
- Strict TypeScript, lint (zero errors / 211 existing warnings), whitespace and
  thirteen release checks pass. Full regression passes **2,196/2,196 in 177 files**,
  136.47 seconds, two workers and unchanged deadlines. Pages-base production build
  passes, 432 precache entries / 70,980.03 KiB; existing large-chunk and stale
  Browserslist warnings remain. Spanish short-phone inspector reviewed: portrait,
  complete wrapped rule and sale control fit.
- Built-production replay passes **4/4**, 7.9 seconds, no retries. It uses the
  exported native valid save without importing production internals. Local
  native/preview servers are stopped; the unrelated port 4173 server is untouched.
  Hosted publication verification remains pending.

## Artwork provenance

Generated with the imagegen skill's built-in image tool. The tool exposes neither
an exact model identity nor model selector; a specifically named “latest” model
cannot be independently verified. No API/CLI fallback was used.

- Original retained at `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-1b97d70b-e108-46a5-aba2-d318d82dcf07.png`.
- Project asset: `public/assets/illustrations/decrees/supernova.webp`, 512×512
  with alpha, 77,790 bytes. Mechanical cwebp quality-85 conversion preserves alpha;
  no existing image is overwritten. Original and optimized image inspected.
- SHA-256: `9e6dd026efeac16e3d6c5b3b805cb71cc5772f41015a5c87e4c9ca4391de612a`.

Final prompt:

> Use case: stylized-concept. Asset type: transparent inventory portrait for Tensho's Supernova Decree. Primary request: an ornate illustrated hanging scroll whose central emblem is a brilliant gold and ivory exploding star, encircled by two elegant concentric jade shockwave rings. Style: polished hand-painted fantasy game item, consistent with jade, antique gold, cream parchment and small red wax seals. Materials: ivory parchment, deep indigo silk edging, dark jade rollers with gilded end caps. Composition: single complete centered upright scroll in a square image, ten percent clear padding, strong bold star silhouette readable at 56px. The celestial emblem is painted into the parchment, not a separate floating object. Lighting: warm glowing gold core with restrained teal accents. Constraints: genuinely transparent background, no scene or floor, no words, letters, numbers, watermark or outer UI border; do not paint a checkerboard.
