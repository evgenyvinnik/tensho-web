# Implementation wrap-up

**Updated:** October 22, 2026

**Status:** Implementation integrated and deployed; final release verification
is tracked below. Historical checkpoints are not evidence for a newer release.

**October 22 completion audit:** the release hold was explicitly lifted by the
user. The integrated artwork, achievement rewards, Codex and layout work shipped
as `v1.0.261021-6`, commit `f5c074e0521121a43c6110cbd113b1d2f7ad3e84`
([successful deployment](https://github.com/evgenyvinnik/tensho-web/actions/runs/39663222525)).
The subsequent one-tap Mahjong-button removal is in main; complete hands remain
playable by staging their tiles and confirming the ordinary Play action.
Its deployment passed all gates in
[run 39831991881](https://github.com/evgenyvinnik/tensho-web/actions/runs/39831991881).
The live manifest confirms `v1.0.261022-1`, commit
`24a222ce71465600c015aec6374c7e971e90d0a8`; this exact deployed commit is now
the pinned saved-game upgrade baseline for the final interaction workflow.

The exact `24a222c` → `4610cad` local upgrade pass completed **4/4** cases:
desktop/touch, normal/quota-failed saves, deferred activation, other-window
protection and offline resume with all 52 delivery images. Evidence is in
`/private/tmp/tensho-release-upgrade-corrected-261022`. The original report in
`/private/tmp/tensho-release-upgrade-evidence-261022` caught a harness assumption:
a random opening play can win and reach the shop before the test clicks the
table's Exit button. The harness now continues through the real shop control
first, retaining quota failure and exact durable-save assertions throughout.
This correction changes no application code; the final workflow checks it too.

The original frozen core run completed **132/132**, zero retries/skips
(`/private/tmp/tensho-final-integration-core.json`, 15.2 minutes). The old surface
run was **49/60**, not a pass. Its Wall alignment defect is fixed through an
ActionBar-owned grid slot; dialog fixtures now acknowledge opening reveals and
exercise the current inspect/Buy flow. The current-main recheck confirms all
20 collectible/edition/dialog cases on desktop and phone. The tutorial file's
remaining hit-target assertion raced the Decree hover card's 120 ms closing
grace period. It now polls for actual reachability within the existing budget,
still failing if the control remains obstructed. All **8/8** tutorial cases pass
(`/private/tmp/tensho-tutorial-hit-target-20261022.json`, 1.1 minutes). The initial
current-main report remains at `/private/tmp/tensho-current-surface-audit-20261022.json`:
25/28 passed, two hit-target failures and one Vite navigation caused by the local
version fast-forward during the run. Scoped lint, formatting and whitespace
checks pass. No gameplay rules were changed by this test correction.

The final-source interaction workflow must verify complete runs, native
dialog/tutorial/audio controls, real static pages/catalogs, and the deployed
baseline's save-aware/offline update. The versioned deployment additionally
gates full units, release safeguards, production build and 138 built-browser
journeys. Completion requires both workflows and a live manifest/bundle check;
the final task handoff records those exact run/release identifiers. Newcomer
fun/playtesting, physical iOS/Safari, assistive-technology and native-speaker
review remain explicitly unverified, not implied by automation.

**Release cut — October 21:** the user lifted the release hold and asked for
the integrated work to ship. Local candidate before push: **3,619/3,619 unit
tests in 248 files**, TypeScript, lint (zero errors), all 18 release and
browser-runner safeguards, and the Pages-path build (807 precache entries,
under the 40 MiB budget). The production browser gate that deploys run
(`scripts/verify-gameplay-browser.mjs`) first passed 127/138. It caught three
things the failed v1.0.261021-4/-5 deploys never reached: the newly gated
audio, jade-controls and pavilion specs navigated outside the `/tensho-web/`
base; two replayed complete hands still pinned pre-honors payouts (an East
Wind pair now pays 100 a tile in a group); and a real defect, the 320px rack
flipping between two layouts every frame because `useNoLoneTile` undid its
own fix on the resize it caused. After those fixes the full gate passed
**138/138** (desktop and phone, one worker, no retries). The version number
and tag come from the deploy workflow on push.

**Frozen final-integration pass — October 21:** snapshot
`/private/tmp/tensho-final-integration.UxUbe5` captures local HEAD `39e460e` and
the current uncommitted integration. The 1,552 source/public/browser/script/CI
and build-config files match the working checkout at capture, aggregate SHA-256
`ef06776f3516ce48144a1a0170de3d1685cd034a66b685e91a55a214bfaf7503`.
Its Pages-path production build is `/private/tmp/tensho-final-integration-build`;
asset verification passes at 804 entries and 40,235,347 bytes. All **32/32**
production-static checks pass in 2.2 minutes, one worker, zero retries/skips:
public guides with JavaScript disabled, real routes/indexing, byte-exact artwork,
and translated catalog details on desktop/phone. Report:
`/private/tmp/tensho-final-integration-static.json`. Core and native-surface
checks are still running; this paragraph does not claim their completion.

The latest read-only live check still reports `v1.0.261021-3`, commit
`ac708417521b1f0373b8608c8c34fb94ee894e5b`; GitHub's latest deploy attempt is
still failed run `39623145181`, not a new release. The separate chat
“Fit tea house upgrades in 8 tiles” has a completed layout handoff, but it is
not enough evidence to identify the originally requested final gameplay
handoff. User confirmation was requested; release remains on hold. No commit,
push, workflow dispatch or deployment occurred during this pass.

**Isolated completion audit — October 21:** a copied checkout at
`/private/tmp/tensho-completion-snapshot.kCYhxA` includes base commit `0653d3d`
plus the uncommitted integration work, including the new immediate-use Fate Seal
flow and illustrated Flora reference. Its full unit suite passes **3,515/3,515
tests in 240 files** (97.16s), with normal test budgets and two workers. Report:
`/private/tmp/tensho-completion-snapshot-units-verified.json`. The initial copy
omitted Git metadata, so its provenance-dependent matrix test failed while
3,514 passed; adding a separate metadata copy fixed that setup failure without
changing the test. The original report is retained. All 13 release safeguards
pass; four browser-runner safeguards pass with localhost binding allowed after
the sandbox rejected their listeners. The full **132/132 native browser cases
passed** in 14.1 minutes, one worker, no retries/skips. This covers the eight
named core specs, including both quota-retry paths, paid pending packs, latest
Seal flows, reset, Act 8 victory/defeat, Endless/Ancient Script and localized
phone controls. Evidence: `/private/tmp/tensho-completion-snapshot-core.json`.
The copied source stayed unchanged throughout; its owned port 4313 was stopped.

The live manifest was re-read and still identifies `v1.0.261021-3`, commit
`ac708417521b1f0373b8608c8c34fb94ee894e5b`; its local tag resolves identically.
The interaction workflow's obsolete October 11 PWA baseline is now pinned to
that exact deployed commit. Recheck the live manifest before final publication.

Read-only deployment inspection found the two latest attempts failed. The latest,
[run 39623145181](https://github.com/evgenyvinnik/tensho-web/actions/runs/39623145181),
tested committed `0653d3d` and stopped at two old expectations: grouped Winds
still priced at 50 in `DroughtEmpowerment.test.ts`, and the coach forced to choose
14 tiles in `CompleteHandSelection.test.ts` even when a six-tile play pays more.
The already-present local corrections keep exact payout/read-only assertions
and require the coach to evaluate complete hands and choose the highest actual
forecast. Both files pass all 27 cases in the isolated 3,515-test result. This
explains the failed deployment but is not a successful remote rerun; no workflow
dispatch, commit, push or publication was performed during this audit.

**Codex economy reconciliation:** the current-source follow-up replaces three
old Economy sections with localized, illustrated shop/acquisition, payout and
interest explanations. It removes score-scaled cash rewards, a universal
five-interest ceiling, fixed shop-price promises and universal half-price
Decree resale. All 13 locales describe immediate Seal/Orb use, pre-payout
interest, Charter/Omen modifiers, win-only income, Eternal/zero-value sales and
non-refreshing Charter/Cartomancer offers. Five existing image placements are
reused. The new reference/locales batch passes **79/79**; TypeScript and scoped
lint pass. This postdates the isolated full suite, not a claim of another full
suite pass. The final terminology-aligned build
`/private/tmp/tensho-economy-reviewed-20261021` verifies 793 precache entries,
40,191,803 bytes. All **46/46 production-static browser cases passed** in
5.4 minutes, one worker, no retries: 26 Economy locale/profile checks plus
public guides, real static routes and artwork delivery. Report:
`/private/tmp/tensho-economy-static-browser.json`. These ran against the frozen
Economy build, before the additional reference localization below.

**C4 reference reconciliation:** the remaining routed Codex explanations and 25
missing titles now use 109 authored `codexReference` keys in all 13 locales.
User-approved parallel translators handled disjoint locale files; integration
checks verify exact key/interpolation/tag parity and render the entire Codex with
English fallback disabled. Quads, Wind/Dragon scoring, Yaku counts/ranges and
round targets use live constants; misleading fixed-Wall-size, separate quad
declaration, Heavenly-shop and half-price resale promises are removed. Existing
illustrations and optional Flora recipes are preserved. Five reference-contract
tests plus 45 complete-locale/Flora/Economy tests pass. TypeScript, scoped lint,
formatting and standalone browser-spec typechecking pass. The integrated build
`/private/tmp/tensho-codex-final-20261021` verifies 793 precache entries and
40,294,518 bytes, under the 40 MiB budget. Whole-suite and responsive browser
results will be recorded separately; authored translations are not a substitute
for native-speaker review.

The first new reference-browser run passed 19/26. Four desktop failures were
ambiguous test selectors (the localized word for Tiles also occurs in Hand
Building/Flora); three phone failures exposed genuine long-title overflow in
English, Spanish and French. The original report/traces are retained at
`/private/tmp/tensho-codex-reference-browser.json` and its matching directory.
The selector now matches the exact category label. The header now uses normal
flow, a minimum rather than fixed height, a smaller phone title and safe word
wrapping; its image label is localized. Two intermediate repeats were disrupted
by slow local browser execution (one interrupted after two timeouts, then 36/42
passed with six timeouts); their reports remain under `/private/tmp/`. The final
production preview passed **42/42** Codex-reference/pavilion-icon cases, both
desktop and phone profiles, one worker, zero retries, unchanged time budgets:
`/private/tmp/tensho-art-polish-reference-browser.json` (2.5 minutes).

The intervening full unit run passed 3,546/3,547: the CJK language-purity test
mistook known rich-text tag names for English prose. Its helper now removes only
the supported named tags; regressions still reject English inside tags and
unknown tag names. All 48 locale tests pass in the focused final batch below.
This is not a subsequent full-suite pass.

**User-requested artwork polish — October 21:** seven new jade controls now cover
reference/Collection placeholders, locks, language and callouts. Codex category
symbols reuse the game's actual artwork; the menu uses its jade-bound book and
table locks use a 24px painted padlock. Pairs now uses its existing two-tile badge
in scoring and upgrade tokens. Four generated edition mounts and subtle finishes
make Foil/Holographic/Polychrome/Negative Decrees recognizable across inventory,
details, shop/pack choices and acquisition reveals, without leaking face-down
state. All 21 Script portraits were individually repaired with true alpha to
remove white cutout fringes, then visually reviewed on dark felt. Runtime Script
assets are 169,378 bytes smaller; original PNGs are unchanged. Exact prompts and
paths are linked from [the art ledger](JADE_CONTROL_ART.md).

Final focused batch: **184/184 unit tests**, TypeScript forced rebuild, scoped
lint (zero errors; one ignored legacy-file warning), and `git diff --check` pass.
The first TypeScript attempt encountered a concurrently removed temporary probe;
the forced repeat passed. New edition/Script browser checks pass **4/4** on
desktop/mobile, including actual shop build/offer/details, Pairs, decoded image
sizes, transparent corners on all 25 assets, and empty edition-frame centers:
`/private/tmp/tensho-decree-script-art-browser-final.json`. Before that, Chromium
was blocked by sandbox permissions; the allowed run passed 3/4 with the first
desktop case still loading on a cold Vite server. The unchanged four-case repeat
passed in 12.5s. Both earlier reports are retained, not hidden by retries.

Production build `/private/tmp/tensho-art-polish-20261021` passes asset-delivery
verification: 804 checked entries, 40,233,352 precache bytes, within 40 MiB.
Local preview: `http://127.0.0.1:4317/tensho-web/en/`. The user's port 4294 remains
an older frozen build and was not overwritten. No commit, push, merge, deployment
or workflow dispatch was performed; release still awaits the agreed handoff.

**Script repair integration follow-up — October 21:** the next full suite passed
3,590/3,611, with all 21 failures confined to the obsolete assumption that each
Script WebP is an aspect-preserving resize of its legacy PNG. The delivery
contract now distinguishes the explicit 21 authored repairs (256px square,
alpha, under 32 KB) from ordinary resized artwork. The optimizer validates and
preserves repaired files rather than reintroducing the old white matte. Its
disposable-fixture regression proves byte-for-byte preservation and fails on a
corrupt repair; both workflows now run it. The 74 focused image tests, optimizer
regression, 17 release/browser-runner safeguards, TypeScript forced build, scoped
lint, formatting and whitespace checks pass.

The corrected whole-suite run passes **3,611/3,611 tests in 248 files** in
187.59s, two workers, normal time budgets:
`/private/tmp/tensho-completion-current-units-repaired-20261021.json`. The initial
21-failure report is retained at
`/private/tmp/tensho-completion-current-units-20261021.json`. This supersedes the
earlier targeted-only unit evidence for the current local integration.

The current-source production build at
`/private/tmp/tensho-completion-pwa-after-20261021` passes the unchanged offline
budget: 804 checked entries, 40,235,347 bytes. All **4/4** live-baseline upgrade
scenarios pass (desktop/touch, saved/write-failure), including safe-boundary
activation, competing-tab deferral, exact resumed state and all 52 optimized
illustrations decoded offline. Evidence:
`/private/tmp/tensho-completion-pwa-verified-20261021`. The initial run failed on
the gameplay agent's documented Eye/Ox history-field migration; the test now
requires the fixture's exact empty legacy histories before allowing only those
field replacements. No runtime migration was changed. Original diagnostics are
retained at `/private/tmp/tensho-completion-pwa-check-20261021`. This is a local
verification result, not deployment or final gameplay handoff.

**Scope decision — October 21:** the user explicitly deferred Challenge Runs and
their Rule Bender / Rule Breaker achievements. They are not completion gates for
this release. The active catalog excludes those two awards while retaining
historical saved records, artwork and translations. See `RULE_RESOLUTION.md`.
The deferral passes 146 targeted tests across eight files, including legacy
profile hydration, gallery totals, toast suppression, Purist and 13-locale
achievement checks. This is a targeted recheck, not a new full-suite result.

**Local integration checkpoint — October 21:** release is explicitly on hold until
the gameplay agent's final handoff. The illustrated pavilion/achievement work and
current progression findings are tracked in [the UI and achievement ledger](PAVILION_UI_ART.md).
The latest full local recheck passes **3,288 tests in 229 files**, including
Speed Run's paid-Turn rule, Purist's successful-reroll history, Challenge deferral, localized playable reward
names, Path thresholds, wall-size migration and Decree stake mastery. TypeScript,
scoped lint and production bundling/asset checks pass; the preceding checkpoint
also passed all 13 release-versioning safeguards. Twenty-six production-browser journeys check 13 achievement
locales at 320px in Chromium desktop/touch profiles, including reward-name
wrapping, the revised Speed Run rule, the 31-award total and the deferred awards' absence. Earlier checkpoints
passed 28 Collection victory-marker journeys (including 1280px keyboard use),
whole-project lint (zero errors; 215 warnings), and the broader pavilion checks;
those remain separate historical evidence, not reruns of this checkpoint.
Existing award records are preserved; new awards require actual run evidence.
These results do not close the remaining achievement/reward discrepancies or
replace final-source release verification. Nothing from this checkpoint was
committed, merged, pushed, or deployed.

**Acceptance follow-up — October 21:** the corrected public guides, retired-route
redirect and production artwork checks pass **20/20 browser journeys** against a
real static HTTP server, with JavaScript-disabled editorial pages, keyboard use,
text zoom and responsive layouts covered. The guide copy now distinguishes loose
numbered tiles (half base points) from Honors (full base points), states the
Small/Large-only swift-clear Omen threshold, uses continuous step numbering and
explicitly says Challenge Runs are unavailable. Public-site unit checks pass
36/36; a subsequent focused deferral/render check passes 18/18. Scoped lint and
`git diff --check` pass.

The separate **128-journey core browser run is not green: 124 passed, four failed**
(finished-run resume, quota-retry reload, mobile Decree details and live system
reduced motion). A traced diagnostic of those four cases in both profiles passed
7/8 and reproduced quota-retry snapshot inequality: the pre-reload checkpoint had
an unopened Tea House, while reload opened it and generated stock/consumed its
pending Omen. This identifies a transition-sensitive comparison, not evidence
that the played hand was lost; it still needs a deterministic transition/recovery
check. Passing isolated reruns do not clear the other original failures. Keep
the candidate unapproved until these are resolved and the final handoff arrives.
Diagnostic report: `/private/tmp/tensho-core-failure-diagnostic.json`; original
artifacts: `/private/tmp/tensho-core-completion-browser`. No release action taken.

**Achievement reward expansion — October 21:** the user approved implementing,
not retiring, all nine missing reward Decrees and both Walls. Catalog mechanics,
unlock reconciliation, eleven generated illustrations and 13-locale entries are
now implemented locally. Combined-source regression passes **3,468 tests in 237
files**, plus TypeScript, scoped lint, the production/offline budget check and
all 13 release-versioning safeguards. All **16 reward-specific browser journeys**
pass with no retries/skips (en/es, desktop 1280px/mobile 320px), including unlocks,
illustrations, popup readability and saved Wall/free-offer state. Visual review
found the existing Spanish REDRAW label overflowing its 320px ActionBar button;
that small-screen layout follow-up and the earlier core-browser findings remain
open. See
[the implementation contract](ACHIEVEMENT_REWARD_IMPLEMENTATION.md).

**Resolved Charter Collector rule — October 21:** the user confirmed five
purchases in one run by the end of Act 5, keeping boss-only shops. The bridge
now tracks saved per-run purchases and retains the highest qualifying count,
not a cumulative total across runs. All 13 descriptions agree. Legacy earned
awards remain earned; old cumulative progress is not promoted into a fabricated
single-run record. Challenge Runs and their awards remain explicitly deferred.
Final integration/publication still requires the requested handoff confirmation
and release verification.

**October 21 verification follow-up (before the new Codex reference request):**
Charter Collector's 19 regression cases pass, including 15 real round/shop
transitions with controlled scores/funds. Song notifications now dismiss once,
respect app/system reduced motion and remove their DOM even without spring
completion. The combined snapshot passes **3,495 tests in 239 files**,
TypeScript, scoped lint, and all 13 versioning safeguards. The frozen build
`/private/tmp/tensho-charter-candidate-20261021` verifies 793 precache entries,
40,125,492 bytes. This is local evidence, not a deployed release.

The 156-case core/layout pass recorded 154 passes and two reproducible lingering
song notifications; both affected notification journeys subsequently passed.
The 48-case targeted pass recorded 47 passes, with a startup reveal-helper
timeout before the remaining quota test reached its save operation. Waiting for
the actual reveal confirmation replaced the racing overlay click. A subsequent
16-case persistence run passed 14, with two startup timeouts during concurrent
verification/shared-checkout edits. The separate static-site pass was 10/12,
with two request-budget timeouts. Preserve these results and run the final
candidate in isolation; **do not claim a green final core/static matrix**.

The complete current-live-to-frozen-candidate PWA suite passes **4/4**:
desktop/touch, normal writes/storage denial, silent deferral while playing or
another tab is open, exact saved state and offline resume, plus 52 decoded
offline illustration replacements. Baseline: live manifest
`v1.0.261021-3`, commit `ac708417521b1f0373b8608c8c34fb94ee894e5b`.
The harness now acknowledges real starting Decree reveals and checks the loaded
entry/document identity instead of a version badge absent from gameplay. It
permits only the reviewed null `firstYakuType` → `lockedPatternId` migration
and the two catalog terminology changes; remaining runtime data compares
exactly. Evidence: `/private/tmp/tensho-charter-pwa-reviewed`; earlier failing
diagnostics remain in the sibling `tensho-charter-pwa-*` directories.

**Completed Codex reference update:** six shared illustrated Flora sections now
explain awakening, corruption, combinations and catalyst rules in all 13 locales,
using 28 existing artwork placements. Optional recipes are collapsed disclosures;
OS reduced motion is honored. All **26/26** frozen-production browser journeys
passed without retries across desktop/mobile Chromium profiles, including 320px
and 1280px layouts. Focused reference/rule tests, TypeScript, scoped lint and the
Pages-path build passed; see `PAVILION_UI_ART.md` for exact overlapping batches
and retained earlier diagnostics. Evidence:
`/private/tmp/tensho-codex-flora-production.json`; candidate:
`/private/tmp/tensho-codex-candidate-20261021` (793 verified precache entries,
40,177,551 bytes). This source postdates the PWA candidate above, so those worker
checks are not final-release proof for this build. Release remains on hold for
the explicitly requested other-agent handoff.

**Resolved Speed Run rule:** under delegated rules authority, the impossible
12-round target is replaced by a win using at most 48 paid Turns. Free REDRAWs
do not count; the winning play does. Optional run history prevents unknown
legacy spending from qualifying, while old earned awards are retained. This
resolves the reachability/specification discrepancy, not balance acceptance.
Swift Andy is now included in the reward expansion above. See `RULE_RESOLUTION.md`
for semantics.

The requested outcome is to finish the project implementation after the other agent's work, including new generated artwork. Preserve working gameplay and the established illustrated visual style. The 118 entries in [Gameplay experiments](GAMEPLAY_EXPERIMENTS.md) are a design reservoir, not 118 approved implementation requirements.

## Completion contract — October 11, reconciled October 21

The user has explicitly prioritized **project completion**. This is the active
work queue; the long chronological ledger below is evidence, not an ever-growing
release checklist. Finish one release candidate before starting another polish
checkpoint. A historical failure remains recorded, but only a reproducible
current defect or an unmet acceptance criterion blocks this candidate.

**Release scope:** the existing Classic game and its documented content/progression,
saves, optional teaching, responsive
localized interface, illustrated assets, audio, and public About/how-to-play/FAQ
pages. Preserve the current default mode and all confirmed mechanic decisions.
Do not introduce another mode, scoring redesign or default-mode migration as
part of closing this release. The player-feedback rules in `RULE_RESOLUTION.md`
explicitly retired Table Loop, Skip, the Riichi pledge and single-tile Discard;
the original October 11 contract's Table Loop requirements are superseded by
that decision, not silently treated as implemented. Challenge Runs and their
two achievements were explicitly deferred by the user on October 21. Subsequent
changes must close a gate below, not start another standalone polish checkpoint.

| Gate                             | Finite acceptance criterion                                                                                                                                                                                                                                                                                          | Current status / next action                                                                                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1 — Complete runs               | Classic: start, stage/confirm, score/refill, REDRAW, buy/use/reward, next round/boss, defeat, Act 8 victory, unlock and explicit Endless continuation. Rejected actions and repeated settlement must not spend/grant twice.                                                                                          | Implemented with existing engine/browser evidence. Re-run the named core journeys on the candidate, not just opening-tile interaction tests. Late-Act fixtures verify transitions, not organic wins.                                             |
| C2 — Rules and progression       | Each shipped content family has acquisition, authoritative use/trigger, visible explanation and persistence coverage. Reconcile any remaining advertised rule/unlock mismatch with `RULE_RESOLUTION.md`; retain the approved Merchant swap, defeat Rental and latest-only Bell rules.                                | Existing system coverage and resolved rules are the starting evidence. Audit current catalog/copy discrepancies once; turn only concrete discrepancies into fixes. Full unit suite must pass on the final candidate.                             |
| C3 — Save/recovery safety        | Reload/resume play and paid pending rewards without loss/replay; protect against stale-window writes; preserve preferences through confirmed reset; verify the supported current-to-candidate PWA update and offline artwork.                                                                                        | Existing coverage; run the named persistence journeys and existing update harness against the candidate. Do not claim support for every historical client or crash-atomic multi-key reset. Any reproduced loss of a supported save is a blocker. |
| C4 — Usable, teachable interface | At 320px, tablet and desktop: reachable primary actions and close controls, no page-wide overflow or clipped essential rules; hover information also available to touch/keyboard; optional guidance explains selection, commitment and payoff. All 13 game locales have required rules/control text and no raw keys. | Finish verification of the pending Dragon guide, then one bounded screen/locale pass. Fix blocked actions, unreadable rules and incorrect translations; aesthetic variations alone do not reopen this gate.                                      |
| C5 — Assets and public site      | Existing required illustrations decode and have accessible text; audio/motion preferences work. About/how-to-play/FAQ return real HTML with valid links/metadata, and production asset/cache budgets pass.                                                                                                           | Reuse the already generated art. Run public-guide/static-route/asset checks. English-only editorial pages remain explicitly labeled; search indexing and future translated articles are not implementation claims.                               |
| C6 — Release and handoff         | One final candidate passes full units, release safeguards, build, required browser journeys and hosted smoke; main, tag, manifest and served bundle agree. Record the exact release, remaining limitations and concise player instructions.                                                                          | Released on user request, October 21: see the release note at the top. October 11's `ceb70ed` evidence (144 core journeys and 10 PWA updates) is historical. Hosted verification of the deployed version follows the deploy workflow.            |

### Execution order and stopping rule

1. Close the concrete rule/catalog discrepancies and consolidate the completion candidate;
   do not publish it separately while a completion blocker remains.
2. Run C1–C5 once against a fixed candidate. Consolidate failures into one
   prioritized defect list; fix P0/P1 defects before optional visual adjustments.
   Do not start another feature or a new large simulation policy during this pass.
3. Re-run affected cases plus the final full unit/build/release checks. Deploy
   through the existing protected Pages workflow and verify C6 on the public site.
4. Mark implementation complete when C1–C6 have explicit results and no known
   supported-path blocker remains. Hand off the release and limitations; do not
   keep the implementation goal open solely to pursue every future improvement.

Core browser acceptance uses the existing `app`, `play-structure`, `shop`,
`consumables`, `run-results`, `classic-resume`, `two-actions` and `progress-reset`
specs, matching the repository's `test:acceptance` command. Several intentionally require
native Vite fixtures; run them there and label that evidence accurately. The
production interaction gate, `public-guides`, `static-routes`, `asset-delivery`
and the existing PWA update harness exercise the built release separately.
An unexpected skip or interrupted run does not satisfy a gate. Preserve original
failures and test budgets; investigate failures rather than retrying to erase them.

**Product acceptance is separate and explicit:** a newcomer should be able to
choose a scoring shape, explain its score, make a shop choice and start another
round without coaching from the developer. The user has agreed to try a fresh
run but has not yet supplied observations. Do not label the game fun or this
playtest passed based on automation. Fix concrete confusion they report within
the release scope; do not invent a playtest result or leave all technical work
waiting for feedback. Physical iOS/Safari, assistive-technology and native-speaker
reviews must be listed honestly as unverified if unavailable at handoff.

**After this release:** the 118 experiments, more illustration variants,
additional balance/search policies, new SEO articles/languages, external error
reporting, and exhaustive combinations of every item/Stake/old client are future
work. Existing promised mechanics, save correctness and essential localized
controls are not being deferred under that label.

### Active acceptance pass

The nine named core specs were started against an isolated, unchanged checkout
of `73ee4c1`: **144 desktop/phone cases**, one worker, no retries. Evidence is
retained at `/tmp/tensho-interaction-IE5a7E/completion-core`. This is a native
Vite integration pass, not a production or all-browser claim. After repeated
startup/teardown deadlines, the owned local runner was interrupted (exit 130):
**22 passed, 9 failed, 113 not run**, 28.8 minutes. This is not a green acceptance
result. Its errors and traces are retained. A separate dry listing of the new
package command ended with SIGTERM (143), so it is not counted as verification.
`bun run test:acceptance --workers=1 --retries=0` now names the same fixed suite.
The verification workflow adds a separate clean-runner core job (two workers,
zero retries, retained diagnostics), alongside the production interaction job.

Candidate `ad02c80` completed clean-runner CI `38178639394`: **2,964 tests in
209 files**, **17 release/runner checks**, build and **110 production browser
cases** pass. Its independent native core job passed **140/144** with no retries.
The earlier Dragon candidate `73ee4c1` also passed those 2,964/17/110 checks in
`38175717641`; exact totals were subsequently recovered through the GitHub
connector after the CLI log endpoint refused access.

Current defects and verification follow-up before publication:

- **C4, reproduced:** at 320px the top-row Settings button ends at x=285.02,
  beyond its x=283 safe boundary and inside the corner reserved at x=284.
  The center round chip's minimum width displaces the fixed-size controls.
  A local fix allows the middle region/round label to wrap and reserves the
  controls' width. Both desktop and phone corner cases now pass in the clean
  core job, including its exact 320px safe-boundary assertion.
- **Test correction:** the first-move guide check expects 18 images; the new
  three-Dragon legend correctly renders 21. The updated check requires 21 plus
  each of the three named Dragon images, retaining the rest of the real journey.
  Both variants now pass in the clean core job.
- **Historical local deadlines:** the first home-page and six consumable cases
  now pass in clean CI. Their earlier timeout causes remain unproven; the
  original diagnostic artifacts are retained, not erased by this result.
- **C1 remaining checks:** two late-game scenarios fail on both desktop and
  phone: the Endless-defeat fixture selects engine tiles without staging on the
  mat; the Ancient Script case expects details inside a collapsed payout panel.
  The follow-up uses actual rack clicks/taps and explicitly opens that panel,
  keeping the target/deadline fixture and all settlement/payment assertions.
  The installed-browser follow-up passes both phone scenarios and desktop
  Ancient Script (3/4); desktop Endless fails at the initial five-second Play
  visibility check, before its late-run fixture. It is not a full passing
  follow-up or proof of an engine defect. The original deadlines remain.
- **C4 localization:** the header's exit control, Gold balance, finite Act
  progress, Boss reroll label and cumulative Stake explanations now use locale
  resources. All 13 locales have the new keys. The focused header tests pass
  14/14; an earlier combined 62-test run had one existing RoundTypeIndicator
  timeout, so it is not recorded as a full green run. Native-speaker review is
  still unverified.

The first local four-case Endless follow-up did not launch a browser: the pinned
Playwright v1200 headless executable was missing (only v1234 was installed).
Its four failures are retained under
`/tmp/tensho-interaction-IE5a7E/endless-followup`; installing the required binary
does not by itself establish gameplay success.

The final header test correction passes TypeScript and targeted ESLint, and its
14 tests pass again. The completion workflow now also runs the existing dialog,
tutorial and native-audio cases, real static-route/public-guide/artwork checks,
and the complete save-aware update harness. Its baseline is the actual deployed
`v1.0.261011-14` source, built with the harness's `pwa-before` label; the candidate
uses `pwa-after`. This does not certify every historical installed client. The
new job is pending, not completed release evidence.

Final local result-screen verification passes **10/10 desktop/phone cases**,
1.3 minutes, no retries, against unchanged files. This includes victory/reload,
explicit Endless entry and defeat, Ancient Script payment/rewind without a
second victory, Rental defeat, and localized result layouts. Evidence:
`/tmp/tensho-interaction-IE5a7E/results-frozen`. The preceding full attempt was
9/10: a documentation edit triggered Vite's page reload during desktop Endless
fixture setup (visible in both the server log and browser trace). That
interrupted result remains in `results-final`; no timeout or assertion changed.
Do not edit watched files during a local browser run. The clean 144-case CI
recheck and separate release-surface job are still required before main.

The interaction-only CI is not whole-release clearance. Consolidate the
remaining core results, verify fixes and update this list rather than publishing
a candidate with a known current blocker.

### Consolidated candidate and catalog audit

Candidate `ceb70ed` passes **all three jobs** in CI `38180312598`: 2,978 tests
in 210 files, 17 release/runner checks, build, 110 production interactions,
144 core journeys, 24 native dialog/tutorial/audio cases, 20 static
guide/route/artwork cases, and all 10 actual-v14-to-candidate PWA scenarios.
The latter preserve durable state, reject activation over another game window,
recover failed saves and decode all 52 delivery illustrations offline. No
retries were used. This candidate has not been deployed.

The C2/C4 source audit then found **1,570 missing item entries**: 308 each in
Italian, Russian, Thai, Tagalog and Turkish, plus 30 Indonesian archive entries.
English fallback hid the omission; the old test required complete coverage only
in English. The follow-up now requires every runtime catalog ID in every locale,
nonempty names/descriptions, and every interface string/interpolation token.
All missing entries have been translated, preserving existing translations.
Four language files were completed by user-authorized parallel agents; the main
agent completed Russian/Indonesian and reviewed integration. Structural checks
prove no duplicate keys or lost existing entries, not native-speaker approval.
The first combined locale/header check passes 56/56.

The same audit corrects README counts to 24 Seals, 13 Orbs, 21 Scripts, 32
Charters, 24 Omens, 28 Mandates, 8 Stakes and 165 Decrees. Abundance Omen's
`draw_bonus` is assigned to `omenRedrawBonus` in the actual loop; its description
now says two redraw actions in all thirteen locales, not two additional tiles.
No resource/economy rules changed. Twelve new desktop/phone catalog cases check
eight representative actual item dialogs in each of the six affected locales;
they are included in the real static-server CI step.

Final focused checks pass **64/64** (locale, header and real Omen acquisition),
TypeScript, targeted ESLint and all **17 release/runner safeguards**. The first
native catalog browser batch is **11/12**, 4.9 minutes, no retries: all six phone
cases and five desktop cases pass. Desktop Indonesian misses its initial
five-second Archive-heading visibility deadline; the later failure snapshot
contains the expected localized heading. This does not establish its timeout
cause or a full green browser result. Evidence is retained at
`/tmp/tensho-interaction-IE5a7E/catalog-browser`. Inspected Russian desktop/phone
and Indonesian phone scrolls wrap their rules within the frame, with reachable
close controls. The same twelve cases and unchanged deadlines now run on the
clean static-server CI; final-source regression remains required before main.

Candidate `6a2d4a1`, CI `38182066761`, passes the full unit/build steps and
24 native dialog/tutorial/audio cases, but the static batch is **31/32**.
All desktop catalogs, including the earlier Indonesian timeout, pass. Russian
phone fails a real horizontal-overflow assertion on **Interest Omen**: the
single word “Предзнаменование” exceeds the title width and is visibly clipped
in the retained production screenshot. The PWA step is consequently skipped,
not passed. Diagnostics are downloaded to
`/tmp/tensho-interaction-IE5a7E/catalog-ci-surfaces`.

The follow-up adds `min-width: 0` and `overflow-wrap: anywhere` to the shared
popup title, retaining the full accessible name, centered alignment, close
control and scroll behavior. The browser assertion now waits for font readiness
and reports offending text/widths with the same one-pixel tolerance; it also
captures Interest Omen. Focused popup/Archive tests pass **10/10**, TypeScript
and targeted lint pass. The final full-project lint before this fix had zero
errors and 211 existing warnings. Production re-verification remains required.

## Current implementation

[Tile interaction recovery](TILE_INTERACTION_IMPLEMENTATION.md) fixes duplicate
Plum rack tiles, desktop lessons intercepting mat clicks, and a short-phone
discard target scrolling away. It also fixes compact group widths/spacing
changing during staging. All 172 final-source native browser checks and all
2,957 unit/component tests in 209 files pass. Concurrent main published the
Classic fixes in **v1.0.261011-12**, with successful CI/deployment and a matching
public manifest. The additional Table Loop scroll padding and shared
production-browser deployment gate now pass independent CI, including the
combined v13 main changes: 2,957 application tests, 17 release/runner checks,
the build and all 84 production-browser journeys with no retries. Published in
**v1.0.261011-14**: deployment run `38174591930` repeats those checks successfully;
the public manifest, Git tag and served entry-bundle version agree. All four
hosted English/Japanese desktop/phone rack journeys pass without retries:
every physical tile stages and returns with the first lesson open, no yellow
selection frame on the mat, and no save/resource changes. This is not a full
hosted all-locale/effect rerun. The separate Dragon-hint follow-up is not
included in this release.

[Compact Tea House](SHOP_DENSITY_IMPLEMENTATION.md) brings merchandise into
the opening phone viewport with an illustrated cash-out summary, optional
guidance and a compact build disclosure. No timer interrupts reading and no
economy/save rules change. Published in **v1.0.261011-9**: all 68 final native,
26 production and 26 hosted browser checks pass, alongside all 2,947 tests in
208 files both locally and in independent CI. Public manifest, tag, runtime and
artwork checksum agree. Short phones still scroll to read full product offers;
real-device and newcomer testing and other UI backlog work remain open.
Concurrent Table Loop/menu/flower-popover work was preserved and deployed in
**v1.0.261011-10**. Its CI passes all 2,951 tests in 209 files and all 26 hosted
shop journeys pass again. The other agent's reported gameplay-browser failures
remain tracked for current-state reproduction; this is not whole-game clearance.

[Illustrated coach comparison](COACH_COMPARISON_IMPLEMENTATION.md) replaces
truncated chips with short localized labels and an optional exact-score/tile
comparison. It corrects the false suggestion that a selected group is kept for
later and preserves the preview-before-payment contract. A reproduced phone
focus/scroll defect is fixed. All 100 final development-browser and 90 production
checks pass. The local full suite passes 2,928/2,931 tests; the three CLI timeout
cases pass in an unchanged 28-test serial recheck. Published in
**v1.0.261011-8**: independent CI passes all 2,931 tests in 208 files, the release
checks, build and deployment. Public manifest/tag/runtime agree, and all 52
hosted coach/rack-tool journeys pass without retries in thirteen locales.
This does not establish human enjoyment or whole-project completion.

[Reachable rack tools](RACK_TOOLS_IMPLEMENTATION.md) replace the phone's
sideways-scrolling secondary actions with a localized More disclosure, retain
the visible guidebook and desktop inline controls, and add generated planning-tray
art. The final layout preserves discard geometry under font/text-spacing stress
and dialog focus across viewport changes. All 2,911 unit tests, 64 native browser
checks, 26 final rotation/keyboard journeys and 64 production checks pass.
Published in **v1.0.261011-7** with independent CI passing all 2,911 tests.
The first hosted batch passes 63/64, with an unexplained Italian-phone Space-to-close
failure. Sixteen focused repeats and the final 26-case all-locale traced recheck
pass unchanged. That first failure remains an open diagnostic limit, not a claimed
root-cause fix. This is not whole-project completion.

[Quieter inventory and guide discovery](QUIET_INVENTORY_IMPLEMENTATION.md)
hide empty consumable families, retain owned-item controls, restore last-use
focus safely and align first-move copy with the illustrated book icon in all
thirteen locales. All 62 native browser journeys pass. The three CLI timeouts
from the full local run pass in a 74-test serial recheck. Final focus journeys,
build and 26 production newcomer checks pass. Published in **v1.0.261011-6**:
independent CI passes all 2,896 tests in 206 files and all 26 hosted newcomer
checks pass without retries. No inventory or tutorial reset is added. Local main
is synchronized with the published history; the parallel CSS edit remains intact.

[Wall readability](WALL_READABILITY_IMPLEMENTATION.md) replaces English-only
hover text and suit initials with localized headings and illustrated tile/count
captions, including separate red fives. All 2,881 tests and 52 native browser
checks pass. Integration with newer main also passes 64 production-browser
checks and the build. Published in **v1.0.261011-5**, including the user-requested
removal of yellow selection frames from staged tiles. Independent CI passes all
2,881 tests and all 64 hosted browser checks pass without retries.

[Tap-to-discard and grouped rack recovery](TAP_DISCARD_IMPLEMENTATION.md)
reproduce and fix the Russian short-screen defect from the last release. Labels
are bounded by their tiles, staging retains group geometry, and a stable
single-tile Discard action uses existing engine permission/payment. All 38 final
native and 38 production geometry/all-locale keyboard/touch journeys pass, as do
14 native tutorial/hand-builder checks, build, lint and thirteen release checks.
The local full suite passed 2,863/2,864 tests; the remaining archive Git-metadata
failure passes in a 93-test recheck after correcting the verification environment.
Independent CI passes all 2,864 tests in 204 files; this checkpoint is published
as **v1.0.261011-2**. Hosted checks pass 37/38, with the one English mobile timeout
passing a serial recheck; the former Russian failure passes. A subsequent local
user-requested change removes the yellow selection frame from staged tiles and
passes all 33 PlaySurface tests and both keyboard/touch browser checks; it is
now deployed and hosted-verified in **v1.0.261011-5**.
Separate concurrent image-loading and rack-pinning changes are preserved outside
this checkpoint's verification snapshot.

[Classic layout simplification](LAYOUT_SIMPLIFICATION.md) makes the play screen
fit without page scrolling at MacBook (1440×800), iPad and phone sizes: the
score bar and actions stay put, the rack is pinned while the board above it
keeps a usable window, and inventory is one rail. A second pass after user
review puts coaching, forecast and last play on one score line, merges Act,
round and progress into one chip, removes counters the table already shows,
floats tips over the board from tablet width, keeps rack positions stable
while tiles are staged, and gives every table its own felt colour. With the
existing **Tile Hints** setting (now wired and on by default), the rack shows
the scorer's Pairs, Sequences and Triplets as labelled groups and suited tiles
carry Arabic numerals. Remaining ideas are handed off in the
[UI improvement backlog](UI_IMPROVEMENT_BACKLOG.md). All 2,858 unit tests pass;
206 of 208 layout-related browser checks pass on desktop and mobile projects
(the two failures are environment-specific lazy-image checks). Published in
**v1.0.261011-1**. The subsequent combined production batch passes 27/28 checks,
but exposes a Russian short-screen discard-target visibility failure, now recorded
in the UI backlog. Real-device, complete layout and newcomer verification are not claimed.

[Device matrix and eager tiles](LAYOUT_SIMPLIFICATION.md#device-matrix-production-build)
checks the production build under emulation on 13 phone, iPad and MacBook
viewports as a first-time player with the tip open, on top of the tap-discard
fix. Every device shows no page scroll and keeps score, Play and the whole rack
on screen, except the 320×568 phone, where the board scrolls by design. Labelled
groups and numeral badges render everywhere, and the guided first move scores.
It found and fixed blank lazy-loaded tiles inside scroll boxes (short phones,
guide, table picker) and a rack-pinning threshold that unpinned iPhones in
Safari. Affected browser specs pass 84/84 and unit tests pass; emulation is not
hardware, and newcomer comprehension is not claimed.

[Table Loop save ownership](TABLE_SAVE_OWNERSHIP_IMPLEMENTATION.md) now pauses
stale windows instead of overwriting newer runs, offers explicit localized
recovery, and coordinates both run writers with confirmed progress reset.
Unique checkpoint IDs and a reset marker cover repeated identical journals and
queued first-ever saves. The final 26 native desktop/touch checks and ten real
previous-release PWA upgrades pass, as do all 2,836 unit/component tests in 201
files, strict TypeScript, lint (warnings only) and thirteen release checks.
Published and hosted-verified in **v1.0.261011-1**: all sixteen hosted save checks
pass; the combined 2,858-test regression passes locally and in CI, deployment
succeeds and public manifest/tag/runtime match. Crash-atomic profile reset,
older uncoordinated clients and whole-project completion are not claimed.

[Illustrated asset delivery](ASSET_DELIVERY_IMPLEMENTATION.md) is published and
hosted-verified in **v1.0.261008-21**: 50 transparent UI copies and a responsive two-size guide hero
reduce the measured offline payload from about 70 to 36 MiB. Originals remain
published, all current assets remain offline-ready, and the build enforces
coverage/size budgets. Fourteen production guide checks and ten real
old-to-new worker upgrades pass, including decoding all replacement images
offline. The final full regression passes 2,809 tests in 199 files; 80 native
cases pass across the recorded initial/follow-up runs. Build, lint (warnings
only), thirteen release checks and byte-for-byte production asset checks pass.
Independent CI passes all 2,809 tests and deployment; sixteen hosted checks
pass with matching manifest/tag/runtime, all 52 image hashes and all 51 legacy
URLs. The ledger retains initial failures and remaining performance limits.
Whole-project completion and enjoyment are not implied.

[Riichi pledge](RIICHI_IMPLEMENTATION.md) is published and hosted-verified in
**v1.0.261008-20**: an explicit
once-per-round, 1-Gold commitment enables Riichi, Pluto and Riichi Devotee through
real play, with genuine completion or nonrefundable abandonment, persisted state,
all-locale confirmation and a generated portrait. Its tests also found and fixed
The Eye/The Mouth consuming Yaku eligibility during forecasts. Full regression
passes 2,757 tests locally and in independent CI; eight final native, eight
production and eight hosted desktop/touch journeys, build, lint (warnings only)
and thirteen release checks pass. Manifest/tag/runtime and portrait hash match.
This is not a balance or whole-project completion claim.

[Observatory](OBSERVATORY_IMPLEMENTATION.md) resolves the remaining Charter
conflict in favor of matching scored Yaku, once per held Orb per play, with
explicit Black Hole and consumption rules. It adds a generated transparent
portrait and all-locale hold/use guidance beside confirmation. Published and
hosted-verified in **v1.0.261008-19**: both local full regressions and independent
CI pass 2,714 tests; eight final native, eight production and eight hosted
journeys pass, with matching manifest/tag/runtime and portrait hash. This closes
a specific power-consumer mismatch, not organic progression balance or enjoyment.
The follow-up found Classic's missing Riichi declaration path; the subsequent
pledge checkpoint above addresses it explicitly, rather than claiming helper-only
family tests demonstrated a reachable reward.

[Illustrated public hand guide](ILLUSTRATED_HAND_GUIDE.md) adds an engine-tested
keep/exchange/complete example, actual tile art and the workshop's real cost and
limits. About/FAQ now describe shipped Flower/Season powers accurately. Published
and hosted-verified in **v1.0.261008-18**: 2,675 tests pass locally and in CI;
build, thirteen release checks, eight production guide journeys and six gameplay
workshop replays pass. All fourteen hosted rechecks pass with matching manifest,
tag and runtime. These English articles do not close newcomer playtesting or
guide localization.

[Illustrated hand workshop](HAND_BUILDER_IMPLEMENTATION.md), published and hosted-verified
in **v1.0.261008-17**, connects optional
player guidance to actual staging, separate redraw confirmation, real resource
costs and thirteen locales. Hidden or unsupported hands receive safe explanations.
Visual review also corrected the shared White/Red Dragon artwork mapping without
changing saved identities. Full regression passes 2,671 tests locally and in CI;
six native workshop, six resource, two live privacy, six production and six hosted
checks pass with matching manifest/tag/runtime. This closes the
first player-facing guidance gap, not full-hand balance, native-speaker review,
physical-device performance, newcomer enjoyment or whole-project completion.

[Batch hand-planning investigation](CLASSIC_BATCH_HAND_PLANNING.md) separates
resource-policy weakness from full-hand impossibility. The new opt-in experiment
uses the existing three-tile redraw allowance. Across 320 total matched runs,
genuine completions improve 62→115 and wins 12→22; no diagnostic stops or rescue
events occur, but 31 paired runs worsen. Corrected counters and profile metadata
retain the original attempt, and 2,628 regression tests pass locally and in CI.
Published as **v1.0.261008-15**, with successful deployment, matching
manifest/tag/runtime and two hosted English desktop/mobile replays. No live policy or
balance change is implied. Optional, cost-aware player guidance is now implemented
in the hand workshop above; its effect on player decisions remains to be assessed.
Whole-project completion and fun remain unproven.

[Closed-Hand Austerity](CLOSED_HAND_AUSTERITY_IMPLEMENTATION.md) is published and
hosted-verified in **v1.0.261008-14**: actual completed-hand mastery, legacy item/save
compatibility, generated portrait and optional localized progress. Full regression
passes 2,620/2,620 in 190 files; build/typecheck, lint (warnings only), thirteen
release tests, corrected native checks and twelve production desktop/touch
journeys pass. Independent CI passes 2,620/2,620 tests and deployment; twelve
hosted journeys pass with matching manifest/tag/runtime and artwork checksum.
The original red cases, test-construction errors and decimal formatting issue
remain recorded. A five-run unforced smoke test produces no diagnostic stops,
but zero complete hands in 118 plays. Full-hand construction, overall balance
and project completion remain open.

[Yaku Repetition](YAKU_REPETITION_IMPLEMENTATION.md) is published and hosted-verified
in **v1.0.261008-13**: consecutive-round compound growth, boss-filtered scoring, compatible
saved streaks, generated scroll artwork and optional localized planning details.
The full regression rerun passes 2,599/2,599 in 188 files; build/typecheck, lint
(warnings only), thirteen release checks, six native and six production
desktop/touch journeys pass. Independent CI passes all 2,599 tests and deployment;
six hosted journeys pass, with matching manifest/tag/runtime and portrait checksum.
Initial test-matcher mistakes and the first full-run
CLI timeout remain recorded. This is not a whole-project completion or fun claim.

[Secret consumable progression](SECRET_CONSUMABLE_PROGRESSION.md) is published
and hosted-verified in **v1.0.261008-12**: all six authored gates now affect live
earning and acquisition, including paid Yakuman families and same-run mastery.
Legacy paid/owned rewards and Fool copies remain valid. Final units pass
2,579/2,579 in 186 files; build/typecheck, lint (warnings only), thirteen release
tests, eight native and eight production unlock/Archive journeys, and 28 native
Orb-effect journeys pass. Independent CI passes 2,579/2,579 tests and deployment;
eight hosted desktop/touch journeys pass and manifest/tag/runtime agree.
Prior failures and fixes remain recorded. This is a
mechanics checkpoint, not a whole-project completion or fun claim.

[Broad integration audit](BROAD_INTEGRATION_AUDIT.md) and
[Archive follow-up](ARCHIVE_PRESENTATION_IMPLEMENTATION.md) are published and
hosted-verified in **v1.0.261008-11**:
six authored Decree gates, compatible earned rewards, Perfectionist/Blueprint art,
localized collection details and mobile/Cyrillic layout corrections. The full native
audit finished with 661 passes, thirty environment-specific skips and fifteen
failures. The subsequent 18- and 28-case serial batches pass all previously failing
journeys without retries or changed deadlines. Twelve production replays and four
real-static-host route cases pass. Full local units had 2,547 passes and one CLI
deadline; the isolated 339-case follow-up passes. Build, lint (warnings only) and
thirteen release checks pass. Independent CI passes **2,548/2,548 in 183 files**,
deployment succeeds, and the twelve hosted desktop/touch journeys pass. Public
manifest/tag/runtime version and both portrait hashes agree. Earlier failed
attempts remain in the evidence ledgers; the overall implementation goal is open.

[Shop copy preflight](SHOP_COPY_PREFLIGHT.md), published and hosted-verified in
**v1.0.261008-10**, isolates validation and hypothetical
inventory randomness from the live run. Repeated offer checks, failed pack
selections and observed-build ranking cannot shift a later target. Full regression
recheck and independent CI pass 2,203/2,203 in 178 files; TypeScript, build, lint and
thirteen release checks pass. Native, production and hosted EN/ES desktop/touch
rechecks each pass 4/4. Deployment succeeds; manifest/tag/runtime agree.
Original startup and regression deadlines remain recorded.

[Score-threshold Decrees](SCORE_THRESHOLD_IMPLEMENTATION.md), published and hosted-verified
in **v1.0.261008-9**, qualify against the
current play's paid score before their conditional bonuses. This fixes unreachable
Supernova and unconditional opening-hand Perfectionist behavior. Generated Supernova
art and thirteen-locale rules are connected. Full regression and independent CI pass 2,196/2,196 in
177 files; TypeScript, build, lint and thirteen release checks pass. Corrected
native, built-production and hosted EN/ES desktop/touch journeys each pass 4/4.
Deployment succeeds; manifest/tag/runtime and artwork checksum match.
The analysis-only shop model cannot price these final-score gates and preserves
them as unpriced powers; historical balance sweeps are not current measurements.

[Copied ability lifecycles](COPIED_LIFECYCLES_IMPLEMENTATION.md), published and
hosted-verified in **v1.0.261008-8**, connect physical
consumption, destruction and shared action limits to the actual loss/round loop,
with optional thirteen-locale explanations. Full regression and independent CI pass 2,164/2,164 in
175 files; build, TypeScript, lint and thirteen release checks pass. Corrected
native, production and hosted desktop/touch EN/ES journeys each pass 4/4. Deployment
succeeds and manifest/tag/runtime agree. Earlier failed reproduction and verification-setup attempts are recorded.
This closes the copied rescue/cost decision, not whole-project implementation.

[Doppelganger](DOPPELGANGER_IMPLEMENTATION.md) is published and hosted-verified in
**v1.0.261008-7**, with seeded
round-stable physical targets, save migration, copied resource timing, generated
scroll art and thirteen-locale inventory explanations. Full regression and independent CI pass
2,133/2,133 in 173 files; TypeScript, build, lint and thirteen release checks pass.
Native, production and hosted EN/ES desktop/320px journeys each pass 4/4, including an
actual target and rack-size change on round entry. Deployment succeeds and
manifest/tag/runtime/artwork provenance match. This
resolves the historical random-target timing question under delegated authority;
other copy-resource lifecycles and whole-project completion remain open.

[Save-aware screen recovery](SCREEN_DOWNLOAD_RECOVERY.md) is published and
hosted-verified in **v1.0.261008-6**. It preserves loaded-mode save guards and worker
update consent, bounds automatic reloads, and provides thirteen-locale explicit
recovery actions. Expanded production browser checks pass 26/26; full regression
and independent CI pass 2,099/2,099 in 171 files; build, TypeScript, lint and thirteen
release checks pass. Final hosted recovery and Classic gameplay replays pass 24/24;
deployment and public manifest/tag/runtime provenance agree. Initial v5 hosted
checks exposed a redirect-count harness defect and an actual second reload
allowance across a trailing-slash redirect. Both are corrected in v6 and earlier
failures remain recorded. The earlier ownership release's original download failure
cause remains unproven. Other mechanics and balance/fun work are still open.

The [run-ownership follow-up](RUN_OWNERSHIP_IMPLEMENTATION.md) is published and
verified in **v1.0.261008-4**: permanent current-run Fate Seal changes, Negative physical-tile
capacity, saved-run reconciliation and localized explanations, with distinct
Transmutation art. Native and built-production desktop/320px EN/ES journeys each
pass 8/8 without retries. Eighteen engine and fourteen localized UI tests plus the
asset check pass. Full regression and independent CI pass 2,060/2,060 in 169 files;
TypeScript, build, lint and thirteen release checks pass. Deployment and release/
artwork provenance match. Hosted first batch was 7/8 due to a gameplay-module fetch
failure; the unchanged traced full recheck passes 8/8. The original failure cause
is unproven, retained for startup-reliability follow-up. This supersedes
older notes requesting a separate lifetime/Negative choice; it does not close
the other gameplay, item, accessibility or balance requirements.

[Frostbite repeat rewards and Treasure Hunter](FROSTBITE_RETRIGGERS_IMPLEMENTATION.md)
are published and verified in **v1.0.261008-3**. The actual paid score now
includes native Glass/Polychrome, complete Red Seal rewards, and fractional
Decree repeat rewards. Remaining-rack suit income is win-only; stable binary
rules/resources and prior defeat choices are preserved. New Echo Stone artwork
and thirteen-locale rules are connected; native, production and hosted EN/ES
desktop/touch journeys each pass 4/4. Full regression and independent CI pass
2,027/2,027 in 167 files, with build, TypeScript, lint and thirteen release
checks passing. Deployment succeeds without retry; release/artwork provenance
matches. Other mechanics and human balance/fun requirements remain open.

[Yakuman Succession](YAKUMAN_SUCCESSION_IMPLEMENTATION.md) is published in **v1.0.261008-2**
as a distinct two-held-Flower ascension permission, with a generated portrait and
thirteen-locale descriptions. Twenty engine and thirteen locale cases pass;
TypeScript, build, lint and thirteen release checks pass. Native, production and
hosted desktop/320px EN/ES journeys each pass 4/4. Fresh full regression and
independent CI pass **1,991/1,991 in 165 files**. Deployment succeeds without
retry; manifest/tag/runtime/artwork provenance matches. Earlier deadlines and
isolated rechecks remain recorded. This is not whole-project completion.

[Flower catalysts](FLOWER_CATALYSTS_IMPLEMENTATION.md) are published and verified
in **v1.0.261008-1**:
an optional illustrated, cancellable payment path for actual Yaku-changing
Decrees, with post-payment bonuses/capacity, stock eligibility and saved history
handled by the authoritative shop transaction. Native, built-production and
hosted journeys each pass 4/4. Independent release CI passes 1,957/1,957 tests,
13 release checks, build and deployment; local TypeScript and lint pass. Public
manifest/tag/runtime match. Earlier local totals and probe corrections are kept.
This does not substitute for the separately authored Yakuman Succession item.

[Flower mutations](FLOWER_MUTATIONS_IMPLEMENTATION.md) are published and verified
in **v1.0.261007-13**. All four engine effects, real rebloom acquisition,
saved eligibility, localized inspector/hand explanations, coaching, optimized
larger-rack search and new Chrysanthemum/Bamboo portraits are connected. Native,
production and hosted journeys each pass 4/4. Build, TypeScript, lint and 13
release checks pass. Final full local regression and independent CI both pass
1,935/1,935 in 161 files. Deployment succeeds after a failed-job-only retry of
a Pages HTTP 500; public manifest/tag/runtime and artwork checksums match.
Earlier failures remain documented. Catalyst payments and other previously
listed requirements are not removed from scope.

[Plum/Autumn](PLUM_AUTUMN_IMPLEMENTATION.md) is published and verified in
v1.0.261007-12: one physical matching river recovery per paid sequence, after
refill on continuing plays only. It preserves preview/payment, modifiers and
saved identities. Generated Plum art and thirteen-locale earned feedback are
connected. Release CI passes 1,897/1,897 tests, 13 release checks, build and
deployment; native, production and hosted journeys pass 4/4 each. Public
manifest/tag and artwork checksum match. This supersedes older notes below
calling Plum unimplemented. Mutations/catalysts and remaining item mechanics
still require implementation.

[Orchid/Spring](ORCHID_SPRING_IMPLEMENTATION.md), published in v1.0.261007-11, grants non-chaining physical
dead-wall draws for normally drawn Honors, before one boss reaction. The actual
draw capacity and Dead Wall Writ's Spring fill are also connected. New generated
Orchid art and thirteen-locale post-bloom feedback are integrated. Release CI
passes 1,869/1,869 tests, 13 release checks, build and deployment. Native,
production and hosted journeys pass 8/8 each, broader redraw checks 6/6. Public
manifest/tag and hosted artwork checksum match. Earlier corrections are retained.
Plum/Autumn,
mutations/catalysts and remaining item mechanics are still required.

The [touch-input follow-up](TOUCH_GESTURE_IMPLEMENTATION.md) is published and verified
in v1.0.261007-10. After v9's first-frame fix, a 5/8 hosted batch proved a separate
moving discard target. The grid and font-loading correction now passes 20/20
native, 20/20 production and 20/20 hosted journeys, including delayed-font and
text-spacing stress in three languages. Final resource-assertion recheck passes
12/12; release CI passes all 1,843 tests, 13 release checks, build and deployment.
Public manifest/tag and loaded JS/CSS match. Earlier failures are retained rather
than all attributed to the listener race. Narrow Russian footer wrapping remains
a separate known UI follow-up; Flower/item mechanics still require implementation.

[Bamboo/Summer protection](BAMBOO_SUMMER_IMPLEMENTATION.md) is published in
v1.0.261007-8. It connects physical-terminal paid plays to restoration and
round-scoped protection, with strict versioned saves, translated earned-state
copy and generated Summer artwork. Other Flower interactions remain open.
Final units pass 1,839/1,839; native and built-production journeys pass 8/8 each.
The unchanged short-phone persistence recheck closes the earlier 11/12 batch's
deadline failure. The ledger retains intermediate fixture corrections and
earlier production deadline failures. Implementation is `3bdc04f`; independent
CI passes all 1,839 tests, build and deployment. Public manifest/tag/artwork match.
Hosted runs retain touch misses and timing failures; they are not a clean full
pass. A reproduced first-frame input race has a [local fix and regression tests](TOUCH_GESTURE_IMPLEMENTATION.md)
in verification, without claiming it explains every intermittent hosted miss.

[Winter legality](WINTER_LEGALITY_IMPLEMENTATION.md) is published in v1.0.261007-7:
exactly one skipped rank per same-suit sequence, including tactical scoring and
coach suggestions, with optional localized tile-group explanations and pine art.
Final full tests pass 1,820/1,820 and native/built-production browser journeys
each pass 8/8. The retained intermediate native fixture failure is explained in
its ledger. TypeScript, Pages build and release checks pass. Release CI passes all
1,820 tests and all eight hosted replay journeys pass; manifest and artwork hash
match the published version.

The published [Autumn checkpoint](AUTUMN_IMPLEMENTATION.md) resolves its ambiguous
discard-pool draft as +1 discard action per normal draw. Granting it preserves
prior discard expenditures for scoring, stacks, expires and restores exactly.
It includes generated art and all-locale copy. Full units pass 1,789/1,789;
initial native journeys pass 8/8. After the text refinement, seven native cases
pass and a retained overall-deadline failure repeats in isolation; final
built-production journeys pass 8/8. Release v1.0.261007-6 is verified: CI passes
all 1,789 tests and hosted saved-fixture journeys pass 8/8.
Plum recursion is still an independent unimplemented requirement.

The user has explicitly delegated resolution and implementation of open rules;
[the decision record](RULE_RESOLUTION.md) preserves the prior confirmed choices.
[Spring](SPRING_IMPLEMENTATION.md) now expands the rack by two spaces per normal
Spring for the round, fills new spaces through the actual draw paths, respects
exhaustion and settles one Mandate cycle. Its generated illustration and rule
text are integrated into the inspector and all thirteen languages.
[Drought](DROUGHT_EMPOWERMENT.md) now also suppresses Flower empowerment of
Decrees. Orb upgrades remain immediate on use by explicit design resolution;
the contradictory XP draft and unused thresholds are removed.

Published **v1.0.261007-5** after independent CI passed all 1,772 tests, 13 release
checks, build and deployment. Native, built-production and hosted journeys pass
16/16 each. Public manifest/tag match `6979460ac1ccbaecfba9a942134b11f9070dbde3`,
and hosted artwork matches its saved hash. Earlier local failures, corrected
fixtures/test-only assertions and an interrupted run remain recorded. The
[384-run matched sweep](CURRENT_RUN_SWEEP.md) found no diagnostic
stops, but its structural planner underperformed the control. It predates the
Season changes and is not a current tuning claim. Remaining Flower/Season and
item-rule work is still required, not removed by this checkpoint.

## Illustrated Tea House build management

The [illustrated Yaku upgrade ledger](YAKU_UPGRADE_LEDGER.md) exposes actual
run-wide Orb upgrades and scored counts in gameplay and the shop, with a new
generated constellation folio and all-locale copy. The optional dialog preserves
staging/resources and puts the first upgrade above the fold on a 320px phone.
Full regression passes 1,747 tests before the layout follow-up; affected checks
pass 84/84 afterward. Final native and built-production journeys pass 12/12 each,
with earlier deadline failures retained. Build, lint and thirteen release checks
pass. Published **v1.0.261007-4** after independent CI passed all 1,747 tests
against the final source and deployed successfully. All twelve hosted journeys
pass; public manifest/tag match `6682a8250f2696ebdd79b4ee46aeb9ad696ffde6`, and
the hosted artwork hash matches. Orb-leveling semantics were unchanged by this
inspector and subsequently resolved in the October 7 decision record above.

The [expanded-rack hand correction](COMPLETE_HAND_SUBSETS.md) finds a legal
complete declaration inside larger racks, stages only those physical tiles and
keeps spares held. Required/hidden tiles and active rules remain authoritative.
The coach shares the candidate and all thirteen locales supply the readiness
label. Final native checks pass 38/38, focused rechecks 153/153, build, lint and
13 release checks pass. Earlier local timing failures remain in the evidence
ledger. All twenty built-production journeys pass. Published **v1.0.261007-3**
after independent CI passes all 1,728 tests and deployment; all twenty hosted
journeys pass and public manifest/tag match
`a45497ee25e01739b981b79e772eb6b7764766fb`. This closes the enlarged-rack
declaration defect, not the broader mechanics and human-experience audit.

The [resource Charter checkpoint](CHARTER_RESOURCE_VERIFICATION.md) adds two
generated portraits and 14 end-to-end engine regressions covering real resource
use, exhaustion, boss overrides, Act-reduction lifetime and Final Cut payments.
All eight native rechecks and eight built-production journeys pass. The full
local run's timing failures are retained; all 86 affected/recheck tests pass.
Build, lint and 13 release checks pass. Published **v1.0.261007-2** after all
1,710 independent CI tests and deployment passed. All eight hosted journeys,
public manifest/tag and both artwork hashes match. No resource runtime defect
was found in these paths; natural reachability and other mechanics requirements
remain open.

The [hand interpretation follow-up](HAND_INTERPRETATION_UI.md) supplies optional
localized explanations, rule-aware readiness and two generated portraits.
Both native browser batches pass 18/18; all 16 built-production journeys pass.
The full-unit CLI timeout, passing unchanged recheck and corrected stable-source
lint result are retained in the ledger. Published **v1.0.261007-1** after all 1,690
independent CI tests, build and deployment pass. All 16 hosted journeys pass;
manifest/tag match `f18778be1aba4cc34596485f4922445be599cd6f`, and both hosted
art hashes match. Human onboarding/fun, translation review and remaining mechanics
requirements are not established by these fixture-driven checks.

The [Wildcard scoring correction](CELESTIAL_WILDCARD_IMPLEMENTATION.md) is published
as **v1.0.261004-10**: consistent temporary identities now support special hands, and
the shared Orb mapping connects their upgrades and Star Chart play counts.
All ten new engine regressions, 12 native and 12 built-production journeys pass.
The lower-concurrency full run has 1,674 passes and three timeouts; unchanged
isolated rechecks retain CLI timing failures. Earlier failures remain in the
evidence ledger. Independent CI passes all 1,677 tests, build and deployment.
Public manifest/tag match `042fdf51f4332679fe3416fea53266c18724db15`.
All 12 hosted journeys pass; the power-aware readiness/adopted-identity follow-up
is now implemented above, without claiming complete presentation polish.

The [same-visit pack Charter correction](PACK_CHARTER_IMPLEMENTATION.md) connects
Star Chart/Omen Lens purchases to already-generated but unopened shelf packs.
It preserves revealed rewards and persisted choices, and adds a distinct generated
Star Chart portrait. All 1,667 units and eight built-production journeys pass;
the evidence ledger retains the 23/24 initial native run and passing three-repeat
startup recheck. The final native rerun passes 24/24 without retries.
Published **v1.0.261004-9** with all independent CI gates and eight hosted
purchase/claim/reload journeys passing. Public manifest/tag match
`835798017843aae57f0ed4267d7589cd85396237`; live artwork hash matches.
This does not close the remaining mechanics/design choices.

The [contextual guidance localization](PROGRESSIVE_HINT_LOCALIZATION.md) closes
the missing hint namespace in all thirteen languages, including localized
acknowledgment and opt-out controls. Rules are unchanged. Local verification
passes 1,655 units, 18 native browser cases, build and 13 release checks.
Language switching preserves queued lessons and deliberately collapsed state;
native-speaker and human newcomer review remain outstanding.
Published **v1.0.261004-8** after independent CI passed all tests and deployment.
Eight built-production and eight hosted desktop/touch journeys pass; public
manifest/tag match `cf2abe22aaad1f8205d79a386283e8cf1b32c26e`.

The [immediate stock-upgrade correction](SHOP_SLOT_IMPLEMENTATION.md) supplies
the third/fourth item on Charter purchase, preserving prior stock and Omen extras.
It also repairs reproduced Orb base-price metadata and adds a generated Abundant
Stock portrait to the shop and discovered Archive. Final full suite passes
1,641 tests, alongside 24 native browser checks, build and 13 release checks.
All 12 built-production purchase/save-repair/reload/play journeys pass. Published
**v1.0.261004-7** with all 1,641 CI tests, 13 release checks, build and deployment
passing. Public manifest/tag match `a42ab1483355eb890362725a00a3862f2702d311`;
all 12 hosted journeys pass. Earlier failures remain in the ledger.

The [sold-slot reroll correction](SHOP_REROLL_IMPLEMENTATION.md) replenishes all
ordinary slots while preserving owned rewards, packs and the Charter. It closes
a core shopping-loop defect: paying to reroll after buying both items left no
visible stock. Fourteen native browser checks, build and release checks pass;
the evidence ledger distinguishes the initial full-unit failures from the clean
affected-test recheck. All eight built-production purchase/reroll/reload/play
journeys pass. Published **v1.0.261004-6** with all 1,631 independent CI tests,
13 release checks, build and deployment passing. Public manifest/tag match
`5546cff319a94bd01afe820730f044f9e64c7c4a`; all eight hosted journeys pass.

The [Charter pricing correction](CHARTER_PRICING_IMPLEMENTATION.md) fixes stale
current-shop quotes after a discount purchase and catalog-based resale values.
Legacy saves repair atomically; purchased receipts and generated pack contents
stay unchanged. Local verification passes 1,626 units, 13 release checks, build,
16 native browser tests and 28 built-production desktop/touch journeys.
Published **v1.0.261004-5**; independent CI passes all tests, release checks,
build and deployment. Public manifest/tag match
`50f61cdfda9833738adaf471f006d91150437680`, and all 28 hosted journeys pass.
This does not complete the broader Charter audit.

The [Showdown art follow-up](SHOWDOWN_ART_IMPLEMENTATION.md) completes the five-boss
portrait set and supplies twenty missing translated identities/rules. Local
verification passes 1,613 units, 13 release checks, build, 30 native browser tests
and 28 production desktop/touch localized inspection/play/reload journeys.
It preserves boss mechanics and full saved snapshots; temporary board staging
remains distinct from persisted engine selection. Published **v1.0.261004-4**;
independent CI passes all 1,613 tests, release checks, build and deployment.
Public manifest/tag match `fd89d3ca467e71c001cf69eb783fc32fd54bd4a6`.
The hosted font-fallback check exposed Russian text clipping. Its wrapping fix
passes all 28 hosted journeys, including four blocked-font phone continuations.
The first hosted failure and failing-before-fix reproduction are retained.

Published [static-route checkpoint](STATIC_ROUTE_IMPLEMENTATION.md) fixes real
Pages 404 responses for known menu/game routes and supplies initial noindex
directives for state screens. All 1,601 local tests, 13 release checks, build,
12 static-browser checks and four production saved-game journeys pass. Independent
CI passes all 1,601 tests, release checks, build and deployment as **v1.0.261004-2**.
Public manifest/tag match `3c38ec4c183162b39b56ffef0c49d5069a1ee667`; 12 hosted
route/guide checks and four hosted saved-game journeys pass. The
[Bell hand-planning follow-up](CLASSIC_HAND_PLANNING.md) also completes
320 matched runs without diagnostic stops. Its 8 versus 5 wins accompany fewer
cleared rounds; no player-facing balance change follows from this mixed result.

Latest published follow-up: [Cerulean Bell](CERULEAN_BELL_IMPLEMENTATION.md) implements
the user's single-current-lock choice, repairs legacy saves, adds generated boss
art/localized rules, and fixes a reproduced drag-release coordinate bug. Eighteen
native browser checks and four production current/legacy desktop/touch journeys
pass. Local suite has 1,575 passes and one five-test worker-start timeout;
its isolated recheck passed four tests and exceeded one test deadline.
Independent CI passes all 1,580 tests, 13 release checks, build and deployment.
Published **v1.0.261004-1**; public manifest/tag match
`3f48a2272f41463924eb5290359f5f3e964de55c`. Four hosted desktop/touch current/legacy
save-repair/play/reload checks pass with zero page errors. The associated
[hand-planning experiment](CLASSIC_HAND_PLANNING.md) is analysis-only and retains
its original deadlock report and subsequent matrix timeout; it is not proof of fun.

Follow-up [purchase availability](SHOP_PURCHASE_AVAILABILITY.md) explains disabled
ordinary offers using actual gold, slots and Flower counts, preserving readable
details and commitment-time guards. 32 browser checks and production desktop/touch
sale/purchase/reload pass. Local suite has 1,542 passes and one worker-start failure;
the missing 11 tests pass separately. Published **v1.0.261003-6** with all 1,553 CI
tests, 13 release checks and deployment passing. Public manifest/tag match
`4bc6fc5800a1999932d823b34d49fddd9e3ffb8f`; hosted desktop/touch blocked offers,
sale-enabled purchases, reload and continuation pass without page errors.

The [owned-build panel](SHOP_BUILD_IMPLEMENTATION.md) exposes the existing sale
workflow where purchases happen: illustrated scrolls, shared hover/focus/tap
rules, physical-copy confirmation, actual capacity and live gold. Six-scroll
phone layouts, protected/Negative copies, cancellation, purchases and exact
save/reload pass through the real browser flow. A new Polished Stone portrait
is shared by shop/inventory/Archive, and five incorrect descriptions are repaired.
The error banner's hidden background layer is also fixed. Final native browser
regression passes 26/26; production desktop/touch sale/reload/continuation passes.
Published **v1.0.261003-5**, with 1,538 CI tests, 13 release checks, build and
deployment passing. Public manifest/tag match
`f5ed840926555df4c2a4ce721773ce4578f8d611`; hosted desktop/touch sale, cancellation,
reload, exact art hash and continuation pass without page errors.
This does not change gameplay balance or establish human enjoyment.

## Current build-aware progression measurement

The opt-in [observed-build shopping comparison](CLASSIC_BUILD_SHOP_BALANCE.md)
now compares 1,280 runs per strategy across all tables/Stakes. The control exactly
reproduces the prior rows. Build-aware purchases/replacements produce 25
rescue-free victories and 49 Act 8 reaches, versus zero for the control, with no
diagnostic stops. Round clears improve on 488 paired runs and worsen on 71.
None of the victories uses a complete hand. This demonstrates some late-run
viability, not human balance or enjoyment; deliberate hand planning and newcomer
observation remain open. All 1,530 local tests and 13 release checks pass.
Published **v1.0.261003-4**: independent CI passes the same gates, production
build and deployment; public manifest/tag match
`57bf59d7133a0c10b68467e15114e3639832e164`.
Player-facing rules and artwork are unchanged.

## Previous all-table progression measurement

The [table/Stake matrix](CLASSIC_TABLE_STAKE_BALANCE.md) now records all 64
combinations on 20 matched seeds: 1,280 real engine runs, 5,271 purchases and
2,748 consumable uses, with no invalid-action or other diagnostic stops. No run
reached Act 8; only seven complete hands occurred in 19,490 plays. These limited
heuristics do not prove human difficulty or enjoyment. The shopping follow-up
above addresses one limitation; broader hand planning and observed newcomer
sessions remain required before tuning. The comparison is analysis-only;
gameplay rules and artwork are unchanged.

## Published defeat-settlement checkpoint

[Final defeat settlement](DEFEAT_SETTLEMENT_IMPLEMENTATION.md) implements the
confirmed Rental-on-defeat/income-win-only rule and adds illustrated localized
result details. Published **v1.0.261003-2**, with 1,490 CI tests, 13 release
checks, desktop/touch result regression and exact hosted debt/save/reload checks
passing. Local timeout failures are retained in its ledger. This does not settle
the other open mechanics choices.

## Published loss-prevention follow-up

The [Phoenix follow-up](PERISHABLE_LIFETIME_IMPLEMENTATION.md#october-2-loss-prevention-follow-up)
closes an unlimited-rescue bug: self-consuming rescuers no longer receive
Eternal in new shop rolls, and a rescue must actually spend an eligible copy.
Crimson Heart suppression now applies to these powers. Legacy protected copies
remain loadable, with localized conflict and sale-lock explanations. Seven
failing-first cases were repaired; full pre-caption units passed 1,477/1,477,
the final mechanics browser batch passed 22/22, and localized-caption checks
passed 6/6. Final post-caption units also passed 1,477/1,477, with TypeScript,
lint, the Pages-base build and 13 release checks green. Production desktop/touch
defeat/rescue, exact-copy consumption, warning layout and reload checks passed
without page errors. Published **v1.0.261003-1**: independent CI passed all
1,477 tests and 13 release checks, then deployed
`55a39eb003d6c69375f81a3ec6c478f805c24b47`. Public manifest/tag/menu match;
all four hosted desktop/touch legacy-defeat and eligible-copy rescue checks
passed, with exact reload and no page errors. Other mechanics choices and the
broader completion audit remain open.

## Published Perishable lifetime and Phoenix checkpoint

The [lifetime checkpoint](PERISHABLE_LIFETIME_IMPLEMENTATION.md), published as
**v1.0.260929-4**, now preserves
five complete played rounds after purchase, pays the last round before expiry,
and does not spend lifetime on skips. Phoenix has a new generated transparent
portrait. Focused units passed 108 checks across the final run and an unchanged
worker-start-failure recheck. Final browser regression passed **16/16**, and
TypeScript, the Pages-base build, and production desktop/320px touch checks
passed. Earlier timeouts and a test checkpoint race remain in the ledger.
Independent CI passed **1,466/1,466 tests** and **13/13 release checks**, then
deployed `d96e84c84ff6e9243e9f7588c73e390c118b016a`. Public manifest/tag/menu
version match. Hosted desktop/touch skip preservation, Phoenix art, last-round
rescue/payout and exact reload passed without page errors. Eligibility/balance
choices and broader implementation work remain open.

## Published combined Decree stickers

The [combined-sticker checkpoint](COMBINED_STICKERS_IMPLEMENTATION.md), published
as **v1.0.260929-3**,
retains Rental alongside Eternal/Perishable through the live shop, owned-copy
effects, actual round payouts, save/restore and localized details. A native
mobile first-paint overflow was also repaired. Final desktop/touch browser
regression passed **60/60**. Independent CI passed **1,459/1,459 tests** and
deployed `e18c9f46ca05860c3932855dbfcdae2130662143`. Public manifest/tag and
visible version match; hosted desktop/touch play, combined reload, protected
sale and expired-copy sale/reload passed without JavaScript errors. The earlier
full local unit run had nine five-second timeouts, and all eight affected files
passed **78/78 unchanged** afterward; both results are retained in the ledger.

## Published Decree expiry and modifier details

Perishable counters now stop at zero; negative legacy counters were already
accepted by the save parser (the earlier save-failure claim was incorrect). Owned
and shop scrolls share localized edition, Rental and expiry descriptions, and
face-down Eternal sale labels no longer reveal the item name. Popup reflow and
motion preferences are covered on short screens. Five failing-first regressions
were repaired. Screenshot review found that Go3v2 painted Russian titles blank;
Latin-only coverage and UI-font fallback now pass actual pixel-ink checks and
visual inspection. Final browser regression passed **48/48**, as did strict
TypeScript, lint, 13 release checks, Pages build and production desktop/touch
play/expiry/sale/reload checks. A **1,442-test full pass** preceded the font fix;
the post-font full run had **1,439 passes / 3 timeouts**, with the same files
then passing **6/6** unchanged. Original failures are retained. Published
**v1.0.260929-2**: independent CI passed all **1,442/1,442 tests** and deployed
`f83120095f653d7b0e57b6d68989939f90e03593`. Public manifest/tag match, and
hosted desktop/touch modifier, title, expiry/sale/reload and Table Loop checks
passed without JavaScript errors. Combined stickers and the broader mechanics
and player-experience audit remain open. See [details evidence](DECREE_DETAILS_IMPLEMENTATION.md).

## Published physical Decree identity checkpoint

Duplicate scrolls now have durable physical identities for exact-copy sales,
edition changes, removal, Crimson Heart suppression and Amber Acorn ordering.
Copied Perishable timers are independent. Hex now destroys other Decrees as
advertised; Ankh preserves its chosen original and copy, not every same-name
sibling. Eternal/Ash protection and Negative capacity remain accounted for.
Legacy saves migrate without consuming RNG, and incomplete new identity data is
rejected. A new generated Half Suited portrait is integrated through the existing
catalog-based art lookup. The [identity ledger](DECREE_IDENTITY_IMPLEMENTATION.md)
records the exact prompt, asset, baseline failures and verification limits.
Final verification passed **1,435/1,435 tests in 122 files**, **38/38 desktop/touch
browser cases**, strict TypeScript, targeted lint, 13 release checks and the
Pages-base build. Production desktop/320px touch checks passed real play, legacy
migration, exact-copy sale and resume, and Table Loop continuation without page
errors. The ledger retains earlier failures, including a genuine durable-migration
defect repaired with three failing-first tests and a documentation-triggered Vite
reload during verification. Published **v1.0.260929-1** from implementation
`4290516`; independent CI passed all 1,435 tests and deployed built/tag commit
`c750f72c01c96576cd2e01d35f0626d3112b31c9`. Public manifest/tag and portrait
hash match. Hosted desktop and touch checks passed migration, sale, play and
continuation without JavaScript errors. This does not resolve other mechanics
choices or establish whole-project completion.

## Latest save-aware update checkpoint

Published **v1.0.260926-6**: save-aware PWA update consent passes **10/10 real
two-build desktop/touch upgrade scenarios**, including initially denied storage,
failed-save recovery, other-window refusal and exact offline continuation. Menu
navigation no longer waits for the entire tile-art preload, and denied tutorial
preference storage no longer crashes that menu. Static checks and both production
builds and **13/13 release-workflow checks** passed. After a measured drop in
host load, the fresh complete regression passed **1,407/1,407 tests in 121 files**
with unchanged source, worker count, assertions and deadlines. The first run's
ten timeout failures remain recorded. Independent CI passed all tests and deployed
`89fdd2c222bed60429f5498c8e30353df539699d`; public manifest/tag and the worker hook
match. Hosted desktop/touch Classic play/reload/menu Resume and Table Loop
continuation passed without JavaScript errors. No temporary CI branch was needed.
Broader project completion and mechanics choices remain open. See
[the update ledger](PWA_UPDATE_IMPLEMENTATION.md) for retained failures and limits.

## Published pack-choice checkpoint

Published **v1.0.260926-5** repairs catalog-versus-choice identity in pack
generation and rendering. Consumable alternatives are now used before the
existing rarity-exhaustion fallback; stable choice keys and index-based rendering
preserve distinct selection even for legacy colliding IDs. Existing generated
Decree art now appears in the live reward dialog. **1,370/1,370 units** and
**16/16 desktop/touch browser checks**, TypeScript, lint and production build
passed. Independent CI passed all tests and release checks, then deployed
`0298f19ff921c83bf3410befe2472c2a6052292c`; the public manifest/tag and hosted
desktop/touch gameplay/resume checks match. [Pack-choice evidence](PACK_IDENTITY_IMPLEMENTATION.md)
records six reproduced failures, corrected test assumptions, and compatibility
boundaries. No new bitmap was needed; existing artwork is reused. Whole-project
completion and pending design choices remain open.

## Latest illustrated Archive checkpoint

Published **v1.0.260926-4** adds five generated starter Decree portraits and
accurate localized extra-play copy, plus native Archive dialog behavior and a
reproduced Enter-activation fix. **1,356/1,356 units**, **18/18 desktop/touch
browser checks**, 13 release checks, strict TypeScript, lint and production build
passed. Independent CI deployed built/tag commit
`6b3b6d66c0a706ad97bb12ab05908d239349328a`; public manifest and image hashes
match. Hosted localized Archive inspection and both gameplay loops passed on
desktop/touch without page errors. The imagegen skill guided transparent scroll
art and lightweight WebP integration; model identity is not exposed. Exact prompts,
original/output paths, failures and remaining localization scope are recorded in
[the art ledger](STARTER_DECREE_ART.md). Broader completion and mechanics choices
remain open; no default-mode switch was made.

## Published Classic autosave/resume checkpoint

The application checkpoint is deployed as **v1.0.260926-1**: final full regression passed
**1,323/1,323 tests in 112 files**, with **30/30 desktop/touch browser checks**
and **2/2 short-phone ornamental-frame checks**, no retries. Strict TypeScript
and the Pages-base production/PWA build passed. Normal cross-tab profile handoff
and forecast mutation defects were reproduced and repaired. The PWA update
registration now respects the save-before-reload prompt. Independent CI passed all
1,323 tests, release checks, build and Pages deployment. Public manifest/tag match
`aa5563779a3988c841f9554d26fdaf0848434117`; hosted desktop/touch Classic
play/reload/menu Resume and Table Loop continuation passed without page errors.
Installed-PWA and cross-store crash recovery are not certified. The earlier
failures below are historical evidence, not the final test status.

Historical pre-publication evidence: the complete engine/shop/meta snapshot, strict public
save parser, revision/lease-protected storage and settled-event persistence
coordinator now exist locally. Full regression finished **1,302 passed / 1 existing
balance-command timeout**; the unchanged command file then passed **22/22**.
The final **98/98 new persistence tests**, including every boss, Charter, terminal
result and transient-read recovery, passed. The Pages-base production/PWA build
also passed; no native-lock/reload/browser proof is claimed from these unit checks.
Startup, localized Resume/error controls, reload routing and reset integration
are now implemented locally. Browser checks reached **29/30** after fixing a
reproduced fastest-win hydration defect; the remaining desktop case lost its
execution context during navigation. The final checks and publication above
supersede that intermediate status. The
[working ledger](CLASSIC_RUN_PERSISTENCE.md#whole-run-and-storage-implementation)
retains the initial fixture/edition/flower-identifier failures and the separate
profile/checkpoint crash-atomicity limitation.

Internal restoration now keeps exact random cursors, remaining Omen interest
effects, visit discounts/free rerolls and usable shop/pack Tile instances.
Staged Omen construction no longer clears live tags. Detached shop/pack
snapshots retain purchases and one-time reward claims. Full units passed
**1,207/1,207 in 107 files**, with **18/18 browser regressions**, strict
TypeScript, targeted lint and a Pages-base production/PWA build. Nine defects
were reproduced before repair; the [save implementation ledger](CLASSIC_RUN_PERSISTENCE.md)
records those failures and a corrected multi-stream comparison fixture.
This is prerequisite code, **not a working Classic autosave/resume feature**.
At that published prerequisite checkpoint, the enclosing engine/shop/meta
snapshot, durable storage and recovery controls were still missing. Local
implementation is recorded above. No new art is warranted for these internal
codecs; existing generated artwork is unchanged. Deployed as **v1.0.260923-8**
after independent CI and hosted desktop/touch gameplay checks passed, with a
matching public manifest/tag. The failed v7 attempt and its localization-test
race are retained in the ledger; the corrected full two-worker run passed all
1,207 tests without widening deadlines or modifying animation/scoring behavior.

## Preceding table-setup checkpoint

Table selection now has localized names/rules/lock hints/accessibility labels,
an optional cumulative-rules disclosure, native dialog focus isolation and roving
keyboard controls. Rules and illustrated cards share a scroll area; short CJK
phone layouts keep action labels intact. Confirmed table/difficulty choices now
survive reload with validated selectors and recomputed modifiers. Cancel remains
non-mutating and changes do not affect an existing run's captured rules.
The actual saved Dragon's Den/Gold selection starts a 731-point Classic round.
All **1,165/1,165 units in 106 files**, **26/26 browser checks**, and **6/6 final
wording follow-up checks** passed, with strict TypeScript, targeted lint and the
production/PWA build. [Table setup evidence](TABLE_SETUP_IMPLEMENTATION.md)
retains initial defects and fixture/timeouts. Deployed as **v1.0.260923-6** after
independent CI passed all tests/build. The public manifest/tag and fresh hosted
desktop/touch saved-setup, localized rules and gameplay checks match.
Existing generated table artwork is preserved. This does not add Classic run
persistence or settle the outstanding mechanics choices.

## Preceding Full Unlock checkpoint

The documented Full Unlock profile option now has a player-facing confirmation,
persistent access to all catalog unlocks/tables/stakes, and achievement-tracking
suppression. Existing awards stay; actual purchases still cost gold and Charter
upgrades still need a current-run base. Full reset returns to earned progression;
partial resets do not. Activation and reset failures roll back and report errors.
An existing JSON hydration bug for unset fastest-win records is also fixed.
Final full regression passed **1,141/1,141 in 103 files**, **12/12 browser checks**
and **13/13 release-workflow checks**. The [feature ledger](FULL_UNLOCK_IMPLEMENTATION.md)
retains prior failures and exact scope. Strict TypeScript, targeted lint and the
production/PWA build passed. Deployed as **v1.0.260923-5** after independent CI
passed all tests/build; public manifest/tag and fresh desktop/touch profile and
gameplay checks match. Main includes the workflow's version commit.
All thirteen locales have the new consent/status/error copy. English-only stake
descriptions are addressed above; native-speaker review and wider implementation
remain open.

## Preceding Charter-progression checkpoint

Published follow-up: Plentiful Stock no longer unlocks from gold penalties. Typed
payment categories distinguish purchases/rerolls from losses while retaining
historic totals and unlocks. Its new generated scroll portrait appears in shop
and discovered Archive views; the imagegen skill guided transparent, text-free,
non-destructive integration. The specific image model identity is unavailable.
All **1,129/1,129 units in 102 files**, **16/16 desktop/touch browser checks**,
strict TypeScript, targeted lint and production/PWA build passed. Rental fees
remain a separate user question; explicit purchases/rerolls are currently counted.
Deployed as **v1.0.260923-4** after independent CI passed all units and the build.
The public manifest/tag, new portrait hash and hosted desktop/touch gameplay
checks match. Full Unlock profile controls are addressed above; broader
implementation remains open.

Published follow-up: canonical offer/purchase eligibility now checks the persistent
unlock, current-run base and non-ownership for every upgraded Charter. The
application supplies live progress without coupling pure engines to stores.
Liquidation retains a qualifying past run rather than demanding ten again after
acquiring its base. Returning players retain recorded past upgrade purchases,
without granting eligibility from Archive-only discovery. Final full regression
passed **1,120/1,120 in 101 files**, all **44/44 browser checks** passed, and
**10/10 final purchase/reload/legacy-hydration cases** passed. Strict TypeScript,
targeted lint and the production/PWA build passed. Deployed as **v1.0.260923-3**;
independent CI passed all 1,120 units and the build. The public manifest/tag and
fresh desktop/touch gameplay checks match. This checkpoint does not resolve the
separate mechanics choices or establish whole-project completion.

Preceding published follow-up: pack-use provenance now follows the acquired Seal/Orb instance
through successful consumption. Omen Lens/Observatory no longer count ordinary
purchases or generated copies toward their pack-specific prerequisites. Existing
unlocks are preserved. Eight desktop/touch English/Spanish browser flows passed;
all **1,097/1,097 units in 100 files**, strict TypeScript, targeted lint and the
production/PWA build passed. Deployed as **v1.0.260923-2** with matching public
manifest/tag and fresh desktop/touch gameplay checks.
An optional user question asks whether Observatory should multiply only its held
Orbs' matching Yaku or all hands; current scoring is unchanged pending a choice.

September 22: actual maximum-interest payouts now drive Money Tree's prerequisite,
including raised Charter/Omen caps and zero/blocked settlements. A separate
current streak resets on shortfalls, skips, defeats and new runs; lifetime best
and existing unlocks persist. Legacy saves do not invent a current streak.
Radiant Edge and Full Palette now observe settled build ownership/capacity, not
temporary intermediate effects. Money Tree has new generated shop/Archive art.
Combined full units passed **1,089/1,089 in 99 files**. Strict TypeScript, targeted
lint and thirteen release-workflow checks passed. Browser rerun: **9/10**, then
**3/3** unchanged repetitions of the startup-timeout scenario. The Pages-base
production/PWA build passed. Earlier interest-only evidence remains
in the linked ledger. The checkpoint is deployed as **v1.0.260923-1**, with a
matching public manifest/tag and hosted desktop/touch gameplay checks. This is
not a claim of complete Charter progression.
[Evidence and remaining audit](CHARTER_PROGRESSION_IMPLEMENTATION.md)
record the repaired upgrade gates and pack provenance, remaining Rental-fee choice,
and the Observatory rule conflict. An optional question asks whether Table Loop
should become the primary Play mode; no answer has been assumed.

## Published Omen effects and release checkpoint

September 22: live interest durations and Season locks remain inspectable after
their acquisition tags are consumed. Each deferred Rare+ offer shows its own
five-gold fee. Skips age prior round effects before earning new rewards, and
Season locks clear synchronously. All thirteen locales have the new messages.
Three engine regressions were reproduced before the fix. Focused tests passed
66/66; the final unchanged full suite passed **1,067/1,067 in 96 files** after an
initial six-timeout run. All **28/28 browser checks** passed, including real
Table Loop victory/defeat and Merchant swap/reload flows on desktop and mobile.
Strict TypeScript, targeted lint, selected formatting and all thirteen release
workflow checks passed. Spanish desktop/touch panels were visually reviewed.
[Omen effects evidence](OMEN_EFFECTS_IMPLEMENTATION.md) records exact coverage.
The local production build was interrupted under extreme host load after
TypeScript completed. Clean-runner tests, the production/PWA build and provenance
checks then passed, and the authorized merge deployed **v1.0.260922-1**.
The public manifest matches the remote tag and built commit. Hosted desktop and
320px touch checks passed actual Table Loop placement, retained actions after
reload, displayed version and Spanish Classic loading without page errors.
The feature branch is retained and fully contained in main. None of the separate
mechanics proposals is treated as approved by this publication; the overall
implementation goal remains in progress. [Release ledger](RELEASE_IMPLEMENTATION.md).

## Preceding Double Omen checkpoint

September 22: Double Omen is in both skip pools and banks visible copy instances.
Atomic acquisition preserves original/copied rewards and consumes each armed
Double once; instant payouts scale by actual acquisition count. Existing delayed
consumers deliver both rewards and retain their costs. The optional pending-Omen
disclosure and new item text cover all thirteen locales. A new built-in generated
jade-tag illustration is integrated into gameplay and discovered Archive views.
The image-generation skill guided style, transparency and non-destructive asset
integration; the tool's specific model identity is unavailable.

Initial tests reproduced **8 failures / 1 pass**. Full units now pass **1049/1049
in 95 files**. First browsers: **12/14**, with startup readiness and premature shop
inspection failures. Second browsers after waiting for shop-open and adding both
purchases: **12/14**, with two late test timeouts. Both timed-out scenarios passed
three unchanged isolated repetitions each (**6/6**); their timing causes remain
unproven. Spanish desktop/touch screenshots were reviewed. Strict TypeScript and
targeted lint passed. [Double Omen evidence](DOUBLE_OMEN_IMPLEMENTATION.md)
records exact scope, failures, seeded catalog shifts and artwork prompt/hash.

The Pages-base production/PWA build passed: 342 modules, entry
`index-Bmd6daKf.js`, 268 precache entries / 63,921.39 KiB. The image adds about
1.2 MiB to the offline bundle; existing large-chunk/Browserslist warnings remain.

The workspace was clean at the start on `table-loop-prototype`, commit `bae2f71`.
No Git publication was performed in this checkpoint. The overall goal remains
active; the separate mechanics proposals have not been treated as approval.

## Preceding beginner-guidance checkpoint

September 19: forecast explanations distinguish all-grouped, mixed, all-loose and
complete selections using metadata from the actual scored parse, including Honor
Transmutation and suppressed tile values. Loose penalties explicitly refer to
base tile points. Hidden selections reveal neither grouping nor forecast.
Localized selection/declaration headings take priority over idle coach advice;
matched-pattern headings no longer repeat the body’s shape bonus. No new popup,
timer or artwork is needed for this live numerical explanation.

Initial metadata tests failed **8/8**; the first expanded focused run passed
**62/63**, with its accessibility-label query subsequently corrected. Before
the heading cleanup, full units passed **1009/1009**, and browser checks passed
**16/16**. Final full units passed **1022/1022 in 93 files**. The final browser
set retained **15 passes / 1 short-phone timeout**; all four new guidance and
four secondary-scoring journeys passed. Three unchanged isolated repetitions of
the timeout scenario passed **3/3**, without retries or deadline changes. Its
cause remains unproven. Spanish desktop/touch screenshots were reviewed.
Strict TypeScript, targeted lint, formatting and the Pages-base production build
passed: 340 modules, entry `index-BTk8H3sQ.js`, 266 precache entries / 62,689.90 KiB.
Existing large-chunk and stale Browserslist warnings remain.
[Guidance evidence](BEGINNER_GUIDE_IMPLEMENTATION.md) records exact boundaries
and artifacts. This is not proof of newcomer comprehension or whole-project fun.

The requested mechanics recommendations were presented as proposals, not approval.
At this checkpoint Double Omen was the next confirmed gap: it was absent from the
obtainable catalog, and an isolated `copyNextTag()` → `addTag('omen_of_rivers')`
probe leaves one active/queued tag while spending the copy flag. Source inspection
shows the second store update overwrites the duplicate using the old state.
Connecting acquisition and immediate/delayed reward delivery still requires
implementation and tests; the subsequent checkpoint above supplies that repair. Existing generated art is
preserved; nothing is committed, merged, pushed or deployed.

## Preceding score-localization checkpoint

September 19: forecast and settled multipliers now share localized decimal/compact
formatting, with exact-value inspection preserved. Remaining-point hints format
their numbers in all thirteen languages, and score progress uses localized labels
and valid numeric bounds. Sixteen failures were reproduced before the correction;
the expanded full suite passed **985/985 in 90 files**. The first browser set
retained **12 passes / 8 new fixture-assertion failures**; the corrected layout
set passed **8/8** without retries or timeout changes. Spanish screenshots were
reviewed. Strict TypeScript, targeted lint and the Pages-base build passed.
[HUD evidence](FORECAST_UI_IMPLEMENTATION.md) preserves the failure
and exact acquisition/geometry boundaries.

The random-copy audit confirms that Doppelganger chooses by position, not seeded
randomness; the docs do not specify target-refresh timing. A once-per-round versus
acquisition-time choice was requested and is not assumed. Screenshot review also
found that valid tactical groups can receive the misleading loose-tile penalty
hint. That clarity issue is addressed by the guidance checkpoint above while the
copying choice remains pending. Existing generated art is preserved; nothing is published and
the overall objective remains active.

## Preceding Decree copy-rule checkpoint

September 19: main scoring preserves physical copy targets, so suppression does
not cause Blueprint or Brainstorm to skip to another power. Brainstorm in the
leftmost slot cannot copy its right-hand neighbor. Resource copies now include
positive and negative rack, discard and extra-hand changes, closing the exploit
where Ancient Scroll/Sacrifice benefits were copied without their costs.

The initial integration run reproduced **16 failures / 3 passes**. The focused
set then passed **89/89**, the full suite **964/964 in 89 files**, and all
**20/20 desktop/touch browser checks** passed. Paid controlled-offer journeys
verify next-round resources and settled scoring in English and Spanish. Reviewed
screenshots preserve the existing illustrated UI; no new bitmap was needed.
Strict TypeScript, targeted lint and the Pages-base production build passed.
[Copy evidence](DECREE_COPY_IMPLEMENTATION.md) records boundaries and remaining
random-copy/resource-lifecycle questions. Nothing is committed, merged, pushed
or deployed. The full project objective remains active.

## Preceding secondary Decree scoring checkpoint

September 19: Frostbite now scales the extra Yaku multiplier supplied by Decrees,
preserving native Yaku, Mandate tier reductions and table bonuses. Disabled Yaku,
retrigger and amplifier effects are excluded from preview and payment. Secondary
copy resolution respects physical neighbors, including copied Echo Dimension.

Ten integration failures were reproduced before the fix. The final full unit
suite passed **945/945 in 88 files**; all **18/18 desktop/touch browser checks**
passed with no retries or deadline changes. Spanish score/disabled-inspector
screenshots were reviewed. Strict TypeScript, targeted lint and the Pages-base
build passed. [Secondary scoring evidence](SECONDARY_SCORING_IMPLEMENTATION.md)
records the remaining fractional-retrigger choice and the ordinary copy-order
audit subsequently addressed above.
Existing generated art remains; no new bitmap was required. Nothing is committed,
merged, pushed or deployed, and the full project objective remains active.

## Preceding Decree economy and artwork checkpoint

September 19: Wealth Engine now counts owned Decrees instead of paying a flat 1G.
Gold copying and copied multipliers resolve physical neighbors without skipping
suppressed targets; duplicate Blueprint instances use their own positions. The
new generated Wealth Engine portrait is connected to Shop, owned inventory,
Archive and detail views, while hidden identity still uses generic art. Spanish
wording now uses unambiguous G currency alongside the existing localized name.

The full suite passed **928/928** before the final wording/new-test follow-up,
which passed **31/31 targeted checks**. The browser set passed **20/20**; four
final wording journeys passed **4/4** against a clean server after a traced
hot-reload module-identity problem. [Economy/art evidence](DECREE_ECONOMY_IMPLEMENTATION.md)
records original fixture failures, exact prompt, reviewed screenshots and model-ID
limitations. Treasure Hunter timing, further effect semantics, human fun testing,
main/default promotion and deployment remain open. No Git publication occurred.
Strict TypeScript, targeted lint and the Pages-base build passed. The new original
PNG adds about 2.5 MiB to the offline bundle; performance remains an open concern.

## Preceding Frostbite gold checkpoint

September 19: shared gold settlement now weakens only Decree contributions,
combines fractions before integer rounding, excludes disabled Decrees and applies
the reward multiplier consistently to tile, consumable, discard and round paths.
Prices and penalties are unchanged. Cash-out labels explain fractional adjustment
in all thirteen locales; existing illustrated gold and Decree assets are retained.

The full suite finished **912 passed / 2 balance-command timeouts**. The unchanged
22-case command file then passed. All **24/24 desktop/touch browser checks** passed,
including real purchases after payout, score regressions and the user-approved
Merchant rack-for-river swap with reload. Spanish receipt screenshots were reviewed.
Strict TypeScript, targeted lint and the Pages-base production build passed.
[Gold settlement evidence](FROSTBITE_GOLD_IMPLEMENTATION.md) preserves the initial
failures, artifact paths and unresolved special gold scaling/copying, retrigger,
Yaku and binary-effect scope. No commit, merge, push or deployment occurred.

## Preceding Frostbite scoring checkpoint

September 19: Frostbite now halves Decree flat-point bonuses as well as its
main multiplier contribution, without halving tile bonuses. Repeated Frostbites
stack; fractional subtotals survive final counter presentation. The inspector
copy is updated in all 13 locales. No new artwork was needed for the rule;
existing illustrated tiles/Decrees and the new guidebook are preserved.

Six engine failures and three stacking/counter failures were reproduced before
their fixes. The additive correction passed **892/892 full units in 84 files**
(309.78 seconds); the final stacking/counter changes then passed **121/121 targeted
checks** in eight files (57.64 seconds). The broader browser subset finished
**21 passed / 1 existing normal-animation timeout** (318.05 seconds). The unchanged
timed-out journey and final visible-rule/payout checks subsequently passed **6/6**
(64.40 seconds), with no retry or deadline changes. This does not erase the
original timeout; its cause remains unproven. Spanish mobile screenshots were
reviewed. Strict TypeScript, targeted lint/formatting and the Pages-base build passed.

[Frostbite evidence](FROSTBITE_IMPLEMENTATION.md) records exact coverage and the
still-open gold, retrigger, Yaku and non-numeric effect semantics. The original
all-effects requirement is not reduced to these two scoring channels. The owned
server is stopped. No commit, merge, push or deployment occurred; project
completion, the other mechanics/UX gaps and main/default promotion remain open.

## Preceding illustrated-guide checkpoint

September 19: the visual primer's obsolete 10/20/30/50 bonuses now read the
engine's 15/30/40/65 table directly. New explanations distinguish shape bonuses
from the actual forecast in all 13 locales. Tile examples stack on phones,
family names wrap, and the dialog has one scroll area. A new generated jade/ivory
guidebook marks the explicit learning control and primer; the real tile examples
remain. The original project-owned PNG and exact built-in prompt are recorded
in [guide evidence](BEGINNER_GUIDE_IMPLEMENTATION.md), including the unavailable
model-ID limitation.

**885/885 full units in 83 files** and **26/26 targeted browser checks** passed,
along with strict TypeScript, targeted lint/formatting and the Pages-base build.
Browser checks include five guide layouts/languages in desktop and touch contexts,
plus playable hints, Shop actions and paid-score regressions. No retry or timeout
increase was used. Screenshots were reviewed. The owned server is stopped; no
commit, merge, push or deployment occurred. Other mechanics, human fun, remaining
localization and main/default promotion remain open.

## Preceding in-flow tutorial checkpoint

September 19: Classic Play and Shop hints now sit in their own layout space,
collapse through native disclosure and remain readable without a countdown.
First-move/scoring lessons precede bonus tips; a completed first move cannot
produce a late introductory hint. Focus, opt-out, queue persistence and localized
copy updates are covered. Shorter first instructions keep the visual primer
nearby, and all existing artwork remains. The expanded regression run also
found and fixed animated string interpolation dropping multiplier decimal zeros.

**879/879 full units in 83 files** passed (36.21 seconds). **26/26 targeted browser
checks** passed (81.39 seconds), including playing with hints open, Shop purchases
and continuation, the existing visual primer/reset, and score regressions. The
final malformed-history preference safeguard was added afterward and is covered
by final units/build, not another browser run. Strict TypeScript, targeted lint,
formatting and the Pages-base build passed. [Tutorial evidence](TUTORIAL_CARD_IMPLEMENTATION.md)
records the failed ordering/shop/format checks, fixtures and reviewed screenshots.

The owned server is stopped. No commit, merge, push or deployment occurred.
Secondary hint localization, human newcomer testing, physical-device review,
broader mechanics/progression and main/default promotion remain open.

## Preceding settled-score checkpoint

September 19: the Classic equation now displays the engine's settled last play,
not an already-paid score multiplied again by later Yaku reveals. The reproduced
585/1,521 mismatch is fixed. Atomic receipts preserve exact bonuses, penalties,
zero-paid plays and independent consecutive hands. A native disclosure exposes
the full equation; new labels are supplied in all 13 locales.

**869/869 full units in 83 files** passed (32.27 seconds). **14/14 targeted
browser checks** passed (55.6 seconds), followed by **6/6 final scoring journeys**
with tutorial opt-out and unobscured-result checks (42.8 seconds). Screenshot
review exposed a delayed first-move tip covering the animated mobile result;
the final score fixture dismisses it through the real control, but the tutorial's
general placement still needs work. Strict TypeScript, targeted ESLint, formatting
and the Pages-base production build passed. See [settlement evidence](SCORE_SETTLEMENT_IMPLEMENTATION.md)
for coverage, failures, artifacts and limits. Existing generated art is preserved.

The owned test server is stopped. No commit, merge, push or deployment occurred.
Broader mechanics, localization, newcomer enjoyment, physical-device review and
main/default promotion remain open; this is not project completion.

## Preceding responsive score UI checkpoint

September 12: forecast and score-panel numbers no longer compete for a single
row or get clipped by a fixed short-screen height. Large values use localized
compact notation, with native touch/keyboard disclosure of exact figures.
Mobile reuses translated action labels, and score counters/popups respect both
app and system reduced motion. Existing colors and generated artwork remain.

**861/861 full units in 81 files** passed (446.59 seconds). **24/24 targeted
gameplay/browser checks** passed (187.20 seconds), followed by **8/8 final layout
checks** after word-wrapping/font refinements and disclosure cleanup (34.30
seconds). Both browser runs used one worker, original timeouts and no retries.
The final Spanish mobile forecast and paid-score images were reviewed. Strict
TypeScript, the Pages-base build and targeted ESLint passed; existing bundle-size
and Browserslist warnings remain. Final build: 336 modules, entry
`index-CvPgTPq9.js`, 264 precache entries / 58,599.42 KiB.

[Score UI evidence](FORECAST_UI_IMPLEMENTATION.md) records the initial loading
timeout, corrected frozen-object fixture, reproduced overflow, screenshot-led
scope expansion, failed discard drag, static-popup completion correction and
final verification boundaries. No earlier failed run is relabeled green.
The full repository browser/release/production suites were not rerun here.

The owned test server is stopped. No commit, merge, push or deployment occurred.
The separate hand/Yaku equation audit was open at this historical checkpoint;
the September 19 settlement section above records its fix and verification.
Broader mechanics, localization, human-fun and real-device checks and
main/default promotion remain open.

## Current Chrysanthemum/Winter checkpoint

Historical checkpoint, superseded by the score-UI verification above.

September 12: the explicit concealed-hand Flower/Winter interaction now reaches
authoritative preview and committed scoring. Every normal Winter factor is
omitted when Chrysanthemum is active; effective Drought suppression and protective
Decrees are shared with Flower scoring. Other Season effects and round cleanup
are preserved. No new popup or generated bitmap is needed for this rule.

The full units finished **843 passed / 1 timed out in 79 files** (648.14 seconds).
The unchanged beginner-guide test and eleven Winter cases then passed **12/12**
(19.00 seconds), with no timeout adjustment. The initial browser subset finished
**29 passed / 5 failed**: four new exact-text expectations omitted the existing
forecast plus sign, and one existing mobile Spanish dialog test timed out.
All sixteen interaction and four Merchant purchase/swap/reload cases passed.
After correcting only the new expected text, the Flora file finished **13 passed /
1 timed out** (148.65 seconds), including all four new Winter gameplay cases.
The repeated mobile dialog timeout occurred at screenshot capture after its
three-viewport geometry checks; its cause remains unproven. Neither failed run
is relabeled green. [Winter evidence](WINTER_FLOWER_IMPLEMENTATION.md) records
fixtures, exact coverage and retained artifacts.

Strict TypeScript and the Pages-base build passed (334 modules, 264 precache
entries / 58,596.19 KiB). Existing large-chunk/Browserslist warnings remain.
Spanish desktop/mobile screenshots were reviewed; the billion-point fixture
exposes cramped compact-forecast text and a remaining English PLAY label.
The owned test server is stopped. No commit, merge, push or deployment occurred.
Remaining mechanics, main/default promotion, human playtesting, localization,
real-device accessibility and deployed upgrades are still open.

## Current on-demand screen checkpoint

Historical checkpoint, superseded by the Winter verification above.

September 12: all nine screens now load on demand, with a localized, motion-safe
fallback that keeps URL-language synchronization mounted during downloads. The
English menu requests 1,055,338 bytes of JavaScript; direct Table Loop requests
870,918, versus the preceding 1,389,080-byte entry/registration pair. These are
24.0% / 37.3% code-size reductions, not measured loading-time improvements.

**833/833 full units in 78 files** passed (145.03 seconds). The full browser run
finished **233 passed / 1 timed out / 10 skipped** (23.6 minutes), without retries.
All 117 mobile cases passed. The desktop 320×568 rack interaction hit its original
60-second timeout after successfully staging all tiles. With no source or test
changes, a follow-up passed **4/4** repeated desktop/mobile cases (47.2 seconds),
with traces and no retries. Its cause remains unproven; the full run is not
retroactively green. [The evidence record](ROUTE_LOADING_IMPLEMENTATION.md)
contains the trace findings, actual timings and retained artifacts.

The ten production-only skips passed separately alongside the public guides:
**18/18 production checks** (27.3 seconds), including actual offline loading of
unvisited routes/scrolls/guides and recovery from a failed module download without
losing a real saved run. Four additional browser measurements recorded requested
script bytes. The final mobile Spanish loading screenshot was visually reviewed.

Strict TypeScript and the Pages-base build passed: 334 modules, entry
`index-BLLkton_.js` (750.79 kB / 227.30 kB gzip), **264 precache entries /
58,596.00 KiB**. All artwork and offline content remain included. The large
entry, approximately 57 MiB offline install and stale Browserslist warning remain.
Targeted ESLint passed with zero errors / six existing router export warnings;
repository-wide lint was not rerun. **13/13 local release-workflow checks** also
passed (136.69 seconds) in temporary fixture repositories, without touching this
repository's history or GitHub.

No commit, merge, push, deployment or Search Console action occurred. Main/default
promotion awaits the user. Remaining mechanics/rule conflicts, human-fun checks,
translations, multi-tab saves, real-device/Safari testing and live worker upgrades
are still open. This pass preserves the generated art rather than generating a
new bitmap for a loading indicator better expressed in CSS.

## Current Merchant and Table Loop release-preparation checkpoint

Historical checkpoint, superseded by the on-demand screen verification above.

September 12: **830/830 full unit tests across 77 files** passed with one thread
worker (81.83 seconds), using the original test timeouts. **70/70 targeted browser
checks** passed without retries (2.7 minutes): the entire Table Loop browser file,
UI-only victory/defeat journeys, English/Spanish Merchant swaps, tile-detail
accessibility and third-Flower collection, in desktop and mobile Chromium.

The final Pages-base production build also passed **8/8 public-guide checks**
without retries (18.1 seconds), including no-JavaScript pages, metadata/images,
320/768/1440 layouts, enlarged root text, keyboard focus and menu-to-practice
navigation. These are targeted browser suites, not the full repository suite.

Strict TypeScript and the Pages-base build passed: 333 modules, **236 precache
entries / 58,587.01 KiB**, JavaScript `index-DuPsMlZD.js` at 1,383.32 kB
(393.24 kB gzip). TypeScript was rerun after adding the final component test.
Targeted ESLint passed. Large-chunk and stale Browserslist warnings remain;
no performance score or deployed PWA upgrade claim is made.

The approved Merchant rule exchanges one selected rack tile for a river tile
once per round without spending actions, redraws or gold. Version-1 saves retain
their original recovery replay; successful subsequent saves use version 2.
Rejected actions preserve pending offers. All ten Decrees now have their own
scroll illustrations. Screenshot review also led to a touch-tooltip fix; the
final Spanish mobile trade panel and Jade Ledger popup were visually reviewed.

[Release preparation](TABLE_LOOP_RELEASE.md) records implementation details and
earlier failures/cancelled runs without relabeling them as passes. Artifacts:
`/tmp/tensho-merchant-KYR4lj/table-loop-final/` and
`/tmp/tensho-merchant-KYR4lj/production-guides/`.

No commit, merge, push, deployment or Search Console action was performed.
Default-mode/main promotion awaits the user's decision. Broader Classic rule
gaps, multi-tab saves, human playtesting, guide translations, physical-device
accessibility, performance and deployed upgrades remain open.

## Current Summer and public-guide accessibility checkpoint

Historical checkpoint, superseded by the Merchant totals above.

September 12: **790/790 full unit tests across 72 files** passed with one thread
worker (55.79 seconds), followed by strict TypeScript and a Pages-base production
build. Final build: 331 modules, **234 precache entries / 53,876.19 KiB**. Large
JavaScript chunk and stale Browserslist warnings remain; no performance score is
claimed.

Final targeted ESLint for the changed mechanics, artwork renderer, public-site
sources and browser specs, plus `git diff --check`, passed with no output.

**24/24** targeted gameplay/art browser checks passed (31.7 seconds) and **8/8**
production guide checks passed (19.9 seconds), both without retries. Public-guide
coverage includes no JavaScript, direct HTTP/metadata/assets, 320/768/1440 layouts,
200% root-text enlargement at 320px, visible keyboard skip link, actual main
focus and the following practice link. It is not native browser zoom or physical
device/screen-reader coverage. Final desktop About and mobile Summer inspector
screenshots were visually reviewed.

[Summer implementation](SUMMER_IMPLEMENTATION.md) closes the normal wall-cost
path with physical reserves and matching dry runs, not its undefined Bamboo
exception. Twin Flame is now the eighth individual Table Loop scroll; the
[artwork record](TABLE_LOOP_ART.md#twin-flame) includes its prompt/provenance.
[SEO strategy](SEO_STRATEGY.md) records the new accessibility fixes and all failed
attempts. Artifacts: `/tmp/tensho-summer-seo-jgY1pJ/` (`gameplay-final` and
`public-guides-verified` are the passing runs).

Remaining scope is unchanged: undefined/incomplete Season and Flower mechanics,
Fate/Negative rule conflicts, broader integration and human-fun validation,
guide translations, performance work, and authorized live deployment/PWA upgrade
verification. No commit, push, deployment or Search Console action was performed.

## Current Monsoon and public-guide checkpoint

Historical checkpoint, superseded by the Summer/accessibility checkpoint above.

September 12: **778/778 full unit tests across 71 files**, strict TypeScript,
Pages-base production/PWA build, targeted ESLint and whitespace checks passed.
The one-worker thread-pool unit run took 310.45 seconds.

Two separate browser runs passed without retries: **20/20** targeted gameplay/art
checks on the dev/test server, and **8/8** public-guide checks on the current
production preview at `/tensho-web/` with their original timeout. These are not
a complete browser-suite run or proof of a live Pages/PWA update. The earlier
production-navigation timeouts remain in the [SEO record](SEO_STRATEGY.md);
their root cause is not established by the fresh passing run.

[Monsoon implementation](MONSOON_IMPLEMENTATION.md) describes the real draw paths,
non-mutating RNG previews and restored Omen-lock correction. Spring/Summer/Autumn/
Winter rule gaps, full Frostbite behavior, the three-Flower unlock and advanced
Flower–Season combinations remain. Changes have not been committed, pushed or
deployed in this pass. Older checkpoint counts below remain historical.

## Completed in this pass

- Connected Monsoon to real live-wall and bonus-replacement draws, with exact forked-RNG redraw preflight that preserves live streams, rewards and Omen locks. Fixed the restored-lock preview/consumption disagreement and added localized active-rule text in all 13 locales. [Monsoon implementation](MONSOON_IMPLEMENTATION.md) records the scoped mechanics, regression evidence and remaining Season/Flower requirements.
- Completed the first English public-guide slice: static About, how-to-play and FAQ pages, menu links, generated sitemap and a documented [SEO strategy](SEO_STRATEGY.md). Integrated an About illustration plus Honor Court/Wide Rack scrolls; [prompts and provenance](PUBLIC_SITE_ART.md) are recorded. Initial production checks were **not uniformly green**: six no-JavaScript checks passed, while desktop navigation timed out in the first batch and one longer-budget repeat. A later current-build run passed 8/8 with the original timeout. The SEO record preserves all attempts and the remaining performance, accessibility and deployment checks; no gameplay completion or ranking claim follows from this slice.
- Connected the localized full-stack Flora inspector to authoritative scoring state, wired actual discards to Decay, and fixed Eternal Garden's secondary protection rule. Reproduced and fixed tile-origin compatibility clicks opening the Flora modal, invisible first-render reduced-motion Popups, and scroll artwork overlapping long dialog content. [Flora implementation](FLORA_IMPLEMENTATION.md) records the corrected paths and the still-unimplemented Season/Flower powers.
- Corrected round-boundary Season leakage, Omen-locked draws replacing the existing stack, and Boss skip availability disagreeing with execution. Eight seeded acquisition cases use real skips; four desktop/mobile checks exercise actual Skip, Redraw, Rare+ shop delivery, and once-only fees. [Omen lifecycle](OMEN_LIFECYCLE.md) distinguishes controlled draw/win fixtures from organic acquisition and preserves the full-suite failure history.
- Integrated the fifth individual Table Loop scroll, Gap Bridge, into shared shop/inventory artwork. The generated 1254×1254 transparent PNG is preserved unchanged; [the art manifest](TABLE_LOOP_ART.md#gap-bridge) records the exact prompt, source, and model-version limitation. Other five Decrees still use the established generic illustration.
- Reproduced and fixed invisible first-render pack rewards under reduced motion, pack hover/press/shimmer ignoring the preference, and live preference changes clearing selected rewards. Selection state is now independent of animation setup. [Pack motion notes](SHOP_IMPLEMENTATION.md#pack-motion-follow-up) record preserved purchase, affordability, and claim semantics.
- Preserved the Decree Omen's Rare+ requirement through generation and upward fallback, deferred impossible guarantees without their shop-entry gold fee, and fulfilled stacked item/pack/edition guarantees without overwriting one another. Overflow rewards are visit-scoped, not permanent Charter slots. Ten engine cases and a real desktop/mobile purchase/reroll/route-revisit scenario cover the change. [Shop Omen notes](SHOP_IMPLEMENTATION.md#shop-omen-guarantee-follow-up) distinguish this from unimplemented legacy catalog entries and unresolved edition wording.
- Corrected Tile Pack reward descriptions to derive from the actual modifiers, removing the stale +10 Bonus and on-scored +2 Gold promises. Shared localized reward text names rank/suit and all modifier layers; pack cards show full rules and item-neutral rarities. Two seeded generation/scoring regressions and three component cases accompany a real Spanish phone claim in both browser configurations. No scoring constants, costs, generation probabilities, or Negative Tile rules changed; [Shop implementation](SHOP_IMPLEMENTATION.md#tile-pack-rule-and-identity-follow-up) records the still-open Negative rules conflict and runtime probe.
- Replaced generic shop Seal/Orb labels with the actual offered item's localized identity, rule, and rarity. Purchase controls name the item and price, expose the rule, and cannot bypass disabled affordability by clicking the card. Added 17 shop interface keys in all 13 locales, wrapping headings/full descriptions, a responsive gold/header layout, and explicit localized Charter confirmation. Charter, item-card, and header motion honors the app/system preference; PackCard motion is addressed in the follow-up above.
- Integrated the new blue/gold Imperial Charter illustration with responsive base/upgraded cards. [The artwork manifest](CHARTER_ART.md) records the original, exact prompt, built-in generation mode, and unavailable model ID. The asset is shared category artwork, not unique artwork for every Charter. Browser screenshots and native image decoding cover 320- and 640-pixel layouts; purchase cancellation and once-only payment/ownership use the real shop path.
- Localized the cash-out receipt in all 13 languages, reconciled its breakdown with settled multiplier bonuses, and made large totals readable in a stacked small-screen layout. Receipt testing also exposed and fixed OS-reduced-motion shake overflow and a render-to-subscription gap that could leave the shop stale. The final browser run passed all 178 checks without retries; [Shop implementation](SHOP_IMPLEMENTATION.md) and [animation continuity](RUN_RESULTS_IMPLEMENTATION.md) record fixtures, screenshots, deterministic regression evidence, and the retained failure history. No scoring or payout constants changed.
- Corrected Strength and Ouija retaining red-five status after physical rank changes. Their shared helper preserves IDs and all modifiers without manufacturing red fives; Ouija retains both its random rank and once-only hand-size penalty. Twelve reproduced failures now pass within fourteen engine cases, three new helper cases, and all 28 desktop/mobile consumable flows. [The rank-conversion follow-up](CONSUMABLE_IMPLEMENTATION.md#physical-rank-conversion-follow-up) records the rule and precise verification scope.
- Corrected Unity's nonexistent Wind ranks 5–9 using a deterministic cyclic mapping that preserves prior valid ranks 1–4. The dialog derives a four-image public guide from the same helper, with all-locale rule text and no hidden-target inspection. Eleven engine tests, four helper tests, policy/locale regressions, and both small-phone browser flows verify the change. [Consumable implementation](CONSUMABLE_IMPLEMENTATION.md#unity-honor-conversion-follow-up) records the rule completion, preserved modifiers, screenshots, and the separately reproduced rank-change defect. September 9 balance artifacts remain historical pre-fix snapshots.
- Added an opt-in conservative consumable policy to the Classic simulator, with real actions, visible-only target selection, score-plan refresh after use, and per-item use/final-hold reporting. [The 400-row comparison](CLASSIC_CONSUMABLE_BALANCE.md) uses 1,090 items, raises mean rounds from 5.49 to 5.725, and still triggers no complete hands or Yaku. Its limited Script cost model and unchanged cheapest-first shopping are explicit; no live balance constants were tuned from this evidence.
- Corrected the Fool to record only successfully used Fate Seals/Orbs, ignoring intervening Scripts, and added a localized preview of the item it will create. Both the authoritative engine and legacy store agree. Eight unit cases and four English/Spanish desktop/mobile checks cover history, cancellation, fresh instances, no implicit Orb upgrade, round/new-run boundaries, and retained allowance-limited self-copy. [Consumable implementation](CONSUMABLE_IMPLEMENTATION.md) records the semantics and four regressions reproduced before the fix.
- Added public-information consumable preflight shared by the engine and dialog: capped upgrades, ineffective visible rank/suit targets, missing reward slots/Decrees/history, and zero-gold effects are rejected before confirmation. Six feedback keys are supplied in all 13 locales. Hidden identity and chance outcomes remain unresolved until use; failures preserve items, allowances, RNG, penalties, and protection. Twenty-one engine checks and six additional desktop/mobile checks cover this pass; see [Consumable implementation](CONSUMABLE_IMPLEMENTATION.md). Fool history eligibility is corrected in the follow-up above; the existing Seal-lifetime conflict remains open.
- Added read-only resource-aware and one-away Classic balance policies with explicit table/Stake/seed controls, structured per-run results, and actual legal exchanges/discards. The paired 200-seed comparison raises median Act reach from 1 to 2; full-hand patterns remain rare. [The balance audit](CLASSIC_BALANCE_AUDIT.md) includes stored results, limitations, and the still-missing consumable/synergy policy. This pass does not alter live rules or coaching.
- Corrected Classic redraws to return physical tiles to the seeded wall after replacements, without discard income or immediate self-replacement. Shared validation rejects locked/duplicate targets and unresolvable bonus chains; the button uses authoritative legality. Purple Seal rewards now apply on redraw subject to capacity, with all-locale descriptions. [Resource cycling](RESOURCE_CYCLING_IMPLEMENTATION.md) records the rules and engine/browser evidence.
- Generated three individual starter Decree illustrations: Echoing Bamboo, Patient Pair, and Watch Fire. Originals are stored under `public/assets/illustrations/table-loop/`. [The artwork manifest](TABLE_LOOP_ART.md) records the actual prompts, reference, execution mode, paths, and the limitation that the built-in tool exposes no model ID.
- Integrated those images into opening choices, shop cards, and a new owned-scroll inventory. Localized details open on hover, keyboard focus, or tap; Escape, the close control, and outside taps dismiss them. Non-starter Decrees retain the existing generic scroll, with distinct localized names and rules.
- Added versioned, action-journal persistence for Table Loop. Successful actions are replayed through the authoritative engine; raw stored scores and Tile-shaped objects are never trusted. Physical tile references use collection indices because runtime IDs change between sessions.
- Added recovery coverage for regular and draft-enabled runs, practice progress, shops, purchases, pending draft choices, transient selection exclusion, rejected actions, invalid saves, and storage failures.
- Added localized save-error notices in all 13 locales. Invalid saves are not erased simply by reading them; beginning a replacement run writes a new journal. Rules changes must bump `TABLE_SAVE_VERSION` when old journals are no longer reproducible.
- Made seed/variant URLs resume a matching saved run. An explicitly different seed or variant starts a new one. Switching from practice to ordinary play clears the practice URL so a reload does not put the player back into practice.
- Added a main-menu action during Table Loop play; returning to the mode preserves the run.
- Removed forced viewport height from phase panels. Short screens can scroll to all actions. Mobile table slots use two meld columns and a full-width pair slot; larger screens retain a five-slot row.
- Fixed heading defaults that were outside Tailwind's base layer and overrode responsive dialog typography. The opening heading now respects its requested size and color.
- Connected all eight Classic table styles to authoritative rules and active-run visuals, including slots, starter rewards, Flower weighting/exclusion, score modifiers, shop discounts, corruption, and target scaling.
- Connected earned tables to selection and corrected victory-time Decree ownership, distinct-Flower collection, and same-run corrupted-Season survival. The Archive now uses the playable table catalog while retaining retired records outside active completion totals.
- Added localized themes, numeric modifiers, and unlock conditions in all 13 locales. [Table rules](TABLE_STYLE_RULES.md) records precise semantics and test coverage.
- Added 55 reproducible original synthesized sound cues, connected app-lifetime music/SFX to settings and live gameplay, and implemented Table Loop feedback keyed to actual resolution intensity. Mute, crossfades, blocked playback, visibility, and silent save replay have regression coverage. [Audio implementation](AUDIO_IMPLEMENTATION.md) records provenance and verification limits.
- Fixed the music notification's off-screen slide, which could widen the page; it now ignores pointer input and honors reduced motion. Added WAV assets to the production offline precache.
- Replaced the Classic shop's split store/payment/grant flow with a run-owned `ShopSession` shared by the UI and balance simulator. Purchases and rerolls validate before payment; combined pack rewards validate before any grant. Pending paid choices survive route revisits, block round advancement, and settle only once. New runs reset the shop and its Charter state.
- Added explicit localized pack skipping, keyboard selection/focus containment, reduced-motion support, and a fixed selection/error footer with equal-width actions. Visual review caught and corrected a clipped Spanish confirmation button at 320×568. [Shop implementation](SHOP_IMPLEMENTATION.md) records the rules, scope, and measured progression limitations.
- Corrected the simulator's no-op `--shop` option and withdrew the unsupported old median-Act-5 claim. Actual cheapest-first purchases now run through the live acquisition path, and invalid-action/no-advice stops are reported separately from losses.
- Unified committed-play, availability, and forecast legality, including boss size restrictions, locked physical tiles, duplicate IDs, and complete-hand requirements. Forecasts now include next-hand Omens without consuming them; commitment pays and consumes those effects once.
- Made the coach include required visible tiles and added an identity-only blind-play fallback to the simulator. Both 200-seed samples now reach genuine losses without invalid-action/no-advice stops. Cheapest-first shopping executes 1,301 purchases and 388 pack claims, reaching maximum Act 7; it is still not a resource-aware policy or a human difficulty estimate.
- Replaced the Classic overlapping rack/staging fan with whole-tile rows and 44-pixel minimum targets. Moved discard, Flora, and wall controls out of tile/instruction hit areas; short screens scroll inside the frame with a pinned action bar. Native touch testing exposed and corrected double-staging from synthesized mouse events. Pointer capture, cancellation, rendered-zone drag testing, keyboard/semantic activation, and concealed labels now have coverage.
- Bounded tile-detail portals to the viewport, removed font-baseline dependence from Table Loop rack hit boxes, and required actual pointer movement for passive hover details. Escape keeps keyboard-owned details dismissed. Guarded synchronous native SFX setter failures so optional sound cannot interrupt selection. [Play validation and interactions](PLAY_VALIDATION.md) records the findings and scope.

## Verification evidence

### Current Flora, dialog, and touch checkpoint

- Full units: **748/748 in 69 files**, one worker, 218.74 seconds, using `bun run test:run --maxWorkers=1`. Includes four real Season/discard/protection checks, four Flora component cases, seven Popup cases, 21 PlaySurface cases, and 20 locale-integrity checks. A new touch-origin default-cancellation test first failed before the native listener fix. Earlier focused regressions exposed missing Decay updates, secondary-effect protection, and reduced-motion first-render visibility before source corrections.
- Full browser run: **201/202**, 20.3 minutes, without retries, using `npx playwright test --reporter=list --workers=1 --trace=retain-on-failure`. All 101 mobile scenarios passed. All four Flora checks and the shared dialog/rack regressions passed; the single failure was the early desktop Codex-navigation test exceeding its 30-second limit, with a long execution gap in the trace. Its cause is unproven.
- Follow-up: **24/24 checks passed** in 1.2 minutes, without retries, using `npx playwright test e2e/app.spec.ts e2e/interaction.spec.ts e2e/flora.spec.ts --grep 'navigate to tutorial/codex|Classic rack|Spanish Flora|pointer discard' --repeat-each=2 --reporter=list --workers=1 --trace=retain-on-failure`. This repeats six scenarios in both configurations twice. Codex navigation now requires a real button, the exact `/en/codex` route, and its heading; the previous conditional could silently skip navigation. The focused pass does not convert the preceding full run into 202/202.
- Failure history: the initial focused run passed **33/34**, exposing a 390×844 touch transfer that opened Flora. The second passed **32/34**: all touch transfers passed, while one desktop rack test timed out and a new resize test compared geometry read across two viewport sizes. The latter now reads geometry atomically and waits for the requested viewport under the existing five-second expectation budget; bounds remain unchanged. The desktop rack check passed unchanged in the full run and twice in follow-up. Original timing causes are not inferred from later passes.
- Spanish long-stack screenshots were inspected at 320×568, 568×320, and 1024×768. Fixed scroll caps and the close control stay outside the independently clipped text viewport. Mobile staging uses native taps; the Decay discard scenario uses a pointer drag in both configurations. Test walls/stacks are explicit fixtures, not organic acquisition evidence. Diagnostic directories: `/tmp/tensho-flora-verification-KdgCdC/initial-focused-suite/`, `second-focused-suite/`, `full-suite/`, and `final-focused-suite/`.
- Strict TypeScript, targeted ESLint/Prettier, and the Pages-path production build pass. Output: `index-DXDYRbeP.js` (**1,377.70 kB; 391.62 kB gzip**), `index-DZZXdrps.css`, **227 precache entries / 46564.97 KiB**. Chunk-size and stale-Browserslist warnings remain. The original popup PNG and tracked HTML report are unchanged. No commit, push, or deployment was performed. This pass reuses existing tile art and the previously integrated generated scrolls; it does not claim another image generation or an exposed model version.
- Completion remains unproven: [Flora implementation](FLORA_IMPLEMENTATION.md#requirements-still-missing-from-the-runtime) identifies unused runtime helpers for multiple documented powers, the three-Flower shop gap, partial Frostbite behavior, and further mutation/interaction requirements. Accurate “not connected yet” copy is temporary disclosure, not a substitute for implementing them.

### Current Omen lifecycle, Gap Bridge, and pack-motion checkpoint

- Full units: **739/739 in 68 files**, one worker, 70.55 seconds, using `bun run test:run --maxWorkers=1`. Coverage includes eight earned-Omen lifecycle cases, five pack component cases, six artwork cases, and a content regression that classifies the advertised Gap Bridge example through actual group rules. The earlier full 736-test run failed on reward visibility. Synchronous assertions then reproduced invisible Bonus/Gold rewards, two PackCard checks reproduced missing motion support, and preference-toggle assertions reproduced lost selection. These failures were fixed in source rather than hidden by waiting longer.
- Full browser suite: **198/198 passed without retries** (12.6 minutes), using `npx playwright test --reporter=list --workers=1 --trace=retain-on-failure`. All 99 scenarios pass in both desktop and mobile Chromium. This includes the four Omen acquisition checks, four live app/system pack-motion checks, and both individual Terminal Gate/Gap Bridge art scenarios at 320×568. Final Gap Bridge screenshots were inspected in both configurations: image, title, close control, and complete rule text fit inside the viewport. Reward fixtures verify actual selection/claim/payment but do not establish organic reward frequency or human enjoyment.
- The preceding 28-check focused run passed **26/28** (1.9 minutes). Both Gap Bridge checks incorrectly expected the stale fallback example `3·5·7`; the localized UI and engine already correctly used `3·4·6`. The fallback was corrected too, and the new content regression first proved the advertised old example illegal. No gameplay rule, screenshot bounds, timeout, or interaction assertion was loosened. Initial and final artifacts are retained at `/tmp/tensho-pack-motion-NnUm4T/initial-focused-suite/` and `full-suite/`.
- The earlier lifecycle full run finished **186/192** (23 minutes), with six early desktop readiness/timeouts; all mobile checks passed. All six scenarios passed unchanged in the 28-check follow-up and again in the final full 198. Their original timing cause remains unproven; this later pass does not erase the unsuccessful runs. [Omen lifecycle notes](OMEN_LIFECYCLE.md) preserve the earlier 39/40 focused result and diagnostic paths.
- Strict TypeScript, targeted ESLint, changed/new test formatting, and the Pages-path build pass. Final output: `index-BL72ZWYG.js` (**1,372.86 kB; 390.42 kB gzip**), `index-CGLinjiM.css`, **227 precache entries / 46541.78 KiB**. All five Table Loop scrolls and the Charter illustration match their built copies and are precached. The bundle references Gap Bridge and the HTML uses `/tensho-web/assets/`. Large-chunk and stale-Browserslist warnings remain; build success is not hosted deployment or runtime performance evidence.
- The completion audit found an uncovered Flora UI defect: `GameplayScreen` toggles `isFloraExpanded` but renders no expanded view, and `FloraTrackCompact` labels corruption while displaying the base Season's description. The screen also passes a stack-wide corruption flag alongside only the first Season. This is a concrete remaining implementation task, not a completed interface inferred from green tests.
- Current repository-wide lint finishes with **zero errors / 211 warnings**. The actual release workflow bodies pass **13/13 isolated checks** via `node --test scripts/deployment-versioning.test.mjs` (24.9 seconds); their temporary Git fixtures do not publish this repository. `git diff --check` passes and the tracked Playwright HTML report is unchanged. Nothing in this checkpoint was committed, pushed, or deployed.

### Current shop Omen checkpoint

- Full units: **727/727 in 65 files**, one worker, 260.33 seconds. The preceding run passed 725 tests but failed to start the `ShopItemCard.test.tsx` worker; that was an unsuccessful run, not a pass. The isolated rerun required no assertion or application changes.
- Strict TypeScript, targeted ESLint, new-test Prettier, and the Pages-path build pass. Output: `index-BLKIAZsN.js` (1,372.37 kB; 390.32 kB gzip), `index-CGLinjiM.css`, **226 precache entries / 44804.35 KiB**. The generated Charter asset matches its built copy, and it plus all four new Table Loop illustrations remain in the precache. Existing chunk-size and Browserslist warnings remain.
- The 70-check affected browser run finished **68 passed / 2 failed** (19.2 minutes). Both new Omen scenarios passed, including once-only purchase, free pack settlement, reroll capacity, and client-route recovery. Two existing desktop pack tests timed out during an unusually long execution gap; the timing cause is not established. Their mobile counterparts passed.
- A separate one-worker follow-up passed **6/6 without retries** (13.6 seconds): `npx playwright test e2e/shop-omens.spec.ts e2e/shop.spec.ts --grep 'stacked shop Omens|pack choices work with the keyboard|localized pack choices fit' --reporter=list --workers=1 --trace=retain-on-failure`. It includes the two timed-out scenarios and the Omen scenario in both configurations, with unchanged assertions/timeouts. This is not a retroactive 70/70 result.
- The first 70-check attempt passed 66: the new Omen test mistakenly searched for a child button inside the pack button, and two existing desktop checks encountered a lost development-server connection/context and a page-readiness timeout. The selector was corrected; the other assertions were unchanged. Diagnostics are retained under `/tmp/tensho-omen-verification-pwEGC7/initial-focused-suite/` and `second-focused-suite/`. Both Omen screenshots were inspected at 320 CSS pixels.
- The suite now contains **188 configured checks / 94 scenarios**; the full 188 has not been run. The previous full 178-check pass remains historical. Organic Omen acquisition, season-lock tradeoffs, edition-description reconciliation, and legacy Double Omen/pack-skip catalog gaps remain separate work.

### Previous Tile Pack checkpoint

- **717/717 tests in 64 files passed** with `bun run test:run --maxWorkers=1` (91.35 seconds). Two seeded tests first reproduced the stale Bonus/Gold descriptions; they now match the real tile definitions and verify +30 played chips, zero played Gold-Mark gold, and 3 held gold through the modifier scorer. Three component cases cover localized rules, keyboard selection/confirmation, ordinary rarity labels, stacked modifiers, and plain/Honor names. Seeded fixtures reset their RNG after each test rather than altering an unrelated Omen test's randomness.
- **68/68 targeted desktop/mobile browser checks passed** without retries in 5.4 minutes, using the same shop/dialog/result/consumable command as below. Both new Tile Pack cases use deliberate two-reward fixtures, show full Spanish rules at 320×568, select/confirm through the real dialog, and verify the exact two physical tiles in `wallTemplate`, one 8-gold payment, a cleared pending pack, and removal of its shop offer. Final screenshots were inspected in both configurations. This does not prove organic rare-reward frequency or all modifier effects.
- The first run passed **66/68** (5.3 minutes). The two new cases expected “Bambú” instead of the existing catalog's “Bambúes”; corrected exact names pass with the same transaction and layout assertions. Screenshots also exposed Decree-specific rarity labels on tiles, now replaced with the existing generic shop rarity keys. Initial artifacts are retained at `/tmp/tensho-tile-rewards-DJYJTj/initial-focused-suite/`. No browser timeouts were extended and no forced clicks were introduced.
- Strict TypeScript and the Pages build pass. Latest assets are `index-BmlooWEg.js` (about 1.37 MB) and `index-CGLinjiM.css`; the PWA precache contains **226 entries / 44803.58 KiB**. Existing large-chunk and stale-Browserslist warnings remain. Changed TypeScript files pass targeted ESLint; new helpers, components, tests, and browser tests pass targeted Prettier. The legacy system file was not reformatted wholesale.
- There are **186 configured browser checks / 93 scenarios**. This checkpoint reruns 68 affected checks, not the full 186; the prior full 178-check run remains historical. The previous final Charter artifacts are retained at `/tmp/tensho-charter-verification-vm5y46/final-focused-suite/`.
- Negative Tile remains unresolved: an isolated actual `GameOrchestrator` probe accepts one such tile into the persistent wall while slot capacity stays **5 → 5**, despite its definition advertising +1. The mechanics and item-library documents disagree about whether Negative may exist on tiles. A user design choice is pending; no unsupported slot-lifetime or removal policy was implemented.

### Earlier shop identity and Charter checkpoint

- **712/712 unit/component tests in 63 files passed** with `bun run test:run --maxWorkers=1` (69.23 seconds). This includes three Charter cases, two actual-stock/motion/affordability cases, one header case, and the 17-key all-locale contract. The earlier two-worker run passed 697 tests but failed to start workers for `tableLoopStore.test.ts` and `groupRules.test.ts`; its two unhandled worker-start errors make that run unsuccessful. The serial run changed no assertions or application rules.
- **66/66 targeted browser checks passed** without retries in 2.9 minutes: `npx playwright test e2e/shop.spec.ts e2e/dialogs.spec.ts e2e/run-results.spec.ts e2e/consumables.spec.ts --reporter=list --workers=2 --trace=retain-on-failure`. These cover desktop/mobile Charter layout, cancellation/payment, concrete Seal/Orb offers, receipt layouts, pack settlement, consumable use, and victory/Endless flows. There are now **184 configured checks / 92 scenarios**; the full 184-check suite has not been run at this checkpoint. The prior full 178-check pass below is historical.
- Strict TypeScript, `VITE_BASE_PATH=/tensho-web/ bun run build`, targeted ESLint, and targeted Prettier passed. Current output: `index-CfA8WY-_.js` (about 1.37 MB), `index-CGLinjiM.css`, and **226 PWA precache entries / 44803.24 KiB**. The built Charter PNG matches the source bytes, is referenced in the bundle, and is listed in the precache. Large-chunk and stale-Browserslist warnings remain.
- The first focused browser run passed 63/66. Both base-Charter tests failed because their snapshot serialized a `Set` rather than an array; correcting that fixture preserved the real cancel/pay/ownership assertions. The unchanged desktop Unity test also exceeded its timeout; both configurations pass in the final run, but the original timing cause remains unproven. Initial artifacts are retained at `/tmp/tensho-charter-verification-vm5y46/initial-focused-suite/`. An unsupported Testing Library `exact` option was removed from the header test before the successful type check.
- Final mobile screenshots were inspected for the base Charter at 320 pixels, upgraded Charter at 640 pixels, and actual Orb description at 320 pixels. The upgraded offer is a deliberate fixture with zero gold, proving rendering and disabled purchase—not organic upgraded-Charter acquisition. Native-speaker, physical-device, deployment, and PWA-upgrade verification remain separate.

### Historical verification checkpoints

- Current full browser checkpoint: **178/178 checks passed** (13.8 minutes), without retries, using `npx playwright test --reporter=list --workers=2 --trace=retain-on-failure`. This covers 89 scenarios in desktop and mobile Chromium, including localized large-value receipts at 320×568 and 1024×768, live shake containment, and changing the system motion preference. Previously failing mobile receipt renders now pass after closing the controller's subscription gap. The two desktop timeout scenarios also pass unchanged; their original timing cause remains unproven.
- Payout failure history: initial **169/176**, then **175/176** runs exposed an English Act-ascent copy regression, large-number wrapping, and animation-driven document overflow. A subsequent **174/178** run exposed two stale mobile receipts plus two desktop timeouts. Artifacts are preserved locally under `/tmp/tensho-payout-verification-9ULF1P/`. The final 178-check pass follows actual source corrections, not retry settings, forced clicks, weaker bounds, or longer browser timeouts. A direct controller regression reproduced stale `gameplay:4` after the engine changed to `shop:17`; it now updates immediately and still handles later gold events.
- Earlier rank-conversion checkpoint: **693/693 unit/component tests in 58 files**, strict TypeScript, production build, targeted lint, and **28/28 consumable browser checks** passed. The browser run took 54.1 seconds without retries, with the new cancellation/ordinary-six flow on desktop and mobile. It preceded the current full-suite result above.
- Completed the current-session Settings reset across all five meta stores, both runs, and tutorial flags while preserving preferences/unrelated storage. Archive reset now removes earned unlocks and startup/reset share derived default counters. Explicit storage errors trigger verified rollback or partial-reset disclosure. Eight unit checks, six new desktop/mobile checks, all-locale labels, and the final full suites pass; see [Progress reset](PROGRESS_RESET_IMPLEMENTATION.md).
- Replaced shared Popup overlays with native modal dialogs, accessible names/descriptions, safe initial focus, Tab containment, Escape/backdrop cancellation, and focus restoration. Localized labels and narrow-phone action stacking preserve the scroll ornament. The tests also exposed and fixed a hidden new run starting after Exit; see [Dialog implementation](DIALOG_IMPLEMENTATION.md). The subsequently completed reset workflow uses fixed scroll padding for longer warnings.
- Reproduced and fixed the post-victory Ancient Script rewind: losing at Act 8 incorrectly showed a fresh Victory and a dead continuation button. Explicit Endless state now survives rewinds, controls the header/result, and prevents second entry. Boss-shop previews and transitions share the Act-reduction calculation. Nine engine checks and two additional desktop/mobile acquisition-to-result checks verify the behavior, hand penalty, and once-only progression; see [Run results](RUN_RESULTS_IMPLEMENTATION.md).
- Fixed an app-wide screen-shake remount: changing the wrapper component on every frame discarded focus and local state. A direct regression reproduced the lost input and now verifies node identity, focus, value, and mount counts. Phase changes also clear stale scoring popups. Added all 13 result-screen translations, locale-aware full-width scores, wrapping actions, and the initial six desktop/mobile result-flow checks. [Run results](RUN_RESULTS_IMPLEMENTATION.md) records that coverage and the subsequent Charter rewind fix.
- Reproduced and fixed release tag/checkout divergence after a concurrent push, and partial branch publication when a tag is rejected. Atomic publication, explicit guards, repository runtime pins, pre-build application tests, and a verified artifact `release.json` now have 13 passing isolated workflow checks. All 520 application tests and the Pages-path production build also passed using Bun 1.3.3. [Release implementation](RELEASE_IMPLEMENTATION.md) distinguishes candidate tags from successful deployment and records the remaining live checks.
- Added an explicit choose-item → choose-targets → confirm consumable dialog, private target selection, keyboard focus containment, visible failure recovery, localized functional Script penalties, and active Omen-protection disclosure. The engine now honors authored up-to ranges, caller target order, and untargeted-effect boundaries; no-op rank/suit effects retain the item and use allowance. [Consumable implementation](CONSUMABLE_IMPLEMENTATION.md) records precise semantics, coverage, and the unresolved Seal-lifetime conflict.
- Generated and integrated a fourth individual scroll, Terminal Gate, using the built-in image generator and the existing Echoing Bamboo image as a style reference. The 1254×1254 PNG retains its alpha channel. [The art manifest](TABLE_LOOP_ART.md) records the exact prompt and the unavailable model-version limitation. Unit tests check all four individual asset paths; desktop/mobile checks verify decoding and readable owned-item rule details.

- Full unit/component suite: **705 tests across 60 files passed** using `bun run test:run --maxWorkers=2`, including seven localized payout checks, the receipt locale contract, one render-to-subscription regression, 14 rank-conversion checks, 11 Honor-conversion checks, seven pure transformation checks, all-locale Unity coverage, 29 consumable-policy checks, eight copy-history checks, 21 public-information consumable checks, 11 resource-policy checks, 22 CLI-contract checks, 15 resource-cycling checks, six additional redraw-button cases, Purple Seal locale coverage, eight reset-coordinator checks, reset-locale coverage, seven Popup checks, nine Endless-progression checks, five VFX continuity/cleanup/motion-preference checks, result-locale coverage, 19 consumable-targeting checks, five individual-art checks, and all earlier gameplay/system coverage. An earlier unrestricted-worker attempt failed to start nine workers during heavy host load and timed out on Popup; it is not counted as successful verification. A newer string API in an artwork test was also corrected to match the configured JavaScript target before the final type check. The first preflight full run hit the CLI reproducibility test's five-second default; its outer timeout now accommodates two bounded subprocesses without changing the assertions, and the final full run passed.
- Strict TypeScript and the production build passed with `VITE_BASE_PATH=/tensho-web/ bun run build`. The final payout/controller build emits `index-BsFDkmzm.js` (about 1.37 MB before compression), `index-BaX6O4eS.css`, and 225 PWA precache entries (42840.15 KiB). Large-chunk and stale-Browserslist warnings remain; build success is not performance or deployment evidence.
- Repository lint: zero errors, 211 warnings. Targeted lint for the new/changed TypeScript files passed without warnings.
- Preceding full browser suite (Unity checkpoint): **167/168 passed** (12.8 minutes), using `npx playwright test --reporter=list --workers=2 --trace=retain-on-failure`, without retries. Both new Spanish 320×568 Unity flows passed, with inspected screenshots and an actual scoring pair after conversion. The desktop Mega pack capacity scenario exceeded its 30-second limit; its trace shows settlement and arrival at gameplay. Three unchanged isolated repetitions then passed with one worker (25.9 seconds total), but the timeout cause is unproven. Original artifacts are retained locally at `/tmp/tensho-unity-verification-SOOXrS/full-suite/`. The prior full Fool checkpoint passed **166/166** (10.0 minutes). Earlier two desktop interaction timeouts also passed unchanged repetitions and a later full run; those original causes remain unproven.
- Failure history is retained: an earlier 95/96 run missed a mobile Table Loop first selection; a later 101/102 run proved highlighted Classic tiles intercepted their neighbors. Native-touch tests then proved double-selection from compatibility mouse events. Extra tooltip repetitions exposed dismissal/geometry instability after an intermediate 108-check run had passed. Those findings drove the current fixes; no forced clicks or weakened first-selection assertions were substituted. The historical Table Loop first miss is not conclusively attributed to one of these causes.
- Changed interaction files pass targeted ESLint and Prettier checks; `git diff --check` passes. The tracked HTML browser report is unchanged because verification uses the list reporter.
- Shop-specific browser checks and screenshot inspection verify once-only rewards, combined-capacity rejection/reselection, explicit skipping, keyboard focus, pending-pack route recovery, localized pack text, and a fully visible error/action footer on a 320×568 phone. Fixtures intentionally isolate transaction edge cases rather than proving organic later-Act reach.
- Manual inspection of the current development build verified starter artwork and an owned-scroll popup on desktop, all five slots in a 390×844 viewport, and a Bamboo placement with a forecast and committed score of 110. Reload retained that group, score, remaining actions, and replacement rack.
- Screenshot review of the new Classic rack at 320×568 and 1280×800 verifies whole, separate tile faces. Short phones intentionally scroll the HUD out of the way; the final rack row clears the pinned action bar. Browser assertions additionally cover 390×844, all fourteen hand/staged targets, and the frame boundary. This is not physical-device or native-speaker validation.
- The in-app browser initially showed a blank page on port 4173 while loading an old hashed production bundle. A clean development origin on port 4175 loaded the current source and worked. This observation does not establish that the public Pages deployment has been updated or that all PWA upgrade paths are correct.

## Completion audit still open

Historical audit inventory. The finite [completion contract](#completion-contract--october-11)
above now governs release blocking and work order. Preserve the evidence and
limitations below; do not interpret every research opportunity as a new required
implementation task.

September 26 published follow-up (**v1.0.260926-3**): the ordinary hand-readiness hint now checks
alternative tile groupings and separates special-hand completion. Full units
passed **1,340/1,340**, strict TypeScript, lint, release checks and production
build passed. The final corrected native browser batch passed **12/12** on
desktop/touch without retries; earlier timeout and locator failures are retained.
Independent CI and deployment passed; the public manifest/tag match the built
checkout. Hosted desktop/touch Classic play/reload/Resume and Table Loop
continuation passed without page errors. See [readiness evidence](HAND_READINESS_IMPLEMENTATION.md).

September 26 published follow-up (**v1.0.260926-2**): tile identities and teaching popups now share
localized text across play, rack and reward surfaces. Incorrect Season promises
are removed, and six missing modifier catalogs are supplied. Full units passed
**1,333/1,333**, with **42/42 desktop/touch browser checks**, strict TypeScript,
targeted lint and production/PWA build. Independent CI passed all tests, release
checks, build and deployment; public manifest/tag match the built checkout. See
[tile-detail evidence](TILE_DETAILS_IMPLEMENTATION.md).
Hosted desktop/touch checks passed in five languages; Classic play/reload/menu
Resume and Table Loop continuation also passed without JavaScript page errors.

| Requirement / concern               | Evidence still required                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Complete playable core loop         | Full acquisition/use/settlement coverage of the documented systems, not just the opening move or data definitions. Preserve existing Classic coverage while checking later-round and end-state paths.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Table styles                        | Classic integration and legacy catalog reconciliation are verified in [Table rules](TABLE_STYLE_RULES.md). The [64-cell table/Stake comparison](CLASSIC_TABLE_STAKE_BALANCE.md) now measures a fixed limited policy; stronger strategies and human balance remain open. Table Loop is a separate mode, not a migration of Classic table mechanics.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Progression and build balance       | Shared play validation and the blind fallback resolve the measured legality/no-advice stops. [Observed-build shopping](CLASSIC_BUILD_SHOP_BALANCE.md) now compares 2,560 runs across every table/Stake and produces 25 rescue-free wins versus zero for the control. The [Tea House build panel](SHOP_BUILD_IMPLEMENTATION.md) makes real comparison/sale/replacement accessible to players. Cost-aware destructive/Script strategies and broader Yaku planning remain open; none of those simulated victories used complete hands. Human enjoyment cannot be inferred from simulation clear rates.                                                                                                                                                                                                                                                                                                                                                                                                          |
| End-to-end system integration       | Consumable targeting, purchase-to-use, penalty/protection, and cancellation paths have browser coverage. Act 8 win/loss, the default-table Stake unlock, ordinary Act 9 continuation/loss, Ancient Script purchase/rewind/defeat, and once-only completion pass through the live UI using explicit fixtures. Unity now creates valid Winds with an illustrated public mapping. The subsequent physical rank-conversion fix covers Strength and Ouija red-five identity, modifier preservation, and existing costs. Broader table/Stake/effect combinations, Omen-modified shops, bosses, and upgraded-Charter acquisition remain open; see [Run results](RUN_RESULTS_IMPLEMENTATION.md). Fate Seal lifetime and Negative tile ownership are resolved under delegated authority; see [current evidence](RUN_OWNERSHIP_IMPLEMENTATION.md).                                                                                                                                                                     |
| Remaining UI and persistence limits | Shared dialogs/Exit and progress reset are verified in [Dialog implementation](DIALOG_IMPLEMENTATION.md) and [Progress reset](PROGRESS_RESET_IMPLEMENTATION.md). Current run writers now reject stale windows and coordinate reset; [save ownership](TABLE_SAVE_OWNERSHIP_IMPLEMENTATION.md) records hosted verification. Crash-atomic multi-key reset, old uncoordinated clients and all-tab lifetime-profile consistency remain open. The Russian short-screen discard-target regression is resolved and hosted-verified in v1.0.261011-5; remaining responsive work is tracked in the [UI backlog](UI_IMPROVEMENT_BACKLOG.md). Missing tile/catalog translations and edition/sticker labels remain. Season powers, Flower interactions/mutations and Yakuman Succession are published; see [Flora](FLORA_IMPLEMENTATION.md). Physical-device/assistive-technology review and unexplained historical timeouts remain open.                                                                                 |
| Animation and audio                 | Live music/SFX, generated assets, controls, and native Chromium/mobile playback are verified in [Audio implementation](AUDIO_IMPLEMENTATION.md). Listening/mix review on real speakers and iOS/Safari remains distinct from headless decoding checks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| New-player experience               | Observe newcomers using practice and regular play. Verify that they can state a plan and explain its payoff, not merely follow highlights.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Consistent UI and localization      | Classic tap interception/double-selection and clipped tile details have targeted fixes and browser coverage. The historical Table Loop first-click miss has not been conclusively attributed to a single cause; retain its diagnostic assertion. Continue later-phase/long-translation review, including tile tooltip prose and pack descriptions. New localized strings have key parity but have not received native-speaker review.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Release readiness                   | The latest publication evidence is recorded in Current implementation above. The earlier asset-delivery release v1.0.261008-21 has independent CI (2,809 tests), matching manifest/tag/runtime and 16/16 hosted guide/asset checks; see [release evidence](ASSET_DELIVERY_IMPLEMENTATION.md). Its ten real old→new worker upgrades preserve saves and decode all replacement artwork offline, and the offline payload drops from about 70 to 36 MiB. The full native audit and targeted rechecks retain their original failures. Save-aware screen recovery shipped in v6, but the ownership checkpoint's original module-fetch failure remains unexplained. Earlier [static route checks](STATIC_ROUTE_IMPLEMENTATION.md) and [save-aware update scenarios](PWA_UPDATE_IMPLEMENTATION.md) remain regression evidence, not proof of every historical-client migration. Further font/JavaScript delivery, measured cold-load latency, other installed-client versions and physical-device checks remain open. |

Evaluate these concerns against the completion contract above. Passing the current
suite is not proof of human enjoyment, every combination, or an unverified deployment;
those limits must be stated without making the release scope unbounded.
