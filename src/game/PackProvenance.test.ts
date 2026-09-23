import { afterEach, beforeEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { useProgressionStore } from '../stores/progressionStore'
import { initializeArchive, useArchiveStore } from '../stores/archiveStore'
import { useOmenStore } from '../stores/omenStore'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../systems/CelestialOrbSystem'
import { TEA_HOUSE_BASE_CHARTERS } from '../systems/TeaHouseSystem'
import { metaProgressionSystem } from '../systems/MetaProgressionSystem'
import type { BlessingPack } from '../systems/types'
import { runRandom } from './RunRandom'

beforeEach(() => {
  shutdownMetaProgressionBridge()
  eventBus.clear()
  useProgressionStore.getState().resetProgression()
  initializeArchive()
  useArchiveStore.getState().resetArchive()
  initializeMetaProgressionBridge()
})
afterEach(() => {
  shutdownMetaProgressionBridge()
  eventBus.clear()
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
})
function start() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  game.getState().consumableSystem.setMaxSealsPerRound(10)
  return game
}
function item(kind: 'seal' | 'orb') {
  return kind === 'seal'
    ? FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_the_hermit)
    : CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS.pluto_orb)
}
function use(game: GameOrchestrator, owned: ReturnType<typeof item>) {
  return game.processAction(
    owned.type === 'FateSeal'
      ? { type: 'useSeal', sealId: owned.instanceId }
      : { type: 'useOrb', orbId: owned.instanceId }
  )
}
function packCount(kind: 'seal' | 'orb') {
  const stats = useProgressionStore.getState().stats
  return kind === 'seal' ? stats.packFateSealsUsed : stats.packCelestialOrbsUsed
}

it.each(['seal', 'orb'] as const)(
  'tracks %s provenance per instance, not definition or last acquisition',
  (kind) => {
    const game = start()
    const purchased = item(kind)
    const packed = item(kind)
    const generated = item(kind)
    for (const [owned, source] of [
      [purchased, 'purchase'],
      [packed, 'pack_open'],
      [generated, 'generated'],
    ] as const) {
      expect(
        owned.type === 'FateSeal'
          ? game.addFateSeal(owned, source)
          : game.addCelestialOrb(owned, source)
      ).toBe(true)
    }
    expect(packCount(kind)).toBe(0)
    expect(use(game, generated).success).toBe(true)
    expect(use(game, purchased).success).toBe(true)
    expect(packCount(kind)).toBe(0)
    expect(use(game, packed).success).toBe(true)
    expect(packCount(kind)).toBe(1)
    expect(use(game, packed).success).toBe(false)
    expect(packCount(kind)).toBe(1)
    const stats = useProgressionStore.getState().stats
    expect(
      kind === 'seal' ? stats.totalFateSealsUsed : stats.totalCelestialOrbsUsed
    ).toBe(3)
  }
)

it.each(['seal', 'orb'] as const)(
  'only unlocks the %s upgrade on its 25th pack use and keeps it across runs',
  (kind) => {
    const game = start()
    const base = kind === 'seal' ? 'crystal_lens' : 'star_chart'
    const upgrade = kind === 'seal' ? 'omen_lens' : 'observatory'
    expect(
      game.addImperialCharter(
        TEA_HOUSE_BASE_CHARTERS.find((charter) => charter.id === base)!
      )
    ).toBe(true)
    // Boundary fixture; acquisition and consumption below remain authoritative.
    useProgressionStore.getState().updateStats({
      totalFateSealsUsed: 99,
      totalCelestialOrbsUsed: 99,
      packFateSealsUsed: 24,
      packCelestialOrbsUsed: 24,
    })
    const purchased = item(kind)
    expect(
      purchased.type === 'FateSeal'
        ? game.addFateSeal(purchased)
        : game.addCelestialOrb(purchased)
    ).toBe(true)
    expect(use(game, purchased).success).toBe(true)
    expect(useProgressionStore.getState().isItemUnlocked(upgrade)).toBe(false)

    const packed = item(kind)
    const state = game.getState() as OrchestratorState
    state.phase = 'shop'
    state.lastCompletedRoundType = 'Small'
    state.gold = 100
    expect(game.shop.open()).toBe(true)
    const offer = game.shop.state.packOfferings[0]
    const pack = game.shop.packOfferings.find(
      (p) => p.pack.id === (offer.item as BlessingPack).id
    )!
    pack.contents = [
      {
        id: packed.instanceId,
        type: packed.type,
        name: packed.name,
        description: packed.description,
        rarity: 'common',
        data: packed,
      },
    ]
    offer.finalCost = 4
    expect(game.shop.purchase(offer.id).success).toBe(true)
    expect(game.shop.confirmPack([0]).success).toBe(true)
    expect(state.gold).toBe(96)
    expect(packCount(kind)).toBe(24)
    game.exitShop()
    expect(use(game, packed).success).toBe(true)
    expect(packCount(kind)).toBe(25)
    expect(useProgressionStore.getState().isItemUnlocked(upgrade)).toBe(true)
    expect(
      useArchiveStore.getState().getEntry('charters', upgrade)!.isUnlocked
    ).toBe(true)
    game.startNewRun(8)
    expect(packCount(kind)).toBe(25)
    expect(useProgressionStore.getState().isItemUnlocked(upgrade)).toBe(true)
  }
)

it('does not turn a Fool copy of a pack Orb into another pack reward', () => {
  const game = start()
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.pluto_orb
  )
  expect(game.addCelestialOrb(orb, 'pack_open')).toBe(true)
  expect(use(game, orb).success).toBe(true)
  const fool = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_fool
  )
  expect(game.addFateSeal(fool, 'pack_open')).toBe(true)
  expect(use(game, fool).success).toBe(true)
  const [copy] = game.getCelestialOrbs()
  expect(copy.id).toBe(orb.id)
  expect(use(game, copy).success).toBe(true)
  expect(packCount('orb')).toBe(1)
  expect(packCount('seal')).toBe(1)
  expect(useProgressionStore.getState().stats.totalCelestialOrbsUsed).toBe(2)
})

it('does not award pack use on preview, failed targets, or rejected acquisition', () => {
  const game = start()
  const seal = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_alchemist
  )
  expect(game.addFateSeal(seal, 'pack_open')).toBe(true)
  const action = {
    type: 'useSeal' as const,
    sealId: seal.instanceId,
    targets: [],
  }
  expect(game.canPerformAction(action)).toBe(false)
  expect(game.processAction(action).success).toBe(false)
  expect(packCount('seal')).toBe(0)
  for (let i = 0; i < 2; i++)
    expect(
      game.addCelestialOrb(
        CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS.pluto_orb)
      )
    ).toBe(true)
  const rejected = item('orb')
  expect(
    rejected.type === 'CelestialOrb' &&
      game.addCelestialOrb(rejected, 'pack_open')
  ).toBe(false)
  expect(use(game, rejected).success).toBe(false)
  expect(packCount('orb')).toBe(0)
})

it('preserves new counters in saves without inventing pack history for old totals', () => {
  const stats = useProgressionStore.getState().stats
  const saved = metaProgressionSystem.serializeStats({
    ...stats,
    totalFateSealsUsed: 50,
    totalCelestialOrbsUsed: 60,
    packFateSealsUsed: 3,
    packCelestialOrbsUsed: 4,
  })
  const restored = metaProgressionSystem.deserializeStats(
    JSON.parse(JSON.stringify(saved))
  )
  expect(restored.packFateSealsUsed).toBe(3)
  expect(restored.packCelestialOrbsUsed).toBe(4)
  const legacy = JSON.parse(JSON.stringify(saved))
  delete legacy.packFateSealsUsed
  delete legacy.packCelestialOrbsUsed
  const migrated = metaProgressionSystem.deserializeStats(legacy)
  expect(migrated.totalFateSealsUsed).toBe(50)
  expect(migrated.totalCelestialOrbsUsed).toBe(60)
  expect(migrated.packFateSealsUsed).toBe(0)
  expect(migrated.packCelestialOrbsUsed).toBe(0)
})

it('does not infer pack provenance for legacy inventory or inherit it from a shop template', () => {
  const game = start()
  const legacy = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_hermit
  )
  game.getState().fateSeals.push(legacy)
  expect(use(game, legacy).success).toBe(true)
  const purchased = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.pluto_orb
  )
  purchased.source = 'pack_open'
  expect(game.addCelestialOrb(purchased)).toBe(true)
  expect(purchased.source).toBe('purchase')
  expect(use(game, purchased).success).toBe(true)
  expect(packCount('seal')).toBe(0)
  expect(packCount('orb')).toBe(0)
  expect(useProgressionStore.getState().stats.totalFateSealsUsed).toBe(1)
  expect(useProgressionStore.getState().stats.totalCelestialOrbsUsed).toBe(1)
})
