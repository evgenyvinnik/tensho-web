# Implementation wrap-up

**Updated:** September 22, 2026

**Status:** In progress. This is an evidence ledger, not a claim that the whole project is finished.

The requested outcome is to finish the project implementation after the other agent's work, including new generated artwork. Preserve working gameplay and the established illustrated visual style. The 118 entries in [Gameplay experiments](GAMEPLAY_EXPERIMENTS.md) are a design reservoir, not 118 approved implementation requirements.

## Current Charter-progression checkpoint

Published follow-up: Plentiful Stock no longer unlocks from gold penalties. Typed
payment categories distinguish purchases/rerolls from losses while retaining
historic totals and unlocks. Its new generated scroll portrait appears in shop
and discovered Archive views; the imagegen skill guided transparent, text-free,
non-destructive integration. The specific image model identity is unavailable.
All **1,129/1,129 units in 102 files**, **16/16 desktop/touch browser checks**,
strict TypeScript, targeted lint and production/PWA build passed. Rental fees
remain a separate user question; explicit purchases/rerolls are currently counted.
Deployed as **v1.0.260923-4** after independent CI passed all units and the build.
The public manifest/tag, new portrait hash and hosted desktop/touch gameplay
checks match. Full Unlock profile controls and broader implementation remain open.

Published follow-up: canonical offer/purchase eligibility now checks the persistent
unlock, current-run base and non-ownership for every upgraded Charter. The
application supplies live progress without coupling pure engines to stores.
Liquidation retains a qualifying past run rather than demanding ten again after
acquiring its base. Returning players retain recorded past upgrade purchases,
without granting eligibility from Archive-only discovery. Final full regression
passed **1,120/1,120 in 101 files**, all **44/44 browser checks** passed, and
**10/10 final purchase/reload/legacy-hydration cases** passed. Strict TypeScript,
targeted lint and the production/PWA build passed. Deployed as **v1.0.260923-3**;
independent CI passed all 1,120 units and the build. The public manifest/tag and
fresh desktop/touch gameplay checks match. This checkpoint does not resolve the
separate mechanics choices or establish whole-project completion.

Preceding published follow-up: pack-use provenance now follows the acquired Seal/Orb instance
through successful consumption. Omen Lens/Observatory no longer count ordinary
purchases or generated copies toward their pack-specific prerequisites. Existing
unlocks are preserved. Eight desktop/touch English/Spanish browser flows passed;
all **1,097/1,097 units in 100 files**, strict TypeScript, targeted lint and the
production/PWA build passed. Deployed as **v1.0.260923-2** with matching public
manifest/tag and fresh desktop/touch gameplay checks.
An optional user question asks whether Observatory should multiply only its held
Orbs' matching Yaku or all hands; current scoring is unchanged pending a choice.

September 22: actual maximum-interest payouts now drive Money Tree's prerequisite,
including raised Charter/Omen caps and zero/blocked settlements. A separate
current streak resets on shortfalls, skips, defeats and new runs; lifetime best
and existing unlocks persist. Legacy saves do not invent a current streak.
Radiant Edge and Full Palette now observe settled build ownership/capacity, not
temporary intermediate effects. Money Tree has new generated shop/Archive art.
Combined full units passed **1,089/1,089 in 99 files**. Strict TypeScript, targeted
lint and thirteen release-workflow checks passed. Browser rerun: **9/10**, then
**3/3** unchanged repetitions of the startup-timeout scenario. The Pages-base
production/PWA build passed. Earlier interest-only evidence remains
in the linked ledger. The checkpoint is deployed as **v1.0.260923-1**, with a
matching public manifest/tag and hosted desktop/touch gameplay checks. This is
not a claim of complete Charter progression.
[Evidence and remaining audit](CHARTER_PROGRESSION_IMPLEMENTATION.md)
record the repaired upgrade gates and pack provenance, remaining spending/profile gaps,
and the Observatory rule conflict. An optional question asks whether Table Loop
should become the primary Play mode; no answer has been assumed.

## Published Omen effects and release checkpoint

September 22: live interest durations and Season locks remain inspectable after
their acquisition tags are consumed. Each deferred Rare+ offer shows its own
five-gold fee. Skips age prior round effects before earning new rewards, and
Season locks clear synchronously. All thirteen locales have the new messages.
Three engine regressions were reproduced before the fix. Focused tests passed
66/66; the final unchanged full suite passed **1,067/1,067 in 96 files** after an
initial six-timeout run. All **28/28 browser checks** passed, including real
Table Loop victory/defeat and Merchant swap/reload flows on desktop and mobile.
Strict TypeScript, targeted lint, selected formatting and all thirteen release
workflow checks passed. Spanish desktop/touch panels were visually reviewed.
[Omen effects evidence](OMEN_EFFECTS_IMPLEMENTATION.md) records exact coverage.
The local production build was interrupted under extreme host load after
TypeScript completed. Clean-runner tests, the production/PWA build and provenance
checks then passed, and the authorized merge deployed **v1.0.260922-1**.
The public manifest matches the remote tag and built commit. Hosted desktop and
320px touch checks passed actual Table Loop placement, retained actions after
reload, displayed version and Spanish Classic loading without page errors.
The feature branch is retained and fully contained in main. None of the separate
mechanics proposals is treated as approved by this publication; the overall
implementation goal remains in progress. [Release ledger](RELEASE_IMPLEMENTATION.md).

## Preceding Double Omen checkpoint

September 22: Double Omen is in both skip pools and banks visible copy instances.
Atomic acquisition preserves original/copied rewards and consumes each armed
Double once; instant payouts scale by actual acquisition count. Existing delayed
consumers deliver both rewards and retain their costs. The optional pending-Omen
disclosure and new item text cover all thirteen locales. A new built-in generated
jade-tag illustration is integrated into gameplay and discovered Archive views.
The image-generation skill guided style, transparency and non-destructive asset
integration; the tool's specific model identity is unavailable.

Initial tests reproduced **8 failures / 1 pass**. Full units now pass **1049/1049
in 95 files**. First browsers: **12/14**, with startup readiness and premature shop
inspection failures. Second browsers after waiting for shop-open and adding both
purchases: **12/14**, with two late test timeouts. Both timed-out scenarios passed
three unchanged isolated repetitions each (**6/6**); their timing causes remain
unproven. Spanish desktop/touch screenshots were reviewed. Strict TypeScript and
targeted lint passed. [Double Omen evidence](DOUBLE_OMEN_IMPLEMENTATION.md)
records exact scope, failures, seeded catalog shifts and artwork prompt/hash.

The Pages-base production/PWA build passed: 342 modules, entry
`index-Bmd6daKf.js`, 268 precache entries / 63,921.39 KiB. The image adds about
1.2 MiB to the offline bundle; existing large-chunk/Browserslist warnings remain.

The workspace was clean at the start on `table-loop-prototype`, commit `bae2f71`.
No Git publication was performed in this checkpoint. The overall goal remains
active; the separate mechanics proposals have not been treated as approval.

## Preceding beginner-guidance checkpoint

September 19: forecast explanations distinguish all-grouped, mixed, all-loose and
complete selections using metadata from the actual scored parse, including Honor
Transmutation and suppressed tile values. Loose penalties explicitly refer to
base tile points. Hidden selections reveal neither grouping nor forecast.
Localized selection/declaration headings take priority over idle coach advice;
matched-pattern headings no longer repeat the body’s shape bonus. No new popup,
timer or artwork is needed for this live numerical explanation.

Initial metadata tests failed **8/8**; the first expanded focused run passed
**62/63**, with its accessibility-label query subsequently corrected. Before
the heading cleanup, full units passed **1009/1009**, and browser checks passed
**16/16**. Final full units passed **1022/1022 in 93 files**. The final browser
set retained **15 passes / 1 short-phone timeout**; all four new guidance and
four secondary-scoring journeys passed. Three unchanged isolated repetitions of
the timeout scenario passed **3/3**, without retries or deadline changes. Its
cause remains unproven. Spanish desktop/touch screenshots were reviewed.
Strict TypeScript, targeted lint, formatting and the Pages-base production build
passed: 340 modules, entry `index-BTk8H3sQ.js`, 266 precache entries / 62,689.90 KiB.
Existing large-chunk and stale Browserslist warnings remain.
[Guidance evidence](BEGINNER_GUIDE_IMPLEMENTATION.md) records exact boundaries
and artifacts. This is not proof of newcomer comprehension or whole-project fun.

The requested mechanics recommendations were presented as proposals, not approval.
At this checkpoint Double Omen was the next confirmed gap: it was absent from the
obtainable catalog, and an isolated `copyNextTag()` → `addTag('omen_of_rivers')`
probe leaves one active/queued tag while spending the copy flag. Source inspection
shows the second store update overwrites the duplicate using the old state.
Connecting acquisition and immediate/delayed reward delivery still requires
implementation and tests; the subsequent checkpoint above supplies that repair. Existing generated art is
preserved; nothing is committed, merged, pushed or deployed.

## Preceding score-localization checkpoint

September 19: forecast and settled multipliers now share localized decimal/compact
formatting, with exact-value inspection preserved. Remaining-point hints format
their numbers in all thirteen languages, and score progress uses localized labels
and valid numeric bounds. Sixteen failures were reproduced before the correction;
the expanded full suite passed **985/985 in 90 files**. The first browser set
retained **12 passes / 8 new fixture-assertion failures**; the corrected layout
set passed **8/8** without retries or timeout changes. Spanish screenshots were
reviewed. Strict TypeScript, targeted lint and the Pages-base build passed.
[HUD evidence](FORECAST_UI_IMPLEMENTATION.md) preserves the failure
and exact acquisition/geometry boundaries.

The random-copy audit confirms that Doppelganger chooses by position, not seeded
randomness; the docs do not specify target-refresh timing. A once-per-round versus
acquisition-time choice was requested and is not assumed. Screenshot review also
found that valid tactical groups can receive the misleading loose-tile penalty
hint. That clarity issue is addressed by the guidance checkpoint above while the
copying choice remains pending. Existing generated art is preserved; nothing is published and
the overall objective remains active.

## Preceding Decree copy-rule checkpoint

September 19: main scoring preserves physical copy targets, so suppression does
not cause Blueprint or Brainstorm to skip to another power. Brainstorm in the
leftmost slot cannot copy its right-hand neighbor. Resource copies now include
positive and negative rack, discard and extra-hand changes, closing the exploit
where Ancient Scroll/Sacrifice benefits were copied without their costs.

The initial integration run reproduced **16 failures / 3 passes**. The focused
set then passed **89/89**, the full suite **964/964 in 89 files**, and all
**20/20 desktop/touch browser checks** passed. Paid controlled-offer journeys
verify next-round resources and settled scoring in English and Spanish. Reviewed
screenshots preserve the existing illustrated UI; no new bitmap was needed.
Strict TypeScript, targeted lint and the Pages-base production build passed.
[Copy evidence](DECREE_COPY_IMPLEMENTATION.md) records boundaries and remaining
random-copy/resource-lifecycle questions. Nothing is committed, merged, pushed
or deployed. The full project objective remains active.

## Preceding secondary Decree scoring checkpoint

September 19: Frostbite now scales the extra Yaku multiplier supplied by Decrees,
preserving native Yaku, Mandate tier reductions and table bonuses. Disabled Yaku,
retrigger and amplifier effects are excluded from preview and payment. Secondary
copy resolution respects physical neighbors, including copied Echo Dimension.

Ten integration failures were reproduced before the fix. The final full unit
suite passed **945/945 in 88 files**; all **18/18 desktop/touch browser checks**
passed with no retries or deadline changes. Spanish score/disabled-inspector
screenshots were reviewed. Strict TypeScript, targeted lint and the Pages-base
build passed. [Secondary scoring evidence](SECONDARY_SCORING_IMPLEMENTATION.md)
records the remaining fractional-retrigger choice and the ordinary copy-order
audit subsequently addressed above.
Existing generated art remains; no new bitmap was required. Nothing is committed,
merged, pushed or deployed, and the full project objective remains active.

## Preceding Decree economy and artwork checkpoint

September 19: Wealth Engine now counts owned Decrees instead of paying a flat 1G.
Gold copying and copied multipliers resolve physical neighbors without skipping
suppressed targets; duplicate Blueprint instances use their own positions. The
new generated Wealth Engine portrait is connected to Shop, owned inventory,
Archive and detail views, while hidden identity still uses generic art. Spanish
wording now uses unambiguous G currency alongside the existing localized name.

The full suite passed **928/928** before the final wording/new-test follow-up,
which passed **31/31 targeted checks**. The browser set passed **20/20**; four
final wording journeys passed **4/4** against a clean server after a traced
hot-reload module-identity problem. [Economy/art evidence](DECREE_ECONOMY_IMPLEMENTATION.md)
records original fixture failures, exact prompt, reviewed screenshots and model-ID
limitations. Treasure Hunter timing, further effect semantics, human fun testing,
main/default promotion and deployment remain open. No Git publication occurred.
Strict TypeScript, targeted lint and the Pages-base build passed. The new original
PNG adds about 2.5 MiB to the offline bundle; performance remains an open concern.

## Preceding Frostbite gold checkpoint

September 19: shared gold settlement now weakens only Decree contributions,
combines fractions before integer rounding, excludes disabled Decrees and applies
the reward multiplier consistently to tile, consumable, discard and round paths.
Prices and penalties are unchanged. Cash-out labels explain fractional adjustment
in all thirteen locales; existing illustrated gold and Decree assets are retained.

The full suite finished **912 passed / 2 balance-command timeouts**. The unchanged
22-case command file then passed. All **24/24 desktop/touch browser checks** passed,
including real purchases after payout, score regressions and the user-approved
Merchant rack-for-river swap with reload. Spanish receipt screenshots were reviewed.
Strict TypeScript, targeted lint and the Pages-base production build passed.
[Gold settlement evidence](FROSTBITE_GOLD_IMPLEMENTATION.md) preserves the initial
failures, artifact paths and unresolved special gold scaling/copying, retrigger,
Yaku and binary-effect scope. No commit, merge, push or deployment occurred.

## Preceding Frostbite scoring checkpoint

September 19: Frostbite now halves Decree flat-point bonuses as well as its
main multiplier contribution, without halving tile bonuses. Repeated Frostbites
stack; fractional subtotals survive final counter presentation. The inspector
copy is updated in all 13 locales. No new artwork was needed for the rule;
existing illustrated tiles/Decrees and the new guidebook are preserved.

Six engine failures and three stacking/counter failures were reproduced before
their fixes. The additive correction passed **892/892 full units in 84 files**
(309.78 seconds); the final stacking/counter changes then passed **121/121 targeted
checks** in eight files (57.64 seconds). The broader browser subset finished
**21 passed / 1 existing normal-animation timeout** (318.05 seconds). The unchanged
timed-out journey and final visible-rule/payout checks subsequently passed **6/6**
(64.40 seconds), with no retry or deadline changes. This does not erase the
original timeout; its cause remains unproven. Spanish mobile screenshots were
reviewed. Strict TypeScript, targeted lint/formatting and the Pages-base build passed.

[Frostbite evidence](FROSTBITE_IMPLEMENTATION.md) records exact coverage and the
still-open gold, retrigger, Yaku and non-numeric effect semantics. The original
all-effects requirement is not reduced to these two scoring channels. The owned
server is stopped. No commit, merge, push or deployment occurred; project
completion, the other mechanics/UX gaps and main/default promotion remain open.

## Preceding illustrated-guide checkpoint

September 19: the visual primer's obsolete 10/20/30/50 bonuses now read the
engine's 15/30/40/65 table directly. New explanations distinguish shape bonuses
from the actual forecast in all 13 locales. Tile examples stack on phones,
family names wrap, and the dialog has one scroll area. A new generated jade/ivory
guidebook marks the explicit learning control and primer; the real tile examples
remain. The original project-owned PNG and exact built-in prompt are recorded
in [guide evidence](BEGINNER_GUIDE_IMPLEMENTATION.md), including the unavailable
model-ID limitation.

**885/885 full units in 83 files** and **26/26 targeted browser checks** passed,
along with strict TypeScript, targeted lint/formatting and the Pages-base build.
Browser checks include five guide layouts/languages in desktop and touch contexts,
plus playable hints, Shop actions and paid-score regressions. No retry or timeout
increase was used. Screenshots were reviewed. The owned server is stopped; no
commit, merge, push or deployment occurred. Other mechanics, human fun, remaining
localization and main/default promotion remain open.

## Preceding in-flow tutorial checkpoint

September 19: Classic Play and Shop hints now sit in their own layout space,
collapse through native disclosure and remain readable without a countdown.
First-move/scoring lessons precede bonus tips; a completed first move cannot
produce a late introductory hint. Focus, opt-out, queue persistence and localized
copy updates are covered. Shorter first instructions keep the visual primer
nearby, and all existing artwork remains. The expanded regression run also
found and fixed animated string interpolation dropping multiplier decimal zeros.

**879/879 full units in 83 files** passed (36.21 seconds). **26/26 targeted browser
checks** passed (81.39 seconds), including playing with hints open, Shop purchases
and continuation, the existing visual primer/reset, and score regressions. The
final malformed-history preference safeguard was added afterward and is covered
by final units/build, not another browser run. Strict TypeScript, targeted lint,
formatting and the Pages-base build passed. [Tutorial evidence](TUTORIAL_CARD_IMPLEMENTATION.md)
records the failed ordering/shop/format checks, fixtures and reviewed screenshots.

The owned server is stopped. No commit, merge, push or deployment occurred.
Secondary hint localization, human newcomer testing, physical-device review,
broader mechanics/progression and main/default promotion remain open.

## Preceding settled-score checkpoint

September 19: the Classic equation now displays the engine's settled last play,
not an already-paid score multiplied again by later Yaku reveals. The reproduced
585/1,521 mismatch is fixed. Atomic receipts preserve exact bonuses, penalties,
zero-paid plays and independent consecutive hands. A native disclosure exposes
the full equation; new labels are supplied in all 13 locales.

**869/869 full units in 83 files** passed (32.27 seconds). **14/14 targeted
browser checks** passed (55.6 seconds), followed by **6/6 final scoring journeys**
with tutorial opt-out and unobscured-result checks (42.8 seconds). Screenshot
review exposed a delayed first-move tip covering the animated mobile result;
the final score fixture dismisses it through the real control, but the tutorial's
general placement still needs work. Strict TypeScript, targeted ESLint, formatting
and the Pages-base production build passed. See [settlement evidence](SCORE_SETTLEMENT_IMPLEMENTATION.md)
for coverage, failures, artifacts and limits. Existing generated art is preserved.

The owned test server is stopped. No commit, merge, push or deployment occurred.
Broader mechanics, localization, newcomer enjoyment, physical-device review and
main/default promotion remain open; this is not project completion.

## Preceding responsive score UI checkpoint

September 12: forecast and score-panel numbers no longer compete for a single
row or get clipped by a fixed short-screen height. Large values use localized
compact notation, with native touch/keyboard disclosure of exact figures.
Mobile reuses translated action labels, and score counters/popups respect both
app and system reduced motion. Existing colors and generated artwork remain.

**861/861 full units in 81 files** passed (446.59 seconds). **24/24 targeted
gameplay/browser checks** passed (187.20 seconds), followed by **8/8 final layout
checks** after word-wrapping/font refinements and disclosure cleanup (34.30
seconds). Both browser runs used one worker, original timeouts and no retries.
The final Spanish mobile forecast and paid-score images were reviewed. Strict
TypeScript, the Pages-base build and targeted ESLint passed; existing bundle-size
and Browserslist warnings remain. Final build: 336 modules, entry
`index-CvPgTPq9.js`, 264 precache entries / 58,599.42 KiB.

[Score UI evidence](FORECAST_UI_IMPLEMENTATION.md) records the initial loading
timeout, corrected frozen-object fixture, reproduced overflow, screenshot-led
scope expansion, failed discard drag, static-popup completion correction and
final verification boundaries. No earlier failed run is relabeled green.
The full repository browser/release/production suites were not rerun here.

The owned test server is stopped. No commit, merge, push or deployment occurred.
The separate hand/Yaku equation audit was open at this historical checkpoint;
the September 19 settlement section above records its fix and verification.
Broader mechanics, localization, human-fun and real-device checks and
main/default promotion remain open.

## Current Chrysanthemum/Winter checkpoint

Historical checkpoint, superseded by the score-UI verification above.

September 12: the explicit concealed-hand Flower/Winter interaction now reaches
authoritative preview and committed scoring. Every normal Winter factor is
omitted when Chrysanthemum is active; effective Drought suppression and protective
Decrees are shared with Flower scoring. Other Season effects and round cleanup
are preserved. No new popup or generated bitmap is needed for this rule.

The full units finished **843 passed / 1 timed out in 79 files** (648.14 seconds).
The unchanged beginner-guide test and eleven Winter cases then passed **12/12**
(19.00 seconds), with no timeout adjustment. The initial browser subset finished
**29 passed / 5 failed**: four new exact-text expectations omitted the existing
forecast plus sign, and one existing mobile Spanish dialog test timed out.
All sixteen interaction and four Merchant purchase/swap/reload cases passed.
After correcting only the new expected text, the Flora file finished **13 passed /
1 timed out** (148.65 seconds), including all four new Winter gameplay cases.
The repeated mobile dialog timeout occurred at screenshot capture after its
three-viewport geometry checks; its cause remains unproven. Neither failed run
is relabeled green. [Winter evidence](WINTER_FLOWER_IMPLEMENTATION.md) records
fixtures, exact coverage and retained artifacts.

Strict TypeScript and the Pages-base build passed (334 modules, 264 precache
entries / 58,596.19 KiB). Existing large-chunk/Browserslist warnings remain.
Spanish desktop/mobile screenshots were reviewed; the billion-point fixture
exposes cramped compact-forecast text and a remaining English PLAY label.
The owned test server is stopped. No commit, merge, push or deployment occurred.
Remaining mechanics, main/default promotion, human playtesting, localization,
real-device accessibility and deployed upgrades are still open.

## Current on-demand screen checkpoint

Historical checkpoint, superseded by the Winter verification above.

September 12: all nine screens now load on demand, with a localized, motion-safe
fallback that keeps URL-language synchronization mounted during downloads. The
English menu requests 1,055,338 bytes of JavaScript; direct Table Loop requests
870,918, versus the preceding 1,389,080-byte entry/registration pair. These are
24.0% / 37.3% code-size reductions, not measured loading-time improvements.

**833/833 full units in 78 files** passed (145.03 seconds). The full browser run
finished **233 passed / 1 timed out / 10 skipped** (23.6 minutes), without retries.
All 117 mobile cases passed. The desktop 320×568 rack interaction hit its original
60-second timeout after successfully staging all tiles. With no source or test
changes, a follow-up passed **4/4** repeated desktop/mobile cases (47.2 seconds),
with traces and no retries. Its cause remains unproven; the full run is not
retroactively green. [The evidence record](ROUTE_LOADING_IMPLEMENTATION.md)
contains the trace findings, actual timings and retained artifacts.

The ten production-only skips passed separately alongside the public guides:
**18/18 production checks** (27.3 seconds), including actual offline loading of
unvisited routes/scrolls/guides and recovery from a failed module download without
losing a real saved run. Four additional browser measurements recorded requested
script bytes. The final mobile Spanish loading screenshot was visually reviewed.

Strict TypeScript and the Pages-base build passed: 334 modules, entry
`index-BLLkton_.js` (750.79 kB / 227.30 kB gzip), **264 precache entries /
58,596.00 KiB**. All artwork and offline content remain included. The large
entry, approximately 57 MiB offline install and stale Browserslist warning remain.
Targeted ESLint passed with zero errors / six existing router export warnings;
repository-wide lint was not rerun. **13/13 local release-workflow checks** also
passed (136.69 seconds) in temporary fixture repositories, without touching this
repository's history or GitHub.

No commit, merge, push, deployment or Search Console action occurred. Main/default
promotion awaits the user. Remaining mechanics/rule conflicts, human-fun checks,
translations, multi-tab saves, real-device/Safari testing and live worker upgrades
are still open. This pass preserves the generated art rather than generating a
new bitmap for a loading indicator better expressed in CSS.

## Current Merchant and Table Loop release-preparation checkpoint

Historical checkpoint, superseded by the on-demand screen verification above.

September 12: **830/830 full unit tests across 77 files** passed with one thread
worker (81.83 seconds), using the original test timeouts. **70/70 targeted browser
checks** passed without retries (2.7 minutes): the entire Table Loop browser file,
UI-only victory/defeat journeys, English/Spanish Merchant swaps, tile-detail
accessibility and third-Flower collection, in desktop and mobile Chromium.

The final Pages-base production build also passed **8/8 public-guide checks**
without retries (18.1 seconds), including no-JavaScript pages, metadata/images,
320/768/1440 layouts, enlarged root text, keyboard focus and menu-to-practice
navigation. These are targeted browser suites, not the full repository suite.

Strict TypeScript and the Pages-base build passed: 333 modules, **236 precache
entries / 58,587.01 KiB**, JavaScript `index-DuPsMlZD.js` at 1,383.32 kB
(393.24 kB gzip). TypeScript was rerun after adding the final component test.
Targeted ESLint passed. Large-chunk and stale Browserslist warnings remain;
no performance score or deployed PWA upgrade claim is made.

The approved Merchant rule exchanges one selected rack tile for a river tile
once per round without spending actions, redraws or gold. Version-1 saves retain
their original recovery replay; successful subsequent saves use version 2.
Rejected actions preserve pending offers. All ten Decrees now have their own
scroll illustrations. Screenshot review also led to a touch-tooltip fix; the
final Spanish mobile trade panel and Jade Ledger popup were visually reviewed.

[Release preparation](TABLE_LOOP_RELEASE.md) records implementation details and
earlier failures/cancelled runs without relabeling them as passes. Artifacts:
`/tmp/tensho-merchant-KYR4lj/table-loop-final/` and
`/tmp/tensho-merchant-KYR4lj/production-guides/`.

No commit, merge, push, deployment or Search Console action was performed.
Default-mode/main promotion awaits the user's decision. Broader Classic rule
gaps, multi-tab saves, human playtesting, guide translations, physical-device
accessibility, performance and deployed upgrades remain open.

## Current Summer and public-guide accessibility checkpoint

Historical checkpoint, superseded by the Merchant totals above.

September 12: **790/790 full unit tests across 72 files** passed with one thread
worker (55.79 seconds), followed by strict TypeScript and a Pages-base production
build. Final build: 331 modules, **234 precache entries / 53,876.19 KiB**. Large
JavaScript chunk and stale Browserslist warnings remain; no performance score is
claimed.

Final targeted ESLint for the changed mechanics, artwork renderer, public-site
sources and browser specs, plus `git diff --check`, passed with no output.

**24/24** targeted gameplay/art browser checks passed (31.7 seconds) and **8/8**
production guide checks passed (19.9 seconds), both without retries. Public-guide
coverage includes no JavaScript, direct HTTP/metadata/assets, 320/768/1440 layouts,
200% root-text enlargement at 320px, visible keyboard skip link, actual main
focus and the following practice link. It is not native browser zoom or physical
device/screen-reader coverage. Final desktop About and mobile Summer inspector
screenshots were visually reviewed.

[Summer implementation](SUMMER_IMPLEMENTATION.md) closes the normal wall-cost
path with physical reserves and matching dry runs, not its undefined Bamboo
exception. Twin Flame is now the eighth individual Table Loop scroll; the
[artwork record](TABLE_LOOP_ART.md#twin-flame) includes its prompt/provenance.
[SEO strategy](SEO_STRATEGY.md) records the new accessibility fixes and all failed
attempts. Artifacts: `/tmp/tensho-summer-seo-jgY1pJ/` (`gameplay-final` and
`public-guides-verified` are the passing runs).

Remaining scope is unchanged: undefined/incomplete Season and Flower mechanics,
Fate/Negative rule conflicts, broader integration and human-fun validation,
guide translations, performance work, and authorized live deployment/PWA upgrade
verification. No commit, push, deployment or Search Console action was performed.

## Current Monsoon and public-guide checkpoint

Historical checkpoint, superseded by the Summer/accessibility checkpoint above.

September 12: **778/778 full unit tests across 71 files**, strict TypeScript,
Pages-base production/PWA build, targeted ESLint and whitespace checks passed.
The one-worker thread-pool unit run took 310.45 seconds.

Two separate browser runs passed without retries: **20/20** targeted gameplay/art
checks on the dev/test server, and **8/8** public-guide checks on the current
production preview at `/tensho-web/` with their original timeout. These are not
a complete browser-suite run or proof of a live Pages/PWA update. The earlier
production-navigation timeouts remain in the [SEO record](SEO_STRATEGY.md);
their root cause is not established by the fresh passing run.

[Monsoon implementation](MONSOON_IMPLEMENTATION.md) describes the real draw paths,
non-mutating RNG previews and restored Omen-lock correction. Spring/Summer/Autumn/
Winter rule gaps, full Frostbite behavior, the three-Flower unlock and advanced
Flower–Season combinations remain. Changes have not been committed, pushed or
deployed in this pass. Older checkpoint counts below remain historical.

## Completed in this pass

- Connected Monsoon to real live-wall and bonus-replacement draws, with exact forked-RNG redraw preflight that preserves live streams, rewards and Omen locks. Fixed the restored-lock preview/consumption disagreement and added localized active-rule text in all 13 locales. [Monsoon implementation](MONSOON_IMPLEMENTATION.md) records the scoped mechanics, regression evidence and remaining Season/Flower requirements.
- Completed the first English public-guide slice: static About, how-to-play and FAQ pages, menu links, generated sitemap and a documented [SEO strategy](SEO_STRATEGY.md). Integrated an About illustration plus Honor Court/Wide Rack scrolls; [prompts and provenance](PUBLIC_SITE_ART.md) are recorded. Initial production checks were **not uniformly green**: six no-JavaScript checks passed, while desktop navigation timed out in the first batch and one longer-budget repeat. A later current-build run passed 8/8 with the original timeout. The SEO record preserves all attempts and the remaining performance, accessibility and deployment checks; no gameplay completion or ranking claim follows from this slice.
- Connected the localized full-stack Flora inspector to authoritative scoring state, wired actual discards to Decay, and fixed Eternal Garden's secondary protection rule. Reproduced and fixed tile-origin compatibility clicks opening the Flora modal, invisible first-render reduced-motion Popups, and scroll artwork overlapping long dialog content. [Flora implementation](FLORA_IMPLEMENTATION.md) records the corrected paths and the still-unimplemented Season/Flower powers.
- Corrected round-boundary Season leakage, Omen-locked draws replacing the existing stack, and Boss skip availability disagreeing with execution. Eight seeded acquisition cases use real skips; four desktop/mobile checks exercise actual Skip, Redraw, Rare+ shop delivery, and once-only fees. [Omen lifecycle](OMEN_LIFECYCLE.md) distinguishes controlled draw/win fixtures from organic acquisition and preserves the full-suite failure history.
- Integrated the fifth individual Table Loop scroll, Gap Bridge, into shared shop/inventory artwork. The generated 1254×1254 transparent PNG is preserved unchanged; [the art manifest](TABLE_LOOP_ART.md#gap-bridge) records the exact prompt, source, and model-version limitation. Other five Decrees still use the established generic illustration.
- Reproduced and fixed invisible first-render pack rewards under reduced motion, pack hover/press/shimmer ignoring the preference, and live preference changes clearing selected rewards. Selection state is now independent of animation setup. [Pack motion notes](SHOP_IMPLEMENTATION.md#pack-motion-follow-up) record preserved purchase, affordability, and claim semantics.
- Preserved the Decree Omen's Rare+ requirement through generation and upward fallback, deferred impossible guarantees without their shop-entry gold fee, and fulfilled stacked item/pack/edition guarantees without overwriting one another. Overflow rewards are visit-scoped, not permanent Charter slots. Ten engine cases and a real desktop/mobile purchase/reroll/route-revisit scenario cover the change. [Shop Omen notes](SHOP_IMPLEMENTATION.md#shop-omen-guarantee-follow-up) distinguish this from unimplemented legacy catalog entries and unresolved edition wording.
- Corrected Tile Pack reward descriptions to derive from the actual modifiers, removing the stale +10 Bonus and on-scored +2 Gold promises. Shared localized reward text names rank/suit and all modifier layers; pack cards show full rules and item-neutral rarities. Two seeded generation/scoring regressions and three component cases accompany a real Spanish phone claim in both browser configurations. No scoring constants, costs, generation probabilities, or Negative Tile rules changed; [Shop implementation](SHOP_IMPLEMENTATION.md#tile-pack-rule-and-identity-follow-up) records the still-open Negative rules conflict and runtime probe.
- Replaced generic shop Seal/Orb labels with the actual offered item's localized identity, rule, and rarity. Purchase controls name the item and price, expose the rule, and cannot bypass disabled affordability by clicking the card. Added 17 shop interface keys in all 13 locales, wrapping headings/full descriptions, a responsive gold/header layout, and explicit localized Charter confirmation. Charter, item-card, and header motion honors the app/system preference; PackCard motion is addressed in the follow-up above.
- Integrated the new blue/gold Imperial Charter illustration with responsive base/upgraded cards. [The artwork manifest](CHARTER_ART.md) records the original, exact prompt, built-in generation mode, and unavailable model ID. The asset is shared category artwork, not unique artwork for every Charter. Browser screenshots and native image decoding cover 320- and 640-pixel layouts; purchase cancellation and once-only payment/ownership use the real shop path.
- Localized the cash-out receipt in all 13 languages, reconciled its breakdown with settled multiplier bonuses, and made large totals readable in a stacked small-screen layout. Receipt testing also exposed and fixed OS-reduced-motion shake overflow and a render-to-subscription gap that could leave the shop stale. The final browser run passed all 178 checks without retries; [Shop implementation](SHOP_IMPLEMENTATION.md) and [animation continuity](RUN_RESULTS_IMPLEMENTATION.md) record fixtures, screenshots, deterministic regression evidence, and the retained failure history. No scoring or payout constants changed.
- Corrected Strength and Ouija retaining red-five status after physical rank changes. Their shared helper preserves IDs and all modifiers without manufacturing red fives; Ouija retains both its random rank and once-only hand-size penalty. Twelve reproduced failures now pass within fourteen engine cases, three new helper cases, and all 28 desktop/mobile consumable flows. [The rank-conversion follow-up](CONSUMABLE_IMPLEMENTATION.md#physical-rank-conversion-follow-up) records the rule and precise verification scope.
- Corrected Unity's nonexistent Wind ranks 5–9 using a deterministic cyclic mapping that preserves prior valid ranks 1–4. The dialog derives a four-image public guide from the same helper, with all-locale rule text and no hidden-target inspection. Eleven engine tests, four helper tests, policy/locale regressions, and both small-phone browser flows verify the change. [Consumable implementation](CONSUMABLE_IMPLEMENTATION.md#unity-honor-conversion-follow-up) records the rule completion, preserved modifiers, screenshots, and the separately reproduced rank-change defect. September 9 balance artifacts remain historical pre-fix snapshots.
- Added an opt-in conservative consumable policy to the Classic simulator, with real actions, visible-only target selection, score-plan refresh after use, and per-item use/final-hold reporting. [The 400-row comparison](CLASSIC_CONSUMABLE_BALANCE.md) uses 1,090 items, raises mean rounds from 5.49 to 5.725, and still triggers no complete hands or Yaku. Its limited Script cost model and unchanged cheapest-first shopping are explicit; no live balance constants were tuned from this evidence.
- Corrected the Fool to record only successfully used Fate Seals/Orbs, ignoring intervening Scripts, and added a localized preview of the item it will create. Both the authoritative engine and legacy store agree. Eight unit cases and four English/Spanish desktop/mobile checks cover history, cancellation, fresh instances, no implicit Orb upgrade, round/new-run boundaries, and retained allowance-limited self-copy. [Consumable implementation](CONSUMABLE_IMPLEMENTATION.md) records the semantics and four regressions reproduced before the fix.
- Added public-information consumable preflight shared by the engine and dialog: capped upgrades, ineffective visible rank/suit targets, missing reward slots/Decrees/history, and zero-gold effects are rejected before confirmation. Six feedback keys are supplied in all 13 locales. Hidden identity and chance outcomes remain unresolved until use; failures preserve items, allowances, RNG, penalties, and protection. Twenty-one engine checks and six additional desktop/mobile checks cover this pass; see [Consumable implementation](CONSUMABLE_IMPLEMENTATION.md). Fool history eligibility is corrected in the follow-up above; the existing Seal-lifetime conflict remains open.
- Added read-only resource-aware and one-away Classic balance policies with explicit table/Stake/seed controls, structured per-run results, and actual legal exchanges/discards. The paired 200-seed comparison raises median Act reach from 1 to 2; full-hand patterns remain rare. [The balance audit](CLASSIC_BALANCE_AUDIT.md) includes stored results, limitations, and the still-missing consumable/synergy policy. This pass does not alter live rules or coaching.
- Corrected Classic redraws to return physical tiles to the seeded wall after replacements, without discard income or immediate self-replacement. Shared validation rejects locked/duplicate targets and unresolvable bonus chains; the button uses authoritative legality. Purple Seal rewards now apply on redraw subject to capacity, with all-locale descriptions. [Resource cycling](RESOURCE_CYCLING_IMPLEMENTATION.md) records the rules and engine/browser evidence.
- Generated three individual starter Decree illustrations: Echoing Bamboo, Patient Pair, and Watch Fire. Originals are stored under `public/assets/illustrations/table-loop/`. [The artwork manifest](TABLE_LOOP_ART.md) records the actual prompts, reference, execution mode, paths, and the limitation that the built-in tool exposes no model ID.
- Integrated those images into opening choices, shop cards, and a new owned-scroll inventory. Localized details open on hover, keyboard focus, or tap; Escape, the close control, and outside taps dismiss them. Non-starter Decrees retain the existing generic scroll, with distinct localized names and rules.
- Added versioned, action-journal persistence for Table Loop. Successful actions are replayed through the authoritative engine; raw stored scores and Tile-shaped objects are never trusted. Physical tile references use collection indices because runtime IDs change between sessions.
- Added recovery coverage for regular and draft-enabled runs, practice progress, shops, purchases, pending draft choices, transient selection exclusion, rejected actions, invalid saves, and storage failures.
- Added localized save-error notices in all 13 locales. Invalid saves are not erased simply by reading them; beginning a replacement run writes a new journal. Rules changes must bump `TABLE_SAVE_VERSION` when old journals are no longer reproducible.
- Made seed/variant URLs resume a matching saved run. An explicitly different seed or variant starts a new one. Switching from practice to ordinary play clears the practice URL so a reload does not put the player back into practice.
- Added a main-menu action during Table Loop play; returning to the mode preserves the run.
- Removed forced viewport height from phase panels. Short screens can scroll to all actions. Mobile table slots use two meld columns and a full-width pair slot; larger screens retain a five-slot row.
- Fixed heading defaults that were outside Tailwind's base layer and overrode responsive dialog typography. The opening heading now respects its requested size and color.
- Connected all eight Classic table styles to authoritative rules and active-run visuals, including slots, starter rewards, Flower weighting/exclusion, score modifiers, shop discounts, corruption, and target scaling.
- Connected earned tables to selection and corrected victory-time Decree ownership, distinct-Flower collection, and same-run corrupted-Season survival. The Archive now uses the playable table catalog while retaining retired records outside active completion totals.
- Added localized themes, numeric modifiers, and unlock conditions in all 13 locales. [Table rules](TABLE_STYLE_RULES.md) records precise semantics and test coverage.
- Added 55 reproducible original synthesized sound cues, connected app-lifetime music/SFX to settings and live gameplay, and implemented Table Loop feedback keyed to actual resolution intensity. Mute, crossfades, blocked playback, visibility, and silent save replay have regression coverage. [Audio implementation](AUDIO_IMPLEMENTATION.md) records provenance and verification limits.
- Fixed the music notification's off-screen slide, which could widen the page; it now ignores pointer input and honors reduced motion. Added WAV assets to the production offline precache.
- Replaced the Classic shop's split store/payment/grant flow with a run-owned `ShopSession` shared by the UI and balance simulator. Purchases and rerolls validate before payment; combined pack rewards validate before any grant. Pending paid choices survive route revisits, block round advancement, and settle only once. New runs reset the shop and its Charter state.
- Added explicit localized pack skipping, keyboard selection/focus containment, reduced-motion support, and a fixed selection/error footer with equal-width actions. Visual review caught and corrected a clipped Spanish confirmation button at 320×568. [Shop implementation](SHOP_IMPLEMENTATION.md) records the rules, scope, and measured progression limitations.
- Corrected the simulator's no-op `--shop` option and withdrew the unsupported old median-Act-5 claim. Actual cheapest-first purchases now run through the live acquisition path, and invalid-action/no-advice stops are reported separately from losses.
- Unified committed-play, availability, and forecast legality, including boss size restrictions, locked physical tiles, duplicate IDs, and complete-hand requirements. Forecasts now include next-hand Omens without consuming them; commitment pays and consumes those effects once.
- Made the coach include required visible tiles and added an identity-only blind-play fallback to the simulator. Both 200-seed samples now reach genuine losses without invalid-action/no-advice stops. Cheapest-first shopping executes 1,301 purchases and 388 pack claims, reaching maximum Act 7; it is still not a resource-aware policy or a human difficulty estimate.
- Replaced the Classic overlapping rack/staging fan with whole-tile rows and 44-pixel minimum targets. Moved discard, Flora, and wall controls out of tile/instruction hit areas; short screens scroll inside the frame with a pinned action bar. Native touch testing exposed and corrected double-staging from synthesized mouse events. Pointer capture, cancellation, rendered-zone drag testing, keyboard/semantic activation, and concealed labels now have coverage.
- Bounded tile-detail portals to the viewport, removed font-baseline dependence from Table Loop rack hit boxes, and required actual pointer movement for passive hover details. Escape keeps keyboard-owned details dismissed. Guarded synchronous native SFX setter failures so optional sound cannot interrupt selection. [Play validation and interactions](PLAY_VALIDATION.md) records the findings and scope.

## Verification evidence

### Current Flora, dialog, and touch checkpoint

- Full units: **748/748 in 69 files**, one worker, 218.74 seconds, using `bun run test:run --maxWorkers=1`. Includes four real Season/discard/protection checks, four Flora component cases, seven Popup cases, 21 PlaySurface cases, and 20 locale-integrity checks. A new touch-origin default-cancellation test first failed before the native listener fix. Earlier focused regressions exposed missing Decay updates, secondary-effect protection, and reduced-motion first-render visibility before source corrections.
- Full browser run: **201/202**, 20.3 minutes, without retries, using `npx playwright test --reporter=list --workers=1 --trace=retain-on-failure`. All 101 mobile scenarios passed. All four Flora checks and the shared dialog/rack regressions passed; the single failure was the early desktop Codex-navigation test exceeding its 30-second limit, with a long execution gap in the trace. Its cause is unproven.
- Follow-up: **24/24 checks passed** in 1.2 minutes, without retries, using `npx playwright test e2e/app.spec.ts e2e/interaction.spec.ts e2e/flora.spec.ts --grep 'navigate to tutorial/codex|Classic rack|Spanish Flora|pointer discard' --repeat-each=2 --reporter=list --workers=1 --trace=retain-on-failure`. This repeats six scenarios in both configurations twice. Codex navigation now requires a real button, the exact `/en/codex` route, and its heading; the previous conditional could silently skip navigation. The focused pass does not convert the preceding full run into 202/202.
- Failure history: the initial focused run passed **33/34**, exposing a 390×844 touch transfer that opened Flora. The second passed **32/34**: all touch transfers passed, while one desktop rack test timed out and a new resize test compared geometry read across two viewport sizes. The latter now reads geometry atomically and waits for the requested viewport under the existing five-second expectation budget; bounds remain unchanged. The desktop rack check passed unchanged in the full run and twice in follow-up. Original timing causes are not inferred from later passes.
- Spanish long-stack screenshots were inspected at 320×568, 568×320, and 1024×768. Fixed scroll caps and the close control stay outside the independently clipped text viewport. Mobile staging uses native taps; the Decay discard scenario uses a pointer drag in both configurations. Test walls/stacks are explicit fixtures, not organic acquisition evidence. Diagnostic directories: `/tmp/tensho-flora-verification-KdgCdC/initial-focused-suite/`, `second-focused-suite/`, `full-suite/`, and `final-focused-suite/`.
- Strict TypeScript, targeted ESLint/Prettier, and the Pages-path production build pass. Output: `index-DXDYRbeP.js` (**1,377.70 kB; 391.62 kB gzip**), `index-DZZXdrps.css`, **227 precache entries / 46564.97 KiB**. Chunk-size and stale-Browserslist warnings remain. The original popup PNG and tracked HTML report are unchanged. No commit, push, or deployment was performed. This pass reuses existing tile art and the previously integrated generated scrolls; it does not claim another image generation or an exposed model version.
- Completion remains unproven: [Flora implementation](FLORA_IMPLEMENTATION.md#requirements-still-missing-from-the-runtime) identifies unused runtime helpers for multiple documented powers, the three-Flower shop gap, partial Frostbite behavior, and further mutation/interaction requirements. Accurate “not connected yet” copy is temporary disclosure, not a substitute for implementing them.

### Current Omen lifecycle, Gap Bridge, and pack-motion checkpoint

- Full units: **739/739 in 68 files**, one worker, 70.55 seconds, using `bun run test:run --maxWorkers=1`. Coverage includes eight earned-Omen lifecycle cases, five pack component cases, six artwork cases, and a content regression that classifies the advertised Gap Bridge example through actual group rules. The earlier full 736-test run failed on reward visibility. Synchronous assertions then reproduced invisible Bonus/Gold rewards, two PackCard checks reproduced missing motion support, and preference-toggle assertions reproduced lost selection. These failures were fixed in source rather than hidden by waiting longer.
- Full browser suite: **198/198 passed without retries** (12.6 minutes), using `npx playwright test --reporter=list --workers=1 --trace=retain-on-failure`. All 99 scenarios pass in both desktop and mobile Chromium. This includes the four Omen acquisition checks, four live app/system pack-motion checks, and both individual Terminal Gate/Gap Bridge art scenarios at 320×568. Final Gap Bridge screenshots were inspected in both configurations: image, title, close control, and complete rule text fit inside the viewport. Reward fixtures verify actual selection/claim/payment but do not establish organic reward frequency or human enjoyment.
- The preceding 28-check focused run passed **26/28** (1.9 minutes). Both Gap Bridge checks incorrectly expected the stale fallback example `3·5·7`; the localized UI and engine already correctly used `3·4·6`. The fallback was corrected too, and the new content regression first proved the advertised old example illegal. No gameplay rule, screenshot bounds, timeout, or interaction assertion was loosened. Initial and final artifacts are retained at `/tmp/tensho-pack-motion-NnUm4T/initial-focused-suite/` and `full-suite/`.
- The earlier lifecycle full run finished **186/192** (23 minutes), with six early desktop readiness/timeouts; all mobile checks passed. All six scenarios passed unchanged in the 28-check follow-up and again in the final full 198. Their original timing cause remains unproven; this later pass does not erase the unsuccessful runs. [Omen lifecycle notes](OMEN_LIFECYCLE.md) preserve the earlier 39/40 focused result and diagnostic paths.
- Strict TypeScript, targeted ESLint, changed/new test formatting, and the Pages-path build pass. Final output: `index-BL72ZWYG.js` (**1,372.86 kB; 390.42 kB gzip**), `index-CGLinjiM.css`, **227 precache entries / 46541.78 KiB**. All five Table Loop scrolls and the Charter illustration match their built copies and are precached. The bundle references Gap Bridge and the HTML uses `/tensho-web/assets/`. Large-chunk and stale-Browserslist warnings remain; build success is not hosted deployment or runtime performance evidence.
- The completion audit found an uncovered Flora UI defect: `GameplayScreen` toggles `isFloraExpanded` but renders no expanded view, and `FloraTrackCompact` labels corruption while displaying the base Season's description. The screen also passes a stack-wide corruption flag alongside only the first Season. This is a concrete remaining implementation task, not a completed interface inferred from green tests.
- Current repository-wide lint finishes with **zero errors / 211 warnings**. The actual release workflow bodies pass **13/13 isolated checks** via `node --test scripts/deployment-versioning.test.mjs` (24.9 seconds); their temporary Git fixtures do not publish this repository. `git diff --check` passes and the tracked Playwright HTML report is unchanged. Nothing in this checkpoint was committed, pushed, or deployed.

### Current shop Omen checkpoint

- Full units: **727/727 in 65 files**, one worker, 260.33 seconds. The preceding run passed 725 tests but failed to start the `ShopItemCard.test.tsx` worker; that was an unsuccessful run, not a pass. The isolated rerun required no assertion or application changes.
- Strict TypeScript, targeted ESLint, new-test Prettier, and the Pages-path build pass. Output: `index-BLKIAZsN.js` (1,372.37 kB; 390.32 kB gzip), `index-CGLinjiM.css`, **226 precache entries / 44804.35 KiB**. The generated Charter asset matches its built copy, and it plus all four new Table Loop illustrations remain in the precache. Existing chunk-size and Browserslist warnings remain.
- The 70-check affected browser run finished **68 passed / 2 failed** (19.2 minutes). Both new Omen scenarios passed, including once-only purchase, free pack settlement, reroll capacity, and client-route recovery. Two existing desktop pack tests timed out during an unusually long execution gap; the timing cause is not established. Their mobile counterparts passed.
- A separate one-worker follow-up passed **6/6 without retries** (13.6 seconds): `npx playwright test e2e/shop-omens.spec.ts e2e/shop.spec.ts --grep 'stacked shop Omens|pack choices work with the keyboard|localized pack choices fit' --reporter=list --workers=1 --trace=retain-on-failure`. It includes the two timed-out scenarios and the Omen scenario in both configurations, with unchanged assertions/timeouts. This is not a retroactive 70/70 result.
- The first 70-check attempt passed 66: the new Omen test mistakenly searched for a child button inside the pack button, and two existing desktop checks encountered a lost development-server connection/context and a page-readiness timeout. The selector was corrected; the other assertions were unchanged. Diagnostics are retained under `/tmp/tensho-omen-verification-pwEGC7/initial-focused-suite/` and `second-focused-suite/`. Both Omen screenshots were inspected at 320 CSS pixels.
- The suite now contains **188 configured checks / 94 scenarios**; the full 188 has not been run. The previous full 178-check pass remains historical. Organic Omen acquisition, season-lock tradeoffs, edition-description reconciliation, and legacy Double Omen/pack-skip catalog gaps remain separate work.

### Previous Tile Pack checkpoint

- **717/717 tests in 64 files passed** with `bun run test:run --maxWorkers=1` (91.35 seconds). Two seeded tests first reproduced the stale Bonus/Gold descriptions; they now match the real tile definitions and verify +30 played chips, zero played Gold-Mark gold, and 3 held gold through the modifier scorer. Three component cases cover localized rules, keyboard selection/confirmation, ordinary rarity labels, stacked modifiers, and plain/Honor names. Seeded fixtures reset their RNG after each test rather than altering an unrelated Omen test's randomness.
- **68/68 targeted desktop/mobile browser checks passed** without retries in 5.4 minutes, using the same shop/dialog/result/consumable command as below. Both new Tile Pack cases use deliberate two-reward fixtures, show full Spanish rules at 320×568, select/confirm through the real dialog, and verify the exact two physical tiles in `wallTemplate`, one 8-gold payment, a cleared pending pack, and removal of its shop offer. Final screenshots were inspected in both configurations. This does not prove organic rare-reward frequency or all modifier effects.
- The first run passed **66/68** (5.3 minutes). The two new cases expected “Bambú” instead of the existing catalog's “Bambúes”; corrected exact names pass with the same transaction and layout assertions. Screenshots also exposed Decree-specific rarity labels on tiles, now replaced with the existing generic shop rarity keys. Initial artifacts are retained at `/tmp/tensho-tile-rewards-DJYJTj/initial-focused-suite/`. No browser timeouts were extended and no forced clicks were introduced.
- Strict TypeScript and the Pages build pass. Latest assets are `index-BmlooWEg.js` (about 1.37 MB) and `index-CGLinjiM.css`; the PWA precache contains **226 entries / 44803.58 KiB**. Existing large-chunk and stale-Browserslist warnings remain. Changed TypeScript files pass targeted ESLint; new helpers, components, tests, and browser tests pass targeted Prettier. The legacy system file was not reformatted wholesale.
- There are **186 configured browser checks / 93 scenarios**. This checkpoint reruns 68 affected checks, not the full 186; the prior full 178-check run remains historical. The previous final Charter artifacts are retained at `/tmp/tensho-charter-verification-vm5y46/final-focused-suite/`.
- Negative Tile remains unresolved: an isolated actual `GameOrchestrator` probe accepts one such tile into the persistent wall while slot capacity stays **5 → 5**, despite its definition advertising +1. The mechanics and item-library documents disagree about whether Negative may exist on tiles. A user design choice is pending; no unsupported slot-lifetime or removal policy was implemented.

### Earlier shop identity and Charter checkpoint

- **712/712 unit/component tests in 63 files passed** with `bun run test:run --maxWorkers=1` (69.23 seconds). This includes three Charter cases, two actual-stock/motion/affordability cases, one header case, and the 17-key all-locale contract. The earlier two-worker run passed 697 tests but failed to start workers for `tableLoopStore.test.ts` and `groupRules.test.ts`; its two unhandled worker-start errors make that run unsuccessful. The serial run changed no assertions or application rules.
- **66/66 targeted browser checks passed** without retries in 2.9 minutes: `npx playwright test e2e/shop.spec.ts e2e/dialogs.spec.ts e2e/run-results.spec.ts e2e/consumables.spec.ts --reporter=list --workers=2 --trace=retain-on-failure`. These cover desktop/mobile Charter layout, cancellation/payment, concrete Seal/Orb offers, receipt layouts, pack settlement, consumable use, and victory/Endless flows. There are now **184 configured checks / 92 scenarios**; the full 184-check suite has not been run at this checkpoint. The prior full 178-check pass below is historical.
- Strict TypeScript, `VITE_BASE_PATH=/tensho-web/ bun run build`, targeted ESLint, and targeted Prettier passed. Current output: `index-CfA8WY-_.js` (about 1.37 MB), `index-CGLinjiM.css`, and **226 PWA precache entries / 44803.24 KiB**. The built Charter PNG matches the source bytes, is referenced in the bundle, and is listed in the precache. Large-chunk and stale-Browserslist warnings remain.
- The first focused browser run passed 63/66. Both base-Charter tests failed because their snapshot serialized a `Set` rather than an array; correcting that fixture preserved the real cancel/pay/ownership assertions. The unchanged desktop Unity test also exceeded its timeout; both configurations pass in the final run, but the original timing cause remains unproven. Initial artifacts are retained at `/tmp/tensho-charter-verification-vm5y46/initial-focused-suite/`. An unsupported Testing Library `exact` option was removed from the header test before the successful type check.
- Final mobile screenshots were inspected for the base Charter at 320 pixels, upgraded Charter at 640 pixels, and actual Orb description at 320 pixels. The upgraded offer is a deliberate fixture with zero gold, proving rendering and disabled purchase—not organic upgraded-Charter acquisition. Native-speaker, physical-device, deployment, and PWA-upgrade verification remain separate.

### Historical verification checkpoints

- Current full browser checkpoint: **178/178 checks passed** (13.8 minutes), without retries, using `npx playwright test --reporter=list --workers=2 --trace=retain-on-failure`. This covers 89 scenarios in desktop and mobile Chromium, including localized large-value receipts at 320×568 and 1024×768, live shake containment, and changing the system motion preference. Previously failing mobile receipt renders now pass after closing the controller's subscription gap. The two desktop timeout scenarios also pass unchanged; their original timing cause remains unproven.
- Payout failure history: initial **169/176**, then **175/176** runs exposed an English Act-ascent copy regression, large-number wrapping, and animation-driven document overflow. A subsequent **174/178** run exposed two stale mobile receipts plus two desktop timeouts. Artifacts are preserved locally under `/tmp/tensho-payout-verification-9ULF1P/`. The final 178-check pass follows actual source corrections, not retry settings, forced clicks, weaker bounds, or longer browser timeouts. A direct controller regression reproduced stale `gameplay:4` after the engine changed to `shop:17`; it now updates immediately and still handles later gold events.
- Earlier rank-conversion checkpoint: **693/693 unit/component tests in 58 files**, strict TypeScript, production build, targeted lint, and **28/28 consumable browser checks** passed. The browser run took 54.1 seconds without retries, with the new cancellation/ordinary-six flow on desktop and mobile. It preceded the current full-suite result above.
- Completed the current-session Settings reset across all five meta stores, both runs, and tutorial flags while preserving preferences/unrelated storage. Archive reset now removes earned unlocks and startup/reset share derived default counters. Explicit storage errors trigger verified rollback or partial-reset disclosure. Eight unit checks, six new desktop/mobile checks, all-locale labels, and the final full suites pass; see [Progress reset](PROGRESS_RESET_IMPLEMENTATION.md).
- Replaced shared Popup overlays with native modal dialogs, accessible names/descriptions, safe initial focus, Tab containment, Escape/backdrop cancellation, and focus restoration. Localized labels and narrow-phone action stacking preserve the scroll ornament. The tests also exposed and fixed a hidden new run starting after Exit; see [Dialog implementation](DIALOG_IMPLEMENTATION.md). The subsequently completed reset workflow uses fixed scroll padding for longer warnings.
- Reproduced and fixed the post-victory Ancient Script rewind: losing at Act 8 incorrectly showed a fresh Victory and a dead continuation button. Explicit Endless state now survives rewinds, controls the header/result, and prevents second entry. Boss-shop previews and transitions share the Act-reduction calculation. Nine engine checks and two additional desktop/mobile acquisition-to-result checks verify the behavior, hand penalty, and once-only progression; see [Run results](RUN_RESULTS_IMPLEMENTATION.md).
- Fixed an app-wide screen-shake remount: changing the wrapper component on every frame discarded focus and local state. A direct regression reproduced the lost input and now verifies node identity, focus, value, and mount counts. Phase changes also clear stale scoring popups. Added all 13 result-screen translations, locale-aware full-width scores, wrapping actions, and the initial six desktop/mobile result-flow checks. [Run results](RUN_RESULTS_IMPLEMENTATION.md) records that coverage and the subsequent Charter rewind fix.
- Reproduced and fixed release tag/checkout divergence after a concurrent push, and partial branch publication when a tag is rejected. Atomic publication, explicit guards, repository runtime pins, pre-build application tests, and a verified artifact `release.json` now have 13 passing isolated workflow checks. All 520 application tests and the Pages-path production build also passed using Bun 1.3.3. [Release implementation](RELEASE_IMPLEMENTATION.md) distinguishes candidate tags from successful deployment and records the remaining live checks.
- Added an explicit choose-item → choose-targets → confirm consumable dialog, private target selection, keyboard focus containment, visible failure recovery, localized functional Script penalties, and active Omen-protection disclosure. The engine now honors authored up-to ranges, caller target order, and untargeted-effect boundaries; no-op rank/suit effects retain the item and use allowance. [Consumable implementation](CONSUMABLE_IMPLEMENTATION.md) records precise semantics, coverage, and the unresolved Seal-lifetime conflict.
- Generated and integrated a fourth individual scroll, Terminal Gate, using the built-in image generator and the existing Echoing Bamboo image as a style reference. The 1254×1254 PNG retains its alpha channel. [The art manifest](TABLE_LOOP_ART.md) records the exact prompt and the unavailable model-version limitation. Unit tests check all four individual asset paths; desktop/mobile checks verify decoding and readable owned-item rule details.

- Full unit/component suite: **705 tests across 60 files passed** using `bun run test:run --maxWorkers=2`, including seven localized payout checks, the receipt locale contract, one render-to-subscription regression, 14 rank-conversion checks, 11 Honor-conversion checks, seven pure transformation checks, all-locale Unity coverage, 29 consumable-policy checks, eight copy-history checks, 21 public-information consumable checks, 11 resource-policy checks, 22 CLI-contract checks, 15 resource-cycling checks, six additional redraw-button cases, Purple Seal locale coverage, eight reset-coordinator checks, reset-locale coverage, seven Popup checks, nine Endless-progression checks, five VFX continuity/cleanup/motion-preference checks, result-locale coverage, 19 consumable-targeting checks, five individual-art checks, and all earlier gameplay/system coverage. An earlier unrestricted-worker attempt failed to start nine workers during heavy host load and timed out on Popup; it is not counted as successful verification. A newer string API in an artwork test was also corrected to match the configured JavaScript target before the final type check. The first preflight full run hit the CLI reproducibility test's five-second default; its outer timeout now accommodates two bounded subprocesses without changing the assertions, and the final full run passed.
- Strict TypeScript and the production build passed with `VITE_BASE_PATH=/tensho-web/ bun run build`. The final payout/controller build emits `index-BsFDkmzm.js` (about 1.37 MB before compression), `index-BaX6O4eS.css`, and 225 PWA precache entries (42840.15 KiB). Large-chunk and stale-Browserslist warnings remain; build success is not performance or deployment evidence.
- Repository lint: zero errors, 211 warnings. Targeted lint for the new/changed TypeScript files passed without warnings.
- Preceding full browser suite (Unity checkpoint): **167/168 passed** (12.8 minutes), using `npx playwright test --reporter=list --workers=2 --trace=retain-on-failure`, without retries. Both new Spanish 320×568 Unity flows passed, with inspected screenshots and an actual scoring pair after conversion. The desktop Mega pack capacity scenario exceeded its 30-second limit; its trace shows settlement and arrival at gameplay. Three unchanged isolated repetitions then passed with one worker (25.9 seconds total), but the timeout cause is unproven. Original artifacts are retained locally at `/tmp/tensho-unity-verification-SOOXrS/full-suite/`. The prior full Fool checkpoint passed **166/166** (10.0 minutes). Earlier two desktop interaction timeouts also passed unchanged repetitions and a later full run; those original causes remain unproven.
- Failure history is retained: an earlier 95/96 run missed a mobile Table Loop first selection; a later 101/102 run proved highlighted Classic tiles intercepted their neighbors. Native-touch tests then proved double-selection from compatibility mouse events. Extra tooltip repetitions exposed dismissal/geometry instability after an intermediate 108-check run had passed. Those findings drove the current fixes; no forced clicks or weakened first-selection assertions were substituted. The historical Table Loop first miss is not conclusively attributed to one of these causes.
- Changed interaction files pass targeted ESLint and Prettier checks; `git diff --check` passes. The tracked HTML browser report is unchanged because verification uses the list reporter.
- Shop-specific browser checks and screenshot inspection verify once-only rewards, combined-capacity rejection/reselection, explicit skipping, keyboard focus, pending-pack route recovery, localized pack text, and a fully visible error/action footer on a 320×568 phone. Fixtures intentionally isolate transaction edge cases rather than proving organic later-Act reach.
- Manual inspection of the current development build verified starter artwork and an owned-scroll popup on desktop, all five slots in a 390×844 viewport, and a Bamboo placement with a forecast and committed score of 110. Reload retained that group, score, remaining actions, and replacement rack.
- Screenshot review of the new Classic rack at 320×568 and 1280×800 verifies whole, separate tile faces. Short phones intentionally scroll the HUD out of the way; the final rack row clears the pinned action bar. Browser assertions additionally cover 390×844, all fourteen hand/staged targets, and the frame boundary. This is not physical-device or native-speaker validation.
- The in-app browser initially showed a blank page on port 4173 while loading an old hashed production bundle. A clean development origin on port 4175 loaded the current source and worked. This observation does not establish that the public Pages deployment has been updated or that all PWA upgrade paths are correct.

## Completion audit still open

| Requirement / concern | Evidence still required |
| --- | --- |
| Complete playable core loop | Full acquisition/use/settlement coverage of the documented systems, not just the opening move or data definitions. Preserve existing Classic coverage while checking later-round and end-state paths. |
| Table styles | Classic integration and legacy catalog reconciliation are verified in [Table rules](TABLE_STYLE_RULES.md). Balance across table/stake combinations remains part of the progression audit. Table Loop is a separate mode, not a migration of Classic table mechanics. |
| Progression and build balance | Shared play validation and the blind fallback resolve the measured legality/no-advice stops. [Resource-aware and one-away policies](CLASSIC_BALANCE_AUDIT.md) now execute real discards/redraws and reproduce 600 runs across matched seeds. [Conservative consumable use](CLASSIC_CONSUMABLE_BALANCE.md) now has 400 matched-seed rows. Cost-aware destructive/Script strategies, synergy-aware shopping, broader Yaku planning, and table/Stake comparisons remain open before tuning Act 6–8. Human enjoyment cannot be inferred from simulation clear rates. |
| End-to-end system integration | Consumable targeting, purchase-to-use, penalty/protection, and cancellation paths have browser coverage. Act 8 win/loss, the default-table Stake unlock, ordinary Act 9 continuation/loss, Ancient Script purchase/rewind/defeat, and once-only completion pass through the live UI using explicit fixtures. Unity now creates valid Winds with an illustrated public mapping. The subsequent physical rank-conversion fix covers Strength and Ouija red-five identity, modifier preservation, and existing costs. Broader table/Stake/effect combinations, Omen-modified shops, bosses, and upgraded-Charter acquisition remain open; see [Run results](RUN_RESULTS_IMPLEMENTATION.md). Resolve the hand-only versus persistent Fate Seal conflict; a user design choice has been requested. |
| Remaining UI and persistence limits | Shared dialogs/Exit and the current-session reset workflow are verified in [Dialog implementation](DIALOG_IMPLEMENTATION.md) and [Progress reset](PROGRESS_RESET_IMPLEMENTATION.md). Multi-tab stale writes and crash-atomic multi-key reset are not guaranteed. Cash-out and shop headings/counts/continuation/confirmation now have all-locale copy; escaped Charter decorations are removed. Tile rewards use canonical/localized modifier text with full wrapping. PackCard motion and the full-stack Flora inspector are verified. Missing tile/catalog translations and edition/sticker labels remain. The Flora inspector now reveals several incomplete underlying powers; see [Flora implementation](FLORA_IMPLEMENTATION.md). Physical-device/assistive-technology review and the unexplained historical interaction timeouts remain open. |
| Animation and audio | Live music/SFX, generated assets, controls, and native Chromium/mobile playback are verified in [Audio implementation](AUDIO_IMPLEMENTATION.md). Listening/mix review on real speakers and iOS/Safari remains distinct from headless decoding checks. |
| New-player experience | Observe newcomers using practice and regular play. Verify that they can state a plan and explain its payoff, not merely follow highlights. |
| Consistent UI and localization | Classic tap interception/double-selection and clipped tile details have targeted fixes and browser coverage. The historical Table Loop first-click miss has not been conclusively attributed to a single cause; retain its diagnostic assertion. Continue later-phase/long-translation review, including tile tooltip prose and pack descriptions. New localized strings have key parity but have not received native-speaker review. |
| Release readiness | The latest main checkpoint is deployed as v1.0.260923-2. Clean-runner tests/build/provenance, the matching hosted manifest/tag, and fresh desktop/touch gameplay checks passed; see [Release implementation](RELEASE_IMPLEMENTATION.md). Existing installed-PWA upgrades and physical-device checks remain open. |

Keep these requirements open until current-state evidence proves them. Passing the current suite is a regression signal, not permission to mark unaudited systems, fun, or deployment as complete.
