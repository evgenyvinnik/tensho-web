# Season and ending art expansion

This focused art pass adds four corrupted-Season portraits, two ending scenes, and one Pairs-family badge. No gameplay rules or translation strings change. Existing originals remain intact.

## Integration

- `getSeasonArt` accepts a Season object, selects its corruption portrait only while corrupted, and preserves the healthy-season fallback. Both the collectible rail and acquisition reveal use it.
- Corrupted Seasons are active hazards, not inactive items: their art stays in color. Suppressed Flowers still dim.
- Fresh victory and defeat use distinct scenes; completed Endless runs retain `journey-result.webp`.
- Pairs uses two identical, existing Two of Dots faces. Pluto retains its Orb portrait; Seven Pairs retains its own family image.
- All new art is decorative alongside localized UI labels, never a substitute for rules or accessible names. No text is baked into images.

## Delivery and generation provenance

Mode: built-in image generation, one reference-based edit per illustration. The tool does not expose a model identifier. Original generated PNGs are retained at the paths below; the optimized runtime assets are saved in this repository.

Season portraits: transparent 256×256 WebP, `cwebp -q 80 -m 6 -resize 256 256`. Result banners: opaque 1200×400 WebP, `cwebp -q 72 -m 6 -resize 1200 400`. Runtime artwork is precached by the existing PWA rules; the 40 MiB budget is unchanged.

### monsoon

- Reference: `public/assets/illustrations/spring-blossom.webp`
- Generated original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-01afbf26-3b86-4a99-b431-45a9fb8b1ce0.png`
- Saved runtime asset: `public/assets/illustrations/seasons/monsoon.webp`
- Transparent background requested: true

Exact prompt:

```text
Use case: lighting-weather
Asset type: transparent collectible illustration for Tensho.
Input image 1: edit target and established style reference.
Primary request: Make the Spring bonsai into Monsoon: preserve the recognizable blossom bonsai and emerald gold pot, but bend the branches under heavy rain, with dripping blue water, storm-tossed sparse pink blossoms and pooled water at the pot. Strong water silhouette.
Preserve: the reference's hand-painted emerald, ivory and antique-gold fantasy illustration style, material texture and object identity.
Composition: one centered complete object on genuinely transparent background, square canvas, 10% clear padding, bold readable silhouette at 48px.
Constraints: no text, letters, UI, border, watermark or new characters. No scenery, background color, outer glow or cast shadow beyond the object.
```

### drought

- Reference: `public/assets/illustrations/summer-fan.webp`
- Generated original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-fb6678db-f502-4c62-b9e2-37b869cd8418.png`
- Saved runtime asset: `public/assets/illustrations/seasons/drought.webp`
- Transparent background requested: true

Exact prompt:

```text
Use case: lighting-weather
Asset type: transparent collectible illustration for Tensho.
Input image 1: edit target and established style reference.
Primary request: Make the Summer fan into Drought: preserve its recognizable folding-fan silhouette and green gold ribs, but show cracked parched parchment, withered bamboo painting, and a dry amber sun. Distinct ragged dry edges, not simply a recolor.
Preserve: the reference's hand-painted emerald, ivory and antique-gold fantasy illustration style, material texture and object identity.
Composition: one centered complete object on genuinely transparent background, square canvas, 10% clear padding, bold readable silhouette at 48px.
Constraints: no text, letters, UI, border, watermark or new characters. No scenery, background color, outer glow or cast shadow beyond the object.
```

### decay

- Reference: `public/assets/illustrations/autumn-maple.webp`
- Generated original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-abd4afb9-4031-4ccf-bda3-b241994e47a4.png`
- Saved runtime asset: `public/assets/illustrations/seasons/decay.webp`
- Transparent background requested: true

Exact prompt:

```text
Use case: lighting-weather
Asset type: transparent collectible illustration for Tensho.
Input image 1: edit target and established style reference.
Primary request: Make Autumn maple into Decay: preserve the maple branch and emerald gold bowl, but show visibly curled withering leaves with holes and dark plum-brown patches, drooping branches and a few fallen leaves. Elegant and readable rather than grotesque.
Preserve: the reference's hand-painted emerald, ivory and antique-gold fantasy illustration style, material texture and object identity.
Composition: one centered complete object on genuinely transparent background, square canvas, 10% clear padding, bold readable silhouette at 48px.
Constraints: no text, letters, UI, border, watermark or new characters. No scenery, background color, outer glow or cast shadow beyond the object.
```

### frostbite

- Reference: `public/assets/illustrations/winter-pine.webp`
- Generated original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-99e1d6fc-b673-446b-bf28-bad8ae862c63.png`
- Saved runtime asset: `public/assets/illustrations/seasons/frostbite.webp`
- Transparent background requested: true

Exact prompt:

```text
Use case: lighting-weather
Asset type: transparent collectible illustration for Tensho.
Input image 1: edit target and established style reference.
Primary request: Make Winter pine into Frostbite: preserve the pine branch silhouette, but encase its needles in large angular translucent blue ice shards and long icicles. Clearly different from ordinary fluffy snow.
Preserve: the reference's hand-painted emerald, ivory and antique-gold fantasy illustration style, material texture and object identity.
Composition: one centered complete object on genuinely transparent background, square canvas, 10% clear padding, bold readable silhouette at 48px.
Constraints: no text, letters, UI, border, watermark or new characters. No scenery, background color, outer glow or cast shadow beyond the object.
```

### victory

- Reference: `public/assets/illustrations/journey-result.webp`
- Generated original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-d59a287b-cff5-4f1f-8624-c5c1e5a6de31.png`
- Saved runtime asset: `public/assets/illustrations/results/victory.webp`
- Transparent background requested: false

Exact prompt:

```text
Use case: lighting-weather
Asset type: wide game ending banner for Tensho.
Input image 1: edit target and established style reference.
Primary request: Create a victorious ending variant of this exact world: the emerald mahjong table and tea remain, with neatly settled ivory tiles, a softly glowing lantern, and warm golden sunrise over the mountain landscape. Uplifting, calm accomplishment.
Preserve: the reference's hand-painted emerald, ivory and antique-gold fantasy illustration style, material texture and object identity.
Composition: wide 3:1 landscape composition, important table/lantern details in central area, all content within banner, painterly depth.
Constraints: no text, letters, UI, border, watermark or new characters. No embedded captions or graphic overlays.
```

### defeat

- Reference: `public/assets/illustrations/journey-result.webp`
- Generated original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-30034751-fff2-4f2a-aa3e-48f2e38d1e2e.png`
- Saved runtime asset: `public/assets/illustrations/results/defeat.webp`
- Transparent background requested: false

Exact prompt:

```text
Use case: lighting-weather
Asset type: wide game ending banner for Tensho.
Input image 1: edit target and established style reference.
Primary request: Create a defeated-run ending variant of this exact world: the emerald mahjong table and tea remain, with a small unfinished arrangement of ivory tiles, an extinguished lantern, gentle rain outside and cool mist over the mountains. Reflective and inviting another try, never punitive.
Preserve: the reference's hand-painted emerald, ivory and antique-gold fantasy illustration style, material texture and object identity.
Composition: wide 3:1 landscape composition, important table/lantern details in central area, all content within banner, painterly depth.
Constraints: no text, letters, UI, border, watermark or new characters. No embedded captions or graphic overlays.
```

## Pairs badge composition

Saved asset: `public/assets/illustrations/upgrades/pairs.webp` (256×256, transparent).
Source: `public/assets/Mahjong/file/png/tiles/Dots (2).png`, used twice without changing its symbols. Deterministic ImageMagick composition, not generated tile lettering:

```sh
magick -size 256x256 xc:none -fill '#153f32' -stroke '#c8b273' -strokewidth 7 -draw 'circle 128,128 128,14' -stroke '#776035' -strokewidth 2 -fill none -draw 'circle 128,128 128,25' \( 'public/assets/Mahjong/file/png/tiles/Dots (2).png' -resize 91x114 \) -geometry +31+71 -composite \( 'public/assets/Mahjong/file/png/tiles/Dots (2).png' -resize 91x114 \) -geometry +134+71 -composite -quality 90 public/assets/illustrations/upgrades/pairs.webp
```

## Verification

- Unit coverage: healthy/corrupted mapping, fallback handling, transparent delivery, dimensions, distinct Pairs/Pluto/Seven Pairs identities, three unique result scenes.
- Browser coverage: `e2e/art-readability.spec.ts` exercises Season reveal art and detail panels, spending an actual Pairs Orb, and all three result outcomes at 320, 390, and 1280px widths. Fixtures deliberately author game state; they do not assess organic run balance.
- Existing accessible labels, hover/click/keyboard popovers, level badges, and minimum 44px token targets are retained.

