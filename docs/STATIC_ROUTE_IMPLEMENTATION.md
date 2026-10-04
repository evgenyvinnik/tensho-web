# Real Pages route entries and indexing boundaries

October 3, 2026 local time. This follow-up addresses deployed HTTP behavior, not
search ranking, indexing confirmation or full localized editorial pages.

## Reproduced defect

On published v1.0.261004-1, direct About, How to Play and FAQ requests returned
200, but `/en/` and `/en/play` returned 404. The custom 404 shell let JavaScript
recover the game, concealing the response-status defect during normal play.
The deployed guide suite passed its two navigation cases but failed all six
no-JavaScript guide cases when checking their header's Play destination.
Their earlier readability, canonical, image, text-enlargement and keyboard
assertions passed before that failure. No failed check was removed.

Google's [JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
distinguishes initial HTTP responses from rendered content, and its
[noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
requires the directive to be available to crawlers. This implementation supplies
real static entry documents and raw-HTML directives rather than relying only
on a JavaScript repair.

## Implementation

- One side-effect-free catalog supplies all thirteen language codes and ten
  routes to i18n, the router and the build. Existing public imports remain valid.
- After Vite finalizes `index.html`, the public-site plugin emits 130 physical
  language/screen directory entries. They preserve built chunk hashes, deployment
  base paths, preload and PWA references; they never copy `/src/main.tsx`.
- Menu aliases retain the root canonical and `index, follow`. Other game screens
  (including personal collection/settings and the in-game reference) contain
  `noindex, follow` in their initial HTML. They are not added to the sitemap.
  The three editorial guides remain separately indexable, canonical static pages.
- Client-side language-layout navigation applies the same robots policy, including
  restoring menu indexing after leaving a state screen. It does not invent titles,
  translations, review data or language alternates.
- Only known routes get physical entries. Unknown paths retain the host's 404.
  Directory slash redirects must preserve query parameters such as `practice=1`.
  The existing practice URL assertion now accepts that standard optional slash;
  its path and complete query remain asserted.

This is static **entry-shell generation**, not game SSR, search-engine ranking
proof, or thirteen translated About pages. The game still requires JavaScript.
Guide images and established artwork are unchanged. The PWA adds 130 small HTML
entries; this is not a bundle-size optimization.

## Verification ledger

Evidence root: `/tmp/tensho-completion-QdcC22`.

- Initial live failure: `hosted-guides.log`, JSON and screenshot/trace directory;
  2/8 passed, six actual 404 assertion failures, no retries.
- Twenty-one new unit cases cover all 130 entries, initial robots metadata,
  unchanged hashed/base/PWA references, missing/duplicate metadata rejection,
  known and unknown route policies, and menu → state → menu DOM updates.
  The focused public-site/locale set passes **64/64**.
- TypeScript, targeted lint and Pages-base production build pass. The build
  emits 408 PWA entries / 69,344.82 KiB. Existing chunk-size/Browserslist warnings
  remain; no mobile performance score is claimed.
- Production browser checks use a plain Node directory server with no SPA
  fallback, not Vite's forgiving preview behavior. `e2e/static-routes.spec.ts`
  is explicitly enabled with `VERIFY_STATIC_ROUTES=1` for built/hosted runs.
  It requests every language/screen entry, checks initial metadata and actual
  hashed script paths, rejects unknown routes with 404, and exercises native
  desktop/touch navigation, query preservation, reload and page-error checks.
- Final static-browser set: **12/12 passed**, 30.7 seconds, no retries. All three
  guides pass desktop/touch no-JavaScript, 320/768/1440px widths, 200% root-text,
  keyboard skip/focus, local asset and header HTTP checks. Both actual menu →
  guide → practice journeys pass, with the original deadlines preserved.
- Four additional production desktop/touch × current/legacy Bell-save journeys
  pass normalized claim, loaded art hash, legal play and exact reload with zero
  page errors. This is a routing/save regression check, not a new balance claim.
- Full local suite: **1,601/1,601 tests across 137 files**, 154.54 seconds. All
  **13 release checks** pass. Router lint reports six Fast Refresh warnings and
  zero errors; the new files' targeted lint is clean.

## Published checkpoint

Published **v1.0.261004-2**, implementation commit
`43394a2f8ad504c68c20fb8a9c4e373ce61b29c4`, built/tagged commit
`3c38ec4c183162b39b56ffef0c49d5069a1ee667`.
[Independent CI](https://github.com/evgenyvinnik/tensho-web/actions/runs/37171516561)
passes all **1,601 tests in 137 files**, **13 release checks**, build and deployment.
Public `release.json` matches the exact Git tag.

All **12 hosted browser checks pass**, 2.1 minutes, with no retries or deadline
changes (`hosted-fixed.log`/JSON/traces). Each browser profile requests all 130
known route entries and confirms real 200 responses plus initial metadata;
unknown paths remain 404. No-JavaScript guides, keyboard/large-text checks,
menu → article → practice, native touch navigation, and query/reload behavior
pass against GitHub Pages itself. Four additional hosted current/legacy save
journeys pass with exact state restoration, art hashes and zero page errors
(`hosted-game-continuation.log`). Isolated profiles do not modify the user's save.
The initial six live failures remain preserved, not relabeled as passing.

Owner Search Console verification/submission, physical-device accessibility,
native-speaker editorial review and migration from every historical installed
service worker remain open. No Google account or external indexing submission
has been modified.
