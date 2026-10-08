import { afterEach, expect, it, vi } from 'vitest'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { ALL_DECREES as library } from '../config/decreeDefinitions'
import { ALL_UNLOCKS } from '../config/unlockDefinitions'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { useProgressionStore } from '../stores/progressionStore'
import {
  DEFAULT_LIFETIME_STATS,
  metaProgressionSystem,
} from '../systems/MetaProgressionSystem'
import { BlessingPackSystem } from '../systems/BlessingPackSystem'
import type { BlessingPack } from '../systems/types'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { initializeArchive, useArchiveStore } from '../stores/archiveStore'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
  synchronizePersistedMetaState,
} from './MetaProgressionBridge'

const gated = library.filter((d) => d.unlockCondition)
const definition = (id: string) => ALL_DECREES.find((d) => d.id === id)!
const freshStats = () =>
  metaProgressionSystem.deserializeStats(
    metaProgressionSystem.serializeStats(DEFAULT_LIFETIME_STATS)
  )
afterEach(() => {
  shutdownMetaProgressionBridge()
  vi.restoreAllMocks()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
  useProgressionStore.getState().resetProgression()
})

it('filters even forced legendary pack rolls and restores earned choices to the pool', () => {
  const pack: BlessingPack = {
    id: 'gated-test',
    type: 'Decree',
    size: 'Mega',
    cost: 8,
    choiceCount: 5,
    selectCount: 2,
  }
  vi.spyOn(runRandom, 'next').mockReturnValue(0.999999)
  const rewardIds = (unlocked: boolean) =>
    new BlessingPackSystem(() => unlocked)
      .generateOfferingsForPacks([pack], { flowerCount: 4 })[0]
      .contents.map((c) => (c.data as { id: string }).id)
  const lockedIds = new Set(gated.map((d) => d.id))
  expect(rewardIds(false).every((id) => !lockedIds.has(id))).toBe(true)
  expect(rewardIds(true).some((id) => lockedIds.has(id))).toBe(true)
})

it('honors paid legacy pack choices across strict restore exactly once, but does not sell locked stock', () => {
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
  shelf.item.type = 'Decree'
  const pack = snapshot.shop.packs.currentOfferings.find(
    (p: { pack: BlessingPack }) => p.pack.id === shelf.item.id
  )
  pack.pack.type = 'Decree'
  const decree = definition('decree-omega')
  pack.contents = [
    {
      id: `${pack.pack.id}:choice:0`,
      type: 'Decree',
      name: decree.name,
      description: decree.description,
      rarity: 'legendary',
      data: decree,
    },
  ]
  game.restoreRun(parseClassicRunSnapshot(snapshot))
  const before = game.captureRun()
  expect(game.shop.purchase(shelf.id).success).toBe(false)
  expect(game.captureRun()).toEqual(before)
  // This is an authentic paid pack snapshot from a release without these gates.
  game.setDecreeUnlockResolver(() => true)
  expect(game.shop.purchase(shelf.id).success).toBe(true)
  const paid = JSON.parse(JSON.stringify(game.captureRun()))
  game.setDecreeUnlockResolver(() => false)
  game.restoreRun(parseClassicRunSnapshot(paid))
  initializeArchive()
  useProgressionStore.getState().resetProgression()
  initializeMetaProgressionBridge()
  expect(game.shop.confirmPack([0]).success).toBe(true)
  expect(game.getState().decreeSystem.getOwnedDecree(decree.id)).toBeDefined()
  expect(useProgressionStore.getState().isItemUnlocked(decree.id)).toBe(true)
  const claimed = game.captureRun()
  expect(game.shop.confirmPack([0]).success).toBe(false)
  expect(game.captureRun()).toEqual(claimed)
  expect(game.getState().gold).toBe(paid.state.gold)
})

it('reconciles earned history without accepting Archive-only flags or inventing a per-run Yakuman count', () => {
  initializeArchive()
  useArchiveStore.getState().resetArchive()
  useProgressionStore.getState().resetProgression()
  useArchiveStore.getState().unlockAll()
  useProgressionStore.getState().updateStats({ yakumanScored: 20 })
  useProgressionStore.getState().discoverItem('decree-omega', 'decree')
  synchronizePersistedMetaState()
  const profile = useProgressionStore.getState()
  expect(profile.isItemUnlocked('decree-heavenly-ordinance')).toBe(true)
  expect(profile.isItemUnlocked('decree-omega')).toBe(true)
  expect(profile.isItemUnlocked('decree-yakuman-blessing')).toBe(false)
  expect(profile.isItemUnlocked('decree-blueprint')).toBe(false)
  expect(
    useArchiveStore.getState().getEntry('decrees', 'decree-blueprint')
      ?.isUnlocked
  ).toBe(false)
  expect(
    useArchiveStore.getState().getEntry('decrees', 'decree-omega')?.isUnlocked
  ).toBe(true)
  const before = profile.stats
  synchronizePersistedMetaState()
  expect(useProgressionStore.getState().stats).toEqual(before)
})

it.each(gated)(
  'excludes locked $name from normal and rarity-constrained pools',
  (decree) => {
    expect(
      DecreeSystem.getShopCandidates([], undefined, 4).map((d) => d.id)
    ).not.toContain(decree.id)
    expect(
      DecreeSystem.getShopCandidates([], 'HeavenlyOrdinance', 4).map(
        (d) => d.id
      )
    ).not.toContain(decree.id)
    expect(ALL_UNLOCKS.filter((u) => u.unlocksId === decree.id)).toHaveLength(1)
  }
)

it('checks the live profile without changing RNG and preserves other gates', () => {
  const unlocked = new Set(['decree-blueprint'])
  const resolver = (id: string) => unlocked.has(id)
  const before = runRandom.toState()
  const pool = () => DecreeSystem.getShopCandidates([], undefined, 0, resolver)
  expect(pool()).toContain(definition('decree-blueprint'))
  expect(pool()).not.toContain(definition('decree-omega'))
  expect(pool()).not.toContain(definition('yakuman_succession'))
  unlocked.add('decree-omega')
  expect(pool()).toContain(definition('decree-omega'))
  expect(
    DecreeSystem.getShopCandidates(['decree-omega'], undefined, 4, resolver)
  ).not.toContain(definition('decree-omega'))
  expect(runRandom.toState()).toEqual(before)
})

it('keeps live unlock resolvers in shop and pack generation after a new run resets the shop', () => {
  const game = new GameOrchestrator()
  game.setDecreeUnlockResolver((id) => id === 'decree-blueprint')
  const candidates = vi.spyOn(DecreeSystem, 'getShopCandidates')
  for (const seed of [7, 8]) {
    game.startNewRun(seed)
    const state = game.getState() as OrchestratorState
    state.targetScore = 1
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    expect(
      game.processAction({
        type: 'play',
        tileIds: state.handTiles.slice(0, 2).map((tile) => tile.id),
      }).success
    ).toBe(true)
    candidates.mockClear()
    expect(game.shop.open()).toBe(true)
    expect(candidates.mock.calls.length).toBeGreaterThan(0)
    for (const [, , , resolver] of candidates.mock.calls) {
      expect(resolver?.('decree-blueprint')).toBe(true)
      expect(resolver?.('decree-omega')).toBe(false)
    }
  }
})

it('rechecks a paid offer without spending or consuming a copy draw, then allows an earned purchase', () => {
  const game = new GameOrchestrator()
  const unlocked = new Set<string>()
  game.setDecreeUnlockResolver((id) => unlocked.has(id))
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
  expect(game.shop.open()).toBe(true)
  const offer = game.shop.state.itemOfferings[0]
  Object.assign(offer, {
    itemType: 'Decree',
    item: definition('decree-blueprint'),
    finalCost: 8,
    isLocked: false,
    isPurchased: false,
  })
  const before = game.captureRun()
  expect(game.shop.validatePurchase(offer.id).success).toBe(false)
  expect(game.shop.purchase(offer.id).success).toBe(false)
  expect(game.captureRun()).toEqual(before)
  unlocked.add('decree-blueprint')
  expect(game.shop.purchase(offer.id).success).toBe(true)
  expect(state.gold).toBe(92)
  expect(state.decreeSystem.getOwnedDecree('decree-blueprint')).toBeDefined()
  const saved = game.captureRun()
  unlocked.clear()
  game.restoreRun(saved)
  expect(
    game.getState().decreeSystem.getOwnedDecree('decree-blueprint')
  ).toBeDefined()
  expect(game.addDecree(definition('decree-omega'), 'generated')).toBe(false)
})

it('new pack rewards cannot bypass unlocks through rarity fallback', () => {
  runRandom.start(91)
  const packs = new BlessingPackSystem()
  const locked = new Set(gated.map((d) => d.id))
  for (let i = 0; i < 100; i++) {
    const offerings = packs.generatePackOfferings({
      flowerCount: 4,
      excludeTypes: ['Arcana', 'Celestial', 'Tile', 'Void'],
    })
    for (const offer of offerings)
      for (const content of offer.contents)
        if (content.type === 'Decree') {
          const id = (content.data as { id: string }).id
          expect(locked.has(id), id).toBe(false)
        }
  }
})

it('earns all six canonical unlocks and keeps legacy Blueprint records usable', () => {
  const profile = useProgressionStore.getState()
  profile.resetProgression()
  expect(gated.every((d) => !profile.isItemUnlocked(d.id))).toBe(true)
  profile.processEvent({
    type: 'run_won',
    stakeTier: 8,
    wallId: 'green_felt',
    decreesOwned: 5,
  })
  profile.updateStats({ highestActCompleted: 8 })
  profile.checkUnlocks()
  for (const id of [
    'decree-blueprint',
    'decree-brainstorm',
    'decree-clone-army',
    'decree-omega',
  ])
    expect(profile.isItemUnlocked(id), id).toBe(true)
  profile.processEvent({ type: 'yakuman_scored' })
  expect(profile.isItemUnlocked('decree-heavenly-ordinance')).toBe(true)
  expect(profile.isItemUnlocked('decree-yakuman-blessing')).toBe(false)
  profile.processEvent({ type: 'yakuman_scored' })
  profile.processEvent({ type: 'run_started' })
  profile.processEvent({ type: 'yakuman_scored' })
  expect(profile.isItemUnlocked('decree-yakuman-blessing')).toBe(false)
  profile.processEvent({ type: 'yakuman_scored' })
  profile.processEvent({ type: 'yakuman_scored' })
  expect(profile.isItemUnlocked('decree-yakuman-blessing')).toBe(true)
  profile.processEvent({ type: 'run_started' })
  expect(profile.isItemUnlocked('decree-yakuman-blessing')).toBe(true)
  expect(useProgressionStore.getState().stats.currentRunYakumanScored).toBe(0)
  expect(useProgressionStore.getState().stats.maxYakumanInRun).toBe(3)
  useProgressionStore.setState({
    stats: freshStats(),
    unlocks: {
      unlock_blueprint: {
        id: 'unlock_blueprint',
        category: 'decree',
        unlocksId: 'blueprint',
        unlockedAt: 123,
      },
    },
  })
  expect(profile.isItemUnlocked('decree-blueprint')).toBe(true)
})

it('Full Unlock includes every gated Decree without fabricating wins or Yakuman', () => {
  const profile = useProgressionStore.getState()
  profile.resetProgression()
  const before = useProgressionStore.getState().stats
  profile.enableFullUnlock()
  expect(gated.every((d) => profile.isItemUnlocked(d.id))).toBe(true)
  expect(useProgressionStore.getState().stats).toEqual(before)
})
