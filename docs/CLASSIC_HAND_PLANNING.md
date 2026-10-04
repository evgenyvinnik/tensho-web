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
