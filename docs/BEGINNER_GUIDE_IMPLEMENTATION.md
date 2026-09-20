# Illustrated beginner guide

September 19, 2026. Implementation evidence, not a whole-project completion or deployment claim.

## Live forecast guidance follow-up

The subsequent score-localization screenshots exposed a misleading instruction:
every no-Yaku selection received the loose-tile warning, including valid tactical
groups. The engine now supplies `ScoredStructure` alongside the score breakdown:
tactical/complete kind and grouped/ungrouped tile counts from the scored parse.
The grouping explanation does not independently reinterpret visible tile ranks. This preserves
Honor Transmutation and counts structural membership even when tile values are
suppressed; retriggers do not inflate the grouping count.

PlayArea distinguishes all-grouped, mixed, all-loose and complete selections in
all thirteen locales. It shows the raw shape bonus separately from final modified
points, and describes the loose-tile penalty as applying to **base tile points**.
A complete hand without an active Yaku does not receive a loose-tile warning.
Concealed selections disclose neither the structure explanation nor the forecast.
Legacy preview callers without grouping data get a general instruction, not an
invented classification. There is no added modal, timer or focus-stealing step.

Screenshot review also found duplicated sequence bonuses and English selection
headings. The heading now identifies a matched pattern without repeating the
engine-provided bonus. Selection counts and full-hand stage/confirm instructions
are localized. The actual selection or declaration state takes precedence over
an idle coach prompt, including an earlier suggestion to redraw. Existing tile
images, table art and the generated guidebook remain; no raster asset is needed
to represent this live numeric state.

Initial metadata regressions failed **8/8** before the implementation. The first
expanded focused set then passed **62/63**: its only failure looked for the
concealment accessibility label as visible text. Correcting that test query did
not change concealment behavior. The engine cases cover pair, sequence, triplet,
quad, mixed and loose selections, preview/payment parity, transformed Honors,
complete hands and suppressed tile values. Component cases cover all four
explanations in all thirteen locales, concealment and legacy fallback.

Before the heading cleanup, full units passed **1009/1009 in 92 files** and all
**16/16 browser checks** passed. The browser suite includes controlled deals with
real staging/payment (45 grouped, 50 mixed, 9 loose), hide/reveal checks, large-score
geometry and secondary-Yaku regressions. Fixtures are not proof of natural build
frequency, balance or newcomer comprehension.

After the heading cleanup, full units passed **1022/1022 in 93 files**
(1196.82 seconds, one worker). This includes thirteen locale-specific heading
cases that prioritize actual selections and staged declarations over idle advice.
The final browser set finished **15 passed / 1 timeout** (6.2 minutes): all four
new grouping journeys and all four secondary-scoring journeys passed. The
Spanish 320×568 touch layout case exceeded the unchanged 30-second test deadline;
its trace shows payment and geometry assertions completed and the final snapshot
has the exact-score disclosure open. The timeout's cause is not established.
Three unchanged isolated repetitions then passed **3/3** (51.8 seconds), without
retries or increasing the deadline. This does not retroactively make the 16-check
run a pass. Spanish desktop and touch grouped/mixed screenshots were reviewed:
headings are localized, the shape bonus appears once and the text wraps inside
the panel. All thirteen translations still need native-speaker review.

Artifacts: `/tmp/tensho-structure-igJ06w/final-browser.json`, `final-browser/`,
`short-phone-repeat.json` and `short-phone-repeat/`. The owned server was stopped
after verification. No commit, merge, push or deployment was performed.

Strict TypeScript, targeted ESLint, selected-source Prettier and whitespace
checks passed. `VITE_BASE_PATH=/tensho-web/ bun run build` completed successfully,
including offline-cache generation: 340 modules, entry `index-BTk8H3sQ.js`,
266 precache entries / 62,689.90 KiB. Existing large-chunk and stale Browserslist
warnings remain. This verifies a local production artifact, not hosted delivery
or an installed PWA upgrade.

Other tutorial/control localization, native-speaker and physical-device review,
human playtesting, the unresolved Decree/Season rules, main/default promotion and
deployment remain open. This is not whole-project completion.

## Rules and layout

The Classic visual primer displayed obsolete shape bonuses (10/20/30/50), while
the engine pays 15/30/40/65. Each example now takes a MeldType and reads the
shared `STRUCTURE_POINTS_BY_TYPE` table. Four component cases compare the actual
displayed bonus with `calculateScore` applied to the depicted tile group, not
just a second hard-coded UI table. The existing baseline scoring tests remain.

New labels explicitly call these **shape bonuses**. A short explanation distinguishes
them from tile points and the final, modified forecast. Both strings are supplied
in all 13 locales; integrity coverage checks the numeric interpolation. This does
not claim native-speaker review or completion of other tutorial translations.

On small screens, tile examples sit below their descriptions. Family names wrap
in a three-column grid rather than truncating in five squeezed columns. Desktop
retains five families and side-by-side examples. The Popup owns one scroll area;
the primer no longer introduces a nested scroll box. The real Mahjong tile
assets remain the instructional examples.

## New artwork and provenance

The generated open guidebook appears in the explicit Learn the tiles control
(32px artwork inside a minimum 44px target) and the primer (64px). It is
decorative, has an empty alternative, and does not duplicate the localized control
name. No text or rule values are embedded in the artwork. The image-generation
skill informed the palette, non-destructive asset integration and separation of
decorative art from exact teaching diagrams.

- Project asset: `public/assets/illustrations/beginner-guidebook.png`
- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-cc864c7d-0179-4ecd-abe7-c4880783fd46.png`
- Mode: built-in image generation, new image, no reference-image inputs and no CLI fallback.
- The built-in tool exposes neither a model selector nor a model ID. A named/latest model cannot be guaranteed.
- Original PNG copied unchanged, 1254×1254 RGBA, 1,558,418 bytes.
- SHA-256: `02664de9a9a0ff8b1c61981a095d2c0093fd0e1468c1b6c601139cfaa570b436`.
- Read-only PNG decoding verified 879,534 fully transparent pixels. Generated output and rendered desktop/mobile screenshots were visually inspected.

Exact generation prompt:

> Use case: stylized-concept. Asset type: miniature illustrated learning-guide emblem for Tensho, a mahjong roguelike. Generate a NEW image: an open jade-green bound guidebook with warm ivory parchment pages, antique-gold corner fittings and a short emerald silk bookmark. Three small ivory mahjong tiles with simple green circular pip motifs rest across the open pages. Premium hand-painted board-game item illustration, tactile jade lacquer and softly aged gold, warm highlights. The open book must be instantly recognizable at small UI sizes, bold clean silhouette, modest ornamental detail, centered complete object on a square canvas with generous exterior padding. Slight elevated three-quarter view. Genuinely transparent alpha background, not a drawn checkerboard, not white or gray. No scroll frame, coins, scenery, characters, hands, words, letters, numerals, calligraphy, logos or watermark. This is decorative learning artwork, not a diagram of rules.

## Verification

- Full units: **885/885 in 83 files**, 37.36 seconds; one worker, original timeouts.
- Browser: **26/26**, 86.35 seconds; one worker, zero retries, no skips or failures.
- Strict TypeScript, targeted ESLint, Prettier and `git diff --check` passed.
- Pages-base production build passed: 338 modules, entry `index-D_a8U3HF.js`,
  265 precache entries / 60,121.12 KiB. Existing large-chunk and stale-Browserslist
  warnings remain; the original artwork increases the offline payload.

Browser artifacts: `/tmp/tensho-guide-MaaUre/browser.json` and
`/tmp/tensho-guide-MaaUre/browser/`. The new guide file covers English desktop,
Spanish 320×568, Russian enlarged text, Japanese 320px enlarged text and French
568×320 landscape in both Chromium desktop and touch contexts. Assertions check
all tile/art loads, localized bonus values, content width, single scrolling
surface, reachable examples/action and return of focus. The other 16 checks cover
the existing guided first move, actual play with hints open, Shop purchase/continue,
and exact complete/tactical/effect/reset payments. English intro and Spanish
phone-shape screenshots were reviewed.

Commands:

```sh
bun run test:run --maxWorkers=1 --pool=threads
npx tsc -b --pretty false
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4192 PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/tensho-guide-MaaUre/browser.json npx playwright test e2e/beginner-guide.spec.ts e2e/tutorial-layout.spec.ts e2e/score-settlement.spec.ts e2e/app.spec.ts --grep 'illustrated guide teaches|guidance leaves|shop hint|complete and tactical|teaches a first' --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,json --output=/tmp/tensho-guide-MaaUre/browser
VITE_BASE_PATH=/tensho-web/ bun run build
```

These are local development browser checks and a production build, not a browser
test of the deployed build. Full-repository browser/release suites, physical iOS,
native-language review, human newcomer/fun testing, remaining mechanics and
main/default promotion are still open. No commit, merge, push or deployment
occurred. The owned development server is stopped.
