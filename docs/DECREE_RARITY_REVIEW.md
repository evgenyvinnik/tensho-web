# Decree rarity review

November 2, 2026. Balance change on top of v1.0.261101-14. Not yet reviewed or
deployed.

## Problem

Extended Hand Grant gave +3 Turns per round as a Common for 5G. The rest of its
effect family was priced the other way round. Time Lord (+1 Turn) was
Legendary and Time Master (+2 Turns) was Mythic, and the Steady Hand Charter
sells +1 Turn for 10G. Two other resource families already climb one step per
tier. This change puts Turns on the same ladder:

| Resource | Common | Uncommon | Rare |
|----------|--------|----------|------|
| Free redraws | Second Chance +1 | Careful Player +2 | Infinite Patience +3 |
| Rack spaces | Wide Grip +1 | Expansive Grip +2 | Master Grip +3 |
| Turns, before | Extended Hand Grant **+3** | — | — |
| Turns, after | Time Lord +1 | Time Master +2 | Extended Hand Grant +3 |

Other Decrees also sat a tier above their power. The Rare complete-hand Yaku
payoffs paid ×2 only on one kind of complete hand, at Inferno's price, and
Inferno pays ×2 on every play. Boss Slayer paid ×2 only in Boss rounds. Several
Uncommons paid less than Flame or Spark, which have no condition at all.

## How power was measured

Before this change, every run started with two of five fixed starter
Decrees, so Extended Hand Grant was in 40% of runs from the first round. That
made its slot a clean test bed.
Its effect was replaced in memory with each variant below, and the same seeds
were replayed. The comparison covers the 167 runs (of 400) that start with
it.

```bash
bun scripts/classic-balance.mts 50 --shop --build-shop --resources --plan-hands --consumables --table=<table> --stake=1 --json
```

| The starter slot holds | Mean rounds cleared | Wins |
|------------------------|--------------------:|-----:|
| Nothing | 6.17 | 4 |
| +1 Turn | 6.34 | 3 |
| +2 Turns | 6.65 | 4 |
| **+3 Turns (Extended Hand Grant)** | **6.83** | **5** |
| +20 Points | 7.19 | 8 |
| ×1.3 Mult | 7.20 | 6 |
| ×1.5 Mult | 8.10 | 10 |
| +2 Mult | 8.21 | 12 |
| +60 Points | 8.28 | 5 |
| +4 Mult | 9.38 | 16 |
| ×2 Mult | 9.81 | 14 |
| +6 Mult | 10.04 | 11 |
| ×3 Mult | 11.66 | 37 |
| +10 Mult | 11.75 | 16 |

The bot clears most rounds in about one play (1.1 plays and 1.5 REDRAWs per
round). Targets grow 2 to 2.7× per Act through Act 5. A Turn adds one more play to a round,
while Mult multiplies every play, so for this bot Turns are cheap. Flat Mult is
strong early because base Mult is small, and ×Mult wins late: ×3 and +10 Mult
clear the same number of rounds, but ×3 wins 37 runs to +10 Mult's 16.

Nulling each of the other starters the same way:

| Starter | Tier before | Rounds with | Rounds without |
|---------|-------------|------------:|---------------:|
| Pure Suit Asceticism | Rare | 6.96 | 5.97 |
| Simples Dispensation | Uncommon | 7.44 | 7.49 |
| Moonlit Emblem | Uncommon | 6.41 | 6.45 |
| River Tax | Common | 8.57 | 8.79 |

The bot never builds complete hands and usually dies around Act 3, where flat
Mult is at its strongest. It cannot measure Yaku payoffs, and it undervalues
Turns that a human spends fishing for a complete hand. So tiers were set by
three tests, with the bot as a check on large outliers only:

1. **Ladders.** One effect at three sizes takes three tiers. Turns are worth at
   least as much as free redraws, since a Turn can also be a play.
2. **Dominance.** A Decree should not be strictly worse than another one in the
   same tier at the same price.
3. **Measured outliers.** The slot calibration above.

## Changes

| Decree | Effect | Before | After | Why |
|--------|--------|--------|-------|-----|
| Extended Hand Grant | +3 Turns | Common, 5G | **Rare**, 8G | Top of the Turn ladder |
| Time Master | +2 Turns | Mythic | **Uncommon** | Middle of the Turn ladder |
| Time Lord | +1 Turn | Legendary | **Common** | Bottom of the Turn ladder. Measured weaker than +20 Points |
| Crimson Banner | +5 Mult | Common | **Uncommon** | +4 to +6 Mult measured near Inferno's ×2. Commons now stop at +4 |
| Golden Regalia | +6 Mult | Common | **Uncommon** | Same |
| Pure Suit Asceticism | ×1.1 per dominant-suit tile | Rare, 8G | **Uncommon**, 6G | A six-tile play gives at most ×1.8, Flush Fever's band. Measured near Common |
| Half Flush Herald | ×2 on a Half Flush | Rare | **Uncommon** | Dominated by Inferno |
| Triple Sequence Sage | ×2 on a Mixed Triple Sequence | Rare | **Uncommon** | Dominated by Inferno |
| Outside Hand Champion | ×2 on an Outside Hand | Rare | **Uncommon** | Dominated by Inferno |
| Boss Slayer | ×2 in Boss rounds | Rare | **Uncommon** | Dominated by Inferno |
| Wealth Engine | +1G per Decree owned | Rare | **Uncommon** | +3 to +5G a round is Tax Collector's band (+4G) under the gold rule in [LEGENDARY_DECREE_TIER.md](LEGENDARY_DECREE_TIER.md) |
| Value Zealot | ×1.5 on Value Tiles | Uncommon | **Common** | Dominated by Flame |
| Triplet Titan | ×1.5 on All Triplets | Uncommon | **Common** | Dominated by Flame |
| Ninefold Initiate | ×1.5 on a 1–9 Straight | Uncommon | **Common** | Dominated by Flame |
| Full Flush Champion | ×2 on a Full Flush | Uncommon | **Common** | One of the hardest complete hands. Joins the other Yaku payoffs |
| Simples Dispensation | 1s and 9s allowed in All Simples | Uncommon, 6G | **Common**, 4G | Acts only on complete hands. Partner of the Common Simples Tactician |
| Moonlit Emblem | +0.1× per Honor played | Uncommon, 6G | **Common**, 4G | With three or four Honors it pays less than Honor Guard's ×1.5 |
| Terminal Devotion | +0.05× per Terminal played | Uncommon, 5G | **Common**, 4G | Four Terminals give ×1.2, which Spark pays on every play |

No effect, description or translation changed, so no locale needed an edit.

### Prices and sell values

Library prices follow rarity (4, 6 and 8G). The hand-written Decrees carry their
own prices, which now match their new tier: Extended Hand Grant 8G, Pure Suit
Asceticism 6G, and Simples Dispensation, Moonlit Emblem and Terminal Devotion
4G each. A starting Decree sells for half its price, so a starting Extended Hand
Grant now sells for 4G instead of 2G.

Moved library Decrees take their new tier's usual catalog sell value: Crimson
Banner and Golden Regalia 4, Time Lord 3, Time Master 5, the three Rare Yaku
payoffs and Boss Slayer 5, Wealth Engine 4, and the four Uncommon Yaku payoffs
3. A bought Decree still sells for half the price paid.

### Pool sizes

| Engine tier | Before | After | Chance a given Decree fills a slot |
|-------------|-------:|------:|-----------------------------------:|
| Local Edict (Common) | 41 | 46 | 1.7% → 1.5% |
| Regional Mandate (Uncommon) | 47 | 49 | 0.53% → 0.51% |
| Imperial Decree (Rare) | 45 | 40 | 0.11% → 0.13% |
| Heavenly Ordinance (special sources) | 41 | 39 | — |

Extended Hand Grant is now about 14 times rarer in an ordinary Tea House slot.
It no longer has a fixed place among the starting Decrees either; see
[Starting Decrees from the whole pool](#starting-decrees-from-the-whole-pool).

## Measurement

The same harness, policy and seeds before and after: 50 seeds per table on all
eight tables at Stake 1.

| Table | Wins before | Wins after | Mean rounds before | Mean rounds after |
|-------|------------:|-----------:|-------------------:|------------------:|
| Green Felt | 2 | 2 | 6.90 | 6.98 |
| Red Lacquer | 3 | 3 | 7.20 | 7.02 |
| Bamboo Mat | 1 | 2 | 7.54 | 7.44 |
| Imperial Gold | 4 | 4 | 8.64 | 8.70 |
| Night Market | 5 | 6 | 8.60 | 8.48 |
| Temple Stone | 5 | 3 | 8.72 | 8.58 |
| Ghost Parlor | 3 | 3 | 7.20 | 7.32 |
| Dragon's Den | 2 | 2 | 5.84 | 5.68 |
| **All 400 runs** | **25 (6.3%)** | **25 (6.3%)** | **7.58** | **7.53** |

The re-tier alone is neutral for this bot. 269 of 400 runs are identical, 66
clear more rounds and 65 fewer. Most of the bot's Decrees were its fixed
starters, which the re-tier did not swap. Of the moved Decrees, Time Lord and Time Master now
appear in shops and end 9 and 11 runs, against none before. Crimson Banner
drops from 19 final builds to 2.

Paired per-seed results, the slot calibration and the starter nulling are in
[balance/2026-11-02-decree-rarity-review.json](balance/2026-11-02-decree-rarity-review.json).

## Starting Decrees from the whole pool

A run used to start with two of five fixed Decrees: River Tax, Extended Hand
Grant, Simples Dispensation, Moonlit Emblem and Pure Suit Asceticism. Now each
of the two starting Decrees is drawn like an ordinary Tea House slot. The
draw rolls a rarity at the shop's odds (Common 70%, Uncommon 25%, Rare 5%) and
then picks uniformly within that tier. It uses the same pool as the shop, so a
locked Decree, a Flower-gated Decree and a Legendary or Mythic Decree never
start a run, and the second draw never repeats the first. Imperial Gold still
adds one seeded Regional Mandate on top.

The draw keeps its own seeded stream (run seed + 12345), so it does not shift
the wall, shop or Omen rolls. `STARTER_DECREES` remains as the group of five
hand-written Decrees that share portrait art; nothing deals from it any more.

Across seeds 1 to 1,000 the 2,000 starting Decrees were 69% Common, 26%
Uncommon and 5% Rare, from 117 different Decrees. None was locked,
Flower-gated or special-source, and no run started with a duplicate.

Same harness, policy and seeds, after the re-tier:

| Table | Wins, fixed starters | Wins, whole pool | Mean rounds, fixed | Mean rounds, whole pool |
|-------|---------------------:|-----------------:|-------------------:|------------------------:|
| Green Felt | 2 | 3 | 6.98 | 8.76 |
| Red Lacquer | 3 | 4 | 7.02 | 8.78 |
| Bamboo Mat | 2 | 4 | 7.44 | 9.72 |
| Imperial Gold | 4 | 9 | 8.70 | 10.68 |
| Night Market | 6 | 10 | 8.48 | 11.14 |
| Temple Stone | 3 | 5 | 8.58 | 10.20 |
| Ghost Parlor | 3 | 4 | 7.32 | 9.24 |
| Dragon's Den | 2 | 1 | 5.68 | 7.64 |
| **All 400 runs** | **25 (6.3%)** | **40 (10.0%)** | **7.53** | **9.52** |

Runs get noticeably easier for the bot: 181 runs clear more rounds, 76 fewer
and 143 tie. The old starters were weak for it (the nulling table above puts
four of the five near zero), while a typical draw is a +Mult or +Points
Common, which the slot calibration rates at 1 to 3 rounds.

## Follow-ups not done here

- Starting from the whole pool raised the bot's win rate from 6.3% to 10%. If
  that is too generous for new players, the starting draw could be limited to
  Commons, or cut to one Decree, without changing the shop.

- Flat Mult stays strong through Act 3. Blazing Banner (+10 Mult, Uncommon)
  cleared as many rounds as ×3 Mult. It stays Uncommon because the Rare
  Emperor's Blessing is Blazing Banner plus 100 Points. Moving one means
  rethinking both.
- Time Lord (+1 Turn) and Second Chance (+1 free redraw) are both Common at the
  same price, and the Turn is never worse. The gap is small, because a free
  redraw is a Turn for a player who redraws every round.
- Some special-source Decrees are weak for their tier: Universal Grip (+4 rack
  spaces), Yakuman Seeker and Void Emperor. They never reach an ordinary shop
  slot, so they were left alone.
- `ITEM_LIBRARIES.md` still lists Riichi Devotee as "+3 Mult when scoring
  Riichi". The code pays +4 Mult if the play includes two or more pairs.
