# First-frame tile gestures

October 7, 2026 — verified local correction; publication in progress.

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
