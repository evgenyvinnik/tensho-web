# Classic progression with consumable use

Measured September 9, 2026, using Bun 1.3.3. This extends the
[resource-policy comparison](CLASSIC_BALANCE_AUDIT.md), not the live coach or
game balance. The policy is deliberately conservative, not optimal play.

**Historical source snapshot:** these measurements precede the September 10
[Unity Honor-conversion fix](CONSUMABLE_IMPLEMENTATION.md#unity-honor-conversion-follow-up).
The current engine and policy share its valid cyclic Wind mapping, including
high-rank targets the measured policy excluded. The stored artifact and source
fingerprint are unchanged; running the commands on current source is a new
measurement, not a reproduction of the old snapshot.

## Implementation

`--consumables` is an independent, opt-in flag on `scripts/classic-balance.mts`.
It does not implicitly enable shopping, redraws, or full-hand pursuit. Combine
it with the existing flags to choose the comparison. JSON reports use schema 2;
the earlier schema-1 measurement artifact remains an immutable historical record.

The policy receives visible tiles only, owned items, locks, current score advice,
gold, Decree count, Script protection, eligible copy history, and a legality
callback. It receives no future wall, dead wall, seed, or concealed identities.
It does not execute a hypothetical consumable or roll random effects in order to
decide. Every selected action passes through the real orchestrator. After success,
the harness recomputes advice and resources from the resulting state. A failed
chosen action produces an explicit diagnostic stop, not a silently ignored use.

Priority and tradeoffs:

1. Take a known round-clearing play instead of consuming another item.
2. Use available permanent Orb upgrades first, then Seals, then Scripts.
   Inventory order breaks ties within families; this is not synergy ranking.
3. Put scoring enhancements, Gold/Red Seals, and editions on the current scoring
   selection. Put held enhancements and Blue/Purple Seals outside it. Stone
   chooses the least-connected spare. Never overwrite an existing modifier in
   the same category or target a locked/concealed tile.
4. For suit/rank/copy Seals, improve one unmodified spare's visible connections
   without changing the priced selection. Equal ranks count 6, adjacent ranks 3,
   and a two-rank gap 1, within a suit. This is a structural heuristic, not a
   hypothetical score or assurance that the next draw completes a hand. Copy
   actions preserve target-first/source-second order and use minimum legal counts.
5. Use legal public rewards, gold effects, and chance editions. The engine checks
   capacities, caps, and prerequisites. The Fool is held without an eligible
   source or when it would merely create another Fool.
6. Use a Script with no additional penalty, active Omen protection, a gold-loss
   penalty when gold is already zero, or an other-Decree destruction penalty
   when only one Decree is owned. Other penalties are held rather than assigned
   invented prices. Protection does not make the primary destructive/global
   effect free: random rack conversions, sacrifices, and bypass/shanten scripts
   remain held. Release's deliberate tile destruction is also not priced.

Reports include total successful uses, per-item and per-reason use counts, and
the IDs and last observed hold reasons of items remaining at run end. Hold
counts describe the final inventory, **not** every repeated inspection during a
run. `currently-illegal` includes current use limits, full slots, or capped effects;
it does not mean the item was intrinsically useless. `not-observed` is reserved
for inventory acquired after its last policy evaluation. With the flag off,
remaining items are explicitly labelled `policy-disabled`.

## Original measurement commands

```sh
bun scripts/classic-balance.mts 200 --shop --resources --json
bun scripts/classic-balance.mts 200 --shop --resources --consumables --json
```

The [stored artifact](balance/2026-09-09-classic-consumables.json) contains both
complete 200-seed datasets, column definitions, command lines, summaries, hold
reasons, policy limitations, and a fingerprint of the exact non-test source.
These are the same 200 initial seeds, not 400 independent participants. Consuming
items changes inventory space, subsequent purchases, and some seeded random
streams; later run states and acquisitions are not held fixed.

## Results: Green Felt, Stake 1, cheapest-first shopping

| Measure | Resources only | Resources + consumables |
| --- | ---: | ---: |
| Seeds | 1–200 | 1–200 |
| Median Act | 2 | 2 |
| Maximum Act | 7 | 8 |
| Mean rounds cleared | 5.490 | 5.725 |
| Runs reaching Act 2 | 120 | 127 |
| Runs reaching Act 4 | 57 | 58 |
| Runs reaching Act 8 | 0 | 1 |
| Median run score | 4,605 | 5,095 |
| Committed plays | 4,691 | 4,781 |
| Complete hands / detected Yaku triggers | 0 / 0 | 0 / 0 |
| Consumables used | 0 | 1,090 |
| Consumables remaining at run end | 466 | 92 |
| Purchases | 1,784 | 2,071 |
| Gold spent | 6,887 | 7,777 |
| Redraws / discards | 1,157 / 801 | 1,163 / 793 |
| Invalid-action, no-advice, or guard stops | 0 | 0 |

All runs eventually lost. The control reproduces the earlier resource-policy
measurement. Comparing rounds by seed, consumable use improves **41**, ties
**138**, and worsens **21**. Seed 45 reaches Act 8 and clears 22 rounds before
losing; it does not win the run. Do not describe this as a reliable late-Act clear.

The 1,090 uses comprise 588 Orbs, 497 Seals, and 5 Scripts. The Scripts actually
used are Deja Vu (3), Medium (1), and Aura (1). Successful use of all three families
does not establish that the conservative policy exercises every Script.

Final held reasons: 35 currently illegal, 31 unpriced Script penalties, 21
unpriced destructive Seals, 2 unpriced global/destructive Scripts, 2 with no
visible structural gain, and 1 without a copy source. These sum to 92 items.

## What this changes about the next implementation step

- Using acquired items matters, but does not by itself fix progression. The
  mean gain is 0.235 rounds and median Act remains 2; 21 seeds get worse.
- **The central full-hand gap remains.** These 4,781 plays trigger no Yaku even
  after consuming 588 Orbs. The orchestrator applies family Orb score bonuses
  inside its detected-Yaku loop, so these plays receive no such family bonus.
  This does not rule out indirect inventory or Decree effects from Orb use.
  It does show why “use more upgrades” is not a sufficient answer to weak build
  payoff under the current immediate-score policy.
- Next compare build-aware purchases and deliberate named-pattern pursuit,
  including the existing one-away variant, before tuning late-Act targets.
  The resource-plus-consumable measurement above does not enable `--chase-hands`.
- Destructive/global Script strategies need explicit cost-aware experiments.
  Their hold reasons are visibility into an incomplete policy, not evidence that
  those items are bad or that all consumable combinations have been audited.
- Ordinary shop acquisition and an enjoyable newcomer session remain separate
  concerns. These are automated policy results, not a human fun measurement.

No live scoring constants, coach decisions, item effects, drop rates, or targets
were changed in this measurement pass.

## Verification

- 28 policy checks cover visible targets, locks, modifier preservation, source
  ordering, public rewards, penalty/protection boundaries, self-copy avoidance,
  repeatable non-mutating choices, and engine acceptance of every chosen action
  across the real item catalog.
- 22 CLI checks include schema-2 counter coherence, opt-in flag independence,
  invalid options, seeded repeatability, and the earlier table/Stake contracts.
- Full unit/component suite: 659 tests in 55 files passed. A subsequent strict
  type check found two readonly assignments in an explicit engine test fixture;
  the fixture now uses the existing `OrchestratorState` cast convention.
- Strict TypeScript, the Pages-base production build, targeted ESLint (including
  the CLI through the TypeScript stdin profile), formatting, and whitespace checks
  pass. Main production JS/CSS hashes match the prior Fool checkpoint; the new
  policy is analysis tooling and is not shipped in the game bundle.
- Application source is unchanged from the Fool checkpoint. The latest full
  browser evidence remains 166/166 checks from that checkpoint; this tooling-only
  pass does not claim a fresh browser run or physical-device validation.
