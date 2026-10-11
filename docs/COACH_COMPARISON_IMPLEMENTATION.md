# Illustrated coach comparison

October 11, 2026. Addresses item 7 of the [UI backlog](UI_IMPROVEMENT_BACKLOG.md).
This is a presentation and accessibility checkpoint, not a new scoring rule or
a claim that the whole game is complete.

## Behavior

- Short localized labels replace truncated coach titles. Full names, exact
  scores and explanations remain available to assistive technology.
- A 44px question-mark control opens “Why these tiles?”. Each choice shows its
  actual physical tile artwork, exact localized score and the current round's
  pressure or immediate score difference. No concealed identity is supplied.
- Opening, reading, scrolling, closing and hiding advice are read-only. Preview
  selects the pictured tile IDs through the existing game controller; the
  normal Play action still performs validation, payment and scoring.
- Corrected the old “build toward / keep this group” explanation: this option
  selects that group to **play**, not to keep. It does not predict future draws.
- The comparison has one scrolling body. Card headings are explicitly sized,
  and the optional Hide advice action is at the end, not in a space-consuming
  fixed footer. The dialog's Close control remains visible.
- A choice replaces the coach with the forecast, so focus goes to Play after
  the dialog closes. Hiding advice returns focus to Wall. The board's initial
  rack auto-scroll now stops on `focusin`, as it already did for pointer and
  keyboard interaction; later content measurements cannot hide that focus.
- Existing generated tile illustrations are reused, including complete-hand
  selections larger than five tiles. No additional raster or model-name claim
  is introduced in this checkpoint. The previous release's new generated
  planning-tray artwork remains in use.

The search algorithm, scoring, resource economy, save schema, concealed-tile
policy and previously confirmed mechanics choices are unchanged. Dismissing
the coach remains session-local; this does not reset tutorial completion.

## Evidence and limits

Isolated Git-backed verification source and logs:
`/tmp/tensho-coach-6cB0cs`. Unrelated `.claude/launch.json` edits are excluded.

The initial browser run passed 13 desktop cases and failed all 13 short-phone
cases: Wall received focus, but the board's startup scroll put it outside the
viewport. Retained screenshots and traces are under `native/`. Adding `focusin`
to the existing startup-scroll cancellation fixed that reproduction; the next
26-case run (`native-fixed.log`) passes unchanged assertions in all thirteen
locales. The final batch also checks the tightened comparison layout.

`CoachPanel.test.tsx` covers short/full names, explanation and dismissal,
physical tile IDs, concealed/missing identities, complete-hand choices,
React 19 button ref forwarding, all thirteen locales and exact large scores.
`PlaySurface.test.tsx` adds a focused-control/resize regression.
`e2e/coach-comparison.spec.ts` checks real rendered tile images, readable bounds,
44px controls, keyboard/touch focus, byte-identical saved state while inspecting,
selection-only snapshot changes on preview, exact score/payment on Play and
reload persistence. It retains every failing trace.

The opening diagnostic (`coach-diagnostic.log`, seeds 1–100) reports median
taught score 47 and coach score 93; 73/99 taught shapes and 13/100 coach choices
fall below the required pace. There are 99 recognizable teaching shapes and
one redraw suggestion. This is not a win-rate or human-enjoyment measurement.

The full local suite (`unit.log`) passes 2,928/2,931 tests in 208 files; three
unchanged balance CLI cases exceed Vitest's five-second limit. The entire
28-case CLI file then passes serially with its original assertions and timeouts
(`unit-cli-recheck.log`). All 19 coach component tests and 34 PlaySurface tests
pass in the full run. Targeted lint, strict TypeScript, the Pages-path build,
asset-delivery checks and all thirteen release-workflow checks pass. The asset
verifier reports 437 entries and 37,891,487 precache bytes.

The first expanded browser batch (`native-final.log`) was terminated by SIGTERM
after 48 passing cases, without a final result. It is not counted as a completed
batch. Its output is preserved. The complete replacement run passes all **100
development-browser cases** (`native-complete.log`): coach comparison, guide,
rack tools, discard geometry and all-locale tap/keyboard discard. All **90
Pages-path production cases** also pass (`production.log`), covering the coach,
rack tools and both discard suites. No retries or relaxed assertions are used.
The coach checks alternate Enter and Space on desktop and use taps on phones.
Final French 320×568 comparison screenshots were inspected after the typography
and scrolling changes; both choices and their actions remain readable/reachable.

## Published release

Published as **v1.0.261011-8**. Implementation commit
`f39b65d953616208997914e37fc8226a355235cd`; built/version-tagged commit
`18225c25aa8bd8caa263bf6bfcd5d06af70642cd`.
[Release workflow 38162514647](https://github.com/evgenyvinnik/tensho-web/actions/runs/38162514647)
passes all **2,931 tests in 208 files**, thirteen release-workflow checks, build,
asset delivery and Pages deployment. CI's precache measurement matches the
local build. `ci-build.log` retains the independent results.

The public `release.json`, remote tag and runtime
`/tensho-web/assets/index-BDatJUxA.js` agree on that version and commit
(`public-release.json`). All **52 hosted desktop/touch journeys** pass without
retries (`hosted.log`): the coach and rack-tools suites in all thirteen locales,
including the previously troublesome Italian Space-to-close path. This is new
regression evidence, not a retrospective root-cause explanation for its old
failure. Only owned checkpoint changes were committed; unrelated launch
configuration remains intact.

## Remaining limits

Physical-device
and newcomer observation remain open; translations have automated coverage,
not native-speaker approval. The previous release's unexplained Italian
Space-to-close rack-tools failure remains open; this focus/scroll fix does not
claim to explain it.
