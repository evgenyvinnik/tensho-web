# Chrysanthemum and Winter

September 12, 2026. Implements the explicit interaction in
[Game systems §6c](GAME_SYSTEMS.md#6c-flowerseason-interactions): concealed hands
with Chrysanthemum ignore normal Winter's score penalty. This does not implement
Winter's separate, still-undefined loosened hand legality.

## Authoritative behavior

`GameOrchestrator` resolves effective Flower suppression once, including active
Eternal Garden protection and mandate-disabled Decrees. Both Flower bonuses and
Season modifiers consume that same decision. `SeasonSystem` uses the scoring
context's collection and concealed flag to omit each normal Winter factor.
The preview and committed play use this shared scoring path.

- Two Winters no longer multiply a protected score by `0.75²`.
- Other Flowers do not grant the exception; duplicate Chrysanthemums do not
  multiply it. Removing the Flower removes protection.
- Drought disables the exception unless an enabled Decree protects Flowers.
- Summer and Autumn bonuses, Frostbite's existing Decree modifier, and Decay's
  penalty are preserved. Corrupted Winter is not treated as normal Winter.
- Reading a preview does not consume or rewrite the Season stack. Round cleanup
  still removes Seasons while retaining collected Flowers.
- Context-free stack inspection retains the raw Season multiplier. The legacy
  Flower helper's nominal `+0.25` is not used as additive score arithmetic.

Classic currently marks player scoring as concealed. The false/open context is
tested at the system boundary; this change does not add open-hand gameplay.
The canonical document calls these interactions emergent and not explicitly
listed in the UI, so this pass adds no tutorial prompt or tooltip advertising
the combination. Existing Flower/Winter illustrations remain unchanged.

## Verification

The initial nine regression cases reproduced six failures before the runtime
fix, including a real-redraw concealed sequence scoring **26 rather than 47**
under two Winters. A corrected acquisition fixture reproduced the same six
failures before implementation. After the fix, those nine cases plus existing
Summer, partial-play and discard tests passed **37/37 in four files**.

The final regression file adds pairs and complete hands with the four-Flower
bonus, bringing `WinterFlower.test.ts` to eleven cases. Browser coverage adds
English/Spanish real redraw → visible forecast → committed-score flows, with
native taps in mobile Chromium. Fixtures deliberately control the rack, wall,
and Season stack; they are not natural encounter-frequency or balance evidence.

The full unit run finished **843 passed / 1 failed across 79 files** (648.14
seconds). The unchanged beginner-guide test exceeded its original 5-second
timeout. Repeating that test with all eleven Winter cases passed **12/12**
(19.00 seconds); the guide itself took 1.56 seconds. No timeout, assertion, or
application change was made between those runs. The original timeout's cause
remains unproven, and the follow-up does not make the full run retroactively
green.

Strict TypeScript and the Pages-base build passed: 334 modules, entry
`index-BhrL1ppb.js` (750.79 kB), 264 precache entries / 58,596.19 KiB. Existing
large-chunk and stale Browserslist warnings remain. This does not establish a
live deployment or deployed service-worker upgrade.

Targeted ESLint and `git diff --check` passed. Prettier initially flagged the
new Season options-argument wrapping; formatting alone was corrected afterward.

The initial targeted browser run finished **29 passed / 5 failed** (452.35
seconds): all sixteen tile-interaction and four Merchant purchase/swap/reload
checks passed. Four new Winter cases incorrectly expected `47` instead of the
existing `+47` display. Traces and `PlayArea.tsx` confirmed correct formatting;
only those two new exact-text expectations were corrected. The fifth failure
was the existing mobile Spanish inspector's 30-second overall timeout.

The entire Flora file then finished **13 passed / 1 timed out** (148.65 seconds),
including **all four Winter cases** (English/Spanish × desktop/mobile). No
retries or timeout increases were used. The unchanged mobile Spanish inspector
timed out again: its trace completed the row/overflow/ornament geometry checks
at all three viewports, then reached the final 1024-pixel screenshot before the
overall deadline. Focus-return and final unchanged-state assertions were not
reached. The timeout's underlying cause remains unproven; this is not a clean
browser-suite pass.

English/Spanish flows collect Chrysanthemum with a real redraw, stage 4–5–6,
observe `+47`, open/close the illustrated inspector without mutation, and commit
exactly 47 points. The Spanish desktop/mobile screenshots were reviewed. They
also expose cramped forecast text with the deliberate billion-point target at
320 pixels, plus an English `PLAY` label in the Spanish UI. Those existing layout
and localization issues remain open; this is not a flawless-UI claim.

Subsequent [score UI work](FORECAST_UI_IMPLEMENTATION.md) addresses that compact
forecast/large-number layout and the visible mobile Play label. The observations
above describe this Winter checkpoint, not the later repaired layout.

Artifacts: `/tmp/tensho-winter-flower-swIO2e/browser.json` and `browser/` retain
the initial run; `flora-final.json` and `flora-final/` retain the follow-up.
The owned local test server was stopped. The full repository browser suite and
production-browser/release checks were not rerun for this bounded scoring change;
their preceding results remain in [route-loading verification](ROUTE_LOADING_IMPLEMENTATION.md).

## Remaining work

The other three documented Flower–Season combinations, advanced Flower
mutations/catalysts, Spring draw semantics, Autumn discard growth, Winter
legality and all-effect Frostbite integration remain separate requirements.
No commit, merge, push or deployment is part of this verification pass.
