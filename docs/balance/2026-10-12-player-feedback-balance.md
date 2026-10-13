# Player-feedback rules: same-seed balance report

October 12, 2026. Compares the Classic loop before the player-feedback rules
(commit `fc42399`), with the new rules on the old score targets, and with the
new rules on the raised targets that shipped. Every cell is 40 runs on seeds
1–40 with the same policy, table and Stake. Three-value cells read **before →
new rules, old targets → final**; two-value cells read **before → final**.

The new rules that move balance: one shared budget of six Turns (Play and
REDRAW each spend one; free redraws first) instead of four hands plus separate
discards and redraws; plays of up to six tiles; pattern Mult (`(groups − 1)` +
Triplet/Straight-of-four 1, Quad/Straight-of-five 2, Mahjong +4); Winds worth 50
points and +2 Mult per grouped Dragon; "+N Mult" Decrees adding to the play's
Mult instead of multiplying it; swift clears earning the Omen Skip used to.

| Policy | Table | Stake | Wins (of 40) | Mean rounds cleared | Reached Act 2 | Reached Act 4 | Reached Act 8 | Plays per clear | Median run score |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| Observed-build | Dragon's Den | 1 | 0 → 10 → **4** | 6.1 → 16.4 → **14.9** | 42% → **100%** | 30% → 80% → **80%** | 2% → 40% → **22%** | 3.34 → **2.92** | 1,452 → **173,644** |
| Observed-build | Dragon's Den | 4 | 0 → 3 → **1** | 4.2 → 12.4 → **12.1** | 32% → **100%** | 25% → 62% → **62%** | 0% → 12% → **2%** | 4.16 → **3.49** | 670 → **72,215** |
| Observed-build | Green Felt | 1 | 2 → 13 → **7** | 9.8 → 17.3 → **16.1** | 72% → **100%** | 48% → 82% → **82%** | 12% → 45% → **30%** | 2.85 → **2.72** | 19,256 → **222,982** |
| Observed-build | Green Felt | 4 | 1 → 8 → **1** | 6.5 → 15.2 → **13.5** | 48% → **100%** | 32% → 70% → **70%** | 8% → 35% → **20%** | 3.59 → **3.24** | 1,689 → **147,749** |
| Observed-build + REDRAW + items | Dragon's Den | 1 | 4 → 13 → **5** | 10.0 → 15.9 → **15.0** | 57% → **100%** | 52% → 75% → **75%** | 15% → 40% → **25%** | 3.00 → **2.38** | 38,374 → **257,859** |
| Observed-build + REDRAW + items | Dragon's Den | 4 | 2 → 6 → **1** | 6.5 → 14.2 → **12.4** | 45% → **98%** | 38% → 68% → **68%** | 8% → 28% → **8%** | 3.56 → **2.64** | 2,022 → **103,136** |
| Observed-build + REDRAW + items | Green Felt | 1 | 4 → 19 → **10** | 12.5 → 19.2 → **18.0** | 80% → **100%** | 62% → 88% → **88%** | 20% → 57% → **45%** | 2.77 → **2.34** | 55,174 → **491,161** |
| Observed-build + REDRAW + items | Green Felt | 4 | 3 → 7 → **2** | 8.6 → 15.3 → **14.4** | 57% → **100%** | 45% → 72% → **72%** | 10% → 30% → **20%** | 3.28 → **2.48** | 14,412 → **143,788** |
| Cheapest-first | Dragon's Den | 1 | 0 → 2 → **0** | 2.9 → 12.0 → **10.7** | 28% → **100%** | 15% → 65% → **65%** | 0% → 5% → **2%** | 5.28 → **3.17** | 958 → **51,571** |
| Cheapest-first | Dragon's Den | 4 | 0 → 2 → **1** | 1.8 → 10.2 → **9.7** | 20% → **100%** | 10% → 55% → **55%** | 0% → 5% → **2%** | 7.00 → **3.45** | 670 → **41,602** |
| Cheapest-first | Green Felt | 1 | 0 → 2 → **1** | 4.8 → 12.9 → **12.1** | 52% → **100%** | 22% → 75% → **75%** | 0% → 8% → **5%** | 4.17 → **2.92** | 2,248 → **51,887** |
| Cheapest-first | Green Felt | 4 | 0 → 3 → **0** | 2.6 → 11.2 → **10.7** | 28% → **100%** | 10% → 62% → **62%** | 0% → 8% → **2%** | 5.66 → **3.32** | 946 → **48,080** |

Reproduce a cell with, for example:

```bash
bun scripts/classic-balance.mts 40 --build-shop --resources --consumables --table=green_felt --stake=1 --json
```

## Reading

- **Early clears.** Act 1 is now cleared in every measured run (it was 20–80%
  depending on policy). Plays per clear fell for every policy, most for the
  naive one (4.2–7.0 → 2.9–3.5): fewer stalled rounds and fewer dead Turns.
  This is the "a newcomer should get going" outcome the feedback asked for.
- **Scores.** Median run scores are 3–100× higher, so big plays feel big; the
  score display and the Doom-fire celebration are scaled to the share of the
  round target, not to fixed numbers.
- **Late game.** On the old targets the new rules made Act 8 far too reachable
  (strongest policy, Green Felt Stake 1: 4 → 19 wins of 40). Acts 4–8 were
  raised to 6,000 / 15,000 / 30,000 / 55,000 / 90,000 (from 5,000 / 11,000 /
  20,000 / 35,000 / 50,000); Acts 1–3 are unchanged. That brings the strongest
  policy to 10 of 40 and Stake 4 back to 1–2 wins, while Act 4 is still
  reached far more often than before (a naive shopper: 22% → 75%).
- **Stalls.** No run ended in a diagnostic stop. Position-only "blind" plays
  (concealed racks with no score preview) rose from 66 to 169 across the
  matrix, in proportion to the many more plays made.

These are bot policies, not people: they say the curve moved in the intended
direction, not that the game is fun or fair. A newcomer playtest is still the
real check.
