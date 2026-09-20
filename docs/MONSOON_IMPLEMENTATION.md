# Monsoon: real draw order and non-mutating previews

September 12, 2026. Requirement: [Game systems, corrupted Seasons](GAME_SYSTEMS.md) describes Monsoon as randomized draw order. Previously `SeasonSystem.areDrawsRandomized()` had no draw-path consumer. This is an implementation of that missing rule, not a claim that all Season powers or the overall game are finished.

## Runtime behavior

- While any active Season is Monsoon, a normal draw selects uniformly from the unconsumed live wall. It moves that physical tile into the consumed prefix and advances the cursor. Tiles are drawn without replacement; their IDs and modifiers are retained.
- Bonus replacement draws also select from the remaining dead wall. The dead wall continues to replenish from the live wall's tail, as before. Replenishment itself is not an extra playable draw.
- A Spring tile that corrupts into Monsoon affects its own bonus replacement immediately. Subsequent normal/refill/redraw draws in that round use the same rule. Multiple Monsoons do not produce multiple tiles or stack extra random picks per draw.
- Clearing round-scoped Seasons returns subsequent draws to ordinary FIFO order. This does not undo draws already made. Existing round cleanup/Skip behavior remains responsible for clearing the stack.
- Empty pools return no tile and single-option draws need no random choice. Ordinary non-Monsoon drawing retains its prior FIFO behavior and does not add random draws.

`src/game/wallDraw.ts` is the shared physical draw implementation. Both `GameOrchestrator.drawTileInternal` and `drawFromDeadWall` use it, covering starting hands, refill, explicit draw/redraw and bonus replacement callers. No probabilities, draw resource allowances, prices or score multipliers were changed.

## Redraw validation must predict the same draw

Redraw availability previously simulated only fixed-order bonus chains. Once Monsoon is real, counting remaining tiles or replaying fixed order can approve an exchange whose chosen bonus chain cannot supply enough replacements.

`RunRandom.fork()` now copies the exact seeded cursors, including streams not yet used. The original mulberry32 output sequence is unchanged; a pinned sample and a zero-state wraparound test cover the generator refactor. Forking an unseeded generator is explicitly rejected: a run seeds randomness before gameplay, and an empty wall requires no simulation.

The capacity preview copies the live/dead walls and Season state, then simulates up to three replacement cycles against the fork. It reproduces Season corruption and a pending Omen's one-time lock. It never advances the live RNG, consumes the lock, collects Flowers, awards items/gold, or emits events. The real action still runs through ordinary validation and execution.

An adjacent inconsistency was fixed: an Omen lock restored only in `OmenTagSystem` was reported by `getLockedSeason()` but ignored by `applyLockedSeason()`. Consumption now agrees with the public preview and clears that restored lock once. Store-backed locks retain priority and their existing consumption path. This does not add general Classic reload recovery or solve every store synchronization edge case.

## Visible rule and artwork

The Flora inspector now displays the active Monsoon rule instead of “Not connected yet.” Its description is supplied in all 13 locales. Other unfinished Season effects still produce the partial-implementation notice. Existing native Mahjong Season art is retained; this mechanics change does not require another tile illustration. Native-speaker review remains separate from checking the presence of translated strings.

## Verification

- `RunRandom.test.ts`: legacy sequence, clone at internal zero, independent forks and unused streams, plus the earlier seed/stream tests.
- `Monsoon.test.ts`: FIFO versus randomized live draws; exact identity/consumed-prefix handling; randomized dead-wall replacement; mid-chain activation; one/two/three-tile exchanges through nested Seasons; rejection without spending resources; preview purity; store-backed/restored Omen locks; and clearing the effect.
- `ResourceCycling.test.ts` and `OmenAcquisition.test.ts`: retain the established real resource and earned-lock paths.
- `FloraTrackCompact.test.tsx`: English/Spanish active descriptions with no false unfinished warning, plus the existing ordered-stack/Flower tests.
- `e2e/flora.spec.ts`: adds an actual desktop/mobile redraw whose fixed seed must deliver `wall-24`, not the FIFO tile `wall-0`, even after inspecting the rule and repeatedly checking availability. This uses explicit draw fixtures; it is not evidence of organic Monsoon frequency or game balance.

Initial focused run: **49/52 passed**. One new test retained event history between repeated setup runs; two asserted visibility during an initial dialog animation. Fixtures now disable history before setup and explicitly use reduced motion for deterministic component assertions. No runtime draw rule was changed to make those assertions pass. Added nested-chain cases then produced **55/55 passing** focused checks across five files, with one thread worker.

Full unit suite: `bun run test:run --maxWorkers=1 --pool=threads` passed **778/778 tests in 71 files** (310.45 seconds). This includes the earlier SEO/scroll additions as well as the Monsoon follow-up.

`VITE_BASE_PATH=/tensho-web/ bun run build` passed strict TypeScript and Vite/PWA generation. Targeted ESLint and `git diff --check` passed. The existing large-JavaScript-chunk and stale Browserslist-data warnings remain; the build reports 233 precache entries (51,778.05 KiB).

The targeted browser follow-up passed **20/20** without retries (1.4 minutes), covering desktop/mobile Monsoon, the Spanish full-stack inspector, real Decay scoring, earned Omen acquisition/locks, accepted/rejected redraws, and the Honor Court/Wide Rack art added in the previous pass. The new Monsoon rule and Honor Court popup screenshots were visually inspected. These browsers use the dev/test server with service-worker registration disabled; they are not production PWA-upgrade evidence or a complete browser-suite pass.

Artifacts are preserved at `/tmp/tensho-monsoon-G8cNNV/gameplay`. A separate production-preview run then passed all **8/8 public-guide checks** at the Pages base (10.7 seconds, original timeout, no retries), including final warning/resume links and desktop navigation. Its screenshots are at `/tmp/tensho-monsoon-G8cNNV/public-guides-production`; see the [SEO ledger](SEO_STRATEGY.md) for the retained earlier timeout history. No live deployment or general browser-suite pass is claimed.

Browser command:

```sh
npx playwright test e2e/flora.spec.ts e2e/resource-cycling.spec.ts e2e/omen-acquisition.spec.ts e2e/table-loop.spec.ts --grep 'Monsoon|Spanish Flora|visible Decay|staged redraw|redraw stays disabled|real skips|skip clears old Seasons|generated (Honor Court|Wide Rack)' --reporter=list --workers=1 --trace=retain-on-failure
```

## Boundaries

Spring's extra draws, Summer's wall shrink, Autumn's larger discard pool, Winter's loosened legality, complete Frostbite semantics, the three-Flower shop unlock, and advanced Flower–Season combinations remain unfinished. Monsoon is not evidence that those requirements are fulfilled.

Seeded runs that actually encounter Monsoon intentionally differ from the old no-op implementation. Runs without that effect retain the generator's prior numeric sequence, except where the restored-lock bug previously disagreed with the advertised lock. Earlier 600-run resource and 400-run consumable comparisons predate this change and were not regenerated here. The balance of random draws and the value of future-information effects still need playtesting; passing deterministic tests does not establish fun.
