# Charter resources and illustrated upgrades

## Scope

This checkpoint verifies the resource powers documented in `GAME_MECHANICS.md`
section 15 through paid acquisition, actual actions and strict save restoration.
It adds Swift Hand and Full Palette portraits. It does not retune these powers
or claim the entire game, organic upgrade reachability or human fun is complete.

`src/game/CharterRoundResources.test.ts` covers:

- Steady/Swift Hand: five/six plays without the starter Decree; all six are
  usable, including after resuming past the base four, and the seventh is rejected.
- Frugal Discard/Wasteful Plenty: four/five redraws; spending, exhaustion,
  unchanged rejected actions, reload, and next-round reset.
- Brush Stroke/Full Palette: fifteen/sixteen tiles, including refills after play
  and redraw, resumed identity, and clean new-run reset.
- Ancient/Stone Script: persistent play/redraw penalties, separately consumed
  one-shot Act reductions, and no repeated reduction after the following Boss.
- Boss precedence: Needle still allows one play, Water zero redraws, and Manacle
  removes one rack slot from Full Palette.
- Final Cut: repeated changed Boss choices at ten Gold each, exact save/resume,
  refusal when unaffordable or already in the Boss round, without mutation.

These use controlled unlock eligibility, budgets, low score targets, a bonus-free
wall and a known Boss. Real purchases, settlement, next-round initialization,
actions and strict save codecs execute. They are not evidence of organic balance.

`e2e/resource-charters.spec.ts` checks English/Spanish on desktop and 320px touch:
actual portrait decoding, cancel without charge, confirm purchase, reload,
next-round resources, staging without spending, play/refill, exact reload and
page overflow. The fixtures preserve the real persistence boundary and record
their save envelope plus controlled progression profile for production replays.

## Artwork

The built-in image generator was used via the imagegen skill. The tool exposes
no model selector or verified model ID; a named latest-model claim is not made.
Both original PNGs remain under the generated-images directory. The installed
512px WebP versions preserve alpha and are used by the shop and discovered Archive
through `CharterArtwork`; undiscovered entries retain concealed artwork.

| Asset | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/assets/illustrations/charters/swift-hand.webp` | 80054 | `ac753f9fd38146f317c6b2e5d6e5fa712d96b627a652aa1c9cec97fcc013d470` |
| `public/assets/illustrations/charters/full-palette.webp` | 66730 | `535e16a7a9fafda471de0a4ddd34f60ff981aeb348a00907e3881608d296597e` |

Original directory:
`/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/`.
Swift Hand: `exec-c04cdf8f-d61c-4bca-b9bd-bc93a86f11f3.png`.
Full Palette: `exec-f6031d2b-d755-434b-806f-29b860cdc6cc.png`.
Converted with `cwebp -q 85 -resize 512 512`, retaining originals.
Visual review found distinct bird/tile and palette/brush emblems, full scroll
silhouettes, transparent backgrounds and no baked-in rule text.

### Final prompts

Swift Hand:

> Use case: stylized-concept. Asset type: small transparent game collectible portrait for Tensho's Swift Hand Imperial Charter. Primary request: one premium hand-painted ivory parchment scroll with midnight-blue lacquer rollers, warm gold caps, a red wax seal and short blue silk tassel. The dominant emblem painted on the parchment is an elegant jade-green and gold swift bird in flight above a single ivory mahjong tile, with a restrained curved golden motion stroke suggesting an extra opportunity to play. Match a luxurious East Asian fantasy board-game illustration: tactile parchment, carved gold, jade, cobalt blue and warm ivory, clean bold silhouettes readable at 80px. Center the complete scroll in a square composition with generous clear margins. Genuine transparent alpha background. No scenery, hands, people, words, calligraphy, letters, numerals, labels, watermark or UI border. All gameplay rules are separate localized text.

Full Palette:

> Use case: stylized-concept. Asset type: small transparent game collectible portrait for Tensho's Full Palette Imperial Charter. Primary request: one premium hand-painted ivory parchment scroll with midnight-blue lacquer rollers, warm gold caps, a red wax seal and short blue silk tassel. The dominant emblem painted on the parchment is a beautiful small jade artist's palette with distinct pools of vermilion, turquoise and golden pigment, crossed by an elegant blue-handled calligraphy brush; beneath it is a short fan of ivory mahjong tile backs suggesting a wider choice of tiles. Match a luxurious East Asian fantasy board-game illustration: tactile parchment, carved gold, jade, cobalt blue and warm ivory, clean bold silhouettes readable at 80px. Center the complete scroll in a square composition with generous clear margins. Genuine transparent alpha background. No scenery, hands, people, words, calligraphy marks, letters, numerals, labels, watermark or UI border. All gameplay rules are separate localized text.

## Verification ledger

Evidence directory: `/tmp/tensho-resource-charters-NdnKvU`.

- First resource test run: eight failures because the fixture retained the
  starter Decree's +3 plays. Removed those Decrees to isolate Charters; eight pass.
- Expanded run: 12/13 pass; the test incorrectly expected Manacle to remove three
  slots. Its canonical rule is minus one; corrected the expectation to fifteen.
- Focused mechanics/art run: all 55 tests pass, including 14 resource tests.
- First build fails on a readonly property assignment in the new unit fixture;
  replaced with the existing controlled-fixture `Object.assign` pattern.
- Initial native browser run: 5/8 pass; two Spanish startup save-indicator waits
  and one Spanish overall test deadline fail. One case elapsed 18.8 minutes despite
  the 30-second deadline. Cause is unproven; trace/screenshots/report retained.
- Lint: zero errors, 211 existing warnings.

- Build recheck passes TypeScript, Vite and PWA generation (418 precache entries,
  69,941.48 KiB). Existing large-chunk and stale Browserslist warnings remain.
- All 13 release/versioning tests pass. Changed-file lint has no findings.
- Full unit run: 1,697 pass, eight deadline/child-process timeout failures and a
  worker-start failure for ShopItemCard (five tests not run). The log retains all
  failures; this is not reported as a green full suite.
- Unchanged isolated recheck of all affected files plus the final resource tests:
  **86/86 pass**, including the two child-command timeouts. Root cause of the
  original timing failures is not established.
- Native browser recheck: **8/8 pass** without retries or deadline changes.
- Built-production replay: **8/8 pass**, loading saved envelopes and controlled
  progression profiles into fresh contexts without application-module imports.
  Actual purchase/cancel, upgraded round resources, staging/play/refill and exact
  reload work in both languages and viewport modes. Reviewed phone shop and
  expanded-rack screenshots; artwork is legible and the page stays within width.

Publication and independent CI are pending.
No runtime resource fix was needed for the verified paths. Remaining Flower/
Season rules, unresolved mechanics choices and broader Charter reachability
remain tracked in the wrap-up and progression ledgers.
