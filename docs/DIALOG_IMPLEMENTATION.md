# Confirmation dialogs and exit lifecycle

Verified September 9, 2026. This closes the shared Popup keyboard/modal gap; it does not establish completion of every Settings operation or of the wider game audit.

## Behavior implemented

- `Popup` uses a native `dialog` opened with `showModal()`. The browser's top layer blocks background interaction, including programmatic focus on an enabled gameplay control.
- Every popup has a required title and a unique accessible name. Confirmations and alerts also expose their short message as an accessible description. Structured tutorials retain their own readable content instead of flattening it into one description.
- Cancel receives initial focus in confirmations. Alerts focus OK; guides with a close button focus Close. Tab and Shift+Tab wrap around enabled, visible controls. Parent rerenders do not reset the user's focus.
- Native Escape cancellation calls the controlled close callback without confirming. Closing restores the previous connected control. The Settings confirmation-to-success transition transfers focus to OK and ultimately restores the original Reset Tutorial button.
- Backdrop dismissal requires a press that starts and ends outside the card. A drag from content, cancelled pointer, or a popup with `closeOnBackdrop={false}` does not dismiss it.
- Default Close, Cancel, Confirm, and OK labels use existing translations. The Charter purchase button is named by its localized item title and visible price, rather than price alone.
- Existing artwork and centered titles are retained. Safe-area padding never drops below 12 pixels. Content scrolls within the viewport, keeps clearance from the vertical ornament and bottom roller, and confirmation actions stack below 380 pixels to accommodate localized labels.
- Popup springs honor the existing system/app reduced-motion preference.

Implementation: [Popup](../src/components/ui/Popup.tsx), [CharterCard](../src/components/shop/CharterCard.tsx).

## Exit bug found by the new tests

Confirming Exit navigated to the menu but could immediately start a hidden new run. `endRun()` published the reset state while the gameplay screen was still mounted during navigation. Its auto-start effect interpreted the reset as a fresh visit to `/play`.

[GameplayScreen](../src/components/screens/GameplayScreen.tsx) now marks the intentional exit before resetting the run. Auto-start ignores that intermediate state. The browser regression requires the menu phase, an inactive run, an empty hand, and an empty selection after confirmation. Cancellation must preserve the original run snapshot.

## Verification and limits

- Before migration, all four initial desktop/mobile exit checks failed because no accessible dialog existed.
- After migration, eight of ten dialog checks passed; the other two exposed the hidden-new-run bug. Those checks were not weakened to accept the wrong engine state.
- [Popup unit tests](../src/components/ui/Popup.test.tsx): seven checks covering centered title, semantics, safe focus, callback rerender stability, restoration, visible/enabled tab boundaries, native cancellation, backdrop policy, and alert acknowledgement.
- [Dialog browser tests](../e2e/dialogs.spec.ts): five scenarios across desktop and mobile Chromium, ten checks total. They cover Exit cancellation/confirmation, native background focus isolation, reset-to-alert handoff, real keyboard Charter cancellation/purchase with once-only payment, and a 320×568 Spanish reset warning with reduced motion. Purchase fixtures author an offer, not the transaction implementation.
- Screenshot inspection caught cramped Spanish labels that button-bounds checks alone missed. Actions now stack on the narrow phone; a text-range assertion checks that labels remain inside their buttons. Final screenshots were also inspected for centered titles and ornament clearance.
- JSDOM's test-only dialog shims merely expose `open` state. They do not simulate the top layer or inert background; those assertions run in a real browser.
- Final full unit/component suite: **538 passed across 48 files** with `bun run test:run --maxWorkers=2`.
- Strict TypeScript and `VITE_BASE_PATH=/tensho-web/ bun run build` passed. Targeted ESLint, Prettier, and whitespace checks passed. Existing large-bundle and stale-Browserslist warnings remain.
- Final full browser suite: **144/144 passed**, without retries, with `npx playwright test --reporter=list --workers=2 --trace=retain-on-failure`.

Failure history is retained: an earlier final-spacing run passed 142/144, with timeouts in the existing desktop 1280×800 rack and outside-drop drag tests. Both tests then passed three isolated repetitions without source/assertion/timeout changes, followed by the successful full run above. The original timeouts are not conclusively attributed; a clean rerun is not proof that an intermittent problem cannot recur.

## Long-content follow-up — September 10

The Flora inspector exposed two shared Popup defects. Opening after an initially
closed render could leave reduced-motion content transparent for its first
frame; final opacity/transform now bypass the animation values in that mode.
Also, a covered background image scaled its ornamental rollers with the whole
dialog, allowing long scrolled text to overlap them. The unchanged PNG now uses
CSS nine-slice borders with fixed 64-pixel caps, separate inner scrolling, and
clearance for the fixed close control. Geometry checks cover 320×568, 568×320,
and 1024×768, including an already-scrolled dialog during viewport changes.

All ten shared dialog browser checks pass in the subsequent 201/202 full run;
the single full-run failure was desktop Codex navigation, not a dialog check.
See [Flora implementation](FLORA_IMPLEMENTATION.md) and the [current ledger](IMPLEMENTATION_WRAP_UP.md#current-flora-dialog-and-touch-checkpoint)
for the 24/24 follow-up, screenshots, and remaining verification limits.

These are Chromium and emulated-mobile checks, not physical iOS, Safari, screen-reader listening, native-speaker review, organic progression, or human enjoyment validation. No live player progress was reset during verification; browser tests use isolated contexts. Nothing was committed, pushed, or deployed.

## Still open

- **Reset All Progress follow-up completed:** the separate progression/table/Stake/Archive stores, active Classic run, saved Table Loop, tutorial flags, failure recovery, and reload behavior are now coordinated and verified in [Progress reset](PROGRESS_RESET_IMPLEMENTATION.md). That later checkpoint also keeps the expanded warning's scroll padding fixed. The earlier cancellation/layout check alone was not evidence of correct reset semantics.
- Cash-out prose and other later-game localization gaps remain, including literal escaped Japanese ornament text in the Charter UI.
- Broader effect combinations, progression policy, Fate Seal rule reconciliation, and release verification remain in the [completion ledger](IMPLEMENTATION_WRAP_UP.md).
