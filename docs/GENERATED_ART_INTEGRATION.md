# Generated artwork integration

The delivered art set (350 runtime images, then the Omens add-on's 23, for
373; 365 since the tile finishes retired the 8 mark frames) was prepared as
patches against
`fc4239905a8030949416cccb591cfab0d237e7dc` and integrated into main after the
player-feedback rework. On main:

- The images live in `public/assets/illustrations/generated/`;
  `src/utils/generatedArt.ts` maps ids to files.
- `getItemArt` (`src/utils/itemArt.ts`), which the table rail, Tea House
  offers and reveals use, prefers this art: Decrees, Orbs, Fate Seals,
  Charters, Mandates, packs, upgrade families (by their hand's medallion;
  Pairs by its own two-tile portrait, Every family by the Black Hole Orb), tile marks and
  all 24 Omens (`src/utils/omenArt.ts`; Double Omen keeps its original
  portrait). Every catalog item now has its own picture — see
  `docs/ART_PRODUCTION_MANIFEST.md`.
- Omens are pictured in the Collection, in the table's pending-Omens list
  and on the round payout's "Omen earned" chip.
- Seals and editions are drawn as these layers on every tile. Tile marks
  were frames too until the finished tile set replaced them (see Tile
  finishes below).
- Patch changes to components the rework retired (`retired-files.json`)
  were applied as delivered but are not rendered.

## Scope

- Exact-ID image lookup for all 164 active Decrees, all 13 catalog Orbs, 24 Fate Seals, 32 Charters, and 28 Mandates; already-existing portraits are reused
- All 33 achievement badges and 19 Yaku medallions; medallion aliases preserve the live detector and upgrade-family identities
- 8 enhancement frames (since replaced by the tile finishes), 4 seals and 4 edition layers, with measured alpha-bound registration, readable face/hint layering, and consistent rankless Stone presentation
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

## Orbs V4 (2026-10-30)

The 13 Orb portraits in `generated/orbs/` are the V4 "carved celestial orb"
set, which replaced the short-lived matching-spheres set the same day. Each
Orb is its own celestial body in gemstone or enamel (Earth blue and green,
Mars rust, Saturn ringed, Black Hole a gold-rimmed void), carved with its
upgrade family's tile motif in ivory relief and set on a small jade-and-gold
mount. The Black Hole Orb (tiles of every kind under a rising arrow) also
serves as the Every family upgrade emblem. The body colours match
`FAMILY_TONES` (`src/components/gameplay/yakuFamilyTones.ts`), so an Orb and
its family's upgrade share colour and motif.

The masters are 1254 px PNGs with uneven padding and faint low-alpha specks
at the edges. Each runtime copy is cropped to its visible bounds (alpha above
3%), fitted in 244 px, centred on a 256 px transparent canvas and saved as
WebP quality 72 (`cwebp -m 6 -alpha_q 100`), so every Orb fills its slot
alike. The manifest records each source PNG hash; the masters stay in the
delivery archives (`Tensho_Orbs_V4_Part_1.zip` to `_Part_3.zip`), not in the
repo.

Each Orb keeps its celestial name ("Pluto Orb"). The family it raises is the
subtitle, read from `upgradeFamilies.<family>.name` so the Orb and the upgrade
always share one label. It shows in the Tea House kind line
(`shop.kinds.orbFamily`) and under the name in the Orb reveal. The motifs are
decorative identifiers, not rule diagrams: the family's "works with" text
(`upgradeFamilies.*.covers`) is the rule.

## Orbs V5 (2026-11-02)

The upgrade-family rework (simple pattern and tile families, see
`playOrbCategories`) gave seven Orbs a new family, so their carved motif no
longer matched. The V5 set replaces six V4 portraits and adds the Moon, made to
`docs/ORB_ART_BRIEF.md` from the V4 masters as style references:

| Orb | Family | Motif |
|-----|--------|-------|
| Moon (new) | Sequence + Pair | 2-3-4 Bamboo, pair of 9 Bamboo |
| Mercury | Two Sequences | 1-2-3 and 7-8-9 Characters |
| Jupiter | Full House | three 8 Bamboo, two 2 Bamboo |
| Mars | Quads | four 5 Circles |
| Eris | Winds | 東 南 西 北 |
| Ceres | Loose Tiles | 一萬, 中, 9 Bamboo set apart |
| Planet X | Three Pairs | 2-2, 6-6, 8-8 Bamboo |

Pluto, Venus, Earth, Saturn, Uranus, Neptune and the Black Hole keep their V4
portraits. Runtime copies use the V4 transform (crop to alpha above 3%, fit in
244 px, centre on 256 px, WebP quality 72), encoded with Pillow (method 6,
alpha quality 100) because `cwebp` was not available; each is 18–23 KB. The
manifest records the V5 master hashes (`Tensho_Orbs_V5/png/<id>.png`); the
masters stay in the delivery archive `Tensho_Orbs_V5.zip`, not in the repo.

A family's Tea House token and its upgrade reveal show the same portrait as
its Orb (`getItemArt('yakuUpgrades', family)` resolves through
`UPGRADE_ORBS`), so these seven files update both places. Pairs keeps its own
two-tile badge.

## Tile finishes (2026-10-31)

A marked tile is no longer the plain face shrunk inside a material frame. It
is drawn whole from finished artwork: the face, bevel, sidewall and red back
painted in the Mark's material, carrying the tile's own symbols. There is one
sprite per face (9 Bamboo, 9 Dots, 9 Characters, 4 Winds, 3 Dragons, 4
Flowers, 4 Seasons) in each of Bonus, Mult, Wild, Glass, Steel, Gold and
Lucky, plus one blank Stone that hides the tile's rank and suit: 295 files in
`public/assets/tiles/<mark>/<suit>_<rank>.webp` and `public/assets/tiles/stone.webp`.
`getTileFinishPath` (`src/utils/assets.ts`) picks the sprite and `TileImage`
draws it in place of the face, so seals, editions, rank hints, selection and
the red-five dot sit on it as before. Keys use saved ranks: `dragon_01` is the
White Dragon (the base faces' `Dragons (3).png`).

The delivery is `Tensho_Game_Ready_512_WebP_Part_1.zip` and `_Part_2.zip`
(410×512 WebP quality 90, derived from 1122×1402 PNG masters kept in the art
library). Each runtime copy is resized to 320×400 (Lanczos) and saved as WebP
quality 86 (`cwebp -m 6 -alpha_q 100`), about 13 MB for the set, enough for
the largest 90×126 tile on a 3× screen. The finishes have their own 16 MiB
precache budget in `scripts/verify-asset-delivery.mjs`, apart from the 40 MiB
core payload.

The delivered `bonus/manzu_01.webp` was empty (0 bytes). Its runtime copy was
rebuilt from the delivered set: every Bonus face shares one lapis background
and the numerals are drawn alike in every finish, so the One of Characters
numeral from `mult/manzu_01` was laid on the Bonus background in place of
`bonus/manzu_02`'s Two. Replace it with an export from the Bonus PNG master
when one is available.

The eight mark frames (`generated/enhancements/*.webp`) are deleted, along
with their manifest entries. A Mark's own picture (its icon in tile details
and the Tea House, its Collection card and `getItemArt`) is now its finished
Five of Dots, or the blank Stone: `generatedArtPaths.enhancements` points at
those sprites.
