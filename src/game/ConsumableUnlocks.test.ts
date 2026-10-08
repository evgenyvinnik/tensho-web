import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  BLACK_HOLE_PREREQUISITES,
  CONSUMABLE_UNLOCK_CONDITIONS,
  RUN_YAKU_IDS,
} from '../config/consumableUnlocks'
import { CONSUMABLE_UNLOCKS } from '../config/unlockDefinitions'
import { ALL_YAKU } from '../rules/YakuDetector'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../systems/CelestialOrbSystem'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import { BlessingPackSystem } from '../systems/BlessingPackSystem'
import { TeaHouseSystem } from '../systems/TeaHouseSystem'
import {
  DEFAULT_LIFETIME_STATS,
  metaProgressionSystem,
} from '../systems/MetaProgressionSystem'
import type { BlessingPack } from '../systems/types'
import { initializeArchive, useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
  synchronizePersistedMetaState,
} from './MetaProgressionBridge'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'

beforeEach(() => {
  useProgressionStore.getState().resetProgression()
  initializeArchive()
  useArchiveStore.getState().resetArchive()
})
afterEach(() => {
  shutdownMetaProgressionBridge()
  eventBus.clear()
  runRandom.reset()
  vi.restoreAllMocks()
  useProgressionStore.getState().resetProgression()
})
const profile = () => useProgressionStore.getState()
const score = (id: string) =>
  profile().processEvent({ type: 'yaku_scored', itemId: id })

it('uses exactly the live scoring catalog and the twelve other Orbs', () => {
  expect([...RUN_YAKU_IDS].sort()).toEqual(ALL_YAKU.map((y) => y.id).sort())
  expect([...BLACK_HOLE_PREREQUISITES].sort()).toEqual(
    Object.keys(CELESTIAL_ORBS)
      .filter((id) => id !== 'black_hole_orb')
      .sort()
  )
  expect(CONSUMABLE_UNLOCKS.map((u) => u.unlocksId).sort()).toEqual(
    Object.keys(CONSUMABLE_UNLOCK_CONDITIONS).sort()
  )
})

it.each(['Arcana', 'Celestial'] as const)(
  'filters locked %s pack rewards even on forced legendary rolls',
  (type) => {
    vi.spyOn(runRandom, 'next').mockReturnValue(0.999999)
    const pack: BlessingPack = {
      id: 'test',
      type,
      size: 'Mega',
      cost: 8,
      choiceCount: 5,
      selectCount: 2,
    }
    const ids = (unlocked: boolean) =>
      new BlessingPackSystem(undefined, () => unlocked)
        .generateOfferingsForPacks([pack])[0]
        .contents.map((c) => (c.data as { id: string }).id)
    expect(ids(false).every((id) => !CONSUMABLE_UNLOCK_CONDITIONS[id])).toBe(
      true
    )
    expect(ids(true).some((id) => CONSUMABLE_UNLOCK_CONDITIONS[id])).toBe(true)
  }
)

it('gates rare Orbs in ordinary random generation without making the pool empty', () => {
  vi.spyOn(runRandom, 'next').mockReturnValue(0.999999)
  const otherIds = Object.keys(CELESTIAL_ORBS).filter(
    (id) => !['planet_x_orb', 'ceres_orb'].includes(id)
  )
  expect(CelestialOrbSystem.getRandomCelestialOrb(otherIds)).toBeNull()
  expect(
    CelestialOrbSystem.getRandomCelestialOrb(otherIds, () => true)?.id
  ).toBe('ceres_orb')
  expect(CelestialOrbSystem.getRandomCelestialOrb()).not.toBeNull()
})

it('does not let Star Chart bypass a locked preferred family, including after a pack restore', () => {
  const unlocked = new Set<string>()
  const resolver = (id: string) => unlocked.has(id)
  const system = new BlessingPackSystem(undefined, resolver)
  const pack: BlessingPack = {
    id: 'star-chart',
    type: 'Celestial',
    size: 'Normal',
    cost: 4,
    choiceCount: 3,
    selectCount: 1,
  }
  system.generateOfferingsForPacks([pack], { preferredYaku: 'SevenPairs' })
  const ids = (s: BlessingPackSystem) =>
    s
      .getCurrentOfferings()[0]
      .contents.map((c) => (c.data as { id: string }).id)
  expect(ids(system)).not.toContain('planet_x_orb')
  const restored = BlessingPackSystem.fromState(
    system.toState(),
    undefined,
    resolver
  )
  const before = restored.toState()
  restored.applyPurchasedCharter('star_chart', 'SevenPairs')
  expect(restored.toState()).toEqual(before)
  unlocked.add('planet_x_orb')
  restored.applyPurchasedCharter('star_chart', 'SevenPairs')
  expect(ids(restored)[0]).toBe('planet_x_orb')
})

it('keeps live shop resolvers after reset/restore and rejects stale direct stock without payment', () => {
  const setters = vi.spyOn(TeaHouseSystem.prototype, 'setConsumableUnlockResolver')
  const game = new GameOrchestrator()
  const unlocked = new Set<string>()
  game.setConsumableUnlockResolver((id) => unlocked.has(id))
  for (const seed of [7, 8]) {
    game.startNewRun(seed)
    const state = game.getState() as OrchestratorState
    state.targetScore = 1
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    expect(
      game.processAction({
        type: 'play',
        tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
      }).success
    ).toBe(true)
    state.gold = 100
    game.shop.open()
    game.restoreRun(
      parseClassicRunSnapshot(JSON.parse(JSON.stringify(game.captureRun())))
    )
    const offer = game.shop.state.itemOfferings[0]
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.ceres_orb
    )
    Object.assign(offer, {
      itemType: 'CelestialOrb',
      item: orb,
      finalCost: 5,
      isLocked: false,
      isPurchased: false,
    })
    const before = game.captureRun()
    expect(game.shop.validatePurchase(offer.id).success).toBe(false)
    expect(game.shop.purchase(offer.id).success).toBe(false)
    expect(game.captureRun()).toEqual(before)
    unlocked.add(orb.id)
    expect(game.shop.purchase(offer.id).success).toBe(true)
    expect(game.getState().gold).toBe(95)
    unlocked.clear()
  }
  expect(setters.mock.calls.length).toBeGreaterThanOrEqual(5)
  for (const [resolver] of setters.mock.calls) {
    expect(resolver).toBeTypeOf('function')
    expect(resolver?.('eris_orb')).toBe(false)
    unlocked.add('eris_orb')
    expect(resolver?.('eris_orb')).toBe(true)
    unlocked.clear()
  }
})

it.each([
  ['seven_pairs', 'planet_x_orb'],
  ['chanta', 'ceres_orb'],
  ['kokushi', 'eris_orb'],
])('earns %s without unlocking unrelated patterns', (yaku, orb) => {
  expect(profile().isItemUnlocked(orb)).toBe(false)
  score(yaku)
  expect(profile().isItemUnlocked(orb)).toBe(true)
  expect(profile().isItemUnlocked('black_hole_orb')).toBe(false)
  expect(profile().isItemUnlocked('seal_of_the_void')).toBe(false)
})

it('requires unique canonical Yaku in one run, persists progress, and resets only the current run', () => {
  RUN_YAKU_IDS.slice(0, 20).forEach(score)
  score('riichi')
  score('not_a_yaku')
  expect(profile().stats.currentRunYakuIds).toHaveLength(20)
  expect(profile().isItemUnlocked('seal_of_the_void')).toBe(false)
  const saved = JSON.parse(
    JSON.stringify(metaProgressionSystem.serializeStats(profile().stats))
  )
  profile().updateStats(metaProgressionSystem.deserializeStats(saved))
  profile().processEvent({ type: 'run_started' })
  score(RUN_YAKU_IDS[20])
  expect(profile().stats.currentRunYakuIds).toEqual([RUN_YAKU_IDS[20]])
  expect(profile().stats.maxYakuTypesInRun).toBe(20)
  expect(profile().isItemUnlocked('seal_of_the_void')).toBe(false)
  RUN_YAKU_IDS.slice(0, 20).forEach(score)
  expect(profile().isItemUnlocked('seal_of_the_void')).toBe(true)
  profile().processEvent({ type: 'run_started' })
  expect(profile().stats.currentRunYakuIds).toEqual([])
  expect(profile().stats.maxYakuTypesInRun).toBe(21)
  expect(profile().isItemUnlocked('seal_of_the_void')).toBe(true)
})

it('does not fabricate past run achievements from old lifetime stats', () => {
  const saved = JSON.parse(
    JSON.stringify(metaProgressionSystem.serializeStats(DEFAULT_LIFETIME_STATS))
  )
  delete saved.currentRunYakuIds
  delete saved.maxYakuTypesInRun
  saved.yakuScored = Object.fromEntries(RUN_YAKU_IDS.map((id) => [id, 9]))
  profile().updateStats(metaProgressionSystem.deserializeStats(saved))
  synchronizePersistedMetaState()
  expect(profile().isItemUnlocked('eris_orb')).toBe(true)
  expect(profile().isItemUnlocked('seal_of_the_void')).toBe(false)
  expect(profile().stats.currentRunYakuIds).toEqual([])
})

it('requires all twelve known other Orbs, not Black Hole itself or unknown IDs', () => {
  const acquire = (itemId: string) =>
    profile().processEvent({
      type: 'consumable_acquired',
      itemType: 'CelestialOrb',
      source: 'generated',
      itemId,
    })
  BLACK_HOLE_PREREQUISITES.slice(0, 11).forEach(acquire)
  acquire('not_an_orb')
  acquire('another_unknown')
  expect(profile().isItemUnlocked('black_hole_orb')).toBe(false)
  acquire('eris_orb')
  expect(profile().isItemUnlocked('black_hole_orb')).toBe(true)
  expect(profile().stats.celestialOrbsDiscovered.has('black_hole_orb')).toBe(
    false
  )
})

it('preserves real historical acquisitions, rejects Archive-only eligibility, and supports Full Unlock', () => {
  useArchiveStore.getState().unlockAll()
  profile().updateStats({
    celestialOrbsDiscovered: new Set(['ceres_orb']),
    yakumanScored: 1,
  })
  synchronizePersistedMetaState()
  expect(profile().isItemUnlocked('ceres_orb')).toBe(true)
  expect(profile().isItemUnlocked('seal_of_the_immortal')).toBe(true)
  expect(profile().isItemUnlocked('eris_orb')).toBe(false)
  expect(
    useArchiveStore.getState().getEntry('consumables', 'eris_orb')?.isUnlocked
  ).toBe(false)
  profile().enableFullUnlock()
  synchronizePersistedMetaState()
  for (const id of Object.keys(CONSUMABLE_UNLOCK_CONDITIONS))
    expect(profile().isItemUnlocked(id)).toBe(true)
  expect(profile().stats.maxYakuTypesInRun).toBe(0)
})

it('blocks unearned direct grants but preserves owned items and legitimate Fool copy history on restore', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.ceres_orb
  )
  const seal = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_void
  )
  expect(game.addCelestialOrb(orb)).toBe(false)
  expect(game.addFateSeal(seal, 'generated')).toBe(false)
  expect(game.addCelestialOrb(orb, 'pack_open')).toBe(true)
  game.restoreRun(
    parseClassicRunSnapshot(JSON.parse(JSON.stringify(game.captureRun())))
  )
  expect(game.getCelestialOrbs().map((o) => o.id)).toContain(orb.id)
  expect(game.isConsumableUnlocked(orb.id)).toBe(true)
  const state = game.getState() as OrchestratorState
  state.celestialOrbs = []
  state.fateSealSystem.setLastUsedConsumable(orb)
  const fool = FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_the_fool)
  expect(game.addFateSeal(fool)).toBe(true)
  expect(game.processAction({ type: 'useSeal', sealId: fool.instanceId }).success).toBe(true)
  expect(game.getCelestialOrbs().map((o) => o.id)).toEqual([orb.id])
})

it('rejects unpaid legacy packs without charging and honors already-paid choices exactly once after strict restore', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
    }).success
  ).toBe(true)
  state.gold = 100
  game.shop.open()
  const snapshot = JSON.parse(JSON.stringify(game.captureRun()))
  const shelf = snapshot.shop.teaHouse.packOfferings[0]
  shelf.item.type = 'Celestial'
  const pack = snapshot.shop.packs.currentOfferings.find(
    (p: { pack: BlessingPack }) => p.pack.id === shelf.item.id
  )
  pack.pack.type = 'Celestial'
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.black_hole_orb
  )
  pack.contents = [
    {
      id: `${pack.pack.id}:choice:0`,
      type: 'CelestialOrb',
      name: orb.name,
      description: orb.description,
      rarity: 'legendary',
      data: orb,
    },
  ]
  game.restoreRun(parseClassicRunSnapshot(snapshot))
  const before = game.captureRun()
  expect(game.shop.purchase(shelf.id).success).toBe(false)
  expect(game.captureRun()).toEqual(before)
  game.setConsumableUnlockResolver(() => true)
  expect(game.shop.purchase(shelf.id).success).toBe(true)
  const paid = JSON.parse(JSON.stringify(game.captureRun()))
  game.setConsumableUnlockResolver(() => false)
  game.restoreRun(parseClassicRunSnapshot(paid))
  initializeMetaProgressionBridge()
  expect(game.shop.confirmPack([0]).success).toBe(true)
  expect(game.getCelestialOrbs().map((o) => o.id)).toContain(orb.id)
  expect(profile().isItemUnlocked(orb.id)).toBe(true)
  const claimed = game.captureRun()
  expect(game.shop.confirmPack([0]).success).toBe(false)
  expect(game.captureRun()).toEqual(claimed)
  expect(game.getState().gold).toBe(paid.state.gold)
})
