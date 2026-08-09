# Implementation Status

> Runtime status for the React/TypeScript version of Tensho. This file records what is actually connected to the playable loop, not only what has a class or data definition.

**Last verified:** August 9, 2026

**Related documents:**

- [Architecture](../ARCHITECTURE.MD)
- [Game systems](GAME_SYSTEMS.md)
- [Game mechanics](GAME_MECHANICS.md)
- [UI design](UI_DESIGN.md)
- [Item libraries](../ITEM_LIBRARIES.md)

## Playable Core Loop

| Stage | Runtime behavior | Status |
|---|---|---|
| Start run | Creates the run, Act 1 Small round, starter Decrees, a shuffled wall, and a ready 14-tile hand | Working |
| Play hand | Scores the full hand by default or a selected subset, consumes one hand, applies integrated effects, and refills from the wall | Working |
| Discard | Consumes one discard, moves the tile to the discard pile, applies discard rewards, draws a replacement, and resolves bonus tiles | Working |
| Redraw | Replaces selected tiles and consumes one of three redraws | Working |
| Win/loss | A round ends immediately when its target is met or when no hands remain | Working |
| Tea House | Opens after every completed round; supports items, packs, rerolls, capacity checks, and authoritative gold deduction | Working |
| Round progression | Small → Tea House → Large → Tea House → Boss → Tea House → next Act | Working |
| Skip | Small/Large rounds may be skipped for an Omen; Boss rounds cannot be skipped | Working |
| Run end | Failed rounds enter Game Over; reset and Play Again create a clean run | Working |

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
| Decrees | Large definition library | Yes for the active loop; scoring, resource, economy, slot, rental, edition, and specialized rule effects are connected, including Honor Transmutation and the once-per-round Dead Wall Writ swap |
| Flowers and Seasons | Complete | Yes; Flowers persist and Seasons reset by round |
| Celestial Orbs | Complete | Yes; purchase, inventory, use, yaku level, chips, and Mult are connected |
| Fate Seals | Complete | Yes for authoritative ownership/use limits, exact tile targets, persistent tile mutation/destruction/copying, gold, consumable/Decree creation, duplication, Decree editions, and all-Yaku upgrades |
| Void Scripts | Complete | Yes for authoritative ownership/use limits, tile creation/destruction/duplication/conversion/modifiers, gold, Decrees and their editions, Yaku upgrades, hand/slot/score penalties, and Omen downside protection |
| Tea House and pricing | Complete | Yes; Omen visit modifiers and the canonical 16-pair Charter catalog are connected, including shop tiles, tile modifiers, edition frequency, item weights, discounts, and rerolls |
| Blessing Packs | Complete | Yes; exact shop packs open and return real consumable/tile instances, with Star Chart favored-yaku Orbs and Omen Lens Void contents |
| Imperial Charters | Large definition library | Yes for run-time effects; resources, capacity, economy, shop generation, held-Orb Mult, one-shot Act reduction, and paid/unlimited Boss rerolls are connected; account-level upgrade unlock conditions remain part of meta progression |
| Omen Tags | Complete | Yes for immediate rewards, next-round resources/hand size, next-hand score/Mult, passive skip Mult, interest effects, shop discounts/rerolls/guarantees/Decree editions, season locks, and Void downside protection |
| Table Stakes | Complete | Partially; score/resource/reward modifiers are connected; full sticker/unlock progression needs an end-to-end audit |
| Boss Mandates | Complete definition library | Yes; all 23 standard and 5 Showdown definitions are selectable, with target, hand/draw limits, hidden tiles/Decrees, forced locks, discard hooks, debuffs, Decree suppression and selling, gold penalties, and Eye/Mouth/Arm/Flint scoring connected |
| Meta progression/archive | Implemented separately | Not fully driven by the active run event stream |
| Audio/VFX | Framework present | Partial; music works and SFX assets remain incomplete |

## Verification

- Strict application TypeScript check passes.
- Production build passes.
- Unit/component suite passes with 133 tests.
- Eighteen Chromium E2E checks pass across desktop and mobile projects, including a real play/resource/refill scenario.
- A manual browser walkthrough verified menu → Small round → repeated scoring/refill → Tea House → purchase Orb → Large round → use Orb.
- Repository-wide ESLint still reports pre-existing errors and warnings outside the changed core-loop files. Changed loop files are checked separately during implementation.

## Remaining Work, in Priority Order

1. Drive archive, achievements, Charter upgrade unlocks, and stake progression from orchestrator events with persistence/migration tests.
2. Expand deterministic Playwright coverage to consumable targeting, Omen-modified shops, packs, Boss mandates, and Boss-to-next-Act progression.
3. Resolve the repository-wide lint backlog, migrate the remaining gameplay randomness to the run seed, split oversized bundles, and add the missing SFX assets.

## Status Rule

A system is “connected” only when the active browser loop can acquire or trigger it, the orchestrator changes authoritative state, the UI reflects that change, and a test covers the path. A data table, store, or standalone class by itself is not considered complete.
