/**
 * TEMPORARY diagnostic - measures the scoring ceiling against act targets.
 */
import { describe, it } from 'vitest'
import { GameOrchestrator } from '../game/GameOrchestrator'
import { ALL_DECREES } from '../systems/DecreeSystem'
import type { Decree } from '../systems/types'

describe('scoring ceiling', () => {
  it('reports achievable hand score with a strong decree loadout', () => {
    const orch = new GameOrchestrator()
    orch.startNewRun(42, 1)

    const state = orch.getState()
    console.log(`decree slots: ${state.decreeSystem.getMaxSlots()}`)
    console.log(`total decrees defined: ${ALL_DECREES.length}`)

    const baseline = orch.previewScore(orch.getState().handTiles.map((t) => t.id))
    console.log(`\nbaseline full-hand preview (2 starter decrees): ${baseline?.finalScore}`)
    console.log(
      `  base ${baseline?.basePoints} additive ${baseline?.additiveBonus} yakuMult ${baseline?.yakuMultiplier}`
    )

    // Fill every decree slot with the strongest scoring decrees available.
    const scoreValue = (d: Decree): number => {
      const effects = [d.effect, ...(d.extraEffects ?? [])]
      let value = 0
      for (const e of effects) {
        if (e.type === 'multiplicative_score') value += e.multiplier * 1000
        if (e.type === 'additive_score') value += (e.multiplier ?? 0) * 100 + (e.basePoints ?? 0)
      }
      return value
    }
    const byRarity = [...ALL_DECREES].sort((a, b) => scoreValue(b) - scoreValue(a))
    console.log(
      'top scoring decrees: ' +
        byRarity.slice(0, 5).map((d) => `${d.name}(${scoreValue(d)})`).join(', ')
    )

    let added = 0
    for (const decree of byRarity) {
      if (!orch.canAddDecree(decree as Decree)) continue
      if (orch.addDecree(decree as Decree)) added++
    }
    console.log(`\nadded ${added} high-rarity decrees`)

    const loaded = orch.previewScore(orch.getState().handTiles.map((t) => t.id))
    console.log(`loaded full-hand preview: ${loaded?.finalScore}`)
    console.log(
      `  base ${loaded?.basePoints} additive ${loaded?.additiveBonus} yakuMult ${loaded?.yakuMultiplier}`
    )

    const targets = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000]
    console.log('\nact boss targets (base x2) vs 4 loaded hands:')
    const fourHands = (loaded?.finalScore ?? 0) * 4
    for (let act = 1; act <= 8; act++) {
      const bossTarget = targets[act - 1] * 2
      console.log(
        `  act ${act}: boss target ${bossTarget.toLocaleString()} | 4 hands = ${fourHands.toLocaleString()} ${
          fourHands >= bossTarget ? 'OK' : 'SHORT'
        }`
      )
    }
  }, 60_000)
})
