# Flower mutations and rebloom

October 7, 2026 — published and verified in **v1.0.261007-13**.

The delegated rules are recorded in [the decision log](RULE_RESOLUTION.md).
This checkpoint covers all four mutations and actual duplicate-draw acquisition;
it does not declare the remaining catalyst/item requirements complete.

## Connected paths

- Plum single-tile overlap is in tactical parsing, complete validation,
  enlarged-rack subset selection and the authoritative paid/forecast pipeline.
  Selected physical tiles remain unique for tile scoring and removal.
- Bamboo endpoint anchoring is shared by tactical/full shape search, subset
  selection and coach candidates. Ordinary rank-specific Yaku remain physical.
- Orchid's weighted Honor count is shared by Flower percentages, Decree Honor
  thresholds and Honor-count scaling. It does not duplicate physical scoring or
  retrigger targets.
- Chrysanthemum replaces its own ordinary bonus with per-meld exponential
  scaling on concealed plays, without multiplying pairs or erasing other Flowers.
- The existing four-type Bamboo Mat achievement supplies eligibility at new-run
  creation. FlowerSystem saves that eligibility and activates a type only when
  its real duplicate is collected. Existing save schemas accept an optional
  boolean; old snapshots do not gain awakenings or read newer profile state.
- The optional Flora inspector explains eligibility and awakened rules in all
  thirteen locales, suppressing stale linear Chrysanthemum copy once awakened.
  This does not claim native-speaker review or browser layout verification yet.

## Evidence so far

- Initial focused batch: 61/63. One fixture assumed every suited tile was worth
  ten points; terminals are ten and ordinary simples five. The other mutated
  its own validation array by appending a spare. Corrected those assertions;
  do not change scoring to satisfy a wrong expectation.
- Expanded core batch: **124/124 across seven files**, including the new fourteen
  mutation cases, existing complete selection, tactical parser, Drought,
  Winter, Plum/Autumn and Orchid/Spring cases.
- Initial acquisition batch: 26/29. Its tiny live wall put future test Flowers
  at the tail, where ordinary dead-wall replenishment legitimately moved them
  out of the next-draw order. Add an ordinary tail reserve, keeping draw rules
  unchanged. Corrected acquisition/core batch: **20/20**.
- Initial engine/inspector batch: **40/40** in three files. TypeScript passes.
- Final engine/acquisition/inspector checks pass **42/42**, including English
  and Spanish eligibility/awakening explanations. Full two-worker regression
  passes **1,919/1,919 in 160 files**. TypeScript and targeted lint pass.
  This remains local work; no mutation release has been published.
- Logs: `/tmp/tensho-mutations-first.log`, `...-second.log`,
  `...-acquisition.log`, `...-acquisition-final.log`, `...-ui.log`,
  `...-ui-final.log`, `...-full.log`, `...-lint.log`.

## Follow-up verification

- Enlarged-rack benchmarking found a genuine performance defect: an all-rules
  single-suit rack took 206 ms at 14 tiles and 8,337 ms at 20 tiles; the 28-tile
  attempt stalled and its owned benchmark process was stopped. Sequence search
  now enumerates face shapes, assigns real identities once, and shares suit DP
  results across overlap candidates. The same local benchmark completes in
  approximately 11/34/169 ms for 14/20/28 tiles. These are local measurements,
  not universal frame-time guarantees.
- Seven new shape tests compare canonical results against independent brute-force
  physical-copy enumeration across ordinary, Winter, Bamboo, combined and
  Harmonizer permissions. They check duplicate faces, actual identity ownership,
  optimal tactical structure and stable candidate count with extra copies.
- Paid previews now disclose the exact overlapping/anchored groups. The optional
  native disclosure outlines the shared identity, uses real tile art and localized
  names, and does not expose hidden forecasts or misattribute Bamboo to Winter.
  Engine/acquisition/disclosure/search batch passes **36/36**.
- Extended combinations cover False Eye's eleven-tile form, Winter, Bamboo,
  Wildcard, Clemency, forced physical copies, hidden required tiles and coach
  suggestions. The initial batch passed 47/48: the forced-3 fixture also formed
  a natural fourteen-tile hand, which the engine correctly preferred. Use an
  extra forced-1 to test the intended thirteen-tile subset without changing that
  preference. Corrected mutation/inspector batch passes **43/43**.
- Coach candidates explicitly include unique five-tile Plum bridges, including
  required physical copies; ordinary non-Plum plays retain their existing rules.
- Initial native browser batch: 0/4. The fixture incorrectly expected redraw to
  preserve upcoming Flower order; redraw intentionally shuffles returned tiles
  into the live wall. Use actual discard/replacement gestures for this ordered
  acquisition journey, without changing runtime draw/shuffle behavior.
- Corrected native journeys pass **4/4**, English/Spanish desktop and 320×568
  touch, without retries/deadline changes. Each awakens all four via real duplicate
  draws, checks resource costs and retained Flower identities, decodes every
  512px portrait, checks translated inspector wrapping/read-only inspection,
  pays both thirteen-tile complete and five-tile tactical forecasts exactly,
  reloads exactly, and retains awakenings into the next round. Phone inspector
  and shared-group screenshots were visually inspected. New-run reset and
  legacy/profile eligibility boundaries also have engine tests.
- Evidence directory: `/tmp/tensho-mutations-zHMyAD`, containing native reports,
  screenshots and a captured v2 replay envelope for built/hosted verification.
- Follow-up logs: `/tmp/tensho-mutations-overlap.log`, `...-combinations.log`,
  `...-combinations-final.log`, `...-native.json`, `...-native-second.json`,
  `...-final-lint.log`.
- Pages-base production replay passes **4/4** using the captured envelope and
  built assets only, without development imports, retries or deadline changes.
  TypeScript, build, all **13 release checks** and lint pass (zero errors).
- Latest full two-worker regression: **1,934/1,935 in 161 files**. The unchanged
  existing balance-CLI contract exceeded its five-second deadline while the host
  was heavily loaded (observed load average 188). Its complete unchanged file
  passes **26/26** in isolation; the formerly timed-out case takes 2.879 seconds.
  No deadline/assertion was relaxed. Retain the initial failed full batch rather
  than reporting it as a clean pass. Logs: `...-full-final.log`,
  `...-cli-isolated.log`, `...-production.json`, `...-build.log`, `...-release.log`.
  Independent full-suite release CI and hosted checks remain before a published
  verification claim. Both owned local servers (4200/4201) were stopped; the
  pre-existing 4173 server was untouched.

## Published verification

- Implementation: `376774ec0beb834f1cc3964d120f4bf638a645b8`.
- The final unchanged full two-worker local recheck passes **1,935/1,935 in
  161 files** (135 seconds). The earlier timeout remains recorded above.
- [Release workflow](https://github.com/evgenyvinnik/tensho-web/actions/runs/37704076358)
  independently passes **1,935/1,935**, all **13 release checks** and build.
  Initial build job: `113074158449`; `ci-build.log` retains its complete output.
- The first deployment job `113074657189` received a GitHub Pages HTTP 500
  while creating the deployment. Retry only failed jobs, keeping the tested
  build/version unchanged; attempt 2 succeeds with deploy job `113074907156`.
  Keep `deploy-first-failure.log`, `deploy-watch.log` and
  `deploy-retry-watch.log` rather than hiding the failed attempt.
- Public `release.json`, the remote `v1.0.261007-13` tag and runtime version agree
  on `504c26e26f24f59f4bd7eb5bac0abcbc8c5278ad`. Loaded entry point is
  `/tensho-web/assets/index-CxHNBn7o.js`. Both hosted portraits match their
  SHA-256 checksums below; see `hosted-provenance.log`.
- **4/4 hosted journeys pass**, English/Spanish desktop and 320×568 touch,
  with no retries/deadline changes. The captured v2 envelope exercises actual
  duplicate acquisition, illustrated read-only rules, full/tactical forecast
  payment, exact reload and next-round persistence. Spanish phone inspector
  screenshot reviewed; the longer copy wraps within its scrollable content.
  Native and production batches also pass **4/4 each**.
- Reports, captured replay and screenshots are in `/tmp/tensho-mutations-zHMyAD`.
  No local test server remains from this checkpoint.

## Remaining project work

- Catalyst payments remain required after this mutation work. Organic balance
  and human newcomer/fun evaluation also remain; engine legality alone is not fun.
- Full Frostbite behavior, Fate Seal/Negative lifetime, remaining copied resource
  effects and catalog/item wording reconciliation retain their existing scope.
  This checkpoint does not complete the entire implementation goal.

## Artwork provenance

Mode: built-in image generation with the imagegen skill, one generation per
portrait. The tool exposes no exact model selector; this is not a verified
latest-model claim. Both outputs were inspected and mechanically converted with
`cwebp -q 85 -resize 512 512`, preserving alpha. Existing art was not overwritten.
The optional inspector uses these portraits; the compact track retains familiar
mahjong Flower faces.

- Chrysanthemum original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-c75ae448-1786-4281-8061-536adcf6005e.png`.
  Runtime `public/assets/illustrations/chrysanthemum-bloom.webp`, 512×512 alpha,
  84,354 bytes, SHA-256 `960e275891d7a6c4e04655bf8dad76ed5413c86a0e73f7e08d7d237da6e5dfd2`.
- Bamboo original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-82b7dada-db2f-4558-9714-6d941edc02aa.png`.
  Runtime `public/assets/illustrations/bamboo-bloom.webp`, 512×512 alpha,
  89,200 bytes, SHA-256 `d5c11680861016a1deb29cbd76f35c525f1ff9c89cc27e81295f5acf41285972`.

Exact Chrysanthemum prompt:

```text
Use case: stylized-concept
Asset type: transparent game inventory botanical portrait for Tensho, a mahjong roguelike.
Primary request: one compact Chrysanthemum arrangement, three lush golden-ivory chrysanthemum blooms and dark jade leaves growing in a low hexagonal jade-green ceramic pot with antique-gold rim and subtle engraved botanical ornament.
Style/medium: finely painted fantasy inventory illustration, tactile aged glazed ceramic, delicate petal detail, refined East Asian botanical aesthetic. Match a set of jade-and-gold potted Flower portraits on forest-green game UI.
Composition/framing: square canvas, entire plant and pot visible, centered strong silhouette with 8 percent transparent padding, readable at 72 px. Warm gentle highlights, deep green shadows.
Constraints: genuinely transparent background, isolated object, no scene, no tile or card frame, no text, no symbols, no watermark, no glow cloud, no cast background shadow.
```

Exact Bamboo prompt:

```text
Use case: stylized-concept
Asset type: transparent game inventory botanical portrait for Tensho, a mahjong roguelike.
Primary request: one compact ornamental bamboo plant, three jointed fresh green bamboo culms of different heights with a graceful spray of pointed deep jade leaves, planted in a broad shallow oval jade-green ceramic basin with antique-gold rim and tiny restrained botanical engraving.
Style/medium: finely painted fantasy inventory illustration, tactile aged glazed ceramic, subtly textured stalks, refined East Asian botanical aesthetic. Match a set of jade-and-gold potted Flower portraits on forest-green game UI.
Composition/framing: square canvas, entire plant and basin visible, centered strong silhouette, foliage fills upper area, 8 percent transparent padding, readable at 72 px. Warm gentle highlights, deep green shadows.
Constraints: genuinely transparent background, isolated object, no scene, no tile or card frame, no text, no symbols, no watermark, no glow cloud, no cast background shadow.
```
