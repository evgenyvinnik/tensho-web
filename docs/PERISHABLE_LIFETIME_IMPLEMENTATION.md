# Perishable lifetime and Phoenix portrait

September 29, 2026. Published as **v1.0.260929-4**.

## Rule and reproduced defect

[Game mechanics](GAME_MECHANICS.md), sections 6b and 7, says that Perishable
expires after five rounds and recommends skipping to preserve it. The live
engine instead spent a counter on each round start, including entering the first
round after purchase and advancing after a skip. Two real-engine regressions
failed before repair: a purchased counter was already 4 instead of 5, and a skip
spent another counter (4 → 3).

The counter now ages after a played round's scoring and economy settle, keeping
the fifth round's benefits. Skips do not age it. Prevented defeat routes through
one successful settlement; terminal defeat ages once. Zero remains terminal,
negative legacy counters remain accepted and normalize without adding lifetime,
and expired Rental copies retain their obligation. No rental price or probability
changes are part of this checkpoint.

All thirteen locale entries describe completed-round lifetime and skipping.
These translations have automated key/placeholder coverage, not native-speaker
approval. Existing save counters are retained, not replenished on upgrade.

## Evidence so far

- Two failing-first lifetime tests reproduced the purchase and skip bugs.
- 55 targeted engine/identity/asset tests passed after the implementation.
- 55 additional lifecycle, popup, localization and artwork checks passed,
  including a six-round real settlement sequence: five active payouts then no
  payout, with rent still due. Exact saves/restores occur between rounds.
- Phoenix loss prevention and terminal defeat age the clock only once; rejected
  actions cannot age it again. Hidden Phoenix artwork is concealed like the
  existing portraits.
- TypeScript and targeted ESLint passed. The first browser run passed 1/4;
  three scenarios timed out. The second passed 2/4 and exposed a test checkpoint
  race: it captured the round-end save before the shop route opened its visit.
  The exact reload comparison now waits for the persisted `shop.opened` flag.
  The subsequent run hit four normal deadlines (host load measured above 400);
  those failures remain recorded, not counted as passes or bypassed by longer
  timeouts. Logs and screenshots are retained in
  `/tmp/tensho-perishable-lifetime-6Pe8E6/`.
- The 320px Phoenix popup screenshot was visually inspected: the portrait and
  full modifier text fit. Spanish countdown copy was then made neutral to avoid
  singular/plural disagreement.
- Final focused units: 94 passed in eight files, with one additional worker
  failing to start. That file then passed 14/14 unchanged. This is 108 passing
  focused checks across those runs, not a clean single-run result.
- Final desktop/touch browser regression passed **16/16**, normal deadlines,
  one worker and no retries, including purchase, last-round rescue/payout,
  exact reload, concealed details, translation and short-screen reflow.
- Strict TypeScript and the Pages-base production/PWA build passed. The
  existing large-chunk warning remains. Production desktop/320px touch checks
  passed skip preservation, loaded Phoenix artwork, last-round rescue and
  payout, and exact reload, with no page errors. The first production verifier
  used abbreviated catalog definitions and was correctly rejected by the save
  validator; its fixture was corrected to the actual catalog definitions, with
  no application or validation relaxation.
- Final targeted lint passed. Local release checks passed 11/13; two subprocess
  deadline failures occurred (fixture Git startup and publication subprocess).
  These are retained as failures, not a clean local release-suite result.
- Independent [CI run 36637383093](https://github.com/evgenyvinnik/tensho-web/actions/runs/36637383093)
  passed **13/13 release checks** and **1,466/1,466 application tests in 126
  files**, built successfully and deployed. Implementation commit:
  `92323c26e56f1e332b1fbe98a64db4c1f072643c`; built/tag commit:
  `d96e84c84ff6e9243e9f7588c73e390c118b016a`.
- The public `release.json`, remote tag and visible menu version agree on
  **1.0.260929-4**. Hosted desktop/320px touch checks passed skip preservation,
  loaded Phoenix artwork, last-round rescue and payout, and exact shop reload,
  without JavaScript errors. CI and hosted logs are retained alongside the
  earlier results in the artifact directory above.

## New artwork

- Built-in image generation was used, with transparency requested. This surface
  exposes no named model selector; a specific "latest" model ID is not claimed.
- Original retained at
  `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-b8198068-d3d9-40e0-822c-d8fa922b7ed4.png`.
- Project asset: `public/assets/illustrations/decrees/phoenix.webp`.
- Mechanical web encoding: `cwebp -q 85 -resize 512 512`, retaining alpha.
  512×512, 73,316 bytes; SHA-256
  `80a80e83e152da4c4de437903bb81af5f07798673d64a6f2c3ad6a630fbb97a4`.
- Both generated and encoded images were visually inspected: one complete
  emerald/gold scroll with a large crimson phoenix, transparent exterior and
  no embedded text. The shared portrait mapping supplies shop, collection and
  owned-item artwork while translated names/descriptions remain real UI text.

Final generation prompt (verbatim):

> Use case: stylized-concept. Asset type: transparent illustrated Phoenix Decree portrait for Tensho, a mahjong roguelike, readable at 64–96px. Primary request: one sumptuous upright antique scroll, viewed straight-on, with an unmistakable crimson-and-gold phoenix rising from a small curl of embers painted prominently on its parchment. Match our existing game art: painterly polished fantasy illustration, emerald-jade cylindrical rollers at top and bottom, engraved warm gold end caps, slim dark teal and gold brocade borders, aged ivory parchment with quiet cloud motifs, tiny dark teal tassels, a small red wax seal at the lower right. The phoenix is the main large central silhouette, wings lifted, graceful golden tail, vivid warm plumage contrasting emerald frame. Composition: one centered complete scroll, square canvas, about 80% width and 94% height, comfortable transparent margin, no cropping. Scene/backdrop: genuine transparent alpha outside the scroll, no background scene, no cast shadow rectangle. Text: none; no letters, numbers, calligraphy, labels, logos or watermark. Avoid mahjong tile stacks, extra scrolls, UI panels, photorealism and excessive tiny details. This is a game-ready raster item illustration, not a sheet of variations.

## Remaining limits

- The question of which zero-start growers are excluded from Perishable is
  awaiting clarification. Current-hand scaling is not automatically treated as
  permanent growth.
- Eternal eligibility, older unused sticker helpers and the broader rules
  discrepancies remain under audit. A new Phoenix illustration is not a claim
  that all of Phoenix's combinations already match the final design.
- Failed-round rental accounting, every destructive/copy combination, device
  testing and human-fun validation are not proven by these focused checks.
