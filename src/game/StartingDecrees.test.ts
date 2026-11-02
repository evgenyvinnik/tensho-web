import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { STARTER_DECREES } from '../systems/DecreeSystem'
import { getDecreeUnlockCondition } from '../config/decreeUnlocks'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

function startingIds(seed: number, table = 'green_felt'): string[] {
  const game = new GameOrchestrator()
  game.startNewRun(seed, 1, table)
  return game
    .getState()
    .decreeSystem.getOwnedDecrees()
    .map((decree) => decree.id)
}

it('draws two distinct starting Decrees from the whole shop pool', () => {
  const game = new GameOrchestrator()
  const seen = new Set<string>()
  const rarities = new Set<string>()
  for (let seed = 1; seed <= 120; seed++) {
    game.startNewRun(seed, 1)
    const owned = game.getState().decreeSystem.getOwnedDecrees()
    expect(owned).toHaveLength(2)
    expect(new Set(owned.map((decree) => decree.id)).size).toBe(2)
    for (const decree of owned) {
      seen.add(decree.id)
      rarities.add(decree.rarity)
      // Same eligibility as an ordinary Tea House slot.
      expect(decree.rarity).not.toBe('HeavenlyOrdinance')
      expect(getDecreeUnlockCondition(decree.id)).toBeUndefined()
      expect(decree.flowerRequirement ?? 0).toBe(0)
    }
  }
  const fixedFive = new Set(STARTER_DECREES.map((decree) => decree.id))
  expect([...seen].some((id) => !fixedFive.has(id))).toBe(true)
  expect(rarities).toEqual(
    new Set(['LocalEdict', 'RegionalMandate', 'ImperialDecree'])
  )
})

it('deals the same starting Decrees for the same seed', () => {
  expect(startingIds(42)).toEqual(startingIds(42))
  expect(startingIds(42, 'red_lacquer')).toEqual(startingIds(42))
})

it('keeps the Imperial Gold Regional Mandate on top of the two draws', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7, 1, 'imperial_gold')
  const owned = game.getState().decreeSystem.getOwnedDecrees()
  expect(owned).toHaveLength(3)
  expect(owned[2].rarity).toBe('RegionalMandate')
  expect(new Set(owned.map((decree) => decree.id)).size).toBe(3)
})
