# Classic resource-aware progression measurement

**Historical resource checkpoint:** the later [consumable-policy comparison](CLASSIC_CONSUMABLE_BALANCE.md)
adds explicit item use and 400 matched-seed rows. The results and verification
counts below are retained for their original source snapshot.

Updated September 9, 2026. This is an implementation and measurement record,
not a declaration that Classic is balanced or fun. It extends the earlier
[play-validation measurements](PLAY_VALIDATION.md) after
[redraw/discard semantics were corrected](RESOURCE_CYCLING_IMPLEMENTATION.md).

## What now runs

`scripts/classic-balance.mts` retains its best-immediate-score baseline and adds
two separately selectable policies. All three use the real orchestrator, real
shop purchases, real pack settlement, and the same coach candidate search.

| Policy | Additional behavior |
| --- | --- |
| Baseline | Play the highest-scoring legal candidate found; do not cycle resources. |
| `--resources` | When below the required per-Hand pace, preserve the current scoring option when possible and cycle low-connectivity spare tiles. Try legal three-/two-tile redraws, then single discards, then single redraws. |
| `--chase-hands` | Includes resources; also consider a single replacement that could finish an ordinary 14-tile hand. Prefer a real discard for that single tile. |

A known round-clearing play takes priority over every resource action. Exchanges
and discards are validated by the orchestrator before execution, and the policy
recomputes from the actual replacement hand. A failed selected action stops the
run with an explicit diagnostic; it is not silently skipped or counted as a win.

The resource helper receives visible tiles, hand size, locks, required play size,
score advice, and a legal-action callback. It receives no future wall order,
dead wall, seed, or concealed tile faces. Fully concealed racks retain the
identity-only blind-play fallback. The one-away search is disabled for incomplete
visibility and incompatible fixed-size mandates. Its completion tile is a
structural possibility, not a promised draw or a claim about remaining counts.

The one-away variant uses ordinary hand grammar, including Seven Pairs and
Thirteen Orphans. It does **not** optimize a named Yaku, price hypothetical future
scores, plan several replacements ahead, or model every Decree-specific hand
exception. Existing complete selections are still priced by the authoritative
scoring engine. Neither policy uses consumables or shops for synergies yet.

## Reproduce the comparison

Run from the repository root with Bun 1.3.3:

```sh
bun scripts/classic-balance.mts 200 --shop
bun scripts/classic-balance.mts 200 --shop --resources
bun scripts/classic-balance.mts 200 --shop --chase-hands
```

Add `--json` for per-seed output, policy/configuration labels, action counts,
complete hands, detected Yaku triggers, unused consumables, outcomes, and stop
diagnostics. `--seed=11` chooses the first seed. `--table=temple_stone --stake=8`
selects an explicit table/Stake combination. Unknown tables, invalid Stakes,
invalid seed ranges, extra positional arguments, and unknown flags fail rather
than silently substituting a different experiment. These are analysis controls;
they do not unlock anything in the player's saved progression.

The [stored results](balance/2026-09-09-classic-resources.json) contain all 600
per-run rows, column names, command lines, limitations, and aggregate results.
They represent **three policies on the same 200 seeds**, not 600 independent
participants. A source fingerprint covers non-test TypeScript under `src` and
`scripts`, plus the package manifest and lockfile; its exact algorithm is recorded
in the artifact. It identifies this dirty-worktree source snapshot, not a Git
commit or a deployed release.

## Results: Green Felt, Stake 1, cheapest-first shopping

| Measure | Baseline | Resources | Resources + one-away |
| --- | ---: | ---: | ---: |
| Seeds | 1–200 | 1–200 | 1–200 |
| Median Act reached | 1 | 2 | 2 |
| Maximum Act reached | 7 | 7 | 7 |
| Mean rounds cleared | 4.01 | 5.49 | 5.50 |
| Runs reaching Act 2 | 85 | 120 | 119 |
| Runs reaching Act 4 | 39 | 57 | 57 |
| Runs reaching Act 8 | 0 | 0 | 0 |
| Median run score | 1,337 | 4,605 | 3,754 |
| Committed plays | 3,705 | 4,691 | 4,707 |
| Complete hands | 0 | 0 | 2 |
| Redraw actions | 0 | 1,157 | 1,171 |
| Tiles redrawn | 0 | 3,466 | 3,486 |
| Real discards | 0 | 801 | 829 |
| One-away cycle attempts | 0 | 0 | 76 |
| Purchases | 1,301 | 1,784 | 1,791 |
| Unused consumables at run end | 377 | 466 | 464 |
| Invalid actions, no-advice stops, guard stops | 0 | 0 | 0 |

All 200 runs in each policy eventually lost. The baseline reproduces the earlier
4.01-round/1,337-score shopping checkpoint. Relative to baseline, resources clear
more rounds on 82 seeds, tie on 111, and clear fewer on 7. Relative to resources
alone, the one-away variant improves 5 seeds, ties 192, and worsens 3.

The two complete hands occurred on seeds 20 and 134; each triggered Menzen Tsumo
and Pinfu. These counts do not establish a conversion rate for one-away attempts:
the report counts actions and eventual complete plays, not causal attribution of
each specific attempted wait.

## What the evidence changes

1. Resource management has a measurable effect under this policy. Ignoring it
   materially understates the reach of the same candidate scorer.
2. Full-hand patterns remain rare in these runs, even with a limited deliberate
   chase. That supports investigating access to advanced patterns; it does not
   prove that skilled players cannot build them.
3. Extending the chase barely changes mean rounds and lowers median score. Do
   not automatically turn this experimental policy into the in-game coach.
4. Hundreds of acquired consumables remain unused. The next policy extension
   should exercise legal, meaningful consumable choices and purchases that
   support the build before changing late-Act targets from this evidence.
5. The extra purchases in resource-aware runs follow from reaching more shops;
   shopping policy is unchanged, but total acquisition is not held constant.
6. Table/Stake flags and smoke coverage make wider comparisons possible. They
   are not themselves balance measurements across all those combinations.

No scoring constants, live coach behavior, drop rates, run targets, or game rules
were changed by this measurement pass. Observed newcomer sessions and broader
effect/acquisition coverage remain required for the overall completion audit.

## Verification

- Eleven policy tests cover safe clear priority, resource fallback, preserved
  scoring tiles, locks, hidden-information boundaries, one-away selection,
  non-mutating decisions, and finite resource exhaustion through the real engine.
- Nineteen CLI tests cover invalid options, baseline counters, real resource
  actions, seeded repeatability including purchases, and all eight table IDs at
  Stake 8. These are command/termination checks, not evidence of balanced tables.
- Full unit/component suite: **599 tests across 52 files passed**.
- Strict TypeScript and the Pages-path production build passed. The production
  main JS/CSS hashes are unchanged from the resource-cycling checkpoint; the new
  policy is analysis tooling, not shipped UI.
- Policy/test files pass ESLint; the `.mts` CLI source is linted through the same
  TypeScript profile with `npx eslint --stdin --stdin-filename
  scripts/classic-balance.ts < scripts/classic-balance.mts`, because the current
  repository file glob does not include `.mts`. Prettier and whitespace checks
  cover the changed source files.
- The prior **156/156 browser checks** remain the latest browser checkpoint.
  This pass changes analysis scripts, tests, and documentation only; it did not
  rerun the unchanged browser application or claim fresh physical-device evidence.
