# Table Loop release preparation

September 12, 2026. Implementation and verification notes, not a completion or
deployment claim. The redesign remains on `table-loop-prototype`; no branch
history has been overwritten and Classic remains available.

## Rejected actions must not change the deal

An actual seed-7 run with the offers variant exposed a save-consistency bug:
after a placement, `redraw([])` returned failure but changed the pending offer
from true to false, grew the rack from 11 to 12, and reduced the wall from 119 to
118. Place, revise, and river recovery had the same early implicit-decline path.
The store correctly excludes rejected actions from the journal, so reloading
restored a different state from the one the player saw.

The engine now validates before committing an implicit decline. Failed actions
return the original gameplay state plus error feedback; neither the engine nor
the saved journal changes. Accepted placements/exchanges still decline a pending
offer and take its replacement from the wall. No score, cost, target, or successful
saved-action format changed. Version 1 journals remain supported; previously
corrupt/divergent saves are not claimed repaired by this change.

Eight regression cases failed before the fix. They cover invalid groups,
occupied/empty slots, empty/oversized/unknown-tile exchanges, unavailable recovery,
and the store/reload boundary. Each engine refusal leaves the actual offer
claimable once. Both existing complete seeded journal replays (base and offers
variant) remain part of the focused verification.

## Real-action run coverage

`e2e/table-loop-run.spec.ts` chooses from visible rack groups and authoritative
slot forecasts, then performs every mutation through browser controls. There
are no score grants, forced deals, shop injections, or direct engine actions.
Seeds were selected by a deterministic greedy probe: 7 reaches defeat in round
two after buying Jade Ledger and Twin Flame; 12 clears all three rounds.
These are reproducible integration cases, not representative balance estimates.

The checks cover exact forecast payment, real shop offers and purchases,
once-only payment/ownership after shop reload, next-round resource reset and
retained upgrades, Jade Ledger's +2 gold and -1 redraw tradeoff, boss visibility,
victory/defeat summaries, terminal reload, and starting a clean new run. Desktop
uses 1280×800; mobile uses 320×740. Reduced motion keeps this run test focused on
actions; it does not replace the separate animation checks or human playtests.

## Approved Merchant swap

The user selected **swap one chosen rack tile for a river tile** on September 12.
Live Merchant play now uses that rule: choose exactly one rack tile, then choose
the river tile to take. The selected physical tiles exchange places; rack size,
placement actions, redraw allowance, gold, and score do not change. The swap
allowance is spent once and renews next round. Normal phase/ownership/identity
checks apply even if the UI is bypassed. An accepted swap declines any pending
offer, like other non-draft actions; a rejected swap changes nothing.

The illustrated river panel names both sides of the trade, disables river tiles
until exactly one rack tile is selected, and announces used status afterward.
Its status receives focus after a successful swap so keyboard focus is not lost
when the selected river tile leaves the panel. Buttons have 44px minimum targets;
the river wraps within a bounded scroll area. Rules, instructions, and control
labels have translations in all 13 locales; native-speaker review remains open.

Browser screenshot review also exposed persistent rack tooltips after touch
selection, covering the trade area. RackRow now distinguishes touch/pen focus
from keyboard input: taps still select once, keyboard navigation restores details,
and mouse hover is unchanged. Two component cases and native-touch browser
assertions accompany the fix. The real tile-detail keyboard/dismissal checks
still pass, rather than disabling all details to hide the problem.

New journals are version 2 at the existing storage key. Version 1 journals are
read without being overwritten, replayed through their original recovery action,
and upgraded on the next successful save. Version 1 input cannot contain the new
swap action. The old engine recovery method remains for journal compatibility,
not as a second live-player action. Old app versions cannot read new v2 journals;
deployed PWA upgrade/downgrade behavior still needs release verification.

Ten engine/store cases cover full racks, depleted walls, resource/physical-tile
conservation, refusal atomicity, pending offers, allowance renewal, actual paid
acquisition, version-1 migration and once-only replay. The browser fixture earns
Merchant via real seeded actions and shop payments, then performs the exchange,
two-tile-selection rejection, swap and reload through UI controls. This is distinct
from the entirely UI-driven full-run tests.

## Artwork and remaining scope

All ten Table Loop Decrees now have individual generated scrolls. Jade Ledger
uses the established emerald, gold, and ivory style, with its rule in localized
HTML rather than embedded in the image. [Art manifest](TABLE_LOOP_ART.md#jade-ledger)
records the exact prompt, original file, built-in imagegen mode, and unavailable
model-ID limitation. Catalog-driven tests require each current Decree's own PNG.

The three-Flower inspector now marks its earned shop unlock using the active
set bonus rather than duplicating the collection threshold.

Still open: main-branch/default-mode promotion; multi-tab stale writes; broader
build and variant coverage; newcomer observation and fun validation; performance
and deployed PWA upgrades. The approved swap closes Merchant's free-slot dead end;
its balance and human strategic value still need playtesting. Other unfinished Classic
mechanics and rule conflicts remain listed in [Implementation status](IMPLEMENTATION_STATUS.md).

## Verification

The initial full unit attempt was interrupted with SIGINT (exit 130) after
repeated UI failures during severe host load (reported load averages above 360).
It is not counted as a pass. An initial focused artwork/Flora repeat passed
18/19, with the first Flora case exceeding the existing 5-second timeout.
No timeout or assertion was relaxed. The subsequent engine/store/artwork/Flora
run passed **92/92 tests across six files** in 21.25 seconds, including the eight
reproduced transaction failures. This does not erase the failed attempts.

The later full-suite attempt was still live with passing results when the user
approved Merchant's new rule. That superseded run was stopped with SIGINT (exit
130) before changing the engine. It is not counted as full-suite verification.

After the Merchant implementation, **104/104 engine/store/locale tests** passed
in six files (66.84 seconds), followed by **17/17 component/artwork/audio tests**
in three files (5.90 seconds). Targeted ESLint and whitespace checks passed.
Final build and browser results follow below and are summarized in
[the wrap-up ledger](IMPLEMENTATION_WRAP_UP.md).

The browser runner initially failed before executing a test because the new spec
omitted Node's JSON import attributes. After correcting the test import, 8/8 new
run/swap journeys passed (1.5 minutes). Screenshot review then drove the touch
tooltip fix above. The final expanded run passed **70/70 without retries**
(2.7 minutes): the entire Table Loop browser file, both complete seeded runs,
English/Spanish Merchant transactions, tile-detail accessibility and third-Flower
collection, in both desktop and mobile Chromium configurations.

The final Pages-base production build passed: 333 modules, JavaScript
`index-DuPsMlZD.js` (1,383.32 kB / 393.24 kB gzip), and **236 precache entries /
58,587.01 KiB**. Strict TypeScript was rerun after the final component test was
added and passed. Large-chunk and stale-Browserslist warnings remain. The final
touch/component subset passed 5/5; targeted ESLint/whitespace checks passed.
Artifacts: `/tmp/tensho-merchant-KYR4lj/table-loop-final/`. Spanish mobile ready
state and Jade Ledger popup screenshots were visually reviewed. This is not
physical-device, Safari, native-speaker, or live deployment verification.

The final full unit suite passed **830/830 tests in 77 files** (81.83 seconds),
using `bun run test:run --maxWorkers=1 --pool=threads` and original timeouts.
This includes the Merchant, journal, rejected-action, touch, artwork and Flora
regressions; focused totals above are overlapping evidence, not additional tests.

Against the final production build under `/tensho-web/`, all **8/8 public-guide
browser checks** passed without retries (18.1 seconds). Coverage includes
desktop/mobile menu-to-practice navigation, no-JavaScript About/how-to/FAQ pages,
metadata and assets, 320/768/1440 widths, 200% root-text enlargement at 320px,
keyboard skip-to-main focus and navigation links. Artifacts:
`/tmp/tensho-merchant-KYR4lj/production-guides/`. These checks do not establish
live indexing, native browser zoom, performance or complete browser-suite coverage.
