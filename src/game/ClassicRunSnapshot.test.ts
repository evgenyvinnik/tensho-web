import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { Tile, TileSuit } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { EnhancementType, SealType } from '../core/TileModifier'
import { THE_CLUB } from '../config/mandateDefinitions'
import { useOmenStore } from '../stores/omenStore'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import { BlessingPackSystem } from '../systems/BlessingPackSystem'
import { captureMetaProgressionRunContext } from './RunMetaContext'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
  resetMetaProgressionRunContext,
} from './MetaProgressionBridge'
import { useProgressionStore } from '../stores/progressionStore'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'

function json<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
function start(seed = 7, style = 'green_felt') {
  const game = new GameOrchestrator()
  game.startNewRun(seed, 1, style)
  return game
}
function play(game: GameOrchestrator) {
  return game.processAction({
    type: 'play',
    tileIds: game
      .getHandTiles()
      .slice(0, 2)
      .map((t) => t.id),
  })
}
function shopFixture() {
  const game = start()
  const state = game.getState() as OrchestratorState
  Object.assign(state, {
    phase: 'shop',
    lastCompletedRoundType: 'Small',
    gold: 100,
  })
  expect(game.shop.open()).toBe(true)
  return game
}

afterEach(() => {
  shutdownMetaProgressionBridge()
  resetMetaProgressionRunContext()
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
  eventBus.clear()
  vi.restoreAllMocks()
})

it('round-trips every authoritative collection, modifier and internal subsystem through JSON', () => {
  const game = start(413, 'dragons_den')
  const state = game.getState() as OrchestratorState
  const tile = new Tile(TileSuit.Pinzu, 5, 'roundtrip-tile', true)
    .withEnhancement(EnhancementType.Steel)
    .withSeal(SealType.Red)
  state.handTiles[0] = tile
  state.selectedTileIds.add(tile.id)
  state.faceDownTileIds.add(tile.id)
  state.summerReserve = [new Tile(TileSuit.Souzu, 3, 'reserved')]
  state.melds = [
    new Meld(
      MeldType.Triplet,
      [1, 2, 3].map((n) => new Tile(TileSuit.Manzu, 3, `meld-${n}`)),
      false
    ),
  ]
  state.yakuPlayCounts.set('tanyao', 4)
  state.currentRoundYakuIds.add('tanyao')
  state.previousRoundYakuIds.add('yakuhai')
  state.temporaryDecreeSlotPenalty = 1
  state.pendingActReduction = 2
  state.deadWallWritUsedThisRound = true
  const copyHistory = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_hermit
  )
  state.fateSealSystem.setLastUsedConsumable(copyHistory)
  useOmenStore.getState().addTag('double_omen')
  useOmenStore.getState().setLockedSeason('Winter', 'lock')
  useOmenStore.setState({ noInterestRounds: 2, handsPlayedThisRun: 5 })
  const saved = json(game.captureRun())
  game.restoreRun(saved)
  expect(json(game.captureRun())).toEqual(saved)
  expect(game.getState().lastHandScore).toBeUndefined()
  expect(game.getState().handTiles[0]).toBeInstanceOf(Tile)
  expect(game.getState().handTiles[0].hasHeldEffect).toBe(true)
  expect(game.getState().melds[0]).toBeInstanceOf(Meld)
  expect(game.getState().melds[0].typeKey).toBe('triplet-manzu-3')
  expect(game.getState().fateSealSystem.getLastUsedConsumable()).toEqual(
    copyHistory
  )
  expect(useOmenStore.getState().hasDoubleOmenActive).toBe(true)
  expect(Object.isFrozen(game.getState().tableModifiers)).toBe(true)
})

it.each([7, 19, 413, 991])(
  'continues a real play with identical score, resources, tiles and random cursors (seed %i)',
  (seed) => {
    const game = start(seed)
    const saved = json(game.captureRun())
    const result = json(play(game))
    expect(result.success).toBe(true)
    const after = game.captureRun()
    game.restoreRun(saved)
    expect(json(play(game))).toEqual(result)
    const resumed = game.captureRun()
    expect(json(resumed.state)).toEqual(json(after.state))
    expect(resumed.random).toEqual(after.random)
    expect(resumed.omens).toEqual(after.omens)
  }
)

it('links the restored current round to the Act ledger before further scoring', () => {
  const game = start()
  game.restoreRun(json(game.captureRun()))
  const manager = game.getState().roundManager
  const round = manager.getCurrentRound()!
  expect(manager.getCurrentAct()!.rounds[0]).toBe(round)
  manager.submitScore(42)
  expect(manager.getCurrentAct()!.rounds[0].currentScore).toBe(42)
})

it('reattaches Mandate cleanup to the restored Debuff system', () => {
  const game = start()
  const state = game.getState()
  const tile = new Tile(TileSuit.Souzu, 3, 'boss-tile')
  state.mandateEffectSystem.activateMandate(THE_CLUB, [tile], [])
  expect(state.debuffSystem.isTileDebuffed(tile.id)).toBe(true)
  game.restoreRun(json(game.captureRun()))
  const restored = game.getState()
  expect(restored.debuffSystem.isTileDebuffed(tile.id)).toBe(true)
  restored.mandateEffectSystem.deactivateMandate()
  expect(restored.debuffSystem.isTileDebuffed(tile.id)).toBe(false)
})

it('retains consumed Seal quota and copy history instead of granting another use', () => {
  const game = start()
  const first = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_hermit
  )
  expect(game.addFateSeal(first)).toBe(true)
  expect(
    game.processAction({ type: 'useSeal', sealId: first.instanceId }).success
  ).toBe(true)
  const second = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_hermit
  )
  expect(game.addFateSeal(second)).toBe(true)
  const saved = json(game.captureRun())
  game.restoreRun(saved)
  expect(
    game.processAction({ type: 'useSeal', sealId: second.instanceId }).success
  ).toBe(false)
  expect(json(game.captureRun().state)).toEqual(saved.state)
  expect(game.getState().fateSealSystem.getLastUsedConsumable()?.id).toBe(
    first.id
  )
})

it('resumes a purchased pending tile pack without payment, reroll or a second claim', () => {
  const game = shopFixture()
  const offer = game.shop.state.packOfferings[0]
  const pack = game.shop.packOfferings.find((p) => p.pack.id === offer.item.id)!
  // Deliberate reward fixture; use the canonical payment and claim methods.
  pack.contents = new BlessingPackSystem().generateOfferingsForPacks([
    {
      id: 'tile-fixture',
      type: 'Tile',
      size: 'Normal',
      cost: 4,
      choiceCount: 3,
      selectCount: 1,
    },
  ])[0].contents
  expect(game.shop.purchase(offer.id).success).toBe(true)
  const saved = json(game.captureRun())
  const beforeGold = game.getState().gold
  const beforeWall = game.getState().wallTemplate.length
  const notifications = vi.fn()
  const stop = eventBus.on('goldChanged', notifications)
  game.restoreRun(saved)
  expect(notifications).not.toHaveBeenCalled()
  stop()
  expect(game.shop.isOpen).toBe(true)
  expect(game.shop.pendingPack).toBe(
    game.shop.packOfferings.find((p) => p.pack.id === pack.pack.id)
  )
  expect(game.shop.open()).toBe(true)
  expect(json(game.captureRun().shop)).toEqual(saved.shop)
  expect(game.shop.reroll().success).toBe(false)
  expect(game.shop.close()).toBe(false)
  expect(game.shop.confirmPack([0]).success).toBe(true)
  expect(game.getState().gold).toBe(beforeGold)
  expect(game.getState().wallTemplate).toHaveLength(beforeWall + 1)
  expect(game.shop.pendingPack).toBeNull()
  const claimed = json(game.captureRun())
  game.restoreRun(claimed)
  expect(game.shop.confirmPack([0]).success).toBe(false)
  expect(game.shop.purchase(offer.id).success).toBe(false)
  expect(game.getState().wallTemplate).toHaveLength(beforeWall + 1)
})

it('keeps the current shop stock, Omen history and visit totals on reopening', () => {
  const game = shopFixture()
  expect(game.shop.reroll().success).toBe(true)
  const saved = json(game.captureRun())
  game.restoreRun(saved)
  expect(game.shop.open()).toBe(true)
  expect(json(game.captureRun())).toEqual(saved)
})

it('does not share mutable snapshot objects with the live or restored run', () => {
  const game = start()
  const saved = game.captureRun()
  saved.state.handTiles[0].rank = 9
  expect(game.getState().handTiles[0].rank).not.toBe(9)
  game.restoreRun(saved)
  saved.state.handTiles[0].rank = 8
  saved.state.decreeSystem.ownedDecrees.length = 0
  expect(game.getState().handTiles[0].rank).toBe(9)
  expect(game.getState().decreeSystem.getOwnedDecrees()).not.toHaveLength(0)
})

it.each(['pending', 'random', 'omen-random', 'counter', 'seed'] as const)(
  'rejects invalid staged %s data without touching the live run or global state',
  (kind) => {
    const game = shopFixture()
    useOmenStore.getState().addTag('double_omen')
    const before = json(game.captureRun())
    const invalid = json(before)
    if (kind === 'pending') invalid.shop.pendingPackId = 'missing-paid-pack'
    if (kind === 'random') invalid.random.streams.shop = -1
    if (kind === 'omen-random') invalid.state.omenSystem.randomCursor = -1
    if (kind === 'counter') invalid.runtimeItemCounter = -1
    if (kind === 'seed') invalid.random.seed!++
    const notify = vi.fn()
    const stop = useOmenStore.subscribe(notify)
    expect(() => game.restoreRun(invalid)).toThrow()
    expect(json(game.captureRun())).toEqual(before)
    expect(notify).not.toHaveBeenCalled()
    stop()
  }
)

it('rejects in-flight snapshots and publishes a load only after all references are live', () => {
  const game = start()
  const attempts: boolean[] = []
  eventBus.on('tileDrawn', () => {
    try {
      game.captureRun()
      attempts.push(true)
    } catch {
      attempts.push(false)
    }
  })
  expect(play(game).success).toBe(true)
  expect(attempts.length).toBeGreaterThan(0)
  expect(attempts.every((success) => !success)).toBe(true)
  const saved = json(game.captureRun())
  const loaded = vi.fn(() =>
    expect(game.getState().handTiles[0]).toBeInstanceOf(Tile)
  )
  eventBus.on('gameLoaded', loaded)
  game.restoreRun(saved)
  expect(loaded).toHaveBeenCalledOnce()
})

it('restores meta context without replaying run starts, rewards or persistent statistics', () => {
  initializeMetaProgressionBridge()
  const game = start()
  eventBus.emit('flowerCollected', { flowerType: 'Plum', totalFlowers: 1 })
  eventBus.emit('seasonCorrupted', {
    corruptedType: 'Monsoon',
    effect: 'fixture',
  })
  const saved = json(game.captureRun())
  const profile = () =>
    structuredClone({
      progression: useProgressionStore.getState().stats,
      achievements: useAchievementStore.getState().stats,
      archive: useArchiveStore.getState().currentRunItems,
    })
  const before = profile()
  const starts = vi.fn()
  eventBus.on('runStart', starts)
  resetMetaProgressionRunContext()
  game.restoreRun(saved)
  expect(captureMetaProgressionRunContext()).toEqual(saved.meta)
  expect(profile()).toEqual(before)
  expect(starts).not.toHaveBeenCalled()
})

it('retains a secured victory and enters Endless without paying the win twice', () => {
  const game = start()
  const state = game.getState() as OrchestratorState
  state.roundManager.startAct(8)
  state.roundManager.skipRound()
  state.roundManager.skipRound()
  state.roundManager.getCurrentRound()!.bossMandate = undefined
  state.mandateEffectSystem.deactivateMandate()
  Object.assign(state, {
    currentAct: 8,
    currentRound: 3,
    score: 0,
    targetScore: 1,
  })
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(play(game).success).toBe(true)
  expect(game.getState().hasWonRun).toBe(true)
  const saved = json(game.captureRun())
  const ended = vi.fn()
  eventBus.on('runEnd', ended)
  game.restoreRun(saved)
  expect(game.continueEndless()).toBe(true)
  expect(game.continueEndless()).toBe(false)
  expect(game.getState().gold).toBe(saved.state.gold)
  expect(ended).not.toHaveBeenCalled()
})
