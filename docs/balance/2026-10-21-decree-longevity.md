# Decree longevity (2026-10-21)

Late-game Decrees were checked against how a play actually grows over a run.
Measured with an instrumented copy of the balance harness (40 runs, seed 1):

```bash
bun scripts/classic-balance.mts 40 --build-shop --resources --consumables --table=green_felt --stake=1
```

| Act | Points p50 | Mult p50 | Score p50 |
| --- | ---------: | -------: | --------: |
| 1   |        135 |      5.5 |       924 |
| 4   |        197 |     17.6 |     3,909 |
| 8   |        375 |    113.3 |    59,864 |

From Act 1 to Act 8, Points grow under 3× while Mult grows about 20× and
targets 300×. A flat or linear Points bonus therefore fades fastest, a flat
Mult bonus fades next, and only a × Mult keeps its share of the score.

## Changes

| Decree | Rarity | Was | Now |
| --- | --- | --- | --- |
| Endless Journey | Rare | +20 Points per Act completed | ×1.2 Mult per Act completed |
| Veteran | Uncommon | +10 Points per Act completed | +30 Points per Act completed |
| Experience | Uncommon | +2 Mult per Act completed | ×1.1 Mult per Act completed |
| Slow Burn | Uncommon | +2 Mult per round this Act | +2 Mult per round this run |
| Perpetual Motion | Rare | +5 Mult per hand this run (max +50) | +2 Mult per hand this run |
| Mandate Breaker | Rare | +15 Mult in Boss rounds | +15 Mult, ×1.5 Mult in Boss rounds |
| Infinite Wealth | Legendary | +1 Mult per ¥5 | ×1.1 Mult per ¥10 |
| Dragon Hoard | Mythic | +2 Mult per ¥10 | ×1.2 Mult per ¥10 |
| Solar Banner | Legendary | +25 Mult | +25 Mult, ×2.0 Mult |
| Cosmic Jade | Legendary | +200 Points | +200 Points, ×1.5 Mult |
| Chain Reaction | Legendary | +5 Mult per Yaku | ×1.5 Mult per Yaku |
| Yakuman Seeker | Legendary | +50 Mult on Yakuman | ×5.0 Mult on Yakuman |

Why each one:

- **Endless Journey** was weaker than the uncommon Stage Master in every Act
  (+140 Points at Act 8, about +37%). Compounding ×1.2 reaches ×2.07 at Act 5
  (past Inferno's ×2) and ×3.58 at Act 8. Final Act (×1.5 per Act beyond 4)
  overtakes it at Act 7, so one is steady and the other a late burst.
- **Veteran** only passed the common Polished Stone (+60) at Act 8.
- **Experience** is now the uncommon step of Endless Journey (×1.95 at Act 8).
- **Slow Burn** reset every Act and never exceeded +4 Mult. It now counts the
  rounds finished this run (`rounds_this_run`), +46 Mult by the Act 8 Boss.
- **Perpetual Motion** reached its +50 cap in about ten plays.
- **Mandate Breaker** was dominated by Boss Slayer (×2, same rarity) once
  Mult passed 15. It stays stronger early and falls a little behind late.
- **Infinite Wealth** and **Dragon Hoard** had the same effect as the rare
  Compound Interest. They now compound per ¥10: ¥50 is ×1.61 and ×2.49.
- The **flat legendaries** lost to a Rare ×2 by the late game. Solar Banner
  and Cosmic Jade now end near ×2.3–2.4 at Act 8 and beat Divine Flame (×3)
  early. Chain Reaction and Yakuman Seeker pay only on complete hands, so
  they now multiply that rare big hand instead of adding to it.

Saved runs need no migration: items are re-read from the catalog on load.

## Reading

Rerunning the same 40-run command after the change: wins 10 → 13, Act 8
reached 35% → 40%, Act 8 median Mult 113 → 132. That is about one standard
deviation at this sample size, so it shows nothing exploded rather than a
measured shift. These are bot policies, not people.
