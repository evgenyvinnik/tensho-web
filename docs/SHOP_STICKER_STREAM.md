# Shop sticker stream

Measured October 12, 2026 on top of the [Stake score ramp](STAKE_SCORE_RAMP.md)
(commit e582646). This changes seeded shops on Stakes 4–8, so it is a
**post-release balance change** and needs the owner's approval before it ships.

## Problem

`TeaHouseSystem.generateStickers` rolled Eternal (Stake 4+), Perishable
(Stake 7+) and Rental (Stake 8) from the shop's own random stream, once for
every Decree offered. Stakes 4–6 drew one extra value per Decree, Stake 7 two
and Stake 8 three. On Stake 8 a Decree that rolled only Rental also skipped its
cost draw. Each extra or skipped draw shifted every later shop roll.

One seed therefore produced four different shop sequences: one for Stakes 1–3,
one for 4–6, one for 7 and one for 8. Bot comparisons between Stakes were
partly comparisons between different shops. That is why Stake 4 measured
easier than Stake 3 on seeds 1–20, and Stake 7 easier than Stake 6 on seeds
1–100. On seeds 5, 18 and 20,
Stakes 1–3 lost in Act 1 while Stakes 4–8 survived it, even though Act 1
targets are identical on every Stake.

## Change

- Sticker rolls draw from a new seeded stream, `shopStickers`
  (`src/game/RunRandom.ts`). They never touch the `shop` stream.
- From Stake 4, each Decree offer draws three sticker values (Eternal,
  Perishable, Rental), whichever are enabled. One offer therefore rolls the
  same Eternal on Stakes 4–8. Orange adds Perishable to the same offers, and
  Gold adds Rental. Stakes 1–3 draw nothing.
- The Decree's cost is always drawn from the shop stream. Rental still sets the
  base price to 1 Gold, but no longer skips the draw.
- Unchanged: the 30% chance per sticker, the Stake 4/7/8 thresholds, Eternal
  blocking Perishable, `canReceiveEternal`, an ineligible Eternal not
  suppressing Perishable, editions, prices and discounts.

On one seed, every Stake now offers the same Decrees, editions and prices.
Rental's 1 Gold price is the only exception. Runs still diverge once the
Stake's rules change what the player does: an Eternal Decree cannot be sold,
a Perishable one expires, Rental costs Gold each round, Red withholds Small
Round Gold and Blue removes a redraw.

This supersedes the note in
[COMBINED_STICKERS_IMPLEMENTATION.md](COMBINED_STICKERS_IMPLEMENTATION.md) that
the shop-stream draw schedule, including the non-Rental cost draw, was
preserved.

## Saves

No save version bump or migration is needed. The `decreeCopies` stream was
added the same way.

- A save records the `shopStickers` cursor once a Stake 4+ shop has rolled
  stickers. Stakes 1–3 never create the stream, so their saves have the same
  shape as before.
- A save without the cursor still validates and restores. That covers older
  saves and all Stake 1–3 saves. The stream then starts from its seed-derived
  origin.
- A Stake 4+ run saved by the release build keeps its shop cursor and continues
  deterministically. Its later shops will not match a fresh run of the same
  seed on this build, as with any rule change.
- `RunRandom.fromState` rejects unknown stream names. An older build would
  therefore reject a Stake 4+ save written by this build. This only matters if
  a player downgrades.

## Tests

`src/game/ShopStickerStream.test.ts`:

- On seeds 5, 18, 20 and 4242, six seeded Tea House visits with three rerolls
  each offer the same items, editions and prices on Stakes 1–8. Rental's
  1 Gold base price is the only exception. Each sample includes all three
  stickers.
- A higher Stake only adds stickers to the same offer, and Stakes 4–6 put
  Eternal on the same offers.
- A real run opened through `GameOrchestrator` and `ShopSession` on seed 18,
  with four paid rerolls, sees the same Tea House on every Stake.
- The sticker cursor is saved, a restored save continues exactly, and a save
  without the cursor restores to the same shop items.

All seven tests fail on the previous code. `CombinedStickers.test.ts` and
`LossPrevention.test.ts` now feed sticker rolls through a separate mock. The
Stake test in `CombinedStickers.test.ts` checks that the shop stream draws the
same number of values on every Stake. The full unit suite passes, and so do the
shop, shop-build, loss-prevention, decree-details and perishable-lifetime E2E
specs (52 tests).

## Measurement

Each Stake was run on Green Felt with seeds 1–20, before and after the change,
both on the Stake score ramp:

```sh
bun scripts/classic-balance.mts 20 --shop --build-shop --resources --plan-hands --consumables --table=green_felt --stake=N --json
```

The "before" column reproduces the "after" column of
[STAKE_SCORE_RAMP.md](STAKE_SCORE_RAMP.md) exactly. These results describe
this bot policy. They do not measure human difficulty.

### Seeds 1–20

Each cell reads before → after.

| Stake | Mean rounds | Median Act | Act 1 losses | Reached Act 5 | Reached Act 7 | Wins |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 9.35 → 9.35 | 2 → 2 | 8 → 8 | 9 → 9 | 5 → 5 | 1 → 1 |
| 2 | 9.45 → 9.45 | 2 → 2 | 10 → 10 | 9 → 9 | 7 → 7 | 2 → 2 |
| 3 | 8.00 → 8.00 | 2 → 2 | 10 → 10 | 8 → 8 | 3 → 3 | 0 → 0 |
| 4 | 9.65 → 7.55 | 4 → 2 | 4 → 10 | 8 → 8 | 4 → 1 | 0 → 0 |
| 5 | 9.65 → 8.95 | 4 → 4 | 4 → 7 | 8 → 8 | 4 → 4 | 0 → 1 |
| 6 | 6.90 → 6.95 | 3 → 3 | 4 → 7 | 4 → 4 | 1 → 0 | 0 → 0 |
| 7 | 8.80 → 7.05 | 3 → 3 | 5 → 7 | 6 → 5 | 1 → 0 | 0 → 0 |
| 8 | 6.00 → 5.80 | 3 → 3 | 6 → 7 | 1 → 1 | 0 → 0 | 0 → 0 |

Stakes 1–3 never rolled stickers, so they are unchanged run for run.

The next table shows, for each pair of adjacent Stakes, how many seeds play
exactly the same run (same Act, rounds and score) on both. It also shows how
many reach a later or an earlier Act on the higher Stake. Runs that end in
the same Act with different rounds count in neither column.

| Pair | Same run | Later Act | Earlier Act |
| --- | ---: | ---: | ---: |
| 3 → 4 | 3 → 18 | 8 → 0 | 5 → 2 |
| 4 → 5 | 0 → 0 | 4 → 6 | 4 → 2 |
| 5 → 6 | 8 → 9 | 0 → 0 | 7 → 5 |
| 6 → 7 | 2 → 13 | 7 → 3 | 7 → 1 |
| 7 → 8 | 4 → 9 | 5 → 1 | 10 → 6 |

On seeds 5 and 18, every Stake now loses in Act 1. Seed 20 loses in Act 1 on
Stakes 1–4 and reaches Act 2 on Stakes 5–8, because Blue removes a redraw
(see below). With only 20 seeds, Black (7.55) now measures a little harder than
Green (8.00), and Blue (8.95) measures easier than Black. With 100 seeds,
Blue falls below Black, so that order is noise.

### Seeds 1–100

Seeds 21–100 were run with `--seed=21` and `--seed=61` (40 runs each), as in
STAKE_SCORE_RAMP.md, and combined with seeds 1–20. The "before" rows match
that document's 100-seed table exactly.

| Stake | Mean rounds | Median Act | Act 1 losses | Reached Act 5 | Reached Act 7 | Wins |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 11.37 → 11.37 | 5 → 5 | 26 → 26 | 54 → 54 | 25 → 25 | 4 → 4 |
| 2 | 10.63 → 10.63 | 4 → 4 | 36 → 36 | 48 → 48 | 29 → 29 | 8 → 8 |
| 3 | 9.78 → 9.78 | 4 → 4 | 36 → 36 | 44 → 44 | 21 → 21 | 3 → 3 |
| 4 | 9.10 → 9.72 | 4 → 4 | 29 → 36 | 36 → 45 | 16 → 16 | 0 → 4 |
| 5 | 8.59 → 8.60 | 3 → 3 | 30 → 34 | 34 → 35 | 12 → 13 | 0 → 3 |
| 6 | 6.98 → 7.26 | 3 → 3 | 30 → 34 | 21 → 22 | 5 → 3 | 0 → 0 |
| 7 | 7.81 → 7.06 | 3 → 3 | 32 → 34 | 25 → 19 | 8 → 3 | 0 → 0 |
| 8 | 5.56 → 6.19 | 2 → 2 | 36 → 35 | 10 → 10 | 1 → 1 | 0 → 0 |

| Pair | Same run | Later Act | Earlier Act |
| --- | ---: | ---: | ---: |
| 1 → 2 | 23 → 23 | 24 → 24 | 33 → 33 |
| 2 → 3 | 44 → 44 | 10 → 10 | 25 → 25 |
| 3 → 4 | 19 → 73 | 30 → 8 | 35 → 11 |
| 4 → 5 | 0 → 0 | 18 → 16 | 24 → 26 |
| 5 → 6 | 39 → 42 | 3 → 2 | 27 → 24 |
| 6 → 7 | 18 → 69 | 34 → 6 | 27 → 11 |
| 7 → 8 | 21 → 46 | 16 → 8 | 40 → 26 |

### Reading the numbers

- **Stakes now differ by their rules, not by their shops.** Black plays the
  same run as Green on 73 of 100 seeds (19 before). Orange matches Purple on
  69 (18 before), and Gold matches Orange on 46 (21 before). Most remaining
  differences come from the stickers themselves: an Eternal Decree the bot
  cannot sell, a Perishable one that expires, or Rental's cost.
- **Mean rounds now fall with every Stake:** 11.4, 10.6, 9.8, 9.7, 8.6, 7.3,
  7.1, 6.2. Before, Orange (7.81) measured easier than Purple (6.98). That
  inversion is gone. Black and Green are now within one run of each other
  (Act 5 reached on 45 and 44 seeds). Black adds only Eternal, which costs the
  bot little.
- **Act 1 now depends only on Act 1 rules.** Whether a run survives Act 1
  differs between Green and Black on none of the 100 seeds (17 before), between
  Purple and Orange on none (14 before), and between Orange and Gold on one
  (14 before). Stakes 4–8 lose 34–36 runs in Act 1 (29–36 before). Act 1
  survival still differs from White on 12 seeds for Red through Black, because
  Red withholds Small Round Gold before the first shop, and on 20–21 seeds from
  Blue.
- **Blue is now the main source of per-seed noise.** It removes a redraw, so
  the bot sees different tiles from the first hand. No Blue run matches Black,
  and on 16 of 100 seeds Blue reaches a later Act than Black. That is a real
  rule changing the draws, not shared randomness. Across Blue, use 100 seeds or
  more; 20 are not enough.
- **Black and Blue are winnable for this bot after all.** They win 4 and 3 of
  100 runs, against none before. Three of Black's winning seeds (27, 45 and 49)
  also win on Red or Green. STAKE_SCORE_RAMP.md concluded that Stakes 4–8 won
  none of 500 runs. That was partly the shifted shops. Purple, Orange and Gold
  still win none.
- Across all eight Stakes, 46 of 100 seeds never reach a later Act on a higher
  Stake, against 19 before.

## Not changed

- No target, reward, price, sticker chance or Stake threshold changed.
- `src/systems/ShopGenerator.ts` still rolls stickers from the `shop` stream.
  Nothing imports it, so it does not affect play.
