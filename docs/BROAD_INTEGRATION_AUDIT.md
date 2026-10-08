# Broad integration audit and Perfectionist portrait

October 7, 2026 local / October 8 UTC. Local work in progress, not a deployment
or whole-project completion claim. Baseline: main `18f7384`, following v1.0.261008-10.

## Why this audit

The recent mechanic-specific release checks did not revalidate the complete
browser suite. The current suite lists **702 cases across 76 files**, split
between desktop and mobile Chromium. Production-only route/recovery checks have
their own explicit environment gates; native Vite cannot verify emitted chunks.

An initial complete-suite attempt was deliberately stopped after confirmed stale
test assumptions were identified: **120 passed, 11 failed, two interrupted and
569 not run**, six minutes, exit 130. This is not a passing full run. Its traces
and screenshots remain at `/tmp/tensho-integration-audit-Z1dTfZ/browser`.

Corrections preserve the tested player outcomes:

- Localized scenarios now click the real translated tutorial opt-out label,
  rather than waiting for English text on Spanish/Russian/Japanese screens.
  Tests still use the visible control; they do not hide the lesson with CSS or
  write the disabled flag to bypass the interaction.
- Main-menu smoke accepts the existing PNG/WebP artwork formats and additionally
  decodes the portrait. It checks the actual filled rack against the base fourteen
  plus two spaces per normal Spring in the saved run, instead of assuming every
  deal has fourteen tiles. The final smoke uses the public save, not a development
  module import, so it remains usable against a production build.
- The resource-copy fixture excludes bonus tiles from its next-round wall.
  Autumn otherwise legitimately adds a discard to the expected Blueprint/source
  allowances. Exact purchase costs, rack sizes, discards, plays and score payments
  are unchanged. Separate Season browser scenarios retain actual bonus draws.
- Dismissal targets the current Got it control; the hand counter and cash-out
  use their current semantic hooks rather than obsolete titles/copy.

The corrected focused batch passes **78/78**, 4.4 minutes, two workers, no retries
and unchanged deadlines. It covers app/navigation, copied resources, Double Omen,
forecast layouts, score thresholds and non-invasive tutorial layouts in desktop
and touch contexts. The later public-save smoke refinement and Flora opt-out
localization still require the broader recheck. Artwork units pass **11/11**;
strict TypeScript passes. The host's load rose substantially during verification;
that observation is not proof of the cause of any future timing failure.

## Authored Decree progression gap: local implementation

The audit found six explicit unlock conditions disconnected from live acquisition.
The local implementation now connects these rules:

| Decree | Authored condition |
| --- | --- |
| Blueprint | Win a run |
| Brainstorm | Win with five Decrees |
| Heavenly Ordinance | Score a Yakuman |
| Clone Army | Win on Gold Stake |
| Yakuman Blessing | Score three Yakuman in one run |
| Omega | Complete Act 8 |

Baseline evidence: `decreeDefinitions.ts` supplies these conditions;
`decreeLibrary.ts` does not retain them in its runtime adapter;
`DecreeSystem.getShopCandidates([], undefined, 0)` includes all six without a
profile resolver; `GameOrchestrator.canAddDecree` checks inventory/Flower capacity,
not profile eligibility. Existing progression records use other identifiers
(including legacy `blueprint`), so matching names alone does not connect this path.
The source-backed reproduction is retained as `decree-unlock-audit.json` in the
evidence root. An earlier Mythic-only probe is also retained; its two false rows
were rarity exclusions, **not** proof that Blueprint/Brainstorm were gated.

The implementation uses canonical IDs and retains the existing Blueprint unlock
record ID. Eligibility now filters shop stock, packs, generated Decrees and Omen
rarity guarantees, and is rechecked before direct purchases. Resolvers survive a
new-run shop reset and saved-run restoration. Existing inventory is not removed.

Yakuman Blessing counts three committed Yakuman **patterns** within one run,
including legitimately ascended patterns; multiple patterns in one paid hand
count individually. Previews do not count. Current and best-per-run counters are
persisted, and a new run resets only the current counter. A legacy lifetime total
does not manufacture a per-run record.

Compatibility: real historical acquisitions remain unlocked, but Archive-only
flags do not grant profile eligibility. Proven lifetime achievements can unlock
newly connected rewards during reconciliation. Already-paid legacy pack choices
remain claimable exactly once, with ordinary slot/Flower restrictions; claiming
one also preserves its profile availability immediately. Unpaid legacy stock with
locked rewards cannot charge the player. Full Unlock includes all six without
fabricated wins. Archive requirements have translations in all thirteen locales.

Focused checks: 80/80 integration tests passed before the final shop-reset and
real-scoring additions; the final dedicated mechanic checks passed 16/16, and
rendered localized requirements passed 13/13. The forced-legendary pack regression
checks actual reward IDs, not generated choice keys. A scratch-copy full run had
2,217 passes and one Git-metadata CLI failure (the temporary copy intentionally
has no `.git`). It is not a full green result.

The integrated production build and strict TypeScript pass. A full integrated
unit run had **2,227 passes and six 5-second deadline failures**, retained in
`integrated-unit.log`; no assertions or deadlines were weakened. Recheck pending.

The broader native browser run was interrupted after its cached Chromium binary
disappeared: **354 passed, 96 failed, 15 skipped, 237 not run**. Later failures
include inability to launch a browser, not gameplay results. An isolated browser
installation is now retained under the evidence root. A subsequent focused run
was stopped at **23 passed, nine failed, one interrupted, 31 not run** after a
trace proved a legacy fixture imported both versioned and unversioned copies of
`GameOrchestrator.ts` from a hot-reloaded server. Clean-server verification is
required. The new Yakuman journeys also hit the unchanged 30-second deadline.

Clean full unit recheck: **2,233/2,233 across 181 files**, one worker, unchanged
deadlines, 199.13 seconds (`integrated-unit-recheck.log`). Release checks pass
13/13; lint has zero errors and 211 warnings. The built-production earned-unlock
replay passes **4/4**, EN/ES desktop/touch, 38 seconds, no retries. It starts from
the native fixture's two actual paid Yakuman and confirms the third through UI,
then reloads; it never imports development engine modules in production.

A clean-server native batch had **55 passed / nine failed**. Eight failures expose
an old interest fixture that calls `startNewRun` without `saveNewRun`, clearing
the save lease; its payout/purchase assertions pass but the new save-status
assertion cannot settle. The fixture now explicitly registers its replacement
run. One new three-play Yakuman journey hit the unchanged 30-second deadline;
the other three pass. It now uses the public Stage Hand/Confirm Hand flow instead
of clicking all fourteen tiles individually, while verifying the exact staged
IDs and no progression award before confirmation. Those repairs were rechecked below.

Final targeted evidence: the Stage Hand version passes **4/4 native unlock
journeys** and **4/4 built-production replays** (18.1 seconds). The new portrait
and threshold payment also pass **4/4 built-production journeys** (20.4 seconds).
The final interest scenarios pass **30/30**, three explicit repetitions on both
desktop and mobile, 2.8 minutes, no retries or changed deadlines.

The intermediate 14-case run passed 12 with two asynchronous-evaluation errors;
an additional interest check passed five and failed five. Browser protocol logs
pinpoint Chromium's `Promise was collected`, which Playwright's `rewriteError`
reports as an execution-context/navigation error. Retaining only the original
fixture promise was insufficient (25/30). The test-only `evaluateFixture` helper
now retains the import chain, polls a plain completion record, and retrieves its
result synchronously, avoiding CDP's derived awaited promise. It preserves thrown
errors and all gameplay assertions. The diagnostic changes from one pass/two
failures to three passes with no protocol errors; the final 30-case result above
uses this helper. This is not a game navigation fix, and is distinct from the
earlier trace showing duplicate engine-module URLs.

The full native suite now lists **706 cases** including the new unlock journeys.
That whole-suite run remains outstanding; targeted green results do not replace
it. This is a local main-branch checkpoint, not a published release.

Two further stale assumptions were corrected: reloading Classic preserves its
interest streak, and a starter shop card can have both a gold-purchase button and
an Offer a Flower button. Tests now target the gold action explicitly. The earlier
table-selection timeout passed on the subsequent attempt; timing causation is
not established. No local changes in this checkpoint are published yet.

The default-mode question (Classic versus the merged Table Loop redesign) and a
focused human playtest question have been sent to the user. Neither an unanswered
question nor automated clear rates establish which experience is more enjoyable.

## New artwork

Perfectionist now has an individual portrait through the shared Decree mapping,
used by shop, inventory inspection and discovered Archive surfaces. Hidden-item
rules remain unchanged. Names and score conditions remain localized HTML.

- Built-in image generation, new image, no references and no CLI fallback.
  The imagegen skill guided transparent output, legibility and separate rule text.
  The tool exposes no model selector/ID; a named latest-model claim is not verified.
- Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-fa4a2f2f-527b-4c20-bfd6-b53e30bbc450.png`.
- Project asset: `public/assets/illustrations/decrees/perfectionist.webp`.
- Mechanical conversion: `cwebp -q 85 -resize 512 512`, retaining the original
  and alpha. 512×512, 52,312 bytes.
- SHA-256: `d21e9aef1b984238cb0e84dd43cd60ffe46b10a2b85e98f36a2b5730acd0f042`.
- Generated original, converted asset and Spanish inspector were visually
  reviewed. The expanded threshold journey decodes both Perfectionist and
  Supernova at 512px and verifies their descriptions, payment and saved state.

Exact prompt:

> Use case: stylized-concept. Asset type: small transparent collectible portrait for Tensho's Perfectionist Decree, a mahjong roguelike. Primary request: one premium hand-painted ivory parchment scroll with midnight-blue lacquer rollers and warm gold caps, matching a luxurious jade-and-gold East Asian fantasy board game. The dominant emblem on the parchment is a perfectly symmetrical jade lotus medallion holding one flawless polished ivory mahjong tile; a fine golden circular halo and single restrained glint suggest a perfect opening play. Strong clean silhouette readable at 80px, tactile ivory parchment, carved jade, antique gold, cobalt accents. Center the complete scroll on a square canvas with generous clear margins. Genuine transparent alpha background. No scene, hands, people, lettering, calligraphy, words, numerals, labels, watermark, or UI border. All gameplay rules are separate localized text.

## Pending verification

Evidence root: `/tmp/tensho-integration-audit-Z1dTfZ`. Full browser recheck and
publication/hosted verification remain pending. Full units, build, lint, release
checks and the targeted native/production journeys are verified above. Do not
describe this local checkpoint as deployed or the entire project as complete.
