# Release versioning and provenance

**Verified locally:** September 9, 2026. **Public deployment of these changes:** not performed.

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
