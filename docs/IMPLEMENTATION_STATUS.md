# Implementation Status

> Runtime status for the React/TypeScript version of Tensho. This file records what is actually connected to the playable loop, not only what has a class or data definition.

**Last verified:** August 11, 2026

**Related documents:**

- [Architecture](../ARCHITECTURE.MD)
- [Game systems](GAME_SYSTEMS.md)
- [Game mechanics](GAME_MECHANICS.md)
- [UI design](UI_DESIGN.md)
- [Item libraries](../ITEM_LIBRARIES.md)

## Playable Core Loop

| Stage | Runtime behavior | Status |
|---|---|---|
| Start run | The Run Setup card selects a table and an unlocked Stake, then creates Act 1 Small, starter Decrees, a shuffled wall, and a ready 14-tile hand | Working |
| Play hand | The default full-hand forecast matches the Play Hand action; selected subsets can be compared, the hand is scored, one hand is consumed, effects resolve, and the wall refills | Working |
| Partial plays | A selection that is not a complete winning hand is decomposed into its best quads/triplets/sequences/pairs and run through the same pipeline as a complete hand — Decrees, tile modifiers, Flowers, Seasons, Orbs and Mandates all apply. Only yaku are withheld, since those require a winning hand | Working |
| Score preview | The pre-play forecast is produced by the scoring pipeline itself, so the number shown is the number paid. Chance-based tile effects (Lucky, Glass) resolve to their guaranteed outcome, making the preview a floor rather than a gamble | Working |
| Discard | Consumes one discard, moves the tile to the discard pile, applies discard rewards, draws a replacement, and resolves bonus tiles | Working |
| Redraw | Replaces selected tiles and consumes one of three redraws | Working |
| Win/loss | A round ends immediately when its target is met, when no hands remain, or when a drained wall leaves no legal play | Working |
| Tea House | Opens after every completed round with an exact payout/interest breakdown and next target; supports immediate ordinary purchases, confirmed Charters, packs, rerolls, capacity checks, and authoritative gold deduction | Working |
| Round progression | Small → Tea House → Large → Tea House → Boss → Tea House → next Act | Working |
| Skip | Small/Large rounds may be skipped for an Omen; Boss rounds cannot be skipped | Working |
| Run end | Failed rounds enter Game Over; defeating Act 8 records the table-specific Stake victory, unlocks the next Stake, presents the completed run, and allows an explicit continuation into Endless Act 9+ | Working |

The documented base targets are in use: 300, 800, 2,000, 5,000, 11,000, 20,000, 35,000, and 50,000 by Act. Small, Large, and Boss rounds use 1×, 1.5×, and 2× multipliers before stake and mandate modifiers.

## Runtime Ownership

`GameOrchestrator` is the authoritative owner of the active run. React reads it through `useGameController`; gameplay screens no longer advance the draw loop independently. The Tea House store owns generated offers and purchase history, while every purchased gameplay asset is committed back into the orchestrator's run inventory.

Legacy Zustand stores still exist for isolated screens and older system APIs. They must not be treated as authoritative for score, phase, hand, resources, or run progression.

## Integration Status

| System | Definition/library | Connected to active loop |
|---|---:|---:|
| Tile wall, dead wall, bonus replacement | Complete | Yes |
| Hand/yaku detection and scoring | Complete | Yes |
| Tile Enhancements, Seals, and Editions | Complete | Yes, for supported scoring/economy effects |
| Decrees | Large definition library | Yes. The authored library in `config/decreeDefinitions.ts` is translated into engine effects by `config/decreeLibrary.ts` and published into the live shop pool alongside the hand-written rule Decrees. Scoring, resource, economy, slot, rental, edition, hand-size, discard-count, and specialized rule effects are connected. Decrees needing mechanics the engine cannot express yet (tile retriggering, Decree copying, other bespoke rules) are withheld from the pool and listed in `UNSUPPORTED_DECREE_IDS` rather than shipped as no-ops |
| Flowers and Seasons | Complete | Yes; Flowers persist and Seasons reset by round |
| Celestial Orbs | Complete | Yes; purchase, inventory, use, yaku level, chips, and Mult are connected |
| Fate Seals | Complete | Yes for authoritative ownership/use limits, exact tile targets, persistent tile mutation/destruction/copying, gold, consumable/Decree creation, duplication, Decree editions, and all-Yaku upgrades |
| Void Scripts | Complete | Yes for authoritative ownership/use limits, tile creation/destruction/duplication/conversion/modifiers, gold, Decrees and their editions, Yaku upgrades, hand/slot/score penalties, and Omen downside protection |
| Tea House and pricing | Complete | Yes; Omen visit modifiers and the canonical 16-pair Charter catalog are connected, including shop tiles, tile modifiers, edition frequency, item weights, discounts, and rerolls |
| Blessing Packs | Complete | Yes; exact shop packs open and return real consumable/tile instances, with Star Chart favored-yaku Orbs and Omen Lens Void contents |
| Imperial Charters | Large definition library | Yes for run-time effects; resources, capacity, economy, shop generation, held-Orb Mult, one-shot Act reduction, and paid/unlimited Boss rerolls are connected; account-level upgrade unlock conditions remain part of meta progression |
| Omen Tags | Complete | Yes for immediate rewards, next-round resources/hand size, next-hand score/Mult, passive skip Mult, interest effects, shop discounts/rerolls/guarantees/Decree editions, season locks, and Void downside protection |
| Table Stakes | Complete | Yes; the selected tier reaches RoundManager and the Tea House, cumulative target/reward/redraw and sticker modifiers apply, victories persist per table, and the next tier unlocks |
| Table Styles | Complete definitions and unlock store | Partial; selection and per-table Stake identity are connected, but non-default visual/mechanical table modifiers still need authoritative run integration |
| Boss Mandates | Complete definition library | Yes; all 23 standard and 5 Showdown definitions are selectable, with target, hand/draw limits, hidden tiles/Decrees, forced locks, discard hooks, debuffs, Decree suppression and selling, gold penalties, and Eye/Mouth/Arm/Flint scoring connected |
| Meta progression/archive | Complete event bridge | Yes; run starts/ends, discoveries, item usage, purchases, scoring, victories, and unlock checks are driven from the active orchestrator/shop event stream and persisted with migration-safe defaults |
| Audio/VFX | Event-driven framework | Partial; scoring, Yaku, Gold, purchase, and round-clear VFX are mounted and reduced-motion aware; music works and SFX assets remain incomplete |
| Responsive UI/tutorial | Complete gameplay pass | Yes; menu, run setup, hand, score forecast, Flora, action bar, cash-out, and Tea House fit desktop and portrait mobile viewports, with reduced-motion-aware feedback and dismissible contextual tips that leave gameplay controls active |

## Verification

- Strict application TypeScript check passes.
- Production build passes.
- Unit/component/simulation suite passes with 159 tests across 15 files.
- Production browser walkthroughs at 1280×720 and 390×844 verified Run Setup, a real scoring/refill cycle, truthful shanten guidance, clear-state CTA, non-blocking contextual tips, VFX, exact cash-out, Tea House layout, and the next-round transition.
- Twenty-two Playwright checks are defined across desktop and mobile. On August 11 the managed sandbox blocked Chromium at process launch (`MachPortRendezvousServer: Permission denied`) before any assertion executed; this is an environment limitation, not a recorded green E2E run.
- The current deterministic no-strategy simulation reaches median Act 2 without shopping and median Act 5 (maximum Act 7) while buying Decrees. It does not discard, redraw, target Yaku, use consumables, buy packs, or optimize synergies, so it remains a regression/calibration signal rather than a human win-rate model.
- Repository-wide ESLint still reports pre-existing errors and warnings outside the changed core-loop files. Changed loop files are checked separately during implementation.

## Remaining Work, in Priority Order

1. Connect every Table Style's documented visual/mechanical modifier to authoritative run state and reconcile the legacy Wall/Table identifier catalogs.
2. Build a strategy-aware balance harness (discards, redraws, Yaku selection, packs, and consumables), then tune ordinary-run Act 6–8 power growth from measured completion rates.
3. Expand deterministic Playwright coverage to Stake selection/unlocks, consumable targeting, Omen-modified shops, packs, Boss mandates, Act 8 victory, and Endless continuation; rerun all 22 existing checks in an environment permitted to launch Chromium.
4. Resolve the repository-wide lint backlog, migrate the remaining gameplay randomness to the run seed, split oversized bundles, and add the missing SFX assets.

## Status Rule

A system is “connected” only when the active browser loop can acquire or trigger it, the orchestrator changes authoritative state, the UI reflects that change, and a test covers the path. A data table, store, or standalone class by itself is not considered complete.
