# Illustrated Showdown rules

October 3, 2026 local time. This adds visual identities and missing rule copy;
it does not change boss mechanics, save formats or balance.

## Implementation and boundaries

Amber Acorn, Verdant Leaf, Violet Vessel and Crimson Heart join the existing
Cerulean Bell illustration. A shared, own-key-checked asset resolver supplies
the current-boss badge and its read-only rule dialog. Unknown bosses receive
no unrelated fallback portrait. Text remains the accessible name and description;
decorative artwork has empty alt text. The existing tap/click, keyboard dismissal
and focus-return behavior is preserved.

Italian, Russian, Thai, Filipino and Turkish previously lacked these four boss
names/descriptions. Twenty entries now use the established `mandates.items`
namespace. All thirteen supported locales have all five Showdown entries.
Automated coverage establishes key completeness and rendering, not native-speaker
approval. Existing eight locales and Cerulean Bell wording are unchanged.

The engine intentionally persists `selectedTileIds`; the board's temporary staging
does not restore after reload. Rule inspection must change neither. Browser tests
assert the complete saved snapshot before/after inspection and reload, including
resources, RNG, selection and boss state. No engine field is excluded to make the
comparison pass.

The controlled browser fixtures put each Showdown into seed 7's first Boss round.
They use the normal 2× target, or Violet Vessel's 6× target, at Stake 1. This makes
the surfaces testable; it is not proof of organically reaching Act 8 or new
evidence of boss balance. Production continuation checks commit a real two-tile
play and reload its exact saved result. They do not require positive points from
Verdant Leaf's deliberately debuffed tiles.

## Generated assets and prompt set

Mode: **built-in image generation**, four separate new-image requests with
`transparent_background: true`; no CLI fallback or existing-image edits.
The built-in tool exposes no model selector or verified model identifier, so
this record does not claim a particular named model. The imagegen skill guided
transparent, project-local deliverables and inspection before integration.

Each final file is a 512×512 alpha WebP, mechanically resized/compressed with
`cwebp -q 85 -resize 512 512`. All four together occupy **197,692 bytes**.
The original generated PNGs are preserved outside the repo; runtime references
point only to the checked-in assets below.

| Boss | Final repository path | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Amber Acorn | `public/assets/illustrations/amber-acorn.webp` | 51,330 | `7c68d3d4b28bbb7bdc203f1f762db686f01ab3b2f6db6336a6d426267a84451b` |
| Verdant Leaf | `public/assets/illustrations/verdant-leaf.webp` | 42,366 | `8cbd7d2e5816b275b2887742ff74d004ecefdb47d9cad57f71cdef0fa597bc30` |
| Violet Vessel | `public/assets/illustrations/violet-vessel.webp` | 52,670 | `63c09cb0101eb268da91df8d14383c4ed3dc35b7b9c3a3a38bc2fd1c845e8983` |
| Crimson Heart | `public/assets/illustrations/crimson-heart.webp` | 51,326 | `aabdd8c61cb96d820f20cb5f921d4a4feff24cdc04feced6e945992ad7450990` |

Each final prompt is the following shared text with `{SUBJECT}` replaced by the
corresponding exact subject below:

> Use case: stylized-concept. Asset type: small boss illustration for Tensho mahjong roguelike. Primary request: {SUBJECT}. Style: premium hand-painted East Asian fantasy board-game object illustration matching an ornate blue-and-gold temple bell already in the UI; softly painted material shading, dimensional gilded detail, warm subtle highlights, not flat vector or emoji. Composition: one complete centered isolated object, square canvas, generous transparent padding, clear bold silhouette readable at 32–64 pixels. Genuine transparent alpha background. No scene, floor, pedestal, frame, scroll, tiles, humans, lettering, numbers, calligraphy, logo or watermark.

- Amber Acorn: `a single amber acorn talisman, warm translucent honey-amber nut with an ornate antique-gold textured cap and small curling stem`
- Verdant Leaf: `a single graceful pointed verdant leaf talisman, rich emerald-green carved jade leaf with delicate antique-gold vein inlay and a short curved gold stem`
- Violet Vessel: `a single elegant violet ceramic ritual vessel, rounded traditional East Asian vase with a narrow neck, plum-purple glaze, antique-gold rim and restrained scrolling gold ornament`
- Crimson Heart: `a single stylized heart-shaped crimson ruby talisman, deep red polished gemstone with a restrained antique-gold filigree rim; a symbolic jewel heart, not anatomical`

Original PNG directory:
`/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/`.
Files respectively: `exec-e71b5cde-6fb6-41d4-bbbd-e915139bd101.png`,
`exec-30ef2c0d-c8d1-4308-8158-1dd8263d48ee.png`,
`exec-b361eb34-fac2-4464-9c87-43b8b15653c4.png`,
`exec-95988ba6-50f9-4a23-ae8f-0e7af6b6b24a.png`.

## Verification ledger

Evidence root: `/tmp/tensho-showdown-jK2iyR`.

- TypeScript, targeted lint and focused tests pass: **66/66**.
- Full unit suite: **1,613/1,613 across 137 files**, 231.97 seconds.
- Pages-base production build and **13/13 release checks** pass. The PWA lists
  412 entries / 69,540.82 KiB; no startup-performance improvement is claimed.
- Retained initial setup failures: wrong rich-definition import, unsupported
  `Object.hasOwn` for the ES2020 target, and a Playwright-only query option used
  in a Testing Library test. These were corrected before the clean runs.
- Two retained browser batches each passed all six Bell checks but failed the
  sixteen new art checks. Their traces identified test-baseline errors: first
  comparing against the pre-selection save, then expecting saved engine selection
  to clear on reload. Existing persistence unit tests and staging documentation
  confirm the proper contract. The final assertions compare complete staged
  snapshots while separately requiring empty visual staging after reload.

- Final native browser batch passes **22/22**, 2.6 minutes, no retries: all four
  new bosses in English/Russian on desktop and 320px touch, plus six unchanged
  Cerulean Bell regression cases. Screenshots confirm readable portrait/rules
  and available dismissal controls on desktop and phone.

- Production Pages-base verification passes **24/24 isolated browser journeys**:
  four bosses × English desktop and Italian/Russian/Thai/Filipino/Turkish 320px
  touch. Each checks localized accessible rules, decoded art and exact served
  SHA-256, horizontal fit, read-only inspection, Escape/focus, unchanged reload,
  real two-tile play, one spent play and exact post-play reload. Zero page errors.
  The production Thai Leaf popup was also visually inspected.

Publication results will be recorded after completion.
No whole-project completion or human-fun claim follows from this artwork slice.
