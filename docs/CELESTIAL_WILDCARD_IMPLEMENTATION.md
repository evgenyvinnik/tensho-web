# Celestial Wildcard: consistent interpretation and Orb scoring

October 4, 2026. Scoped correction of the documented one-tile impersonation rule
in `GAME_SYSTEMS.md`, not completion of the wider implementation audit.

## Runtime contract

- One held tile can impersonate a regular tile type to complete an ordinary
  hand, Seven Pairs or Thirteen Orphans. Naturally complete hands are unchanged.
- Validation, preview and payout use the same temporary identities. Physical
  IDs, red flags, editions, enhancements, seals and selection order survive.
  The rack, discards and saved wall are not permanently transformed.
- Search retains deterministic first-valid behavior, not best-score search.
  It cannot invent a second Wildcard. The two-Flower acquisition gate remains.
- Shanten Clemency carries the same interpretation through its one-away
  completion. Reality Warp retains its existing precedence.
- Scoring now uses the shared Orb category mapper. Actual detector IDs
  `seven_pairs`, `kokushi` and `ittsu` previously missed the duplicate engine
  lookup, skipping Orb bonuses and most-played-hand tracking for Star Chart.
  Existing legacy aliases remain recognized. Preview does not record plays.

## Local evidence and CI gate

Local evidence directory: `/tmp/tensho-wildcard-2IhxvD`.

- Initial regressions: five failures and one pass. Unsupported special hands
  and missing effective identities reproduced before the correction.
- First focused run: 87/90 pass; three assertions used the old Japanese IDs
  instead of the detector's actual IDs. Those assertions were corrected.
- Orb regressions before the shared mapping fix: seven pass, two fail because
  using the corresponding special-hand Orb did not raise the forecast.
- Next focused run: 91/94 pass; the remaining three assertions incorrectly
  expected an empty counter list rather than twelve initialized zero counters.
  Corrected to check every count is zero. Removed an unused type import caught
  by TypeScript. All original logs are retained.
- First full run: 1,056 pass, four five-second test timeouts (DefeatSettlement
  and RackRow), plus 41 worker-start errors. All ten new engine regressions pass.
  The original `unit.log` remains; the lower-concurrency run is separate.
- First native batch was stopped after two timeouts (initial loading and
  post-play reload), one interrupted case and nine unrun cases. A truncated
  trace error is retained too. Before rechecking, forecast assertions were
  corrected to inspect the exact localized accessible value, not assume
  English separators or unabridged display text at all score magnitudes.

The browser fixtures deliberately supply near-complete hands and Flower
eligibility, then use the real Orb action, durable saves and UI staging/payment.
They do not establish organic acquisition, balance, or newcomer enjoyment.
Existing Wildcard art is reused; this checkpoint generates no new artwork.

Final native browser batch: all 12 cases pass without retries (ordinary, Seven
Pairs, Thirteen Orphans × English/Spanish × desktop/320px touch). Exact localized
forecast, no payment on staging, payout, physical discards, Orb usage counts,
wall preservation and exact reload are asserted. Desktop and phone screenshots
were inspected. TypeScript passes; lint has zero errors and 211 warnings.
All 13 release checks and the Pages-base production build pass. Existing build
warnings remain (outdated Browserslist metadata and a large JS chunk); the PWA
precache is 414 entries / 69,702.87 KiB.

The independent built-production verifier passes all 12 desktop/touch journeys
using strict saved-run fixtures, without development imports. It repeats staging,
confirmation, exact localized forecast/payment, unchanged physical discards and
wall, expected Orb state, exact reload, no horizontal document overflow and no
page errors. `verify.cjs` and `production.log` are in the evidence directory.

The lower-concurrency full run finishes with 1,674 passes and three five-second
timeouts: PackCharterAcquisition, classicBalanceCli and classicHandPolicy.
The first two-file recheck has 39 passes and one CLI timeout; the final three-file
recheck has 43 passes and four CLI timeouts, including unknown-argument rejection
before gameplay. PackCharterAcquisition and classicHandPolicy pass unchanged in
that final recheck. No test deadlines or assertions were weakened to obtain a
pass. These logs do not establish the cause of the timing failures. Independent
CI must pass the entire suite before the workflow can deploy this checkpoint.

## Remaining presentation work

October 6 follow-up: [hand interpretation UI](HAND_INTERPRETATION_UI.md) now
implements the adopted-identity disclosure and power-aware readiness described
below. The narrow Spanish Skip control remains a separate layout follow-up.
The following paragraph records the original October 4 finding.

The displayed physical tile face is intentionally not rewritten. A dedicated
adopted-identity annotation and power-aware readiness badge remain useful UI
follow-ups: the natural-shape badge can still say Tenpai while the Decree enables
declaration. The narrow Spanish Skip control also wraps awkwardly. Neither is
evidence that scoring is broken, but these checks do not claim polished newcomer
explanation or perfect small-screen layout.

## Published release

- Implementation: `c98d3fc45d8e149dc9f55ed848cf1784b23feaf0`.
- Published version: **v1.0.261004-10**.
- Built commit/tag/public manifest: `042fdf51f4332679fe3416fea53266c18724db15`.
- [Independent CI](https://github.com/evgenyvinnik/tensho-web/actions/runs/37217050324)
  passes all **1,677 tests in 144 files**, all 13 release checks, build and Pages
  deployment. `ci.log` retains the complete result. The local timing failures
  above are not erased by this successful independent run.
- Existing workflow annotations warn about Node-20-based Pages actions being
  forced onto Node 24 and the upcoming Ubuntu runner migration. They are not
  deployment failures, and this checkpoint does not update those dependencies.
- All **12 hosted journeys pass** against the public Pages site, repeating the
  built-production assertions with isolated saved runs. `hosted.log` and hosted
  screenshots retain the evidence. Owned local preview servers were stopped;
  the pre-existing server on port 4173 was left untouched.
