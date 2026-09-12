# Play legality, forecasts, and tile interaction audit

Updated: September 9, 2026. Follow-up to [the shop audit](SHOP_IMPLEMENTATION.md).

## One validator for a committed play

`GameOrchestrator.validatePlaySelection` now supplies the legality decision for `processAction({ type: 'play' })`, `previewScore`, and `canPerformAction({ type: 'play' })`. It checks an active gameplay phase, available hands, unique existing physical tile IDs, minimum selection size, fixed-size and single-hand boss restrictions, required locked tiles, and the complete-hand requirement for selections above five tiles.

Rejected selections return no forecast, emit no play effects, and do not spend resources. Shape recognition is intentionally separate: `isCompleteHand` can recognize Mahjong that the current boss still forbids. Recognizing a shape does not exempt it from the boss's rules.

The action bar uses authoritative play availability and displays the existing localized locked-tile requirement when necessary. Fixed-size selection guidance remains in place. Subsequent passes cover [consumable targeting](CONSUMABLE_IMPLEMENTATION.md) and [discard/redraw resources](RESOURCE_CYCLING_IMPLEMENTATION.md); their records define the additional coverage and its limits.

## Forecasts include pending Omen effects

The legality tests exposed a second mismatch: a legal five-tile play forecast 82 but paid 123 because an earned next-hand Omen was applied only during commitment. `peekHandScoredOmens` now reads the same eligible effects used by settlement without triggering or consuming them. Both complete and partial forecasts include these effects and passive Omen multipliers. Only a successful committed play records the hand and consumes next-hand effects.

Repeated previews are tested against a snapshot of resources, tile identities, Decrees, Mandate state, and the Omen store. A regression explicitly stacks Score Surge (+100) and Multiplication (×1.5), verifies the forecast, and verifies once-only consumption.

Chance-based scoring remains a guaranteed-outcome forecast rather than a promise that a random bonus will not increase the result. The UI still hides score previews involving concealed tiles.

## Coach and simulator scope

The coach includes visible required locked tiles in its candidates and considers the whole visible rack as a possible complete Mahjong hand. It still uses a heuristic candidate search; it is not an exhaustive optimal-play solver. If a required tile is concealed, the coach does not inspect or score its hidden identity.

The repaired simulator identified all ten previous `noAdvice` stops: every one was a 14-tile fully concealed rack under The House or The Fish. A lack of visible advice is not a lack of legal actions. The simulator now uses `chooseBlindSelection` as an explicitly unscored fallback. Its inputs are physical IDs in visible order, required IDs, and a legal-action check—not ranks, suits, or a score preview. It chooses a legal tactical size and records the number of such hands separately. The fallback is not an automatic player action or a misleading coach recommendation.

### Updated measurement

Commands, default Classic table/stake, seeds 1–200:

```sh
bun scripts/classic-balance.mts 200
bun scripts/classic-balance.mts 200 --shop
```

| Measurement | No purchases | Cheapest-first purchases |
| --- | ---: | ---: |
| Median / maximum Act | 1 / 2 | 1 / 7 |
| Mean cleared rounds | 1.35 | 4.01 |
| Median run score | 763 | 1,337 |
| Reached Act 2 (rounded) | 8% | 43% |
| Reached Act 4 (rounded) | 0% | 20% |
| Reached Act 5 (rounded) | 0% | 5% |
| Reached Act 8 | 0% | 0% |
| Purchases / gold spent | 0 / 0 | 1,301 / 4,969 |
| Packs claimed / skipped | 0 / 0 | 388 / 355 |
| Unscored concealed-rack hands | 0 | 14 |
| Actual losses | 200 | 200 |
| Invalid-action / no-advice stops | 0 / 0 | 0 / 0 |

This is a stronger measurement of a still-limited policy. It does not use discards, redraws, consumables, or deliberate Yaku planning. No target curve was changed to make the tests pass. All simulated runs losing is not evidence of balanced difficulty or human enjoyment; resource-aware policy and later-Act coverage remain required.

## Mobile tile details and optional audio

The previous browser failure showed a tooltip clipped beyond the left screen edge. `TileImage` now renders details in a fixed portal, measured and clamped to the viewport, rather than inside the tile button. It repositions on scrolling/resizing and cannot enlarge the button's hit area. Rack keyboard focus exposes the same details via `aria-describedby`; focused-tile details take precedence over a sibling's passive hover. Touch does not synthesize mouse-hover details, and Escape dismisses the tooltip.

An additional controlled regression proved that a native media property setter throwing before `play()` could escape the SFX error handler and interrupt tile selection. Playback setup and voice release now guard those synchronous failures. Unit tests and a real-browser test inject an `InvalidStateError` on the tile-selection audio's `currentTime` setter and verify that selection still succeeds without a page error. This proves the safeguard, **not that this exception caused the earlier intermittent failure**.

The original first-click assertion remains unchanged: no extra click, retry-until-selected loop, forced click, or widened timeout was added. On failure, that test now attaches a pointer/mouse/click event trail. A clean subsequent run is a regression signal, not proof that an intermittent issue can never recur.

## Classic rack: whole tiles and one gesture per action

The next full browser run passed 101/102 checks and exposed a different, reproducible failure: an elevated highlighted North Wind intercepted the tap intended for its neighboring Green Dragon. The Classic hand compressed fourteen tiles into a heavily overlapping row, and tutorial highlighting changed their stacking order.

Both hand and staging now wrap whole tiles into rows, with at least 44×44-pixel targets. Highlighting no longer raises a tile over its neighbors. The discard target occupies the hand's header, not the space needed to read the tiles. Flora and wall panels occupy real layout cells instead of floating over the first-move instructions. The game surface scrolls inside the ornamental frame, with the action bar pinned at the bottom and clearance for the last row. Small-screen scrolling is intentional; this does not claim every panel fits on one phone screen simultaneously.

Actual `tap()` tests then exposed a second problem: touch-end staged one tile, and synthesized mouse events staged its neighbor after the rack reflowed. The interaction path now uses captured primary pointer events with pointer-ID matching. Mouse compatibility events cannot perform a second staging action. Cancelled gestures do nothing; disabled controls reject pointer, keyboard, and semantic activation. Keyboard and assistive-technology clicks remain available. Drag destinations use the zones' actual rendered rectangles, and a drop outside all zones leaves the selection unchanged. Concealed tile controls no longer announce their hidden identities.

Additional tooltip repetitions caught a one-pixel rack-button height change caused by inline baseline layout. Rack buttons now use flex alignment, decoupling hit-box height from font metrics. Passive details open on actual pointer movement, not a layout-generated pointer entry; keyboard-owned details remain dismissed after Escape until a new focus session. Twenty repeated desktop checks passed after these changes, retaining exact hit-box, viewport-bound, and dismissal assertions. This is regression evidence, not proof of every browser or timing condition.

## Evidence and remaining scope

- `src/game/PlayLegality.test.ts`: 11 checks for identity, phase/resources, boss restrictions, locked tiles, complete hands, non-mutating rejection, and Omen preview/consumption.
- Coach and action-bar tests cover concealed required tiles and disabled locked-tile plays.
- `src/gameplay/blindSelection.test.ts`: four identity-only fallback checks, including exact-size restrictions and impossible forced selections.
- `src/components/gameplay/PlaySurface.test.tsx`: staging, pointer cancellation/identity, synthesized-event rejection, semantic activation, disabled controls, and concealed labels.
- `e2e/interaction.spec.ts`: all fourteen tiles staged and returned individually at 320×568, 390×844, and 1280×800 with mouse clicks and native touch taps; non-overlapping 44-pixel targets; last-row/action-bar clearance; pointer drag/return/outside-drop behavior; short-viewport tooltip bounds and selection; keyboard detail ownership; synthetic native-media failure; and the Psychic's rejected/accepted UI states. These run in desktop/mobile Chromium profiles, not physical iOS devices.
- Full-suite outcomes are recorded in [the wrap-up ledger](IMPLEMENTATION_WRAP_UP.md).

Still required: broader resource-aware progression measurement, consumable acquisition/use/target coverage, ordinary Act 6–8 and Endless browser paths, full UI localization, new-player observation, and release verification. Tooltip placement is addressed here; all tooltip prose and modifier descriptions have not received a localization/native-speaker audit.
