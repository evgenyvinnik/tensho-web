import { afterEach, beforeEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { useProgressionStore } from '../stores/progressionStore'
import { useArchiveStore, initializeArchive } from '../stores/archiveStore'
import { useOmenStore } from '../stores/omenStore'
import { Tile, TileSuit } from '../core/Tile'
import {
  metaProgressionSystem,
  DEFAULT_LIFETIME_STATS,
} from '../systems/MetaProgressionSystem'
import { TEA_HOUSE_BASE_CHARTERS } from '../systems/TeaHouseSystem'

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

function start(seed = 7) {
  const game = new GameOrchestrator()
  game.startNewRun(seed)
  const state = game.getState() as OrchestratorState
  state.wallTemplate = state.wallTemplate.filter((tile) => !tile.isSeason)
  return { game, state }
}

function win(game: GameOrchestrator, gold: number) {
  const state = game.getState() as OrchestratorState
  state.seasonSystem.clear()
  state.flowerSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.roundManager.getCurrentAct()!.rounds.forEach((round) => {
    round.bossMandate = undefined
  })
  state.gold = gold
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  state.handTiles = [
    new Tile(TileSuit.Pinzu, 2, 'interest-a'),
    new Tile(TileSuit.Pinzu, 2, 'interest-b'),
  ]
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.map((tile) => tile.id),
    }).success
  ).toBe(true)
  expect(state.phase).toBe('shop')
  const interest = state.lastRoundSummary!.interest
  game.shop.open()
  game.exitShop()
  return interest
}

it('uses the actual Charter cap instead of counting every five-gold payout as maximum', () => {
  const { game, state } = start()
  state.charterSystem.purchaseCharter('seed_pouch')
  expect(win(game, 25)).toBe(5)
  expect(
    useProgressionStore.getState().stats.maxConsecutiveInterestRounds
  ).toBe(0)
  expect(win(game, 50)).toBe(10)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(1)
})

it('zero-interest rounds break the current streak without erasing the lifetime best', () => {
  const { game } = start()
  win(game, 25)
  win(game, 25)
  win(game, 0)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(0)
  expect(
    useProgressionStore.getState().stats.maxConsecutiveInterestRounds
  ).toBe(2)
  win(game, 25)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(1)
  expect(
    useProgressionStore.getState().stats.maxConsecutiveInterestRounds
  ).toBe(2)
})

it('an accepted skip breaks the streak, while a rejected Boss skip preserves it', () => {
  const { game } = start()
  win(game, 25)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(0)
  useProgressionStore.getState().updateStats({ currentMaxInterestRounds: 2 })
  expect(game.processAction({ type: 'skip' }).success).toBe(false)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(2)
})

it('new runs cannot combine separate interest streaks', () => {
  const { game } = start()
  win(game, 25)
  game.startNewRun(8)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(0)
  expect(
    useProgressionStore.getState().stats.maxConsecutiveInterestRounds
  ).toBe(1)
})

it('blocked interest breaks the streak even with enough savings to meet the cap', () => {
  const { game } = start()
  win(game, 100)
  useOmenStore.setState({ noInterestRounds: 1 })
  expect(win(game, 100)).toBe(0)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(0)
  expect(
    useProgressionStore.getState().stats.maxConsecutiveInterestRounds
  ).toBe(1)
})

it('unlocks Money Tree and its Archive entry on the tenth actual capped payout', () => {
  const { game } = start()
  expect(
    game.addImperialCharter(
      TEA_HOUSE_BASE_CHARTERS.find((charter) => charter.id === 'seed_pouch')!
    )
  ).toBe(true)
  for (let round = 0; round < 9; round++) win(game, 100)
  expect(useProgressionStore.getState().isItemUnlocked('money_tree')).toBe(
    false
  )
  win(game, 100)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(10)
  expect(useProgressionStore.getState().isItemUnlocked('money_tree')).toBe(true)
  expect(
    useArchiveStore.getState().getEntry('charters', 'money_tree')!.isUnlocked
  ).toBe(true)
  win(game, 0)
  expect(
    useProgressionStore.getState().stats.maxConsecutiveInterestRounds
  ).toBe(10)
  expect(useProgressionStore.getState().isItemUnlocked('money_tree')).toBe(true)
})

it('round-trips the current and best streak separately, without extending legacy saves', () => {
  const stats = {
    ...DEFAULT_LIFETIME_STATS,
    currentMaxInterestRounds: 3,
    maxConsecutiveInterestRounds: 7,
  }
  const serialized = metaProgressionSystem.serializeStats(stats)
  expect(metaProgressionSystem.deserializeStats(serialized)).toMatchObject(
    stats
  )
  const legacy = { ...serialized } as Partial<typeof serialized>
  delete legacy.currentMaxInterestRounds
  expect(
    metaProgressionSystem.deserializeStats(legacy as typeof serialized)
  ).toMatchObject({
    currentMaxInterestRounds: 0,
    maxConsecutiveInterestRounds: 7,
  })
})

it('measures an Omen-boosted cap at payout time, before the duration expires', () => {
  const { game, state } = start(1)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  expect(state.omenSystem.getInterestCapBonus()).toBe(2)
  expect(win(game, 25)).toBe(5)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(0)
  expect(win(game, 100)).toBe(7)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(1)
  expect(win(game, 100)).toBe(7)
  expect(state.omenSystem.getInterestCapBonus()).toBe(0)
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(2)
})

it('a defeat breaks the current streak without losing the best or earned unlocks', () => {
  const { game, state } = start()
  win(game, 100)
  state.handsRemaining = 1
  state.targetScore = 1000000
  state.roundManager.getCurrentRound()!.scoreTarget = state.targetScore
  state.handTiles = [
    new Tile(TileSuit.Pinzu, 2, 'loss-a'),
    new Tile(TileSuit.Pinzu, 2, 'loss-b'),
  ]
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.map((tile) => tile.id),
    }).success
  ).toBe(true)
  expect(state.phase).toBe('gameOver')
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(0)
  expect(
    useProgressionStore.getState().stats.maxConsecutiveInterestRounds
  ).toBe(1)
})

it('preview, invalid play and the positive-income notification cannot award a streak', () => {
  const { game, state } = start()
  state.handTiles = [
    new Tile(TileSuit.Pinzu, 2, 'preview-a'),
    new Tile(TileSuit.Pinzu, 2, 'preview-b'),
  ]
  game.previewScore(state.handTiles.map((tile) => tile.id))
  expect(game.processAction({ type: 'play', tileIds: [] }).success).toBe(false)
  eventBus.emit('interestEarned', { amount: 5, goldHeld: 25 })
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(0)
})

it('a zero-cap settlement cannot satisfy maximum-interest progression', () => {
  start()
  eventBus.emit('interestSettled', { amount: 0, cap: 0, goldHeld: 100 })
  expect(useProgressionStore.getState().stats.currentMaxInterestRounds).toBe(0)
  expect(
    useProgressionStore.getState().stats.maxConsecutiveInterestRounds
  ).toBe(0)
})
