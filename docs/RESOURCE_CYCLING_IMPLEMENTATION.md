# Classic redraw and discard audit

Updated September 9, 2026. This closes concrete resource-cycling gaps against
[Game mechanics, section 3](GAME_MECHANICS.md#3-discards-and-hand-management-河管理).
It does not establish balance, enjoyment, or completion of the broader project.

## Corrected behavior

Previously, a redraw placed removed tiles into the discard pool despite the
documented return-to-wall rule. It accepted duplicate physical tile IDs, omitted
Purple Seal rewards, and did not emit ordinary replacement-draw events. The
button checked selection size and exchange allowance, but not locks or whether
the wall could actually supply replacements.

- A redraw accepts one to three distinct, unlocked tiles from the current rack.
  It requires an active gameplay phase, an exchange, and enough playable
  replacements. Staging, inspection, and availability checks spend nothing.
- Replacement tiles are drawn before returned tiles re-enter circulation. A tile
  cannot replace itself during that exchange, but can appear in a later draw.
- The remaining undrawn wall and returned tiles are shuffled with the run's
  seeded wall stream. The consumed prefix is removed and the draw index resets
  to zero; old draw-history references are not duplicate physical tiles. The
  persistent wall template is not edited by a redraw.
- One successful exchange spends one redraw. It does not spend a Hand or a
  discard, award River Tax gold, or put the returned tiles into the river.
- Real discards retain their distinct behavior: the tile enters the discard
  pool, discard allowance is spent, and eligible discard rewards apply.
- A Purple-sealed tile generates a random Fate Seal on either discard or redraw,
  subject to shared consumable capacity. No item is created during validation.
  A full inventory does not invalidate the underlying exchange or discard.
- Actual replacement tiles produce `tileDrawn` events and added-tile effects.
  This updates the controller and normal draw feedback without pretending a
  redraw was a discard.
- Post-draw boss effects still resolve once per cycle. For example, the Hook
  can discard tiles after the replacement, and the Bell can lock one. Those
  boss consequences are distinct from returning selected tiles to the wall.
- The Water retains its authored zero-redraw rule; its internal `no_discards`
  effect name is not interpreted as a new prohibition on real discards.

## Bonus tiles and legality

Flowers and Seasons use the existing dead-wall replacement chain. Each dead-wall
draw replenishes that wall from the main wall's tail when possible. Consequently,
two raw main-wall tiles do not necessarily provide two playable replacements.

A read-only capacity check simulates up to three cycles using copied arrays. It
does not collect bonuses, generate rewards, advance random streams, or disclose
hidden tile identities. A request that cannot complete all its replacements is
rejected before any mutation, rather than spending an exchange and shrinking
the rack unexpectedly. A leading bonus with no resolvable dead-wall replacement
therefore makes that redraw unavailable; this pass does not invent a fallback
draw rule for an exhausted dead wall.

The same snapshot supplies resource validation for availability and execution.
Locked discards and redraws now fail at validation, and resource action discovery
checks whether at least one eligible tile exists. Outside active gameplay the
orchestrator returns no available gameplay actions. This is not a claim that
every other action-discovery category has undergone the same audit.

The rendered redraw button uses authoritative legality for the staged selection,
or the selected rack tiles when nothing is staged. Empty selections, exhausted
allowance, oversize selections, locks, and insufficient replacements disable it.
Purple Seal names and descriptions are present in all 13 locales; tile details
read the same localized seal entries as the Archive. Broader tile prose and
native-speaker review remain separate work.

## Verification

- `src/game/ResourceCycling.test.ts`: 15 checks covering rejected selections and
  resources, phase restrictions, locked availability, tile conservation, later
  reuse, seeded repeatability, non-mutating availability, nested bonus chains,
  main/dead-wall exhaustion, Purple rewards/capacity, River Tax separation, and
  Bell/Hook/Water behavior.
- Six additional ActionBar cases cover disabled redraw conditions and a legal
  one-tile redraw independent of play legality. Locale integrity checks require
  Purple Seal text in all 13 languages.
- `e2e/resource-cycling.spec.ts`: three scenarios on both desktop and mobile.
  Real staging preserves resources; confirmation replaces the selected tile,
  returns it to the wall, grants its seal once, and disables after exhaustion.
  Separate fixtures verify locked and unresolvable-bonus selections stay disabled.
- Full unit/component suite: **569 tests in 50 files passed** with
  `bun run test:run --maxWorkers=2`.
- Full browser suite: **156/156 passed without retries** with
  `npx playwright test --reporter=list --workers=2 --trace=retain-on-failure`.
- Strict TypeScript and the Pages-path production build passed with
  `VITE_BASE_PATH=/tensho-web/ bun run build`. Targeted ESLint and whitespace
  checks passed. Large-bundle and stale-Browserslist warnings remain.

The fixtures isolate edge conditions; they do not demonstrate organic later-Act
reach. The baseline Classic policy does not use redraws, discards, or consumables.
A subsequent [resource-aware comparison](CLASSIC_BALANCE_AUDIT.md) adds actual
exchanges/discards and a bounded complete-hand chase. Consumable strategy and
observed newcomer sessions remain open. No deployment or real-repository Git
publication was performed in this pass.
