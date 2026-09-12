# Playable table rules

Verified September 9, 2026. These rules apply to **Classic** runs. Table Loop is a separate experimental mode and does not inherit them.

The selected table is resolved once when a run starts. Both gameplay and its illustration/colors read that captured identity; changing a menu preference cannot change an active run's rules. An unknown legacy ID resolves to Green Felt rather than claiming an unapplied modifier.

| Table | Authoritative effect | Unlock |
| --- | --- | --- |
| Green Felt | Standard rules; five base Decree slots | Available initially |
| Red Lacquer | Six base Decree slots | Complete Act 3 |
| Bamboo Mat | Flower draw weight ×1.25 during seeded wall ordering | Collect all four distinct Flower types in one run |
| Imperial Gold | Two ordinary starter Decrees plus one seeded, unowned Regional Mandate | Own at least five Decrees when winning a run |
| Night Market | Shop prices ×0.8 and four base Decree slots | Purchase 20 Decrees across runs |
| Temple Stone | No Flowers; base scoring ×1.5 | Win without collecting a Flower |
| Ghost Parlor | Corrupted Seasons can appear in Act I, starting at 20% probability | Survive three Corrupted Seasons within one run |
| Dragon's Den | +1.0 to a surviving Yakuman's multiplier; round targets ×1.25 | Score a Yakuman |

## Important details

- Flower and other earned slot bonuses still add to a table's base capacity.
- Bamboo changes sampling weight, not physical tile counts or an exact unconditional draw probability. The wall still contains four Flowers, with weighted sampling without replacement making earlier appearances more likely. Normal tables retain their existing seeded shuffle.
- Temple retains all four Seasons and the 136 standard tiles. Its starting wall contains 140 tiles, and Flower additions are rejected. Its multiplier affects base points, not every later additive bonus. Forecast and committed scoring share the same calculation.
- Imperial does not replace either starter. Ordinary starters may also be Regional Mandates; the guarantee is an additional third Decree, not exactly one Regional Mandate in the inventory.
- Night Market and shop-visit Omen discounts apply sequentially, not by adding percentage points. Shop costs retain the existing floor-to-integer rule; free offers remain free. The table discount is reapplied per visit, not compounded permanently into inventory definitions.
- Dragon target scaling is applied by RoundManager before its final integer rounding. It survives later Acts, boss rerolls, serialized RoundManager state, and Endless. The Yakuman bonus is not an unconditional multiplier on tactical plays.
- A corrupted Season counts as survived when its round is won, not when it is drawn. Failed rounds do not grant survival credit, and counts do not accumulate across runs.
- Repeated draws of the same Flower type do not satisfy the four-Flower collection condition. A win on one run followed by five purchases on another cannot unlock Imperial Gold.

## Progression and save compatibility

Gameplay events update progression and project earned table unlocks into the persisted selection store. Previously recorded table unlocks are synchronized when the bridge initializes. Progress display counters are projected idempotently so restarting the app does not count purchases twice.

The collection now catalogs the same eight table IDs as the selector. Retired wall records remain available in saved history, but are excluded from active collection lists and completion totals. No legacy wall is silently mapped to a different playable table with different rules. Historical wall translations are retained; active table names, descriptions, themes, modifiers, and unlock conditions use the `tableStyles` namespace.

## Verification

- `src/game/TableStyleMechanics.test.ts`: 21 checks covering captured identity, slots, Imperial starters, Temple composition and scoring, Yakuman scoring, real shop prices, weighted draws, corruption, target progression, and run resets.
- `src/game/MetaProgressionBridge.test.ts`: nine checks, including all seven earnable table paths, persisted unlock synchronization, victory-time ownership, distinct Flowers, same-run corruption survival, and legacy collection preservation.
- `src/i18n/locales.test.ts`: table-rule and unlock-key coverage in all 13 locales. Native-speaker review remains separate from automated key coverage.
- Browser tests select Dragon's Den through the menu and verify its actual 375-point opening target, artwork, and staging colors; direct Imperial play has three illustrated Decrees. Spanish modifier/unlock text is checked alongside the existing responsive selector checks.
- Current full regression: 426 unit/component tests in 39 files and 82 browser checks across desktop Chromium and mobile Chrome. TypeScript and production build passed.

This proves integration and regression coverage, not balanced win rates or human enjoyment. Those remain part of the [implementation wrap-up](IMPLEMENTATION_WRAP_UP.md).
