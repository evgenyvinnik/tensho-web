# Classic batch-aware hand planning

October 8, 2026. Analysis-only experiment; player rules, live advice, artwork,
prices, round targets and resource allowances are unchanged.

## Why investigate this

The [Austerity smoke test](CLOSED_HAND_AUSTERITY_IMPLEMENTATION.md) found zero
large plays in five Green Felt runs. That small sample cannot establish general
full-hand frequency. Inspection found that `--plan-hands` spends a full redraw
charge to replace exactly one tile, although the live action permits up to three.

## Opt-in policy

`--plan-batches` enables structural planning with batch redraws and implies
resource use. It is mutually exclusive with `--plan-hands` and `--chase-hands`.
The matrix option is `--planning=structural-batch`; the old default and the old
single-exchange policy remain unchanged.

First find the existing best legal single exchange: minimum retained shanten,
then maximum distinct improving types, then lowest removed base points. If that
choice is a discard, retain it. If it is a redraw, enumerate legal two/three-tile
redraws and retain only shapes at that same shanten distance. Prefer the largest
such batch; break ties by distinct improving types, then removed base points.
One-away shapes cannot lose extra useful tiles merely to fill a batch.

Only the visible fourteen-tile ordinary rack, public locks, immediate advice and
the authoritative action-legality callback are supplied. Hidden, enlarged,
incomplete, duplicate, bonus and incompatible fixed-size racks remain excluded.
Known immediate clears and complete-hand advice take precedence. Decisions
neither advance game RNG nor execute hypothetical effects, and replan only after
the actual action. Distinct improving types are not wall counts or draw odds.

This preserves structural distance, not guaranteed outcome or expected value.
Discard-before-redraw behavior, narrow grammar, unpriced resource effects,
tactical shopping and conservative consumable policy remain limitations.

## Measurement corrections and retained attempts

- The first control completed all 160 runs with zero diagnostic stops. It
  reports 62 large plays in 4,560 committed plays across 36 runs; the first five
  Green Felt rows exactly match the earlier smoke test. The raw report remains
  [unchanged](balance/2026-10-08-hand-batch-control.json).
- Its historical `completeHands` field counts selections larger than five tiles,
  including Shanten Clemency. It does **not** prove 62 genuine concealed completions.
  The first experimental batch was intentionally stopped while processing the
  fourth table after discovering this ambiguity; it produced no final report.
- New `completeConcealedHands` reads the authoritative run mastery counter,
  excluding Clemency's virtual completion. Historical missing values summarize
  as `null`, never a manufactured zero. Validation rejects negative, fractional
  and impossible counts.
- The original matrix note saying profile unlocks were bypassed was overly
  broad. Only table/Stake entry is selected directly. No profile is loaded;
  Decree, Charter and consumable resolvers use engine defaults. The original raw
  report is not rewritten; new report metadata states the actual behavior.

## Reproduce the corrected comparison

Output paths must not already exist. Change `structural` to `structural-batch`
and use a second path for the experimental run:

```sh
bun scripts/classic-balance-matrix.mts --runs=20 --seed=1 --stakes=1 --shopping=observed-build --planning=structural --output=docs/balance/new-batch-control.json
```

The matrix retains the 120-second child deadline, no-overwrite rule, source
fingerprint check, explicit policy validation and failure reporting. Different
actions can change later random trajectories despite matched starting seeds.

## Verification and results

Evidence directory: `/tmp/tensho-hand-batches-Isa13J`.

- Focused tests pass 75/75: one/two/three-tile choices, actual legality and locks,
  retained distance, immutable inputs/RNG/events, finite engine action allowances,
  reproducible command runs, mutually exclusive flags, policy labels and telemetry.

## Corrected matched results

Both completed reports cover seeds 1–20, all eight tables, Stake 1: **160 runs
per policy**. Their shared fingerprint is
`7d32fde9874caa8b0e71bc42d9186fd93374142b6e358894d971b3ffc374b82c`
(329 files), based on `d32b9f1c5056bde49454e6645dbef1aeeb3af0ff` and the
recorded working-tree changes. Both reports pass source consistency and finish
healthy with zero diagnostic stops. No rescue is used in either set.

- [Corrected single-exchange control](balance/2026-10-08-hand-batch-verified-control.json)
- [Batch experiment](balance/2026-10-08-hand-batch-verified-experiment.json)

Every one of the control's 160 gameplay rows exactly matches the first control
after excluding the new telemetry field. The new count confirms that all 62
large plays in this particular control really were concealed completions; this
was measured, not inferred from the old field.

| Measure | Single exchange | Batch redraw |
| --- | ---: | ---: |
| Victories | 12 | 22 |
| Rounds cleared | 1,661 | 2,079 |
| Committed plays | 4,560 | 5,144 |
| Genuine complete concealed hands | 62 | 115 |
| Runs with at least one genuine completion | 36 | 62 |
| Redraw actions | 2,829 | 3,119 |
| Tiles replaced by redraws | 3,032 | 7,856 |
| Diagnostic stops / rescue events | 0 / 0 | 0 / 0 |

Complete concealed hands rise from approximately **1.36% to 2.24% of plays**.
On paired table/seeds, batch planning clears more rounds in 65 cases, the same
number in 64, and fewer in 31. Mean cleared rounds improve on each table, but
victories do not: Dragon's Den falls from one victory to zero. This is mixed
per-run evidence, not a universal dominance claim.

| Table | Control wins / 20 | Batch wins / 20 | Control / batch completions |
| --- | ---: | ---: | ---: |
| Green Felt | 1 | 3 | 9 / 23 |
| Red Lacquer | 3 | 4 | 8 / 22 |
| Bamboo Mat | 1 | 4 | 10 / 15 |
| Imperial Gold | 2 | 4 | 9 / 13 |
| Night Market | 0 | 0 | 6 / 12 |
| Temple Stone | 0 | 0 | 1 / 10 |
| Ghost Parlor | 4 | 7 | 12 / 12 |
| Dragon's Den | 1 | 0 | 7 / 8 |

## What this supports next

The earlier five-run zero-completion observation is not a general impossibility
result. Better use of existing redraw charges improves this tested strategy
without changing targets or inventing extra resources. However, genuine complete
hands remain uncommon, and the policy cannot price modified grammar, larger racks,
future Yaku payoff or destructive resource costs.

This supports investigating **optional, clearly scoped player guidance for
retaining groups and exchanging several spare tiles**, with real action costs
and no automatic execution. It does not justify silently replacing the live coach
with this analysis policy, claiming human enjoyment, or marking the full project
complete. Higher Stakes, independent seed ranges and newcomer observation remain
outside this measurement. Full regression passes **2,628/2,628 in 190 files**;
lint reports zero errors and the existing 211 warnings. Typecheck/build and all
thirteen release checks pass.

## Publication verification

Published on main as **v1.0.261008-15**. Source commit
`f4abb8ed3569b9e78e2c214c794faef324737119`; version commit and tag target
`d7084584a3e68e54dce013bb8ea73d75b34bba95`.
[Workflow 37748382596](https://github.com/evgenyvinnik/tensho-web/actions/runs/37748382596)
passes independently, including all 2,628 tests in 190 files and Pages deployment.
The hosted `release.json` agrees with the version/tag/commit, and runtime entry
`assets/index-CTf5l-d2.js` contains the same version.

Two hosted English Austerity replay journeys pass, desktop Chromium and mobile
Chrome: portrait/details, staging and committing a genuine hand, scoring/mastery,
and saved reload. Evidence is in `hosted.log` and `hosted/` under the directory
above. This is a narrow unchanged-gameplay regression check, not a new broad
device/localization audit or evidence that the analysis policy is player-facing.
