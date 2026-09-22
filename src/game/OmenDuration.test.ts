import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { Tile, TileSuit } from '../core/Tile'

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

it('ages the prior round restriction on skip, without spending the freshly earned restriction', () => {
  const { game, state } = start(19)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  expect(state.omenSystem.isInterestBlocked()).toBe(true)
  expect(state.gold).toBe(115)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  expect(state.omenSystem.isInterestBlocked()).toBe(false)
  expect(state.gold).toBe(125) // Speed, not a skipped-round payout.
  win(game)
  expect(state.lastRoundSummary!.interest).toBe(5)
})

it('still withholds interest if the restricted incoming round is played, then expires', () => {
  const { game, state } = start(19)
  game.processAction({ type: 'skip' })
  win(game)
  expect(state.lastRoundSummary!.interest).toBe(0)
  expect(state.omenSystem.isInterestBlocked()).toBe(false)
})

it('counts a skipped round against an earned three-round interest boost', () => {
  const { game, state } = start(1)
  game.processAction({ type: 'skip' })
  expect(state.omenSystem.getInterestCapBonus()).toBe(2)
  game.processAction({ type: 'skip' })
  // Large was skipped: only Boss and the next Small remain boosted.
  win(game)
  expect(state.lastRoundSummary!.interest).toBe(7)
  expect(state.omenSystem.getInterestCapBonus()).toBe(2)
  state.omenSystem.onRoundEnd()
  expect(state.omenSystem.getInterestCapBonus()).toBe(0)
})

it('does not age duration effects on a rejected Boss skip', () => {
  const { game, state } = start(1)
  game.processAction({ type: 'skip' })
  game.processAction({ type: 'skip' })
  expect(game.processAction({ type: 'skip' }).success).toBe(false)
  state.omenSystem.onRoundEnd()
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
