# Archive presentation follow-up

Integrated into the main checkout after its 706-case native audit finished.
Release verification is in progress; this document does not yet claim deployment.

## Reproduced gaps and changes

- Archive details recognized only the four legacy Decree rarity identifiers.
  Real Scripts use `Common`/`Uncommon`/`Rare`/`Legendary`, and Charters use
  `Common`/`Rare`; these therefore displayed **Standard**. The detail badge now
  accepts the actual catalog spellings and uses the existing translated shop
  rarity labels. Items without a rarity no longer acquire a fabricated Standard
  badge. Card border colors also accept lowercase catalog identifiers.
- Script costs in Archive details bypassed the localized cost text already used
  by the live consumable picker. They now share its penalty key and actual value.
  Archive costs describe the base item, not a particular run's Omen protection.
- Discovery labels and starter-item dates have explicit strings in all thirteen
  locales. Real dates and usage/win counts use the selected language. Compact
  card statistics use the existing translated labels instead of Used/Wins.
- Mobile category navigation now retains the selected language instead of
  replacing every label with Japanese. Missing category names/descriptions were
  supplied in Indonesian, Russian, Italian, Turkish, Thai and Tagalog. Missing
  names/descriptions for the six gated Decrees were supplied in the latter five,
  along with the Plentiful Stock Charter and Ectoplasm Script used in the browser
  presentation fixture. Other catalog gaps remain explicitly outside this slice.
- Screenshot review caught excessive Cyrillic spacing despite passing horizontal
  overflow assertions. A production measurement at 16px gave the same phrase
  277.33px with the Japanese system fallback versus 156.80px with `system-ui`.
  Russian now uses the system UI font consistently, retaining optional loading
  for the other theme fonts and the separate tile-calligraphy face.
- Screens without the legacy SEO hook also left `html.lang` at English. The
  shared language layout now announces the actual rendered i18n language.
  Mobile detail statistics stack vertically; compact-card statistics stack too
  after a warm-font Russian probe reproduced 152px content in a 140px card.
- Final compact-card screenshot review also caught the historical lock overlay
  obscuring a discovered item's statistics. Known locked items now show an
  in-flow lock notice; undiscovered silhouettes retain their localized locked
  label. Decree titles reserve room for their corner portrait. Neither discovery
  nor eligibility rules change.
- Discovery rules, unlock conditions, prices, effects and save data are unchanged.
  Blueprint additionally receives the individual portrait documented below.

This is not complete Archive/catalog localization: Script thematic flavor still
uses authored English, as does the separate artwork popover's cost/rarity text;
non-Decree unlock requirements also need reconciliation. Native-speaker review
remains outstanding; targeted geometry and screenshot evidence is recorded below.

## Evidence

Evidence directory: `/tmp/tensho-integration-audit-Z1dTfZ`.

- `archive-presentation-recheck.log`: **314/314 rendered checks**, three files,
  one worker, unchanged test deadlines, 36.08 seconds. This consists of 299
  presentation cases (all 21 Scripts × 13 languages, locale-specific statistics
  and dates, and rarity aliases) plus 15 existing dialog/unlock regressions.
- The initial run (`archive-presentation-units.log`) had 36 passes and five
  failures: three overlong 21-dialog test loops and two assertions whose matcher
  normalized French/Russian nonbreaking number separators. Script cases are now
  individually parameterized with all assertions retained; numeric checks inspect
  raw text. No test deadlines or runtime number formatting were weakened.
- Targeted ESLint passed without diagnostics (`archive-lint.log`). Strict
  TypeScript passes in `archive-typecheck-recheck.log`; the first scratch check
  found seven stale readonly fixture assignments already corrected in main.
  Those two scratch tests were brought forward to main's existing explicit casts.
- The isolated production build passes (`archive-build.log`), including the new
  Blueprint asset: 434 offline precache entries / 71,082.15 KiB. Existing large
  chunk and Browserslist warnings remain. Integration/browser checks are separate.
- `archive-localized-recheck.log`: **354/354** after supplying the missing
  Indonesian category catalog. This includes the 299 presentation cases, thirteen
  Decree rule/name/description cases, existing dialog tests and forty locale tests.
- `archive-localized-browser.log`: **4/4**, Spanish/Russian desktop/touch, before
  the typography/statistics correction. Screenshot review, not just that green
  result, identified the remaining readability problem.
- `integrated-archive-units.log`: **413/413** across six files, including fourteen
  document-language cases and the Blueprint asset/rendering checks.
- `integrated-archive-browser.log`: **4/4** production desktop/touch journeys,
  including deliberately blocked Russian webfonts, correct document language,
  single-line statistic values, responsive stat geometry and unchanged Archive
  data. Spanish and Russian mobile screenshots were visually inspected.
  A separate warm-font probe confirmed the system font and Russian document
  language, but revealed compact-card overflow; its correction is being rechecked.
- `integrated-archive-build.log`: TypeScript and production build pass, 434
  precache entries / 71,094.63 KiB. Lint reports zero errors / 211 existing warnings;
  release checks pass 13/13. Final compact-card build/recheck remains separate.

## Blueprint portrait

The imagegen skill guided a new built-in generation with transparent alpha and
localized rules kept outside the image. No CLI fallback or reference-image edit
was used. The built-in tool has no named model selector/ID, so a particular
latest-model claim is not verified.

- Original retained:
  `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-c40ef678-090d-4ac4-804a-96030975c07b.png`.
- Workspace preview:
  `/Users/evgenyvinnik/.codex/visualizations/2026/08/06/019fd81b-74a3-7cb0-8795-d6c90a5733b7/blueprint.webp`.
- Main project asset: `public/assets/illustrations/decrees/blueprint.webp`.
- Mechanical conversion: `cwebp -q 85 -resize 512 512`, with original retained
  and alpha preserved. 512×512, 59,742 bytes.
- SHA-256:
  `f40265d044ca3711cedf634401ae63c5060a2a0dd179de979d9662e0efeb02b1`.
- Original and converted artwork visually inspected. Shared Decree artwork
  mapping supplies shop, inventory and Archive consumers. Existing portraits and
  fallback icons are not replaced.
- Initial art tests: 35 passes / 11 failures because the old fallback test used
  Blueprint itself as an example of an item without an image. It now explicitly
  tests an unknown ID and includes Blueprint among the real portrait cases.
  `blueprint-units-recheck.log` passes **47/47** (35 asset and twelve portrait
  checks); these are also included in the integrated 413-case batch above.

Exact prompt:

> Use case: stylized-concept. Asset type: small transparent collectible Decree portrait for Tensho, a mahjong roguelike. Primary request: an individual Blueprint scroll portrait in the game's luxurious hand-painted jade, ivory, antique-gold and midnight-cobalt style. Subject: one complete upright ivory parchment scroll with carved cobalt lacquer rollers and warm gold caps; on the parchment, a large inset cobalt drafting medallion depicts two identical ivory mahjong tiles with the same simple jade geometric emblem, one solid and one a luminous pale-blue traced echo, connected by a fine golden tracing arc. This is a visual metaphor for copying a neighboring power, not a rules diagram. Tactile parchment, polished jade, restrained gold filigree, dimensional painted shading, a strong silhouette readable at 80px. Center the entire scroll on a square canvas with generous clear outer margins. Genuine transparent alpha background. No scene, people, hands, lettering, words, calligraphy, numerals, labels, watermark or UI frame. Keep all gameplay text out of the illustration; it is localized separately.

## Separate browser-fixture correction

The full audit reproduced a layout fixture expecting fourteen tiles although its
real Spring run saved sixteen. The integrated `interaction.spec.ts` correction
reads authoritative physical IDs, requires at least the normal starting fourteen
and unique identities, and retains every tile's geometry, staging, return,
44-pixel target, footer and disabled-action assertion. The equivalent localized
identity fixture now retains the actual saved rack count as well.

Against the unchanged main production build, `rack-production.log` reports
**11 passed / one timed out**, 6.8 minutes, one worker, no retries. The desktop
320×568 journey exceeded both its existing 60-second test deadline and teardown
deadline; its trace archive is incomplete. Do not count it as passed. Other
desktop/touch geometries and ES/FR/JA identity journeys passed. These fixture
changes are now integrated after the full main audit terminated.

## Additional verification of unchanged main

- `production-route.log`: **10/10** desktop/touch route loading, localized loading
  feedback, failed-chunk save retention, and installed-worker offline first visits
  to screens, art and public guides. 1.5 minutes, one worker, no retries.
- `production-recovery.log`: **24/24** public guides (including no JavaScript),
  transient/persistent/redirected download failures, blocked-save refusal and
  subsequent recovery; EN/ES desktop/touch. 3.4 minutes, one worker, no retries.

These production checks supplement, not replace, the native audit. They verified
the preceding main build, not the subsequent Archive presentation changes.

## Full native audit outcome and serial rechecks

`final-full.log`: **661 passed, 30 skipped, 15 failed** out of 706, 42.4 minutes,
two workers, no retries, frozen source `e9fa37e`. The thirty skips require separate
production/static hosting environments. This is not a green full-suite result.

Two failures expected fourteen tiles despite legitimate sixteen-tile Spring
racks; their assertions now use the actual saved physical IDs without dropping
geometry, identity or action checks. Twelve failures exceeded the existing
30-second journey deadline (audio, Flower mutations, paid packs, Plum recovery,
run ownership and table selection). One mobile delayed-font journey missed its
initial five-second saved-state readiness assertion, before dragging began.
An eventual saved indicator in the trace does not make that failed run a pass.

`serial-native.log`: **18/18**, 2.3 minutes, one worker, no retries or changed
deadlines. This includes all twelve journey-timeout cases plus related cases in
the same six files. The full audit's timing failures remain retained; a passing
serial run does not prove their original cause. Rack/identity/font-drag rechecks,
final full units and publication were still pending at this point.

`input-recheck.log`: **28/28**, 4.8 minutes, one worker, no retries or changed
deadlines. All physical rack tiles are staged and returned at 320×568, 390×844 and
1280×800 in desktop/touch contexts. ES/FR/JA identity, RU/TH detailed modifier text,
and EN/ES/RU drag stability under delayed fonts and increased text spacing pass.
This covers the remaining three original full-audit failures.

`integrated-archive-full-unit.log`: **2,547 passed / one failed** in 183 files,
512.51 seconds. The one failure is the unchanged five-second structural-policy
CLI reproducibility test, not an assertion mismatch. The final compact-card CSS
adjustment followed the Archive file's execution; both that file and the CLI are
being rechecked separately. Do not call this a green full unit run.

`archive-final-browser.log`: **seven passed / one failed**, 3.6 minutes. All four
real-static-host route checks pass, including 200 responses for supported routes,
404 for unknown routes, indexing policy and practice-query preservation. Spanish
mobile Archive failed during thirty-second context teardown; its trace packaging
was incomplete. The source and deadline are unchanged for the isolated recheck.

`archive-final-unit-recheck.log`: **339/339**, 13.23 seconds, covering the entire
26-case CLI contract, 299 Archive cases and fourteen document-language checks.
The unchanged structural-policy test completes in 1.155 seconds. Targeted lint
passes without diagnostics. `archive-isolated-browser.log` then passes **4/4**,
24 seconds, no retries or changed deadlines.

`checkpoint-production.log`: **12/12**, 1.2 minutes, Spanish/Russian Archive and
EN/ES earned-Yakuman unlock/score-threshold portrait/payment replays on desktop and
touch. The replay fixtures contain actual saved native-run state; production
never imports development engine modules. The two newly added tests now respect
the configured deployment basename for subsequent Pages verification.

After the final lock-notice correction, `archive-lock-units.log` passes all
**299** presentation checks; the thirteen locale card checks now include the
in-flow lock label. `archive-lock-build.log` passes TypeScript and production
build with 434 precache entries / 71,094.91 KiB. The last Archive browser recheck
additionally requires the lock notice to sit below, not over, the statistics.
`archive-lock-browser.log` passes **4/4**, 33.1 seconds, no retries; the corrected
Russian mobile card screenshot is visually verified. Final targeted lint passes
without diagnostics. Independent release CI and hosted verification follow.
