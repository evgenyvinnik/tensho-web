# On-demand screens and offline navigation

September 12, 2026. Local implementation/verification; not a deployed performance
score, a service-worker upgrade audit, or completion of the whole game.

## Runtime change

All nine screens in `src/App.tsx` now use module-scope `React.lazy` imports.
The menu, Classic play, Table Loop, shop, results, achievements, Codex, collection
and settings each have a separate production chunk. Their component identities
remain stable across rerenders. Shared audio, VFX and progression lifecycles stay
above the routes; this change does not change gameplay rules or saved journals.

`LanguageLayout` owns the loading boundary inside `LanguageSync`, so URL-language
synchronization runs even when the requested screen is still downloading.
`RouteLoading` uses the existing localized `common.loading` strings, announces a
polite status and honors both system and app reduced motion. The fallback itself
cannot suspend on translations. No new translation keys or artwork were needed.

Rejected module downloads use the existing route error boundary and its explicit
reload action. Reloading retries the download without deleting the saved run.
The existing error boundary still has untranslated English fallback copy; this
pass does not claim full error-dialog localization.

The PWA continues to precache **all** screen chunks, generated illustrations,
tiles, audio and guide pages. On-demand execution is not a reduction of the
offline content promise. The approximately 57 MiB installation remains a cost
to address separately; the worker may download unvisited screens in the background.

## Measured code sizes

Before the change, the inspected build had 14 JavaScript assets: a 1,383,319-byte
entry, the 5,761-byte registration helper and twelve on-demand language bundles.
The new entry is 750,791 bytes (45.7% smaller), **but that is not the total code a
page needs**. Shared chunks and the selected screen are also requested.

Cold, English, service-worker-blocked browser measurements record decoded script
body sizes at the first visible menu/choice screen. Both desktop and mobile agree:

| Entry path | Requested JavaScript | Compared with old entry + registration |
| --- | ---: | ---: |
| Menu | 1,055,338 bytes | 24.0% less |
| Table Loop, direct | 870,918 bytes | 37.3% less |

The old comparison is derived from the inspected build assets, not a historical
browser timing trace. These are code-byte reductions, not loading-time or frame
rate improvements. Images, CSS, fonts, language downloads and background worker
traffic are excluded. The menu still loads shared Classic orchestration and
tutorial code; the shared entry still exceeds Vite's 500 kB warning threshold.

Machine-readable per-resource evidence:
`/tmp/tensho-route-loading-vjPja8/script-metrics.json`. The four measurement cases
passed without retries (10.2 seconds), after the main production suite.

## Verification

- Strict TypeScript and the Pages-base build passed: 334 modules,
  `index-BLLkton_.js` at 750.79 kB / 227.30 kB gzip, **264 precache entries /
  58,596.00 KiB**. Chunk-size and stale Browserslist warnings remain.
- **18/18 production browser checks** passed without retries (27.3 seconds):
  all ten new desktop/mobile route checks plus eight public-guide checks.
- Menu navigation requests only visited screen chunks, without another document
  load. Direct Table Loop does not request menu or Classic screen chunks.
- A deliberately held Spanish screen download displays `Cargando...` at 320px,
  with no spinner animation under reduced motion, then resolves normally.
  Its final mobile screenshot was visually reviewed.
- An intentionally failed Codex download shows the error boundary; the explicit
  retry succeeds and the real, previously created Table Loop journal is unchanged.
- After actual worker installation, a fresh context goes offline and opens
  previously unvisited Codex/Table Loop screens and three starter scroll images.
  Responses are asserted to come from the worker. A real starter choice survives
  offline reload, and About/how-to navigation works without network access.
- Three component checks cover English/Spanish status copy and first-render
  system/app motion preferences. The final full unit run passed **833/833 in
  78 files** (145.03 seconds), using one thread worker and original timeouts.
- The full development-browser run completed **233 passed / 1 timed out /
  10 skipped** (23.6 minutes), without retries. The ten skips are exactly the
  production-only cases verified in the separate production run above. All
  117 eligible mobile cases passed; desktop passed 116/117. This is not a clean
  full-suite pass. Failure and follow-up evidence are retained below.
- **13/13 release-workflow checks** passed (136.69 seconds), exercising the
  actual workflow bodies in disposable local repositories. They verify atomic
  version/tag publication, conflicting updates and artifact provenance; no
  repository branch or GitHub deployment was changed.
- Targeted ESLint has zero errors and six existing router mixed-export warnings.

Artifacts: `/tmp/tensho-route-loading-vjPja8/production-final/`.

### Failed attempts retained

The first production run passed **4/8**. Both Spanish loading cases exposed a
real boundary-placement bug: suspending the entire router prevented its language
sync effect from mounting, leaving the fallback in English until the screen
arrived. Moving the boundary inside the language wrapper fixed the behavior.
The two recovery cases failed in the new test code because it referenced missing
`en.error` keys; the runtime had correctly displayed its existing English fallback.
The tests now assert that actual copy. No timeouts or assertions were relaxed.

The initial three component checks passed but emitted React `act` cleanup
warnings. Wrapping the settings reset in `act` removed the warnings on rerun.
Initial production artifacts remain at `/tmp/tensho-route-loading-vjPja8/initial/`.

The full browser run's desktop 320×568 rack test hit its original 60-second
budget, then the context closed during the next assertion (88.739 seconds
including teardown). All fourteen tiles had been staged successfully. The trace
last records the first return click being performed; it does not establish an
application exception, incorrect selection result or a specific cause. High host
load was observed during this portion, but correlation is not a diagnosis.
The other desktop sizes and all three mobile sizes passed in that same run.

With **no source, assertion or timeout changes**, the original 320px case then
passed twice per browser, **4/4 without retries** (47.2 seconds), with traces
enabled. Desktop took 11.0 and 7.1 seconds; mobile took 9.1 and 9.5 seconds. The
failure did not reproduce, but these passes do not retroactively make the full
run green or explain its timeout. No speculative gameplay patch was applied.

Full-run evidence: `/tmp/tensho-route-loading-vjPja8/full-browser.json` and
`/tmp/tensho-route-loading-vjPja8/full-browser/`. Follow-up:
`/tmp/tensho-route-loading-vjPja8/interaction-repeats.json` and
`/tmp/tensho-route-loading-vjPja8/interaction-repeats/`.

### Reproduction

```sh
VITE_BASE_PATH=/tensho-web/ bun run build
VITE_BASE_PATH=/tensho-web/ ./node_modules/.bin/vite preview --host 127.0.0.1 --port 4191 --strictPort
# While that isolated preview is running:
TEST_PRODUCTION=1 SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4191/tensho-web/ npx playwright test e2e/route-loading.spec.ts e2e/public-guides.spec.ts --reporter=list --workers=1 --trace=retain-on-failure
```

The route spec explicitly skips on ordinary development runs, which do not emit
production chunks or install the production worker. Its installation case uses
a 90-second total budget and waits for actual worker control, not a fixed sleep.
No real-device/Safari, throttled-network, live Pages, indexing or old-worker/new-
worker transition claim follows from this local test. Main promotion and release
remain subject to the user's decision; no git history has been changed.
