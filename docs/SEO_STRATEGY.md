# Tensho SEO strategy

Updated: September 12, 2026. This is a delivery plan and implementation record, not a claim that Google has indexed or ranked the new pages.

## Objective

Help the right players discover Tensho, understand what makes it different, and reach a first useful decision in the game. An extensive About page is worthwhile when it answers real questions; length and repeated keywords are not the objective. Prioritize original explanations, honest examples and clear internal links. This direction follows [Google's SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

Tensho should describe itself as a **single-player Mahjong roguelike playable in the browser**, not traditional competitive Riichi or tile-matching solitaire. Classic and the Table Loop experiment need separate explanations. Do not promise that unfinished Flower/Season powers, every proposed experiment, or universal mobile compatibility are already delivered.

## Initial public pages

Paths below are relative to the production project root, `/tensho-web/`.

| Page | Reader's question | Content and next action |
| --- | --- | --- |
| `about/` | What is Tensho, and why try it? | Game premise, two modes, meaningful Decrees, art approach, development status; link to practice |
| `how-to-play/` | How do these unfamiliar tiles become a decision? | Illustrated sequence, staging versus committing, resource choices, persistent Table Loop groups, upgrades and learning from a loss |
| `faq/` | Will this work for me? | Browser access, prior knowledge, phone controls, local saves, motion/audio, artwork and honest limitations |

Implemented sources: `src/publicSite/content.ts`, `render.ts`, `site.css`, and `scripts/publicSitePlugin.ts`. Vite emits real `about/index.html`, `how-to-play/index.html`, `faq/index.html`, `learn.css` and `sitemap.xml` into the build. These guides do not require React or JavaScript to read. The menu and no-JavaScript fallback link to them through the deployment base.

Each guide has its own title, description, absolute canonical, English language attribute, Open Graph text, one main heading, section anchors and modest AboutPage/WebPage structured data. Content is the same for humans and crawlers. The About illustration is explicitly identified as artwork rather than a gameplay screenshot. Actual tile assets illustrate the numbered sequence.

Real HTML avoids depending on the game booting before a visitor or crawler can understand a page. Google can render JavaScript, but rendering is a separate stage and response status matters. We therefore test the guides directly, not just client-side navigation to them. See [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Search intent hypotheses—not keyword-volume research

- Discovery: “Mahjong roguelike”, “browser Mahjong strategy game”, “single player Mahjong game”. The About page must immediately clarify the solitaire distinction.
- Branded learning: “how to play Tensho”, “Tensho tile combinations”, “Tensho Classic vs Table Loop”. Teach the actual move, not a generic Mahjong ruleset.
- Practical questions: “Tensho save progress”, “Tensho mobile”, “Tensho Decrees”. Give specific limits instead of broad compatibility promises.
- Adjacent interest: players who like combo-building games. Explain Tensho's own decisions; do not create thin “Balatro alternative” pages or imply an affiliation.

These are editorial starting points. No search volume, competition score, ranking forecast or conversion baseline has been measured.

## Content roadmap

1. **This release:** publish the three substantial guides and verify their deployed URLs. Get a newcomer to follow the how-to-play instructions; correct any step that does not match what they see.
2. **After mechanics stabilize:** publish a tile-family guide with actual tile examples, a Classic-versus-Table-Loop comparison with the same decision shown in both, and a small Decree guide using working combinations. Each article should answer a distinct question and link to the relevant practice or mode.
3. **After real playtests:** add annotated real gameplay screenshots, a few reproducible seed walkthroughs, and a development journal explaining observed problems and changes. Separate intended designs from shipped behavior.
4. **After evidence of demand:** expand the pages that attract relevant impressions but leave readers confused. Update existing explanations before generating many near-duplicate articles.

Every mechanics change should include a guide-content review. Keep examples tied to current implementation and versioned source. Only show an editorial update date when the content is actually reviewed; deployment alone is not an editorial update.

## Localization

The initial public guides are English. The game's 13 languages do not mean these articles are translated. Menu links identify English in their accessible names and use `hreflang="en"`; public pages also state the limitation.

For a later translation release, agree terminology with the in-game locale, have a fluent reviewer test the instructions, publish a real translated URL, and add reciprocal page-specific `hreflang` links and a self-canonical. Do not serve English under 13 locale paths or declare alternates that do not exist. Choose the first translation using player feedback and actual search data, not assumed audience size.

## Indexing, hosting and metadata boundaries

- Keep GitHub Pages. The production public-guide canonical origin defaults to `https://evgenyvinnik.github.io/tensho-web/`; `VITE_BASE_PATH=/tensho-web/` controls local links. `VITE_SITE_URL` overrides guide/sitemap canonical origin for a future domain change. It does **not** automatically migrate hard-coded game-shell/social/robots URLs: audit those together before changing domains.
- The generated sitemap lists the root and three guides, not seeded games, shop state, settings, achievements or collection state. It deliberately has no invented `lastmod` dates. Sitemap omission does not itself prevent indexing.
- Remaining SPA work: the game shell currently shares root metadata/canonical across routes. Decide which locale landing pages deserve their own indexable HTML, and add a route-aware `noindex` policy for transient game-state pages. Do not describe that work as completed by these guides.
- Important hosting limitation: crawlers look for robots rules at the **host root**. This project serves `robots.txt` under `/tensho-web/`; it cannot control `https://evgenyvinnik.github.io/robots.txt`. Do not modify another repository or the account site without authority. Use an owner-verified Search Console property to submit this project's sitemap. See [Google's robots.txt location rules](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt).
- Public guide navigation is excluded from the service worker's game-shell fallback. Test both a first visit and an existing service-worker installation after deployment. Local build output alone does not prove an installed client updates correctly.
- Do not invent ratings, review counts, awards, authors or social accounts. Unsupported aggregate rating and social-author claims were removed from the shell before this follow-up. Keep structured data representative of visible facts; even valid markup does not guarantee enhanced results. See [Google's structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## Images and performance

Continue the emerald, ivory and gold illustration style. Store names/rules as accessible text, not words baked into art. Decorative scrolls use empty alt text when their containing control supplies the name. Teaching images have meaningful alt text. Preserve dimensions to reserve layout space; lazy-load below-the-fold examples, not the hero.

Current limitation: the new hero is a 1536×1024 PNG of approximately 2.3 MB; the existing game's precache is already large. A later performance pass should create optimized responsive derivatives, measure mobile loading and avoid forcing every future illustration into the initial precache. Do not add a gallery's worth of high-resolution art above the instructions. No performance score is claimed here.

## Verification and launch checklist

- [x] Run TypeScript, guide-render/asset tests, and a production build with the Pages base (see worker-mode caveat below).
- [x] Check direct guide requests return 200 with complete HTML and correct title/canonical—not the SPA shell or custom 404 (local production preview).
- [x] Verify local guide images/CSS, section links, menu links and practice destinations under `/tensho-web/` (local production preview).
- [x] Check 320px, tablet and desktop layouts and reading with JavaScript disabled.
- [x] Check 200% root-text enlargement at 320px and keyboard skip-to-main/next-link focus.
- [ ] Review native browser zoom, screen-reader behavior and physical devices; text-enlargement automation does not replace these checks.
- [ ] Verify live Pages responses and service-worker upgrade behavior after an authorized deployment.
- [ ] Owner verifies Search Console access, submits `sitemap.xml`, and inspects all three guide URLs. No account changes or submission have been performed by this implementation.

Automated coverage lives in `src/publicSite/render.test.ts` and `e2e/public-guides.spec.ts`. Record actual commands and outcomes below; unchecked launch items are not implied complete by code existing.

### Local verification record — September 12

**Latest checkpoint, after Summer and the guide accessibility fixes:** **8/8
production browser checks passed** in 19.9 seconds, using the original timeout
and no retries. All three guides work without JavaScript at 320/768/1440 widths,
and with root text doubled to 32px at 320px. The overflow assertion uses the
requested viewport width, not a mobile layout viewport that can expand around
overflow. Keyboard checks verify the visible skip-link outline, focus moving
into `main`, and Tab continuing to the practice link. Direct HTTP 200 responses,
titles/canonicals, loaded images, links and both menu → About → practice flows
also pass. The final desktop About screenshot was visually reviewed.

The final full unit suite passed **790/790 in 72 files** (55.79 seconds), followed
by strict TypeScript and the Pages-base production/PWA build. Final precache:
**234 entries / 53,876.19 KiB**; chunk-size and stale Browserslist warnings remain.
This is local verification, not deployed indexing, a native-speaker review or
physical-device accessibility certification.

New failed attempts and fixes are retained, not relabeled as passes:

- The first preview attempt failed 8/8 because I started Vite preview without
  `VITE_BASE_PATH=/tensho-web/`. Requests under the expected project path reached
  the game-shell fallback. Restarting with the matching base corrected this
  verification setup error; no production code changed for that mistake.
- With the correct preview mount, 2/8 passed. Enlarged text exposed a nonwrapping
  wordmark; keyboard activation scrolled to the main element without focusing it.
  The wordmark now wraps and `main` has `tabindex="-1"`.
- The next run passed 6/8. The how-to tile strip still overflowed with enlarged
  text. Allowing its flex images to shrink (`min-width: 0`) preserved all three
  tiles and their aspect-contained artwork. The subsequent full guide run is
  the 8/8 pass above.

Artifacts: `/tmp/tensho-summer-seo-jgY1pJ/`. The attempts are
`public-guides-initial`, `public-guides-correct-base`, `public-guides-final`; the
actual final passing output is `public-guides-verified`.

Reproduction (build and preview must use the same base):

```sh
VITE_BASE_PATH=/tensho-web/ bun run build
VITE_BASE_PATH=/tensho-web/ ./node_modules/.bin/vite preview --host 127.0.0.1 --port 4178 --strictPort
# In a separate terminal while that preview is running:
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4178/tensho-web/ npx playwright test e2e/public-guides.spec.ts --reporter=list --workers=1 --trace=retain-on-failure
```

**Earlier Monsoon checkpoint:** that production build passed all **8/8 public-guide browser checks** (10.7 seconds) with the original 30-second test timeout, without retries. This included the saved-run warning/resume links, desktop/mobile menu → About → practice, all no-JavaScript pages and their responsive layouts, before the enlarged-text/keyboard assertions were added. Artifacts: `/tmp/tensho-monsoon-G8cNNV/public-guides-production`. The full unit suite also passed 778/778; see [Monsoon verification](MONSOON_IMPLEMENTATION.md). This successful run does not identify the cause of the earlier timeouts or turn those attempts into passes.

Earlier attempts, retained for transparency:

- Initial focused unit run: **17/17 passed** (nine static-render/sitemap/origin cases and eight scroll asset cases).
- Pages-base production build: passed TypeScript and Vite/PWA generation. It emitted all three HTML guides and the sitemap. The build reported **233 precache entries, 51,775.37 KiB**; chunk-size and stale Browserslist-data warnings remain.
- Targeted ESLint and `git diff --check`: passed before the final saved-run warning follow-up.
- Production-preview browsers, under the real `/tensho-web/` path: **7/8 passed**. All six no-JavaScript guide checks passed, including 320/768/1440px overflow checks, loaded images, direct HTTP 200 responses, metadata and navigation-link responses. Mobile menu → About → practice passed. Desktop's combined flow exceeded its 30-second budget and teardown timed out.
- Repeating only the combined navigation flow twice per browser with a 60-second budget: **3/4 passed**, not a clean run. One desktop attempt passed; the other reached the actual practice screen but timed out and produced a trace-archive error during teardown. Both mobile attempts passed. This does not establish the timeout's root cause or guarantee acceptable loading performance. Do not label these as an all-green browser suite.
- Screenshots and available failure evidence are preserved locally at `/tmp/tensho-seo-680PMZ/production-initial` and `/tmp/tensho-seo-680PMZ/production-navigation-repeats`. The desktop About screenshot was visually reviewed. These temporary artifacts are not committed deliverables.
- After those browser runs, the guides gained explicit warnings that practice can replace a saved Table Loop run, alongside non-resetting resume links. Unit coverage checks those warnings and destinations. The browser screenshots above precede that text-only follow-up.
- Final warning/asset verification: the standard fork-worker rerun failed to start both workers and executed **zero tests**. Re-running the same files with `bun run test:run src/publicSite/render.test.ts src/components/tableloop/TableDecreeArt.test.tsx --maxWorkers=1 --pool=threads` passed **17/17**, including the saved-run warning and resume destinations. This is a successful alternate-worker run, not a retroactive pass for the fork-worker attempt.
- Final `VITE_BASE_PATH=/tensho-web/ bun run build` passed TypeScript and production/PWA generation with the warning/resume links included. Final precache: **233 entries, 51,776.08 KiB**. Browser/layout observations above are still from the preceding build; they are not relabeled as a final-build full regression pass.
- Final targeted ESLint (public-site generator/content/tests, menu, scroll renderer/tests and affected browser specs) and `git diff --check` passed.
- The initial SEO slice did not execute the Honor Court/Wide Rack browser cases; their asset existence, native PNG dimensions and shared renderer were checked. Those four desktop/mobile cases subsequently passed in the Monsoon follow-up. No complete gameplay browser suite, physical-device review, live Pages deployment or Search Console submission was performed for this SEO slice.

Next verification priorities: native browser zoom, screen-reader/physical-device review and the deployed service-worker upgrade path. Keep investigating startup performance if the earlier recorded timeout recurs; a fresh green run does not establish long-term performance or explain the older failures.

## Measurement after launch

**On-demand screen follow-up:** all 8 production-guide checks passed again as
part of the 18-check route-loading production run. Menu/direct Table Loop now
request 24.0% / 37.3% less English JavaScript than the previous entry/registration
pair; this excludes CSS/images/fonts and background offline installation. The
offline bundle remains **264 entries / 58,596.00 KiB**, and no loading-time or
search-ranking gain is claimed. [Route-loading verification](ROUTE_LOADING_IMPLEMENTATION.md)
records the full-suite timeout and unchanged passing follow-up as well as exact
code-byte evidence. Live indexing and deployed worker upgrades remain unverified.

**Preceding local regression, September 12:** the Merchant release-preparation
build passed all **8/8 production-guide checks** without retries (18.1 seconds)
under `/tensho-web/`, including the enlarged-text and keyboard assertions above.
The full unit suite passed 830/830 in 77 files. Final precache is now **236 entries /
58,587.01 KiB**; the large payload remains a performance concern, not an SEO
achievement. [Release verification](TABLE_LOOP_RELEASE.md#verification) records
scope and artifacts. No live indexing, deployment or Search Console work occurred.

Establish a baseline in Search Console: indexed canonical pages, impressions, clicks, CTR and the queries/pages producing them. Compare comparable periods after several weeks and note releases and low sample sizes. Treat rankings as observations, not guarantees.

The meaningful product outcome is a reader reaching a comprehensible first move and wanting another run. Measure that initially through consented playtests. If event analytics are later approved, define guide-to-practice clicks, first committed group and practice completion with a clear privacy/data-retention policy. This change adds no tracking, cookies for marketing, or external analytics service.

Search discovery cannot compensate for a confusing or unrewarding game loop; content and gameplay improvements should proceed together.
