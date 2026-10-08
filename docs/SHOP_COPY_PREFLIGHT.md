# Shop inspection must not spend a random draw

October 7, 2026 local / October 8 UTC. Published and hosted-verified in
**v1.0.261008-10**. Whole-project completion remains open.

## Reproduced defect

Shop purchase/pack validation clones the Decree inventory and attempts acquisitions
to verify combined capacity. After seeded Doppelganger targeting was added, those
temporary acquisitions used the live `decreeCopies` stream. Merely rendering offer
availability, inspecting a choice or rejecting an over-capacity selection could
advance the target cursor. The later real acquisition then drew again.

The observed-build analysis policy had the same problem: detached inventories
used live randomness during hypothetical acquisition and round entry. Its output
could depend on how many alternatives had already been evaluated, and it could
change the run it was measuring.

## Implementation and limits

`DecreeSystem` accepts an explicit generator for instance-level copy selection.
Normal constructors and restoration still default to the live run generator;
no saved state or actual target-selection rule changes.

- Shop capacity validation uses an exact independent RNG fork. It may simulate
  target selection, but cannot advance the live cursor or change owned targets.
- Actual acquisition/pack claiming remains the sole owner of its committed copy
  draw. Repeated validation, failed combined selections and repeated purchases
  preserve the complete run snapshot, including RNG, currency and identity counts.
- Analysis alternatives each start their own fixed public seed-0 scenario. They
  cannot read the live seed/cursors, and alternatives do not consume each other's
  draws. This is a deterministic heuristic scenario, **not expected-value sampling
  or a prediction of the next live target**. Source order remains an intentional
  tie-breaker for equal-ranked purchases.
- Historical balance reports are not relabelled as current measurements. The
  original October 3 comparison predates seeded Doppelganger; it remains evidence
  for that historical version. New balance/fun claims require new measurements.

Previously confirmed Merchant, Rental and Cerulean Bell rules are unchanged.
No new UI or artwork is required for this correctness repair; the previously
generated Doppelganger and Supernova portraits remain in use.

## Evidence

Root: `/tmp/tensho-copy-preflight-1YBLzz`.

- Initial reproduction: **15/22 passed, seven failed**. All five new shop cases
  and both new analysis cases exposed live cursor mutation. Existing policy tests
  had passed because their copied effects were not random.
- Focused fix: **63/63 in four files**. Covers repeated purchase preflight,
  waiting-copy fulfillment, exactly one committed draw, rejected repeat purchase,
  pack selection/claim, combined-capacity failure, exact validated restoration,
  incoming/owned random-copy model purity and existing shop/Doppelganger behavior.
- Initial native browser run: **2/4**, 1.6 minutes. Desktop EN/ES timed out on
  the initial loading screen; phone EN/ES passed the full inspection/reload/
  purchase/next-round journey. The host was under substantial concurrent load,
  but that observation alone does not prove a cause for either timeout. Existing
  broader regression tests also exceeded their deadlines. No deadline was raised.
  Sequential rechecks and final regression results follow below.
- Initial full regression: **2,195/2,203**, 257.81 seconds in 178 files. Eight
  failures were deadlines: four existing save-validation cases, two CLI test
  deadlines and two spawned CLI command timeouts. Original logs are retained;
  the tests, assertions and timeout values are unchanged for the recheck.
- Sequential native browser recheck: **4/4**, 15.0 seconds, one worker and no
  retries. EN/ES desktop/320px phone journeys inspect owned Decrees, reload twice,
  purchase the controlled Doppelganger offer, verify its exact single RNG draw
  and target, reload exactly, enter the next round, verify the next target/cursor
  and actual 11/14-tile rack, then reload exactly again. No page errors.
- TypeScript, full lint (zero errors / 211 existing warnings), whitespace and
  thirteen release checks pass. The native test server is stopped; the unrelated
  pre-existing port 4173 server is untouched.
- Isolated full-suite recheck: **2,203/2,203 in 178 files**, 141.61 seconds, one
  worker, unchanged assertions/deadlines. Previously failed save-validation and
  CLI files pass 50/50 and 26/26 respectively. The prior failures remain recorded;
  a later pass is not proof of their original timing cause.
- Pages-base production build passes (432 precache entries / 70,980.08 KiB).
  Production replay passes **4/4**, 14.5 seconds, one worker and no retries, using
  the native exported save and public UI/save behavior only. No production module
  imports are used. The temporary production server is stopped after verification.

## Published release

- Implementation `b2747e07b6d9670aa8f4bc572b41dbeb11bcac6f` is on main.
  Version bot/tag/build checkout: `274cce0efd9c4815076436e2453a263e32968396`.
- [Workflow 37725810984](https://github.com/evgenyvinnik/tensho-web/actions/runs/37725810984)
  independently passes **2,203/2,203 tests in 178 files**, thirteen release checks,
  production build and Pages deployment. Build job 113143579722; deploy job
  113144237251. Local main fast-forwarded to the version bot commit.
- Public manifest, tag and runtime agree on **v1.0.261008-10**, entry
  `/tensho-web/assets/index-BtjMO-jo.js`. Evidence: `ci.log`, `ci-watch.log` and
  `provenance.json` in the evidence root.
- Hosted EN/ES desktop and 320×568 touch replays pass **4/4**, 16.5 seconds,
  one worker, zero retries and unchanged deadlines. Repeated inspection/reload,
  purchase with exactly one committed draw, next-round targeting and exact saved
  restoration pass without page errors. Evidence: `hosted.log` and
  `hosted-artifacts`. Earlier failed attempts remain recorded above.

This is a seeded-transaction consistency fix, not proof of overall balance,
human enjoyment, every device's startup performance or whole-project completion.
