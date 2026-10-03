# Classic table/Stake matrix

Measured October 3, 2026. This is a strategy measurement, **not a claim that the game is balanced or enjoyable**. It fills the missing current comparison across all eight playable table styles and all eight cumulative Stakes.

## Reproduce

```sh
bun scripts/classic-balance-matrix.mts --runs=20 --seed=1 --output=docs/balance/new-table-stakes.json
```

Default: all tables, all Stakes, 20 seeds per combination. Select a smaller comparison with `--tables=green_felt,temple_stone --stakes=1,8`. The policy is deliberately fixed to the existing `--shop --resources --consumables` policy: cheapest-first purchases, visible-information resource cycling and conservative consumable use. It does not silently enable one-away pursuit or a stronger strategy. Each cell runs the original Classic harness in a separate process; no player save or unlock data is read or written.

The runner rejects unknown/duplicate options, invalid ranges, duplicate cells, matrices over 10,000 runs, mismatched child configurations, missing/duplicated seeds and inconsistent outcomes. It refuses existing output files and refuses a mixed-source report if the source fingerprint changes during measurement. Progress goes to stderr, and the final report goes to stdout unless `--output` is supplied. Child-process failures abort; completed simulations with diagnostic stops remain in the report and cause exit status 2. They are never counted as normal defeats.

Each report retains exact commands, runtime, starting Git commit/dirty paths, a source fingerprint, per-cell summaries, **every original run row**, and policy limitations. The fingerprint covers sorted non-test TypeScript sources plus package/lock files; its precise algorithm is included. It describes the measured working-tree snapshot, not a deployment claim.

## Current evidence

[Raw results](balance/2026-10-03-classic-table-stakes.json): 64 combinations × the same seeds 1–20 = **1,280 runs**. These are not 1,280 independent people. Different table rules, action choices and sticker rolls can change later random trajectories even with the same starting seed.

- All 1,280 ended in genuine losses; zero invalid-action, no-advice, guard or other diagnostic stops.
- 19,490 committed plays, **7 complete hands**, 2,748 consumable uses and 5,271 purchases.
- 68 runs reached Act 4; none reached Act 8. The highest Act reached was 6 (Bamboo Mat in this sample).
- At Stake 1, median Act reached was 2 on seven tables and 1 on Dragon's Den. Two of those 160 runs lost before clearing the first round (one Bamboo Mat, one Dragon's Den).

Mean rounds cleared; **20 runs per cell**:

| Table | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Green Felt | 5.75 | 4.45 | 1.80 | 3.40 | 3.00 | 1.00 | 0.75 | 0.75 |
| Red Lacquer | 6.30 | 4.75 | 1.80 | 3.55 | 3.50 | 1.05 | 0.75 | 0.75 |
| Bamboo Mat | 5.50 | 4.30 | 3.10 | 3.75 | 2.90 | 0.55 | 0.65 | 0.75 |
| Imperial Gold | 5.70 | 4.60 | 2.85 | 4.35 | 4.00 | 1.35 | 1.20 | 1.30 |
| Night Market | 5.00 | 4.30 | 2.25 | 3.30 | 2.65 | 1.05 | 0.80 | 1.15 |
| Temple Stone | 5.15 | 5.05 | 3.75 | 3.45 | 4.00 | 1.65 | 1.20 | 1.90 |
| Ghost Parlor | 3.80 | 3.05 | 2.15 | 3.45 | 2.35 | 1.05 | 0.60 | 0.60 |
| Dragon's Den | 3.90 | 2.00 | 1.35 | 2.00 | 1.45 | 0.25 | 0.20 | 0.20 |

## What this changes—and does not

The all-table comparison is now reproducible instead of an unmeasured checklist item. It shows that the current tested strategy does not demonstrate ordinary late-run viability on any table, and that advanced hand patterns barely participate in these simulated runs. A purely cosmetic pass cannot address that evidence.

It does **not** establish that targets are impossible or that S4 is easier than S3. The sample is small, shopping is naive, the policy does not sell/replace Decrees, price destructive Scripts, seek build synergies or deliberately plan Yaku, and it has no future-wall knowledge. Non-monotonic cell averages are not causal estimates of sticker difficulty. There is no confidence or optimal-play claim.

Next: add a separately selectable build-aware shopping/hand-planning policy, compare it on matched seeds, then use those results alongside newcomer observation to propose tuning. Keep the baseline and raw failures. No target, reward, drop-rate, live coach, default-mode or gameplay rule changed in this checkpoint. Existing generated artwork is unchanged; this is analysis tooling, not a new visual asset.

## Verification

- 23 new matrix checks passed, including the real four-cell command and exact equality with the original single-cell command.
- Strict TypeScript and targeted lint passed, including the `.mts` script through the TypeScript stdin profile.
- The measured 64-cell command completed with source unchanged and zero diagnostic stops. The raw artifact retains the complete source fingerprint and rows.
- The combined harness, resource, consumable and matrix regression passed **85/85** at unchanged deadlines. Prior browser verification belongs to the unchanged deployed application; no new physical-device or player-experience claim is made here. CI evidence will be recorded after publication.
