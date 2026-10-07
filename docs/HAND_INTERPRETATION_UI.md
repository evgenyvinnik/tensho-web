# Decree-assisted hands: explanation and readiness

October 6, 2026. Follow-up to the scoring correction in
[Celestial Wildcard implementation](CELESTIAL_WILDCARD_IMPLEMENTATION.md).

## Player-facing behavior

The rack readiness badge now checks the engine's active hand rules before
falling back to natural shanten. A naturally incomplete but Decree-completed
hand reads “Decree-assisted hand” rather than Tenpai. Shape recognition does not
override boss restrictions, remaining plays, or the shared action validator.

An optional native disclosure, “Why this hand works”, sits beside the forecast.
It shows the physical and interpreted tile faces with localized names, identifies
a virtual completion and explains its already-applied half-score penalty. It
never stages, spends, draws or rewrites a tile. Natural unmodified declarations
do not need a disclosure; other structural exceptions use a generic active-rule
explanation. Reality Warp explains its all-wild interpretation. This is not a
breakdown of every downstream scoring modifier.

Face-down selections suppress the engine inspection and the entire forecast UI;
invalid IDs and duplicated selections yield no explanation. Native details work
with keyboard and touch, and start closed. Opening them does not mutate saves.
All eight explanation strings and placeholders exist in all thirteen locales;
native-speaker editorial review remains outstanding.

The optional panel names the active interpretation without naming a concealed
Decree. Hidden owned cards still conceal their portrait and inspection text.

## New artwork and provenance

- Asset: `public/assets/illustrations/decrees/celestial-wildcard.webp`.
- Built-in image generation tool, October 6. The tool exposes no model selector
  or verifiable model ID; no claim of a specific latest model is made.
- Original retained at
  `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-6bcd94ce-afc2-4c02-be9e-58a0374feb20.png`.
- Inspected generated original and optimized asset. Resized/encoded with
  `cwebp -q 85 -resize 512 512`; transparent alpha preserved. 512 × 512,
  41,450 bytes, SHA-256
  `cd59c84ac4bbd89e2091767c3d7cf0eef8f6c4e932562729e5082de3359703ee`.
- Shared Decree portrait registry supplies shop, owned-build and discovered
  Archive consumers. Existing portraits are not overwritten.

### Final generation prompt

Use case: stylized-concept. Asset type: Celestial Wildcard Decree portrait for
Tensho, an illustrated mahjong roguelike. Create a brand-new square transparent
cutout, centered with generous clear margins. Subject: one substantial ivory
mahjong tile reflected in an ornate oval dark-jade and antique-gold celestial
mirror; the physical tile bears three round red-and-jade pips while its reflection
bears three slender bamboo marks, suggesting one tile impersonating another. A
few restrained tiny gold stars around the mirror, no extra tiles. Hand-painted
premium storybook game inventory art, softly dimensional, delicate brush texture,
warm parchment ivory, deep forest jade, restrained cinnabar, metallic old gold;
crisp readable silhouette at 48px. Match the project's elegant carved jade, ivory
and gold collectible-object aesthetic, not a flat icon. No text, no letters, no
numbers, no logos, no watermark, no scenery, no frame around the image. Genuine
transparent alpha background; keep all object edges comfortably inside the canvas.

### Shanten Clemency portrait

A second built-in generated portrait uses the same transparent collectible-object
style, now shared by the same registry consumers:
`public/assets/illustrations/decrees/shanten-clemency.webp`. The original is retained
at `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-518d5f48-c7e0-4dd3-92df-71e81aabad5a.png`.
Both original and optimized result were inspected. Same encoding settings,
512 × 512 with alpha, 44,658 bytes; SHA-256
`f5ae58365c23c13ce890c17355f054344b1e157f5ab4b670211658dd4f6bd3b3`.

Final prompt: Use case: stylized-concept. Asset type: Shanten Clemency Decree
portrait for Tensho, an illustrated mahjong roguelike. Create a new square
transparent cutout. Subject: an elegant partly unrolled ivory parchment decree
with carved dark-jade scroll ends and antique-gold trim. At its center is one
empty tile-shaped recess outlined in gold, with a single translucent luminous
jade mahjong tile gently hovering into it, symbolizing a virtual tile completing
a hand. A small gold half-disc seal attached to the parchment suggests the
half-score cost; no numbers or writing. Premium hand-painted storybook
collectible-object art, softly dimensional, delicate brush texture, warm parchment
ivory, deep forest jade, restrained cinnabar and metallic old gold. Centered
compact silhouette, generous clear margins, readable at 48px. No additional
tiles, no characters, no lettering, no logos, no watermark, no background scenery,
no enclosing image border. Actual transparent alpha background. All objects
comfortably inside canvas.

## Local verification and release gate

Evidence directory: `/tmp/tensho-hand-explanation-XTMhy3`.
The first focused run passed 43/45: one expected tile name omitted the localized
“of”, and one test changed language without loading its lazy translation bundle.
Both test setup/assertion mistakes were corrected. The final focused run passes
83/83, including engine inspections, component behavior, locale integrity,
controller and asset tests. TypeScript passes. Original failure log is retained.

The full unit run has 1,685 passes and one CLI subprocess timeout
(`spawnSync bun ETIMEDOUT` in the structural simulation contract). The unchanged
CLI recheck plus the first portrait-concealment addition pass 42/42; the final
artwork/UI/engine/locale focused run passes 101/101. No test deadlines were raised.
The first lint pass reported a DecreeBar test parse error while that file was
being edited; stable-source Vitest and the full lint recheck pass (zero lint
errors, 211 existing warnings). The failure log remains; this records timing,
not proof of the parse error's cause.

Both native browser batches pass 18/18 without retries. The final batch includes
both portrait assets, ordinary hands, Seven Pairs, Thirteen Orphans, Wildcard plus
Clemency and the existing concealed-readiness regression, in English/Spanish on
desktop/320px touch. Desktop uses keyboard activation of the disclosure; mobile
uses touch. Open/collapse does not mutate the saved state. Exact localized
forecast, staging without spending, payment, physical discards, Orb counters and
exact reload are checked. Screenshots of desktop and phone details were inspected.

All 13 release checks and the Pages-base production build pass. The built app
passes all 16 independent saved-game journeys without development imports, with
both images decoded, no page errors or horizontal document overflow, and the
same disclosure/save/payment assertions. The PWA precache is 416 entries /
69,797.94 KiB; the existing large-chunk and Browserslist warnings remain. The
independent CI test gate must pass before automatic deployment.

The browser deals and Flower eligibility are controlled fixtures, not evidence
of organic acquisition or human fun. Broader Season/Flower/design and human
review gaps in the implementation ledger remain open.

## Published verification

- Implementation commit: `8b06109f28d666a8ae3048248ca611cf89a5fb7a`.
- Release: **v1.0.261007-1** (UTC release date; October 6 locally).
- Built commit, public `release.json` and remote tag agree on
  `f18778be1aba4cc34596485f4922445be599cd6f`.
- [Independent CI](https://github.com/evgenyvinnik/tensho-web/actions/runs/37571196279)
  passes **1,690 tests in 145 files**, all 13 release checks, build and deployment.
  The earlier local timeout and lint log are retained, not relabeled as passes.
- All **16 hosted desktop/touch journeys pass**, repeating the production
  disclosure, artwork, staging, payment and exact reload assertions. Both hosted
  image SHA-256 hashes match the assets recorded above. `ci.log`, `hosted.log`
  and hosted screenshots retain the results in the evidence directory.
- Owned ports 4196/4197 were stopped after local verification. The pre-existing
  port 4173 server was not modified. Existing workflow/runner migration warnings
  are unchanged and did not prevent deployment.
