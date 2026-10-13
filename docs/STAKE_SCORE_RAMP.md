# Stake score ramp

Measured October 12, 2026 on the release v1.0.261011-15 source. This is a
**post-release balance change** and needs the owner's approval before it ships.

## Problem

Table Stakes stack their score scaling: Green (tier 3) multiplies targets by
1.3, Purple (tier 6) by a further 1.5, so tiers 6–8 use ×1.95. `RoundManager`
applied that multiplier to every round from Act 1. Purple's first Small round
was 585 instead of 300 before the player had visited a single shop.

Balatro leaves Ante 1 alone on every stake and makes higher stakes scale faster
in later Antes. On the bot baseline below, Stakes 6–8 ended 17 of 20 runs in
Act 1 and never won.

## Change

Stake scaling now ramps in by Act. The table target multiplier is unchanged.

```
stakeMultiplier(act) = scoreScaling ^ clamp((act − 1) / (4 − 1), 0, 1)
target = floor(baseTarget × stakeMultiplier(act) × tableTargetMultiplier)
```

| Act | Green–Blue (×1.3) | Purple–Gold (×1.95) | Purple Small target (was) |
| --- | ---: | ---: | ---: |
| 1 | ×1.000 | ×1.000 | 300 (585) |
| 2 | ×1.091 | ×1.249 | 999 (1,560) |
| 3 | ×1.191 | ×1.561 | 3,121 (3,900) |
| 4–8 | ×1.300 | ×1.950 | 9,750 … 97,500 (unchanged) |
| Endless (9+) | ×1.300 | ×1.950 | unchanged |

- `getActScoreScaling` and `STAKE_SCALING_FULL_ACT` in
  `src/config/stakeDefinitions.ts` are the one source of the rule.
  `RoundManager` uses it for `startAct`, for the Boss target after a Mandate
  reroll, and for Endless Acts. `TableStakeSystem.getScaledScoreRequirement`
  now takes the Act too.
- From Act 4 on, every target is the same as before, including Endless.
- Saves need no migration. A saved Act keeps the targets it was created with,
  and the next Act uses the ramp.
- The Active rules copy in all 13 locales now says Act 1 matches White and the
  multiplier rises each Act to its full value from Act 4. The English
  `stakeDefinitions` descriptions match.

### Why this curve

- **Act 1 at ×1.** The player has no build before the first shop, so a Stake
  can only add luck there, not challenge. This follows Balatro's precedent.
- **Full at Act 4.** That is the middle of the eight Acts, so Acts 4–8 all
  carry the full penalty and higher Stakes still bite by mid-game. A ramp to
  Act 5 was measured too (seeds 1–20). It let 7 of 20 Purple runs reach
  Act 5, against 4 of 20 with the Act 4 ramp and 9 of 20 on White, so Purple
  barely differed from White. A ramp to Act 3 was within noise of Act 4 but
  made a steeper jump into Act 3.
- **Equal ratio per Act, not linear.** Base targets themselves grow by a ratio
  (×2.2–2.7 per Act through Act 5), so a constant ratio keeps each Act's added
  pressure proportional. A linear ramp puts more of the increase into Act 2
  (Purple ×1.32 instead of ×1.25), where the build is weakest. The measured
  difference was within noise, so the choice rests on that reasoning.
- **Dragon's Den stays flat.** Its +25% target is a table rule paired with
  its Yakuman bonus, both shown on the table card from Act 1. Ramping it would
  change what that card promises. Gold on Dragon's Den now starts at 375
  (300 × 1.25) instead of 731.

## Measurement

Each Stake was run on Green Felt with the same 20 seeds as the baseline:

```sh
bun scripts/classic-balance.mts 20 --shop --build-shop --resources --plan-hands --consumables --table=green_felt --stake=N --json
```

These results describe this bot policy. They do not measure human difficulty.

### Before and after, seeds 1–20

Each cell reads before → after. "Act 1 losses" counts runs that ended in
Act 1.

| Stake | Mean rounds | Median Act | Act 1 losses | Reached Act 5 | Wins |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 9.35 → 9.35 | 2 → 2 | 8 → 8 | 9 → 9 | 1 → 1 |
| 2 | 9.45 → 9.45 | 2 → 2 | 10 → 10 | 9 → 9 | 2 → 2 |
| 3 | 4.50 → 8.00 | 1 → 2 | 15 → 10 | 3 → 8 | 0 → 0 |
| 4 | 7.95 → 9.65 | 2 → 4 | 10 → 4 | 8 → 8 | 1 → 0 |
| 5 | 6.45 → 9.65 | 2 → 4 | 10 → 4 | 4 → 8 | 0 → 0 |
| 6 | 2.60 → 6.90 | 1 → 3 | 17 → 4 | 3 → 4 | 0 → 0 |
| 7 | 2.05 → 8.80 | 1 → 3 | 17 → 5 | 2 → 6 | 0 → 0 |
| 8 | 1.50 → 6.00 | 1 → 3 | 17 → 6 | 0 → 1 | 0 → 0 |

The "before" column reproduces the October 11 baseline (9.3, 9.4, 4.5, 8.0,
6.5, 2.6, 2.0, 1.5 mean rounds). Stakes 1–2 have no score scaling, so they
are unchanged run for run.

### Larger sample, seeds 1–100

Twenty seeds per Stake is a small, bimodal sample: on White, 8 of 20 runs
end in Act 1 and 9 reach Act 5. To check the shape, the same command was also
run for seeds 21–100 (`--seed=21` and `--seed=61`, 40 runs each) before and
after.

| Stake | Mean rounds | Median Act | Act 1 losses | Reached Act 5 | Reached Act 7 | Wins |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 11.37 → 11.37 | 5 → 5 | 26 → 26 | 54 → 54 | 25 → 25 | 4 → 4 |
| 2 | 10.63 → 10.63 | 4 → 4 | 36 → 36 | 48 → 48 | 29 → 29 | 8 → 8 |
| 3 | 5.96 → 9.78 | 1 → 4 | 63 → 36 | 23 → 44 | 15 → 21 | 3 → 3 |
| 4 | 5.94 → 9.10 | 1 → 4 | 57 → 29 | 25 → 36 | 9 → 16 | 1 → 0 |
| 5 | 5.54 → 8.59 | 1 → 3 | 58 → 30 | 22 → 34 | 8 → 12 | 0 → 0 |
| 6 | 1.68 → 6.98 | 1 → 3 | 88 → 30 | 8 → 21 | 1 → 5 | 0 → 0 |
| 7 | 1.88 → 7.81 | 1 → 3 | 86 → 32 | 7 → 25 | 3 → 8 | 0 → 0 |
| 8 | 1.51 → 5.56 | 1 → 2 | 87 → 36 | 4 → 10 | 1 → 1 | 0 → 0 |

### Reading the numbers

- **The Act 1 wipeout is gone.** Before, Stakes 6–8 lost 86–88 of 100 runs in
  Act 1, and adding Green's ×1.3 took Act 1 losses from 36 on Stake 2 to 63
  on Stake 3. After, Act 1 losses are 26–36 on every Stake, because Act 1
  targets are now identical.
- **Difficulty now rises with the Stake and lands mid-game.** Over 100 seeds,
  mean rounds fall 11.4, 10.6, 9.8, 9.1, 8.6, 7.0, 7.8, 5.6, and runs
  reaching Act 5 fall 54, 48, 44, 36, 34, 21, 25, 10. Among runs that survive
  Act 1, Gold clears 8.1 rounds against White's 15.0. Only 1 Gold run in 100
  reaches Act 7.
- **Higher Stakes are still not winnable for this bot.** Stakes 4–8 won none
  of their 500 runs after the change, against 1 before (on Stake 4). The ramp
  moves the difficulty later; it does not make Gold easy. Wins are rare for
  this policy even on White (4 of 100).
- **Two small inversions are sampling, not difficulty.** From Stake 4,
  `TeaHouseSystem.generateStickers` draws an extra value from the shop's random
  stream for each Decree offered, to roll Eternal. Every later offer then
  differs from Stakes 1–3 on the same seed. Orange (Stake 7) and Gold
  (Stake 8) each add another roll and change the stream again. That is why
  Stake 7 edges Stake 6 here, and why 20 seeds show Stake 4 ahead of Stake 3,
  both before (7.95 vs 4.50) and after. On seeds 5, 18 and 20, Stakes 1–3 lose
  in Act 1 while Stakes 4–8 survive it with identical targets.

## Not changed

- No base target, round multiplier, Boss Mandate multiplier, reward, sticker,
  price or table modifier changed.
- The sticker roll's effect on the shop stream is noted, not fixed. Fixing it
  would change every Stake 4+ seed's shop and belongs in its own change. See
  [SHOP_STICKER_STREAM.md](SHOP_STICKER_STREAM.md).
