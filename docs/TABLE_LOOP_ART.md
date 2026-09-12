# Table Loop artwork — September 9, 2026

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
