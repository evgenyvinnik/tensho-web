# Readable wall inventory and unframed staged tiles

October 11, 2026. This implements UI backlog item 3 and the user's request to
remove the yellow frame after a tile reaches the mat.

## Shipped behavior in this checkpoint

- The Wall chip opens one dialog; the unused, English-only expandable branch
  and its `compact` prop are removed. The only production caller is updated.
- Suit names are complete localized headings, not ambiguous single letters.
  Each illustrated tile has its localized name and remaining count visibly
  below it. Information no longer requires hovering over tiny images.
- The grid adapts to the dialog width, retaining 44px tile images and wrapping
  captions. Existing artwork is reused rather than generating duplicate tiles.
- Red and ordinary fives are separate entries. Counts reflect physical live-wall
  tiles, update while open, and show zero without inventing empty groups. Neither
  opening nor closing the dialog mutates game/save state.
- Staged tiles no longer receive the yellow selected ring/tint; selection IDs,
  payment, keyboard focus, hints, locks and other rule indicators are preserved.
  A drag originating on the mat also omits the selected treatment.

## Verification

Evidence: `/tmp/tensho-wall-release-dam4Rp`.
All 47 focused tests pass (14 Wall, 33 PlaySurface), including all thirteen
locales, all seven suit groups, red-five separation, state updates, an empty wall,
focus restoration and three staging methods. The initial Thai test's substring
matcher confused Winds with Circles; explicit localized suit/count accessible
names now disambiguate the actual headings, with exact-prefix assertions.

Production build/TypeScript, targeted lint and thirteen release tests pass.
Precache size is 37,839,285 bytes. Full regression, browser verification and
publication are still underway. Test snapshots exclude concurrent unsaved CSS
and opening-scroll edits; any integration with newer main commits requires a
separate verification pass before publication.

This is not a claim that all layouts or onboarding are finished. Native-speaker
review, broader assistive-technology/device testing and human playtesting remain
open, as do the other items in `UI_IMPROVEMENT_BACKLOG.md`.
