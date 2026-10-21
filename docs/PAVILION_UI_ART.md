# Pavilion UI and achievement celebrations

**October 21 reward-scope follow-up:** the user chose to implement all eleven
missing reward identities, superseding the open deferral question in the older
entries below. Nine Decrees and Crimson/Obsidian Walls now have mechanics,
localized catalog entries and their own generated artwork. Current verification
is tracked in [the reward contract](ACHIEVEMENT_REWARD_IMPLEMENTATION.md).
Challenge Runs remain deferred (31 active achievements); the separate Charter
decision and final-handoff release hold remain open.

Four page emblems and four dedicated background paintings were generated with the built-in image generation tool for Codex, Settings, Achievements and Collection. The tool does not expose a model identifier. Existing individual artwork is reused for all 33 achievement cards and unlock notifications.

## Runtime delivery

Transparent emblems: 320 × 320 WebP, quality 85. Opaque backgrounds: 1280px wide WebP, quality 82. Both encoded with cwebp; original PNGs are preserved outside the repository. Runtime files live in `public/assets/illustrations/pavilion/`. Total added payload: 538,952 bytes (391,188 for the four backgrounds). Each screen has its own painted environment, subdued beneath solid reading panels, while retaining the selected table's felt palette and ornamental safe frame. CSS covers the viewport without introducing layout dimensions or extra scrolling.

## Interaction

- The gallery shows achievement requirements directly; no hover or expansion is needed to understand a goal.
- Collection retains its hover, keyboard and touch detail popovers and discovery/lock rules.
- Settings keeps every preference and destructive-action confirmation.
- Codex keeps its chapters, steps, examples and Previous/Next flow. Mobile chapters scroll horizontally; the reading pane scrolls vertically.
- New achievement transitions queue one at a time in a polite live region above the router, so round-end navigation cannot discard them. Each toast shows the achievement's own badge, name and requirement.
- Toasts dismiss after eight visible seconds without hover or focus; hover, focus or a hidden tab pause dismissal and restart the reading interval. Close remains a 44px target. They do not steal focus or replay saved achievements on mount/reload.
- Progress reset clears queued celebrations. Full-unlock mode suppresses them. Both the system and in-game reduced-motion preferences suppress entrance/glow animation.
- Achievement navigation/notification labels and all 33 names/requirements are translated in all 13 locales. The localization follow-up adds 792 strings across the twelve non-English catalogs, scoped to the achievement namespace. A direct-catalog test rejects absent entries, English-only requirement copies and changed numeric thresholds; component tests exercise the actual lazy language loader and toast rendering. Native-speaker review remains unverified.
- No scoring, unlock conditions, rewards or economy rules were changed.

## Prompt provenance

### codex

Runtime: `public/assets/illustrations/pavilion/codex.webp`

Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-56077937-7ae2-458f-8394-6147e50e5ee6.png`

Use case: stylized-concept. Asset type: transparent game UI page illustration for Tensho, an Asian-inspired mahjong roguelike. Subject: An open ivory book with thick pages on a carved jade bookstand, one fine gold brush and a small curled scroll, embossed cloud motifs, a tiny vermilion bookmark. Reads as learning and wisdom. Style: exquisitely hand-painted fantasy game object, dimensional carved jade, ivory enamel, brushed antique gold and restrained red silk accents. Match an existing dark emerald and gold game UI; jewel-like warm rim light, crisp bold silhouette, rich painterly material detail. Composition: a single compact centered object group, all edges visible, generous transparent padding, square image. Must remain recognizable at 80px. No background, no scenery, no letters, no words, no watermark, no modern UI frame. Genuinely transparent background.

### settings

Runtime: `public/assets/illustrations/pavilion/settings.webp`

Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-2c1b2015-5797-489d-907a-7ea8bdfada3f.png`

Use case: stylized-concept. Asset type: transparent game UI page illustration for Tensho, an Asian-inspired mahjong roguelike. Subject: An elegant jade and ivory tuning wheel with five broad brass spokes, a small hanging gold bell and vermilion silk knot. Reads as adjustment and harmony, not machinery. Style: exquisitely hand-painted fantasy game object, dimensional carved jade, ivory enamel, brushed antique gold and restrained red silk accents. Match an existing dark emerald and gold game UI; jewel-like warm rim light, crisp bold silhouette, rich painterly material detail. Composition: a single compact centered object group, all edges visible, generous transparent padding, square image. Must remain recognizable at 80px. No background, no scenery, no letters, no words, no watermark, no modern UI frame. Genuinely transparent background.

### achievements

Runtime: `public/assets/illustrations/pavilion/achievements.webp`

Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-f994f34e-e0c7-4a76-bc06-09b86008ac83.png`

Use case: stylized-concept. Asset type: transparent game UI page illustration for Tensho, an Asian-inspired mahjong roguelike. Subject: A majestic jade bi-disc award medallion on a small carved lacquer pedestal, golden laurel-like ginkgo leaves around it, a vermilion silk ribbon, a subtle warm glint. Reads as earned honor. Style: exquisitely hand-painted fantasy game object, dimensional carved jade, ivory enamel, brushed antique gold and restrained red silk accents. Match an existing dark emerald and gold game UI; jewel-like warm rim light, crisp bold silhouette, rich painterly material detail. Composition: a single compact centered object group, all edges visible, generous transparent padding, square image. Must remain recognizable at 80px. No background, no scenery, no letters, no words, no watermark, no modern UI frame. Genuinely transparent background.

### collection

Runtime: `public/assets/illustrations/pavilion/collection.webp`

Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-db51f0cc-451b-445a-86c5-5a9475a21a3b.png`

Use case: stylized-concept. Asset type: transparent game UI page illustration for Tensho, an Asian-inspired mahjong roguelike. Subject: A small open dark jade lacquer treasure cabinet with golden corners, containing one ivory mahjong tile with bamboo decoration, a rolled gold scroll, and a luminous small jade orb. Reads as a collection of treasured game items. Style: exquisitely hand-painted fantasy game object, dimensional carved jade, ivory enamel, brushed antique gold and restrained red silk accents. Match an existing dark emerald and gold game UI; jewel-like warm rim light, crisp bold silhouette, rich painterly material detail. Composition: a single compact centered object group, all edges visible, generous transparent padding, square image. Must remain recognizable at 80px. No background, no scenery, no letters, no words, no watermark, no modern UI frame. Genuinely transparent background.

## Background prompt provenance

### codex background

Runtime: `public/assets/illustrations/pavilion/codex-background.webp`

Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-b8664866-941f-46d2-ba98-2819094a9c4a.png`

Use case: stylized-concept. Asset type: landscape background artwork for an actual game interface, Tensho, Asian-inspired mahjong roguelike. Scene: A scholar's archive inside an East Asian fantasy pavilion: antique lacquer bookcases and rolled ivory scrolls at the far left and right edges, a small warm paper lantern, distant moonlit lattice windows and a glimpse of misty mountains. Learning and contemplation. Style: refined hand-painted fantasy environment, dimensional jade and antique gold materials, painterly soft brush texture, luxurious but restrained, cohesive dark forest-green, emerald, antique gold, ivory and small vermilion accents. Composition: wide landscape 3:2. Decorative architecture and evocative details live predominantly around the outer 15% of the image; the entire central 70% is low-detail deep jade shadow with gentle ambient light, designed to sit behind readable UI panels. Foreground empty. Soft atmospheric depth, subdued contrast and no bright light in the center. No people, no text, no words, no letters, no logos, no watermark, no UI panels, no UI border or buttons. A complete edge-to-edge painted environment, not a transparent cutout.

### settings background

Runtime: `public/assets/illustrations/pavilion/settings-background.webp`

Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-ec22f166-e9e3-4eea-a91b-567a448c7cab.png`

Use case: stylized-concept. Asset type: landscape background artwork for an actual game interface, Tensho, Asian-inspired mahjong roguelike. Scene: A tranquil East Asian fantasy garden pavilion at dusk: carved jade latticework at the far left and right edges, bamboo silhouettes, a small suspended bronze wind bell and a warm paper lantern, distant still water and mist. Harmony, tuning and calm. Style: refined hand-painted fantasy environment, dimensional jade and antique gold materials, painterly soft brush texture, luxurious but restrained, cohesive dark forest-green, emerald, antique gold, ivory and small vermilion accents. Composition: wide landscape 3:2. Decorative architecture and evocative details live predominantly around the outer 15% of the image; the entire central 70% is low-detail deep jade shadow with gentle ambient light, designed to sit behind readable UI panels. Foreground empty. Soft atmospheric depth, subdued contrast and no bright light in the center. No people, no text, no words, no letters, no logos, no watermark, no UI panels, no UI border or buttons. A complete edge-to-edge painted environment, not a transparent cutout.

### achievements background

Runtime: `public/assets/illustrations/pavilion/achievements-background.webp`

Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-9cc6076c-0f76-49a1-9c73-585adb3e2fa3.png`

Use case: stylized-concept. Asset type: landscape background artwork for an actual game interface, Tensho, Asian-inspired mahjong roguelike. Scene: A ceremonial hall of honors in an East Asian fantasy palace: gilded carved pillars and small circular jade award medallions in wall niches along the far left and right edges, restrained vermilion silk, distant raised steps fading into emerald shadow. Quiet triumph and earned prestige, not a crowded trophy shelf. Style: refined hand-painted fantasy environment, dimensional jade and antique gold materials, painterly soft brush texture, luxurious but restrained, cohesive dark forest-green, emerald, antique gold, ivory and small vermilion accents. Composition: wide landscape 3:2. Decorative architecture and evocative details live predominantly around the outer 15% of the image; the entire central 70% is low-detail deep jade shadow with gentle ambient light, designed to sit behind readable UI panels. Foreground empty. Soft atmospheric depth, subdued contrast and no bright light in the center. No people, no text, no words, no letters, no logos, no watermark, no UI panels, no UI border or buttons. A complete edge-to-edge painted environment, not a transparent cutout.

### collection background

Runtime: `public/assets/illustrations/pavilion/collection-background.webp`

Original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-0ff0b339-115c-4208-89f6-b2fdfda79b02.png`

Use case: stylized-concept. Asset type: landscape background artwork for an actual game interface, Tensho, Asian-inspired mahjong roguelike. Scene: An East Asian fantasy treasure archive: dark jade lacquer cabinets at the far left and right edges, a few ivory mahjong tiles, ornate scroll cases and tiny luminous jade orbs on their shelves, a warm lamp and distant latticework. A rich private collection of magical game objects. Style: refined hand-painted fantasy environment, dimensional jade and antique gold materials, painterly soft brush texture, luxurious but restrained, cohesive dark forest-green, emerald, antique gold, ivory and small vermilion accents. Composition: wide landscape 3:2. Decorative architecture and evocative details live predominantly around the outer 15% of the image; the entire central 70% is low-detail deep jade shadow with gentle ambient light, designed to sit behind readable UI panels. Foreground empty. Soft atmospheric depth, subdued contrast and no bright light in the center. No people, no text, no words, no letters, no logos, no watermark, no UI panels, no UI border or buttons. A complete edge-to-edge painted environment, not a transparent cutout.


## Verification

See `src/components/ui/PavilionScreen.test.tsx`, `src/components/ui/AchievementToast.test.tsx` and `e2e/pavilion.spec.ts` for art budgets, queue, restore, reduced-motion, responsive layout, native controls, image decoding and real-play unlock checks.

Verification of this change:

- 47 focused unit/component tests passed, with the normal test deadlines.
- 26 production-build Playwright checks passed on desktop and mobile profiles at 320px, 390px and 1280px, including actual play-earned notifications and reload persistence. Screenshots were inspected for all four desktop pages and narrow Settings/Collection layouts.
- Scoped ESLint and `git diff --check` passed.
- Vite production bundling and `verify-asset-delivery.mjs` passed. The final offline precache is 39,245,334 bytes, within the repository budget.
- The repository-wide TypeScript check is not clean: concurrent Honor-hand work has missing `MeldType.Honors` mappings in `HandRack.tsx`, and `locales.test.ts` assumes every non-toast play-pattern entry has `name` and `explain`. These files were not modified to resolve those errors as part of this UI work.
- Nothing was committed, pushed or deployed by this change.

### Integration handoff

The user requested waiting for the gameplay agent's final handoff before integration/release. The passing pavilion checks above describe the frozen UI build, not the subsequently edited engine. A later live-development audio run passed 2/6: native sound worked, but both navigation and reload journeys encountered an invalid/missing run save. Fresh startup subsequently saved successfully while the other agent updated the mandate snapshot schema; this is not proof that the original failure is resolved. Recheck final-source save/typecheck gates after handoff.

The audio harness now applies its mid-round target fixture through a saved checkpoint before application startup, rather than importing mutable Vite modules, so it can test a frozen production build. The production runner now includes `pavilion`, `jade-controls` and `audio`; its regression test requires those suites.

Follow-up results (no deadlines or assertions relaxed):

- Frozen-production audio: 5/6 passed; the desktop navigation/mute case exhausted its 30-second total deadline before its first tile play. That exact case passed the isolated follow-up in 23.8 seconds. Both desktop and mobile paid-play/reload checks passed with exact snapshot equality and no scoring-sound replay. Initial diagnostics remain at `/private/tmp/tensho-audio-production`; the desktop follow-up is `/private/tmp/tensho-audio-production-desktop-followup`.
- Release safeguards/runner initial batch: 12/17 passed. One concurrent-publication fixture exhausted its subprocess deadline; all four runner cases were denied localhost binding by the sandbox. The unchanged publication case passed its targeted follow-up. With localhost permission, all four updated runner cases passed, including the new suite-list assertions, failure exit propagation and owned-server cleanup.
- These follow-ups close the specific harness checks, not final-source whole-project verification or permission to publish before the gameplay handoff.

### Achievement localization follow-up

The initial coverage test passed English and failed all twelve other locales. After adding their 33 name/requirement pairs, all thirteen catalog checks pass; all thirteen lazy-language toast-rendering checks also pass. The prior 38 toast lifecycle checks pass as well. Production bundling and the asset budget pass with a 39,296,507-byte precache. The French compact title is shortened to “Succès” after visual inspection found an awkward mid-word break at 320px.

All 26 frozen-production gallery checks pass (13 languages × desktop/touch profiles at 320px), including localized names and requirements, category switching, the largest scoring target and long skill text without horizontal overflow. Artifacts: `/private/tmp/tensho-achievement-locale-qa`. The final French title separately passes both profiles against the current development UI (`/private/tmp/tensho-achievement-french-title`); its desktop screenshot confirms the title stays on one line. Scoped lint and diff checks pass. This is UI/localization evidence, not approval of the still-changing gameplay candidate.

Scope limitation found during this pass: the pre-existing achievement reward labels still contain legacy English names (for example, “Swift Andy Decree”). Its legacy `swift_andy` unlock ID is absent from the current decree definitions and locale catalog. This needs final catalog/progression reconciliation after the gameplay handoff, not merely translation of a potentially nonexistent reward. No unlock mapping or gameplay condition was changed in this localization pass.

### Read-only progression audit for final handoff

These are unresolved implementation findings, not changes made by the pavilion UI work. Recheck them against the gameplay agent's final candidate before release. The user explicitly requested waiting for that handoff.

- Eleven of fourteen advertised achievement reward targets do not resolve in the current playable catalogs. Nine decree targets are absent from both the authored library and runtime rule-decree definitions: `stage_master`, `flower_pot`, `satellite`, `swift_andy`, `lucky_sixes`, `the_idol`, `stuntman`, `cartomancer`, and `astronomer`. Two wall targets, `crimson_wall` and `obsidian_wall`, belong to legacy metadata rather than the current eight table styles. The remaining three reward targets resolve: `decree-blueprint`, `swift_hand`, and `wasteful_plenty`. Reconcile the intended rewards before translating their labels; do not merely relabel nonexistent rewards.
- Ten achievement definitions have no matching branch in `achievementStore.checkAchievements`: `red_path`, `black_path`, `golden_path`, `wild_flush`, `shattered`, `retrograde`, `master_of_silence`, `archive_complete_plus`, `archive_complete_plus_plus`, and `rule_breaker`. The audit found no other runtime caller of `unlockAchievement`. `rule_bender` has an evaluator, but no runtime producer of `challengeRunsCompleted` was found.
- Three discovery thresholds disagree with the active catalogs: Fate Seals uses 22 instead of 24, Void Scripts uses 20 instead of 21, and overall discovery uses 352 against 347 active items in a fresh archive. Orbs (13) and Charters (32) match. Fresh archive category totals were 165 decrees, 8 walls, 32 charters, 58 consumables, 8 tile marks, 4 seals, 5 editions, 15 packs, 24 omens, and 28 mandates. Historical profiles may retain larger discovery counters through the meta-progression bridge; any fix must preserve earned achievements and reconcile active item identities rather than blindly replacing magic numbers.

Sources: `src/stores/achievementStore.ts`, `src/config/unlockDefinitions.ts`, `src/config/decreeDefinitions.ts`, `src/config/decreeLibrary.ts`, `src/systems/DecreeSystem.ts`, `src/config/archiveDefinitions.ts`, `src/stores/archiveStore.ts`, and `src/game/MetaProgressionBridge.ts`. Catalog counts were inspected in a fresh in-memory store, without editing a player's saved profile. This audit is not a full-project test pass. No progression rules, reward mappings, commits, pushes, or deployments were performed for it.

### Discovery completion fix after the audit

The five `discover_all*` achievement conditions now require the actual discovered identities in the current catalog, via `src/utils/achievementDiscovery.ts`, instead of hardcoded lifetime-counter thresholds. This independently resolves the three threshold mismatches above and also prevents inflated legacy counters from awarding completion when a current item is missing. Required identities come from a pristine catalog, not a hydrated profile; retired records do not count or block completion. Missing/uninitialized entries fail closed. Previously earned achievements, timestamps, and seen status remain untouched, and Full Unlock still cannot manufacture awards. No gameplay-agent files or legacy reward mappings were changed.

Regression evidence: the initial 22 tests reproduced 11 failures before the fix. The final combined run passes 117 tests across discovery completion (23), the meta bridge (10), Full Unlock (11), progress reset (9), toast lifecycle (38), localized toast rendering (13), and locale coverage (13). The final-discovery event test confirms exactly one award notification across repeat acquisition and bridge reinitialization. Its first draft also received the unrelated `deck_maximalist` award; the fixture now settles baseline awards before observing discovery events rather than confusing two different achievements with a duplicate.

Scoped ESLint and `git diff --check` pass. The repository TypeScript check still fails in concurrently edited files: `ShopScreen.tsx` references an unimported `useHeaderHeight`, and `TheMouth.test.ts` passes `number | TileSuit` where a number is required. These are observations of the live checkout, not final-handoff diagnostics. A further balance issue remains: `maximumWallSize` defaults to 136 while `deck_maximalist` requires only 80, so a fresh profile already meets its condition. Reconcile its intended challenge with the final gameplay rules. Release remains on hold pending the other agent's final handoff and combined verification.

Production bundling and the offline asset verifier also pass for this fix (`/private/tmp/tensho-discovery-check.aMlxWa`, 39,298,856 precache bytes, 782 verified entries). Bundling does not supersede the failing TypeScript gate or prove the still-changing gameplay candidate release-ready. No new images were needed for this logic correction; the eight pavilion illustrations/backgrounds remain included in the verified asset payload.

### Stake achievement evaluators

Four of the ten missing evaluators identified above are now implemented without modifying gameplay-agent files: `red_path`, `black_path`, `golden_path`, and `archive_complete_plus`. The named stake awards require a recorded victory on the named tier (Red 2, Black 4, Gold 8), consistent with their descriptions; selecting/unlocking a difficulty or winning a different tier is not a substitute. Gold-table mastery requires a recorded Gold victory for each current `TABLE_STYLE_DEFINITIONS` identity. Retired walls remain valid history but cannot replace a missing current table. Existing victory records are read without migration or mutation, and the normal already-earned and Full Unlock guards still apply.

The initial regression run reproduced 13 failures out of 15 tests before implementation. All 15 now pass, including actual `runStart`/`runEnd` bridge events, defeats, restored victory history, all-table completion, summary-only false positives, Full Unlock, and exactly-once target notifications across bridge reinitialization. The combined progression batch passes 68 tests; the separate pavilion/toast/localization batch passes 73 tests (141 total). Scoped ESLint and diff checks pass.

This implements achievement earning, not the unresolved legacy reward mappings: Crimson/Obsidian reward targets still need catalog reconciliation. Six definitions still lack evaluators (`wild_flush`, `shattered`, `retrograde`, `master_of_silence`, `archive_complete_plus_plus`, `rule_breaker`), and `rule_bender` still needs a verified challenge-completion producer. No release has been performed.

The latest TypeScript follow-up exits 2 with three diagnostics in concurrently edited tests: two obsolete `fateSeals` props in `CollectibleRail.test.tsx` and the `number | TileSuit` argument in `TheMouth.test.ts`. The prior Shop diagnostic no longer appears. The first check also caught missing `instanceId` and `name` fields in this pass's discovery-event fixture; those are corrected using two distinct instance IDs and the catalog name. The final check has no diagnostics in the achievement changes, both achievement regression files pass again (38 tests), and scoped ESLint/diff checks pass. This remains a failed whole-project typecheck, not release approval.

### Physical Glass breaks and Yaku mastery

Historical verification note: the Glass implementation in this subsection was subsequently corrected to the single-play requirement below. Its cumulative implementation and counter are no longer used.

`shattered` and `retrograde` now have producers and evaluators. Two additive persisted statistics (`totalGlassTilesBroken`, `highestYakuLevel`) use the existing version-2 merge defaults, preserving old earned awards without inventing unrecorded history. New-profile defaults are zero breaks and level 1.

- Glass uses the existing `tileShattered` event in the progression bridge. Real scoring already emits it once per physical break, including when a Decree repeats that tile's reward; previews do not emit it. Six new tests cover paid two-tile shattering, Decree retriggers, surviving Glass, cross-run/profile rehydration, old profiles, and Full Unlock suppression. The first fixture attempted to combine Glass and a Red Seal, but the current single-modifier rule replaces Glass with the Seal. The corrected retrigger fixture uses the real Echo Stone Decree rather than an impossible modifier combination.
- Level mastery uses a new `yakuLevelsChanged` event emitted by the orchestrator after successful upgrades. Both normal/auto-applied Orb settlement and the shared Seal/Script all-Yaku upgrade helper emit the current maximum level. This avoids pretending that a Seal or Script was an Orb, and covers shop purchases and pack acquisitions as well as held consumables. Eight new tests exercise ordinary Orbs, Black Hole, Seal of the Void, Script of the Singularity, shop, packs, Full Unlock, profile rehydration and new-run persistence. Validation, rejected repeat use, and run restoration do not replay the award.

These are small additive changes in `EventBus.ts`, `GameOrchestrator.ts`, `MetaProgressionBridge.ts`, and `achievementStore.ts`; the other agent's secret-pattern and consumable edits were preserved. The combined 16-file run passes 236 tests, including adjacent consumable, retrigger, secret-pattern, progression, toast and localization coverage. A final 14-test Glass/Yaku follow-up adds the profile-persistence case (237 distinct tests across those runs). Scoped lint passes after renaming a non-React test helper that the Hooks rule interpreted as a hook. Production bundling and the offline asset verifier pass at `/private/tmp/tensho-achievement-events.YTRX8f` with 39,299,554 precache bytes and 782 verified entries.

Four definitions still lack evaluators: `wild_flush`, `master_of_silence`, `archive_complete_plus_plus`, and `rule_breaker`. `rule_bender` still needs a verified Challenge completion producer. Legacy reward mappings, the wall-size threshold, and review of speed-run feasibility under the no-Skip rules also remain open. Neither these passing checks nor the generated art establishes overall project completion; final integration/release still requires the requested gameplay handoff.

Final TypeScript check for this pass exits 2: three read-only `gold` assignments in the other agent's new `MadeSeals.test.ts` and the union-typed argument in `TheMouth.test.ts`. There are no diagnostics in this pass's changes. The moving line numbers and new test file reinforce that these are live-checkout results, not verification of the eventual handoff candidate. Scoped lint and `git diff --check` pass; nothing was committed, pushed, or deployed.

### Design-fidelity correction: Shattered and Wild Flush

Re-reading `docs/GAME_MECHANICS.md` (Skill Accolades) exposed two requirements missing from the UI copy: Shattered means **two Glass tiles in one hand**, and Wild Flush means **Honitsu with all Wild tiles**. The earlier cumulative Glass implementation was incorrect despite its passing tests. These are corrections to match the design, not newly chosen easier achievement rules.

- Shattered now evaluates `maxGlassTilesBrokenInHand`. Both complete and tactical paid plays report their actual physical shatter count through `handPlayed`; individual `tileShattered` events no longer accumulate achievement credit. Two one-tile breaks cannot qualify, even in the same round or across profile reloads. Two breaks in one paid play qualify. Retriggers and previews do not inflate the count. The two new boundary assertions failed against the cumulative implementation and pass after correction. Previously earned awards remain preserved; old cumulative counters do not grant new awards.
- Wild Flush now records a positive, unblocked complete Honitsu whose submitted physical tiles are all Wild-marked. A real 14-tile paid play earns it; previews, tactical pairs, zero-scoring/blocked events, Full Unlock, and hands with zero, one, or thirteen Wild tiles do not. The initial real-play assertion failed before the evaluator was added, and all seven focused cases now pass.
- All thirteen locale descriptions now explicitly state the single-play Glass and all-Wild requirements. Numeric targets remain unchanged. These are translated strings, not a claim of native-speaker review. The small-screen gallery checks now assert both updated descriptions and absence of vertical text clipping as well as horizontal overflow.

The combined 18-file regression run passes 265 tests. Scoped lint and diff checks pass. Production bundling and the offline asset verifier pass at `/private/tmp/tensho-achievement-rules.haCCgO` (39,300,473 precache bytes; 782 verified entries). TypeScript still exits 2 on three read-only `gold` assignments in `MadeSeals.test.ts` and the union-typed argument in `TheMouth.test.ts`, outside this pass's edits.

Three definitions remain without evaluators: `master_of_silence`, `archive_complete_plus_plus`, and `rule_breaker`; `rule_bender` still needs a verified Challenge completion producer. The reward/catalog and balance issues above also remain open. No merge or deployment has occurred; the final gameplay handoff is still required before release.

All 26 frozen-production small-screen language checks pass (13 locales × desktop/touch profiles at 320px), including both corrected descriptions and no clipped/overflowing text. Artifacts: `/private/tmp/tensho-achievement-rules-qa`; preview: port 4298. Existing English-only legacy reward labels remain visible and unresolved; this pass does not claim that those rewards are localized or implemented.

### Master of Silence and visible achievement progress

Master of Silence now follows the documented requirement to win three rounds without discarding Honors. These are three qualifying profile wins, not a consecutive streak: the source requirement does not specify a streak or a single run. Real Honor discards from redraw, The Hook, Dead Wall Writ swaps, and Script penalties disqualify the current round. Playing Honors in a scored hand is allowed; Stone-covered former Honors do not count as Honor discards under the current Stone rules.

The optional persisted `honorDiscardsThisRound` counter resets at round initialization and travels through round-end events. Old mid-round saves without this field remain unknown and cannot earn credit for that round; the next initialized round can qualify. Snapshot validation rejects malformed counters. Losses, Full Unlock, and restored completed rounds cannot manufacture credit. Previously earned awards remain intact.

All thirteen locale descriptions now explicitly say to win without discarding Honors; native-speaker review remains unverified. Achievement cards now display the actual stored Glass, Yaku level, Silence, and Charter counters rather than falling back to zero. This display change does not establish that every existing counter's producer follows its intended rule.

Verification: 288 tests across fourteen files pass with two workers and unchanged deadlines, including twelve new Silence regressions and one reactive achievement-progress UI test. The initial larger parallel run passed 286/287 tests but timed out on the UI test; that unchanged test passed in isolation before the successful combined rerun (which also adds the Script-penalty case). The Hook fixture was corrected to control the Mandate system's own random source; the UI selector was corrected to account for the category count in its accessible name. Scoped ESLint and `git diff --check` pass. Production bundling and asset verification pass at `/private/tmp/tensho-silence-check.8GI8vy` (782 entries; 39,301,235 precache bytes).

Two definitions still lack evaluators: `archive_complete_plus_plus` and `rule_breaker`. The Challenge completion producer, unresolved reward targets, and previously noted balance issues remain open. The user reconfirmed that release must wait for the gameplay agent's final handoff. Nothing was committed, merged, pushed, or deployed.

The final repository TypeScript build check (`tsc -b`) still exits 2 on `TheMouth.test.ts:35`: a `number | TileSuit` argument is passed where a number is required. The earlier MadeSeals diagnostics no longer appear. This is a live-checkout result, not verification of the eventual handoff candidate; the passing Vite bundle does not supersede this failed gate.

### Keeper of Winds: actual scoring sources and single-run progress

The C2 audit found two defects in Keeper of Winds: its evaluator used a lifetime total despite `docs/GAME_SYSTEMS.md` requiring one run, and its producer listened for the unused `yakuhai_wind` identifier. Actual gameplay uses the shared `yakuhai` family for both Dragons and Winds. The first real-hand test exposed this catalog mismatch; the older, separate `YakuDefinition.ts` catalog is not the live detector.

The live detector now preserves each Yakuhai's Wind/Dragon source without changing its family, multiplier, eligibility, or quantity. Paid complete hands publish the scored Wind count. Existing seat/round Wind stacking is preserved: an East triplet when both Winds are East contributes two scored Yakuhai, not one per tile or per retrigger. Other patterns containing Winds, tactical pairs, Dragons, non-value Winds, previews, blocked/zero-scoring plays, and detection-only events do not invent Wind credit.

The active run owns a snapshot-validated optional counter; a new run resets it. The achievement evaluates the new persisted `maxWindYakuInRun`, never the old lifetime total. Missing legacy counters start with only newly observed credit, not invented history; existing earned awards remain intact. Full Unlock suppresses the run counter as well as the award. The gallery displays this maximum, and all thirteen locale descriptions now specify a single run. Native-speaker review is still unverified.

Ten new regression cases cover real paid hands, cross-run boundaries, saved continuation/profile rehydration, exactly-once notifications, legacy data, malformed saves, Full Unlock, tile retriggers, and tactical exclusions. The focused eight-file run passes 128 tests, including adjacent scoring/repetition/snapshot and localization coverage. Scoped lint and diff checks pass. Production bundling and asset verification pass at `/private/tmp/tensho-wind-check.A1PcFa` (782 entries; 39,302,010 precache bytes). The whole-project TypeScript check still fails only at `TheMouth.test.ts:35` in the concurrent gameplay work.

Charter Collector was subsequently resolved by the user on October 21: buy five Charters in one run by the end of Act 5. Boss-only shops and non-rerollable Charter slots remain unchanged. Saved run context tracks observed purchases, while the achievement displays the best single-run count; older cumulative counts cannot establish that record. Earned legacy awards are retained and all 13 descriptions have been updated. No release is authorized before the requested gameplay handoff.

### Codex mechanics reference — October 21

The user requested current Flower/Season mechanics in the Codex. The routed
reference and legacy modal now share six illustrated sections in `FloraCodex`:
Flowers and all three set bonuses, rebloom/awakening, normal Seasons, corrupted
Seasons, optional Flower–Season recipes, and Flower-paid Decree catalysts.
The existing hierarchy page follows these sections. No gameplay or unlock rule
was changed for this reference update.

The reference reuses the live token descriptions and 28 existing image
placements, including all four awakened portraits and all four corruption
portraits. No new images were needed. Normal Season descriptions now include
Spring's rack spaces, Autumn's free REDRAW, Summer's actual wall reservation,
and Winter's one-rank-gap permission. The text explicitly distinguishes Flower
awakening from Season corruption. Eligibility versus per-run awakening,
non-stacking duplicates, Drought suppression/protection, and the ×1.2/×1.4
Chrysanthemum distinction are explained.

Interaction recipes are collapsed native disclosures by default. This makes
them available on deliberate request without turning discovery into mandatory
coaching. Catalyst explanations name the four eligible examples, explicit
Flower selection/confirmation, lost set bonuses, capacity refusal, zero resale
and the two-Flowers-after-payment requirement of Yakuman Succession.

All 13 locales have authored reference copy; unit tests prohibit fallback/raw
keys and check interpolation, shared entry points, images and live rules.
The existing tutorial animation helpers now honor OS reduced motion as well as
the in-game preference. Native-speaker review is not claimed.

Codex verification: **26/26 frozen-production browser journeys passed** without
retries (3.2 minutes), covering all 13 locales in desktop/mobile Chromium
profiles at 320px and 1280px. Checks include decoded artwork, unclipped text,
opaque reduced-motion content, keyboard-operated optional recipes, no page
errors and no run created by browsing. English/Thai desktop and Spanish phone
captures were visually inspected. Report:
`/private/tmp/tensho-codex-flora-production.json`.

The initial focused rules/reference batch passed 216 tests; after the
reduced-motion correction, 46 reference/control/tutorial tests passed, followed
by 105 reference/localization/Charter/audio tests. These batches overlap and
are not a new full-suite count. TypeScript, scoped lint (one existing
react-refresh warning), and the Pages-path production build passed. The frozen
build at `/private/tmp/tensho-codex-candidate-20261021` verifies 793 precache
entries totaling 40,177,551 bytes. Earlier development-server checks exposed
missing navigation translation keys (corrected) and an interrupted DOM during
hot reload; the final verification uses an isolated frozen build. No deployment
or physical-device/native-speaker acceptance is claimed.

### Earlier Wind and integration verification

All 26 frozen-production phone-width language checks pass, including the single-run Wind requirement and horizontal/vertical text bounds. English and Russian touch screenshots were visually inspected with the Wind card in view. Results: `/private/tmp/tensho-wind-browser-results`; the owned preview server on port 4300 was stopped after verification.

The first full regression run finished with 3,143 passes and five failures across 222 files. Follow-up inspection confirmed three stale control-art expectations, a Drought test still pricing grouped Winds at 50 instead of the explicitly approved 100, and a coach test forcing a complete hand even when the authoritative preview prefers a stronger tactical play. The latter two reproduced unchanged in isolation. The corrected tests retain exact scoring/payment assertions and require the coach to evaluate the complete subset, choose the highest evaluated score, and leave the run unchanged. Control tests now require the jade settings/sound portraits and single sound-off image while preserving accessible-name, decorative-image and click checks. The first control follow-up also caught an omitted `generated/` path segment for unchanged Close/Refresh art; that fixture correction passes all 26 control tests. The combined affected-case follow-up passes 62 tests.

The remaining TypeScript error was a test-fixture inference issue: `TheMouth.test.ts` now explicitly checks its tile tuples with `satisfies [TileSuit, number][]`. Tile values and gameplay assertions are unchanged. `tsc -b` now passes. Whole-project ESLint reports zero errors and 215 warnings (`/private/tmp/tensho-wind-eslint.json`); scoped lint and diff checks also pass. These corrections do not alter the other agent's gameplay rules or constitute release approval.

The final full regression recheck passes **3,148/3,148 tests in 222 files**, with two workers and unchanged deadlines. Machine-readable report: `/private/tmp/tensho-wind-regression.json`. Earlier failures above remain recorded. This is current local-source evidence, not final-handoff CI or hosted verification.

One additional boundary needs follow-up before claiming complete Wind progression: the existing bridge clears `runMetaContext` at canonical victory, while explicit Endless continuation does not recreate it. The new Wind tests cover ordinary runs and saved continuation before victory, not Wind earning after that transition. Audit and test the victory-to-Endless path, including older victory saves, without replaying victory awards or inventing historical Wind counts. The broader Challenge/reward discrepancies and Charter decision remain open. No commit, merge, push, or deployment was performed.

### Victory-to-Endless progression follow-up

The four initial lifecycle regressions reproduced the missing Wind credit after victory. The bridge now retains proven run context at canonical victory, so the same run can continue in Endless without replaying `runStart` or victory settlement. Defeat (including Endless defeat, which intentionally emits no second `runEnd`), quit, menu reset, and a new run clear or replace that context.

Older pending-victory and active-Endless saves can have `meta: null`. On load, the engine supplies an optional context candidate with the saved stake/table and observed Flower identities. The progression bridge reconnects it with zero unrecorded Wind/Corrupted-Season credit. It neither changes profile totals nor invents missing past scores; finished Endless defeats are not reconnected. The first implementation installed the fallback directly during engine restoration, which broke one exact-codec regression. Moving reconnection into the existing `gameLoaded` bridge preserves standalone snapshot equality without weakening that assertion.

The Wind suite now passes 17 tests, covering the six added lifecycle cases and real save-coordinator persistence/resume. It verifies one victory settlement, one Wind notification, custom stake/table identity, no cross-run carry-over, and legacy recovery without replay. The first save-coordinator fixture incorrectly expected a boolean from `flush(): Promise<void>`; it now awaits the operation and checks the actual saved status plus the persisted counter. Adjacent lifecycle/snapshot checks passed 110 tests; the subsequent persistence/Full Unlock/stake/queue batch passed 88 tests before the final save-coordinator case was added. TypeScript, scoped ESLint and diff checks pass. Bundling and asset verification pass at `/private/tmp/tensho-endless-meta.9JOLHa` (782 entries; 39,302,569 precache bytes). No new images were needed for this lifecycle correction; the generated art remains in the verified bundle.

Handoff inspection found the completed Codex task “Fit tea house upgrades in 8 tiles” (`01a15d1c-85e6-7451-8df9-1e7ebcb36026`). Its final message covers the Tea House/layout/icon changes, not the separate gameplay-rule work. The user has been asked whether this is the intended final handoff or whether another gameplay handoff is still pending. Its completion is not being treated as permission to release.

The first broad follow-up completed with 3,154/3,155 tests passing in 222 files. Its only failure was the already-loaded pre-correction `flush()` return-value assertion, not a runtime failure; the corrected 17-test suite had passed separately. The original report remains at `/private/tmp/tensho-endless-meta-regression.json`. A fresh full run is required to claim a single all-green result for the corrected source.

The fresh corrected-source run passes **3,155/3,155 tests in 222 files**, with no skipped tests, two workers, and unchanged deadlines. Confirmed from `/private/tmp/tensho-endless-meta-regression-final.json`. All 13 release-versioning safeguards also pass; these use temporary fixtures and do not publish a release. The late-Act fixtures verify victory/Endless transitions and persistence, not organic difficulty or game balance. No new browser journeys were run for this progression-only correction. Release remains on hold pending the intended final handoff and outstanding completion gates.

### Path difficulty fidelity correction

The earlier exact-tier implementation above followed incomplete UI descriptions,
but contradicted `GAME_MECHANICS.md`'s Red Stake+ and Black Stake+ requirements
and the corresponding unlock definitions. Corrected the evaluator to count
recorded victories at or above each named difficulty, and updated Red/Black
descriptions in all 13 locales. No gameplay scoring, difficulty unlocks, saved
victory records, or already-earned awards were changed.

Before the fix, 11 of 40 expanded stake tests failed: ten higher-tier qualifying
wins and the bridge-driven first-Gold-win notification case. After the fix,
**131/131 targeted tests in six files pass**, including all 24 named-award ×
played-tier combinations, lower-tier accumulation rejection, restoration,
defeat, one-time notifications, Full Unlock exclusion, table mastery, Wind
lifecycle, the progression bridge, toast behavior and 13-language copy/toasts.
TypeScript, scoped ESLint and diff checks pass. The preceding 3,155-test full run predates this correction;
it is not claimed as verification of these newer changes. No new images or
browser journeys were needed for this rule/copy correction. Release remains
on hold for the final handoff.

### Wall-size progression wiring

The wall-size achievement counters had no gameplay producer and both defaulted
to 136. This awarded Maximalist without any run and left Minimalist disconnected
from actual thinning. They now observe settled permanent collection sizes from
the orchestrator at run start, active-run restore, successful actions, wall
Seals and Tile Pack additions. Draw pile exhaustion is not deck thinning. A
final losing play still records its permanent Glass destruction, and Script
remove/create substeps do not create intermediate achievements.

Achievement profile version 3 clears only the old unobserved wall extrema when
migrating; it preserves existing awards and all other statistics. Current
profiles retain their measured extrema on rehydration. Full Unlock still
creates no progress. The documented 80-tile threshold is deliberately unchanged
and is already met by current starting collections; the distinction is actual
run evidence rather than a menu-time placeholder award.

The new 15-test Wall suite covers startup, near-empty draw pile/REDRAW,
actual Seal removals from 144 through 20 and 18 tiles, pack growth, settled
Script creation, final-play Glass destruction, restore, Full Unlock, invalid
event counts and old/current profile hydration. The first run exposed a test
fixture using nonexistent `exportRun()`; corrected it to the actual
`captureRun()` API. TypeScript also identified incomplete migration return
types, fixed by supplying complete persisted defaults. The adjacent ten-file
batch passes **182/182 tests**. TypeScript and diff checks pass. Full regression
is being rerun because this changes persisted achievement state; final result
will be recorded below. No art, gameplay balance or release operation changed.

The completed full regression passes **3,195/3,195 tests in 223 files** with
two workers and unchanged deadlines (103.34 seconds). Report:
`/private/tmp/tensho-wall-achievement-regression.json`. This includes the Path
threshold correction and the wall-size migration. Scoped ESLint passes as well.
Production bundling and asset verification pass at
`/private/tmp/tensho-wall-check.7Y0k5g`: 782 verified entries, 39,303,618 precache
bytes, 2,155,032 delivery-copy bytes. Existing Browserslist, large-chunk and
React test `act` warnings are not claimed fixed. No browser journeys were
repeated for this progression-only change. No commit, merge, push or deployment.

### Decree stake mastery and Collection markers

Connected the missing `archive_complete_plus_plus` evaluator to real per-Decree
victory evidence. The engine's canonical victory now includes held catalog IDs;
the bridge records the actual stake for those IDs and the current table. Old
`currentRunItems` is an acquisition history, so it is deliberately not treated
as proof that a sold Decree survived the final hand. The optional Archive field
retains all earned tiers without changing existing generic win statistics.

Collection cards show the highest recorded tier using the existing trophy art
and the stake's color. The anchored detail panel lists all earned tiers, with
localized text in 13 languages. Archive Complete++ shows completed/current
catalog counts. No new raster assets were required for this functional marker;
the generated pavilion backgrounds and illustrations remain unchanged.

The 21-case engine/store suite covers real final plays at every tier, duplicate
copies, sold items, defeat, Full Unlock, pre/post-victory restore, Endless,
catalog completeness, one-time mastery notification, old history, hydration,
reset and invalid tiers. The first adjacent batch passes 81 tests. UI coverage
adds 14 marker cases and one reactive mastery-meter case. Its first run caught
a fixture hardcoding `Archive Complete++` instead of the actual localized
`Archive Complete ++`; corrected the query to use the translation key, retaining
the meter assertions. The corrected engine/meter recheck passes 23 tests.

Browser checks pass 26 phone-width journeys (13 locales in Chromium desktop
and touch emulation) plus two 1280px keyboard journeys. They check all eight
markers, localized Gold labels, no horizontal overflow, popup dismissal and
live Gold mastery count. Phone screenshots for English and Russian were
visually inspected: the popup scrolls internally and the close control remains
visible. Artifacts: `/private/tmp/tensho-stake-mastery-browser` and
`/private/tmp/tensho-stake-mastery-wide`. This is controlled fixture rendering,
not evidence of organic Gold-stake balance or native-device accessibility.

TypeScript passes. Scoped lint has zero errors and one existing Fast Refresh
warning in `ItemDetails.tsx`. Full regression and production bundling are being
rechecked. The remaining missing achievement evaluator is `rule_breaker`;
Challenge completion, legacy reward mappings, Charter deadline and speed-run
feasibility still need resolution. Release remains on hold for the final handoff.

Production bundling and offline asset verification pass at
`/private/tmp/tensho-stake-mastery-check.R252z4`: 782 verified entries,
39,306,084 precache bytes, unchanged 2,155,032 delivery-copy bytes. The 1280px
Chromium screenshot was also inspected; the details panel stays within the
viewport with its close button reachable. The temporary preview on port 4302
was stopped after verification. Existing bundle/Browserslist warnings remain.

Final full regression: **3,231/3,231 tests in 225 files**, two workers, unchanged
deadlines, 182.55 seconds. Report:
`/private/tmp/tensho-stake-mastery-regression.json`. Diff checks pass. These are
local integration results, not final-handoff CI or hosted release verification.

A fresh search confirms Challenge Runs have only documentation/achievement
references, with no runtime mode or catalog. The user has been asked whether
completion must include that mode or explicitly defer it and its two awards;
neither option has been assumed or implemented. The existing final-handoff
release hold remains in force. Nothing was committed, merged, pushed or deployed.

### Purist run-history correction

The `win_without_reroll` evaluator existed, but `winsWithoutReroll` had no
producer. Added an optional validated `shopRerolls` run-meta counter, initialized
only on a new run. Successful shop rerolls (including free ones) increment it;
the canonical victory credits Purist only for a proven zero. Save/restore,
Endless, reset and unknown legacy history retain the semantics documented in
`RULE_RESOLUTION.md`. No gameplay reroll prices, stock or permissions changed.

Before the correction, three positive lifecycle cases failed to earn the
achievement. An additional fixture failure used an opened-pack ID instead of
the Tea House offering ID for purchase; the fixture now uses
`shop.state.packOfferings`, retaining the paid-purchase and pending-pack
rejection assertions. The final 14-case suite covers normal/restored wins,
paid/free rerolls, rejected attempts, purchases, REDRAW, defeat, Full Unlock,
new-run isolation, Endless, legacy missing metadata/counts and invalid saved
counts. An adjacent ten-file batch passes **169/169 tests**, including snapshot,
validator, persistence, shop, Wind, stake mastery, bridge and reset cases.
TypeScript, scoped lint and diff checks pass. The preceding 3,231-test full
regression predates this correction; no newer full-suite or browser result is
claimed. No new art or UI changes were needed for this missing producer.

The speed-run mismatch is now confirmed rather than merely suspected:
`RoundManager.startAct()` always creates Small/Large/Boss rounds, progression
advances Acts sequentially, canonical victory requires the Act 8 Boss, and
the current public action loop has no Skip. A normal win therefore clears
24 rounds, which cannot meet the still-authored 12-round threshold. No target,
round count, or run length was silently changed to make the achievement pass;
this remains a balance/specification issue to resolve alongside the other
outstanding completion decisions. Release is still on hold.

### User-approved Challenge Runs deferral — October 21

The user answered the open scope question: **Defer Challenge Runs and their
achievements.** This supersedes the earlier unresolved Challenge-mode finding.
Rule Bender and Rule Breaker are removed from active definitions, leaving 31
awards. The regular-run wall-size and Purist feats retain their category.
Unlock/progress actions reject inactive IDs; totals and unseen queries use only
active definitions. Persisted historical entries, dormant translations and art
remain intact. The mechanics, rule-resolution and completion-scope docs now
explicitly mark the mode and two awards as deferred rather than release gates.

Five new tests cover the active catalog, version 2/3 hydration, gallery totals,
no deferred toast, preservation on subsequent persistence, ordinary award
notifications and direct attempts to unlock/progress deferred entries. The
initial two hydration failures exposed the shared no-op storage fixture; the
test now uses an in-memory read/write map. Final targeted verification passes
**146/146 tests in eight files**, including Purist, discovery, stakes, gallery,
toasts and all 13 achievement locales. The earlier full-suite/build/browser
results are not reruns of this change. No release action was taken; the separate
final-handoff hold remains in force.

### Achievement reward catalog reconciliation — October 21

The three advertised rewards that resolve to playable content now use catalog
identities in achievement definitions: Victory → `decree-blueprint`, Tile Master
→ `swift_hand`, Discard Artist → `wasteful_plenty`. Their cards read the existing
item-name translations rather than hard-coded English reward labels. This does
not change eligibility, grant items directly, or bypass the two upgraded
Charters' base-purchase prerequisites. Sixteen new tests verify catalog/unlock
identity and render all three names in every supported locale. Initial locale
test failures came from calling raw i18next before lazy-loading translations;
the fixture now uses the app's `changeLanguage` helper. The focused reward,
deferral and Decree-unlock batch passes 36 tests.

Eleven other reward promises still have no playable target: Stage Master,
Flower Pot, Satellite, Swift Andy, Lucky Sixes, The Idol, Stuntman, Cartomancer,
Astronomer, Crimson Wall and Obsidian Wall. These are not silently mapped to
unrelated current items. The user has been asked whether to retain the awards
but retire the obsolete reward promises for this release, or expand the catalog
to implement the missing content. This remains an open release-scope decision,
not a completed reward audit. Existing legacy unlock records are unchanged.

The consolidated local regression now passes **3,264/3,264 tests in 228 files**
with two workers and normal timeouts (201.36s), recorded in
`/private/tmp/tensho-achievement-reconciliation-regression.json`. This includes
Purist, Challenge deferral and the reward-name change; the smaller toast test
parameterization reflects the two deferred definitions. All 13 release workflow
fixture checks pass (24.92s); they use temporary local repositories, not the
project's real remote. TypeScript, scoped lint and diff checks pass.

Production output `/private/tmp/tensho-achievement-check.Lp0FXx` builds and passes
asset delivery checks: 782 verified precache entries, 39,306,028 cached bytes,
2,155,032 delivery-image bytes versus 37,485,091 original-image bytes. Existing
Browserslist-age and large-bundle warnings remain; existing React `act` warnings
also appeared in the unit suite. No warning was represented as a new failure or
fixed without investigation.

On that built output, **26/26 browser checks pass** (53.6s): every supported
locale at 320px in desktop and touch Chromium profiles. They verify all three
localized playable reward names without clipping, 0/31 on a fresh profile,
three regular-run Challenge-category cards and no deferred award cards, plus
the existing achievement-copy/layout assertions. Screenshots are under
`/private/tmp/tensho-achievement-rewards-browser`; the Russian touch capture was
visually inspected. The temporary preview server was stopped. These are local
production checks, not hosted-release or physical-device acceptance. No project
commit, merge, push or deployment was performed.

### Speed Run: replace the unreachable skipped-round condition

Under the user's delegated rules authority, Speed Run now requires a canonical
victory using at most 48 paid Turns. This replaces the impossible 12-round rule
in the 24-round no-Skip loop; rationale and exact semantics are recorded in
`RULE_RESOLUTION.md`. It does not shorten the run, reintroduce Skip or claim
completed balance testing. All 13 descriptions now explain the threshold and
free-REDRAW exclusion. The existing Speed Run artwork remains appropriate.

The engine emits `paidTurnSpent` at the actual debit for both complete/tactical
plays and non-free REDRAWs, before victory/defeat settlement. Optional `paidTurns`
run metadata persists across resume; absent legacy history remains unknown.
`fastestWinPaidTurns` is recorded only for proven victories outside Full Unlock,
and the retained legacy Swift Andy eligibility record uses the same metric.
Its absent reward content remains a separate scope question, not fixed by this.

Twenty dedicated cases cover the 47/48/49 boundary, all 24 sequential rounds
with real Turn debits, previews/rejections/free and paid REDRAWs, full Mahjong,
zero-scoring blocked plays, defeat, Full Unlock, old save metadata, invalid
counts, new-run isolation, Endless and legacy award preservation. The controlled
24-round fixture supplies known pairs, low targets and disabled boss rules:
it proves lifecycle/counting, not an organic winning strategy. Four additional
profile-hydration cases cover the new record and null/Infinity round trips.

Initial failures identified a wrong preview method in the fixture, a fixed-size
boss restriction not cleared with the effect system, and Full Unlock still
receiving the new progression record. The first two fixtures were corrected;
Full Unlock now omits that record from its win event. Two old tests still looked
up the retired round-count condition; they now verify legacy rounds do not
confer the new award, alongside the new paid-Turn hydration cases. The focused
12-file batch passes **225/225 tests** (3.83s), TypeScript and scoped lint pass.

Final local verification for this correction: **3,288/3,288 tests in 229 files**
with two workers and normal deadlines (135.07s); report
`/private/tmp/tensho-speed-run-regression.json`. Production build
`/private/tmp/tensho-speed-run-check.2auEVl` passes asset/offline-budget checks
(782 verified precache entries, 39,307,565 cached bytes). All **26/26** achievement
locale journeys pass on that built output at 320px with desktop/touch Chromium
(46.8s), now explicitly asserting the new Speed Run description. Outputs are
under `/private/tmp/tensho-speed-run-browser`. Existing bundle/Browserslist and
React `act` warnings remain. The temporary preview server was stopped; no
project commit, merge, push or deployment occurred. Reward-catalog and Charter
Collector decisions plus the final-handoff release hold remain open.

