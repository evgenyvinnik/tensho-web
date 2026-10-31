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

From Act 2, on the last Turn of a round, the player can buy one more Turn
with Gold. The price is `5 × Act` and doubles with each Turn bought in the
same round (Act 2: 10, 20, 40; Act 6: 30, 60, 120). Act 1 is unchanged. It
is offered only while the round is still short of its target, and a bought
Turn cannot earn a swift-clear Omen (at most one Turn is ever spare after
it) or bypass The Needle's single Play.

- Rule: `emergencyTurnCost` and `EMERGENCY_TURN_FIRST_ACT` in
  `src/game/playRules.ts`; `GameOrchestrator.getEmergencyTurnOffer` and the
  `buyTurn` action.
- Saves carry `emergencyTurnsBoughtThisRound`; older saves load as zero.
- UI: a "+1 Turn · price" row in the action bar on the last Turn, shown
  disabled when Gold is short. The tutorial's Turns step explains it. All
  13 languages.

### Price tuning

The harness gained an opt-in `--emergency-turns` policy: on the last Turn,
buy when the best visible play cannot reach the target and the Turn is
affordable.

```sh
bun scripts/classic-balance.mts 300 --build-shop --resources --consumables --emergency-turns --table=green_felt --stake=1 --seed=1
```

Stake 1, 300 seeds. "Rescued" counts seeds that lost without the feature and
won with it; no seed went the other way in any cell.

| Policy       |   Off | 3 / Act |           **5 / Act** | 8 / Act |
| ------------ | ----: | ------: | --------------------: | ------: |
| Standard     | 65.0% |   65.3% |             **65.0%** |   65.0% |
| Saver        | 68.7% |   71.0% | **70.0%** (4 rescued) |   69.3% |
| Decrees only | 40.3% |   44.0% | **42.0%** (5 rescued) |   41.0% |

5 per Act keeps White within two points of today for every policy, as
requested. No run ends in Act 1 in any cell. Higher Stakes move similarly
(saver at Stake 3: 56.0% → 58.0%; Stake 6: 32.7% → 35.3%).

The emergency Turn gives stored Gold a purpose, as insurance, but does not
drain it: the Decrees-only player still finishes near 186 Gold, because a
rich player seldom needs a rescue. Spending more of the surplus would need a
further sink, such as Act-scaled shop prices or more late-run purchases.

These are heuristic-policy outcomes, not human win rates.

## Also found

- Dragon Hoard (×1.2 Mult per 10 Gold) and Infinite Wealth (×1.1 per 10
  Gold) compound without a cap: at 300 Gold, Dragon Hoard is about ×237. A
  Gold surplus makes them run-breaking. Unchanged here.
