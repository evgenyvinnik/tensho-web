# Jade control icon set

## Decree editions and Script alpha repair — October 21, 2026

Four new transparent painted mounts give Foil, Holographic, Polychrome and
Negative Decrees distinct silver-fan, mother-of-pearl crystal, rainbow-cloisonné
peacock and obsidian-crescent treatments. `DecreePortrait` preserves each Decree's
original portrait underneath the mount and a subtle finish. It is shared by
owned cards, their details, shop/pack offers and acquisition reveals. Base copies
remain unchanged; face-down cards reveal no edition; sticker markers remain
separate. Hover sheen respects reduced motion. Exact built-in prompts and source
paths: [edition manifest](decree-edition-art-manifest.json). Delivery:
`public/assets/illustrations/decree-editions/`, four 224px alpha WebP images.

All 21 Script portraits had their rough white cutout fringe audited on dark
green felt and were repaired individually with the built-in image tool. Their
central motifs, lacquer, ropes and colored magical wisps remain recognizable;
the repair is not a CSS blend-mode workaround. The original PNG sources remain
unchanged. Runtime WebP replacements retain their established paths in
`public/assets/illustrations/scripts/`, now 256px with genuine alpha, 354,764 bytes
total (169,378 bytes smaller). Exact edit prompt, source and delivery paths:
[Script repair manifest](script-alpha-repair-manifest.json). Conversion preserves
generated transparency without thresholding or flattening onto a matte.

The delivery inventory explicitly marks these 21 portraits as authored repairs.
`scripts/optimize-illustrations.mjs` validates and preserves their committed
WebPs; it must not regenerate them from the unchanged, white-matted legacy PNGs.
Missing or corrupt repairs fail closed. The optimizer regression test executes
against a disposable fixture, checks byte-for-byte preservation and verifies
that ordinary illustrations still convert. Both CI workflows run this safeguard.
Future re-authoring should use the generated sources recorded in the repair
manifest, then update the checked-in WebPs and review them on dark felt again.

Pairs now resolves to its existing dedicated two-tile badge in both the scoring
art lookup and upgrade token. It no longer uses the Pluto orb as its token image;
Seven Pairs remains distinct.

Visual QA: all 21 repaired Script WebPs viewed together on dark green felt;
Decree editions and Pairs viewed in the actual 320px shop build panel. Browser
pixel checks verify transparent corners on all 25 assets and transparent central
windows in all four edition mounts. No gameplay rules or item identities change.

## Reference-screen extension — October 21, 2026

Seven additional transparent icons replace the older generic document, lock,
lightbulb, information, warning and check artwork and add a dedicated Language
symbol. They share carved jade, ivory, antique gold, vermilion and cloud-scroll
details. Language uses calligraphy leaves/brush; undiscovered Collection entries
use a closed scroll case; locked entries and tables use a traditional padlock;
tips use a lantern; information uses an open scroll; warnings use a talisman.
Original PNG controls are retained for older clients.

The title-screen Codex button and modal Codex overview use the existing jade-bound
book. `PavilionIcon` reuses actual table/ledger/Flower/coin/bell illustrations for
Codex concepts, Collection's Mandates tab and victory markers, avoiding generic
gamepad, graph and puzzle glyphs. The table-picker lock is now 24px rather than
16px. All existing localized labels and locked/discovery behavior are preserved.

Delivery files: `public/assets/illustrations/controls-jade/`, seven 128px WebP
images. Exact built-in generation prompts, original paths and conversion command
are recorded in [the extension manifest](jade-reference-icons-manifest.json).
The built-in image-generation tool does not expose its model identifier.

The existing preview on port 4294 serves a frozen older build at
`/private/tmp/tensho-pavilion-final.kws7Ye`; it is intentionally not overwritten.
Current-source browser verification and the new preview are recorded in the
implementation ledger.

Five East Asian-inspired control illustrations, generated with the built-in image-generation tool. The tool does not expose its model identifier. Carved jade, ivory, antique gold and vermilion match Tensho's palette while retaining familiar functional silhouettes.

## Delivery and integration

- New 128×128 transparent WebP siblings in `public/assets/illustrations/controls-jade/`; the original PNG controls are retained for older clients and the original 373-image provenance manifest remains unchanged.
- `generatedArtPaths.controls` routes sound, settings, exit and help to the new assets and adds a distinct `sound-off` control (40 control IDs total).
- The main RunHeader now uses the generated help, exit and settings icons at 28px within its existing minimum 44px buttons. Shared controls adopt the new assets everywhere they are already used, including the menu sound toggle and shop settings.
- Muted sound uses one dedicated image instead of stacking a small prohibition symbol on the speaker.
- All illustrations are decorative (`alt=""`, `aria-hidden="true"`). Localized button names, keyboard behavior and control actions are unchanged.
- Delivery conversion: `cwebp -q 84 -m 6 -resize 128 128 SOURCE -o DESTINATION`. Alpha is preserved. Combined delivery size: 27,860 bytes. The existing offline-cache limit is unchanged.

## Exact prompts and source paths

Verification: 29 focused Vitest tests, TypeScript build, scoped ESLint, and six Playwright cases passed (Chromium and touch-enabled mobile Chrome at 320, 390 and 1280px). The browser cases decode each header image, verify 44px targets and in-viewport placement, toggle sound on/off, and exercise help, exit cancellation and settings navigation. Production build and offline delivery verification passed: 38,682,231 precached bytes, below the unchanged 40 MiB cap. Visually reviewed the delivered icons and the 320px touch-screen header.

### sound

- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-9ba4f5a9-7f14-4084-8ef2-ba31ad70ddef.png`
- Runtime: `public/assets/illustrations/controls-jade/sound.webp`
- Transparent background: true.

```text
Use case: stylized-concept
Asset type: one transparent painted UI icon for Tensho, a Mahjong roguelike.
Primary request: A sound-on speaker icon: a bold ivory horn silhouette with emerald jade inset and antique-gold edging, facing right, with two thick golden sound-wave arcs. Restrained carved Chinese cloud-scroll detail on the horn only. No stand or extra objects.
Style: a coordinated premium East Asian-inspired game icon set, carved emerald jade, warm ivory, antique gold and restrained vermilion lacquer. Simplified hand-painted sculptural illustration; broad highlights, crisp silhouette, very little fine detail.
Composition: single icon centered on square genuinely transparent canvas; frontal view, complete silhouette within 10% padding. All structural strokes thick enough to read at 28–32 pixels on a dark green game screen. Emphasize recognizable control meaning over ornament.
Constraints: no background, floor, shadow outside silhouette, enclosing medallion, tiny hanging ornaments, text labels, watermark, photorealism or thin hairlines. Only the requested functional symbol. All empty areas genuinely transparent.
```

### sound-off

- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-c9bf89b4-e1ae-412a-aef8-23aa3b433d8b.png`
- Runtime: `public/assets/illustrations/controls-jade/sound-off.webp`
- Transparent background: true.

```text
Use case: stylized-concept
Asset type: one transparent painted UI icon for Tensho, a Mahjong roguelike.
Primary request: A sound-off speaker icon: a bold ivory horn silhouette with emerald jade inset and antique-gold edging, facing right, crossed by one thick vermilion diagonal mute slash with ivory edging. No sound waves. Restrained carved Chinese cloud-scroll detail on the horn only. No stand or extra objects.
Style: a coordinated premium East Asian-inspired game icon set, carved emerald jade, warm ivory, antique gold and restrained vermilion lacquer. Simplified hand-painted sculptural illustration; broad highlights, crisp silhouette, very little fine detail.
Composition: single icon centered on square genuinely transparent canvas; frontal view, complete silhouette within 10% padding. All structural strokes thick enough to read at 28–32 pixels on a dark green game screen. Emphasize recognizable control meaning over ornament.
Constraints: no background, floor, shadow outside silhouette, enclosing medallion, tiny hanging ornaments, text labels, watermark, photorealism or thin hairlines. Only the requested functional symbol. All empty areas genuinely transparent.
```

### settings

- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-f759de98-930a-491a-8b04-1555672ffc76.png`
- Runtime: `public/assets/illustrations/controls-jade/settings.webp`
- Transparent background: true.

```text
Use case: stylized-concept
Asset type: one transparent painted UI icon for Tensho, a Mahjong roguelike.
Primary request: A settings icon: one thick eight-toothed jade cog wheel with a clearly open circular center, antique-gold bevels and restrained carved Chinese cloud-scroll detail on the jade. Instantly recognizable as a gear, not a flower or coin.
Style: a coordinated premium East Asian-inspired game icon set, carved emerald jade, warm ivory, antique gold and restrained vermilion lacquer. Simplified hand-painted sculptural illustration; broad highlights, crisp silhouette, very little fine detail.
Composition: single icon centered on square genuinely transparent canvas; frontal view, complete silhouette within 10% padding. All structural strokes thick enough to read at 28–32 pixels on a dark green game screen. Emphasize recognizable control meaning over ornament.
Constraints: no background, floor, shadow outside silhouette, enclosing medallion, tiny hanging ornaments, text labels, watermark, photorealism or thin hairlines. Only the requested functional symbol. All empty areas genuinely transparent.
```

### exit

- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-259af9fd-f567-4b0f-90e0-cc76386ef122.png`
- Runtime: `public/assets/illustrations/controls-jade/exit.webp`
- Transparent background: true.

```text
Use case: stylized-concept
Asset type: one transparent painted UI icon for Tensho, a Mahjong roguelike.
Primary request: An exit icon: a compact vermilion lacquer doorway with an understated East Asian curved lintel and antique-gold trim. A single large ivory-and-gold arrow points RIGHT out through the doorway. The arrow dominates, unmistakable exit sign, no scenery or people.
Style: a coordinated premium East Asian-inspired game icon set, carved emerald jade, warm ivory, antique gold and restrained vermilion lacquer. Simplified hand-painted sculptural illustration; broad highlights, crisp silhouette, very little fine detail.
Composition: single icon centered on square genuinely transparent canvas; frontal view, complete silhouette within 10% padding. All structural strokes thick enough to read at 28–32 pixels on a dark green game screen. Emphasize recognizable control meaning over ornament.
Constraints: no background, floor, shadow outside silhouette, enclosing medallion, tiny hanging ornaments, text labels, watermark, photorealism or thin hairlines. Only the requested functional symbol. All empty areas genuinely transparent.
```

### help

- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-d5ab639c-9028-4554-82fc-da17c7a8692c.png`
- Runtime: `public/assets/illustrations/controls-jade/help.webp`
- Transparent background: true.

```text
Use case: stylized-concept
Asset type: one transparent painted UI icon for Tensho, a Mahjong roguelike.
Primary request: A help icon: one large thick upright ivory QUESTION MARK (?) with antique-gold bevels and a small jade dot, embellished with very restrained East Asian carved cloud-scroll detail. The question mark itself is the entire icon, instantly readable; no plaque, frame, book or extra symbols.
Style: a coordinated premium East Asian-inspired game icon set, carved emerald jade, warm ivory, antique gold and restrained vermilion lacquer. Simplified hand-painted sculptural illustration; broad highlights, crisp silhouette, very little fine detail.
Composition: single icon centered on square genuinely transparent canvas; frontal view, complete silhouette within 10% padding. All structural strokes thick enough to read at 28–32 pixels on a dark green game screen. Emphasize recognizable control meaning over ornament.
Constraints: no background, floor, shadow outside silhouette, enclosing medallion, tiny hanging ornaments, text labels, watermark, photorealism or thin hairlines. Only the requested functional symbol. All empty areas genuinely transparent.
```


