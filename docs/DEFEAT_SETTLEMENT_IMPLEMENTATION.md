# Final defeat settlement and illustrated results

October 2, 2026. User-confirmed rule: **charge Rental on final defeat; keep income win-only**.

## Behavior

Final defeat deducts Rental from every held copy, including expired or Eternal copies, before loss-triggered destruction and Perishable ageing. Debt is allowed. No clear reward, interest, round-end Decree income or held Gold tile income is paid. The final round replaces any previous shop cash-out with a fresh zero-income receipt, persisted through the existing save schema. Rejected post-defeat actions cannot settle again.

Loss prevention remains ahead of terminal settlement: Phoenix/Immortal rescue takes the existing winning path exactly once. A Phoenix consumed by its rescue is not held at winning settlement; other Rentals charge normally. This checkpoint does not change on-play income, skip rules, sticker prices, balance or the default mode.

Results now separate cumulative run score from final-round score, target and shortfall. Current gold and a matching receipt's Rental charge are visible, including debt. Missing or stale receipts from older saves do not invent a charge. Victory hides shortfall/defeat guidance. All thirteen locales have result-detail copy; native-speaker review remains outstanding. The decorative banner contains no text; labels remain accessible HTML. The viewport scrolls vertically on short phones rather than shrinking buttons.

## Artwork provenance

The imagegen skill guided a new image in built-in tool mode. The tool exposed no model selector or identity, so no particular latest-model claim is made. Original opaque PNG retained at `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-a8faaef9-924a-4ec0-8719-f4afe00aec7d.png`.

Project asset: `public/assets/illustrations/journey-result.webp`, 1200×400, 108,860 bytes. Mechanical conversion: `cwebp -q 85 -resize 1200 400`; no creative post-edit or existing artwork replacement.

Exact prompt:

> Use case: stylized-concept. Asset type: a wide decorative result-screen banner for Tensho, a mahjong roguelike. Primary request: a quiet lantern-lit mahjong table at the end of a journey, with a narrow mountain path continuing into mist beyond an open wooden pavilion. Scene: deep forest-green and dark teal night foliage, warm amber paper lantern light, aged ivory mahjong tiles with simple circular pip and bamboo motifs resting on dark green felt, slim antique gold trim. Style: polished painterly East Asian fantasy illustration matching an emerald, ivory, amber and metallic-gold game UI; tactile carved wood, jade accents, gentle brush texture, restrained luminous highlights. Composition: wide landscape roughly 3:1; the table and lantern form a readable central composition in the middle band, with a distant path visible behind; calm edges and no essential details at the edges so it remains readable in a shallow banner on a 320px phone. Mood: reflective and inviting, encouraging another journey, suitable after a win or loss; no sad character, no triumphant trophy. Text: none. No letters, numbers, calligraphy, logos, watermarks, UI controls or labels. Opaque illustrated backdrop, not a transparent cutout. Avoid photorealism, clutter, emoji styling, harsh neon, excessive tiny objects, and large blank areas.

## Verification

The initial engine run reproduced five failures: missing rent for ordinary/expired/Eternal Rentals, missing zero-income receipt, and missing rent before boss-loss destruction. The existing rescue settlement passed. Controlled late-run fixtures verify settlement and navigation, not organic difficulty or human enjoyment.

- Focused checks: 72/72 passed. TypeScript first caught an untyped locale-test lookup; the corrected lookup and targeted lint passed.
- Three local full-suite attempts encountered different timeouts: ShopItemCard plus two worker starts; Classic balance CLI plus MenuScreen worker start; finally 1,489/1,490 passed with one Table Loop save-test timeout. Every affected file subsequently passed in isolation at unchanged deadlines (9, 24 and 9 tests respectively). These are **not** claimed as a clean local full-suite pass. Reports retained under `/tmp/tensho-defeat-settlement-XS5dfN/`.
- All 13 release-workflow tests passed. Pages-base production/PWA build and strict TypeScript passed; existing large-chunk and stale Browserslist warnings remain.
- Native desktop/touch browser checks: 16/16 passed for results and loss prevention. Visual review caught an awkward 13-digit target wrap at 320px; long values now use smaller text. The final result suite passed 10/10 after that adjustment, with screenshot review.
- Production preview initially used the wrong base path and failed the asset hash check (SPA HTML instead of image). Correcting the preview environment to `/tensho-web/` resolved it. Desktop/touch production checks then passed: exact artwork SHA-256, 1200×400 decode, real play into defeat, debt/receipt display, exact save/reload and fresh-run action; no page errors.

## Published checkpoint

Published as **v1.0.261003-2**, source commit `71b95b3dc4f0bc21fec39b16db6dec67264f7054`, built/tag commit `447efa00b6cc5b5e103d058b4c757b5b5cc8f87f`. [CI run 37103041672](https://github.com/evgenyvinnik/tensho-web/actions/runs/37103041672) passed the full 129-file application suite, all 13 release checks, production build, provenance verification and Pages deployment.

Public desktop and touch checks passed: release manifest and visible menu version match, generated artwork matches the local SHA-256 exactly, Rental debt is shown after a real play, save/reload preserves the complete snapshot without charging again, and Try Again starts a fresh run. No page errors. Hosted screenshots and the verification script are retained in `/tmp/tensho-defeat-settlement-XS5dfN/`.

This is an incremental verified release. Native-language review, physical-device checks, human enjoyment and the other unconfirmed mechanics choices remain outstanding.
