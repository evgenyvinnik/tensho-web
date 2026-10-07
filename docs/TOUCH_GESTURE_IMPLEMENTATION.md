# First-frame tile gestures

October 7, 2026 — first-frame fix published in v1.0.261007-9;
moving-target correction published and verified in v1.0.261007-10.

## Reproduced defect

The Bamboo/Summer hosted journeys exposed intermittent missed initial touch
discards. Those runs alone do not prove a cause. Inspection found that the play
surface attached its window pointer listeners only after React rendered a
non-null drag state. A release arriving before that render had no handler.

A batched pointer-down/move/up regression reproduces the lost discard before the
fix. The first tap test also failed, but initially used mismatched start/end
coordinates; correcting that test retained the intended no-paint tap coverage.
This does not prove the race explains every hosted miss or timing failure.

## Fix

Keep gesture ownership in a synchronous ref and the animation projection in
React state. Install listeners while mounted, not only while a drag is painted.
Only the owning pointer can move, finish or cancel; consume the gesture before
callbacks, so duplicate releases cannot pay twice. Blank-surface panning and
keyboard/assistive activation remain unchanged. A surface disabled during a
gesture rejects its eventual action.

No scoring, resources, saved-run schema, illustration or localization changes.
The new Summer portrait was published by the preceding Bamboo checkpoint.

## Evidence

Directory: `/tmp/tensho-bamboo-summer-R85V9c`.

- `fast-gesture-before.log`: 23 pass, two fail (including the tap fixture issue).
- `fast-gesture-after.log`: discard regression fixed; 24 pass, tap fixture fails.
- `fast-gesture-final.log`: 27/27 pass after correcting the tap coordinates and
  adding fast cancellation, duplicate release and disabled-during-drag checks.
- TypeScript, Pages build (including offline worker), and lint pass; lint has
  zero errors and 211 pre-existing warnings.
- Native browser batch: 11/14 pass, three overall-deadline failures. The unchanged
  three-case recheck passes 3/3. Coverage includes English/Spanish desktop/touch
  discard, staging, payment, reload and round cleanup, plus real redraw, Seal
  reward, lock/exhaustion availability. No deadline or assertion was weakened.
- Full regression passes **1,843/1,843 in 156 files** (`touch-units.log`).
- Built-production batch initially passes 7/8; a full-hand English phone journey
  misses the initial discard. This contradicts any claim that the ref fix alone
  explains every browser miss. No assertion or deadline is removed.
- A diagnostic repeat with native pointer-target logging passes 5/5; the traces
  show the intended tile on pointer-down and discard zone on pointer-up. Logging
  can affect timing, so these passes do not prove the intermittent issue absent.
  Moving logging to page initialization (no extra pre-touch evaluation) passes
  a further **10/10** complete-hand phone repeats. Both diagnostic batches keep
  every scoring, saving and next-round assertion. Logging still affects timing;
  the unresolved intermittent miss remains a caveat, not silently reclassified.
  Final all-case production replay passes **8/8**, desktop/phone, English/Spanish,
  with diagnostic attachments retained (`touch-production-final.log/json`).
  Independent CI/publication and hosted replay remain pending. The known
  first-frame race is fixed; the unexplained earlier browser miss remains a
  verification caveat rather than a claim about fully diagnosed touch behavior.
- Previous release's hosted failures remain in the Bamboo ledger. Do not count
  its earlier passing isolated replay as verification of this local change.

## Published input fix and remaining layout defect

[Release workflow](https://github.com/evgenyvinnik/tensho-web/actions/runs/37694029389)
passed all 1,843 tests, 13 release checks, build and deployment. Public manifest
and tag match `2f365f1d26128ab599697d4b668ff073c30e7a57`, v1.0.261007-9.
The hosted batch nevertheless passed only **5/8** (`touch-hosted.log/json`).
Three phone journeys missed the initial discard, with correct pointer delivery.
Diagnostic traces show the target changing sides between measurement and release:
for example, the aimed English target was at x=59, but the actual drop rectangle
was at x=236–287. The release hit the rack background, not the discard control.
This establishes a separate layout failure, not a first-frame listener failure.

### Stable rack header and font loading

The discard zone now occupies a dedicated 56px right column, with a 44px-tall
target aligned to the top. Status/count copy wraps only in the left column;
phone readiness text has its own row. Text spacing no longer sends the target
to the opposite side of the rack.

UI font faces use `font-display: optional`: if a face is too late for initial
layout, the readable fallback remains for that page instead of moving controls
during a gesture. Fast/cached themed fonts remain available. Tile calligraphy
retains its existing loading behavior. Both font declaration files agree.
No scoring, save schema or resource rules change.

Evidence in the same directory:

- `layout-before.log`: English real-browser text-spacing stress reproduces a
  **203.328px** target jump. Spanish/Russian initial tests instead reached a bad
  test-only field name (`discardPile`); corrected to the actual `discards` field.
- `layout-native.log`: after the grid correction, all 14 journeys pass (eight
  Bamboo/scoring/save/round journeys plus six localized text-spacing cases).
- `layout-fonts.log`: deliberately holding font downloads until pointer-down
  exposes a second reflow; 9/12 pass. Desktop English/Spanish shift 6px vertically,
  Russian phone shifts 34.5px. This motivated the font policy, not a weaker test.
- `layout-fonts-fixed.log`: **20/20** native journeys pass after both changes.
  The strict <1px center-movement requirement, real mouse/native touch discard,
  physical discarded identity and resource assertions remain unchanged.
- Component regressions pass 27/27; TypeScript, Pages-base build, targeted lint
  and 13 release-workflow checks pass. The built-production batch passes **20/20**
  (`layout-production.log`). Review subsequently made the organic-run resource
  assertion account for an Autumn drawn during replacement, while also requiring
  the actual discard counter to increase exactly once. This is test correctness,
  not a runtime rule change. The final assertion recheck passes **12/12**
  (`layout-final-assertions.log`). Independent release CI and hosted verification
  remain pending for the layout correction.

### Published layout verification

- Implementation: `83fd2d271b04a617e090e61628ee4631295ea117`.
- [Release workflow](https://github.com/evgenyvinnik/tensho-web/actions/runs/37695867674)
  passes **1,843/1,843 tests in 156 files**, **13 release checks**, build and
  deployment. Final log: `layout-ci-build.log`; the first log request was too
  early for GitHub to return it, not a build failure.
- Public manifest and remote `v1.0.261007-10` tag both identify
  `372932d0481d9bd08bd891b39eadfd3543417d4f`. The actual `/en/play/` HTML references
  `index-BIi70At4.js`, which contains `1.0.261007-10`, and `index-CCwI43Zv.css`,
  which contains the fixed-column layout and both optional UI font faces.
- **20/20 hosted journeys pass** (`layout-hosted.log`), without retries or
  increased deadlines: eight Bamboo quad/complete-hand scoring, persistence and
  round-cleanup journeys, plus twelve English/Spanish/Russian desktop/touch
  layout journeys with changed text spacing or fonts delayed until pointer-down.
  The latter use organic saved runs and verify exact physical discard identity,
  one discard expenditure (allowing newly drawn Autumn income), unchanged plays,
  stable target centers and no document-wide horizontal overflow.
- Both owned local servers were stopped. The pre-existing 4173 server was not
  touched. Documentation-only release evidence can be committed with `[skip ci]`
  because the runtime checkpoint above has already deployed successfully.

This closes the two reproduced input defects and the failing hosted checkpoint;
it does not erase earlier failures, prove every possible input path or certify
the whole game complete.

The Russian 320px screenshot also shows the existing narrow footer's Skip label
wrapping excessively. It is separate follow-up work, not fixed by this header.
Neither these input fixes nor passing journeys establish overall game completion.
