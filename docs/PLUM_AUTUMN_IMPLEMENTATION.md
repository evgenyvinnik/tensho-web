# Plum recovers river tiles during Autumn

October 7, 2026 — implemented locally; release verification pending.

The user's delegated authority resolves discard-pool recursion as one existing
matching river tile per paid physical sequence, newest first. Recovery happens
only on continuing plays, after normal refill and Orchid extras, before the
single draw-cycle Mandate reaction. See [the complete rule](RULE_RESOLUTION.md).
No tile copy, scoring action, permanent capacity or saved reward credit is added.

## Connected paths

Both complete-hand and tactical payment use the actual scored decomposition.
Planning reads the pre-play river and selected physical faces, before scoring.
Temporary transmutations and virtual completions cannot supply physical members.
Winter's legal gapped sequences qualify. Wild matching cannot bypass the
physical suit/rank requirement.

Recovery moves existing identities, retaining enhancements/seals/editions.
It does not count as a draw or hide a previously public tile. Ordinary draws
still determine the last-drawn identity and trigger Hook/Bell/Fish once; those
Mandates retain their normal rights over the resulting rack. Serpent draws
three ordinary replacements. Empty walls can still permit a river recovery.
Round-ending payment skips both refill and recovery, including held-Gold income.

The optional inspector displays a generated Plum portrait, with localized
post-recovery feedback in all thirteen locales. Normal Autumn no longer carries
an unfinished-power warning; Frostbite still does. The explanation resets on
load/round start, while actual recovered tiles persist in the existing save.
This is not a claim of native-speaker review, organic balance or player enjoyment.

## Verification ledger

Evidence directory: `/tmp/tensho-plum-Z8UIU4`.

- Initial engine checks: 46/47 pass. The complete-hand fixture contained four
  copies of 1–2–3, whose first valid paid decomposition uses triplets and only
  one sequence. Expecting three recoveries contradicted the selected rule.
  Replace the fixture with an unambiguous four-sequence hand; do not change the
  game's grouping to make the test pass.
- Code review caught that generic Tile.matches accepts Wild suit substitution.
  Recovery now explicitly compares physical suit/rank, with a regression check.
- Corrected initial engine checks pass 47/47; TypeScript passes.
- Extended checks pass **81/81** in four files, including 26 Plum engine cases
  and 20 inspector cases.
- Native and Pages-base production journeys each pass **4/4**, covering English
  and Spanish, desktop and 320×568 touch. Real UI staging/payment matches the
  forecast, moves the exact river tile, preserves resource costs and reloads
  exactly. A later nonmatching play restores ordinary capacity, and next-round
  cleanup removes Autumn. Inspector checks decode the 512px illustration and
  verify localized, read-only, transient recovery feedback. Spanish phone
  screenshot reviewed: the illustration and wrapped feedback fit the scrollable
  inspector. Production replays the captured v2 envelope without source imports.
- Initial broad regression: **1,896/1,897**, with one five-second timeout in the
  existing balance CLI contract. Its unchanged isolated recheck passes **26/26**.
  No deadline or assertion was relaxed. The full release-style two-worker
  recheck passes **1,897/1,897 in 158 files**.
- TypeScript, Pages build and all **13** release checks pass. Lint has zero
  errors and 211 existing warnings. Independent CI and hosted checks pending.

Remaining project requirements include Flower mutation/catalyst acquisition,
full Frostbite semantics, item-rule reconciliation, and human newcomer/fun
validation. This checkpoint does not complete the entire implementation goal.

## Artwork provenance

Mode: built-in image generation using the imagegen skill. The tool exposes no
exact model selector; no unverified latest-model claim is made.

- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-cd0afc69-8389-44a3-b017-72c9d82c7bf2.png`.
- Runtime: `public/assets/illustrations/plum-bloom.webp`, 512×512 with alpha,
  34,356 bytes, mechanically converted using `cwebp -q 85 -resize 512 512`.
- SHA-256: `86580fcddf7d605eca8cf771b9623469d62219a5d44c219a5989b7eb30a6a862`.

Exact generation prompt:

> Use case: stylized-concept. Asset type: transparent Plum Flower portrait for Tensho, an East Asian mahjong roguelike. Primary request: a single small sculptural spray of crimson plum blossoms with warm ivory stamens on a gnarled dark woody branch, emerging from a slender dark-jade ceramic bud vase with a restrained antique-gold rim and subtle botanical gilding. Premium hand-painted fantasy inventory illustration, tactile worn glaze, delicate five-petaled blossoms, warm gold highlights, matching an established forest-green, ivory and antique-gold botanical game palette. Composition: square canvas, complete centered object in slight three-quarter view, clear compact silhouette at 48 pixels, generous transparent margins, no clipping. Background: genuinely transparent alpha, no ground plane or external drop shadow. Constraints: no text, letters, numerals, calligraphy, labels, mahjong tile faces, people, scenery, frame, logo or watermark. A finished miniature inventory portrait, not a UI mockup.
