# Celestial Orb art brief (V5: simple families)

For the art agent regenerating Orb portraits. November 2026.

> **Status (2026-11-02): delivered and integrated** as Orbs V5: Moon, Mercury,
> Jupiter, Mars, Eris, Ceres and Planet X. Earth was not refreshed and keeps its
> V4 portrait. See "Orbs V5" in `GENERATED_ART_INTEGRATION.md`. The rest of
> this page is the original brief, kept for the next refresh.

## Why

The upgrade families were rebuilt around simple, visible conditions (see
`playOrbCategories` in `src/systems/CelestialOrbSystem.ts`). Each Orb is
carved with its family's tile motif, so Orbs whose family changed now show the
wrong tiles, and the new Moon Orb has no portrait at all (the Orb falls back to
the generic Orb illustration, its family token to the shared upgrade-ledger
picture). The motif identifies the family at a glance; the
rule itself is the family's text (`upgradeFamilies.<family>.covers`).

Pattern families (a play scores the one its groups make): Pairs, Three Pairs,
Sequence, Sequence + Pair, Two Sequences, Triplets, Full House, Straights,
Quads. Tile families (stack on top): Winds, Dragons, Mixed Suits, Loose Tiles.

## What to make

| Orb | Family | Status | Celestial body (tone) | Carved motif |
|-----|--------|--------|------------------------|--------------|
| `moon_orb` | Sequence + Pair | **New** | The Moon: pearl-white and silver, soft grey maria and small craters (`#e9e4cf`) | 2-3-4 of Bamboo, a small gap, then a pair of 9 Bamboo |
| `mercury_orb` | Two Sequences | **Regenerate** | Mercury: silver-grey cratered stone (`#b7bdc6`) | Two runs side by side: 1-2-3 of Characters and 7-8-9 of Characters |
| `jupiter_orb` | Full House | **Regenerate** | Jupiter: amber and cream bands, the Great Red Spot (`#efa754`) | Three 8 of Bamboo, a small gap, then two 2 of Bamboo |
| `mars_orb` | Quads | **Regenerate** | Mars: rust and terracotta, dusty canyons (`#ed7652`) | Four identical 5 of Circles in one row |
| `eris_orb` | Winds | **Regenerate** | Eris: pale lilac ice, frosted (`#d8d0ff`) | The four Wind tiles 東 南 西 北 in a row, with carved swirling wind clouds behind them |
| `ceres_orb` | Loose Tiles | **Regenerate** | Ceres: warm grey stone, a few bright salt spots (`#c5bca8`) | Three unrelated single tiles set apart and slightly tilted, clearly not a group: 1 of Characters, Red Dragon 中, 9 of Bamboo |
| `planet_x_orb` | Three Pairs | Refresh if time allows | Planet X: deep violet with a faint glow (`#a47bff`) | Exactly three pairs: 2-2, 6-6 and 8-8 of Bamboo (the current art shows a ring of seven pairs) |
| `earth_orb` | Triplets | Keep (optional refresh) | Earth: blue oceans, green land (`#67bbdf`) | One prominent triplet, 7-7-7 of Circles (current art shows three triplets; acceptable) |
| `pluto_orb` | Pairs | Keep | — | Current art fits (a pair) |
| `venus_orb` | Sequence | Keep | — | Current art fits (one run of three) |
| `saturn_orb` | Straights | Keep | — | Current art fits (a long run on the ring band) |
| `uranus_orb` | Dragons | Keep | — | Current art fits (Red Dragon tiles with a carved dragon) |
| `neptune_orb` | Mixed Suits | Keep | — | Current art fits (the same run in all three suits) |
| `black_hole_orb` | Every family | Keep | — | Current art fits |

Minimum delivery: the six marked **New** or **Regenerate**.

The tones are the family colours in
`src/components/gameplay/yakuFamilyTones.ts`; the Orb body should read as that
colour, so the Orb and its family's upgrade token match.

## House style (match the existing V4 set)

Look at the current portraits in `public/assets/illustrations/generated/orbs/`
before starting; new Orbs must sit beside them as one set.

- A single celestial sphere rendered as polished gemstone or enamel, with the
  body's real surface features (craters, bands, ice) in its tone.
- On its face, an ornate gold cartouche (scrolls, cloud motifs, small red
  jewels) framing the tile motif in raised ivory relief. Tiles are real
  Mahjong tiles: ivory faces, rounded corners, correct suit symbols (Bamboo
  sticks, Circle discs, Characters with 萬), Wind and Dragon glyphs.
- The sphere stands on a small jade-and-gold mount, centred. Saturn-style ring
  only on Saturn; a thin gold meridian arm is fine.
- Warm, soft studio light from the upper left; no harsh rim light, no lens
  flare, no cast shadow on the ground.
- Transparent background. Nothing touches the image edge.
- No text, numbers, letters or labels anywhere except the tile glyphs. No
  planet names.
- Motif readable at 56 px: few tiles, large, high contrast against the
  cartouche.

## Ready-to-use prompt (fill the two blanks per Orb)

> A single ornate celestial orb on a small jade-and-gold stand, centred on a
> transparent background. The orb is **[celestial body and tone from the
> table]**, rendered as polished gemstone and enamel with its real surface
> features. On its face is an ornate gold cartouche with cloud scrolls and
> small red jewels, framing **[carved motif from the table]** in raised ivory
> relief: real Mahjong tiles with ivory faces and correct suit symbols. Warm
> soft light from the upper left, rich detail, game item icon, matching a set
> of carved celestial orbs. No text, no labels, no background, nothing
> touching the edges.

## Technical delivery

- PNG masters, RGBA with a transparent background, about 1254 × 1254 px.
- File names are the Orb ids: `moon_orb.png`, `mercury_orb.png`,
  `jupiter_orb.png`, `mars_orb.png`, `eris_orb.png`, `ceres_orb.png` (and
  `planet_x_orb.png`, `earth_orb.png` if refreshed).
- Deliver them in one archive, `Tensho_Orbs_V5.zip`, under `png/`.

## Integration (whoever has the repo)

For each master:

1. Crop to its visible bounds (alpha above 3%, which drops faint edge specks),
   fit in 244 px, centre on a 256 × 256 transparent canvas, and save as WebP
   quality 72 (`cwebp -q 72 -m 6 -alpha_q 100`) to
   `public/assets/illustrations/generated/orbs/<orb_id>.webp`. It must stay
   under 120 KB.
2. Update its entry in `docs/generated-art-manifest.json` (or add one for
   `moon_orb`), copying the shape of the `pluto_orb` entry: `sourceFile`
   `Tensho_Orbs_V5/png/<orb_id>.png`, the master's `sourceSha256`, the WebP's
   `deliverySha256` and `bytes`, `generatedWith` "Built-in image generation
   (Tensho Orbs V5)".
3. For the Moon only: add `moon_orb` to `generatedArtPaths.orbs` in
   `src/utils/generatedArt.ts`, remove it from `ORBS_AWAITING_ART` in
   `src/utils/generatedArt.test.ts`, and raise that test's manifest count by
   one.
4. Run `bun run test:run src/utils` and `bun run build` (the build's asset
   verifier reports the offline cache margin).
5. Add a short "Orbs V5" note to `docs/GENERATED_ART_INTEGRATION.md`.
