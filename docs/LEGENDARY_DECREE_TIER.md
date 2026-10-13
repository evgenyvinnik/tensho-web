# Legendary Decree tier and Midas Touch

October 12, 2026. Post-release balance change on top of v1.0.261011-15. Not yet
reviewed or deployed.

## Problem

The authored library has five rarities. The engine has four. The adapter in
`src/config/decreeLibrary.ts` mapped `legendary` to `ImperialDecree`, the Tea
House's Rare tier. That put all 24 authored legendaries into the ordinary Rare
pool: 24 of the 57 library Rares (42%), or 24 of 63 Rares once the rule-bending
Decrees are counted. They were sold at Rare prices (7–10G) with the Rare
weight (5%). Legendaries reach ×6 Mult and +50 Mult. The Rare median is ×2 and
+8.

Midas Touch was the clearest case. It appeared in the first Tea House for 7G
and paid +20G at every round end. Round clears pay 3, 5 and 10G (Small, Large
and Boss) and interest is capped at 5G. A single Midas Touch therefore paid more
than the rest of a round's income combined. The next-best gold Decree, Golden
Age, pays +8G.

## Decision: special-sources-only tier (option A)

`legendary` now maps to `HeavenlyOrdinance`, the tier mythics already use. The
Tea House gives that tier weight 0, so an ordinary Decree slot never rolls it.

Option B would have kept legendaries purchasable with their own price band and
a lower weight. That needs a fifth engine tier, or a price and weight override
keyed off authored rarity, and new UI labels and colours. Option A uses tiers
the engine, pricing and UI already have, and matches Balatro, where Legendary
Jokers come only from The Soul.

Legendaries remain obtainable. The paths that already granted the Heavenly
Ordinance tier now draw from a tier of 41 Decrees instead of 17:

| Source | How it reaches the tier |
|--------|-------------------------|
| Blessing Packs with Decrees | Each slot rolls `legendary` at 1% (5% in Mega packs) and maps it to Heavenly Ordinance |
| Script of the Soul | Creates a random Heavenly Ordinance Decree |
| Seal of the Immortal | Creates a random Heavenly Ordinance Decree |
| Rare+ Omen | Offers a Rare first and falls back upward only when no Rare is left |
| Seal of Judgment | Unchanged: draws uniformly from every Decree, so it could already create one |

### Fallback hardening

`TeaHouseSystem.generateDecreeOffering` used to fall back to the whole pool
when the rolled rarity had no candidates. That fallback could pick a
Heavenly Ordinance Decree. It now tries the other shop-weighted rarities first
and uses the whole pool only as a last resort. The Rare+ Omen relies on that
last resort, as its existing "falls back upward" test records. The fallback
uses the same random draws as before, so it does not shift later seeded rolls.

### Side effects

- The Rare tier shrinks from 63 to 39 Decrees. The Rare+ Omen and Script of
  the Wraith (creates a Rare Decree) no longer produce legendaries.
- The special sources above are diluted. A Seal of the Immortal used to pick
  from 17 Heavenly Ordinance Decrees and now picks from 41, of which 24 are
  legendaries. Its copy still says "Mythic", which the game already uses
  interchangeably with "Legendary" for this tier (the Decree card says
  "Mythic", shop and archive labels say "Legendary").
- Shop and archive labels now show legendaries as "Legendary" instead of
  "Rare". The Decree bar shows the tier name, "Heavenly Ordinance".
- Prices are unchanged. `PricingCalculator` already prices Heavenly Ordinance
  at 20G for the rare case where an Omen fallback stocks one.

## Midas Touch: +20G to +10G

Every other pure-gold Decree pays back at most its tier's catalog cost per
round. Golden Age (Rare, 8G) pays exactly that.

| Rarity | Catalog cost | Best flat gold Decree |
|--------|--------------|-----------------------|
| Common | 4G | Lucky Coin +3G |
| Uncommon | 6G | Tax Collector +4G |
| Rare | 8G | Golden Age +8G |
| Legendary | 10G | Midas Touch +20G → **+10G** |

At +10G Midas Touch sits on the same line. It matches the Boss clear reward and
adds 30G per Act. That is about what a full interest stack (15G per Act) plus
round clears (18G per Act) already pays. A held Midas Touch now roughly doubles
a strong economy instead of quintupling a weak one. Philosopher's Stone still
doubles it to +20G, so the mythic combination keeps its payoff.

Its catalog sell value stays at 12G, a common legendary value. A bought Decree
sells for half the price paid, so the catalog value only applies to a Midas
Touch from a pack or a generating consumable.

The English definition, `ITEM_LIBRARIES.md` and all 13 locale descriptions now
say +10.

## Measurement

Same harness, policy and seeds before and after: 30 seeds per table on all
eight tables at Stake 1.

```bash
bun scripts/classic-balance.mts 30 --shop --build-shop --resources --plan-hands --consumables --table=<table> --stake=1 --json
```

| Table | Wins before | Wins after | Mean Act before | Mean Act after |
|-------|-------------|------------|-----------------|----------------|
| Green Felt | 1 | 2 | 4.07 | 4.13 |
| Red Lacquer | 6 | 4 | 4.37 | 4.37 |
| Bamboo Mat | 2 | 3 | 5.00 | 4.80 |
| Imperial Gold | 5 | 5 | 4.67 | 4.93 |
| Night Market | 2 | 3 | 4.40 | 4.40 |
| Temple Stone | 0 | 0 | 3.90 | 3.83 |
| Ghost Parlor | 5 | 3 | 4.27 | 4.07 |
| Dragon's Den | 1 | 1 | 2.70 | 2.70 |
| **All 240 runs** | **22 (9.2%)** | **21 (8.8%)** | **4.17** | **4.15** |

The baseline reproduces the release figure exactly: 22 of 240 wins and a
median Act of 5. After the change the median Act is 4, but that is a boundary
effect. 121 runs reached Act 5 before and 119 after, so the 120th and 121st
sorted runs moved from Act 5 to Act 4.

The change is neutral for this bot:

- 207 of 240 runs are identical. 13 end in a different Act (7 later, 6
  earlier). 11 change outcome (5 losses become wins, 6 wins become losses).
  A Rare roll now picks from 39 Decrees instead of 63, so later offers and
  purchases differ.
- Only 2 baseline runs ended holding a legendary, both Cosmic Jade (+200
  Chips) bought as an ordinary Rare. The Ghost Parlor run still wins with a
  Recycler in that slot. The Temple Stone run lost in Act 6 before and now
  loses in Act 3 with Greater Jade and Five Blessing instead. It is the only
  changed run that had held a legendary.
- No run held Midas Touch in either sweep. The observed-build policy does not
  buy pure-gold Decrees, so the harness cannot measure the Midas Touch retune.
  The in-game Midas Touch case in the problem statement is the evidence for
  that part.

Paired per-seed results are in
[balance/2026-10-12-legendary-tier.json](balance/2026-10-12-legendary-tier.json).

## Follow-ups not done here

- Seal of Judgment draws uniformly from all 165 Decrees, so about one in four
  draws is Heavenly Ordinance. Balatro's Judgement uses ordinary rarity
  weights.
- `decrees.rarity.legendary` still reads "Imperial Decree" in eight locales.
  No component reads that key; the Decree bar maps Heavenly Ordinance to
  `decrees.rarity.mythic`.
