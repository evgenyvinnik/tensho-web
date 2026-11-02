import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus, type GameEventData } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
  DEFAULT_ORB_MAX_LEVEL,
  type CelestialOrb,
} from '../systems/CelestialOrbSystem'

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

/** A Tea House open on an Orb offer, with the levels still at baseline. */
function visit(orbId: keyof typeof CELESTIAL_ORBS) {
  const game = new GameOrchestrator()
  game.setConsumableUnlockResolver(() => true)
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  Object.assign(state, {
    phase: 'shop',
    lastCompletedRoundType: 'Small',
    gold: 50,
  })
  expect(game.shop.open()).toBe(true)
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS[orbId]
  )
  const offer = game.shop.state.itemOfferings[0]
  Object.assign(offer, {
    item: orb,
    itemType: 'CelestialOrb',
    finalCost: 3,
    baseCost: 3,
    editionCost: 0,
  })
  return { game, state, orb, offer }
}

function listen<E extends 'celestialOrbUsed' | 'consumableAcquired'>(event: E) {
  const seen: GameEventData[E][] = []
  eventBus.on(event, (payload) => seen.push(json(payload)))
  return seen
}

it('uses a bought Orb at once: the family rises, nothing is held, and the run records the use', () => {
  const { game, state, orb, offer } = visit('pluto_orb')
  const used = listen('celestialOrbUsed')
  const acquired = listen('consumableAcquired')
  expect(game.shop.validatePurchase(offer.id)).toEqual({ success: true })
  expect(game.shop.purchase(offer.id)).toEqual({ success: true })
  expect(state.gold).toBe(47)
  expect(state.celestialOrbs).toEqual([])
  expect(state.celestialOrbSystem.getYakuLevel('Pairs')).toBe(2)
  expect(game.getYakuUpgradeState()).toEqual([
    { yaku: 'Pairs', level: 2, chips: 10, mult: 1, timesScored: 0 },
  ])
  expect(state.fateSealSystem.getLastUsedConsumable()?.id).toBe('pluto_orb')
  expect(acquired).toEqual([
    expect.objectContaining({
      consumableType: 'CelestialOrb',
      itemId: 'pluto_orb',
      instanceId: orb.instanceId,
      source: 'purchase',
    }),
  ])
  expect(used).toEqual([
    {
      orbId: 'pluto_orb',
      source: 'purchase',
      yakuCategory: 'Pairs',
      newLevel: 2,
      levels: [{ yaku: 'Pairs', from: 1, to: 2 }],
      onAcquire: true,
    },
  ])
  expect(game.shop.state.itemOfferings[0].isPurchased).toBe(true)
  // The upgrade, and the empty rail, survive a strict save round trip.
  const restored = new GameOrchestrator()
  restored.restoreRun(parseClassicRunSnapshot(json(game.captureRun())))
  expect(restored.getState().celestialOrbs).toEqual([])
  expect(restored.getYakuUpgradeState()).toEqual(game.getYakuUpgradeState())
})

it('refuses an Orb whose family is already at its maximum level without charging', () => {
  const { game, state, orb, offer } = visit('pluto_orb')
  for (let level = 1; level < DEFAULT_ORB_MAX_LEVEL; level++)
    expect(state.celestialOrbSystem.useOrb(orb).success).toBe(true)
  expect(state.celestialOrbSystem.getYakuLevel('Pairs')).toBe(
    DEFAULT_ORB_MAX_LEVEL
  )
  const used = listen('celestialOrbUsed')
  const before = json(game.captureRun())
  expect(game.shop.validatePurchase(offer.id)).toEqual({
    success: false,
    reason: 'maxLevel',
  })
  expect(game.shop.purchase(offer.id)).toEqual({
    success: false,
    reason: 'maxLevel',
  })
  expect(state.gold).toBe(50)
  expect(game.shop.state.itemOfferings[0].isPurchased).toBe(false)
  expect(used).toEqual([])
  expect(json(game.captureRun())).toEqual(before)
})

it('raises every family for Black Hole and announces each level it changed', () => {
  const { game, state, offer } = visit('black_hole_orb')
  state.celestialOrbSystem.useOrb(
    CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS.pluto_orb)
  )
  const used = listen('celestialOrbUsed')
  expect(game.shop.purchase(offer.id)).toEqual({ success: true })
  expect(used).toHaveLength(1)
  expect(used[0].levels).toHaveLength(13)
  expect(used[0].levels).toContainEqual({ yaku: 'Pairs', from: 2, to: 3 })
  expect(used[0].levels).toContainEqual({
    yaku: 'TwoSequences',
    from: 1,
    to: 2,
  })
  expect(state.celestialOrbs).toEqual([])
  expect(game.getYakuUpgradeState()).toHaveLength(13)
})

it('uses pack-chosen Orbs at once and needs a free level for each copy chosen', () => {
  const { game, state } = visit('pluto_orb')
  const orbs = [0, 1].map(() =>
    CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS.pluto_orb)
  )
  const packOffer = game.shop.state.packOfferings[0]
  const pack = game.shop.packOfferings.find(
    (p) => p.pack.id === packOffer.item.id
  )!
  Object.assign(packOffer.item, {
    type: 'Celestial',
    size: 'Mega',
    choiceCount: 2,
    selectCount: 2,
  })
  Object.assign(pack.pack, packOffer.item)
  pack.contents = orbs.map((orb) => ({
    id: orb.instanceId,
    type: orb.type,
    name: orb.name,
    description: orb.description,
    rarity: 'common',
    data: orb,
  }))
  pack.maxSelections = 2
  packOffer.finalCost = 4
  // One level short of the cap: two Pairs Orbs cannot both apply.
  for (let level = 1; level < DEFAULT_ORB_MAX_LEVEL - 1; level++)
    state.celestialOrbSystem.useOrb(orbs[0])
  expect(state.celestialOrbSystem.getYakuLevel('Pairs')).toBe(
    DEFAULT_ORB_MAX_LEVEL - 1
  )
  expect(game.shop.purchase(packOffer.id)).toEqual({ success: true })
  expect(game.shop.validatePackSelection([0, 1])).toEqual({
    success: false,
    reason: 'maxLevel',
  })
  expect(game.shop.validatePackSelection([1])).toEqual({ success: true })
  const used = listen('celestialOrbUsed')
  expect(game.shop.confirmPack([1])).toEqual({ success: true })
  expect(state.celestialOrbs).toEqual([])
  expect(state.celestialOrbSystem.getYakuLevel('Pairs')).toBe(
    DEFAULT_ORB_MAX_LEVEL
  )
  expect(used).toEqual([
    expect.objectContaining({
      orbId: 'pluto_orb',
      source: 'pack_open',
      levels: [
        {
          yaku: 'Pairs',
          from: DEFAULT_ORB_MAX_LEVEL - 1,
          to: DEFAULT_ORB_MAX_LEVEL,
        },
      ],
    }),
  ])
  // A capped family keeps its last Celestial pack unsellable, like Flowers do.
  const next = game.shop.state.packOfferings[1]
  const nextPack = game.shop.packOfferings.find(
    (p) => p.pack.id === next.item.id
  )!
  Object.assign(next.item, {
    type: 'Celestial',
    size: 'Normal',
    choiceCount: 1,
    selectCount: 1,
  })
  Object.assign(nextPack.pack, next.item)
  const capped = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.pluto_orb
  )
  nextPack.contents = [
    {
      id: capped.instanceId,
      type: capped.type,
      name: capped.name,
      description: capped.description,
      rarity: 'common',
      data: capped,
    },
  ]
  expect(game.shop.validatePurchase(next.id)).toEqual({
    success: false,
    reason: 'maxLevel',
  })
})

it('leaves Orbs created during a round on the rail for the player to use', () => {
  const game = new GameOrchestrator()
  game.setConsumableUnlockResolver(() => true)
  game.startNewRun(7)
  const orb: CelestialOrb = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.pluto_orb
  )
  const used = listen('celestialOrbUsed')
  expect(game.addCelestialOrb(orb, 'generated')).toBe(true)
  expect(game.getState().celestialOrbs).toHaveLength(1)
  expect(game.getState().celestialOrbSystem.getYakuLevel('Pairs')).toBe(1)
  expect(
    game.processAction({ type: 'useOrb', orbId: orb.instanceId }).success
  ).toBe(true)
  expect(used).toEqual([
    expect.objectContaining({
      source: 'generated',
      levels: [{ yaku: 'Pairs', from: 1, to: 2 }],
      onAcquire: false,
    }),
  ])
})

it('keeps the provenance of a bought Orb still held on the rail but does not call its use an acquisition', () => {
  const game = new GameOrchestrator()
  game.setConsumableUnlockResolver(() => true)
  game.startNewRun(7)
  // Runs saved before bought Orbs applied at once can still hold one.
  const orb: CelestialOrb = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.pluto_orb
  )
  expect(game.addCelestialOrb(orb, 'purchase')).toBe(true)
  const used = listen('celestialOrbUsed')
  expect(
    game.processAction({ type: 'useOrb', orbId: orb.instanceId }).success
  ).toBe(true)
  expect(used).toEqual([
    expect.objectContaining({ source: 'purchase', onAcquire: false }),
  ])
})
