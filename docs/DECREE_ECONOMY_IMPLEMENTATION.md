# Decree economy and Wealth Engine artwork

September 19, 2026. Local implementation checkpoint, not project completion.

## Confirmed rule gaps

The authored Wealth Engine definition promises +1G per owned Decree at round
end, but the adapter discarded its condition and the gold helper paid a flat 1G.
It now carries an explicit owned-inventory scaling source. “Owned” includes the
paying Decree itself and suppressed inventory; suppression prevents a Decree
from paying, not from occupying inventory. Selling/removing a Decree reduces
the count used by the next payout.

Round and discard gold and gold multipliers now resolve copying effects through
the existing one-level resolver. Gold copying preserves physical inventory order:
Blueprint does not skip a disabled neighbor and copy a different Decree. Disabled
sources and copiers contribute nothing. Duplicate copier instances now locate
their own position by object identity rather than the first matching catalog ID.
Copy cycles still do not recurse.

The preceding [Frostbite reward settlement](FROSTBITE_GOLD_IMPLEMENTATION.md)
applies after these raw contributions. A three-Decree Blueprint/Wealth Engine/
Philosopher's Stone build generates 6 raw Decree gold. With one Frostbite, that
becomes 3, added to ordinary rewards before the weakened multiplier and rounding.

## Authored illustration

Wealth Engine now has its own illustrated imperial scroll: an abacus, rolled
decrees and coins on ivory parchment with navy, jade and gold detailing. The
shared portrait mapping reaches the shop, archive grid/details, standalone
Decree card and compact owned-Decree inspector. Other Decrees retain existing
artwork. Face-down inventory and its inspector deliberately use generic art;
the portrait must not leak a hidden identity. Text remains real localized HTML.

The imagegen skill was used in default built-in mode. The tool exposes no model
selector or model identifier, so use of a specifically named “latest” model
cannot be independently verified. No CLI fallback or API-key workflow was used.

- Project asset: `public/assets/illustrations/decrees/wealth-engine.png`
- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-d0e286be-9f5c-4758-ad8b-df88b3845a02.png`
- 1254 × 1254 PNG with alpha, copied unchanged; existing assets not overwritten.
- SHA-256: `83c2209966c6cda314425eb1839642c59ade522d15462194d4ac72ad42f7e155`.

Exact final prompt:

> Use case: stylized-concept. Asset type: individual Decree scroll illustration for Tensho, a mahjong roguelike UI. Primary request: Wealth Engine, an illustrated imperial scroll whose central emblem is an elegant antique golden abacus with three small rolled ivory decrees feeding a modest cascade of round square-hole gold coins. Style/medium: polished painterly game inventory art, softly shaded ivory parchment, carved gold fittings, deep jade and navy cloth trim, warm gilded edges, a small red wax seal. Composition: single upright unfurled scroll, centered full object with generous transparent margins, clear bold central silhouette readable at small size; portrait subject in a square image. Background: genuinely transparent alpha, no scene, no floor or cast shadow outside the object. Constraints: no lettering, numbers, text, labels, watermark, modern machinery, UI panel or card border. Keep the emblem integrated into the parchment, not a separate badge.

## Verification record

An initial test fixture used the wrong River Tax ID and was corrected before
the baseline run. With the real catalog ID, the baseline reproduced **4 failures /
4 passes** for missing scaling and copying. After the first correction,
**71/71 focused checks** passed. The expanded payout/art boundary subset then
passed **40/40**. A separate duplicate-Blueprint test reproduced 3G instead of
6G before its identity-based fix.

The full suite passed **928/928 tests in 87 files**, 195.19 seconds, after the
duplicate-instance fix. A final Spanish wording refinement and its new shop-card
test followed: the focused card/inspector/locale set passed **31/31**, 7.90 seconds.
That final wording replaces ambiguous “+1O” with “+1G,” matching the wallet and
purchase button. The full 928-test count precedes that one added test.

The first browser set finished **18 passed / 2 failed**, 143.49 seconds. Both
failures were a new assertion incorrectly normalizing the existing Spanish
currency text. Correcting the assertion to use the actual locale yielded
**20/20 passes**, 149.00 seconds, covering four Wealth Engine journeys, four
Frostbite gold journeys, six paid-score journeys and six large-value receipts.

After screenshot review motivated the Spanish wording refinement, the four
follow-up cases failed at fixture setup (36.61 seconds). The trace contains both
`/src/game/GameOrchestrator.ts` and its timestamped hot-reload URL: the fixture
and visible UI were using different module instances after a source edit.
Restarting only the owned test server cleared its module graph. The unchanged
four journeys then passed **4/4**, 26.75 seconds. No retry or timeout increases
were used. Future fixture-based runs need a fresh server after edits that
invalidate imported singleton modules; this is not proof of live run preservation
through source hot reload.

The English inspector and final Spanish 320px shop/inspector screenshots were
reviewed. The portrait is loaded, names/rules wrap, and the copied payout equals
2G with two owned Decrees under one Frostbite. Acquisition deducts the actual
8G offer price exactly once. Browser scenarios use a controlled shop offer and starter Decree, then actual
paid purchase, Next Round, inspector and Play controls. They do not prove organic
offer frequency, overall balance or fun.

Artifacts are under `/tmp/tensho-wealth-x5QCAI/`: `browser.json`, `final-browser.json`,
`wording-browser.json`, `clean-browser.json`, and matching screenshot/trace folders.
The owned development server is stopped. Targeted ESLint and whitespace checks
passed. The Pages-base production build, including strict TypeScript, passed:
339 modules, entry `index-DegOu5xw.js`, 266 precache entries / 62,681.92 KiB.
The unchanged 2,620,640-byte portrait adds about 2.5 MiB to the offline bundle;
this is not a performance-score improvement. Existing large-chunk and stale
Browserslist warnings remain. Live Pages and service-worker upgrade behavior
were not verified.

## Remaining scope

Treasure Hunter's unique-suit condition is still unresolved: its authored copy
does not specify played-hand versus remaining-rack timing. A user choice has
been requested, not assumed. Existing deterministic “random” copy selection,
non-gold copied resource effects, Frostbite retriggers/non-numeric powers,
broader Season/Flower rules, localization and human/device testing remain open.
The later [secondary-scoring checkpoint](SECONDARY_SCORING_IMPLEMENTATION.md)
implements Frostbite Yaku benefits and disabled secondary scoring effects.
This is not a claim that every published Decree fully matches its prose.

No commit, merge, push or deployment has been performed. Main/default-route
promotion and live Pages/PWA verification remain separate open work.

Commands:

```sh
bun run test:run --maxWorkers=1 --pool=threads
bun run test:run src/components/shop/ShopItemCard.test.tsx src/i18n/locales.test.ts src/components/gameplay/DecreeBar.test.tsx --maxWorkers=1 --pool=threads
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4192 PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/tensho-wealth-x5QCAI/final-browser.json npx playwright test e2e/wealth-engine.spec.ts e2e/frostbite-gold.spec.ts e2e/score-settlement.spec.ts e2e/shop.spec.ts --grep 'illustrated Wealth Engine|Frostbite gold|complete and tactical|localized payout receipt' --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,json --output=/tmp/tensho-wealth-x5QCAI/final-browser
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4192 PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/tensho-wealth-x5QCAI/clean-browser.json npx playwright test e2e/wealth-engine.spec.ts --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,json --output=/tmp/tensho-wealth-x5QCAI/clean-browser
VITE_BASE_PATH=/tensho-web/ bun run build
```
