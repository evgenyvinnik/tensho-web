# Table Loop artwork — September 9, 2026

September 12 follow-up: **Honor Court** and **Wide Rack** now have individual
scrolls, followed by **Twin Flame**, **Whispering Merchant**, and **Jade Ledger**, bringing the total to ten. Their original assets and exact built-in
generation prompts are recorded in [Public guide and scroll artwork](PUBLIC_SITE_ART.md).
Every Decree in the current Table Loop catalog now has individual artwork.
The dated checkpoints below describe the earlier sets of assets.

Generated with the built-in image generation tool using its available default model. The tool does not expose a model selector or return a model ID, so no specific model version is claimed. These are new assets, not replacements.

Style reference: `public/assets/illustrations/decrees/regional-mandate.png` (inspected before generation). All three outputs were visually inspected for matching parchment, lacquer, gold trim, legible subject, and absence of embedded text. Original generated PNGs are preserved with their alpha channels.

Used by `TableDecreeArt` in starter choices, shop offers and the owned Decree inventory. Terminal Gate now also has individual artwork. Other Decrees use the existing regional scroll until individual artwork is commissioned.

September 10 follow-up: Gap Bridge also has individual artwork, generated with
the imagegen skill's built-in tool. The existing generic fallback remains for
the other five non-illustrated Decrees. No gameplay rule was added or changed
for this asset.

The first Gap Bridge browser checks exposed a stale English fallback in
`tableloop/content.ts`: it advertised `3·5·7`, which spans two missing ranks.
The localized UI and existing engine correctly use one gap, such as `3·4·6`.
The fallback and browser expectation now use that legal example. A content
regression extracts the advertised ranks and classifies them through the actual
group rules, requiring Gap Bridge, and checks agreement with the English catalog.
No legality, charge count, or scoring rule changed to accommodate the artwork.

## Final prompts and project assets

### jade-ledger

Saved asset: [jade-ledger.png](../public/assets/illustrations/table-loop/jade-ledger.png).
Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-d1be64f3-c8c3-43f7-b857-ead2fe125beb.png`.

Generated September 12 using the imagegen skill, built-in mode, with no exposed
model selector/ID and no CLI fallback. Whispering Merchant was visually inspected
for style; the new generation had no image inputs. The original 1254×1254 RGBA
PNG was copied unchanged. Visual inspection shows a jade book, two gold coins,
and three ivory pip tiles on a matching emerald/gold scroll, with transparent
exterior and no embedded text. The actual rule remains localized HTML:
¥2 per placed group, one fewer redraw each round. No gameplay rule changed.
The renderer's type-checked mapping and catalog-driven PNG tests now require art
for every Table Loop Decree; a runtime fallback remains defensive only.

Final prompt:

Use case: stylized-concept. Asset type: transparent game-item illustration for Tensho's Jade Ledger Decree. Generate a NEW upright ornate parchment scroll, centered completely within a square canvas with generous exterior margins. Its painted central emblem is a closed jade-green account book with antique gold corner fittings, two golden square-holed coins resting against it, and a small neat group of three ivory mahjong tiles beside the book. This represents earning gold from placed tile groups. Match the established premium hand-painted board-game style: emerald lacquer rollers, antique metallic gold trim, aged ivory parchment, green silk knots and tassels, warm tactile highlights, nearly frontal composition. All rollers and tassels fully visible. Exterior background MUST be genuinely transparent alpha for a clean cutout on green felt, not a painted checkerboard, gray or white background, room or scenery. No text, letters, numerals, calligraphy, labels, people, watermark or UI. Tile faces may show simple jade circular pips only.

### whispering-merchant

Later September 12 rule change, approved by the user: Merchant now trades one
chosen rack tile for a river tile, once per round without an action cost. The
existing art still depicts the returned tile; the updated rule is localized HTML.
The exact historical generation prompt below is preserved, not rewritten to
imply it was generated after this design choice.

Saved asset: [river-merchant.png](../public/assets/illustrations/table-loop/river-merchant.png).
Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-ff855cb4-9f8c-4dd1-ae47-da9681b1ff77.png`.

Generated September 12 with the imagegen skill in built-in mode, without an
exposed model selector/ID or CLI fallback. Final generation used no image inputs;
Twin Flame was inspected as a style reference. The original 1254×1254 RGBA PNG
was copied unchanged. Visually checked: one river tile returns toward an empty
rack on a gold ribbon, with matching emerald/ivory scroll and complete tassels.
Names and rules remain localized HTML outside the artwork.

Rejected attempts are not shipped: the first draft mistakenly depicted selling
tiles for gold; two edits corrected the subject but returned RGB images with a
painted checkerboard. A fresh generation produced the correct motif and actual
alpha. The initial workspace draft was moved to
`/tmp/tensho-flower-unlock-3UOo43/rejected-trading-scroll.png`; all generated
originals remain under the generator's directory. The renderer's unit check now
verifies RGBA color type for every individual scroll, not just a PNG signature.

Final prompt:

Use case: stylized-concept. Generate a NEW transparent-background game-item illustration: one upright ornate parchment scroll for Tensho's Whispering Merchant Decree. On the ivory parchment, one ivory mahjong tile with a jade circular pip floats out of flowing jade river waves, carried by a curved golden ribbon toward a small empty wooden tile rack. This represents retrieving one discarded tile, NOT selling or exchanging tiles. No scales or coins. Match premium hand-painted board-game art: emerald lacquer rollers, antique metallic gold trim, aged ivory parchment, green silk knots and tassels, warm tactile highlights, nearly frontal composition. Complete scroll centered on square canvas, generous empty exterior margins. The exterior background MUST be genuinely transparent alpha, not a drawn checkerboard, not gray, not white, not a room. NO text, numerals, letters, calligraphy, labels, people, watermark, scenery or UI. Use actual transparency for a clean cutout that can sit on green felt.

### twin-flame

Saved asset: [twin-flame.png](../public/assets/illustrations/table-loop/twin-flame.png).
Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-e642f5f7-cd19-455d-8897-878b80b15f68.png`.

Generated September 12 with the imagegen skill and built-in tool's available
default model. No model selector or model ID was exposed; no CLI/API fallback
was used. This is a new image, with no referenced image inputs.
`watch-fire.png` was inspected for style before writing the prompt. The original
1254×1254 RGBA PNG was copied unchanged, preserving transparency. The result was
visually inspected: complete emerald/gold scroll, paired amber flames and a
shared gold medallion, no embedded words. Names and rules remain localized HTML
in the existing hover/focus/tap details. This adds art, not a new gameplay rule.

Final prompt:

Use case: stylized-concept. Asset type: individual collectible Decree scroll illustration for Tensho Mahjong roguelike. Generate one NEW complete upright ivory parchment scroll, emerald lacquer rollers with antique gold trim, green silk knot and tassels, rich polished hand-painted fantasy board-game art. Subject: Twin Flame, an upgrade that doubles milestone point rewards. On the parchment, two equally prominent amber flames rise from two small matching jade-and-bronze lamps and curl around a single bright gold star-shaped medallion. Make the paired flames the bold central motif, unmistakably TWO at small thumbnail size, with the medallion expressing a shared achievement. Match the established Tensho palette of deep emerald, warm ivory and restrained metallic gold, tactile parchment and carefully painted light. Nearly frontal view, centered whole scroll on a square canvas, generous transparent margins around rollers and tassels. Genuinely transparent background and alpha. No letters, words, numerals, calligraphy, labels, watermarks, surrounding scenery, UI, extra scrolls or people. Localized name and rules will be rendered separately in HTML.

### gap-bridge

Saved asset: [gap-bridge.png](../public/assets/illustrations/table-loop/gap-bridge.png).
Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-783ff28b-3d7f-454a-be7c-4ba2b6c1dee5.png`.

Generated September 10 using the built-in tool's available default model; it
exposed no model selector or returned model ID. No CLI/API fallback was used.
The 1254×1254 PNG's alpha channel is preserved; the original was copied without
editing. `echoing-bamboo.png` was visually inspected for style, but was not
submitted as an edit target or image input. The result was inspected for its
complete silhouette, jade/gold bridge joining separated pip tiles, parchment
and emerald rollers, transparent margins, and absence of embedded rules.

Final prompt:

Use case: stylized-concept. Asset type: individual illustrated Decree scroll for Tensho Mahjong roguelike, used in shop cards and owned inventory. Generate one NEW premium painted game-item illustration. Subject: Gap Bridge, a scroll that lets a tile sequence cross one missing rank. On its parchment depict two small ivory mahjong tiles separated by a deliberate gap, joined by a graceful jade-and-gold arched bridge; a thin warm golden trail crosses the bridge to suggest connection. Use abstract circular pip motifs only, not written numerals. Match the established art direction: nearly frontal upright open scroll, deep emerald lacquer rollers, aged ivory parchment, restrained metallic gold filigree, green silk knot and tassel, tactile painterly texture, warm highlights, crisp readable silhouette. Bridge is the bold central motif, ornament subordinate, legible at 96px thumbnail size. One complete scroll centered on a square canvas with generous transparent margins; rollers and tassel fully visible. Genuinely transparent background and alpha. No words, letters, calligraphy, Arabic numerals, labels, watermark, scenery or UI. Localized names and exact game rules will be rendered separately in HTML.

### terminal-gate

Saved asset: [terminal-gate.png](../public/assets/illustrations/table-loop/terminal-gate.png).

Generated in the built-in tool mode on September 9, 2026, with `echoing-bamboo.png` as the inspected style reference. The exact model ID is unavailable. The original output is 1254×1254 PNG with an alpha channel, copied without modification into the project. Visually inspected: matching emerald rollers and gold trim, complete scroll silhouette, a gate flanked by one-pip and nine-pip tiles, no embedded words. This adds art to an existing Decree; it does not introduce a new mechanic.

Final prompt:

Use case: stylized-concept. Asset type: individual illustrated Decree scroll for Tensho Mahjong roguelike, used in shop cards and owned inventory. Generate a NEW image; Image 1 is a style reference only, not an edit target. Match its painterly parchment, emerald lacquer rollers, metallic gold filigree, warm tactile lighting, near-frontal upright scroll silhouette and generous transparent margins. Subject: Terminal Gate. On the parchment, illustrate a majestic small jade-and-gold gateway with two ivory mahjong tiles at its feet: one tile bearing a single circular pip and the other bearing a three-by-three arrangement of nine circular pips. These two endpoint tiles flank the entrance; a restrained golden glow passes through the gate. Bold simple subject readable at thumbnail scale, ornament subordinate to gate and tiles. One complete scroll centered on square canvas, whole tassel and rollers visible. Genuine transparent background. No letters, words, Arabic numerals, labels, watermark, surrounding scenery or UI. Preserve the game's existing emerald, ivory and warm gold art direction; this is decorative art, localized rules remain outside the image.

### echoing-bamboo

Saved asset: [echoing-bamboo.png](../public/assets/illustrations/table-loop/echoing-bamboo.png)

Use case: stylized-concept. Asset type: individual illustrated Decree scroll for Tensho Mahjong roguelike. Generate a NEW image; Image 1 is a style reference only, not an edit target. Match its polished painterly game-item rendering, green lacquer scroll rollers, aged ivory parchment, metallic gold filigree, delicate tactile material, warm light and crisp silhouette. Subject: Echoing Bamboo. An open magical scroll with a bold elegant illustration of three bamboo stems and a second faint golden echo of the same stems on its parchment; emerald leaves and flowing golden echo arcs, readable at thumbnail scale. One scroll only, front three-quarter view nearly frontal, centered, whole object visible with generous margin. Portrait-like object on square canvas. Genuine transparent background. No letters, words, numbers, watermarks, labels, scenery, or UI. This will be placed alongside localized text in the actual game.

### patient-pair

Saved asset: [patient-pair.png](../public/assets/illustrations/table-loop/patient-pair.png)

Use case: stylized-concept. Asset type: individual illustrated Decree scroll for Tensho Mahjong roguelike. Generate a NEW image; Image 1 is a style reference only, not an edit target. Match its polished painterly game-item rendering, green lacquer scroll rollers, aged ivory parchment, metallic gold filigree, delicate tactile material, warm light and crisp silhouette. Subject: Patient Pair. An open magical scroll with a bold elegant illustration of two matching ivory mahjong tiles bearing the same simple golden circular medallion, resting together beneath a delicate golden hourglass motif on its parchment; subdued jade glow suggesting patient accumulation. Readable at thumbnail scale. One scroll only, front three-quarter view nearly frontal, centered, whole object visible with generous margin. Portrait-like object on square canvas. Genuine transparent background. No letters, words, numbers, watermarks, labels, scenery, or UI. This will be placed alongside localized text in the actual game.

### watch-fire

Saved asset: [watch-fire.png](../public/assets/illustrations/table-loop/watch-fire.png)

Use case: stylized-concept. Asset type: individual illustrated Decree scroll for Tensho Mahjong roguelike. Generate a NEW image; Image 1 is a style reference only, not an edit target. Match its polished painterly game-item rendering, green lacquer scroll rollers, aged ivory parchment, metallic gold filigree, delicate tactile material, warm light and crisp silhouette. Subject: Watch Fire. An open magical scroll with a bold elegant illustration of a single ornate bronze brazier holding a vivid amber flame; two smaller warm sparks spread sideways on its parchment to suggest neighboring groups being lit. Emerald lacquer with warm burnt orange and amber accents; readable at thumbnail scale. One scroll only, front three-quarter view nearly frontal, centered, whole object visible with generous margin. Portrait-like object on square canvas. Genuine transparent background. No letters, words, numbers, watermarks, labels, scenery, or UI. This will be placed alongside localized text in the actual game.
