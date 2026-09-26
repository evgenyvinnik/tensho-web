# Starter Decree artwork checkpoint

September 26, 2026. This checkpoint does not change scoring, costs, save schemas, or the default play mode.

## Changes

Five starter Decrees now have individual scroll portraits in paid shop offers, the owned-Decree inspector, and discovered Archive entries. Face-down Decrees retain concealed identities. Extended Hand Grant's copy now accurately states **+3 plays per round**, not extra tiles or redraws; existing engine behavior is unchanged. All thirteen locales include the clarified rule; five previously incomplete locales now include all five starters. Native-speaker review remains outstanding.

Archive item details use the existing native Popup, providing a centered accessible title, Escape dismissal, focus isolation/restoration, reduced-motion support, and a larger portrait. The category badge uses the catalog translation lookup with its existing English fallback. Existing rarity/discovery labels and missing category translations remain follow-up localization work; this is not full Archive localization.

## Generation provenance

The imagegen skill guided generation in **built-in tool mode**. The tool did not expose a model selector or model identity; a specific latest-model claim cannot be independently verified. Each image was generated separately, with transparent background, no text and the established jade/navy/ivory/gold palette. Original PNGs were preserved. No existing artwork was overwritten.

Project assets are 512×512 alpha WebP, about 393 KiB combined, converted deterministically with `cwebp -q 90 -alpha_q 100 -m 6 -resize 512 512`. Tests inspect actual WebP headers, alpha, dimensions, unique bytes and a 120 KB per-image budget.

- **river-tax**: `public/assets/illustrations/decrees/river-tax.webp`; original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-3aa0d931-453f-44b5-bf46-5a3ee7ec0a98.png`.
- **extended-hand-grant**: `public/assets/illustrations/decrees/extended-hand-grant.webp`; original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-47b37636-7d10-4b81-a2d4-84800893ccca.png`.
- **tanyao-dispensation**: `public/assets/illustrations/decrees/tanyao-dispensation.webp`; original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-86f5b27e-840c-4ebb-aa76-128a77e02856.png`.
- **moonlit-seal**: `public/assets/illustrations/decrees/moonlit-seal.webp`; original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-69f5d46d-beaa-4b9e-ade7-935906210f58.png`.
- **pure-suit-asceticism**: `public/assets/illustrations/decrees/pure-suit-asceticism.webp`; original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-4867fede-c299-4925-9444-6f89a7efa825.png`.

## Exact generation prompts

### river-tax

Use case: stylized-concept. Asset type: individual illustrated starter Decree scroll for the Tensho mahjong roguelike. Primary request: River Tax. A graceful winding jade river carries three small ivory mahjong tiles downstream, transforming its final ripple into one prominent round square-hole gold coin. Style: polished painterly game inventory art, luminous ivory parchment, carved antique gold scroll fittings, emerald and navy silk trim, restrained cloud flourishes, one small red wax seal. Composition: one upright unfurled scroll centered in a square image, full object entirely visible with generous transparent margins; bold integrated central river-and-coin emblem legible at 48 pixels. Background: genuinely transparent alpha, no scene, no floor or exterior cast shadow. No lettering, numerals, labels, watermark, UI panel, fake calligraphy or extraneous objects. The scroll should belong to the same emerald, navy, ivory and gold visual family as the game's Wealth Engine scroll.

### extended-hand-grant

Use case: stylized-concept. Asset type: individual illustrated starter Decree scroll for the Tensho mahjong roguelike. Primary request: Extended Hand Grant, extra opportunities to play before a round ends. Central emblem: a beautiful antique gold hourglass with luminous jade sand, embraced by three softly fanned ivory mahjong tile backs. Style: polished painterly game inventory art, luminous ivory parchment, carved antique gold fittings, emerald and navy silk trim, restrained cloud flourishes, one small red wax seal. Composition: one upright unfurled scroll centered in a square image, full object entirely visible with generous transparent margins; bold integrated hourglass emblem legible at 48 pixels. Background: genuinely transparent alpha, no scene, no floor or exterior cast shadow. No lettering, numerals, labels, watermark, UI panel, fake calligraphy, playing cards or extraneous objects. Match the game's emerald, navy, ivory and gold scroll-art family.

### tanyao-dispensation

Use case: stylized-concept. Asset type: individual illustrated starter Decree scroll for the Tensho mahjong roguelike. Primary request: Tanyao Dispensation, a permission seal welcoming terminal tiles. Central emblem: a small open jade-and-gold ceremonial gate with two large ivory mahjong tiles standing together inside it, one tile with a single circular green pip and the other with nine small circular green pips arranged three by three. Style: polished painterly game inventory art, luminous ivory parchment, carved antique gold scroll fittings, emerald and navy silk trim, restrained cloud flourishes, one small red wax seal. Composition: one upright unfurled scroll centered in a square image, full object entirely visible with generous transparent margins; strong simple gate-and-tiles silhouette readable at 48 pixels. Background: genuinely transparent alpha, no scene, no floor or exterior cast shadow. No lettering, numerals, labels, watermark, UI panel, fake calligraphy or extraneous objects. Match the game's emerald, navy, ivory and gold scroll-art family.

### moonlit-seal

Use case: stylized-concept. Asset type: individual illustrated starter Decree scroll for the Tensho mahjong roguelike. Primary request: Moonlit Seal, an honor-tile blessing. Central emblem: an elegant luminous golden crescent moon above a large jade ceremonial seal embossed with a coiled dragon silhouette, the two joined by a restrained sweep of blue-gold moonlight. Style: polished painterly game inventory art, luminous ivory parchment, carved antique gold scroll fittings, emerald and navy silk trim, restrained cloud flourishes, one small red wax seal. Composition: one upright unfurled scroll centered in a square image, full object entirely visible with generous transparent margins; bold integrated moon-and-seal emblem legible at 48 pixels. Background: genuinely transparent alpha, no scene, no floor or exterior cast shadow. No lettering, numerals, labels, watermark, UI panel, fake calligraphy or extraneous objects. Match the game's emerald, navy, ivory and gold scroll-art family.

### pure-suit-asceticism

Use case: stylized-concept. Asset type: individual illustrated starter Decree scroll for the Tensho mahjong roguelike. Primary request: Pure Suit Asceticism, strength from concentrating on one suit. Central emblem: a graceful living jade bamboo stem rises from a disciplined fan of three ivory mahjong tiles, each bearing the same simple green bamboo mark; a single warm gold spiral binds the matching tiles and bamboo together. Style: polished painterly game inventory art, luminous ivory parchment, carved antique gold scroll fittings, emerald and navy silk trim, restrained cloud flourishes, one small red wax seal. Composition: one upright unfurled scroll centered in a square image, full object entirely visible with generous transparent margins; bold integrated bamboo-and-matching-tiles emblem legible at 48 pixels. Background: genuinely transparent alpha, no scene, no floor or exterior cast shadow. No lettering, numerals, labels, watermark, UI panel, fake calligraphy or extraneous objects. Match the game's emerald, navy, ivory and gold scroll-art family.

## Verification ledger

- Initial focused tests: 67 passed, 5 failed because the test used the wrong concealed-button accessible label. Corrected to the existing “Face-down Decree”; 73/73 focused tests then passed.
- Initial full units: 1,354/1,354 in 114 files. Archive dialog changes followed this run and require final verification.
- Strict TypeScript caught unsupported Testing Library `exact` options and an unknown locale property; corrected test types without changing assertions.
- Two initial native batches failed because the fixture assigned to a copied shop snapshot, then to its copied offerings array. Corrected the fixture to update each existing offering object; every acquisition still uses the paid UI. Each fail-fast batch left seven cases unrun.
- The next batch passed shop inspection but exposed a real keyboard activation issue: Enter opened the Archive dialog then activated its newly focused Close button. Preventing the card activation's default key action repaired this and also prevents Space from scrolling the page.
- Final native checks: **18/18 desktop/touch cases**, original deadlines and no retries. All five purchases, decoded 512px portraits, English/Italian descriptions, 320px layouts, Archive native modality/Tab/Escape/focus restoration, and existing shared-dialog flows passed. Desktop and phone screenshots reviewed. Evidence: `/tmp/tensho-starter-art-keyboard`.
- Final full regression: **1,356/1,356 tests in 115 files**, 191.21 seconds, report `/tmp/tensho-starter-art-final-units.json`. All **13/13 release-workflow checks** also passed. Full lint has no errors and 211 existing warnings.
- Strict TypeScript, targeted lint, and the Pages-base production/PWA build passed. Build retains existing chunk-size and stale Browserslist warnings. Deployment remains pending; no publication claim until CI and the public release manifest are verified.
