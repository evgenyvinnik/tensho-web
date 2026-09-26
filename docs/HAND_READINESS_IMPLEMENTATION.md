# Hand-readiness calculation

September 26, 2026 follow-up to the gameplay teaching audit.

## Corrected behavior

Classic's readiness badge uses `ShantenCalculator`. Previously its purported
minimum-distance calculation extracted sequences greedily before triplets and
partial groups. For example, `111234m 55p 678s EE` is waiting on either `5p` or
East, but the badge counted it as one step farther away. The same failure could
occur with declared melds.

The calculator now considers alternative groupings within each suit, memoizes
their possible meld/partial counts, and combines those possibilities across
suits. A tile can also remain unused. Honors cannot form sequences. The head
pair is still tried separately, and declared melds reduce the required groups.

Completion is checked with the standard-form parser, not the validator that
also accepts special forms. Seven Pairs and Thirteen Orphans retain their own
distances and identities. A winning subset plus unrelated surplus tiles no
longer makes the entire rack display as complete.
Underfilled racks also retain the minimum number of missing tiles: four melds
with neither head tile cannot be called ready after only one more draw.

This changes a hint, not legal plays, scoring, draws, resource costs, or balance.
The badge still conceals readiness when any rack tile is face-down. It remains
an ordinary-grammar structural hint: it does not account for special Decree
grammar, hidden wall availability, or the probability of drawing a wait. No new
four-copy restriction or deck rule is introduced by this change.

## Regression evidence

- A temporary copy of the pre-change implementation failed five of nine tests:
  overlapping groups, the declared-meld variation, two special-form cases, and
  surplus-rack completion. The other four passed. Temporary baseline files are
  diagnostic only and are not intended for the repository.
- The corrected implementation passed all nine targeted cases, including 24
  generated complete hands, all 336 single-tile removals, reversed input order,
  and preservation of input tiles. That initial combined invocation still
  exited unsuccessfully because the separate baseline worker failed to start;
  it is not a successful full verification run.
- An earlier invocation also failed before running any tests (worker startup
  timeout). A Node-only baseline attempt failed because the shared test setup
  requires DOM globals. The actual baseline evidence above uses the normal
  jsdom configuration. No test timeout or retry limit was widened.
- Final full regression: **1,340/1,340 tests in 114 files passed**, including
  all ten readiness tests (178.42 seconds, two workers). The additional case
  covers an underfilled rack missing both head tiles. Report retained locally
  at `/tmp/tensho-hand-readiness-units.json`.
- Strict TypeScript, targeted lint, and all **13 release/versioning checks**
  passed. The Pages-base production build passed (358 modules; 268 PWA entries,
  67,861.56 KiB). Existing large-chunk and stale-Browserslist warnings remain.
- Initial native browser verification did **not pass**: the 12-case desktop/touch
  batch was stopped after its desktop cases produced **1 pass and 5 failures**;
  all six mobile cases did not run. The runner exited 130 after cleanup, and
  the owned development server was stopped before further repository edits.
  Artifacts are retained at `/tmp/tensho-hand-readiness-browser`.
- The new desktop readiness test expired during navigation before its first
  gameplay assertion. The unchanged English structure test remained on
  `Loading...`; the Spanish structure test reached gameplay, then timed out
  during a screenshot. Two resource checks also hit test/teardown deadlines;
  the bonus-short resource check passed. Several trace archives were truncated
  by teardown failures; surviving snapshots and two readable traces remain.
  The inspected locked-tile screenshot shows the expected disabled Redraw
  control, but that does not turn the timed-out test into a pass.
- Very high host load was observed during these attempts, but it is not a
  proven explanation for all failures. No deadline/assertion was relaxed and
  no automatic browser retry was added. That failed attempt was not used as
  publication evidence.
- The next isolated desktop check reached gameplay and exposed an incorrect
  test locator: it searched `.game-play-area` (staging), while the screenshot
  and source place the visible `Tenpai` badge inside `[data-play-zone="hand"]`.
  The locator was corrected to that rack container without changing expected
  text, hidden-information assertions, or deadlines. This explains that
  isolated failure, not the earlier navigation/teardown timeouts. Its artifacts
  are retained at `/tmp/tensho-hand-readiness-isolated`.
- Final corrected browser batch: **12/12 passed without retries** (1.3 minutes),
  using the existing deadlines and one worker. Desktop and 320px touch checks
  cover the readiness badge, native tile staging, hidden-information masking,
  English/Spanish structure forecasts and actual payments, and resource
  exchanges/refusals. Artifacts: `/tmp/tensho-hand-readiness-corrected`.
  This closes the checkpoint's targeted verification gate; the older timeout
  causes are still unresolved rather than retrospectively declared passes.

## Publication

Local verification is complete for this checkpoint. Main publication, independent
CI, and hosted verification are pending; the live release remains v1.0.260926-2.

These checks do not prove that the game is fun, that higher-distance advice is
optimal under every altered rule, or that the broader implementation audit is
complete.
