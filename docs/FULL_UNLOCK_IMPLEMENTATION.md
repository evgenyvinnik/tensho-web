# Full Unlock profile option

Requirement: [GAME_MECHANICS.md, Full Unlock](GAME_MECHANICS.md#unlock-vs-discovery)
allows unlocking all content at the cost of achievement tracking for that profile.
Archive-only `unlockAll()` did not implement that requirement.

## Player behavior

- Settings has an explicit Full Unlock action with a confirmation. Cancel is
  initially focused and makes no changes. The warning explains that existing
  achievements stay, new achievement progress stops, prices and run prerequisites
  remain, and returning to earned progression requires Reset All Progress.
- A persistent `fullUnlockEnabled` flag belongs to the progression profile, not
  ordinary preferences. Old profiles without the flag stay in earned mode.
  Archive discovery alone never enables it.
- All authored unlock records and Archive entries become available; all eight
  playable tables and eight valid difficulty tiers can be selected. No victories,
  completed stakes or lifetime statistics are fabricated. Archive descriptions
  are revealed intentionally, not treated as achievement discoveries.
- Charter upgrades still require a current-run base, cannot be acquired twice,
  and must be paid for. Inventory limits, rarity/acquisition channels and other
  run rules are not disabled.
- Achievement awards, per-achievement progress, achievement statistics and new
  notification queries stop at the store boundary. Existing awards are retained.
  Ordinary run statistics continue to support game behavior and history.
- Settings and Achievements display the disabled-tracking status. The table
  selector no longer tells this profile to win a stake merely to unlock the next.
- Reload reconciles full access against the current catalog, including additions.
  Only the explicit full progress reset returns to earned mode and removes these
  unlocks. Resetting preferences, tutorials or the achievement store alone does not.

## Persistence and safety

Activation snapshots the three touched stores and their exact storage values.
It enables the profile flag before reconciling the Archive so no collection
achievement can be awarded from the operation. On failure it attempts rollback
of memory and persistence, verifies the outcome, and reports a save error rather
than success. The player is asked to reload/check the mode after an incomplete
change. Unrelated origin data, preferences and active games are not reset by
activation. A failed full-progress reset restores the Full Unlock flag alongside
the other profile state.

This is a browser-local profile option, not an account system, server-side
anti-cheat feature or multi-profile manager. Internal test/debug store setters
are not public player controls.

## Verification ledger

- Initial seven tests: six failed because the activation API did not exist;
  one failed because the global test storage stub did not retain values.
- After implementation: two hydration tests exposed that same non-persisting
  fixture; using an explicit Map-backed storage fixture fixed them. The focused
  set passed **62/62** across Full Unlock, reset, Charter eligibility and locales.
- Expanded Full Unlock set passed **9/9**, including all catalog unlocks,
  tables/valid stakes, achievement suppression/preservation, current-run Charter
  bases, real serialization/rehydration, legacy profiles, full vs partial resets,
  storage-read/write failure, incomplete rollback and failed reset restoration.
  Failure-injection mocks retain their original implementation rather than
  recursively calling the replaced spy.
- Strict TypeScript initially found an optional storage-key type and a locale
  fixture type; both were corrected. Strict TypeScript and targeted lint passed
  before browser verification. No production debug bypass was added.
- The first full regression finished **1,137 passes / 2 failures** in 103 files:
  existing ScoreLocalization and PackOpeningModal cases exceeded their unchanged
  five-second deadlines. Those two files plus Full Unlock passed **29/29** in an
  unchanged isolated run. The timeout cause is not established.
- Browser verification exposed an existing achievement hydration bug: JSON turns
  the unset `Infinity` fastest-win sentinel into `null`, which could compare as a
  zero-round win. A new round-trip regression failed before the fix. Hydration
  now restores the sentinel and preserves finite records; all **11/11** Full
  Unlock unit tests passed. Existing awards are not revoked.
- The first browser invocation could not start because another project occupied
  the default port. An isolated-port attempt was interrupted and has no reliable
  final total. The subsequent complete run retained **8 passes / 4 failures**:
  the four main journeys incorrectly sought a button for the stake radio control.
  Correcting that test selector (not the UI) produced **12/12 passes**, without
  increasing deadlines or retries. Coverage includes English/Spanish desktop and
  320px touch consent, cancellation, persistence, tables/stakes, paid acquisition,
  frozen achievements, reset, save failures and existing reset safeguards.
- Spanish desktop/touch confirmation and touch Settings/table screenshots were
  reviewed. The new text fits; existing English stake names/descriptions remain
  a separate localization gap.
- The next full regression retained **1,136 passes / 5 timeouts** across 103
  files (302.52s): two balance CLI cases and one each in BeginnerGuide, PackCard
  and ShopHeader. Every failure exceeded the existing five-second deadline;
  all 11 feature tests passed. Host load was exceptionally high (one-minute
  load average observed at 209.89), but causation is not established. A final
  unchanged single-worker run passed **1,141/1,141 in all 103 files** (154.21s).
  All **13/13 release-workflow checks** also passed. Fresh strict TypeScript,
  targeted lint and the Pages-base production/PWA build passed: 343 modules,
  270 precache entries / 67,771.60 KiB. Existing large-chunk and stale Browserslist
  data warnings remain; no warning threshold was changed.

Consent, consequences, active-mode notice and save-error text are supplied in all
13 locales. Automated text completeness is not native-speaker review.
No new bitmap is necessary for this Settings control; previously generated game
portraits remain intact. This checkpoint does not establish whole-project completion.

## Publication

Published as **v1.0.260923-5**, code checkpoint
`beb2ce406ba4bbb90ce76c15201e3d658c8b3a3d`, built/tagged commit
`6c08959667d567c4b3abd7e5f7ba3c3ccb2f9f38`.
[Actions run 35814823613](https://github.com/evgenyvinnik/tensho-web/actions/runs/35814823613)
independently passed all 1,141 tests in 103 files, the production/PWA build,
provenance checks and Pages deployment. The public release manifest and remote
tag match. Fresh hosted 1280×800 and 320×740 touch contexts passed consent/cancel,
activation/reload, Table Loop pair placement/refill/reload and Spanish Classic
loading, with no JavaScript page errors. These used isolated profiles, not the
user's saved game. Artifacts and script: `/tmp/tensho-full-unlock-zHZSbP/`.
Installed-PWA upgrades and physical-device behavior remain unverified.
