# State art

Pictures for an item's changed state: four corrupted Seasons, four awakened
Flowers, three Decree sticker emblems and three run results. Every image is
decorative beside localized labels; no text, numbers or rules are painted in.
Delivered 2026-10-19; exact prompts, references and hashes are in
[state-art-provenance.json](state-art-provenance.json).

## Where each picture shows

| State | Files (`public/assets/illustrations/states/`) | Resolver | Shown in |
| --- | --- | --- | --- |
| Corrupted Season | `seasons/{monsoon,drought,decay,frostbite}.webp` | `getSeasonArt(season)` | Item rail, Flora reveal, Flora details |
| Awakened Flower | `flowers/<flower>-awakened.webp` | `getFlowerArt(flower)` | Item rail, Flora reveal, Flora details, Flower catalyst choices |
| Decree sticker | `badges/{eternal,perishable,rental}.webp` | `getStickerArt(type)` via `StickerBadge` | Decree bar cards, Tea House and Blessing Pack Decree art, every modifier details list |
| Run result | `results/{victory,defeat,endless-completion}.webp` | `illustrationAssets.results` | Game over |

- A Season shows its corrupted portrait only while it is corrupted; the
  portrait stays in color because a corrupted Season is an active hazard.
  Suppressed Flowers still dim.
- A Flower shows its awakened portrait only while its own mutation is
  unlocked. The reveal reads the collected Flower, so a duplicate that awakens
  it shows the awakened portrait.
- A sticker's live number sits beside its emblem: a Perishable's remaining
  rounds and a Rental's actual per-round fee (`goldPerRound`, the same value
  the round charges). Eternal has none. Face-down Decrees show no stickers.
  Details lists put the emblem beside the sticker's name and keep the full
  text.
- Results follow `GameOverScreen`'s state: a fresh win shows victory, the end
  of an Endless run after a secured win shows Endless completion (never
  defeat), and any other end shows defeat.

## Delivery

Flora are 224×224 and stickers 64×64, transparent WebP; banners are 960×320
opaque WebP (Pillow Lanczos, WebP q76 method 6). The 224px flora are 2× the
112px reveal; 64px stickers are 3× the 18–20px badges. Full-resolution PNG
masters stay outside `public` in the delivery archives.

This set replaces the earlier corrupted-Season portraits
(`seasons/*.webp`), the earlier victory and defeat banners (`results/*.webp`)
and `journey-result.webp`, so only one copy of each state ships.

### Offline budget

Every WebP is precached (`scripts/verify-asset-delivery.mjs`, 40 MiB cap,
41,943,040 bytes). Measured with `bun run build`:

| Build | Precache bytes | Headroom |
| --- | ---: | ---: |
| Before (WIP art, commit `3cac588`) | 41,864,220 | 78,820 |
| With this set | 41,889,554 | 53,486 |

The new files add 403,170 bytes; removing the replaced art frees 379,414.

## Pairs badge

`public/assets/illustrations/upgrades/pairs.webp` (256×256, transparent)
pictures the Pairs family with two identical Two of Dots faces, distinct from
Pluto's Orb and the Seven Pairs family. It is composed from
`public/assets/Mahjong/file/png/tiles/Dots (2).png` without generated
lettering:

```sh
magick -size 256x256 xc:none -fill '#153f32' -stroke '#c8b273' -strokewidth 7 -draw 'circle 128,128 128,14' -stroke '#776035' -strokewidth 2 -fill none -draw 'circle 128,128 128,25' \( 'public/assets/Mahjong/file/png/tiles/Dots (2).png' -resize 91x114 \) -geometry +31+71 -composite \( 'public/assets/Mahjong/file/png/tiles/Dots (2).png' -resize 91x114 \) -geometry +134+71 -composite -quality 90 public/assets/illustrations/upgrades/pairs.webp
```

## Verification

- Unit: `src/utils/itemArt.test.ts` (state mapping, fallbacks, alpha,
  dimensions, sizes, three distinct results), `CollectibleRail.test.tsx`
  (only the awakened Flower changes), `DecreeBar.test.tsx` (emblems, live
  countdown and fee, hidden face-down).
- Browser: `e2e/art-readability.spec.ts` covers corrupted Season reveals and
  panels, the Pairs badge, an awakened Flower, stacked stickers and all three
  results at 320, 390 and 1280px; `flower-mutations`, `flower-catalysts` and
  `run-results` check the new art in their flows.
