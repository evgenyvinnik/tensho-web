# Tea House purchase availability

October 3, 2026. Follow-up to the [owned-build panel](SHOP_BUILD_IMPLEMENTATION.md).
Previously an affordable ordinary offer appeared buyable even when inventory was
full. Players discovered the restriction only after clicking. The shop now uses
the engine's read-only purchase preflight to disable that purchase and explain why.

## Behavior and boundaries

- Ordinary offers distinguish insufficient gold, full Decree slots, full shared
  consumable inventory, and Flower requirements (required/current counts).
- Details remain readable. Selecting a blocked card says “Unavailable,” not “Tap
  to Buy”; neither the card shortcut nor the disabled button commits a purchase.
  The reason is also part of the button's accessible description.
- Selling an ordinary Decree can immediately enable its replacement. Selling a
  Negative removes its additional slot, so it does not falsely promise free room.
- `ShopSession.validatePurchase` and `purchase` share the same preparation checks.
  Commit-time validation still rejects stale UI, invalid prices, wrong phases,
  locked/purchased/missing offers, pending packs and reentrant transactions.
  Repeated previews do not mutate the complete run snapshot, RNG or events.
- Pack/Charter UI is unchanged. Packs are not rejected just because today's
  inventory is full, and previews neither reveal nor generate paid contents.
  Pack-selection validation remains authoritative when rewards are chosen.
- No scoring, acquisition, cost, income, Rental or capacity rule changed. The
  confirmed defeat settlement remains Rental charged, income win-only.

Five new availability strings are translated across thirteen locales with checked
placeholder parity. Native-speaker review remains outstanding. Existing artwork
is retained; this checkpoint generates no new image.

## Verification

- Focused engine/component/locale checks: **85/85** passed. New coverage includes
  nonmutating preflight, stale commitment, Flower versus capacity, Negative slots,
  shared consumables, pending packs and the disabled card's two purchase paths.
- Full local run: **1,542 tests passed**, but one worker failed to start for
  `SummerWall.test.ts`. That file subsequently passed **11/11** at unchanged
  deadlines. This is not represented as a clean 1,553-test local run.
- Strict TypeScript, targeted lint, whitespace validation and all **13 release
  checks** passed. Pages-base production/PWA build passed; existing large-chunk
  and stale Browserslist warnings remain.
- Native browser regression: **32/32**, desktop and touch, without retries.
  Controlled inventories/offers exercise actual play into shop, disabled reasons,
  English/Spanish 320px wrapping, ordinary/Negative sales, cancellation, physical
  identity, Eternal protection, save/reload, continuation and existing packs and
  Charters. Screenshots of the new reasons were inspected.
- A deliberate stale-render fixture changes gold without notifying React; the
  still-enabled button's commitment is rejected. The error is hit-tested above
  scene art. Flower and consumable recovery uses explicit fixture inventory
  changes; it does not introduce a shop consumable-use action.
- Separate production desktop/touch tests restore the previous browser-generated
  shop save without source-module imports. Full-slot offers are disabled; cancel
  preserves state; a confirmed sale enables the purchase; sale and purchase both
  survive exact reload; the next round loads, with zero page errors.
- Green Felt / Stake 1 / seed 7 with resources, consumables and observed-build
  shopping exactly matches all **28 result fields** in the published comparison:
  24 rounds, 98 plays, 646,564 score, victory without rescues. This is one
  deterministic regression, not a new balance or human-fun study.

Evidence is retained under `/tmp/tensho-purchase-availability-1mowq9/`: unit and
isolated retry logs, browser screenshots/save attachments, build log, replay and
production verification script. Its input is the isolated fixture from
`/tmp/tensho-shop-build-aM6Bjs/release-browser.json`, never a player's save.
The local worker-start failure above is retained rather than hidden by retries.

## Published checkpoint

Source `4a6fe22c155daf5a95b026c42abef296947f7cd9` is on main. Published
**v1.0.261003-6**, built/tagged at `4bc6fc5800a1999932d823b34d49fddd9e3ffb8f`.
[CI run 37141601614](https://github.com/evgenyvinnik/tensho-web/actions/runs/37141601614)
passed all **1,553/1,553 application tests** across 133 files, **13/13 release
checks**, build, provenance and Pages deployment. Public manifest and remote
version tag match the built commit exactly.

Hosted desktop/touch checks passed: disabled capacity reason, cancellation without
mutation, confirmed sale enabling a purchase, exact sale/purchase reload and
next-round continuation, with zero page errors. Screenshots and CI log remain in
the evidence directory above. Owned development/preview servers were stopped.
CI notes existing Pages actions' forced Node 24 migration and the forthcoming
ubuntu-latest image migration; neither failed this build.

Broader mechanics decisions, deliberate Yaku planning, newcomer playtesting and
physical-device/native-language review remain open. This is not project completion.
