import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'

afterEach(() => eventBus.clear())

// Late-run fixtures isolate settlement from reach and randomized boss rules.
function prepareBoss(game: GameOrchestrator, act = 8) {
  const state = game.getState() as OrchestratorState
  state.roundManager.startAct(act)
  state.roundManager.skipRound()
  state.roundManager.skipRound()
  state.roundManager.getCurrentRound()!.bossMandate = undefined
  state.mandateEffectSystem.deactivateMandate()
  state.currentAct = act
  state.currentRound = 3
  state.score = 0
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
}

function play(game: GameOrchestrator) {
  expect(
    game.processAction({
      type: 'play',
      tileIds: game
        .getHandTiles()
        .slice(0, 2)
        .map((tile) => tile.id),
    }).success
  ).toBe(true)
}

function win() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  prepareBoss(game)
  play(game)
  expect(game.getState().hasWonRun).toBe(true)
  return game
}

it.each([
  [0, 9],
  [1, 8],
  [2, 7],
  [20, 1],
])(
  'forecasts the same Boss-shop destination for reduction %i that exitShop applies',
  (reduction, nextAct) => {
    const game = win()
    game.continueEndless()
    const state = game.getState() as OrchestratorState
    state.pendingActReduction = reduction
    const managerBefore = state.roundManager.toState()
    expect(game.getNextActNumber()).toBe(nextAct)
    expect(game.getNextActNumber()).toBe(nextAct)
    expect(state.roundManager.toState()).toEqual(managerBefore)
    expect(state.pendingActReduction).toBe(reduction)
    game.exitShop()
    expect(state.currentAct).toBe(nextAct)
    expect(state.pendingActReduction).toBe(0)
    expect(state.hasEnteredEndless).toBe(true)
  }
)

it('enters Endless once only after a secured victory and resets the flag for a new run', () => {
  const game = new GameOrchestrator()
  expect(game.continueEndless()).toBe(false)
  expect(game.getState().hasEnteredEndless).toBe(false)
  game.startNewRun(7)
  expect(game.continueEndless()).toBe(false)
  prepareBoss(game)
  play(game)
  expect(game.getState().hasEnteredEndless).toBe(false)
  expect(game.continueEndless()).toBe(true)
  expect(game.getState().hasEnteredEndless).toBe(true)
  expect(game.continueEndless()).toBe(false)
  game.resetGame()
  expect(game.getState()).toMatchObject({
    hasWonRun: false,
    hasEnteredEndless: false,
  })
  game.startNewRun(8)
  expect(game.getState()).toMatchObject({
    hasWonRun: false,
    hasEnteredEndless: false,
  })
})

it.each([7, 8, 9])(
  'keeps the secured Endless outcome on defeat at Act %i without a second run completion',
  (act) => {
    const ended = vi.fn()
    eventBus.on('runEnd', ended)
    const game = win()
    expect(ended).toHaveBeenCalledTimes(1)
    expect(game.continueEndless()).toBe(true)
    game.exitShop()
    const state = game.getState() as OrchestratorState
    state.roundManager.startAct(act)
    state.currentAct = act
    state.currentRound = 1
    state.handsRemaining = 1
    state.targetScore = 1e12
    state.roundManager.getCurrentRound()!.scoreTarget = 1e12
    play(game)
    expect(state).toMatchObject({
      phase: 'gameOver',
      isRunActive: false,
      hasWonRun: true,
      hasEnteredEndless: true,
    })
    expect(game.continueEndless()).toBe(false)
    expect(ended).toHaveBeenCalledTimes(1)
  }
)

it('does not record another victory when an Endless run clears the Act 8 boss again', () => {
  const ended = vi.fn()
  eventBus.on('runEnd', ended)
  const game = win()
  game.continueEndless()
  game.exitShop()
  prepareBoss(game)
  play(game)
  expect(game.getState()).toMatchObject({
    phase: 'shop',
    hasWonRun: true,
    hasEnteredEndless: true,
  })
  expect(ended).toHaveBeenCalledTimes(1)
  expect(game.continueEndless()).toBe(false)
  game.exitShop()
  expect(game.getState().currentAct).toBe(9)
})
