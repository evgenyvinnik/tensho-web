# Decree copying: physical targets and resource trade-offs

September 19, 2026. Local implementation checkpoint, not whole-project completion.

## Requirements and reproduced failures

`ITEM_LIBRARIES.md` defines Blueprint as copying the Decree to its right,
Brainstorm as copying the leftmost Decree, and Clone Army as copying all Decree
effects. Ancient Scroll carries both +150 Chips and −2 Hand Size; Sacrifice has
both ×3 Mult and −1 Discard. Copying only their scoring benefit omitted the cost.

The first 19-case integration run failed **16 cases**, with three already passing:

- Main scoring resolved copies from a filtered active list. Blueprint skipped a
  suppressed Half-Suited neighbor and copied Gentle Breeze instead: 225 points
  instead of 135 for the test sequence. Brainstorm similarly skipped a suppressed
  physical leftmost slot.
- A Brainstorm in the leftmost slot copied its right-hand neighbor instead of
  resolving its own slot; the test paid 85 instead of 65.
- Rack, discard and extra-hand getters did not resolve copies. Actual next-round
  resources were 15 rather than 16 tiles with copied Wide Grip, 12 rather than 10
  with copied Ancient Scroll, and two rather than one discards with copied
  Sacrifice. Positive discard/hand benefits were also omitted.

## Implementation

Main scoring now passes complete owned order to the shared resolver and separately
excludes disabled/debuffed contributors and targets. A disabled neighbor does not
change anyone's position. A leftmost Brainstorm targets itself; the existing
one-level copy filter prevents self-recursion instead of selecting another item.
The copier retains its own edition; the source's edition is not duplicated.

Rack-size, discard-count and extra-hand queries use the same resolver. This
includes negative resource deltas, and Clone Army sums each target once. Existing
timing is preserved: hands/discards initialize on round entry; hand-size limits
are queried dynamically. This does **not** implement per-hand resource reallocation
under Mandates or decide fractional Frostbite resource rules.

## Verification

The focused copy/secondary-scoring/gold/mechanics set passed **89/89**. Full units
then passed **964/964 in 89 files**, 62.95 seconds, one worker. The new
`DecreeCopying.test.ts` covers physical order, disabled and debuffed targets,
own/source editions, chained-copier boundaries, positive/negative resource
getters, Clone Army and actual next-round resources.

The new browser file uses controlled shop offers and a Blueprint starter,
then performs paid purchase, Next Round, rule inspection, tile selection and
payment through actual UI controls. It checks the naturally initialized rack
before substituting a reproducible three-tile deal of the same size. These are
transaction/integration checks, not proof of organic acquisition frequency or fun.

| Copied Decree | Next-round rack | Discards | Three-tile payment |
| --- | ---: | ---: | ---: |
| Wide Grip | 16 | 3 | 45 |
| Ancient Scroll | 10 | 3 | 345 = (45 + 300) × 1 |
| Sacrifice | 14 | 1 | 405 = 45 × 9 |

Each case checks actual gold spent, inventory order, localized rule text,
forecast/payment agreement, refill capacity and one hand consumed. English and
Spanish run in desktop and 320px touch contexts. All **20/20 browser checks**
passed in 95.55 seconds, including the existing Wealth Engine and secondary
scoring journeys. No retries, skips or timeout changes were used. Spanish desktop
and phone inspector/score screenshots were reviewed; existing decimal/currency
notation and the unformatted large-target hint remain separate localization work.

Artifacts: `/tmp/tensho-copy-zQGReO/browser.json` and `browser/`. The fixture server
started fresh after source edits and was stopped after verification. Strict
TypeScript, targeted ESLint and whitespace checks passed.

The Pages-base production build passed: 339 modules, entry `index-DgUFgGWt.js`,
266 precache entries / 62,682.25 KiB. Existing large-chunk and stale Browserslist
warnings remain. This does not verify live deployment or installed-PWA upgrades.

## Remaining scope

The random-copy selector still chooses by inventory position, not a seeded random
choice. The subsequent audit requested the user's choice between once-per-round
and acquisition-time targeting for Doppelganger; no answer is assumed.
Fractional Frostbite retriggers, binary powers and consumed-copy charges remain
unresolved, as do Treasure Hunter timing, broader Season/Flower rules, remaining
localization, human/device testing and main/default promotion. Existing one-level
copy behavior is retained, not asserted to prove every possible copy-chain rule.

No new bitmap is needed for this mechanics correction. The recent generated
[Wealth Engine portrait](DECREE_ECONOMY_IMPLEMENTATION.md) and existing illustrated
scrolls remain connected. No commit, merge, push or deployment was performed.

The subsequent [HUD follow-up](FORECAST_UI_IMPLEMENTATION.md) addresses localized
decimal notation and large remaining-score text observed in these screenshots.

Commands:

```sh
bun run test:run --maxWorkers=1 --pool=threads
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4192 PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/tensho-copy-zQGReO/browser.json npx playwright test e2e/decree-copying.spec.ts e2e/wealth-engine.spec.ts e2e/secondary-scoring.spec.ts --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,json --output=/tmp/tensho-copy-zQGReO/browser
VITE_BASE_PATH=/tensho-web/ bun run build
```
