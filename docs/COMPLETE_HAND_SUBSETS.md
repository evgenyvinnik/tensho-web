# Complete hands inside an expanded rack

## Defect and behavior

Brush Stroke/Full Palette and other rack-size powers can leave more than fourteen
tiles in hand. The old coach offered only tactical groups and the **whole rack**;
the readiness/action/forecast path also passed the whole rack to the validator.
Thus sixteen tiles containing a complete fourteen-tile hand could still leave
Stage Hand unavailable. This is distinct from a scoring-rule or balance change.

`GameOrchestrator.findCompleteHandSelection()` now returns a visible, legal
physical declaration without changing selection, resources, RNG or save state.
It preserves whole-hand behavior when already valid and otherwise searches
standard, Seven Pairs, Orphans and supported Decree-assisted shapes. The shape
search builds melds/pairs from available counts instead of enumerating every
physical rack subset; there is no arbitrary sixteen-tile cap.

- Required physical copies are chosen before interchangeable unlocked copies.
- Concealed identities never enter the search; a concealed required tile blocks
  the suggestion. Visible complete hands may omit concealed spare tiles.
- Broken Stair, Harmonizer, False Eye, Honor Transmutation, Wildcard, Reality Warp
  and Clemency use the engine's actual validator after candidate generation.
  Temporary identity variants and virtual completion tiles never enter the rack.
- The first accepted shape is deterministic, **not** an optimal-score guarantee.
  Players may still choose another legal declaration or tactical play manually.
- Boss restrictions and available plays still apply. The search creates no bonus
  plays, extra draws, new hand grammar or automatic scoring.

The UI previews this declaration, stages only its IDs on the first press, and
requires a separate confirmation. Unused rack tiles remain held and survive
scoring/refill. Explicit selections continue to take precedence over suggestions.
The coach and balance harness use the same rule-aware candidate; ordinary coach
callers without that callback can search natural expanded-rack shapes.

The browser test also exposed the missing `gameplay.completeHand` translation
key, previously rendered via an English default. All thirteen locale files now
provide it, with a parity guard. This is not native-speaker certification.

## Evidence and limits

`src/game/CompleteHandSelection.test.ts` covers natural/special/assisted subsets,
physical locks, concealment, forbidden Boss sizes, a twenty-tile rack, exact
save/resume, forecast/payment and spare retention. An exhaustive two-discard
oracle compares natural-hand existence on sixteen deterministic sixteen-tile
racks. `PlaySurface.test.tsx` verifies exact subset staging, spare retention,
manual return and no restaging on ordinary parent rerenders.

`e2e/complete-hand-subsets.spec.ts` exercises five shapes in English/Spanish on
desktop and 320px touch: saved sixteen-tile fixtures, explicit stage/confirm,
exact staged IDs, forecast/payment, unused physical copies, capacity refill and
exact reload. These are controlled deals, not organic acquisition or fun evidence.
Prior Wildcard and readiness tests are included as regression checks.
At 320px a complete hand scrolls vertically. A further hit-test and screenshot
check verifies that the spare tiles can scroll clear of the fixed confirmation
bar; mere presence in the DOM is not treated as accessibility evidence.

Evidence directory: `/tmp/tensho-hand-subsets-LzQrEb`.

- Initial focused run: 46/46 pass; expanded focused run: 84/84 pass; further
  assisted-rule coverage: 61/61 pass across four files.
- First type-check command referenced an incorrect executable path and did not
  run. Correct `typescript/bin/tsc -b` passes; both logs are retained.
- First lint: two errors because a local function named `use` triggered the
  React Hook naming rule. Renamed it `adjustCounts`; both subsequent full lint
  runs pass with zero errors and 211 existing warnings.
- First native batch was intentionally stopped after reproducing the missing
  readiness translation: eight passed, four failed (one initial save-indicator
  timeout before fixture setup, three undefined expected translation values),
  one interrupted, twenty-five not run. Traces and report are retained.
- The next batch was stopped after eighteen fixture-save failures, one
  interrupted case and nineteen unrun cases. Restarting the development server
  eliminated these fixture failures; stale hot-reloaded modules are suspected,
  not conclusively established as the cause.
- A fresh-server batch passes 36/38, with two overall test deadlines exceeded.
  The final batch, including spare-tile hit tests, passes **38/38** without
  retries on desktop and 320px touch in English and Spanish. Desktop staging
  and phone staging/spares screenshots were visually inspected.
- The full unit run passes **1,710/1,728** across 147 files. All eighteen failures
  are test/subprocess deadlines in seven files. The unchanged affected files
  plus the corrected locale test pass **153/153** with one worker. Host load
  reached 378 during the initial run; contention is a concern, not proof of each
  failure's cause. The full failed run is not relabeled successful.
- The first build exposed an `unknown` locale-object type in the new test.
  Adding the same explicit namespace type used by adjacent checks fixes it.
  Final TypeScript and Pages-base production/PWA build pass.
- Release-workflow tests initially pass 12/13, with the subprocess deadline
  reached after the simulated atomic rebase/push. The unchanged recheck passes
  all **13/13**. No assertion or deadline was relaxed.
- Bell/hand-selection/locale focused checks also pass **56/56**.

All **20 built-production journeys** pass from strict persisted fixtures without
development imports: five hand shapes × English/Spanish × desktop/320px touch.
They verify exact stage IDs, two-step resource spending, forecast/payment,
retained spares, sixteen-tile refill, exact reload, visible/unobscured spare tiles,
no horizontal overflow and no page errors. The prior balance
matrices remain historical measurements; the new coach candidate can change
decisions, so their results are not asserted to describe this source revision.
Season/Flower requirements, broader strategy, human onboarding/fun and device
review remain open in the main implementation ledger.

## Published checkpoint

Published **v1.0.261007-3** from implementation commit
`36625bc2246e94778212db5c4e65b1950c9c4938`; built/tagged commit
`a45497ee25e01739b981b79e772eb6b7764766fb`.
[Independent CI](https://github.com/evgenyvinnik/tensho-web/actions/runs/37578359724)
passes **1,728/1,728 tests across 147 files**, all thirteen release checks, build
and Pages deployment. The public `release.json` and remote version tag match the
exact built commit. All **20 hosted journeys** pass with the same five-shape,
two-language, desktop/phone coverage and unchanged saved-run assertions. Logs
are `ci-release.log`, `ci-job.log` and `hosted.log` in the evidence directory.
The earlier local failures remain recorded above. These are isolated browser
profiles, not edits to the user's save, physical-device certification or proof
of human enjoyment. No scoring/balance change or new artwork was needed for
this correction; it uses the existing illustrated tiles and table surfaces.
