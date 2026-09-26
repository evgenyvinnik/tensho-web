# Save-aware application updates

Status: local implementation verified; publication and hosted verification pending.

## Contract

- An available update is offered in the menu and settings, not as a native
  confirmation that interrupts a hand. Opening the offer is explicit. Later
  dismisses it without losing the ability to reopen it.
- Save and update checks every loaded mode. Classic uses its authoritative
  persistence coordinator. Table Loop retries only a dirty action journal;
  retrying does not replay actions, award rewards, or replace an untouched
  invalid save with a fresh run.
- A failed save leaves the current document and waiting worker in place. The
  localized error permits another attempt. Each retry checks saves again.
- The waiting worker refuses activation while another window under this app's
  deployment scope is open. Closing the other window permits a retry. Windows
  belonging to other apps on the same origin do not block it.
- Each document opts into its own reload. A controller change triggered
  elsewhere does not force a reload in the new client implementation.
- Table Loop warns before leaving a document with an unsaved committed journal,
  complementing the existing Classic warning. Neither warning guarantees that
  a browser or operating system will preserve a closing process.
- All 13 locales contain the offer, consent, busy, failed-save, failed-update and
  other-window messages. The existing ornamental dialog is reused; this change
  does not require new raster artwork or change the established art style.

## Worker and cache boundaries

`main.tsx` registers the production worker directly, with the deployment base as
its scope. Automatic registration injection is disabled. The generated worker
imports `public/sw-update.js`, which checks scoped clients before calling
`skipWaiting`. Workbox prompt mode and the complete offline precache remain.

This avoids the prior plugin client's unconditional reload listener. Activating
a new worker can also delete obsolete precache entries, including lazy chunks
needed by another tab. The worker-side window check therefore protects more
than unsaved state. See the primary [Workbox update lifecycle guidance](https://developer.chrome.com/docs/workbox/handling-service-worker-updates).

The check is not an atomic lock against a brand-new tab opening during
activation. Nor does it establish Table Loop cross-tab write ownership,
crash-atomic multi-store persistence, or physical-device/Safari behavior. Already
running old releases retain their old update code until they reload; they cannot
retroactively acquire the new save guards. Do not claim all installed historical
versions have been certified merely from two builds of the new implementation.

## Verification

- Initial focused regression: **58/58 checks in six files**. Covers Table Loop
  journal failure/retry, unchanged damaged saves, consent/dismissal, repeated
  clicks, Classic/Table guard composition, worker refusals, activation errors,
  timer cleanup, passive sibling changes, dialog retry, and all-locale keys.
- Strict TypeScript and targeted ESLint passed before the browser phase.
- Two production builds at `/tensho-web/`, with distinct `pwa-before` and
  `pwa-after` versions, passed. Each retains **273 precache entries / 68,260.63
  KiB**. Large-chunk and stale-Browserslist warnings remain. This is not a
  performance optimization or a deployed release.
- The first two browser attempts stopped before gameplay at the first controlled
  reload. The harness used an asynchronous `waitForFunction` predicate, which
  this Playwright version treats as a truthy Promise before the state query
  resolves. Merely requiring `active.state === 'activated'` did not repair that
  polling mistake. The harness now uses awaited `expect.poll` for asynchronous
  service-worker inventory, with unchanged deadlines. These failures are not
  counted as successful update checks.
- Evidence root: `/tmp/tensho-pwa-upgrade-2uCv6H/`; initial traces are retained in
  `initial-browser/` and `activated-browser/`. Final browser and full regression
  results must be recorded after they finish.
- The first awaited-polling attempt then hit the existing five-second menu
  startup deadline (`Loading...`, before gameplay). Its cause remains unproven;
  `polled-browser/` retains that trace. Subsequent tracing records API timing
  without duplicating the entire offline cache; explicit UI screenshots remain.
- The next attempt reached the other-window refusal but failed an early Classic
  snapshot assertion: Settings imports `resetProgress`, which initializes Table
  Loop's wall and advances the shared tile-ID allocator from 0 to 136. The core
  allocator explicitly remains monotonic across live modes. The harness now
  verifies every other field exactly and this counter monotonically between
  play and Settings; the actual pre-/post-upgrade comparison remains exact,
  including the allocator. `api-trace-browser/` retains the failed assertion.
- Final two-release browser run: **8/8 scenarios passed without retries** in
  `allocator-browser/`: Classic and Table Loop × desktop and 320×568 touch ×
  initially successful and deliberately failed saves. All eight verified a
  passive offer, Later/reopen, the other-window refusal, successful retry after
  closing it, exact durable state across activation, an offline first visit to
  Codex, and offline gameplay resumption. No JavaScript page errors or unexpected
  native dialogs were reported. Desktop and short-phone error-dialog screenshots
  were inspected; both actions and the full English message fit within the frame.
  This verifies two builds of the new client, not migration from every old client
  or native-speaker review of all localized layouts.

The reusable native harness is `scripts/verify-pwa-updates.mjs`. It takes absolute
before/after production directories and an artifact directory, hosts them on an
ephemeral loopback origin, and uses fresh Chromium desktop/touch profiles. It
must prove actual staging/placement, failed-save retention and recovery,
other-window refusal, exact durable state after the upgrade, and offline route
loading/resumption. No user browser profile or public deployment is modified by
the harness.

Whole-project completion, pending mechanics choices, human enjoyment, native
translation review and physical-device testing remain open.

## Verification history and publication gate

The full one-worker regression run was intentionally interrupted (exit 130) to
repair the additional storage-recovery defect below. Its reported results
included **ten failures**: six balance CLI cases, three snapshot-validation
cases, and the English remaining-score accessibility case. Pending Omens, table
selection and settled-score display files passed before interruption. No complete
JSON report was produced, and no full-suite success is claimed. The machine
reported load averages around 80 during that run and above 400 during the
subsequent focused check. This is not proof of the cause of each failure. No
deadlines have been widened; do not count isolated passes as a full-suite pass.
Nothing from this checkpoint has been committed, pushed or deployed yet.

The additional edge was reproduced by two new tests: initial access returning
null or throwing still left `retrySave()` false after access returned. The
baseline test run passed **8/10**, failing both new recovery cases. Table Loop
now accepts a storage provider and resolves it again for saves and explicit
resets. Browser access defaults to that provider rather than capturing the
initial result. The tests require the exact live state object and single starter
action to survive recovery, and a failed reset to preserve its state and disk.
The expanded focused run ended after **18 passing tests and five worker-startup
errors**, not a passing suite (429.85 seconds). A single-thread attempt of the
storage file also failed to start its worker: **zero tests ran**, one error,
60.55 seconds. Its report is `recovery-thread-units.json` in the evidence root.
Do not publish until the normal regression gates are resolved.

A supplemental single-process diagnostic, `probe-storage-recovery.ts` in the
same evidence directory, imports the real store with in-memory storage and a
minimal window stub. Its first invocation lacked Vite's injected `BASE_URL` and
failed at module initialization. With `BASE_URL=/tensho-web/ bun` (1.3.3), both
initial-null and initial-throw cases passed recovery, exact live-state identity,
single-action persistence, replay-free repeated retry, failed-reset retention,
and successful reset after access returned. This is supplemental logic evidence,
not a substitute for Vitest, DOM behavior, browser upgrade or release gates.

After host load fell substantially, the normal fork-worker focused run passed
**72/72 tests across seven files** (91.70 seconds), including both recovery cases,
reset protection, notice behavior and locale contracts. The prior worker-startup
failures remain failures; they are not silently counted as passes. TypeScript,
script syntax and whitespace checks of that provider change also completed
successfully after the existing compiler process was allowed to finish.

A review then found that native registration had inadvertently started before
page load, unlike the replaced Workbox client's default non-immediate mode. A
new test reproduced this (**10 passed / 1 failed**). Registration now waits for
`load` when the document is not complete, and registers only once. The expanded
normal focused suite passed **73/73 in seven files** (70.98 seconds). Reports:
`focused-recovery.json` and `focused-load-gate.json` in the evidence directory.

The native harness now additionally includes initial getter-denial scenarios for
Table Loop on desktop and touch, with error assertions scoped to the update
dialog. The candidate/build/run status below supersedes the earlier eight-case
run, which did not cover initial getter denial. Full regression and publication
remain pending.

Latest candidate: targeted ESLint and strict TypeScript passed. Fresh
`before-recovery/` and `after-recovery/` production builds (including both the
storage-provider and page-load fixes) passed, each with **273 precache entries /
68,260.81 KiB**. Existing chunk-size and Browserslist warnings remain. The expanded
ten-scenario browser run under `recovery-browser/` ended with exit 1. The first
Classic desktop saved-run scenario passed; the next write-failure scenario
timed out during a Settings button click after 30 seconds. The failure capture
already showed Settings, with no JavaScript page errors. This is not a passing
interaction or proof of its failure's cause; the remaining scenarios were not
attempted. Its trace and screenshot are retained.

A subsequent filtered `TENSHO_PWA_CASE=access-failure` run under
`access-recovery-browser/` also ended with exit 1. The desktop case remained on
the initial menu's `Loading...` view past the existing five-second readiness
deadline, before the storage-denial fixture was activated. No JavaScript page
errors were reported. Neither new initial-access-denial scenario was verified;
the touch case was not attempted. Filtering reports selected-case counts and
does not constitute full-suite verification. No deadlines were widened. A later
host check reported load averages of 397.31 / 210.40 / 155.91, which is context,
not an established cause. Full regression and publication remain gated.

The next isolated desktop getter-denial attempt (`startup-diagnostic-browser/`)
also failed at initial menu readiness, before denial was applied. Added bounded
request/console logging captured **11 pending tile-image requests**, completed
menu JavaScript requests, and no page errors. Source inspection found that
`MenuScreen` withheld every control behind `Promise.all` of menu artwork and the
entire tile catalog. A never-finishing image therefore prevented navigation,
saved-run recovery and the update offer indefinitely. A new component regression
reproduced the missing Play button with unresolved artwork promises. Its other
baseline case encountered both a five-second timeout and an incomplete animation
test double; neither is counted as a product regression or passing evidence.

The menu now renders while those same images warm in the background, keeping its
existing artwork, entrance animations and offline precache. The unused loading
gate and delayed state-update timer are removed. The follow-up component run
passed the rejected-artwork case; the pending-artwork case hit the unchanged
five-second test deadline (12.443 seconds), without a reported missing-control
assertion. This is **1/2**, not a passing suite; `menu-nonblocking-units.json`
retains the result. No browser success is yet claimed for this source change.
The existing `before-recovery/` and `after-recovery/` builds predate this menu fix
and must not be used to claim verification of it.

Type checking caught four uses of Playwright's `exact` option in the new
Testing Library test. Those unsupported options were removed; string accessible
names already match exactly in Testing Library. The subsequent normal-worker
menu run passed **2/2** in 5.08 seconds, with no deadline changes
(`menu-nonblocking-recheck.json`). This proves nonblocking menu/navigation
semantics with unresolved or failed artwork; the test's animation double does
not prove native visual timing. Fresh targeted ESLint, strict TypeScript, script
syntax and whitespace checks passed. The updated `before-menu/` and `after-menu/`
production builds passed (23.30 and 16.37 seconds), each retaining **273 precache
entries / 68,259.97 KiB**, with the existing chunk-size/Browserslist warnings.
The initial getter-denial run against those immutable builds in
`menu-access-browser/` passed startup, worker control, real Table Loop placement,
and waiting-update discovery. Returning to the menu then hit the application's
error boundary: the optional tutorial-completion hook read localStorage during
render without handling denied access. The run ended with exit 1 waiting for
the now-unreachable update button; the screenshot and console diagnostics prove
a render failure even though React Router caught it and `pageerror` was empty.
The touch case was not attempted. This is not a passing upgrade check.

Three hook regressions reproduced getter denial, quota failure on completion,
and failed removal on reset (`tutorial-storage-baseline.json`, **0/3**). The menu
tutorial hook now retains its in-memory preference when those storage operations
fail and retries writes/removals on later explicit actions. Run data is untouched;
this best-effort tutorial preference is not a substitute for the strict run-save
guards. Expanded focused verification finished **77/78 in nine files** (166.13
seconds): all three tutorial regressions passed, along with update consent,
worker, journal, reset and locale checks. The pending-artwork menu case again
hit its original five-second deadline (36.936 seconds), despite the earlier
standalone 2/2 pass. No assertions or deadlines were weakened. The report is
`focused-tutorial-recovery.json`. The menu builds above predate this tutorial
fix; refreshed static/build checks are running. Full regression and publication
remain gated.

Post-tutorial-fix static checks completed successfully: targeted lint (one
existing mixed component/hook fast-refresh warning), strict TypeScript, harness
syntax and whitespace. Fresh `before-tutorial/` and `after-tutorial/` builds
passed (17.24 and 11.50 seconds), each with **273 precache entries / 68,260.02
KiB**. The unchanged chunk-size and Browserslist warnings remain. The complete
ten-case native upgrade run completed **10/10 without retries** in
`tutorial-recovery-browser/` (exit 0; `caseFilter: null`, `completeSuite: true`).
Both desktop and 320×568 touch passed Classic/Table Loop saved and write-failure
cases, plus initial getter-denial recovery for Table Loop. Every case verified
real play, passive consent, Later/reopen, refusal with another app tab open,
exact durable state across activation, unvisited offline Codex loading, and
offline gameplay continuation. The original menu crash is now covered natively
on both viewports. No page errors or unexpected native dialogs were reported.
The short-phone retry dialog and resumed Table Loop captures were inspected;
the complete English update message and both actions fit the dialog.

The complete normal single-worker unit regression finished with exit 1:
**1,397/1,407 tests passed across 121 files** in 999.60 seconds. All ten failures
reported the existing **5,000 ms test deadline**, not assertion mismatches:
the complete live-boss snapshot case, paired balance CLI resources, zero-selection
redraw availability, hidden River Tax portrait, three table-selection dialog
cases, nonblocking menu artwork, progressive-hint entry, and passive update
consent. Eight files failed and 113 passed. The complete report is
`full-regression-tutorial.json`. This remains a failed full suite; no subset or
browser pass replaces it. Release-workflow checks chained after the command
were skipped and must be run separately.

Observed host load fell from 83.14 to 32.52 during this run; the 16 GB machine
reported over 16 GB of swap in use earlier. These observations provide resource
context, not a conclusive cause for every timeout. A non-deploying CI branch has
been proposed to the user as an independent verification route; no branch,
workflow, commit, push or deployment has been created for that proposal.
Publication still requires the full regression.

The independent release-workflow checks then passed **13/13** (23.36 seconds),
including atomic branch/tag publication, conflicting upstream changes and
provenance. This does not publish anything. A fresh resource check reported
load **16.23 / 47.45 / 59.67** and 35% system-wide free memory, compared with the
earlier 83.14 one-minute load and 26% free memory. Given that observed change,
one new complete single-worker regression is running with identical source and
unchanged deadlines (`full-regression-recovered-host.json`). The first failed
full report remains retained; no green full-suite result is claimed yet.

The fresh complete run then passed **1,407/1,407 tests in 121 files** in 178.88
seconds (exit 0), with the same source, worker count, assertions and deadlines.
`full-regression-recovered-host.json` retains the complete passing report. This
is a complete regression pass, not a combination of filtered runs. Together
with the **10/10 native upgrade scenarios**, **13/13 release checks**, strict
TypeScript, targeted lint and two successful production/PWA builds above, the
local publication gate is satisfied. No temporary CI branch is needed. The
earlier failures and limits remain recorded; remote CI, deployed provenance and
hosted gameplay verification must still complete before claiming publication.

The unchanged earlier failure files were rechecked together: **86/89 passed**
(138.40 seconds). All 22 balance-command and 17 score-localization checks passed.
Three snapshot-validation cases hit their existing **5,000 ms** deadlines:
Ghost Parlor's complete stake sweep, the complete catalog/provenance case, and
all live boss activations. Their errors were test timeouts, not assertion
mismatches. No deadlines or assertions were changed. The completed report is
`prior-failures-recheck.json`; these remain open failures, not a full-suite pass.
