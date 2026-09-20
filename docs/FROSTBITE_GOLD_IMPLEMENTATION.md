# Frostbite gold settlement

September 19, 2026. Local implementation checkpoint; not project completion.

## Reward boundary

The preceding [scoring correction](FROSTBITE_IMPLEMENTATION.md) left gold outside
its scope. Discard rewards and scored-tile rewards bypassed the ordinary reward
multiplier; round payouts and consumables used its unweakened value. Gold getters
also ignored Mandate-disabled Decree IDs.

The shared settlement now scales raw Decree gold and the **bonus** portion of
its multiplier by `0.5 ** frostbiteCount`. Ordinary tile, consumable, base-round,
interest and held-Gold rewards retain their base amount. Fractional contributions
combine before rounding down to whole gold. Preview and committed scoring share
the same calculation, without awarding gold during preview or multiplying it
again during payment. Disabled and debuffed Decrees contribute no gold effect.

Shop prices, sale values, rental costs and negative penalties are unchanged.
The final cash-out remains spendable through actual shop controls. Its component
receipt can expose a fractional Decree contribution and a negative rounding
residual; the localized label is now “Reward adjustment,” not “Reward bonus.”
All thirteen locale files include that label and the Frostbite gold description.
Native-speaker review is not claimed.

## Verification record

The initial engine run reproduced **11 failures / 3 passes**. After correction,
those fourteen passed. Expanded complete/tactical hand, penalty, disabled-effect,
rounding and cash-out coverage then passed **25/25** in two files. One additional
fractional round-payout regression was added afterward and passed in the full run.

The full suite finished **912 passed / 2 timed out**, in 85 files, 579.02 seconds.
Both failures were the unchanged `classicBalanceCli` green-felt/temple-stone
cases exceeding their 5-second deadlines, not assertion failures. The unchanged
22-case file then passed **22/22**, 18.47 seconds; the two cases each took about
0.3 seconds. High host load was observed but causation is unproven. This does not
retroactively make the original full run green. All eighteen gold cases passed.

Browser verification passed **24/24**, 203.34 seconds, one worker and no retries:
four new gold journeys, four stacked Frostbite score journeys, four Merchant
purchase/swap/reload journeys, six score-settlement journeys and six localized
large-value receipt layouts. Desktop and 320px Spanish touch cash-out captures
were visually reviewed. The receipt components sum to the settled total; buying
an actual offer deducts its real price without changing the receipt, and Next
Round returns to Play. Existing test deadlines were not changed.

Artifacts: `/tmp/tensho-gold-BgPCca/browser.json` and `browser/`. The owned test
server is stopped. Targeted ESLint, formatting and whitespace checks passed.
The Pages-base production build (including strict TypeScript) passed: 338 modules,
entry `index-DC73Lb7a.js`, 265 precache entries / 60,121.89 KiB. Existing large-chunk
and stale-Browserslist warnings remain. This does not verify a deployed build or
service-worker upgrade.

The browser scenarios deliberately grant an economy build and a deal, then use
real staging, Play, purchase and Next Round controls in English and Spanish,
desktop and 320px touch contexts. They are integration fixtures, not proof of
organic acquisition frequency, balance or fun.

## Still open

- The subsequent [Decree economy checkpoint](DECREE_ECONOMY_IMPLEMENTATION.md)
  implements Wealth Engine's owned-Decree scaling and shared copied gold effects.
  Treasure Hunter's unique-suit timing/scaling still needs the requested choice.
- The subsequent [secondary-scoring checkpoint](SECONDARY_SCORING_IMPLEMENTATION.md)
  implements Frostbite's Yaku-specific modifiers and Mandate suppression for
  secondary scoring. Frostbite fractional retriggers and binary powers remain open.
  The requested binary-power design choice has not been answered.
- Other documented Season/Flower mechanics, broader progression, native-device
  and human playtesting, route promotion, deployment and PWA upgrades remain open.

Existing illustrated gold, tile and Decree assets are reused. No new bitmap is
needed for this arithmetic correction. No commit, merge, push or deployment has
been performed for this checkpoint.

Commands:

```sh
bun run test:run --maxWorkers=1 --pool=threads
bun run test:run src/gameplay/classicBalanceCli.test.ts --maxWorkers=1 --pool=threads
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4192 PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/tensho-gold-BgPCca/browser.json npx playwright test e2e/frostbite-gold.spec.ts e2e/frostbite-score.spec.ts e2e/shop.spec.ts e2e/score-settlement.spec.ts e2e/merchant-swap.spec.ts --grep 'Frostbite gold|Frostbite halves|localized payout receipt|complete and tactical|buys, swaps, and reloads Merchant' --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,json --output=/tmp/tensho-gold-BgPCca/browser
VITE_BASE_PATH=/tensho-web/ bun run build
```
