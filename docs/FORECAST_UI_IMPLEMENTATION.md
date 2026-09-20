# Responsive forecast and score display

September 12, 2026. A Classic HUD follow-up, not a claim that all game layouts,
localization, accessibility or mechanics are complete.

September 19 follow-up: [Settled score display](SCORE_SETTLEMENT_IMPLEMENTATION.md)
fixes the separate hand/Yaku arithmetic below and extends the panel's native
disclosure to ordinary last-play equations as well as compact large values.
The September 12 evidence is preserved below the latest follow-up.

The subsequent [beginner-guidance follow-up](BEGINNER_GUIDE_IMPLEMENTATION.md#live-forecast-guidance-follow-up)
fixes the misleading loose-tile explanation found in the screenshots below.
Grouping descriptions now use the scored engine parse, selection/declaration
headings are localized, and the shape bonus is not repeated in the heading.
That follow-up records its own current tests and retained browser timeout.

## September 19: localized equations and remaining points

Screenshot review after the Decree-copy fixes showed English decimal dots in
Spanish equations and an unformatted remaining-score hint. Sixteen new component
cases reproduced failures, including the remaining hint in all thirteen locales.

`scoreMultiplier` now formats forecast and paid counters consistently through
cached `Intl.NumberFormat` instances. Ordinary multipliers retain two decimal
places; large multipliers use compact notation. Exact, unrounded values remain in
titles, accessibility labels and the existing native equation disclosure. Only
presentation changes; numeric animation, engine scores and settlement are intact.
The component tests exercise normal/reduced motion and a live language change.

Remaining-point copy keeps a numeric plural-selection count but interpolates a
separate formatted value in all thirteen locales. Its label/title provides the
exact count while the visible hint uses compact notation. The progress bar now
has localized score/target labels and formatted value text instead of an English
sentence. Its numeric value is clamped to the target for a valid ARIA range, while
the value text still announces an over-target actual score. Existing short-screen
hint visibility rules are unchanged.

The first focused set passed **52/52** after correction. The expanded full suite
passed **985/985 in 90 files**, 107.55 seconds. This includes 17 new component
cases and four added multiplier-format cases. Strict TypeScript, targeted ESLint
and whitespace checks passed.

The first browser run finished **12 passed / 8 failed**, 235.93 seconds. All eight
failures were a new expectation incorrectly treating the large-score table fixture
as a multiplier bonus: the engine correctly put that bonus into base points.
The corrected geometry coverage separately inflates points or supplies a controlled
large-multiplier Decree; both pay 45 billion. The final **8/8 layout checks**
passed, 98.12 seconds, after a fresh server. Neither runtime code nor test deadlines
were changed to accommodate the fixture error, and no retries were used.

The twelve scoring journeys cover English/Spanish, normal/reduced motion,
desktop/touch, Frostbite fractions, score adjustments and reset. The final eight
layout journeys cover Spanish 320×568/740, Russian 390×844 and Japanese 1280×800,
16px/20px root fonts, actual tile staging/payment, exact disclosure and localized
progress text. These deliberately exaggerated builds test layout and arithmetic,
not acquisition frequency, balance or fun. Spanish enlarged desktop-context and
short-screen mobile screenshots were reviewed. Art and colors remain unchanged;
this formatting correction does not need a new raster asset.

Artifacts: `/tmp/tensho-score-locale-gpemV2/browser.json`, `browser/`, `layout.json`
and `layout/`. The owned test server is stopped. No commit, merge, push or
deployment occurred.

The Pages-base production build passed: 339 modules, entry `index-_LmhSDBq.js`,
266 precache entries / 62,683.08 KiB. Existing large-chunk/Browserslist warnings
remain. This is not a deployed-site or installed-PWA upgrade check.

The screenshot review exposed a separate beginner-guidance problem: PlayArea
shows the generic loose-tile penalty whenever there is no Yaku, even when the
selection is already a valid tactical sequence. That needs a structure-aware
explanation. Other untranslated control/tooltip strings, currency notation,
physical-device/assistive-technology review and broader mechanics remain open.

Commands:

```sh
bun run test:run --maxWorkers=1 --pool=threads
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4192 PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/tensho-score-locale-gpemV2/browser.json npx playwright test e2e/forecast-layout.spec.ts e2e/score-settlement.spec.ts e2e/frostbite-score.spec.ts --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,json --output=/tmp/tensho-score-locale-gpemV2/browser
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4192 PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/tensho-score-locale-gpemV2/layout.json npx playwright test e2e/forecast-layout.spec.ts --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,json --output=/tmp/tensho-score-locale-gpemV2/layout
VITE_BASE_PATH=/tensho-web/ bun run build
```

## September 12 checkpoint

## Connected changes

- Forecast identity, arithmetic, total and pace occupy separate grid areas.
  Long translations no longer compete with the total for one flex row.
- Target/current score and the animated equation use constrained columns. The
  short-screen rule no longer clips the whole play area at 90 pixels.
- Scores below one million stay exact. Larger values use the selected locale's
  compact notation. This is presentation only: scoring and payment remain full
  precision. Compact unit separators can wrap between words.
- A native **Exact values** disclosure exposes full figures by touch or keyboard,
  in the document flow, without a hover-only requirement or overlay. It appears
  only for large values. All 13 locales supply its label; native-speaker review
  remains open. Exact values are also provided in numeric titles/labels.
- Mobile uses the existing translated Play/Stage/Confirm/Adjust instruction,
  instead of a separate English-only label. The optional dead-wall button also
  reuses its translation. Compact action buttons retain at least 44px targets.
- Point/multiplier counters honor both app and system reduced motion immediately.
  Score popups are width-bounded; reduced-motion popups use a cancellable timer
  and no scale/translation sequence. A unit case verifies one completion callback.
- Existing artwork, colors and normal score animation remain. This CSS/text
  change needs no new bitmap; prior generated scroll assets are preserved.

Detailed ActionBar accessibility descriptions and some other Classic strings
remain English. This pass fixes visible action labels, not every translation.

## Evidence and retained failures

The first browser attempt timed out finding the loaded Play control. An unchanged
repeat then exposed a fixture mistake: table modifiers are frozen, so assigning
one property did not create the intended high score. Replacing the fixture's
modifier object corrected that setup. Before any layout fix, the corrected
fixture reproduced actual text overflow at 320×740 with a 20px root font.

An initial eight-case pass covered the forecast but screenshot review exposed
the adjoining score panel and popup overflow. Coverage was expanded accordingly;
those eight passes alone were not sufficient UI evidence. An intermediate run
finished 23/24 because one desktop discard drag did not register. The test now
first scrolls the source into view and asserts both drag endpoints are onscreen,
then performs the same drag and exact resource/payment assertions. Its original
failure's cause is not claimed proven. The subsequent 24-case run passed.

The initial static-popup unit test found no completion callback. Reduced motion
now uses an effect-owned timer rather than relying on spring completion; the
corrected test passes without changing its deadline or expected callback count.

The compact-display checkpoint passed **24/24 targeted browser checks** (187.20
seconds, no retries). This includes English/Spanish Winter collection/payment,
real discard/Decay/Skip, three rack sizes, pointer drag and edge-tile details.
Eight new layout cases cover Spanish 320×568 and 320×740, Russian 390×844,
Japanese 1280×800, desktop/mobile Chromium, and 16px/20px root fonts. They stage
real tiles, inspect exact figures by touch/keyboard, retain the selection and
commit the exact 45-billion-point forecast. The deliberately inflated target and
table modifier are geometry fixtures, not naturally acquired builds or balance
evidence. The optional tip is dismissed through its actual user-facing button.

The full unit suite passed **861/861 in 81 files** (446.59 seconds). After the
final unit run, one redundant disclosure row was removed because it labelled
remaining points as the absolute target; the score panel already exposes the
actual target. The final build and browser checks include that cleanup.

Final post-spacing/cleanup layout checks passed **8/8** (34.30 seconds, no
retries). Exact disclosure, staged selection and full-value payment are checked
in each case. Spanish mobile forecast/paid-score screenshots were visually
reviewed; large numbers now wrap between localized unit words instead of breaking
digit strings apart. Strict TypeScript and the Pages-base build passed: 336
modules, entry `index-CvPgTPq9.js` (750.82 kB / 227.31 kB gzip), **264 precache
entries / 58,599.42 KiB**. Existing large-chunk/Browserslist warnings remain.
Targeted ESLint passed. The owned test server is stopped.

Earlier artifacts
are retained under `/tmp/tensho-forecast-xIjnV0/`: `before*`, `layout`,
`final-browser`, `verified-browser`, and `compact-browser` (with JSON reports for
the latter four runs). `final-layout/` and `final-layout.json` contain the last
eight checks. Full repository browser/release/production suites were
not rerun for this UI-only follow-up. Prior timeout history remains in
[Winter verification](WINTER_FLOWER_IMPLEMENTATION.md).

No commit, merge, push or deployment is included. Remaining mechanics choices,
main/default promotion, newcomer playtesting, physical-device/assistive-technology
review, broader localization and deployed worker upgrades remain open.

At this checkpoint the animated equation still needed a separate data-accuracy
audit: `GameplayScreen` derived points from `handPlayed.score / currentMult`,
while `yakuScored` separately multiplied `currentMult`. This layout pass did not
verify that event pairing. The September 19 follow-up above records the
reproduced mismatch, atomic settlement fix and subsequent browser evidence.
