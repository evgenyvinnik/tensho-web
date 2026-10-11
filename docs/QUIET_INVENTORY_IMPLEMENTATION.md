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
Focused tests, complete consumable browser regression, all-locale newcomer
journeys, production build and full regression are in progress. The production
verification checkout starts from published main `5f4f34e` and excludes the
active workspace's parallel CSS edits. Publication is not yet claimed.

The first dialog focus test exposed mount autofocus capturing the dialog's own
Close button instead of its trigger in jsdom. Explicit focus after capture fixes
that test while retaining the native-dialog workflow; real browser cancellation
and last-use restoration are required before acceptance.

Other UI backlog items, native-speaker review, assistive-technology/device testing
and human playtesting remain open. Empty inventory suppression is not proof that
the broader onboarding or game balance is finished.
