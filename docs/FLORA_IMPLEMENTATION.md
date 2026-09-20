# Flora inspector and authoritative Season effects

Updated September 12, 2026. This records a bounded implementation and its
remaining mechanics gaps; it does not declare Flowers and Seasons complete.

September 12 Winter follow-up: concealed scoring with an unsuppressed
Chrysanthemum now ignores every normal Winter penalty, including in the visible
forecast and committed play. Effective Drought/protective-Decree rules are shared
with Flower scoring. [Winter interaction](WINTER_FLOWER_IMPLEMENTATION.md)
records verification; Winter's separate loosened-legality rule remains open.

September 12 Flower follow-up: collecting three distinct Flowers unlocks the
seven existing Flower-scaled Decrees in shop/pack generation, including rerolls
and Omen eligibility. The inspector marks this actual set bonus as earned.
[Flower shop implementation](FLOWER_SHOP_IMPLEMENTATION.md) records authoritative
paths, the preserved Celestial Wildcard requirement, and verification boundaries.

September 12 Summer follow-up: normal Summer now sets aside 20% of the remaining
live wall for the round, including in redraw preflight, without deleting tiles
from the permanent collection. The inspector describes the cost in all 13
locales. [Summer implementation](SUMMER_IMPLEMENTATION.md) records rounding,
timing assumptions and verification. The Bamboo/terminal-heavy exception remains
unfinished; this does not make every Summer interaction complete.

September 12: Monsoon now randomizes real live-wall and bonus-replacement draws,
with forked-RNG previews that do not consume draws or Omen locks. Its active
description is localized in all 13 languages. See [Monsoon implementation](MONSOON_IMPLEMENTATION.md)
for the new checkpoint; the September 10 verification history below is unchanged.

## Connected behavior

- The Flowers/Seasons control opens a read-only inspector by click, touch, or
  keyboard. It no longer toggles an unused expansion variable.
- The inspector shows all collected Flower types, the four base scoring rules,
  collection effectiveness, and the full Season stack in draw order. Repeated
  Seasons remain separate entries with their physical IDs.
- Each corrupted Season uses its own subtype name and rule. A normal first
  Season is not labelled corrupted merely because a later entry is corrupted.
- The controller supplies a public Flora snapshot from the orchestrator. Drought
  suppression/protection and the displayed Decay penalty use the same state as
  scoring. Opening or closing details spends nothing and preserves staged tiles.
- All 28 new detail keys are supplied in all 13 locales. Existing Mahjong Flower
  and Season artwork is reused, with rule text outside the images. This pass
  does not generate a replacement tile set or claim native-speaker review.

## Real mechanics corrections

Actual discard actions now notify `SeasonSystem.onDiscard()`, as does each tile
discarded by the Hook's post-draw mandate. Previously, the counter changed only
when tests or callers invoked that helper directly; ordinary gameplay never
accumulated Decay's penalty.

The existing round counter records actual discards throughout the round. Decay
applies ten points per recorded discard when active, with the existing zero
score floor. Redraw exchanges and played tiles entering the river do not count
as discard actions. Rejected discards do not change the counter. Round cleanup,
including Skip, clears it.

The shared Decree-rule lookup now inspects secondary effects as well as the
primary effect, while still excluding inactive or mandate-disabled Decrees.
Eternal Garden's Flower protection is a secondary effect; the previous lookup
silently missed it. Scoring and the inspector now agree on whether Drought is
suppressed by that protection.

## Dialog and touch follow-up

Reduced-motion dialogs opened after an initially closed render now have their
final opacity and transform immediately. The existing scroll illustration uses
CSS nine-slice borders, with fixed 64-pixel top/bottom artwork and a separately
clipped content viewport. This prevents the artwork from growing underneath
long descriptions. The close control has dedicated clearance above content.
The original PNG is unchanged.

The first focused browser run passed 33/34 checks. The 390×844 mobile rack test
found a real regression: returning a tile opened the newly functional Flora
dialog. Moving the tile on pointerup allowed a subsequent compatibility click
to activate a control at its former location. Preventing native touch defaults
only for tile-origin touches cancels that extra click while retaining the
existing pointer gestures and keyboard/semantic activation. A surface-scoped,
non-passive listener leaves blank-table panning untouched and is removed on
unmount. The test now also requires no dialog after every tile transfer; it
does not dismiss an unexpected modal to continue.

Initial browser artifacts are retained locally at
`/tmp/tensho-flora-verification-KdgCdC/initial-focused-suite/`. Screenshot review
also exposed scroll-end overlap that the earlier viewport-only assertions had
missed. New assertions reserve actual ornament and close-button clearance at
320×568, 568×320, and 1024×768.

## Verification scope

- `SeasonDiscard.test.ts`: real discard/preview/committed-score agreement,
  redraw versus forced discard, Skip cleanup, and actual Eternal Garden
  acquisition plus mandate suppression.
- `FloraTrackCompact.test.tsx`: ordered and repeated Seasons, actual corrupted
  names/rules, localized descriptions, doubled Flower previews, protection,
  empty-state refresh, and read-only opening/closing.
- `flora.spec.ts`: Spanish long-stack layout and unchanged resources/selection;
  actual UI discard, visible penalty, scored play, and Skip cleanup. Both
  desktop and mobile Chromium configurations use explicit wall/stack fixtures.
- `interaction.spec.ts`: all fourteen tiles remain individually transferable
  without accidentally opening a dialog, alongside existing drag and keyboard
  coverage. Native mobile taps are exercised; physical iOS/assistive-technology
  validation remains separate.

The [verification ledger](IMPLEMENTATION_WRAP_UP.md#current-flora-dialog-and-touch-checkpoint)
records **748/748 units**, the **201/202 full browser run**, and the subsequent
**24/24 repeated focused checks**. The full-run desktop Codex timeout remains
unexplained; a targeted pass is not a retroactive full-suite pass. A second
focused run's mixed-viewport geometry read was corrected to measure the whole
layout atomically, preserving its bounds. Fixture-based tests do not prove
organic Flower/Season frequency, late-Act balance, or player enjoyment.

## Requirements still missing from the runtime

The inspector explicitly marks unfinished behavior rather than advertising
unused helpers as working powers. This is temporary disclosure, not a removal
of the requirements in `GAME_SYSTEMS.md`.

| Documented rule | Current gap |
| --- | --- |
| Spring: +2 draws per hand | `getDrawBonus()` has no gameplay consumer. The meaning of extra draws versus extra rack capacity needs a concrete rule. |
| Bamboo + Summer exception | Normal Summer's wall cost is connected. The terminal-heavy threshold and exception timing still need an explicit rule. |
| Autumn: discard pool grows | `getDiscardPoolModifier()` is unused. Its Yaku modifier is active. |
| Winter: loosen hand legality | `isHandLegalityLoosened()` is unused. The score penalty and concealed Chrysanthemum exception are active. |
| Frostbite: halve Decree effects | Flat-point, main multiplier, Yaku-specific benefits and shared gold reward paths scale with every Frostbite; ordinary bonuses remain intact. Wealth Engine and copied gold effects feed those paths. Treasure Hunter timing/scaling, fractional retriggers and non-numeric rules remain open. See [scoring evidence](FROSTBITE_IMPLEMENTATION.md), [gold settlement](FROSTBITE_GOLD_IMPLEMENTATION.md), [Decree economy](DECREE_ECONOMY_IMPLEMENTATION.md) and [secondary scoring](SECONDARY_SCORING_IMPLEMENTATION.md). |
| Advanced mutations, catalysts, and three remaining Flower–Season interactions | Chrysanthemum/Winter is connected. Plum/Autumn, Orchid/Spring, Bamboo/Summer and full mutation acquisition remain to implement. |

Spring/Autumn and Winter rule choices have been requested from the user. The
separate Fate Seal lifetime and Negative-tile rules conflicts remain open too.
Do not infer consent from a preselected or unanswered option. Unambiguous
remaining paths can still be implemented and tested independently.
