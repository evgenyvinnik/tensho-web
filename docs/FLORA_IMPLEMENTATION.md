# Flora inspector and authoritative Season effects

Updated October 7, 2026. This records a bounded implementation and its
remaining mechanics gaps; it does not declare Flowers and Seasons complete.

October 7 local follow-up: [Plum/Autumn](PLUM_AUTUMN_IMPLEMENTATION.md) is connected
to both paid-play paths, with physical pre-play river recovery, generated art
and thirteen-locale earned feedback. Full release-style tests pass 1,897/1,897;
native and production desktop/320px English/Spanish journeys pass 4/4 each.
Published verification is pending; older notes below calling Plum unimplemented
are superseded.

October 7 published follow-up, **v1.0.261007-11**: [Orchid/Spring](ORCHID_SPRING_IMPLEMENTATION.md) connects
Honor-triggered dead-wall draws across all draw paths, with non-chaining bonuses,
one boss reaction and exact saved physical tiles. New Orchid art and localized
post-bloom feedback are integrated. Native/production/hosted journeys pass 8/8
each; release CI passes all 1,869 tests, 13 release checks, build and deployment.
Public version/tag and artwork checksum match. Plum/Autumn and mutations/catalysts
remain open; earlier test corrections are preserved in the linked ledger.

October 7 published follow-up, **v1.0.261007-8**: [Bamboo/Summer](BAMBOO_SUMMER_IMPLEMENTATION.md) now
earns round-long wall protection from a terminal-heavy committed play, restores
reserved tiles and persists the earned reward. Normal Summer receives new fan
art and no longer receives an unfinished-power warning. All 1,839 CI tests and
deployment pass. Its original hosted touch misses are diagnosed and closed by
the [verified v10 input/layout follow-up](TOUCH_GESTURE_IMPLEMENTATION.md).

October 7 published follow-up, **v1.0.261007-7**: [Winter legality](WINTER_LEGALITY_IMPLEMENTATION.md)
now connects the chosen one-rank-gap rule to both play sizes, coach and optional
explanations, with new pine art. Normal Winter no longer receives the unfinished
power warning; other remaining gaps, including Frostbite, still do. Release CI
passes 1,820 tests; native, production and hosted journey batches each pass 8/8.

October 7 published follow-up, **v1.0.261007-6**: [Autumn](AUTUMN_IMPLEMENTATION.md) grants one actual
discard action per normal draw, with localized rules and a generated maple
portrait. Full units pass 1,789/1,789 and initial native journeys pass 8/8;
final built-production journeys also pass 8/8. Later native timing failures are
retained in its ledger. Release CI and all eight hosted journeys pass. Plum recursion remains open.

October 7 published follow-up, **v1.0.261007-5**: [Spring](SPRING_IMPLEMENTATION.md) now supplies bounded
round-scoped rack expansion through real draw/refill paths. [Drought](DROUGHT_EMPOWERMENT.md)
also suppresses Flower empowerment of Decrees while retaining ownership-based
Decree conditions. Independent CI passes 1,772 tests; native, built-production
and hosted journeys pass 16/16 each. The user
has delegated remaining rule resolution; see [decisions](RULE_RESOLUTION.md).

September 12 Winter follow-up: concealed scoring with an unsuppressed
Chrysanthemum now ignores every normal Winter penalty, including in the visible
forecast and committed play. Effective Drought/protective-Decree rules are shared
with Flower scoring. [Winter interaction](WINTER_FLOWER_IMPLEMENTATION.md)
records verification for that checkpoint. The October 7 follow-up above connects
Winter's separate loosened-legality rule.

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
| Spring: extra draws | Connected as +2 round-scoped rack spaces per normal Spring. Orchid/Spring adds non-chaining Honor-triggered dead-wall draws; see its current verification above. |
| Bamboo + Summer exception | Connected: four physical terminals in a committed play earn round-long protection and restore reserved tiles after scoring. See the October 7 follow-up above. |
| Autumn: discard pool grows | Resolved and connected as +1 discard action on each normal Autumn draw; its Yaku modifier remains active. Plum recovery is locally connected; verification above. |
| Winter: loosen hand legality | Connected to tactical/full scoring and coach as one skipped rank per same-suit sequence. Score penalties and Chrysanthemum exception remain active. See [Winter legality](WINTER_LEGALITY_IMPLEMENTATION.md). |
| Frostbite: halve Decree effects | Flat-point, main multiplier, Yaku-specific benefits and shared gold reward paths scale with every Frostbite; ordinary bonuses remain intact. Wealth Engine and copied gold effects feed those paths. Treasure Hunter timing/scaling, fractional retriggers and non-numeric rules remain open. See [scoring evidence](FROSTBITE_IMPLEMENTATION.md), [gold settlement](FROSTBITE_GOLD_IMPLEMENTATION.md), [Decree economy](DECREE_ECONOMY_IMPLEMENTATION.md) and [secondary scoring](SECONDARY_SCORING_IMPLEMENTATION.md). |
| Advanced mutations, catalysts, and Flower–Season interactions | Chrysanthemum/Winter, Bamboo/Summer, Orchid/Spring and Plum/Autumn are connected; Plum release verification remains pending. Full mutation acquisition/catalysts remain to implement. |

The user explicitly delegated resolution of open rules on October 7.
Fate Seal lifetime and Negative-tile conflicts still require concrete
decisions and implementation, but no longer require awaiting each old question.
Previously confirmed Bell, Merchant and defeat-settlement choices remain fixed.
