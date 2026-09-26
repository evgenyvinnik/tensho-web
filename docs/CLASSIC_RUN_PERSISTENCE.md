# Classic run persistence

Updated: September 26, 2026.

**Status: Classic autosave/resume is deployed as v1.0.260926-1.**
The existing saved table/difficulty preference and Table Loop action journal remain
separate features. Classic now has its own validated checkpoint and recovery UI.

## Published application checkpoint

[Actions run 36263529989](https://github.com/evgenyvinnik/tensho-web/actions/runs/36263529989)
independently passed **1,323/1,323 tests in 112 files**, **13/13 release checks**,
the production/PWA build, provenance validation and Pages deployment.

- Implementation commit: `a4fc685567da60b7cb1a1869d172708a7a978ce4`.
- Built/tagged commit: `aa5563779a3988c841f9554d26fdaf0848434117`.
- Public `release.json` and remote `v1.0.260926-1` tag match that commit.
- Fresh 1280×800 desktop and 320×568 touch contexts passed a real Classic play,
  exact authoritative snapshot comparison after reload, Save and leave, menu
  reload and Resume. Table Loop pair placement/refill/reload also passed, with
  no JavaScript page errors. Public FAQ save/recovery copy was verified.
- Hosted script/screenshots: `/tmp/tensho-classic-release-jNF9iN/`.
- Main includes the workflow version commit. This evidence-only follow-up uses
  `[skip ci]`; it does not trigger another deployment version.
- CI reported deprecation notices for Node-20-based Pages actions (forced onto
  Node 24) and the upcoming Ubuntu runner image migration; neither failed the run.

## Application integration

- One application-lifetime coordinator saves settled actions, handles storage and
  visibility events, and warns before closing with unsaved progress. The PWA update
  prompt flushes a live Classic run before requesting reload; failed saves cancel
  that update attempt. This is not proof of installed-PWA upgrade/crash safety.
- The illustrated menu card resumes the captured table, stake and actual phase.
  Direct play/shop/result URLs restore before mounting the screen. Menu visits and
  next-run setup changes do not overwrite the checkpoint. StrictMode entry starts
  at most one run. New Run confirms replacement against the observed record.
- Exit is now **Save and leave**. Return to Menu from results keeps the victory/
  Endless decision resumable. The menu can download an exact backup or explicitly
  discard a run. Saving/error/confirmation copy is supplied in all thirteen locales;
  native-speaker review remains open. Existing generated table art illustrates the
  card; this feature does not need another bitmap asset.
- Native Web Locks protect owner/revision changes. A superseded tab's game controls
  stay paused through subsequent read/claim failures, until a successful resume.
  Retry after a failed initial save retains the original replacement consent and
  cannot silently replace a newer record from another tab.
- Full reset includes Classic storage with rollback; only durable success cancels
  pending writes and forgets its lease. Tutorial-only reset leaves the run intact.
  Failed reset retains the live engine and the ability to save it afterward.
- A browser reload exposed an existing progression hydration defect: JSON turns
  unset `fastestWinRounds = Infinity` into `null`, preventing the first real win
  from establishing a record. The progression codec now restores the sentinel,
  matching the earlier achievement-store fix. The focused regression reproduced
  **10 passed / 1 failed** before repair; the corrected three-file run passed
  **33/33**. The unchanged browser comparisons include all profile sets and counters.

Application verification so far:

- Final September 26 regression: **1,323/1,323 tests in 112 files**, 27.88
  seconds, two workers. **30/30 desktop/touch browser checks** and **2/2
  ornamental-corner checks at 320px** passed without retries. The Spanish
  Resume card and Save and leave screenshots were also inspected. Strict
  TypeScript and the Pages-base production/PWA build passed: 357 modules,
  267 precache entries (67,842.41 KiB). Existing chunk-size/Browserslist warnings
  remain. Browser artifacts: `/tmp/tensho-classic-browser-fixed` and
  `/tmp/tensho-classic-frame-final`.
- Final release checks passed **13/13**. Full ESLint completed with **zero
  errors / 211 existing warnings**; `git diff --check` passed.
- Cross-tab continuation reproduced stale profile caches overwriting the newer
  tab's lifetime score/tile counters. Explicit resume/new-run transitions now
  refresh the five persisted profile stores before another action. Failed reads
  or hydration keep the old engine blocked. Twelve application tests and native
  desktop/touch handoff checks include profile equality and another real play.
  This does not make concurrent multi-key profile writes crash-atomic.
- Snapshot comparisons caught forecasts mutating Moonlit Seal's saved scaling
  value. Two regressions failed before repair; preview context now suppresses
  that mutation while real scoring still updates it. The corrected focused
  scoring/orchestrator/snapshot suite passed **101/101**.
- Repeated result-fixture errors initially reported destroyed navigation context.
  Protocol tracing showed Chromium's actual error was `Promise was collected`,
  without a corresponding document navigation. Mutation-only fixture callbacks
  now synchronously use the retained engine reference. No production workaround,
  timeout increase or retry was added. Intermediate browser runs of **28/30**,
  **17/20** and a diagnostic **4/6** remain failures, not clean verification.
- An earlier September 22 full-suite continuation lost its process handle after
  an existing hover timeout; its final result is unavailable. A fresh September
  26 suite passed **1,318/1,318** before the five new regressions above. Neither
  is substituted for the final 1,323-test result.
- PWA registration now uses `prompt`, matching the save-before-update callback;
  `autoUpdate` bypassed that callback. Installed-client upgrade/process-kill
  safety remains unverified. The public FAQ now describes Classic Save and leave,
  Resume, browser-local storage and unconfirmed-staging limitations.

- Initial application/reset/locale checks: **54/54**; expanded ownership, retry and
  failed-reset checks: **57/57**. Strict TypeScript passed. Full ESLint finished
  with **zero errors / 211 existing warnings**.
- First desktop/touch browser run: **24/28**. Both actual-play and paid-pack reload
  comparisons failed in both projects on the existing fastest-win sentinel above;
  full run snapshots themselves matched. After repair, **29/30** passed, including
  native two-tab ownership, quota-failure recovery, backup/discard, Spanish 320×568
  layout, and victory reload. One desktop Endless fixture lost its browser execution
  context during navigation; touch passed. No deadline/retry count was increased.
- Artifacts are retained in `/tmp/tensho-classic-resume-browser-1` and
  `/tmp/tensho-classic-resume-browser-2`. Final verification is recorded above.
- The expanded full two-worker suite finished **1,309 passed / 9 failed in 112
  files**, 617.96 seconds. All nine failures were unchanged 5-second timeouts:
  three balance-command cases, five exhaustive save-validator cases and one
  existing Void Script hover test. Host load was roughly 35–61 during this run.
  These failures remain recorded; an isolated check is not a retroactive clean
  full-suite result. All **13/13 release-workflow checks** passed separately.
  The same three files subsequently passed **75/75 unchanged with one worker**,
  17.02 seconds; the balance file took 4.71 seconds and all fifty validator checks
  took 1.83 seconds. No production behavior, assertion or timeout was altered.

Important limits: local staging/animation state is not restored; the authoritative
rack and committed resources are. Pagehide cannot guarantee completion after a
mobile process kill. The separate profile/checkpoint crash-atomicity limitation
below remains unresolved. Unsupported catalog/rule versions preserve the raw
checkpoint and offer backup/discard, not an unsafe automatic migration.

## Whole-run and storage implementation

The published checkpoint contains the following enclosing implementation. Its initial
backend evidence below predates the application integration above:

- `ClassicRunState` captures the authoritative tile zones, melds, resources,
  table/stake rules, Act/round/endless state and all twelve subsystem snapshots.
  Restore rebuilds Tile/Meld instances, sets/maps and the shared Mandate/Debuff
  reference. JSON round restoration now reconnects the current round to its Act
  ledger, so subsequent scoring updates both views.
- `ShopSession` exports exact offers, visit totals and the paid pending pack.
  Restore links the pending reference to the restored pack system and checks its
  paid offer; it does not open another shop, reroll stock or pay again.
- The whole-run snapshot includes global Omen data, all random positions, Fate
  Seal copy history, consumption quotas, transient meta-progression context and
  runtime identifier counters. Meta context lives in a pure module rather than
  importing persisted profile stores into the engine. Load publishes `gameLoaded`,
  not another `runStart`, purchase or reward. Global opaque-ID counters retain a
  higher live value rather than reusing IDs allocated elsewhere in this session.
- The unknown-input parser checks every serialized field, finite values, bounded
  arrays, tile ranks/modifiers, unique references and map keys, captured rules,
  round-ledger consistency, pack payment/selection state and private RNG cursors.
  Rule-bearing definitions must match the current authored catalogs; presentation
  wording may differ. Unknown Omen fields cannot overwrite store action functions.
  Changed/unsupported rules are rejected, not silently converted into a new run.
- `ClassicSaveRepository` uses one versioned local-storage record, bounded to
  2,000,000 characters. Invalid records remain untouched. Each update, claim or
  deletion takes an origin-wide Web Lock and compares the observed checkpoint.
  An explicit Resume transfers the write lease; the preceding tab can no longer
  overwrite it. Missing lock support/access and quota failures are reported;
  there is no unlocked fallback and no delete-before-write operation.
- `ClassicRunPersistence` subscribes once to the application engine's events and
  queues capture after the synchronous action/shop transaction. It coalesces
  notifications, serializes writes, retains dirty progress for Retry and cancels
  queued writes before disposal/reset. A new run must be explicitly adopted; it
  cannot reuse the old run's lease. Reading the menu does not load or replace a
  save. Resume restores state without replaying meta-progression events.

Current focused evidence:

- The initial internal codec check passed **58/59**; its Mandate fixture incorrectly
  supplied Pinzu to The Club, which debuffs Souzu. Correcting that fixture produced
  **59/59** across snapshot, shop, meta bridge and Endless continuation tests.
- The first enclosing-validator run passed **51/66**. Eight fixtures called a
  nonexistent bulk selection API; seven failures exposed the uppercase consumable
  edition format versus lowercase tile editions. The validators now preserve both
  actual formats, and fixtures use `selectTile`. Pack display IDs may repeat in
  existing generation; reward selection is validated by its authoritative index,
  not by assuming those labels are unique. The corrected validator passed **47/47**.
- All **18/18** storage tests passed, including quota/access errors, damaged records,
  concurrent updates, stale Resume prompts, lease transfer and queued-write cancellation.
- The coordinator first passed **8/9**. Running with the real meta bridge exposed
  its numeric flower event identifiers (`"1"` through `"4"`), which are not the
  FlowerSystem's named variants. A diagnostic repeat retained that failure; the
  validator now preserves the bridge's opaque identifier set.
- The combined corrected focused run passed **134/134 in seven files**, including
  all eight tables at all eight stakes, paid pending-pack recovery, no replayed
  profile rewards, failed-write Retry and an action arriving during the initial
  save. Two subsequent checks cover every live boss activation and terminal
  defeat/victory/Endless restoration; the validator then passed **49/49**.
- The full two-worker regression finished **1,302 passed / 1 failed in 111 files**,
  174.26 seconds. Every one of the **96 new persistence tests** passed. The sole
  failure was the existing balance-command consumable-report test exceeding its
  5-second deadline (5.795 seconds) during a host-load spike (load average about
  41). The unchanged command file subsequently passed **22/22**, with the affected
  test taking 2.416 seconds and the file 17.76 seconds overall. No deadline,
  retries or simulation behavior was changed. This isolated pass does not turn
  the initial full run into a clean 1,303/1,303 result.
- A final review distinguished transient storage-read denial from an actual
  foreign-tab lease change; Retry now retains the existing lease after a read
  failure. Added coverage checks every owned Charter and shop adapter independently
  of current profile unlocks. All **98/98 new tests in four files** passed after
  that correction, 4.29 seconds. The full-suite figures above precede these last
  two checks and are not relabeled as a new full-suite run.
- Strict TypeScript, targeted ESLint, formatting checks on all new source files
  and `git diff --check` passed. The Pages-base production/PWA build passed:
  347 modules, 270 precached entries (67,800.31 KiB). Existing large-chunk and
  outdated Browserslist warnings remain. No browser server was started for this
  internal checkpoint; actual native-lock/reload/UI testing is still required.

These tests exercise the real engine and a controlled storage/lock adapter, not
browser reload routing or native cross-tab Web Locks. The repository makes its
single save key atomic; it does **not** make the separate profile-store writes
crash-atomic with that key. Normal restoration does not replay rewards, but an
abrupt process death between profile and checkpoint writes still needs a recovery
policy and dedicated evidence before claiming crash-safe exactly-once progress.

Nothing in this section is deployed. The public release remains the prerequisite
checkpoint below. No new illustration is warranted for internal save handling;
the established generated artwork is retained.

## Verified prerequisite: faithful subsystem restoration

The September 22 checkpoint repairs existing serialization boundaries before
connecting them to durable saves:

- `RunRandom` exports a versioned JSON state with the original seed and exact
  cursors for initialized streams. Unused streams remain unused. Restoration
  validates the version, seed and stream cursors before replacing live state.
  Zero is a legitimate cursor, not a request to restart at seed 1. Existing
  seeded sequences and the nine-stream partition remain unchanged.
- Omen snapshots retain the interest-cap bonus, its remaining rounds and the
  private skip-reward random cursor. Constructing a restored Omen system no
  longer clears or notifies the live global Omen store. The store itself still
  needs to be included in the complete run snapshot; this change does not
  claim that active tags or history are independently persisted.
- Mandate snapshots retain their private random cursor, so face-down outcomes
  continue instead of reverting to ambient randomness. Existing serialized
  restrictions remain intact; the enclosing restore must reattach the shared
  Debuff system rather than activate the boss a second time.
- Tea House snapshots retain visit discounts and the original free-reroll
  allowance alongside the number already used. Offers are detached copies;
  previously purchased stock remains purchased. JSON wall tiles are rebuilt as
  real `Tile` instances with their existing IDs and modifiers. Live Charter
  eligibility can be supplied on restore; missing policy grants no upgrades.
- Blessing Pack snapshots detach nested contents and restore tile rewards as
  `Tile` instances. An open, unresolved pack retains its selected reward and
  can be resolved once; an already claimed pack remains resolved. Existing
  legacy handling still considers old opened packs without a resolution flag
  resolved, because those records cannot prove the rewards were never claimed.
- Older internal subsystem snapshots lacking the new fields default to no
  bonus/free rerolls and an unseeded private generator. This is API compatibility,
  **not** a guarantee that a future whole-run loader can reconstruct missing
  historic random positions.

At that published prerequisite checkpoint these were internal typed codecs, not
a validated public save-file format. Only `RunRandom.fromState` accepted unknown
input. The enclosing local parser described above now validates other data;
arbitrary local-storage JSON must still never reach the typed subsystem
constructors directly.

## Verification

- Initial seven regression cases all failed: interest duration, destructive
  Omen construction, skip RNG, Mandate RNG, free rerolls, visit discounts and
  shop Tile prototypes.
- After those fixes: **66/66** focused tests passed.
- Expanded continuation checks initially passed **52/53**. The failed fixture
  advanced two shops side-by-side while restoring only the shop stream; Seal
  definitions also consume the global consumables stream. The fixture now
  restores **all** run streams between continuations. It compares future
  definitions/prices, not newly generated opaque instance IDs. Existing stored
  offer and item IDs are preserved. No production RNG order was changed to
  make this comparison pass.
- Corrected focused run: **99/99** passed.
- Two additional pending-pack tests reproduced lost Tile prototypes and shared
  mutable contents (**12 passed, 2 failed**); both are repaired.
- Final full suite: **1,207/1,207 tests in 107 files**, 44.42 seconds.
- First CI publication attempt, [run 35818485748](https://github.com/evgenyvinnik/tensho-web/actions/runs/35818485748),
  passed **1,206/1,207** but caught an existing localization-test race. The test
  waited for a multiplier formatted as `2.60`, which can appear while the
  independently formatted total still floors to `584`. It then asserted `585`
  immediately after changing language. The assertion now waits for **both**
  counters within the same existing deadline before checking language changes;
  no production scoring/animation code, deadline or retry count changed.
  The failed attempt published tag `v1.0.260923-7`, but did **not** build or deploy
  a Pages artifact. A tag alone is not deployment evidence.
- After the test correction, the full local suite with CI's two-worker setting
  passed **1,207/1,207 in 107 files**, 166.34 seconds. The score-formatting check
  passed in both normal and reduced-motion modes. A targeted formatting check
  flagged the new assertion's line wrapping; it was formatted before publication.
- All **13/13** release-workflow regression checks passed locally.
- Strict TypeScript, targeted ESLint and `git diff --check` passed.
- Pages-base production/PWA build passed: 344 modules and 270 precached entries
  (67,794.28 KiB). Existing large-chunk and outdated Browserslist warnings remain.
- **18/18 browser checks** passed without retries, using one worker and a private
  port: Omen durations, stacked shop rewards, and pack purchase/use provenance
  in English/Spanish on desktop/touch. These exercise existing gameplay; they
  are **not** Classic save/reload tests.
- Browser artifacts: `/tmp/tensho-classic-save-3TxjgM/browser-results`.
  The isolated server was shut down before further repository edits.

No UI, translations, art, gameplay balance or deployment workflow is changed by
this prerequisite checkpoint. Existing generated artwork is retained. A new
illustration is not needed for internal serialization code.

## Published prerequisite checkpoint

Deployed **v1.0.260923-8** after
[Actions run 35818907763](https://github.com/evgenyvinnik/tensho-web/actions/runs/35818907763)
independently passed all **1,207 tests in 107 files**, release checks, the
production/PWA build, provenance validation and Pages deployment.

- Implementation commit: `dc1f0049281e4b3bfd1d1c9b27dc264000ab706e`.
- Localization-test correction: `3a7be2dd8033babeedd82f227ef4362cd6b1bc8d`.
- Built/tagged commit: `58ccc039d67490b02d99d45aab1dc63e7af49777`.
- Public `release.json` and remote `v1.0.260923-8` tag match that exact commit.
- Fresh 1280×800 desktop and 320×568 touch contexts passed displayed version,
  real Classic staging/payment, and Table Loop pair placement/refill/reload,
  without JavaScript page errors. They did not modify the user's browser profile.
- Hosted script/screenshots: `/tmp/tensho-classic-save-3TxjgM/`.
- Main was fast-forwarded to the workflow version commit. This evidence-only
  follow-up uses `[skip ci]` and does not create another deployment version.

The unsuccessful `v1.0.260923-7` attempt above is retained in the evidence.
Neither this successful release nor the hosted Table Loop reload check proves
Classic resume, installed-PWA upgrade safety or whole-project completion.

## Remaining verification and recovery hardening

1. Review translations with native speakers and test installed-PWA upgrades,
   interrupted writes and unsupported-rule-version recovery on actual devices.
2. Specify and test profile/checkpoint crash recovery; single-key save atomicity
   alone is not cross-store exactly-once persistence. General concurrent profile
   writes and a foreign-tab reset during a pending save remain broader audit work.
3. Extend native-browser coverage across the full boss/consumable/shop rule
   matrix currently covered at the engine boundary. The passing hosted smoke
   checks are not exhaustive balance, newcomer comprehension or physical-device proof.

Outstanding mechanics decisions in the other ledgers remain unapproved. Saving
the current rules must not silently choose a new rule for those questions.
