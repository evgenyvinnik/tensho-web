# Illustrated asset delivery

**October 8, 2026 — published and hosted-verified in v1.0.261008-21.**

This checkpoint reduces download/cache cost without replacing the established
emerald, ivory and gold artwork or changing gameplay rules. It addresses the
large-illustration limitation in [SEO strategy](SEO_STRATEGY.md), not overall
balance, physical-device performance or proof that the game is fun.

## Delivery contract

- Keep all 51 original illustration PNGs published at their existing URLs for
  older clients and future art work. No original pixels or files are overwritten.
- Current UI uses 50 WebP cutouts, bounded to 512 pixels on the longest side,
  preserving aspect ratio and alpha. This covers Gold, packs, consumables,
  scripts, guidebook, rarity scrolls, Charters, Wealth Engine, Double Omen and
  all ten Table Loop Decrees. Existing WebP artwork and tile identities stay intact.
- About's hero uses 768/1536-wide WebP candidates with layout-aware `sizes`.
  Keep its meaningful alt text, reserved 3:2 dimensions and high fetch priority;
  do not lazy-load the hero. Public guides still work without JavaScript.
- New service workers exclude only the explicit replaced-source inventory.
  Replacement art, other images, all fonts/audio, lazy screens and guide HTML
  remain precached. This does not weaken the existing offline-play promise.
- Preserve update consent, save-before-update, failed-save refusal and protection
  against activating over another open game window.

The source recipe is `scripts/illustration-sources.json` plus
`scripts/optimize-illustrations.mjs` (cwebp/libwebp 1.6.0, quality 85, method 6,
alpha quality 100). Generated delivery copies are committed; deploys need no
image tools. New generation is not claimed: these are optimized copies of the
project's existing generated artwork.

`bun run build` now checks the actual generated service worker with
`scripts/verify-asset-delivery.mjs`: every delivery copy and every other current
image/audio/font must be cached, originals must remain deployed but not cached,
cutouts must be below 120 KB, hero candidates below 350 KB, and the unique
precache payload below 40 MiB. Future PNGs are not silently excluded. Revisit
budgets explicitly rather than disabling coverage or hiding oversized files.

## Measured local payload

Matched production builds use `pwa-before` and `pwa-after` under `/tensho-web/`.
These are file bytes, not a throttled-network loading-time or Lighthouse claim.

| Resource | Before | After |
| --- | ---: | ---: |
| Unique service-worker precache | 73,144,256 B | 37,814,518 B |
| Migrated illustrations (all delivery candidates) | 37,485,091 B | 2,155,032 B |
| About hero, phone candidate | 2,319,300 B | 75,860 B |
| About hero, large candidate | 2,319,300 B | 199,402 B |
| Wealth Engine | 2,620,640 B | 86,774 B |
| Whispering Merchant | 2,495,977 B | 82,448 B |

The offline payload decreases by about 48%; migrated illustration bytes by
about 94%. Workbox reports 438→439 entries (three duplicate icon entries);
unique URLs are 435→436. Both hero candidates stay offline-ready. The published
site/repository footprint is **not** reduced: originals are intentionally retained.
Fonts alone still account for about 14 MiB. Further font and JavaScript delivery
work remains; no font subsetting, lost locale glyphs or audio removal is hidden
in these figures.

## Verification ledger

Evidence directory: `/tmp/tensho-asset-delivery-1RM5hT` (local, not a tracked
artifact or permanent public URL).

- Original files remain unmodified; transparent 512px Twin Flame and the 768px
  hero were visually inspected. Tests check every source/copy, dimensions,
  aspect ratio, alpha and size; reviewed Dragon asset hashes remain unchanged.
- Targeted regression: 191/191 across nine files pass.
- Strict TypeScript passes; lint has zero errors / 211 existing warnings;
  thirteen release-workflow checks pass.
- Production guide checks: 14/14 pass, including JavaScript-disabled pages,
  320/768/1440 layouts, enlarged text, keyboard navigation and fresh-context
  image selection at 320px 1x/2x and 1440px 2x. Only the chosen hero downloads.
- Real old→new worker upgrades: 10/10 pass, covering desktop/touch and both
  modes, successful saves, write/access failures, Later, other-window refusal,
  exact saved-state preservation and unvisited offline Codex/game continuation.
  Each case additionally fetches and decodes **all 52** replacement images
  offline; an HTML fallback cannot satisfy the image check.
- The first full regression exposed one stale PNG selector in a shop test and
  two CLI timeouts during concurrent browser work: 2,806/2,809 passed. The
  selector is corrected and its six-test shop file passes. The final bounded
  full rerun passes **2,809/2,809 in 199 files**, including all 28 CLI checks,
  without concurrent browser work. Deadlines are not increased.
- Initial native run: 64 passed / four Plentiful Stock journeys failed on the
  old PNG selector. After updating the selector, all four pass in a 16/16
  follow-up that also covers stock expansion and complete seeded Table Loop
  runs (seeds 7/12). Together the 80 checked cases cover desktop/touch,
  English/Spanish purchases, progression, details, tutorials and save/reload.
- Final build (including the delivery gate) passes; its version-label difference
  makes its unique payload four bytes larger than the matched `pwa-after` build.
- The production HTTP check verifies all 52 delivery copies byte-for-byte
  against local SHA-256 hashes and all 51 original PNG URLs remain HTTP 200
  with the correct content type.
- Independent CI passes all 2,809 tests, build and the delivery budget gate.

## Release provenance

- Source: `a7bc925e97c81bce645e9bba2ec8080bbabf7b2c`.
- Version/tag commit: `59a8ebfaa4431d2c2cee0afbf7795d01c780b13d`,
  `v1.0.261008-21`.
- [Deployment run](https://github.com/evgenyvinnik/tensho-web/actions/runs/37768381101)
  succeeds; build job `113281526566`, deploy job `113282344321`.
- Hosted release manifest, remote tag and runtime `assets/index-Cp6d_9OE.js`
  match. Hosted worker includes every replacement and excludes each original.
  CI measures 37,814,522 bytes across 436 unique precache URLs.
- **16/16 hosted checks pass** in 33.1 seconds: responsive image selection,
  all guides without JavaScript, text enlargement and keyboard continuation,
  menu-to-practice navigation, all 52 delivery hashes and all 51 legacy URLs.

GitHub reports upstream Pages actions targeting deprecated Node 20 while being
forced onto Node 24, and an upcoming `ubuntu-latest` migration. This release
succeeds; action/runtime maintenance remains a separate follow-up, not a hidden
failure or an unverified workflow change here.

Physical phones, Safari, bandwidth-throttled startup, every historical installed
worker and native-speaker visual review remain outside this checkpoint's proof.
