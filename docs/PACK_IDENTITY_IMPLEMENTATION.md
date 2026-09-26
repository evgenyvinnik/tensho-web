# Pack choice identity and catalog filtering

September 26, 2026. Incremental wrap-up work, not proof of complete balance or player enjoyment.

## Reproduced defects

Fate Seal, Orb and Script generation compared catalog IDs against generated display IDs, so exclusion never matched. Under repeated common rolls, Arcana, Celestial and Void packs each offered one repeated item despite alternatives. Timestamp-based choice IDs also collided for repeated rewards created in the same millisecond. These IDs became React keys. Separately, the reward dialog sent a choice ID to the Decree icon renderer, bypassing the real catalog identity and new generated portraits.

Six focused tests failed before implementation: three alternative-pool checks, a Tile choice-key collision, Star Chart variety, and Decree reward art. Save validation already accepts legacy duplicate display IDs because settlement uses indices; this was **not** an invalid-save-parser defect.

## Implemented boundaries

- New choices have a stable pack-ID/index key, independent of item identity and timestamp resolution.
- Consumable exclusion uses the underlying catalog ID and family. Each rolled rarity's alternatives are exhausted before repetition; the existing first-item fallback remains when that rarity pool is exhausted. Empty rarity pools still fall back to Common. The displayed consumable rarity now matches the actual reward.
- Star Chart checks the underlying Orb identity, retaining its guaranteed favored Orb without confusing that rule with a choice key.
- Tile recipes may still repeat; each physical reward remains separately selectable. This does not introduce a new tile-variety or rarity policy.
- The live pack dialog uses actual Decree IDs with shared artwork (including the five newly generated portraits), and actual Script IDs for art lookup. No new image generation or asset replacement was needed.
- Rendering uses pack ID plus selection index even for legacy saved rewards. Existing pack payloads, IDs, paid choices, save version and rewards are not rewritten. Confirmation still grants the chosen indices once through the authoritative shop transaction.

Future generated choices can differ for the same seed because broken exclusion is repaired; stored pack contents are preserved, not rerolled. Costs, rarity-roll weights, reward counts, inventory limits and scoring are unchanged.

## Verification

The first post-fix focused run had 98 passes and three fixture failures: tests assumed five Common definitions, but the real Orb and Script pools have four and three. Tests now compare against the actual catalog and verify every available alternative before fallback; no rarity promotion was added. Expanded focused checks passed **33/33**. Five family tests cover two packs and selected-index round trips on 50 seeds each, including repeated Tile recipes, preserved selections and once-only claim. Actual-rarity fallback and Star Chart checks also pass.

The first native test failed because its fixture restarted the engine directly and bypassed the app-owned save lifecycle. It now uses the run created by the real Play route. The corrected **8/8 desktop/touch checks** pass in English and Spanish: real 8G purchase, pending-pack reload, five decoded portraits or generated Arcana alternatives, choosing indices 1 and 4, exact grant, one payment, post-claim reload, and no page/console errors. Legacy duplicate keys remain in the fixture and survive reload unchanged. Spanish 320px screenshots were reviewed; choices scroll while confirmation stays visible.

An additional **8/8 existing pack-provenance browser checks** passed, covering paid pack selection, use, unlock accounting and reload. All native checks used original deadlines and no retries. Artifacts: `/tmp/tensho-pack-identity-browser` (failed fixture), `/tmp/tensho-pack-identity-corrected` and `/tmp/tensho-pack-identity-provenance`.

Full regression passed **1,370/1,370 tests in 115 files** (85.74 seconds), report `/tmp/tensho-pack-identity-units.json`. Strict TypeScript, targeted lint, diff checks and the Pages-base production/PWA build passed. Existing large-chunk and stale Browserslist warnings remain. Publication is pending. No completion claim for outstanding mechanic choices or the whole project.
