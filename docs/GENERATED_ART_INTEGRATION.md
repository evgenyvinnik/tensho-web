# Generated artwork integration

The delivered art set (350 runtime images, then the Omens add-on's 23, for
373) was prepared as patches against
`fc4239905a8030949416cccb591cfab0d237e7dc` and integrated into main after the
player-feedback rework. On main:

- The images live in `public/assets/illustrations/generated/`;
  `src/utils/generatedArt.ts` maps ids to files.
- `getItemArt` (`src/utils/itemArt.ts`), which the table rail, Tea House
  offers and reveals use, prefers this art: Decrees, Orbs, Fate Seals,
  Charters, Mandates, packs, upgrade families (by their hand's medallion;
  Pairs and Every family by the Pluto and Black Hole Orbs), tile marks and
  all 24 Omens (`src/utils/omenArt.ts`; Double Omen keeps its original
  portrait). Every catalog item now has its own picture — see
  `docs/ART_PRODUCTION_MANIFEST.md`.
- Omens are pictured in the Collection, in the table's pending-Omens list
  and on the round payout's "Omen earned" chip.
- Tile marks, seals and editions are drawn as these frames on every tile.
- Patch changes to components the rework retired (`retired-files.json`)
  were applied as delivered but are not rendered.

## Scope

- Exact-ID image lookup for all 164 active Decrees, all 13 catalog Orbs, 24 Fate Seals, 32 Charters, and 28 Mandates; already-existing portraits are reused
- All 33 achievement badges and 19 Yaku medallions; medallion aliases preserve the live detector and upgrade-family identities
- 8 enhancement frames, 4 seals and 4 edition layers, with measured alpha-bound registration, readable face/hint layering, and consistent rankless Stone presentation
- Sealed/open pack-family illustrations; pack price, size, choices, counters, bonuses and effect descriptions remain live UI text
- Zero Unicode emoji in application sources and translations, including escaped string literals and dormant presentation fallbacks
- PNG functional controls and shared raster artwork; localized labels, button semantics, keyboard behavior and effect values are retained
- Archive artwork gaps filled for Orbs, Fate Seals, packs, Mandates, table styles, tile marks, seals and editions

No scoring, purchase, draw, unlock, progression or gameplay retirement logic is changed. The icon fields in achievement/unlock definitions now hold typed asset identities; non-icon logic/data was compared against the base revision.

Pluto still exists in this revision. Its new identity image is wired while its current Riichi-related effect is left unchanged. Riichi Devotee uses its already-existing generated portrait; it has no newly generated portrait in this pack.

Two Decree draw-bag images and three still reveal overlays are delivered and mapped as prepared assets. The base revision has no corresponding Decree draw-bag UI, so this patch does not invent one or claim those states run in-game. Existing decorative patterns, particles and tile drawings are outside the semantic-control replacement.

## Delivery format

The accompanying runtime-art ZIP contains the `public/assets/illustrations/generated/` tree. Extract that tree at the repository root before building the patch.

Full-resolution PNG masters remain in the separately saved art archives. Runtime copies are derived from those images, never from SVGs:

- Most portraits and tile layers: transparent WebP, maximum 192 px, quality 72
- Achievement badges and Yaku medallions: maximum 128 px, quality 72; source UI displays these at 28–48 px
- Controls: maximum 96 px, indexed 256-color PNG with alpha, aspect preserved; Challenge is 96×64 rather than stretched square
- All 350 runtime files total 3,525,064 bytes

`scripts/prepare-generated-art.py` can reproduce derivatives from extracted PNG masters by verified source hash (Pillow required only for regeneration).

`generated-art-manifest.json` records exact paths, source and delivery SHA-256 hashes, dimensions and conversion settings. `generated-art-coverage.json` distinguishes newly generated files from reused images and prepared-but-unwired states.

## Visual verification boundary

Representative runtime portraits, complex badges/Yaku, and modifier combinations were inspected in static composites on dark/light surfaces. Control PNG palette encoding reduced 39 icons from 303,571 to 92,812 bytes; side-by-side 24 px/40 px inspection retained edge clarity and transparent margins. Maximum average visible-pixel channel error versus true-color PNG was 2.97/255 when composited on the checked backgrounds.

Static frame composites cover 48×64 and 90×120 display sizes with all 8 enhancement families, Gold/Red-seal combinations, readable nine-pip faces, rank hints above frames, and rankless Stone. These are asset-composition checks, not browser screenshots.

The source defines boss detail images at 128 px and Mega pack hover art up to approximately 168 px; most other new image slots are 24–96 px. These are source-derived bounds, not observed browser measurements.

The art producer could not launch Chromium. On main the desktop acceptance
suite was run in Chromium after integration.

## Validation

`generated-art-validation.json` records the producer's checks against the
base revision. The existing 40 MiB offline cache policy is unchanged; rerun
`bun run build` (its asset verifier reports the cache margin) after adding
art.
