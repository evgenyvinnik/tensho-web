# Red Stake candidates: same-seed measurement

October 31, 2026. A player switched to Stake 2 and saw no change in play. This
measures the current Stake ladder on a larger sample and compares five
candidate Red Stake rules. **No balance change has shipped**; this report is
for the owner to choose from.

The visibility fixes that shipped with this report are separate: the run
header now shows the Stake as a tappable badge listing its active rules
(previously only a hover tooltip on the Gold counter), and the Tea House
payout explains a withheld clear reward ("Red Stake: this round's 3G reward
is withheld") instead of showing an unexplained +0G.

## Method

300 seeds (1–300) per cell, Green Felt, the same policy as the
[first-win campaign report](2026-10-25-first-win-campaign.md):

```sh
bun scripts/classic-balance.mts 300 --build-shop --resources --consumables --table=green_felt --stake=N --seed=1 --json
```

Candidates were applied in a throwaway worktree through an environment switch
that only acted when Red's rule (`noSmallRoundReward`) was active, so every
cell above Stake 1 includes it cumulatively. The switch is not in the source
tree. At 40 seeds the harness reproduced the October 25 figures exactly
(White 22, Red 23, Green 19 wins).

These are heuristic-policy outcomes, not human win rates.

## Current ladder

| Stake    |  Wins | Mean rounds | Reached Act 4 | Reached Act 6 | Gold spent / run |  Step |
| -------- | ----: | ----------: | ------------: | ------------: | ---------------: | ----: |
| 1 White  | 65.0% |       15.57 |           85% |           70% |              142 |     — |
| 2 Red    | 59.0% |       14.97 |           82% |           65% |              119 |  −6.0 |
| 3 Green  | 52.3% |       14.32 |           77% |           59% |              113 |  −6.7 |
| 4 Black  | 51.0% |       14.27 |           77% |           58% |              112 |  −1.3 |
| 5 Blue   | 44.0% |       13.66 |           73% |           52% |              107 |  −7.0 |
| 6 Purple | 27.7% |       12.31 |           67% |           37% |               96 | −16.3 |
| 7 Orange | 25.7% |       12.16 |           66% |           36% |               95 |  −2.0 |
| 8 Gold   | 18.0% |       11.72 |           65% |           29% |               80 |  −7.7 |

At 300 seeds Red is a real but small step (paired seeds: 45 White wins lost,
27 White losses won). The 40-seed sample in the October 25 report was too
small to show it. Red's −3 Gold per Act is spread across the run, so no single
round shows it. Black (−1.3) and Orange (−2.0) are near no-ops for this
policy, which rarely wants to sell Decrees, and Purple is a cliff (−16.3).

## Red candidates

All keep Red's existing rule (Small rounds pay no reward Gold) and add one
change.

| Candidate                  |  Red wins | Green wins (Red + Green) | Gold spent / run at Red | Paired vs White |
| -------------------------- | --------: | -----------------------: | ----------------------: | --------------- |
| Current: Small pays 0      |     59.0% |                    52.3% |                     119 | −45 / +27       |
| Interest cap 5 → 3         |     60.0% |                    52.7% |                     119 | −43 / +28       |
| Start with 0 Gold (from 4) |     60.0% |                    51.3% |                     116 | −49 / +34       |
| **Large pays 2 (from 5)**  | **52.0%** |                **42.0%** |                  **97** | −63 / +24       |
| **Boss targets ×1.25**     | **52.0%** |                **42.3%** |                     113 | −60 / +21       |
| Large pays 0 too           |     42.7% |                    33.7% |                      84 | −78 / +11       |
| No clear reward at all     |     23.3% |                    18.7% |                      32 | −131 / +6       |

The interest cap and starting Gold make no measurable difference: this
policy rarely holds 15+ Gold, and 4 starting Gold is recovered by the first
clear. No candidate caused an Act 1 loss.

Cumulative effect on the higher Stakes (wins):

| Candidate          |    S4 |    S5 |    S6 |    S7 |    S8 |
| ------------------ | ----: | ----: | ----: | ----: | ----: |
| Current            | 51.0% | 44.0% | 27.7% | 25.7% | 18.0% |
| Boss targets ×1.25 | 42.0% | 37.0% | 24.7% | 23.0% | 16.0% |
| Large pays 0 too   | 32.7% | 29.0% | 19.0% | 18.3% | 13.3% |

## Options

- **Large pays 2.** Keeps Red as the economy Stake (Green is score, Blue
  is Turns). Two of three payouts each Act show the withheld reward, and the
  build shrinks by about a third (142 → 97 Gold spent). Red becomes as hard as
  today's Green.
- **Boss targets ×1.25.** The difference is on screen at every Boss, from
  Act 1 (600 → 750), and the finale rises to 45,000. Same difficulty
  step as Large pays 2, but it overlaps Green's identity.
- **Large pays 0 too.** Unmistakable, but a −22 point step, larger than
  anything else on the ladder except Purple.

Whichever is chosen, Black and Orange deserve the same review: by this
measure they change almost nothing.
