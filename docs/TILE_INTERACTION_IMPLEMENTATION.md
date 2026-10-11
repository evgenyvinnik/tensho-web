# Tile interaction recovery

Updated October 11, 2026. Classic recovery is published in v1.0.261011-12;
the additional Table Loop adjustment and production-browser gate are in verification.

## Reproduced defects and changes

The clean `6c8e408` baseline reproduced 13 failures in 32 selected desktop and
mobile browser cases. Three presentation defects were initially identified,
followed by a fourth in the broader regression pass:

- Plum's two overlapping sequences rendered their shared physical tile twice.
  `groupHand` now merges connected scoring groups into one physical cluster,
  preserving each structure payment. For 1–2–3–4–5 this means five buttons and
  `Sequence ×2 +60`, not six buttons. Staging leaves one empty rack slot and
  returning restores that same slot. Concealed identities remain excluded.
- The desktop first-move lesson floated over the mat and intercepted return
  clicks. Guidance now reserves real layout space at every width. It remains
  initially open, collapsible and user-dismissed; there is no reading timer.
- On a 320×568 complete-hand layout, scrolling the rack hid the discard drop
  target. The rack tools/drop-target row now sticks inside the scrolling board.
- The first broader regression batch exposed a separate narrow-phone gap
  mismatch in the integrated baseline: CSS used 2px gaps while group widths
  budgeted 4px, and staging removed the selector that applied compact gaps and
  margins. Groups now share a responsive gap variable and retain their layout
  marker while staged, keeping labels tile-bounded and rack positions stable.

Scoring, spending, hand legality, saved-run schema and reward rules are unchanged.
The existing rule that staged tiles lose their yellow selection frame remains;
keyboard focus indicators are intentionally retained.

## Test corrections versus application fixes

The Frostbite browser tests clicked a deliberately hidden old forecast panel to
dismiss a tooltip. They now click the inert, visible top-bar gold display, retaining outside-click/tap
dismissal and every payment, retrigger, settlement and restore assertion.
Shop-guidance tests now reflect the already-published, initially collapsed Tea
House disclosure, exercising open, close, reopen and read-only behavior.
Tutorial layout assertions require in-flow placement on desktop as well as phone.
The table selector's reported image failure did not reproduce in the first
desktop/mobile recheck; no application fix is claimed for that historical result.

## Evidence and limits

Retained local evidence: `/tmp/tensho-interaction-IE5a7E/`.

- Five new grouping regressions failed before the fix; all nine grouping and
  all 35 PlaySurface tests now pass (44 total). The additional component test
  stages/returns Plum's bridge tile without duplication or lost structure points.
- The corrected targeted browser batch passes 48/48 across tile details,
  Flower mutations, Bamboo/Summer, Frostbite retriggers, tutorial layout and
  progressive guidance. No retries or forced clicks were used.
- An expanded 124-case process ended with SIGTERM after 29 passes. This partial
  run is not certification; its cause is unknown and its log is retained.
- The first completed 98-case broader batch passes 85/98. All 13 phone
  tap-discard cases fail the exact group-width assertion: a three-tile group
  measured 140px while its tile row measured 136px (pairs 92px versus 90px).
  This is the responsive-gap mismatch above, not a flaky timeout. The assertions
  are unchanged. All 38 corrected-source tap/keyboard-discard and drag-geometry
  cases pass (1.3 minutes), including every phone locale, payment and reload.
  All 44 grouping/PlaySurface tests also pass after the gap change. The remaining
  134 affected native browser cases pass on that final source in 6.9 minutes:
  **172/172 final-source native checks**, with no retries or forced clicks.
- The first all-tile/table-selector batch passes 27/28. Japanese desktop reached
  the whole-test 30-second deadline near its final return gesture; the trace
  contains no failed hit-test or interception assertion. The new exhaustive
  journey now permits 60 seconds overall, with each action bounded to 5 seconds.
  Other CPU-heavy applications were running; causation is not established.
- The all-tile journey keeps the first lesson open and stages/returns every
  physical rack tile through real mouse or touch input in all 13 locales at
  1280×800 and 320×568. It checks center-point hit targets, unique IDs, visible
  Play controls, absent staged selection frames, unchanged saved state, overflow
  and JavaScript errors. Its pre-gap-correction rerun passes all 28 cases (26 all-tile journeys
  and both unchanged table-selector checks), without retries, in 3.5 minutes.
  All 26 all-tile journeys pass again in the final-source 134-case batch above.
- Targeted lint, formatting, whitespace, all 13 release safeguards, strict
  TypeScript and the Pages-path production build pass. The main JavaScript is
  `index-B5CX9I_7.js` after the gap correction; large-chunk and stale Browserslist
  warnings remain. The full local suite passes **2,957/2,957 tests in 209 files**
  with two workers (189.95 seconds). Production replay, deployment and hosted
  verification are pending.
- The first 80-case production batch passes **77/80** (12.1 minutes). Spanish
  desktop Frostbite/Echo reaches the settled Tea House, then exceeds both the
  30-second test budget and context teardown budget. Its trace archive is
  truncated; the error-context and screenshot survive. English-phone Flower
  and Spanish-phone Echo are the other failures. Do not count this batch as
  green or infer the desktop timeout's cause from slow timing.
- The Spanish-phone Echo trace identifies a test-target mistake in the first
  correction: the popover legitimately covers the mat's center, so tapping that
  point is not an outside tap. The test now uses the inert top-bar gold display,
  preserving native outside dismissal and all read-only/payment assertions.
  The English-phone Flower trace reaches the next round and times out at the
  final reload saved-status check; no earlier scoring assertion failed. That
  timing failure passes an unchanged isolated recheck. All eight Flower/Echo
  production journeys pass with one worker, no retries and their original
  30-second budgets (1.4 minutes). The two original timing failures remain
  diagnostic limits, not claimed application root-cause fixes.

## Concurrent main integration

After local verification, `origin/main` advanced to `16a33dd` (version
`1.0.261011-11`). Its Table Loop rack/hint/next-target improvements and WebKit
verification notes were preserved with an ordinary fast-forward. Classic code
did not conflict. The combined source passes all **2,957 tests in 209 files**
(184.33 seconds), strict TypeScript and the Pages-path build, which emits
`index-zCvLjcMX.js`. The first combined production pass was deliberately stopped
with SIGINT after source review found that the new layout test counted the
intentional selected-tile lift as rack reflow. This partial run is not a release
gate. The corrected check compares untransformed layout boxes; final combined
production verification remains pending.

The added public-UI Table Loop layout regression checks English/Spanish on
desktop and 320×568 touch: selection must leave every rack position unchanged,
the game itself must reveal the pair slot, and committing it must persist exactly
one placement before reload. It does not use development imports or grant items.
The first focused pass was 2/4: both phones left about 0.2px of the pair slot
clipped at the board edge (intersection ratio 0.99827). The board now reserves
4px of scroll padding so automatic scrolling has breathing room for the full
slot/focus border. The full-visibility assertion is unchanged. The rebuilt game
(`index-B_f69Pki.js`, `index-CJYY23o3.css`) passes all four focused production
checks, including persistence after placement/reload, with no retries. The
Spanish 320×568 screenshot was inspected. The final 84-case combined production
pass was stopped with SIGINT after repeated whole-test and teardown timeouts:
2 passed, 4 failed, 1 interrupted, 77 not run. Its traces and log are retained in
`/tmp/tensho-interaction-IE5a7E/final-production`. This is not a green gate.
The later PlaySurface unit recheck also failed to start its Vitest worker; no
test assertions ran. Heavy local resource pressure was observed, but that does
not prove the cause of any individual timeout.

An isolated GitHub verification workflow now runs the full application suite,
release safeguards and the same 84 production-browser journeys on a temporary
verification branch, without publishing Pages. The shared browser gate also
runs before the main workflow uploads a deployment artifact. It uses one worker,
zero retries, the normal production save reader and checked-in synthetic replay
fixtures; failed traces/screenshots are retained as CI artifacts. Publication
and hosted verification of these additional changes remain pending until that
independent gate succeeds.

Concurrent main published the Classic recovery in `d7ef45d`, versioned as
`db6ec64` / v1.0.261011-12. Deployment run `38169705419` succeeded and the public
`release.json` matches that commit/tag. This release did not include the new
browser gate or Table Loop scroll padding. Both histories were merged normally;
the corrected Table Loop regression compares layout boxes, preserving the
intentional selected-tile lift rather than treating it as rack reflow.

The first isolated CI run (`38171941851`) passes application tests, release
safeguards and the production build, but starts no browser cases: CI's ANSI
emphasis splits Vite's printed URL around the port, so the readiness check
rejects its own preview. The captured preview log establishes this runner bug.
The runner now strips terminal formatting before recognizing its own URL while
still requiring an exact built-index response. Success and failure-exit tests
cover both plain and colored startup output. No game assertion was relaxed.

The corrected independent run `38172486816` (`45ba2a6`) passes all **2,957
application tests in 209 files**, **17 release/runner checks**, the production
build and **84/84 browser journeys**, with one worker and zero retries (10.1
minutes for browsers). Its diagnostics are downloaded to
`/tmp/tensho-interaction-IE5a7E/ci-passed`; Spanish Table Loop and Japanese
Classic short-phone screenshots were inspected. The staged tile has no yellow
selection frame, and the Table Loop pair destination is fully visible.

Main then advanced to v1.0.261011-13 (`d1cd303`), adding scroll margins around
Table Loop slots/drafts and an unselected-tile paint-position check. Both changes
are preserved in ordinary merge `3a4e380`: the regression now checks every tile's
untransformed layout position **and** every unselected tile's painted position.
Independent combined run `38173552028` also passes the full application suite,
release/runner checks, build and all 84 production-browser journeys without
retries. Published in **v1.0.261011-14** (`d484538`): deployment run
`38174591930` passes 2,957 application tests, 17 release/runner checks, the build
and all 84 browser journeys (7.9 minutes, zero retries). The public manifest,
remote tag and served entry-bundle version agree. The English/Japanese
desktop/phone journeys also pass against the public site (**4/4**, zero retries,
1.4 minutes), exercising every physical rack tile with the first lesson open,
no staged selection ring and an unchanged saved snapshot. Evidence is retained
in `/tmp/tensho-interaction-IE5a7E/hosted-v14`. This is a focused hosted check,
not an all-locale/effect rerun. The separate Dragon-hint follow-up is not part
of this release.

Desktop and Japanese short-phone screenshots were inspected. On short phones
the board deliberately scrolls; this does not promise simultaneous visibility of
the full lesson, forecast and every rack row. These checks use Chromium device
emulation, not physical Safari/iOS, native-speaker or newcomer usability testing.
Existing illustrated tiles/flowers are preserved; this checkpoint adds no new
artwork. The preceding generated ledger is documented in
[Compact Tea House](SHOP_DENSITY_IMPLEMENTATION.md).

Production replay uses captured native saved-run envelopes (`replay/complete.json`,
`quad.json`, `mutations.json`, `echo.json`) from the retained baseline traces.
The compiled app restores those inputs and performs real UI actions, engine
payments and reloads without development-module imports. These deliberately
constructed inventories and targets isolate effect interactions; they do not
prove organic acquisition, balance, or later-Act enjoyment.
