# In-flow tutorial guidance

September 19, 2026. This closes the overlapping Classic hint problem found during
the [score settlement checks](SCORE_SETTLEMENT_IMPLEMENTATION.md), not the whole
new-player or project-completion audit.

## Player-facing changes

- Play and Shop render guidance in their scrollable page layout, not a fixed
  portal over other controls. The Play card sits between the score and play area;
  the Shop card has its own row above the offers. No positioning polling, floating
  arrows or viewport-covering highlight layer remains.
- Native disclosure lets players collapse or reopen a lesson. Its controls have
  44px minimum targets. Arrival neither focuses a control nor scrolls the page.
  Escape only dismisses a hint when focus is inside it; deliberate dismissal
  restores prior focus or uses a stable in-flow fallback. There is no focus trap.
- Lessons have no reading countdown. Acknowledgement, opt-out or accomplishing
  the first play advances them. Core first-move/scoring lessons take priority
  over queued bonus explanations. The completed first-move lesson cannot appear
  late after a hand has already been played.
- First-move titles and the pattern/redraw instructions are shorter in all 13
  existing locales. Pattern placeholders remain intact. The nearby illustrated
  visual primer remains available; existing generated art and palette are kept.
  This layout/data work needs no new raster asset.
- Queued lessons are deduplicated across batched events, resolve current locale
  copy by ID, and respect opt-out even through a stale event callback. Storage
  restrictions fall back to memory. Malformed lesson history does not override
  the independently stored opt-out flag.
- The Shop introduction no longer depends on a delayed callback that can be
  canceled by rerender or effect cleanup before the lesson appears.

The broader regression run also exposed a score-animation formatting issue:
an animated string could settle as `1` instead of `1.00`. The counter now animates
numeric values and formats ordinary React text afterward. Its spring is clamped
to avoid overshooting the paid values; normal count-up and glow remain, and
reduced motion still displays the exact target immediately. Payout rules did not
change.

## Evidence and limits

Final full units: **879/879 in 83 files**, one worker, **36.21 seconds**. The
nine hook tests cover persistence, opt-out, priority, stale callbacks, queue
deduplication, no timers, translation updates and malformed/unavailable storage.
Three card tests cover in-flow rendering, focus and explicit controls. A normal
animation test covers repeated complete/tactical/bonus values and decimal text.

The final targeted browser run passed **26/26** in **81.39 seconds**, one worker,
original timeouts and no retries. It covers:

- Six open-hint first-move journeys: English 1280×800 with normal motion, Spanish
  320×568, and Russian 390×844 at 20px root text in desktop/touch contexts.
  They expand/collapse by keyboard or touch, use the actual highlighted seeded
  recommendation, stage and play tiles without dismissing the lesson, inspect
  the paid result, and use the real opt-out followed by reload.
- Two 320×568 Shop journeys with a deliberate funded-shop fixture: inspect the
  open hint, buy an item with real gold deduction, then continue via the actual
  button. This is transaction/layout evidence, not organic acquisition balance.
- The existing visual-primer and tutorial-reset journeys, eight multilingual
  score-layout checks, and six complete/tactical/bonus/zero/reset score journeys.

Geometry, hit testing, touch targets and screenshots were checked. Spanish
mobile screenshots prompted the shorter first-move copy; the revised full
viewport image was reviewed. Small screens still use vertical scrolling, and
the expanded card consumes space; it does not claim every game element fits
simultaneously without scrolling.

The 26-case browser run preceded the final independent malformed-history
opt-out safeguard. That safeguard is covered by the final full unit run and
production build; the browser suite was not rerun after it.

Strict TypeScript, targeted ESLint, formatting and `git diff --check` passed.
The Pages-base production build passed: **338 modules**, entry
`index-Dd9U9eTi.js` (750.69 kB / 227.31 kB gzip), **264 precache entries /
58,595.52 KiB**. Existing bundle-size and stale-Browserslist warnings remain.

### Retained failed checks

- The initial eight browser cases failed: six exposed bonus tips ahead of the
  first-move lesson; two exposed the canceled Shop introduction. Runtime ordering
  and scheduling were corrected rather than disabling tutorials in these tests.
- The next run passed six first-move cases; both Shop cases purchased correctly
  but timed out because the new test used the wrong capitalization for Continue.
  It now reads the real locale label.
- The next broader run passed 25/26; the normal desktop score test observed `1`
  instead of `1.00`. Numeric-only animation corrected this without loosening the
  text expectation. The subsequent 26-case run passed.
- A new persistence unit initially used the global no-op storage stub; the
  fixture now implements storage semantics. Early strict checks also caught
  missing keyboard-event typing and an underspecified animation event shape;
  these were corrected before final build verification.

Browser reports/traces/screenshots remain under `/tmp/tensho-tutorial-VCBCRF/`:
`browser`, `ordered-browser`, `final-browser`, and `verified-browser`, each with
its matching JSON report. Permission-review timeouts were retried only after
the launch request returned a terminal failure; no duplicate server/test run
was started in response to an observation timeout.

The owned server is stopped. Nothing was committed, merged, pushed or deployed.
Full repository/production browser suites and release workflows were not rerun.
Some secondary hint prose and the hint action labels still fall back to English;
native-speaker review, human newcomer playtesting and physical-device/assistive
technology checks remain open. The project-wide [completion audit](IMPLEMENTATION_WRAP_UP.md#completion-audit-still-open)
still includes mechanics, progression, publication and other UI work.
