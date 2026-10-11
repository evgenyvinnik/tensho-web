# Compact Tea House

October 11, 2026. Implementation checkpoint; verification and deployment are
in progress. This is not whole-project completion.

## Player-facing behavior

The opening phone shop used to show only the header, a tall receipt and part of
the tutorial before the fixed Continue bar. Merchandise was entirely below the
opening viewport. The receipt now starts as an illustrated, exact-total
disclosure. Its details retain the settled categories, balance movement, next
challenge and current interest guidance. Opening it never awards money again.
The first merchandise card is now partly visible at 320×568; short phones still
scroll to read its full description and purchase price. This is not a claim that
every offer or its entire card fits in the opening viewport.

Shop guidance starts collapsed; tapping or keyboard activation opens the full
lesson. The build is also compact below 640px, with ownership/capacity visible
and inventory details on demand. Desktop inventory stays expanded. Continue
remains outside the scrolling merchandise pane. Controls retain 44px targets.

There is no automatic timer closing something the player is reading. Opening
details does not dismiss the lesson or alter the run. Rerenders preserve the
current disclosure choice; a new lesson gets its own initial state. Reloading
the shop starts its non-persisted disclosures compact again. Capacity warnings
remain outside the collapsible inventory.

This deliberately revises backlog #11's floating-popup proposal: a compact
in-flow summary is safe on both sizes. A full lesson floated over the now-short
receipt would cover merchandise. The open lesson takes space only by explicit
player choice. Backlog #12's timed collapse is likewise replaced with immediate
compact presentation and user-controlled expansion.

No scoring, payout, purchase, sale, reroll, round progression or save-schema
rules change. All thirteen existing translations are reused.

## Generated illustration

The imagegen skill's built-in tool mode produced a new transparent settlement
ledger, coins and ivory tile in the established green-and-gold painted style.
The tool did not report a model identifier, so this checkpoint does not claim
a specific model version. No CLI/API fallback was used.

- Original retained at `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-de1d67e2-d0a0-42f8-86b1-dfa6af75229a.png`.
- Project asset: `public/assets/illustrations/settlement-ledger.webp`.
- Mechanically converted with `cwebp -q 85 -resize 512 512`; alpha retained.
- 512×512, 48,930 bytes. SHA-256: `6d15dc1eef85a511385de9fad8ffd6e296b32dc9598310bf7885379f3ceebf53`.
- Decorative image has empty alt text; the button carries a localized name and
  exact payout description. It is not the only way to understand the control.

Final generation prompt:

> Use case: stylized-concept. Asset type: transparent game UI illustration for the Tensho mahjong roguelike's round cash-out receipt. Primary request: a small, inviting merchant's settlement ledger with a few old gold coins, a single ivory mahjong tile and a forest-green silk cord, forming one cohesive still life. Style: richly painted East Asian fantasy tabletop game art, warm ivory ceramic, deep forest-green lacquer, softly aged metallic gold ornament, fine restrained brush texture, sculptural readable forms, matching the established premium green-and-gold illustrated game assets. Composition: compact centered three-quarter view, square image, clear silhouette readable at 48px, generous transparent margins, all objects fully inside the canvas. The ledger is closed with a simple gold floral ornament, not writing. Soft warm light and subtle contact shadows confined to the objects. Constraints: genuinely transparent background, no background scene or tabletop, no characters, no lettering, no numerals, no labels, no UI panel, no frame, no watermark. The mahjong tile may have three simple green circles, no text. This is a new illustration, not a screenshot or a redesign of the existing art.

## Verification ledger

Evidence root: `/tmp/tensho-shop-w4rR2S`. An isolated Git-backed source copy
serves browser checks; unrelated `.claude/launch.json` edits are excluded.

- Original desktop/320×568 baseline: 2/2 diagnostic checks passed and screenshots
  retained. These record the old geometry; they do not certify its usability.
- Focused receipt, build and hint component tests: 31/31 passed. The first
  added receipt assertions ran before the entrance animation reached visibility;
  waiting for actual visibility fixes the tests without changing app motion.
- The first browser batch exposed large Spanish/Japanese payout totals wrapping
  the currency suffix. The responsive total typography was corrected.
- The new browser journey initially used incorrect serialized shop/round field
  paths. Those test defects were corrected; they are not gameplay defects.
- A subsequent geometry assertion treated intentionally oversized scroll art as
  overflowing button text. The final assertion checks text bounds and viewport
  containment separately, preserving the existing artwork contract. The first
  batch passed 38/68, the intermediate batch 55/68, and all **68 final native
  checks** pass (`native-verified.log`) against a stable source snapshot.
- Final native coverage includes thirteen-locale desktop/phone purchase,
  reroll, reload and next-round journeys, exact cash-out values, untouched saves
  while inspecting disclosures, desktop-to-phone focus retention, large-value
  receipts, exact-copy/Eternal/Negative sales, pack settlement and tutorial use.
- All **26 production-browser journeys** pass (`production.log`) against the
  built `/tensho-web/` path, without dev-module imports. Desktop and Spanish
  phone screenshots were visually reviewed, including the new asset at its
  actual UI size. The preview initially lacked the deployment base, detected
  by a WebP request returning HTML; it was restarted with the correct base
  before these production tests began.
- Strict TypeScript/production build and all **13 release checks** pass. The
  asset-delivery verifier confirms the new ledger is precached offline; the
  checked payload is 37,942,696 bytes (under its 40 MiB limit). Build retains the
  existing large-chunk warning. Scoped lint has zero errors; the `.mts` fixture
  is ignored by the repository's ESLint configuration.
- The full local regression passes **2,947/2,947 tests in 208 files** with two
  workers (`unit-all.log`, 124.32 seconds), with no timeout rechecks required.
  Source, browser specs, fixture and artwork were compared byte-for-byte with
  the verified snapshot before committing.
- `e2e/fixtures/shop-layout.mts` validates a controlled saved run. A low round
  target, 50 gold and a four-gold offer isolate the real settlement/transaction
  paths; this fixture does not prove a naturally earned win or game balance.

Remaining verification: independent CI and hosted confirmation.
Physical-device testing and newcomer enjoyment remain open.
