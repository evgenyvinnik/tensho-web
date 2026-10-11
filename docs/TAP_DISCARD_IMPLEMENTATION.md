# Readable grouped racks and tap-to-discard

October 11, 2026. Implementation checkpoint; verification and release results below.

## Reproduced problem

The previous release's Russian 320×568 font-loading check failed before dragging:
scrolling to the final tile scrolled the discard target out of view. Its exact
organic starting seed, `1791731727055`, reproduces the failure. The existing drag
test now holds browser time at that seed, so it cannot pass just because the next
random hand happens to be shorter.

Long labels supplied a group's intrinsic width independently of its physical
tiles, forcing additional rack rows. A partly staged group also lost its wrapper,
allowing other tiles to change position under the player's finger.

## Behavior

- A group has exactly its tiles' touch-target widths plus the inter-tile gaps.
  Its localized label wraps within that width, with two reserved lines. Tile
  fitting accounts for the extra label height instead of assuming one line.
- Staging preserves the group wrapper and every rack slot. A partial group's
  label becomes invisible but retains its space; it no longer falsely claims
  that the remaining rack tiles form that group. Returning the tile restores it.
- Discard has a stable action-bar button. It is enabled only for exactly one
  selected tile, a remaining discard action and authoritative engine permission.
  Locks and no-discard Mandates are not bypassed. Tap/keyboard activation calls
  the same handler and `game.discard` operation as dragging.
- A successful discard removes that physical tile, pays the existing cost, draws
  replacements and saves normally. Rejected actions retain the selection. No
  new game rule, discount, scoring action or extra allowance is introduced.
- Skip, Discard, Redraw and Dead Wall use fixed 44px icon controls below 640px,
  with localized accessible names/titles; wider screens retain text. This avoids
  the previous word-by-word vertical stacks in the small secondary controls.
  Discard stays disabled after payment rather than turning into Skip beneath a
  second tap. The existing rack counter remains the one discard-count display.

No raster artwork was generated or replaced: these small controls extend the
existing SVG-style UI, and all illustrated game assets remain intact.

## Verification

Evidence: `/tmp/tensho-rack-recovery-UrMB8W`.

- `red.log` reproduces the original short-screen failure with the exact seed.
- Initial corrected rack: twelve drag tests pass, including English, Spanish
  and Russian desktop/touch font-loading and text-spacing stress. Original
  center stability, minimum target size and real discard-cost checks remain.
- Twenty-six all-locale desktop-keyboard/touch journeys pass for the first
  action layout. They check bounded labels, stable group positions, free staging,
  exactly one paid discard, unchanged Hands, legitimate Autumn allowances,
  cleared staging and saved continuation. Final stable-button runs supersede
  these as release evidence below.
- Unit coverage checks ambiguous selections, exhausted resources and engine
  restrictions. An initial size-fit expectation was updated because reserving
  two label lines requires a smaller tile preset within the same height budget.
- The first tap fixture incorrectly required unchanged raw save bytes during
  selection and reload. Classic intentionally persists selection and transfers
  its writer lease on reload. The corrected test compares gameplay state,
  allowing only the documented selection change before payment.
- A verification snapshot excludes concurrent image-loading and rack-pinning
  edits. Its first browser batch passed 37 cases but failed one artifact write
  with `ENOSPC`; that case is not counted as passed. Disposable archive/build
  copies were removed, retaining logs/traces. Those copies can be reconstructed
  from the recorded Git trees/commits; no project or player data was removed.

The final isolated stable-button build passes **38/38 native browser checks**
and **38/38 production-browser checks** without retries. Fourteen additional
native tutorial/hand-builder checks pass. Production build/TypeScript, lint
(0 errors, 211 existing warnings), thirteen release checks and the offline
asset budget pass. The build precaches 37,841,404 bytes.

The full local unit run passed 2,863/2,864 tests; the balance-matrix CLI provenance
test failed because the isolated source archive had no Git metadata. Initializing
Git in that temporary archive (not changing application code) resolves the
failure: all 93 balance-matrix, action-bar, rack and tile-size checks pass on
recheck. This is not represented as an entirely green full-suite run. CI must
independently run the full suite before deployment is accepted.

Final snapshot tree: `56bafc0fba9231ac91fae4c6907f78b7da871ac6`;
temporary verification commit: `ffcd335b07089c77d2176d4a2a0405e4c8158005`.
Logs: `native-final.log`, `production.log`, `guidance.log`, `full-tests.log`,
`unit-recheck.log`, `build-final.log`, `lint-final.log`, `release-final.log`.
Publication and hosted verification remain pending.

## Remaining scope

This addresses a reproduced standard-hand defect, not every enlarged rack,
arbitrary zoom level, physical device or assistive technology. Primary Play
restriction copy and all rare combinations of secondary powers still warrant
layout review. Native-speaker review, broader onboarding and human enjoyment
remain open. Other [UI backlog](UI_IMPROVEMENT_BACKLOG.md) items are not removed.
