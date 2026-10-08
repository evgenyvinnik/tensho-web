# Run ownership: Fate Seals and Negative tiles

## Rule decision — October 8, 2026 UTC

Under the user's delegated authority, Fate Seal changes to selected physical
tiles last for the current run, including future rounds and save/reload. A new
run starts fresh. This reconciles the obsolete hand-only draft with the actual
catalog and intentional deck-building investment. Existing targeting, use limits,
concealment and cancellation are preserved.

Each distinct owned non-bonus Negative tile grants one Decree slot while it remains
in the persistent wall. Rack/wall/river copies of the same ID are not additional
ownership. Drawing, discarding, scoring suppression and Frostbite do not change
the bonus. Physical copies copy editions; destruction (including Glass shattering)
and edition replacement remove capacity. Flower/Season bonus tiles are excluded.

Negative Decree slots remain independent. Capacity loss keeps owned Decrees and
their ordinary rules, including existing enabled/disabled state. No forced sale
or deletion. New acquisitions must fit after accounting for their own Negative
slot; self-offsetting items cannot erase an existing capacity deficit.

## Implementation

- DecreeSystem derives wall capacity by unique physical ID; serialized base slots
  stay unchanged. Classic restore recomputes the bonus, including for older saves.
- Tile replacement/removal/creation and Tile Pack rewards sync capacity. Shop
  preflight derives the same bonus and simulates rewards in settlement order.
- Selected Fate Seals show a run-lifetime note. Negative tile inspectors and reward
  descriptions explain ownership. Gameplay and Tea House explain over-capacity.
  All thirteen locales authored; native-speaker review remains open.
- Distinct Transmutation artwork appears in the target picker, Tea House item card
  and pack choice; other seals retain their existing portraits.

## Verification ledger

Initial regression: 1/9 passed, 8 failed. Six failures exposed missing capacity;
two fixture errors passed text to an object parser and called a nonexistent Tile
serializer. Later fixture corrections cleared starter Decrees, allowed independent
Flower capacity after reshuffling, and used the singular discard action. These
fixture errors are not production defects.

The expanded eighteen engine tests pass: acquisition, discard stability, repeated
restore/legacy behavior, unique IDs, copying, edition replacement, Release,
independent capacity sources, shop preflight, paid Tile Pack claim/reload/once-only
settlement, Aura replacement, Glass destruction, and four Fate Seal transformations
through validated saves and round transition/new run, bonus-tile exclusion and
Frostbite/debuff stability. Fourteen UI cases cover
thirteen authored locales, hidden-face privacy, contextual lifetime/artwork and
capacity notices. Asset validation checks WebP/alpha/512px/size and fallbacks.

Native browser journeys pass **8/8** with zero retries/flakes (88.2 seconds):
English/Spanish × desktop 1280×800/touch 320×568 × copy/destruction. They select
and confirm through the live picker, preserve pre-confirm saved state, reload,
finish a scored round and verify Tea House capacity (6/7 or 6/5) and retained
inventory. Original deadlines unchanged. Screenshots inspected: scrollable
Spanish picker keeps both footer actions reachable; over-capacity notices fit.
Evidence: /tmp/tensho-ownership-evidence-yzDkyJ/native.json and native-screens.

The first full regression was **2,056/2,058**, not green: the existing balance CLI
test exceeded its original 5,000ms deadline (8,375ms) while build/tests shared the
host, and tileText's old blanket catalog-description assertion contradicted the
new tile-specific ownership note. The assertion now checks the correct localized
Negative-tile rule while retaining all other modifier/privacy checks. The unchanged
CLI test and updated ownership/UI tests pass in the 62-case focused recheck. No
deadline was raised. The archive's generic Negative description is also reconciled
across all thirteen locales. TypeScript/Pages-base build, lint (0 errors, 211
warnings) and all thirteen isolated release checks pass. A fresh full run and
production replay are required after these final changes.

Fresh final full regression: **2,060/2,060 in 169 files**, 130.1 seconds, original
deadlines and two workers. The previously timed-out balance test passes in this
full run. Final TypeScript and Pages-base production/PWA build pass. Earlier
failures remain recorded above.

Pages-base built-production replay passes **8/8**, 42.9 seconds, zero retries or
flakes, using the native run's actual version-2 save envelopes without injected
production APIs. Same EN/ES desktop/touch flow, no page errors or horizontal
overflow. Mobile Spanish picker and over-capacity Tea House screenshots inspected.
Evidence: production.json and production-screens in the same evidence directory.
Hosted deployment verification is recorded below.

Broader copied-resource lifecycles, remaining
Charter/item wording, organic strategy/balance, newcomer observation and physical
device review remain open.

## Published release — v1.0.261008-4

- Implementation: 2449853aa7d05ab890adb4d4a734fc1b15621dce, pushed to main.
- Version bot/tag/build checkout: 2530163c9d7efdee4366582e0757f204676159d5.
- [Workflow 37716353248](https://github.com/evgenyvinnik/tensho-web/actions/runs/37716353248)
  succeeds without a job retry. Independent CI: **2,060/2,060 in 169 files**, all
  thirteen release checks and Pages-base build/deploy. Build job 113113576907;
  deploy job 113114176595. Local main fast-forwarded to the bot commit.
- Public release.json version/tag/commit agree with the runtime entry
  /tensho-web/assets/index-Dn_gddh4.js and the tag. Hosted illustration is 63,402
  bytes with the exact checksum below. Evidence: provenance.json and ci-build.log.
- First hosted batch: **7/8**, 26.6 seconds. The first English desktop load reached
  the error boundary: failed dynamic import of GameplayScreen-DKfjhnYC.js, before
  the saved-state readiness assertion. This is a real startup failure, not a
  mechanics assertion or merely a deadline. Original network trace was not enabled,
  so its cause is unproven; do not attribute it conclusively to CDN propagation.
- Direct read-only probe of that exact URL subsequently returns HTTP 200,
  application/javascript, 109,680 bytes. Seven other original journeys passed.
  A fresh unchanged full hosted batch with tracing passes **8/8**, 33.6 seconds,
  original deadlines, no automatic retries, no page errors or horizontal overflow.
  It verifies EN/ES desktop/320px copy/destruction, save/reload, scoring transition,
  capacity and retained inventory. Earlier failure is not erased by this recheck.
- Evidence: hosted.json, hosted-first-screens, chunk-probe.json,
  hosted-recheck.json and hosted-recheck-screens (including traces) under
  /tmp/tensho-ownership-evidence-yzDkyJ. Both temporary verification servers are
  stopped; the pre-existing port 4173 server was left untouched.

Startup reliability remains a concrete follow-up. The production cache currently
contains 430 entries / 70,804.21 KiB; its cost deserves separate cold-load/mobile
review, but it is not established as the cause of the observed fetch failure.

## Artwork provenance

- Built-in image generation, new generation (not CLI). No exact model selector/ID
  is exposed, so the requested latest-model identity cannot be independently
  verified. No claim of a specific model is made.
- Original: /Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-61e82ef7-1d51-4f37-bf4b-2d4929f7bed2.png
- Shipped: public/assets/illustrations/seal-transmutation.webp — 512×512, alpha
  preserved, 63,402 bytes; cwebp quality 85. Original retained. Original and
  optimized output visually inspected; no existing artwork overwritten.
- SHA-256: 8ae1a84eb373ae6993af2facf3f702481705f5443b8cc5893b8c8c41db0b54fc.

Final prompt:

> Use case: stylized-concept. Asset type: transparent game inventory illustration for Tensho, Seal of Transmutation. Primary request: a distinct ornate ritual seal showing tile copying. Subject: a round antique-gold and dark-jade ceremonial medallion with red lacquer rim and a short folded vermilion silk ribbon; at its center two matching small ivory mahjong tiles linked by a single elegant flowing gold arc, each tile bears three simple jade dots. Style/medium: polished hand-painted fantasy game item, tactile carved gold filigree, warm highlights, restrained detail, coherent with ornate red/gold/jade Fate Seal artwork. Composition/framing: centered square cutout, slight three-quarter depth, one compact silhouette readable at 56px, all edges inside frame with 10% padding. Lighting/mood: luminous warm edges and calm mysterious jade center. Constraints: genuinely transparent background, no background scenery, no text, no letters, no numbers, no watermark, no frame around the image, no checkerboard painted into image.
