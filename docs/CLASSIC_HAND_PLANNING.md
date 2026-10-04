# Classic structural hand-planning experiment

October 3, 2026. Analysis only: the live coach, scoring targets and prices are
unchanged. Building full hands remains a design and human-playtesting question.

## Policy

`classic-balance.mts --plan-hands` adds public-information structural planning
before the existing resource policy. It implies resources and cannot be combined
with `--chase-hands`. The matrix exposes `--planning=structural`; default is off.

On exactly fourteen visible, unique, ordinary rack tiles, consider each unlocked
physical tile whose discard or single-tile redraw passes the engine validator.
Prefer discard when both are legal. Retain the thirteen-tile shape with minimum
existing shanten distance (standard, Seven Pairs or Orphans); tie-break by the
number of distinct improving types, then lowest discarded base points. Replan
after the actual draw. These are types, not remaining copies or probabilities.

Skip hidden, incomplete, enlarged, bonus or duplicate racks, incompatible fixed
play sizes, missing advice, already complete hands and known immediate clears.
No future wall, seed, unseen identities, speculative effect execution or run RNG
is supplied. Fourteen unit cases cover multi-draw planning, competing waits,
special forms, guards, actual finite allowances and input/RNG/event invariance.

Limitations: this is a deliberately narrow single-exchange heuristic, not a
Yaku-value optimizer or custom-Decree grammar solver. Spending resources on hand
shape can worsen short-term survival. Fixed-seed engine runs cannot establish
human enjoyment or optimal balance.

## Original matched comparison and real defect

Twenty seeds per eight tables, Stake 1 only, observed-build shopping and
consumables: 160 runs per policy. Retained raw reports:

- `balance/2026-10-03-hand-plan-control.json`
- `balance/2026-10-03-hand-plan-structural.json`

Both fingerprint the pre-Bell-fix source as
`4daca5d7d0fb64c8ddf08308ef105280b377ded021316bcb40c046b3ff3d2f53`.

| Policy | Cleared rounds | Victories | Complete hands | Plays | Diagnostic stops |
| --- | ---: | ---: | ---: | ---: | ---: |
| Control | 1,823 | 5 | 0 | 5,667 | 0 |
| Structural | 1,624 | 7 | 6 | 4,832 | 1 |

Structural made 6,622 planning exchanges; neither policy used rescue. Every
pre-existing control row field matched the prior observed-build report.
**The structural report is unhealthy and exited 2.** Imperial Gold, seed 6,
Act 8 Boss stopped with `noAdvice`: six accumulated Bell locks left no legal
tactical play. This is not a victory or ordinary defeat. The user confirmed the
[single-lock Bell correction](CERULEAN_BELL_IMPLEMENTATION.md); the original
failure report remains unmodified.

## Confirmed-rule remeasurement

Command pair (change `off` to `structural` and choose a new output path):

```sh
bun scripts/classic-balance-matrix.mts --runs=20 --seed=1 --stakes=1 --shopping=observed-build --planning=off --output=docs/balance/2026-10-03-bell-hand-control.json
```

Control completed 160 runs with no diagnostic stops. Its source fingerprint is
`1f5b1f98c73bed5251e92bad43b29c43ed2340807f1a8f19d1e0e86df3292065`.
The first structural remeasurement finished Green Felt but its Red Lacquer cell
hit the existing 120-second child deadline (`spawnSync bun ETIMEDOUT`, exit 1).
No complete structural report was written. Other validation was running on the
host; contention is possible but not a proven explanation. The deadline and
policy are unchanged. Do not infer a fresh paired result from this incomplete
attempt. Subsequent host inspection showed a one-minute load average of 651.45;
the broad remeasurement is deferred rather than adding more heavy work or
extending the deadline. Direct engine, saved-run, native browser and production
checks independently verify the confirmed Bell rule, but are not a replacement
for the unfinished strategy comparison.

## Completed confirmed-rule comparison — October 3 local / October 4 UTC

After host load subsided, the unchanged 120-second-per-cell matrix completed.
A new control was measured before any subsequent implementation edits. Both
160-run artifacts have fingerprint
`33d233012a18fd1d1f4e4b2a9dcdf6fa931f4506bbc6e95d1408bf816c85613f`:

- `balance/2026-10-04-bell-hand-control.json`
- `balance/2026-10-04-bell-hand-structural.json`

Both report healthy, with zero diagnostic stops and zero rescues. The control's
entire cell data exactly reproduces the preceding Bell control. The initial
unhealthy report and timed-out attempt above remain historical evidence.

| Policy | Cleared rounds | Victories | Complete hands | Plays | Planning exchanges |
| --- | ---: | ---: | ---: | ---: | ---: |
| Control | 1,823 | 5 | 0 | 5,667 | 0 |
| Structural | 1,625 | 8 | 6 | 4,836 | 6,623 |

| Table, Stake 1 | Control wins / 20 | Structural wins / 20 | Structural complete hands |
| --- | ---: | ---: | ---: |
| Green Felt | 1 | 0 | 0 |
| Red Lacquer | 1 | 3 | 1 |
| Bamboo Mat | 2 | 1 | 1 |
| Imperial Gold | 1 | 2 | 1 |
| Night Market | 0 | 0 | 1 |
| Temple Stone | 0 | 0 | 0 |
| Ghost Parlor | 0 | 2 | 1 |
| Dragon's Den | 0 | 0 | 1 |

On paired seeds, structural clears more rounds in 56 runs, fewer in 60 and the
same number in 44. Only two of its eight victories contain a complete hand
(Red Lacquer seed 7 and Imperial Gold seed 6). The formerly deadlocked Imperial
Gold seed 6 now clears all 24 rounds, scoring 1,048,219 in 54 plays with one
complete hand. Its 94 planning exchanges are legal and no rescue is used.

Conclusion: this verifies the exact Bell diagnostic is resolved and establishes
some full-hand-play viability. It is mixed progression evidence: a few more
victories accompany fewer total cleared rounds and only six complete hands in
4,836 plays. It does not justify turning this narrow heuristic into the live
coach, changing targets, or claiming that complete-hand planning is satisfying.
Higher Stakes, broader grammar, cost-aware resource conservation and human
playtesting remain open.
