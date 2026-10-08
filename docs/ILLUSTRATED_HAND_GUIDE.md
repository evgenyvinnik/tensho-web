# Illustrated public hand-building guide

October 8, 2026. Follow-up to the shipped [hand workshop](HAND_BUILDER_IMPLEMENTATION.md).

## Scope

The English how-to page now shows an ordinary fourteen-tile worked example:
twelve useful tiles to retain, two unmatched Dragons to exchange, and one
possible resulting complete hand. Three panels reuse the game's actual tile
art, with group labels and individual tile names. This is authored teaching
content, not a seed forecast, optimal strategy or promised draw.

The text distinguishes opening the workshop, staging its suggestion, spending
one redraw charge, and separately declaring a complete hand. It explains hidden
and altered-rule limits and warns that chasing completion may lose a round.
A direct Classic link sits with the example. Existing Table Loop practice-save
warnings and non-resetting resume links remain.

About and FAQ no longer describe shipped Flower/Season powers as unimplemented.
They explain persistent Flowers, round-scoped normal/corrupted Seasons,
mutations and optional Flower payment without claiming every design proposal or
the whole project is finished. These public articles remain English only.

Tile filename resolution is extracted into a browser-independent shared helper,
so static generation and gameplay use the same White/Green/Red Dragon mapping.
No gameplay, save identity or scoring rules change. No new raster art is generated
for these exact tile diagrams. A visible manually reviewed date matches the
structured-data date; ordinary deployments do not advance it automatically.

## Verification

Evidence directory: `/tmp/tensho-guide-refresh-Sv86pn`.

- The first focused run passed 74 cases and failed two new fixtures because the
  test used a nonexistent tile-set factory name. Corrected to the existing
  `createStandardTileSet(false)` and the engine's `gameplay` phase name; the
  original attempt remains in `focused.log`.
- Corrected focused run: **76/76**. The example runs through actual advice,
  redraw and play actions with a physically possible standard wall. Inspection
  is read-only; both exchanged tiles cost one redraw and no Hand; useful draws
  produce exactly the illustrated fourteen tiles; the separate declaration
  spends one Hand and matches the forecast. A second case verifies unhelpful
  replacements do not complete the hand.
- Static-render tests check panel counts, PNGs, alt text, Dragon identities,
  Classic destination, review date, sitemap and canonical boundaries. Rendering
  leaves the physical tile ID counter unchanged.
- Pages-base TypeScript/build passes. Lint has zero errors and the existing
  211 warnings. Thirteen release-workflow checks pass.
- Production guide browsers: **8/8**, original deadlines and no retries. All
  three static articles work without JavaScript, with 320/768/1440px geometry,
  200% root-font enlargement, loaded images, keyboard skip/focus, live links and
  metadata checks. Both menu-to-practice journeys pass. Desktop and narrow-phone
  hand-example screenshots were reviewed.
- Production workshop replays: **6/6**, English/Spanish/Russian desktop and
  320px touch. Shared asset extraction preserves semantic Dragon art, free
  staging, actual one-charge redraw and exact saved reload.

- Full regression: **2,675/2,675 in 193 files**. No retries or changed deadlines.

This does not verify translated articles, physical devices, screen readers,
search indexing/ranking or newcomer enjoyment.

## Publication

Source `3628a944075b2fa8845b2b54409bab97e9acd034` is published as
**v1.0.261008-18**, built/tagged at
`9889347f4fdc0cb3aa8662be942ccfe4e18ed903`.
[Workflow 37756765862](https://github.com/evgenyvinnik/tensho-web/actions/runs/37756765862)
independently passes **2,675/2,675 tests in 193 files**, build and deployment.
The hosted release manifest agrees with the tag/commit/version; runtime entry
`assets/index-D697frMt.js` contains that version.

All **14 hosted browser journeys pass**, without retries: eight public-guide
checks plus six actual workshop exchanges/reloads, including English/Spanish/
Russian gameplay on desktop and 320px touch. Hosted artifacts are in `hosted/`
and `hosted.log`. These are current fresh browser contexts, not a historical
installed-PWA migration or physical-phone performance claim.
