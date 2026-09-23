# Release versioning and provenance

**Latest verified public deployment:** September 23 UTC (September 22 local), 2026,
**v1.0.260923-3**.

## Charter eligibility publication checkpoint

Checkpoint `001099189ef4e108b58491807f97a498a34fed7d` enforces persistent upgrade
eligibility plus current-run base ownership for offers and purchases, retains
Liquidation's qualifying historical run and quietly preserves actual legacy
upgrade purchases. Archive-only discovery does not grant eligibility.
[Actions run 35806468045](https://github.com/evgenyvinnik/tensho-web/actions/runs/35806468045)
passed release checks, **1,120 tests in 101 files**, the production/PWA build and
Pages deployment. Local evidence includes 44 earlier browser checks and ten final
purchase/reload/legacy-hydration cases; fixtures and initial failures are retained
in [Charter evidence](CHARTER_PROGRESSION_IMPLEMENTATION.md#achievement-gated-offers-and-purchases).

- Version/tag: **1.0.260923-3** / `v1.0.260923-3`.
- Built/tagged commit: `c3924b464c7e17fea5e414dd5852ba1586e92b07`.
- Public release manifest and remote tag match. The unchanged Money Tree PNG
  matches its recorded SHA-256.
- Fresh 1280×800 and 320×740 touch contexts passed displayed version, seeded
  Table Loop pair placement/refill, reload retaining spent actions and Spanish
  Classic loading, without JavaScript page errors.
- Build: 343 modules, 269 precache entries / 65,775.37 KiB. Existing bundle,
  Browserslist and Actions-runtime warnings remain.
- Hosted script/screenshots: `/tmp/tensho-charter-eligibility-HIINkp/`.

Work was already on main; no additional branch merge or history rewrite was
necessary. Main was fast-forwarded to the workflow version commit; this
evidence-only follow-up uses `[skip ci]`. Separate mechanics choices, spending
classification and Full Unlock profile behavior remain open. Fresh browser
checks do not prove physical-device behavior or installed-PWA upgrade handling.

## Pack provenance publication checkpoint

Checkpoint `ee14de585550a851bcf0b3e63ec8a4d88adbe85f` corrects the two pack-use
Charter prerequisites without changing general-use statistics, old unlocks or
Observatory scoring. [Actions run 35804055120](https://github.com/evgenyvinnik/tensho-web/actions/runs/35804055120)
passed release checks, **1,097 tests in 100 files**, production/PWA build and
Pages deployment. Local checks additionally passed eight English/Spanish
desktop/touch purchase/claim/use/unlock/reload journeys with no retries.

- Version/tag: **1.0.260923-2** / `v1.0.260923-2`.
- Built/tagged commit: `2806b49f452aa943ad022ecbbdd453816a0498e0`.
- Public release manifest and remote tag match; the unchanged Money Tree PNG
  still matches its recorded hash.
- Fresh 1280×800 and 320×740 touch contexts passed displayed version, real
  seeded Table Loop pair placement/refill, reload retaining spent actions,
  and Spanish Classic loading without JavaScript page errors.
- Build: 343 modules, 269 precache entries / 65,774.81 KiB. Existing bundle,
  Browserslist and Actions-runtime warnings remain.
- Artifacts and hosted verification script: `/tmp/tensho-pack-provenance-JHtp69/`.

Main was fast-forwarded to the workflow version commit; the evidence-only
follow-up uses `[skip ci]`. Broader Charter eligibility and the separately asked
Observatory rule choice remain open. No whole-project, physical-device or
installed-PWA upgrade completion is claimed.

## Charter progression publication checkpoint

The user's standing authorization to publish a tested checkpoint was applied to
the follow-up work already on main. No additional branch merge, history rewrite
or branch deletion was needed. Checkpoint commit: `c5b4dce5fe0b99b51440c247b6608bf30dc1c4a1`.

[Actions run 35803076125](https://github.com/evgenyvinnik/tensho-web/actions/runs/35803076125)
passed all thirteen release checks, **1,089 application tests in 99 files**, the
production/PWA build and Pages deployment. Build output: 343 modules, 269 precache
entries / 65,774.40 KiB. Existing bundle/Browserslist and Actions-runtime warnings
remain. The version uses the UTC date, not the local September 22 calendar date.

- Version/tag: **1.0.260923-1** / `v1.0.260923-1`.
- Built/tagged commit: `59f5d66aecacd57195409e6cadcb3bc719aa4fa1`.
- The public release manifest and remote tag both match this commit/version.
- The hosted Money Tree PNG matches the checked-in SHA-256 in [art provenance](CHARTER_ART.md#money-tree-portrait).
- Fresh 1280×800 desktop and 320×740 touch contexts passed displayed version,
  real seeded Table Loop pair placement/refill, reload retaining spent actions,
  and direct Spanish Classic loading, with no JavaScript page errors.
- Local verification includes all 1,089 units, strict TypeScript, targeted lint,
  formatting and production build. Browser results retain one startup timeout
  followed by three unchanged successful repetitions; details and earlier fixture
  failures are preserved in [Charter progression evidence](CHARTER_PROGRESSION_IMPLEMENTATION.md).
- Hosted screenshots and verification script: `/tmp/tensho-charter-release-bQltze/`.

Main was fast-forwarded to the workflow version commit. This documentation-only
follow-up uses `[skip ci]` to avoid another identical runtime deployment. Fresh
client checks do not prove an existing installed PWA upgrades or physical-device
behavior. Unconfirmed mechanics and the choice of primary Play mode are unchanged.

## September 22 publication checkpoint

The user authorized merging `table-loop-prototype` into main for deployment.
GitHub authentication is now valid and main was confirmed unprotected. Remote
main is one version-bump commit ahead of the feature branch; preserve that commit
with a normal merge, not a history replacement. The feature branch is retained.

Prepublication checks: all **13 release regressions**, **1,067 application tests
in 96 files**, strict TypeScript, targeted lint, selected formatting and **28
desktop/mobile browser checks** passed. The first full unit attempt had six
five-second timeouts; the unchanged full rerun passed. Browser coverage includes
Omen reward delivery/expiry, paid Merchant swapping and reload, and full Table
Loop runs through victory and defeat. See [Omen effects](OMEN_EFFECTS_IMPLEMENTATION.md).

The local production build was interrupted under extreme host load after
TypeScript completed and Vite began transforming, not reported as a pass.
The clean GitHub runner then passed all 1,067 tests and the production/PWA build:
342 modules, main entry `index-VuvrMu5E.js`, 268 precache entries / 63,927.40 KiB.
Existing large-chunk/Browserslist and action-runtime deprecation warnings remain.

Publication succeeded in [Actions run 35799475785](https://github.com/evgenyvinnik/tensho-web/actions/runs/35799475785):

- Checkpoint commit: `6efc421`; merge: `ff92125ba324496e585288882adbe2b3f59e91d2`.
- Deployed version/tag: **1.0.260922-1** / `v1.0.260922-1`.
- Built/tagged commit: `cc50324adb1a07c2887e71e219634bb671f6eb45`.
- The public [release manifest](https://evgenyvinnik.github.io/tensho-web/release.json)
  returns that exact version, tag and commit; the remote tag matches.
- Fresh hosted browser contexts at 1280×800 and 320×740 verified the displayed
  version, a real seeded Table Loop pair placement, rack refill, reload retaining
  the spent action, and direct Spanish Classic loading. Neither reported a
  JavaScript page error. Local screenshots are in `/tmp/tensho-omen-effects-WKiQIX/`.
- Main contains the feature branch's complete history. Both branches were pushed
  normally; the feature branch was retained and no ref was force-pushed.

This proves fresh-client delivery, not an existing installed PWA's upgrade or
physical-device behavior. The documentation-only evidence commit uses `[skip ci]`
to avoid publishing an identical application again. The following sections record
the original September 9 release implementation and its then-open checks.

## Correctness changes

The previous workflow created its tag before retrying a rejected branch push. A
concurrent main commit forced a rebase, leaving the tag on the old commit while
the build used the new one. Separately pushing the branch and tag also allowed
a rejected tag to leave a version-bump commit published without its tag. Both
failures reproduced by executing the actual workflow scripts against temporary
local bare Git repositories: the original six regression checks had two failures.

The workflow now publishes `HEAD` to main and the version tag in one atomic push.
Neither ref is forced. A bounded retry fetches and rebases onto main, then uses
the resulting HEAD for both refs. Conflicting changes or rejected tags fail
without partially publishing the two refs. Guards reject non-main publication,
malformed versions, and a package version that differs from the build version.

Versions retain the format `1.0.YYMMDD-N`, using UTC and one more than the highest
numeric tag suffix for that day, including when older suffixes have gaps.

After building, the workflow verifies the remote tag against the actual checkout
and writes `dist/release.json` into the Pages artifact:

```json
{
  "schemaVersion": 1,
  "version": "1.0.260909-1",
  "commit": "<full Git commit SHA>",
  "tag": "v1.0.260909-1"
}
```

This example is illustrative, not a published release. Version refs are reserved
**before** dependency installation, application tests, and the build. A later
failure can therefore leave a candidate tag without a successful deployment.
The existence of a tag alone must never be reported as proof of deployment.

## Runtime and verification gates

- Node 22 is selected from `.nvmrc`; `package.json` requires at least 22.18.0.
- Bun 1.3.3 is selected from the manifest's `packageManager` field. This replaces
  the old 1.1.38 CI pin. Bun's default text lockfile arrived in 1.2; see the
  [official lockfile documentation](https://bun.com/docs/pm/lockfile).
- The setup actions read the repository pins using their documented
  [Node version-file](https://github.com/actions/setup-node/blob/main/README.md)
  and [Bun version-file](https://github.com/oven-sh/setup-bun/blob/main/README.md)
  inputs. Dependencies and `bun.lock` are unchanged.
- Release regressions run before version publication. Application tests run
  before building. Tag/checkout provenance is checked before artifact upload.
- The Pages base path, SPA fallback, and serialized, non-canceling deployment
  concurrency remain in place.

Run `bun run test:release` for the 13 isolated release checks. They extract and
execute the workflow's scripts, covering UTC numbering, tag gaps, idempotence,
concurrent main changes, tag rejection/collision, conflicting package updates,
publication guards, and artifact provenance. They also check gate ordering and
runtime pins. All Git mutations are confined to disposable local fixtures.

Latest local verification: all 13 release tests, all 520 application tests in
46 files, strict TypeScript, and the `/tensho-web/` production build passed.
`bun install --frozen-lockfile --dry-run --ignore-scripts` passed with Bun 1.3.3;
this is not a clean Linux installation test. The prior 126 browser checks were
not rerun for the release-only changes. Large-bundle and stale-Browserslist build
warnings remain.

## Still requiring live evidence

A read-only request to the public Pages root returned HTTP 200 on September 9.
That establishes availability, not that this worktree is deployed. Local GitHub
CLI authentication reported an invalid token; no authenticated workflow or
environment-permission verification was obtained. No real repository branch,
tag, commit, push, or deployment was changed during these local checks.

After an authorized deployment, inspect the successful Actions/Pages run and
fetch `/tensho-web/release.json`. Match its commit against the remote version
tag and the build checkout, then verify the displayed version, direct localized
routes, and an existing PWA client's upgrade. Branch protections, hosted runner
execution, deployment permissions, artifact delivery, and service-worker upgrade
behavior remain live-release checks, not conclusions from the local tests.
