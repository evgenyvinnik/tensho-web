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
The initial isolated snapshot passes all **2,881 tests in 205 files** and all
**52 native browser checks** (thirteen locales × desktop/touch × Wall/staging).
Precache size is 37,839,285 bytes.

Integrated onto published main `5a7b7c5` as `437e9c8`, including the latest
opening-scroll behavior, without modifying unsaved workspace edits. The combined
production build passes **64/64 browser checks**, adding the twelve deterministic
drag-layout cases. Its 47 focused tests, TypeScript, targeted lint and offline
budget also pass (37,839,571 precache bytes). No browser retries were used.
Screenshots include the Russian 320×568 dialog with readable names/counts.
Published as **v1.0.261011-5**, tag/version commit
`bc0264eb1e2f447c828b67c227df8fccee64e1c1`. Workflow `38156080541` passes
all **2,881 tests in 205 files**, builds and deploys successfully. Public
`release.json` and runtime `/tensho-web/assets/index-B-q3gd3V.js` agree with
the tag. All **64/64 hosted browser checks pass without retries**, covering
desktop/phone, thirteen locales, real discard payment/reload, the missing mat
selection frame, Wall images/names/counts, unchanged save state, focus restoration
and the original Russian drag-layout regression. Unsaved workspace CSS is excluded.

The publish checkout incorporates the already-published opening-scroll changes
without rewriting the active workspace's divergent local history or its parallel
edits. Local implementation commit `bd59bdc` corresponds to published `437e9c8`.

This is not a claim that all layouts or onboarding are finished. Native-speaker
review, broader assistive-technology/device testing and human playtesting remain
open, as do the other items in `UI_IMPROVEMENT_BACKLOG.md`.
