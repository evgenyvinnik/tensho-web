# Frostbite scoring implementation

September 19, 2026. In progress; not a full Frostbite or project completion claim.

## Confirmed defect and scoring boundary

`GAME_SYSTEMS.md` says Frostbite halves Decree effects. The runtime previously
scaled only `decreeMultiplier - 1`; flat point bonuses were unaffected. Six
new integration cases failed before the correction (one preservation case
passed). Flat-only Decrees could avoid a penalty that multiplier builds paid.

The scoring pipeline now scales the difference between the Decree-modified
additive bonus and the pre-Decree additive bonus. This includes Decree Foil but
does not halve a tile's own Foil, marks, or existing base points. The same result
supplies preview, committed score, score breakdown and the settled equation.
Flower-empowered fractional bonuses survive until final score rounding.

The seven initial engine regressions passed after the change: complete and
tactical hands, Decree/tile Foil distinction, no-Decree preservation, combined
flat/multiplier bonuses, fractional Flower empowerment, disabled Decrees and
clearing Frostbite. The inspector's description was updated in all 13 locales.

## Stacking and fractional presentation

The documented Season-stack rule also applies to repeated Frostbites, but
the old `some()` check reduced their stack to a boolean. The modifier is now
`0.5 ** frostbiteCount`: two Frostbites leave one quarter of the affected Decree
bonuses. The new integration case reproduced 0.5 instead of 0.25 before the fix.

The counter previously floored even a settled fractional subtotal. Two component
cases reproduced 61 instead of 61.5 in normal and reduced motion. It now displays
the exact subtotal once settled, retaining integer steps only during the animation.
Browser coverage exercises a controlled Foil tile / Foil Decree / multiplier
build with one then two Frostbites through actual stage, inspector and play
controls in English and Spanish, desktop and touch contexts.

## Still open

This correction does **not** redefine “all Decree effects” as only these two
score channels. The subsequent [gold settlement checkpoint](FROSTBITE_GOLD_IMPLEMENTATION.md)
addresses shared gold generation/multiplier paths; catalog-specific gold scaling,
retriggers and binary rules still need the broader audit. The later
[secondary-scoring checkpoint](SECONDARY_SCORING_IMPLEMENTATION.md) implements
the Yaku-specific contribution and disabled-effect paths. A user choice has been requested
for yes/no powers such as extra slots, wild rules and loss prevention. The
inspector continues to disclose incomplete effects. No unconfirmed choice is
treated as approval. Other Season/Flower requirements remain in
[Flora implementation](FLORA_IMPLEMENTATION.md).

No new bitmap is necessary for this rule: the existing Winter tile and generated
Decree artwork remain. The guidebook generated in the preceding turn is recorded
in [beginner guide evidence](BEGINNER_GUIDE_IMPLEMENTATION.md).

## Verification

Initial focused engine run: 1 passed / 6 failed, with the expected unhalved
point bonuses. After the additive correction: 7/7 passed. The full suite then
passed **892/892 in 84 files**, 309.78 seconds. This run preceded the final
stacking/counter changes; it is not a full-suite pass of those follow-ups.

The follow-up red run finished **13 passed / 3 failed**: two fractional-counter
cases and the duplicate-Frostbite case. After their fixes, the expanded scoring,
Season, Decree, counter, Flora and locale subset passed **121/121 in eight files**,
57.64 seconds. No timeout or assertion was relaxed.

The broader browser subset finished **21 passed / 1 timed out**, 318.05 seconds.
All four new Frostbite cases passed. The existing desktop normal-animation
score-settlement journey exceeded its original 30-second timeout; no scoring
assertion failure was reported. Its screenshot and JSON failure are retained.
Host load rose substantially during the run, but causation is unproven.

The normal-animation test was repeated unchanged, together with the four Frostbite
journeys strengthened to scroll the actual rule paragraph into view before
capture. **6/6 passed**, 64.40 seconds, no retries. This does not retroactively
make the earlier 22-case run green. The Spanish 320px touch inspector and paid
counter screenshots were reviewed. The scenario pays 260 with one Frostbite,
then 168 from a 112.5 subtotal and 1.5 multiplier with two. Deliberately granted
Decrees/Seasons and deals isolate integration; they do not prove organic
acquisition frequency, balance or fun.

Strict TypeScript, targeted ESLint, formatting and whitespace checks passed.
The Pages-base production build passed: 338 modules, entry `index-CxvHgyov.js`,
265 precache entries / 60,121.46 KiB. Existing large-chunk and stale-Browserslist
warnings remain. This is not a deployed-build/PWA-upgrade verification.

Artifacts: `/tmp/tensho-frostbite-IBiwRm/browser.json`, `browser/`,
`final-browser.json`, and `final-browser/`. The owned development server is stopped.
No commit, merge, push or deployment occurred. Physical-device/native-speaker
review, broader effect completion and deployment/PWA verification remain open.

Commands:

```sh
bun run test:run --maxWorkers=1 --pool=threads
bun run test:run src/game/FrostbiteScore.test.ts src/game/ScoreEquation.test.ts src/game/WinterFlower.test.ts src/game/PartialPlayScoring.test.ts src/systems/DecreeMechanics.test.ts src/components/gameplay/PointsMultDisplay.test.tsx src/components/gameplay/FloraTrackCompact.test.tsx src/i18n/locales.test.ts --maxWorkers=1 --pool=threads
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4192 PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/tensho-frostbite-IBiwRm/browser.json npx playwright test e2e/frostbite-score.spec.ts e2e/score-settlement.spec.ts e2e/flora.spec.ts e2e/forecast-layout.spec.ts --grep 'Frostbite halves|complete and tactical|real Chrysanthemum|forecast and translated' --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,json --output=/tmp/tensho-frostbite-IBiwRm/browser
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4192 PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/tensho-frostbite-IBiwRm/final-browser.json npx playwright test e2e/frostbite-score.spec.ts e2e/score-settlement.spec.ts --grep 'Frostbite halves|complete and tactical.*no-preference' --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,json --output=/tmp/tensho-frostbite-IBiwRm/final-browser
VITE_BASE_PATH=/tensho-web/ bun run build
```
