import { afterEach, expect, it, vi } from 'vitest'
import { TeaHouseSystem } from './TeaHouseSystem'
import { FateSealSystem } from './FateSealSystem'
import { ALL_DECREES } from './DecreeSystem'
import { runRandom } from '../game/RunRandom'

afterEach(() => {
  vi.restoreAllMocks()
  runRandom.reset()
})

it('prices successful rewards by request metadata when an earlier Decree guarantee cannot generate', () => {
  const shop = new TeaHouseSystem(1, () => 0.3)
  const state = shop.generateShop(
    ALL_DECREES.map((decree) => decree.id),
    false,
    {
      guaranteedItems: [
        { itemType: 'Decree', minDecreeRarity: 'ImperialDecree' },
        { itemType: 'FateSeal', free: true },
        { itemType: 'CelestialOrb', free: true },
        { itemType: 'FateSeal' },
      ],
      discountPercentage: 20,
    }
  )
  expect(state.itemOfferings.map((o) => o.itemType)).toEqual([
    'FateSeal',
    'CelestialOrb',
    'FateSeal',
  ])
  expect(
    state.itemOfferings.slice(0, 2).map((o) => [o.finalCost, o.sellValue])
  ).toEqual([
    [0, 0],
    [0, 0],
  ])
  expect(state.itemOfferings[2].finalCost).toBeGreaterThan(0)
  const saved = JSON.parse(JSON.stringify(shop.toSerializedState()))
  expect(TeaHouseSystem.fromSerializedState(saved).getState()).toEqual(state)
})

it('a failed free reward cannot make a later paid offer of the same kind free', () => {
  // Ordinary slots use Decrees; the first Seal request alone cannot generate.
  vi.spyOn(FateSealSystem, 'getRandomFateSeal').mockReturnValueOnce(null)
  const shop = new TeaHouseSystem(1, () => 0.3)
  const state = shop.generateShop([], false, {
    guaranteedItems: [
      { itemType: 'FateSeal', free: true },
      { itemType: 'FateSeal' },
      { itemType: 'CelestialOrb', free: true },
    ],
    decreeEditions: ['Foil', 'Holographic', 'Negative'],
  })
  expect(state.itemOfferings.map((o) => o.itemType)).toEqual([
    'FateSeal',
    'CelestialOrb',
    'Decree',
    'Decree',
    'Decree',
  ])
  expect(state.itemOfferings[0].finalCost).toBeGreaterThan(0)
  expect(state.itemOfferings[1]).toMatchObject({ finalCost: 0, sellValue: 0 })
  expect(
    state.itemOfferings
      .slice(2)
      .map((o) => [o.edition, o.finalCost, o.sellValue])
  ).toEqual([
    ['Foil', 0, 0],
    ['Holographic', 0, 0],
    ['Negative', 0, 0],
  ])
  expect(new Set(state.itemOfferings.map((o) => o.id)).size).toBe(5)
  expect(state.itemOfferings.map((o) => o.slotIndex)).toEqual([0, 1, 2, 3, 4])
})
