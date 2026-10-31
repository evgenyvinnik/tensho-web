# Gold surplus and the emergency Turn

October 31, 2026. A player reported finishing Act 6 on White Stake with
hundreds of unspent Gold. This report measures where Gold comes from, why it
piles up, and the emergency Turn added in response.

## Where Gold comes from

300 seeds, Green Felt, Stake 1, `--build-shop --resources --consumables`.
Three shopping behaviours were compared in a measurement-only copy of the
harness: the standard policy (buys the cheapest affordable item every visit),
**Decrees only** (buys build Decrees, nothing else), and **saver** (also buys
other items, but only while keeping 25 Gold for full interest).

Winning runs, mean Gold per run:

| Source                                |   Saver | Decrees only |
| ------------------------------------- | ------: | -----------: |
| Round rewards (3 / 5 / 10)            |     110 |          108 |
| Interest (cap 5)                      |      81 |           78 |
| Omens (swift clears)                  |      39 |           38 |
| Selling, Gold tiles, Decrees, other   |      48 |           13 |
| **Total income**                      | **278** |      **236** |
| Spent in the Tea House                |     202 |           42 |
| **Gold at the end of Act 6 (median)** |  **70** |      **189** |

Total income is close to Balatro's. The surplus comes from spending: a
player who buys only Decrees spends 42 Gold across 18 visits, because once
the five Decree slots are full the shop offers little they want. That
matches the report (Decrees-only winners: median 189 Gold, 90th percentile
251, maximum 311).

Cutting income punishes spenders more than hoarders. Measured on the same
seeds:

| Change             | Decrees-only end Gold | Standard-policy wins |
| ------------------ | --------------------: | -------------------: |
| Today              |                   189 |                65.0% |
| Boss reward 10 → 5 |                   158 |                57.0% |
| Interest cap 5 → 3 |                   159 |                64.7% |
| Both               |                   129 |                56.7% |

No income cut was made.

## The emergency Turn

On **Red Stake and above** (tier 2+), from Act 2, on the last Turn of a
round, the player can buy one more Turn with Gold. White Stake and Act 1 are
unchanged. The price is `5 × Act` and doubles with each Turn bought in the
same round (Act 2: 10, 20, 40; Act 6: 30, 60, 120). It is offered only while
the round is still short of its target. A bought Turn cannot earn a
swift-clear Omen (at most one Turn is ever spare after it) or bypass The
Needle's single Play.

On Red the Stake now has a felt economy: the Small-round Gold it withholds is
Gold that could have bought a rescue.

- Rule: `emergencyTurnCost`, `EMERGENCY_TURN_FIRST_ACT` and
  `EMERGENCY_TURN_FIRST_STAKE` in `src/game/playRules.ts`;
  `GameOrchestrator.getEmergencyTurnOffer` and the `buyTurn` action.
- Saves carry `emergencyTurnsBoughtThisRound`; older saves load as zero.
- UI: on the last Turn REDRAW cannot be used, so its slot offers "+1 Turn"
  with the price (disabled when Gold is short). Buying one brings REDRAW
  back. Taking an existing slot keeps the bar's height, so the offer never
  covers the rack, even with a larger hand. While a free redraw is left,
  REDRAW keeps its slot. The Stake rules list (header badge and table
  picker) and the tutorial's Turns step describe it. All 13 languages.

### Price tuning

The harness gained an opt-in `--emergency-turns` policy: on the last Turn,
buy when the best visible play cannot reach the target and the Turn is
affordable.

```sh
bun scripts/classic-balance.mts 300 --build-shop --resources --consumables --emergency-turns --table=green_felt --stake=2 --seed=1
```

The price was tuned before the feature was limited to Red and above, with
the rule temporarily enabled on Stake 1 so it could be compared against
three shopping behaviours. 300 seeds; "rescued" counts seeds that lost
without the feature and won with it. No seed went the other way in any
cell.

| Policy       |   Off | 3 / Act |           **5 / Act** | 8 / Act |
| ------------ | ----: | ------: | --------------------: | ------: |
| Standard     | 65.0% |   65.3% |             **65.0%** |   65.0% |
| Saver        | 68.7% |   71.0% | **70.0%** (4 rescued) |   69.3% |
| Decrees only | 40.3% |   44.0% | **42.0%** (5 rescued) |   41.0% |

5 per Act moves win rates by two points or less for every policy. No run
ends in Act 1 in any cell.

As shipped (Red and above only), same 300 seeds:

| Stake    | Policy   |   Off |                                     On |
| -------- | -------- | ----: | -------------------------------------: |
| 1 White  | Standard | 65.0% | 65.0% (0 Turns bought; identical runs) |
| 2 Red    | Standard | 59.0% |      59.7% (27 Turns bought, 455 Gold) |
| 3 Green  | Saver    | 56.0% |                                  58.0% |
| 6 Purple | Saver    | 32.7% |                                  35.3% |

Red stays clearly harder than White. The emergency Turn gives stored Gold a
purpose, as insurance, but does not drain it: a rich player seldom needs a
rescue. Spending more of the surplus would need a further sink, such as
Act-scaled shop prices or more late-run purchases.

These are heuristic-policy outcomes, not human win rates.

## Also found

- Dragon Hoard (×1.2 Mult per 10 Gold) and Infinite Wealth (×1.1 per 10
  Gold) compound without a cap: at 300 Gold, Dragon Hoard is about ×237. A
  Gold surplus makes them run-breaking. Unchanged here.
