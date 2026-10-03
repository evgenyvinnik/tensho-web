# Classic observed-build shopping comparison

Measured October 3, 2026. This is **analysis tooling**, not a new live coach or a
balance patch. Targets, prices, rewards, player controls, artwork and the default
game mode are unchanged. Final defeat still charges Rental and pays no round-end
income, following the [confirmed settlement rule](DEFEAT_SETTLEMENT_IMPLEMENTATION.md).

## Reproduce

```sh
bun scripts/classic-balance-matrix.mts --runs=20 --seed=1 --output=docs/balance/new-control.json
bun scripts/classic-balance-matrix.mts --runs=20 --seed=1 --shopping=observed-build --output=docs/balance/new-observed-build.json
bun scripts/classic-balance.mts 1 --seed=7 --build-shop --resources --consumables --json
```

Output paths must not exist. The matrix still defaults to cheapest-first; the
single-run harness enables the new policy only with `--build-shop` (which implies
shopping, but not resources or consumables). Matrix configuration validation
rejects a child report with a different shopping policy. Existing seed, budget,
diagnostic-stop, no-overwrite and source-fingerprint safeguards remain intact.

## What the policy does

The model remembers the last six successfully committed, fully visible tactical
selections. It rejects hidden faces, duplicates and selections outside 2–5 tiles;
no future wall or seed reaches the ranking function. It compares detached,
ordered Decree inventories using the real scoring and Decree effect APIs in
preview mode, without executing hypothetical plays or advancing gameplay RNG.

For each available modeled Decree, it considers buying directly or first selling
one eligible physical copy. Canonical sale prices, flower gates, affordability,
Negative capacity and Eternal restrictions apply. The actual executor uses the
real shop purchase and orchestrator sale paths, refreshes ownership after every
transaction, and aborts if a planned transaction fails. A maximum of one purchase
per initial offer bounds the loop.

Its value is the sum of two repeated observed-play rounds:

- Mean modeled score × plays × flexibility × economy.
- Plays: configured base plus current Charter adjustments and Decree extra plays.
- Flexibility: `max(0.5, 1 + 0.05 * rackBonus + 0.02 * extraDiscards)`.
- Economy: `max(0.1, 1 + 0.05 * clamp(projectedSavings, -10, 20))`.
- Savings start after purchase/sale, then include modeled round-end Decree income
  and Rental. Perishable lifetime advances between the two hypothetical rounds.
- Only a relative improvement above 5% is accepted; equal choices retain their
  original order. These weights and the horizon are heuristics, **not engine
  scoring rules or a forecast of what the next draw will score**.

Supported effects include additive/multiplicative/scaling score, retriggers,
extra plays, copying, round-end gold, and the modeled rack/discard/gold-multiplier
rules. Conditional effects use their real checks against the remembered state.
Unsupported incoming powers are not bought. Unsupported active owned powers are
not sold; copies are also retained when an unpriced power could be copied. Expired
unprotected copies can be sold. This deliberately preserves unpriced survival
powers instead of assigning them zero strategic value.

Other shop items remain cheapest-first and pack choices first-valid. There is no
new full-hand/Yaku planning, future draw forecast, Boss/Season forecast, scaling
growth forecast, or pricing of destructive Scripts. Repeating old selections
and round conditions does not model their future distribution. Economy assumes
two clears and omits clear rewards, interest and on-play/discard income. Actual
run outcomes and settlement still come from the engine, including win-only income.

## Matched results

[Control rows](balance/2026-10-03-classic-build-control.json) and
[observed-build rows](balance/2026-10-03-classic-observed-build.json) contain all
64 table/Stake combinations on seeds 1–20: **1,280 runs per strategy**. Both have
source fingerprint `543fcf772535f0842abf5adde25eefcbb8705ae05f9c3c4b64ba7fbde838ba4b`
(304 files), measured over `77a14f177843ddeed921c1398b9e32aa3c08022f` with the
recorded working-tree changes. Raw provenance is not relabelled as a deployment.

| Measure | Cheapest-first | Observed-build |
| --- | ---: | ---: |
| Victories | 0 | 25 |
| Runs reaching Act 8 | 0 | 49 |
| Total rounds cleared | 3,305 | 7,871 |
| Committed plays | 19,490 | 28,957 |
| Complete hands | 7 | 2 |
| Purchases | 5,271 | 13,529 |
| Consumable uses | 2,748 | 6,133 |
| Model-selected Decree purchases | 0 | 3,444 |
| Decree sales | 0 | 1,829 |
| Loss-prevention rescues | 0 | 0 |
| Diagnostic stops | 0 | 0 |

Round clears improved on **488** matched runs, tied on **721**, and worsened on
**71**. Every pre-existing field in all 1,280 control rows exactly matches the
[previous matrix](CLASSIC_TABLE_STAKE_BALANCE.md), verifying the default policy
was preserved. All 25 victories were rescue-free and had zero complete hands.
The report now records per-Decree rescue counts and final owned catalog IDs;
the victory flag alone would not distinguish score clears from rescued rounds.

Mean rounds cleared at Stake 1; 20 runs per table:

| Table | Cheapest-first | Observed-build | Observed-build wins |
| --- | ---: | ---: | ---: |
| Green Felt | 5.75 | 13.10 | 1 |
| Red Lacquer | 6.30 | 13.50 | 1 |
| Bamboo Mat | 5.50 | 12.00 | 2 |
| Imperial Gold | 5.70 | 11.05 | 1 |
| Night Market | 5.00 | 11.35 | 0 |
| Temple Stone | 5.15 | 10.20 | 0 |
| Ghost Parlor | 3.80 | 10.75 | 0 |
| Dragon's Den | 3.90 | 9.20 | 0 |

Green Felt/Stake 1/seed 7 independently reproduced every recorded field: 24
clears, 98 plays, 646,564 cumulative score, 11 model-selected purchases, seven
sales, no complete hands and no rescues. Extended Hand Grant appears in 22 of
the 25 final winning inventories. That correlation is a reason to investigate
build diversity, not proof that one Decree caused those wins or needs a nerf.

This demonstrates that some late-run clears are reachable with the existing
engine and a stronger shopping policy. It does not establish ordinary-player
win rates, optimal strategy, balanced Stakes or enjoyment. The same initial
seeds are paired observations, not independent human participants; different
actions can alter later RNG trajectories. No thresholds were tuned to maximize
these results. Broader hand planning, cost-aware item use and newcomer sessions
remain necessary. The lack of complete hands in victories is especially relevant
to the goal of making mahjong combinations rewarding and understandable.

## Verification and retained limitations

- Thirteen policy tests cover complementary chips/multipliers, suit conditions,
  copies/editions, Rental/Perishable, physical sale identity, Eternal/Negative,
  flower/price gates, unpriced powers, hidden samples and RNG/input immutability.
- A real shop regression catches stale previous-round play allowances: the model
  must use run configuration plus Charters, not subtract changing Decree ownership
  from the old allowance. The initial implementation was corrected before the
  final measurement; the fresh measurement happens to reproduce its aggregate
  results. Provisional artifacts remain under `/tmp/tensho-observed-build-QikF11/`
  as `initial-control.json` and `initial-observed.json`, not as final repo evidence.
- Earlier focused runs encountered an existing consumable CLI test timeout and
  one matrix worker-start failure; unchanged reruns passed. Deadlines were not
  increased. Final focused policy/CLI/matrix/settlement checks passed **68/68**.
- Strict TypeScript and targeted lint passed. Final full local suite passed
  **1,530/1,530** across 131 files, followed by **13/13** release-workflow checks.
- The Pages-base production/PWA build passed. Existing large-chunk and stale
  Browserslist-data warnings remain; this checkpoint does not address them.
- Both final matrices completed with unchanged source and zero diagnostic stops;
  all original control fields and the separate winning replay match exactly.
- No new browser or physical-device claim: non-test application code and visual
  assets are unchanged.

## Published checkpoint

Committed on main as `6d8b97fe9f47338b88e292541502593b4f257cb6`.
[CI run 37136614506](https://github.com/evgenyvinnik/tensho-web/actions/runs/37136614506)
independently passed **1,530/1,530 application tests**, **13/13 release checks**,
production build, provenance verification and Pages deployment. Published
**v1.0.261003-4**, built/tagged at `57bf59d7133a0c10b68467e15114e3639832e164`;
the public release manifest matches the version and commit. This is an analysis
checkpoint, not a claim that the broader implementation or fun/balance audit is
complete. Workflow annotations also flag upstream Pages actions using deprecated
Node 20 targets and an upcoming runner-image migration; neither failed this run.
