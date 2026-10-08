# Save-aware screen-download recovery

October 7, 2026 local / October 8 UTC. Implementation checkpoint; not whole-project
completion or proof of the cause of the earlier hosted startup failure.

## Evidence and decision

The v1.0.261008-4 ownership verification recorded a real failed download of
GameplayScreen before play readiness. The exact asset subsequently returned 200,
and the unchanged traced recheck passed. There was no original network trace:
CDN propagation, offline-cache traffic and other network causes remain hypotheses.
See [the retained original evidence](RUN_OWNERSHIP_IMPLEMENTATION.md).

A separate Chromium probe aborted the first dynamic import of a small script,
then allowed subsequent requests. Three imports of the identical URL all rejected;
only **one network request** occurred. A retry of the same import is therefore
not sufficient in that browser. [React caches lazy-loader promises](https://react.dev/reference/react/lazy),
and [MDN distinguishes module loading from evaluation failures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import).
The latter permits retries of loading failures; it does not establish that this
observed browser will refetch. [Vite documents stale deployment chunk failures](https://vite.dev/guide/build)
as another possible cause, not a diagnosis of our earlier incident.

## Implemented contract

- All nine existing module-scope screen loaders use `lazyScreen`. Successful
  loading and component identity are unchanged. Only recognized browser/Vite
  module/CSS download errors qualify; arbitrary application errors retain the
  existing error boundary.
- One automatic document reload is allowed per **build version, full URL and
  tab session**. The session marker is reserved before asynchronous saves, so
  concurrent errors and subsequent documents cannot form a reload loop.
- Every loaded mode must pass its existing reload/save guard first. Failed or
  throwing saves retain the live tab. Session-storage access/read/write denial
  disables automatic recovery instead of permitting an unbounded reload.
- Navigation changed while saving is not interrupted. Successful recovery keeps
  the existing localized, reduced-motion-safe loading view until navigation.
- After exhaustion or denial, a dedicated localized recovery screen offers
  **Save and reload** and **Save and go to menu**. Each explicit attempt checks
  saves again; errors re-enable actions, pending saves suppress duplicate clicks,
  and leaving the screen prevents a delayed navigation.
- The heading receives focus; status is announced; technical detail is optional.
  Thirteen locales have authored copy. The layout can scroll on short screens,
  has large vertically stacked actions, and uses the existing palette. A network
  recovery screen does not need another generated illustration.
- No run reset, cache-busted duplicate module, worker activation, update-consent
  bypass, or online telemetry is introduced. A persistent connection problem or
  old installed cache can still require user action; recovery is not guaranteed.

## Offline boundary and retained test failure

The first production browser batch passed **20/22**: all twelve new recovery
scenarios and eight route-loading cases passed. Both older offline-installation
cases timed out waiting for `navigator.serviceWorker.controller` on the initial
document. A diagnostic confirmed an **activated worker and populated precache**,
but no controller. The generated prompt-mode worker does not call `clients.claim`;
first registration takes control on the next page load, as documented by
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim).

The old test predates the save-aware worker-registration change. It now awaits
actual activation with the same 60-second installation deadline, reloads, asserts
control, and then verifies offline routes, art, guide pages and saved play. This
matches the existing two-release upgrade harness. No runtime worker behavior,
offline assertion, deadline or automatic test retry was changed. Original traces
and screenshots remain under `browser-first-artifacts`.

The complete offline promise remains: **430 precache entries / approximately
69.2 MiB** in this build. Installation cost remains separate optimization work;
it is not established as the cause of the hosted fetch failure.

## Verification

Evidence directory: `/tmp/tensho-screen-recovery-Z3zZ03`.

- New production journeys use real browser-aborted chunk requests, not a mocked
  React loader: English/Spanish × desktop/320×568 touch × transient failure,
  persistent failure and blocked saving. They count actual document requests to
  prove bounded recovery, then compare the saved journal exactly after reload.
- Blocked-save cases first commit a real exchange that cannot reach disk. The
  original document survives automatic and manual recovery attempts; restoring
  storage then saves that second action before a successful reload.
- Unit coverage includes session-storage denial, concurrency, URL changes,
  ordinary errors, guard failures, component unmount, navigation exceptions,
  duplicate clicks and all thirteen authored locale namespaces.
- Final full regression passes **2,098/2,098 in 171 files** (43.4 seconds),
  with two workers and original deadlines. New unit coverage is 18 controller
  and 20 component/locale cases. No focused subset replaces this full pass.
- Final production browser recheck passes **22/22**, 42.2 seconds, with one
  worker, no retries, no flakes and no skips. All twelve fault-injected recovery
  and ten existing route/offline checks pass. English and Spanish short-phone
  error captures were visually inspected; long content scrolls without clipping
  or horizontal overflow. `browser-final.json` and `browser-final-artifacts`
  retain evidence separately from the first failed batch.
- Strict TypeScript and Pages-base production/PWA build pass. ESLint has zero
  errors and 211 existing warnings. All **13/13 release-workflow checks** pass.
- Publication and hosted verification must still complete before claiming this
  checkpoint is live.

Remaining work includes copy/resource lifecycles, unresolved item wording,
strategy/balance and observed newcomer play, physical-device/accessibility and
native-language review, plus offline-installation size. Existing confirmed
Merchant, Rental and Cerulean Bell decisions are unchanged.
