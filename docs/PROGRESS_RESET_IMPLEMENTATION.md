# Coordinated progress reset

Verified September 9, 2026. The Settings confirmation now matches its expanded warning instead of clearing only the achievement store.

## Scope and behavior

[resetProgress.ts](../src/game/resetProgress.ts) coordinates the explicit reset. It is called only after the player confirms in [SettingsScreen](../src/components/screens/SettingsScreen.tsx).

- Reset earned achievements, lifetime statistics, unlocks, recent-unlock notifications, selected table, table history, and per-table Stake history to their authored defaults.
- Rebuild Archive entries from the current catalog, removing earned discovery/usage/win history and earned unlock flags. The old `resetArchive` cleared counters but preserved unlocks. An explicit full reset also removes retired saved entries; ordinary hydration still preserves legacy history.
- Synchronize derived default counters just as startup does. A fresh profile already knows 19 starter Archive entries; reporting zero until reload was a real mismatch exposed by the browser test. Reset means the normal starting state, not that every counter or unlock must be empty.
- Abandon the active Classic run and its pending paid pack without emitting a win, loss, or new-run event. Clear the bridge's old run context while retaining its event subscriptions.
- Delete the saved Table Loop journal and replace its live engine/selection with a fresh default opening choice. Later actions write a new journal, not the old history with a new first action. Unlike ordinary Restart, this also returns the draft variant to its default.
- Remove five tutorial/completion keys, including the Codex completion flag. The separate Reset Tutorial action removes only these keys and preserves earned progress and both runs.
- Preserve language, audio, display/accessibility preferences, error logs, and unrelated origin data. No `localStorage.clear()` or broad key-prefix deletion is used.

The explicit storage allowlist is the five persisted meta-store keys, `tensho-table-loop-v1`, and the five keys exported as `TUTORIAL_PROGRESS_KEYS`. New persisted progress systems must be added to this contract when introduced.

## Failure handling

Before changing progress, capture the exact values of the allowed storage keys and the five in-memory meta states. If capture fails, report failure without starting the reset.

Meta resets and tutorial deletion happen before the last fallible operation, deletion of the saved Table Loop run. `clearSavedRun` preserves its current engine and journal if deletion fails. Only after storage operations succeed does the coordinator discard the authoritative Classic run.

On a reported failure, restore all five meta states and attempt to restore every captured key, even if an individual rollback write fails. Verify the restored values rather than assuming rollback succeeded. Settings distinguishes a verified restoration from possible partial changes; neither is presented as success. A deliberate retry is supported.

This is synchronous error recovery, not a database transaction or an undo feature. Successful reset is intentionally irreversible through the UI. Browser crashes midway through a multi-key operation and concurrent stale writes from other open tabs are not covered by an atomicity guarantee.

## Interface

All 13 locales include the expanded warning about discoveries and active/saved runs, preserved preferences, and both storage-failure outcomes. Cancel remains the initial action. Confirmation transitions to a success or error alert, and closing the alert restores its opener.

The longer Spanish warning is checked at 320×568. Content scrolls inside fixed top/bottom padding, so scrolling does not consume the 56-pixel decorative clearance. Actions stack on narrow screens. Geometry assertions, label-overflow checks, and screenshot inspection supplement—not replace—future physical-device and native-speaker review.

## Verification

- [Eight coordinator tests](../src/game/resetProgress.test.ts): all-store/run reset; preserved preferences/unrelated data; no run-completion side effects; repeat reset and next-run bridge behavior; fresh Table Loop journal; deletion failure with exact rollback; rollback failure disclosure; capture failure; and tutorial-only success/failure paths. Individual tests cover multiple related assertions.
- [Three browser scenarios](../e2e/progress-reset.spec.ts), on desktop and mobile Chromium: cancellation and complete reset through Settings; full meta-state comparison with a fresh profile before and after reload; removal of a pending paid pack and saved Table Loop; tutorial-only preservation; denied deletion, error alert, exact restoration, and successful retry.
- Locale integrity checks cover all new keys in all 13 languages. Existing dialog checks also verify the expanded warning and fixed scroll clearance.
- An intermediate browser run passed 14/16 targeted checks; the two failures identified the default discovery-count mismatch. The comparison was retained and startup synchronization was shared with reset.
- Final full unit/component run: **547/547 passed across 49 files**, `bun run test:run --maxWorkers=2`.
- Final full browser run: **150/150 passed**, without retries, `npx playwright test --reporter=list --workers=2 --trace=retain-on-failure`.
- Strict TypeScript and `VITE_BASE_PATH=/tensho-web/ bun run build` passed. Targeted ESLint, Prettier, and whitespace checks passed. Existing bundle-size and stale-Browserslist warnings remain.

Tests used isolated in-memory storage and fresh browser contexts. No real player data was deleted, and no commit, push, or deployment was performed. This completes the current-session reset workflow, not the [broader implementation audit](IMPLEMENTATION_WRAP_UP.md).
