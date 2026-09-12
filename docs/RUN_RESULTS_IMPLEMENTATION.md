# Run results and animation continuity

**Updated:** September 10, 2026. This closes specific result-flow and presentation
gaps, not the broader progression or effect-library audit.

## What changed

The result screen now includes localized victory, defeat, and Endless guidance
and controls in all 13 languages. The score uses the interface language's number
format and occupies a full-width row, rather than truncating inside a narrow
third column. Actions stack on phones; the Endless action spans both columns on
larger screens, with two secondary actions below it. Long labels can wrap.
Short screens intentionally scroll to the remaining actions.

Screenshot review also exposed floating final-hand text covering the result
heading. Scoring popups now clear when the authoritative game phase changes.
The next screen presents its own summary; ordinary in-phase score effects remain
available. This does not localize every floating effect label elsewhere in play.

## A functional animation bug, not just a layout problem

The browser's attempt to scroll to a result button failed because that button
was detached during screen shake. `useScreenShake` returned a component callback
whose identity changed with every shake offset. The provider rendered that
callback as the wrapper around the entire app, so React remounted its descendants
on every frame. A focused input lost its typed value in a direct regression test.

The provider now renders one stable DOM wrapper and changes only its transform.
The regression advances animation frames and verifies the exact same input node,
focus, typed value, and mount/unmount counts through the shake and its completion.
A separate test verifies that phase changes clear old popups without disabling
new ones. See [`useVFX.test.tsx`](../src/hooks/useVFX.test.tsx).

This is a demonstrated cause of the result-screen detachment. It is not proof
that every earlier intermittent first-click failure had the same cause.

## Browser evidence

### Screen-shake boundary and motion-preference follow-up

September 10 receipt checks reproduced document width growing from 320 to 321
pixels while the entire app was translated by screen shake. The VFX hooks read
only the app setting, so an OS reduced-motion preference did not prevent this
translation. They now use the existing combined `useReducedMotion` hook.

The moving stage sits inside a stationary `overflow-clip` boundary. Its stable
DOM type still preserves descendant controls and local state. Active shake is
cancelled when the motion preference or game phase changes; cancelled callbacks
cannot restore the old offset. Unmount clears both its frame and configuration.
Ordinary shake remains enabled when neither preference requests reduction.

The VFX hook suite now has five cases: its two earlier continuity/popup tests,
OS preference suppression, and cancellation on setting/phase changes. A new
browser scenario samples positive and negative offsets during an exaggerated
24-pixel shake, requires document width to remain within the viewport, preserves
the same control node, then switches the OS preference and verifies both active
and subsequent shake stay at zero. It runs on desktop and mobile Chromium;
no extra overflow tolerance or artificial settle delay replaces these checks.

The final full browser suite passed **178/178** without retries (13.8 minutes).
Both ordinary screen scrolling and existing dialogs, rack interactions, result
flows, and Table Loop recovery passed with the new boundary. An earlier desktop
shake check and a long-dialog check timed out; both passed unchanged in the final
run. Their timing cause is not proven. Broader full-flash and physical-device
accessibility review remains separate from these shake-specific assertions.

### Result-flow scenarios

[`run-results.spec.ts`](../e2e/run-results.spec.ts) runs four scenarios in both
desktop and mobile Chromium:

1. A final Act 8 play goes through the rendered Play action, records exactly one
   completed run and win, unlocks Stake 2 for the default table, and offers
   explicit Endless continuation. Entering the reward shop does not pay again;
   a duplicate continuation is rejected. The next round is Act 9 Small. Losing
   there retains the secured win without counting another completed run. Returning
   to the menu resets the active run without erasing the earned unlock.
2. An Act 8 defeat does not record a win or unlock Stake 2, does not offer Endless,
   and Try Again begins an active, zero-score Act 1 run.
3. Spanish victory instructions, full score, and actions fit 320×568 and 640×568
   layouts. Secondary controls are reachable by scrolling, and the localized
   Endless action navigates to the Spanish shop. Screenshots were inspected.
4. Buying Ancient Script in the post-victory shop charges its real 10G price,
   changes the displayed destination from Act 9 to Act 8, and applies exactly
   one fewer hand than the run's Decree-adjusted allowance. The gameplay header
   still says Endless after the rewind. A subsequent defeat shows the Endless
   result, preserves the existing win/unlock, and offers no second continuation.

These are explicit late-run fixtures: they set the Act and score target and
remove the randomized boss restriction to isolate settlement. The actual final
play, navigation, payout, progression bridge, shop exit, and subsequent defeat
use production paths. They do **not** prove an ordinary player can reach Act 8,
nor cover all boss, table, Stake, Charter, or loss-prevention combinations.

## Endless survives Act-reducing Charters

The Ancient Script scenario initially reproduced an incorrect second Victory
screen with an unusable Continue into Endless button after losing at rewound
Act 8. Both the result screen and gameplay header inferred mode from the Act
number, which is not a reliable indicator once Charters can change progression.

`hasEnteredEndless` is now authoritative run state. It starts false, becomes true
only on a successful explicit continuation, remains true through Act rewinds and
subsequent defeat, and resets with a new run. The continuation API also rejects
an already-entered Endless run. The result screen and header read this flag rather
than guessing from `currentAct`.

`getNextActNumber()` supplies both the Boss-shop destination preview and the
actual rewind transition. Reading it does not spend the reduction or change the
RoundManager/RNG state. Exit consumes pending reductions once, with Act 1 as the
lower bound. Nine checks in
[`EndlessProgression.test.ts`](../src/game/EndlessProgression.test.ts) cover these
invariants, reset and once-only entry, defeats at Acts 7/8/9, and clearing the
Act 8 Boss again without a second recorded win. The multi-reduction cases are
explicit state fixtures, not proof of organic upgraded-Charter acquisition.

The browser fixture includes Extended Hand Grant, so the hand-penalty assertion
uses the prior actual allowance minus one, not the unmodified default of four.
No runtime rule was changed to accommodate the fixture.

## Verification and remaining scope

The following counts are the September 9 result-flow checkpoint. The September
10 shake follow-up and current full-suite results are recorded above and in the
[implementation ledger](IMPLEMENTATION_WRAP_UP.md).

- Full application suite: **532 tests in 48 files passed**.
- Full browser suite: **134/134 passed**, without retries, after the Endless
  header and Charter rewind fixes.
- Strict TypeScript and the `/tensho-web/` production build passed.
- Release workflow: **13 isolated checks passed**; see
  [release implementation](RELEASE_IMPLEMENTATION.md).
- Repository lint: zero errors, 211 existing warnings. The edited VFX module
  retains its mixed-hook/component Fast Refresh warnings; the new tests and
  result-screen changes have no targeted lint warnings.

Still open: resource-aware progression, organic later-Act play, full modifier
combinations (including upgraded-Charter acquisition), native-speaker and
physical-device review, newcomer observation, and actual deployment. Shared
purchase/exit `Popup` accessibility also needs a follow-up: its current markup
has no dialog role, initial-focus handling, or focus containment. The Charter
test uses its existing visible confirmation controls, not a claim of keyboard
modal conformance. Much of the cash-out banner's prose still needs localization.
