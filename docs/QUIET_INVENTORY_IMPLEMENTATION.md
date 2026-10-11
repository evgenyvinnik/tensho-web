# Quieter inventory and discoverable tile guidance

October 11, 2026. Addresses UI backlog items 4 and 5 without changing item
ownership, acquisition, use permissions, prices or tutorial acknowledgement.

- Empty consumable families render no control or spacer. Owned families retain
  their existing illustrated controls, localized accessible counts and 44px
  targets. Stable family keys preserve the focused button across a language change.
- After using the last item, its trigger disappears. The consumable dialog
  returns focus to the persistent Wall button instead of losing it to the page.
  Cancellation and uses that leave inventory still restore the original trigger.
  Focus is captured before explicitly moving into the dialog, avoiding a mount
  autofocus race. Inventory updates while inspecting a dialog do not steal focus.
- Both first-move lessons refer to the visible book icon in all thirteen locales,
  matching the existing illustrated guide button on phones and larger screens.
  No automatic guide opening, new blocking lesson or new acknowledgement is added.
- Existing SVG controls and the generated guidebook illustration are reused.
  This checkpoint does not generate duplicate artwork or change the visual style.

## Verification

Evidence: `/tmp/tensho-quiet-inventory-VevzLs`.
All **62 native browser checks** pass: 28 real consumable-use/cancellation/
restriction journeys, 26 all-locale newcomer journeys and eight tutorial layout
checks, on desktop and phone projects. The initial full suite passes 2,893/2,896
tests; three balance CLI cases exceed their five-second timeouts under parallel
build/browser load. Without that load, all **74 checks in five files** pass,
including the entire unchanged CLI suite and the final focus implementation.
The earlier full run is not represented as entirely green.

The focus cleanup captures its persistent fallback while opening and checks that
it is still connected before returning focus. Final targeted lint has zero
warnings/errors; thirteen release tests pass. The production verification checkout
starts from published main `5f4f34e` and excludes active workspace CSS edits.
The final four native focus journeys (paid last-Seal use and cancellation, on
desktop and phone) pass after cleanup. The final production build/TypeScript and
all **26 production newcomer checks** also pass. Precache size is 37,840,322
bytes, within budget. No browser retries were used.

Published as **v1.0.261011-6**, tag/version commit
`39454e2f81f3bc10f21f68acc79bd18f0cc9886a`. Workflow `38157664535` passes all
**2,896 tests in 206 files**, builds and deploys successfully. Public
`release.json` and runtime `/tensho-web/assets/index-DtJ0hXwP.js` agree with the
tag. All **26 hosted newcomer checks pass without retries** across thirteen
locales and desktop/phone projects: no empty controls, visible book guidance,
44px guide targets, successful illustrated-guide opening, touch/keyboard closing,
focus restoration, no horizontal page overflow and unchanged saved game state.

Local `main` was synchronized only after `git cherry` proved all six divergent
local commits had published equivalents. Git autostash preserved pending edits;
before/after hashes match for all three parallel layout files, and the pending
documentation patch ID is unchanged. The only remaining non-document edit is the
parallel CSS change, excluded from this release. A pre-sync patch is retained
with the evidence; no force-push or hard reset was used.

The first dialog focus test exposed mount autofocus capturing the dialog's own
Close button instead of its trigger in jsdom. Explicit focus after capture fixes
that test while retaining the native-dialog workflow; real browser cancellation
and last-use restoration are required before acceptance.

Other UI backlog items, native-speaker review, assistive-technology/device testing
and human playtesting remain open. Empty inventory suppression is not proof that
the broader onboarding or game balance is finished.
