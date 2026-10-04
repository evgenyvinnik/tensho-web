# Localized contextual guidance

October 4, 2026. This corrects English guidance observed in the Spanish Tea House;
it does not establish newcomer comprehension, enjoyment, or project completion.

## Changes

All thirteen supported locales now supply the six contextual lesson titles and
bodies, plus acknowledgment and opt-out labels. Previously the entire
`progressiveHints` namespace was absent, including English, so the configuration
and component's English defaults were always used. The separate first-move
lesson continues to use its existing `gameplay` and `melds` translations.

The English source/defaults and translations explain discard versus redraw
costs, define the direction of shanten, and avoid promising that partial groups
always score. Shop guidance distinguishes immediate ordinary purchases from
confirmed Charters, using existing localized item terminology. No gameplay
rules, rewards, seeded random state, or saves are changed.

Hints remain inline, collapsible, untimed, and optional. Existing stable lesson
IDs and storage keys preserve prior acknowledgments and opt-outs. Changing
language updates visible and queued copy without restarting or acknowledging
lessons, and does not reopen a collapsed hint. No new artwork is needed for
this correction; the illustrated guide and existing shop art remain intact.

## Verification

Evidence: `/tmp/tensho-localized-hints-3SWB9w`.

- New resource/component regression initially failed all fourteen checks before
  translations. All thirteen languages are checked with English fallback off.
- First focused recheck: 60 pass, one assertion sampled the hint during its
  opacity entrance. Waiting for visibility within the standard assertion
  deadline corrected that test; all 61 focused checks then passed.
- Full unit suite: **1,655 tests in 141 files pass** (`unit.log`).
- First build caught a string used instead of the typed `MeldType.Pair` enum
  in the new test (`build.log`). Corrected build passes (`build-final.log`),
  including TypeScript; the fourteen new tests are rerun after that correction.
- Lint: no errors, 211 existing warnings. Thirteen release checks pass.
- Native browser: **18/18**, no retries (`browser.log`, `browser.json`). Eight
  new English/Spanish/Russian/Thai desktop/touch shop cases check actual text,
  320px width with 20px root font, collapsibility, 44px controls, keyboard/touch
  dismissal, durable preferences, and exact saved-snapshot preservation. Ten
  existing illustrated-guide cases guard against layout regressions.
- Production/hosted verification uses a real shop save attached by those tests
  in isolated browser contexts. It does not inject application code into the
  hosted game. Release status is recorded below after publication.
- Built production: **8/8** English/Spanish/Russian/Thai desktop/touch journeys
  pass (`production.log`), including exact snapshot equality before/after hint
  actions and reload. Post-enum-correction regression: **14/14** pass.

Native-speaker review, human novice playtests, physical-device accessibility,
and broader tutorial/control localization remain separate work. The complete
offline precache remains large (413 entries, 69,621.56 KiB); this is not a
performance optimization.

## Published verification

Implementation commit `e302ee0c81e72efba6cedc131d8e53bf5b40cb6e` is on main.
[Workflow 37199182377](https://github.com/evgenyvinnik/tensho-web/actions/runs/37199182377)
passes all **1,655 tests**, thirteen release checks, build, and deployment.
Release **v1.0.261004-8** has matching public manifest/tag/build commit
`cf2abe22aaad1f8205d79a386283e8cf1b32c26e`.

All **8/8 hosted desktop/touch journeys** pass (`hosted.log`), verifying the
localized lesson and controls, collapse/expand, acknowledgment or opt-out,
unchanged saved snapshots, durable preferences on reload, and zero page errors.
These checks use fresh contexts and do not constitute a service-worker upgrade
or physical-device test. Owned local servers are stopped. Earlier failed
assertions/build diagnostics remain recorded above rather than counted as passes.
