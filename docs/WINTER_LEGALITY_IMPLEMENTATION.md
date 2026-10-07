# Winter: one-rank sequence gaps

October 7, 2026. Published and verified as **v1.0.261007-7**.

## Rule and integration

The user delegated coherent resolution of unfinished mechanics. A normal Winter
now permits a same-suit sequence with exactly one missing rank: 1–2–4, 1–3–4,
or shifted equivalents. Normal sequences remain valid. No wrapping, two gaps,
Honor sequences or cross-suit groups. Multiple Winters do not widen permission,
but retain their individual ×0.75 penalties. Chrysanthemum/Drought behavior is
unchanged. Frostbite does not inherit Winter legality. The active Season stack
controls round expiry and strict save restoration, without a new saved field.

The same permission feeds full-hand validation, enlarged-rack declaration
search, tactical parsing, preview/payment, beginner highlights, score-aware coach
candidate enumeration and the diagnostic/balance-script callers. Broken Stair
Edict shares its authored rule, including tactical scoring and Mandate disabling.
Forced tiles, hand-size limits, hidden-face handling and resource costs are not
bypassed. Neither preview nor explanation rewrites physical tiles.

Identical sequences and three-suit identical sequences now compare every rank,
not just the starting rank. Identical gapped patterns may qualify. Ittsu still
requires actual 1–2–3 / 4–5–6 / 7–8–9; Pinfu requires consecutive ranks,
without revoking a separate suit-matching
Decree. These are documented roguelike decisions, not standard Mahjong claims.

## Player-facing explanation

The optional native “Why this hand works” disclosure also supports tactical
forecasts, showing the actual scored gapped groups with existing Mahjong faces
and localized tile names. It is closed by default and supports touch/keyboard.
Hidden previews do not render it. Generic assisted-hand wording now says active
rules rather than incorrectly attributing every Winter hand to Decrees.

All thirteen locales describe the actual Winter permission and penalty. Normal
Winter's optional Season inspector uses new generated pine art; compact Season
faces and corrupted Winter retain their existing tile artwork. Native-speaker
review remains separate. This does not claim all Flora mechanics are complete.

## Verification ledger

Evidence directory: `/tmp/tensho-winter-legality-gD7c9Z`.

- Initial focused run: 97 passed / 1 failed. The new forced-tile fixture had
  locked IDs but no active Mandate; the engine intentionally ignores Mandate
  restrictions when none is active. The fixture now activates Cerulean Bell.
  This is a corrected test setup, not a reproduced runtime defect.
- Initial TypeScript checks caught new test-only mistakes: a nonexistent
  discardPile property, effect.rule instead of the tagged ruleId, and a widened
  locale string. Corrected before release validation.
- Parser regressions cover both gap patterns, top ranks, no wrapping/two gaps,
  suit/Honor boundaries, physical identity, purity and overlapping-group search.
- Engine regressions exercise actual draw activation, tactical/full payment,
  exact strict saves, expanded racks, coach guidance, repeated Winters,
  Chrysanthemum, actual corrupted draws, Omen overrides, expiry, disabled Broken
  Stair, forced tiles, concealment and exhausted plays.
- Yaku regressions check actual rank identity, matching/mismatching three-suit
  patterns, complete-straight false positives and the Pinfu boundary.
- Browser journeys cover English/Spanish × tactical/complete × desktop/320px
  touch. A native captured save can be replayed using WINTER_REPLAY_FIXTURE
  against built/hosted assets with no source imports.
- Focused tests: **151/151** before the final two regressions. Initial full
  suite: **1,818/1,818**; final full suite: **1,820/1,820 across 155 files**,
  including the separate suit-matching/Pinfu regression and completed-Winter
  inspector disclosure.
- Initial native browser journeys: **8/8**. The next batch failed **8/8 during
  fixture setup** after source edits. A read-only browser probe confirmed that
  Vite had loaded timestamped singleton modules while the test imported fresh
  unversioned modules: direct engine inactive, UI engine active, unequal
  instances. The fixture now imports the exact app-loaded module URLs. Final
  native journeys: **8/8**; no retries or timeout increases.
- All **8/8 Pages-base production replays** pass using the exact initial native
  saved fixture, with no source imports. Both tactical and full declarations
  activate Winter through real redraws, disclose the scored tile groups, match
  forecasts/payment, preserve physical tile identities, reload exactly and
  expire next round. English/Spanish 320px artwork and disclosure screenshots
  were reviewed; full card text fits and art decodes at 512px.
- Strict TypeScript, Pages build, all **13 release checks** and lint pass
  (zero errors, 211 existing warnings). Existing chunk-size and old Browserslist
  warnings remain. Full historical browser suite not rerun for this checkpoint.
- Logs and retained failed traces are in the evidence directory above; later
  passes do not erase earlier failures.

## Publication verification

Implementation commit `a551e6853cf59099de5da92382d574e635bb1ae9` deployed through
[Pages run 37685530198](https://github.com/evgenyvinnik/tensho-web/actions/runs/37685530198).
Release CI passed **1,820/1,820 tests in 155 files**, all 13 release checks and
the production build. The hosted manifest reports **v1.0.261007-7**, build/tag
commit `c85d4ea843480eea61a7d67dbf06dff284818892`. Hosted pine artwork matches the
SHA below. All **8/8 hosted journeys pass**, using the same captured fixture,
real desktop/touch controls, exact save reloads and actual score/resource checks.
Evidence: `ci.log`, `deployment.log`, `hosted.log`, `hosted.json` and `hosted/`.
GitHub reports existing Node-action deprecation/upcoming Ubuntu-image warnings;
they did not fail this deployment and were not changed in this mechanics pass.

## Generated artwork

The imagegen skill used built-in-tool mode and a transparent background. The
tool exposes no exact model selector or verifiable model ID, so no “latest model”
identity is asserted. Output was visually inspected and mechanically converted
with `cwebp -q 85 -resize 512 512`, preserving alpha.

- Saved asset: `public/assets/illustrations/winter-pine.webp`, 512×512 alpha,
  90,742 bytes.
- SHA-256: `dedd8c72810f0fd8626474cea7f80f4c7c8ad5c4e134620bd8ae5fc3225237e1`.
- Preserved original: `/Users/evgenyvinnik/.codex/generated_images/019fd81b-74a3-7cb0-8795-d6c90a5733b7/exec-3676f466-8c71-4584-ae7a-f05ff05d9d39.png`.

Exact prompt:

> Use case: stylized-concept

> Asset type: transparent illustrated Winter Season portrait for Tensho, a mahjong roguelike with jade-and-antique-gold botanical game art.

> Primary request: a single elegant snow-covered pine bough with rich jade-green needle clusters, an aged golden-brown curved branch, and soft ivory snow resting on the needles. Hand-painted premium storybook game illustration, delicately gilded edges, warm restrained gold highlights and icy teal shadow accents.

> Composition: square canvas, one centered compact botanical silhouette with generous transparent margins; readable at 72 pixels and beautiful at 160 pixels. Entire branch visible, no clipping, no container or frame.

> Scene/backdrop: genuinely transparent background, clean alpha edges, no backdrop shadow.

> Constraints: no text, no numbers, no characters, no mahjong tile faces, no logos, no watermarks, no UI mockup, no scenery. Quiet winter mood; painterly detail without photographic noise.

## Remaining scope

Three other Flower–Season interactions, advanced mutations/catalysts, full
fractional/binary Frostbite coverage and remaining item/resource semantics are
still required. Organic-run and newcomer evaluation must follow these mechanics
changes; controlled fixtures do not establish fun, balance or encounter rates.
Numeric shanten still measures standard-Mahjong distance; full-hand readiness
uses active rules. Clearer guidance for rule-assisted near-completions remains
part of newcomer UX evaluation, not a completed claim here.
