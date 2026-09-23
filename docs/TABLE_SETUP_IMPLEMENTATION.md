# Table setup: readable rules and durable selections

## Player-facing behavior

- The illustrated table selector is now a native modal dialog: background
  controls are isolated, opening focuses Close, Tab/Shift+Tab wrap within its
  controls, Escape cancels, and dismissal returns focus to the opener.
- Difficulty radios support arrow keys and Home/End, skip locked tiers, and
  have one tab stop. Selection remains a preview until Confirm. Cancel does not
  overwrite the previous setup. The progression hint points to the next locked
  tier for this table rather than an already-unlocked tier.
- Names, lock explanations, progression, table-card accessible labels and unlock
  headings resolve in all thirteen locales. An optional **Active rules**
  disclosure shows cumulative penalties and explains the sticker consequences.
- The rules are derived from `calculateCombinedModifiers`, which also feeds the
  actual round/shop systems. Gold includes six active penalties, including a
  **1.95×** score-target multiplier. This is not compounded again every Act, as
  the old English-only prose suggested. Table modifiers still apply. No scoring,
  sticker, price or unlock rule is changed by this presentation work. Perishable's
  chance is explicitly conditional on not being Eternal, matching the existing
  priority rule. Authored English descriptions and probability comments are
  corrected too; no random rolls or modifier values are changed.
- Rules and table cards share one scrolling area, with the header and confirmation
  footer retained. Text wraps, touch controls are at least 44px tall, and app/system
  reduced motion disables entrance/hover movement. Existing generated table
  illustrations and the color palette are preserved; no new bitmap is needed
  for this selector correction.
- On small CJK screens redundant decorative labels are hidden and action-button
  padding leaves enough width for the localized label without splitting it.

## Saved setup, not saved runs

Browser testing exposed an existing gap: confirming a table/difficulty changed
the session but reloading silently returned to Green Felt/White. The table and
stake stores now persist their confirmed selection alongside earned progress.
Hydration validates known/unlocked tables and earned or Full Unlock difficulty;
invalid selections fall back to defaults. Derived modifiers are always recomputed
from the current catalog, never copied from saved bonus values. Old profiles
without selection fields keep their original default behavior. No wins are
invented. Full progress reset clears the preference, and reset rollback retains it.

The selected preference does not change a running game's captured table/rules.
Classic **run** persistence is a separate unresolved requirement: this change
does not save a Classic rack, round, inventory or score. Table Loop's existing
saved-run journal is unchanged. Crash-atomic multi-key setup writes, cross-tab
coordination, all malformed-save recovery and cloud profiles are not claimed.

## Verification ledger

- Initial modal regressions: **4 failures**, reproducing missing dialog semantics,
  localization, optional cumulative rules, arrow navigation and opening focus.
- After implementation: **29 passes / 1 fixture failure** (Spanish title casing).
  Cleanup was moved before preference resets to avoid updates to mounted tests.
- Cumulative-rule verification initially retained **39 passes / 1 fixture failure**:
  two independently seeded boss rolls had different multipliers. Both managers
  now use the same seed. A later focused run retained **39 passes / 1 timeout**
  in the existing TableStyleCard test; its five-second deadline was not widened.
- First browser set: **4 passes / 8 failures**. Two desktop Full Unlock journeys
  timed out at 30 seconds while loading Classic. All six English/Spanish/Japanese
  selector journeys exposed the real lost-selection-on-reload defect. Native
  modality, focus, scrolling and initial selection had already passed in those
  journeys. Final results are retained, not replaced by later successes.
- Saved-setup regressions before the fix: **1 pass / 7 failures**, covering lost
  selections and unvalidated hydrated selectors/modifiers. After implementation,
  **68/68** focused tests passed across seven files. The expanded setup test set,
  including isolation of a running game, passed **9/9**.
- TypeScript caught two test-only unsupported `exact` options; lint caught an
  ambiguous multiline indexed access. Both were corrected; TypeScript and
  targeted lint passed before the browser recheck.
- Browser recheck: **12/12** passed, with no retries or increased deadlines.
  It covers English/Spanish/Japanese desktop and 320×568 touch layouts, native
  modality/focus/keyboard navigation, locked tiers, optional cumulative rules,
  confirmed selection/reload/cancel, reduced motion, Full Unlock save/reset
  safeguards, and a real Classic start from the saved Dragon's Den/Gold setup
  with the expected **731-point** opening target.
- Existing selector/localization/actual-table-rules/reset browser regressions:
  **14/14** passed. Visual review of Spanish desktop and Japanese/English short
  phones caught the CJK action wrapping noted above after these passes; the final
  layout adds a one-line/unclipped-button assertion. The combined final browser
  set passed **26/26**, and the full suite passed **1,165/1,165 in 106 files**.
  After the conditional-sticker wording follow-up, all **1,165/1,165** tests
  passed again (29.08s), and the six selector journeys passed **6/6** (39.7s).
  Fresh strict TypeScript, targeted lint and Pages-base production/PWA build
  passed: 344 modules, 270 precache entries / 67,792.23 KiB. Existing large-chunk
  and stale-Browserslist warnings remain. No timing/retry gate was relaxed.

Artifacts and isolated browser configuration: `/tmp/tensho-table-selector-Kjbuft/`.
Translations have completeness/interpolation checks, not native-speaker approval.
Physical-device/Safari/assistive-technology review and installed-PWA upgrade testing
remain open. This checkpoint does not prove project completion or that the game
is fun for newcomers.

## Publication

Published as **v1.0.260923-6**, code checkpoint
`0e587d61a399bb63fa496c598f15f5fbe34c9b37`, built/tagged commit
`bbc87dfe512f95aa6071f4c533fb85312310f78f`.
[Actions run 35817112836](https://github.com/evgenyvinnik/tensho-web/actions/runs/35817112836)
independently passed all 1,165 tests in 106 files, release checks, production/PWA
build, provenance and Pages deployment. The public manifest and remote tag match.
Fresh hosted 1280×800 and 320×568 touch contexts passed native modality, Full
Unlock activation, cumulative rules, confirmed selection/reload, actual Classic
Dragon's Den/Gold start at 731 points, Spanish rules with decimal-comma formatting,
and real Table Loop placement/refill/reload. No JavaScript page errors occurred.
These isolated profiles did not change the user's saved game. The evidence-only
follow-up uses `[skip ci]`; main includes the workflow's version commit.
