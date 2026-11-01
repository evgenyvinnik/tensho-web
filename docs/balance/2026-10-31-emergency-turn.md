# Gold surplus, the emergency Turn, and Red Stake's Boss rule

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
unchanged. The price is deliberately steep: `10 × Act`, doubling with each
Turn bought in the same round (Act 2: 20, 40, 80; Act 6: 60, 120, 240). It is
offered only while the round is still short of its target. A bought Turn
cannot earn a swift-clear Omen (at most one Turn is ever spare after it) or
bypass The Needle's single Play.

When Gold is short, the same Turn can be taken for a **watched rewarded
ad**, once per Act, if ads are configured (off by default; see
[Rewarded ads](../REWARDED_ADS.md)).

- Rule: `emergencyTurnCost`, `EMERGENCY_TURN_FIRST_ACT`,
  `EMERGENCY_TURN_FIRST_STAKE` and `AD_TURNS_PER_ACT` in
  `src/game/playRules.ts`; `GameOrchestrator.getEmergencyTurnOffer` and the
  `buyTurn` / `adTurn` actions.
- Saves carry `emergencyTurnsBoughtThisRound` and `adTurns`; older saves
  load as none.
- UI: on the last Turn REDRAW cannot be used, so its slot offers "+1 Turn"
  with the price (disabled when Gold is short), or "+1 Turn · Watch ad" when
  Gold is short and an ad is ready. Buying brings REDRAW back. Taking an
  existing slot keeps the bar's height, so the offer never covers the rack,
  even with a larger hand. While a free redraw is left, REDRAW keeps its
  slot. The Stake rules list (header badge and table picker) and the
  tutorial's Turns step describe it. All 13 languages.

## Red Stake: Boss targets +20%

Red Stake (and every Stake above it) now also raises **Boss** targets by 20%
from **Act 2**. Act 1 keeps White targets, as for Green's score scaling.
Small and Large targets are unchanged. It stacks multiplicatively with the
score ramp and table multipliers, and applies to Showdowns, score-multiplier
Mandates and rerolled Bosses (`bossTargetMultiplier` and
`getActBossTargetMultiplier` in `src/config/stakeDefinitions.ts`). Saved runs
keep the targets already generated for their Act; the snapshot upgrade
re-reads Stake modifiers from the catalog, so older saves load.

Red's Act 2 Boss is 1,920 instead of 1,600; the Act 6 finale is 43,200
instead of 36,000.

## Measurements

Standard policy (`--build-shop --resources --consumables`), Green Felt,
seeds 1–300. Policies: **Gold Turns** adds `--emergency-turns` (buys when
the best visible play falls short and the Turn is affordable); **+ ads**
adds `--ad-turns` (also takes the Turn for an ad whenever offered, as if
every ad were watched).

```sh
bun scripts/classic-balance.mts 300 --build-shop --resources --consumables --ad-turns --table=green_felt --stake=2 --seed=1
```

| Stake   | Before today | Boss +20% | + Gold Turns | + ads |
| ------- | -----------: | --------: | -----------: | ----: |
| 1 White |        65.0% |     65.0% |        65.0% | 65.0% |
| 2 Red   |        59.0% |     53.3% |        53.7% | 56.0% |
| 3 Green |        52.3% |     44.7% |        44.7% | 48.0% |
| 5 Blue  |        44.0% |     38.3% |        38.3% | 39.3% |
| 8 Gold  |        18.0% |     17.3% |        17.3% | 20.3% |

- White is identical in every column (no offers, same runs).
- Red now sits about 12 points below White, against 6 before. The Boss rule
  is the main change; the 20-Gold price makes Gold Turns a rare rescue
  (5 bought across 300 Red runs, 150 Gold).
- Ads add 1–3 points where offered (0.43 ad Turns per Red run). Capping at
  one per round, per Act or per run gave identical results on Stakes 2 and
  3 (a run rarely needs a second rescue), so once per Act was chosen as a
  bounded but not stingy limit.

### Price tuning history

Before the feature was limited to Red and above, the price was tuned with
the rule temporarily enabled on Stake 1, against three shopping
behaviours. At 5 Gold per Act every policy stayed within two points of
today, and every changed outcome was a rescue (saver 68.7% → 70.0%, 4
seeds; Decrees only 40.3% → 42.0%, 5 seeds). The owner then raised the price
to 10 per Act to make it a real sacrifice.

The emergency Turn gives stored Gold a purpose, as insurance, but does not
drain it: a rich player seldom needs a rescue. Spending more of the surplus
would need a further sink, such as Act-scaled shop prices or more late-run
purchases.

These are heuristic-policy outcomes, not human win rates.

## Also found

- Dragon Hoard (×1.2 Mult per 10 Gold) and Infinite Wealth (×1.1 per 10
  Gold) compound without a cap: at 300 Gold, Dragon Hoard is about ×237. A
  Gold surplus makes them run-breaking. Unchanged here.
