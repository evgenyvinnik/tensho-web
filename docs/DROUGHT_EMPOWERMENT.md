# Drought and Flower empowerment

October 7, 2026. Implementation and verification in progress.

## Reproduced defect

The inspector and direct Flower scoring honored Drought, but Decree scoring
always multiplied its eligible bonuses by `1 + flowerCount * 0.1`. A suppressed
Orchid still raised Half Suited's 20 Chips to 22, Gentle Breeze's multiplier
from 3 to 3.2, and Moonlit Seal's scaling contribution. Both tactical and complete
hands were affected. The old helper being unused did not mean empowerment was
unimplemented: `DecreeSystem.applyDecreeEffect` already applied it separately.

`GameOrchestrator` now resolves effective suppression once and supplies it in
the transient scoring context. The Decree layer removes only Flower empowerment;
collection-based Decree conditions still see the real owned collection. Nothing
is deleted from the run. Active protection, Mandate disabling, copied effects,
Frostbite and normal restoration share that decision. This adds no save field,
new random draw, extra action or special-case UI forecast.

[Rules resolution](RULE_RESOLUTION.md) records the authorized semantics. Existing
localized Drought/Flower descriptions and tile artwork remain applicable; this
scoring repair does not require replacement artwork.

## Verification evidence

Evidence directory: `/tmp/tensho-drought-S5F1Fz`.

- Initial test draft: 9/9 failed; three assertions incorrectly referenced the
  internal Decree multiplier instead of the public score equation. That draft
  is not represented as nine valid reproductions.
- Corrected unchanged-runtime run: **9/9 failed** on the leaked empowerment
  values. `before.log` retains the failures.
- Initial repaired regression: **73/73 passed** across Drought, Winter,
  Frostbite and Decree mechanics (`focused.log`).
- Expanded tests add ownership-based Flower Friend conditions and Blueprint
  copies. The six-file run including Orb progression passes **80/80**.
- First TypeScript check caught four test accesses to an optional equation;
  explicit non-null assertions preserve the runtime numeric checks. The corrected
  typecheck passes before the subsequent Spring implementation.
- First native batch: **0/8 passed**. Two cases hit navigation/save deadlines;
  three failed because the protector fixture had only one Flower despite its
  real three-Flower gate; three compared post-staging state with pre-staging
  state. The corrected fixture supplies three Flowers and compares inspection
  against the already-staged checkpoint. Localized score separators are retained.
- Corrected browser batch: **3 passed, 1 failed, 1 interrupted, 3 unrun**. It was
  deliberately stopped after a deadline failure under severe host load so Season
  implementation could continue; it is not a passing run. Original logs/traces
  remain in `browser` and `browser-fixed`. No timeout or retry was increased.
- Browser journeys cover English/Spanish, desktop/320px touch,
  suppressed/protected forecasts, staged inspector use, payment and exact
  save/reload. The final combined native run passes **16/16** (eight Drought,
  eight Spring) without retries, including all previously failed Drought cases.
  `browser-final.json` and screenshots retain the evidence. Built-production
  replay also passes **16/16**, including every protected/suppressed case;
  TypeScript/build, lint and 13 release checks pass. Independent release CI and
  hosted deployment verification remain to be recorded.

Explicit deals and granted Decrees isolate the rule; they do not demonstrate
organic acquisition, difficulty balance or human enjoyment.
