import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { Tile, TileSuit } from '../core/Tile'
import { advanceRound, clearRound } from '../test/roundHelpers'
import { SWIFT_CLEAR_SPARE_TURNS } from './playRules'

afterEach(() => {
  vi.useRealTimers()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function start(seed: number) {
  const game = new GameOrchestrator()
  game.startNewRun(seed)
  const state = game.getState() as OrchestratorState
  state.wallTemplate = state.wallTemplate.filter((tile) => !tile.isSeason)
  state.roundManager.getCurrentAct()!.rounds[2].bossMandate = undefined
  state.gold = 100
  return { game, state }
}

function win(game: GameOrchestrator) {
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  // Cleared on the last Turn: no new Omen muddies the durations under test.
  state.handsRemaining = 1
  state.handTiles = [
    new Tile(TileSuit.Pinzu, 2, 'omen-duration-a'),
    new Tile(TileSuit.Pinzu, 2, 'omen-duration-b'),
  ]
  const result = game.processAction({
    type: 'play',
    tileIds: state.handTiles.map((t) => t.id),
  })
  expect(result.success).toBe(true)
}

// Omens are earned by swift clears (a Small or Large round cleared with Turns
// to spare). Existing durations age at each round's end before a new Omen is
// earned, so the new one keeps its full duration.
const swift = { spareTurns: SWIFT_CLEAR_SPARE_TURNS }

it('ages the prior round restriction at the next clear, without spending the freshly earned restriction', () => {
  const { game, state } = start(19)
  clearRound(game, swift)
  // The Small round settled its interest before earning the restriction.
  expect(state.lastRoundSummary!.interest).toBe(5)
  expect(state.omenSystem.isInterestBlocked()).toBe(true)
  game.exitShop()
  clearRound(game, swift)
  expect(state.lastRoundSummary!.interest).toBe(0)
  expect(state.lastRoundSummary!.omenId).not.toBeNull()
  expect(state.omenSystem.isInterestBlocked()).toBe(false)
  game.exitShop()
  win(game)
  expect(state.lastRoundSummary!.interest).toBe(5)
})

it('still withholds interest if the restricted incoming round is played, then expires', () => {
  const { game, state } = start(19)
  advanceRound(game, swift)
  win(game)
  expect(state.lastRoundSummary!.interest).toBe(0)
  expect(state.omenSystem.isInterestBlocked()).toBe(false)
})

it('spends an earned three-round interest boost one round at a time', () => {
  const { game, state } = start(1)
  advanceRound(game, swift)
  expect(state.omenSystem.getInterestCapBonus()).toBe(2)
  win(game)
  expect(state.lastRoundSummary!.interest).toBe(7)
  game.exitShop()
  win(game)
  expect(state.lastRoundSummary!.roundType).toBe('Boss')
  expect(state.lastRoundSummary!.interest).toBe(7)
  // Boosted for Large, Boss and the next Small.
  expect(state.omenSystem.getInterestCapBonus()).toBe(2)
  state.omenSystem.onRoundEnd()
  expect(state.omenSystem.getInterestCapBonus()).toBe(0)
})

it('earns no Omen at a Boss clear, however many Turns are spared', () => {
  const { game, state } = start(1)
  advanceRound(game, swift)
  advanceRound(game)
  clearRound(game, { spareTurns: 5 })
  expect(state.lastRoundSummary!.roundType).toBe('Boss')
  expect(state.lastRoundSummary!.omenId).toBeNull()
  expect(state.omenSystem.getInterestCapBonus()).toBe(2)
})

it('cannot erase a new Season lock while cleaning up the previous one', () => {
  vi.useFakeTimers()
  const store = useOmenStore.getState()
  store.setLockedSeason('Winter', 'first')
  expect(store.applyLockedSeason()).toBe('Winter')
  store.setLockedSeason('Summer', 'second')
  vi.runAllTimers()
  expect(useOmenStore.getState().lockedSeason?.seasonType).toBe('Summer')
  expect(store.applyLockedSeason()).toBe('Summer')
  expect(store.applyLockedSeason()).toBeNull()
})
