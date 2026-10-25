import { afterEach, expect, it, vi } from 'vitest'
import { NORMAL_RUN_ACTS } from '../config/runProgression'
import { THE_CLUB, getMandateById } from '../config/mandateDefinitions'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { resetMetaProgressionRunContext } from './MetaProgressionBridge'
import { useOmenStore } from '../stores/omenStore'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  resetMetaProgressionRunContext()
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
})

function start(act = 1, round = 1) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.roundManager.startAct(act)
  for (let index = 1; index < round; index++) state.roundManager.skipRound()
  state.currentAct = act
  state.currentRound = round
  state.targetScore = state.roundManager.getCurrentRound()!.scoreTarget
  return game
}

function resume(game: GameOrchestrator) {
  const saved = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  game.restoreRun(saved)
  return saved
}

// Test lifecycle, not balance: leave action debits and payouts live, lower only
// the score requirement and remove the randomized boss restriction.
function clearRound(game: GameOrchestrator) {
  const state = game.getState() as OrchestratorState
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  state.roundManager.getCurrentRound()!.bossMandate = undefined
  state.mandateEffectSystem.deactivateMandate()
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

it('settles exactly 18 rounds before offering optional Act 7, including checkpoint resumes', () => {
  expect(NORMAL_RUN_ACTS).toBe(6)
  const ended = vi.fn()
  const cashouts = vi.fn()
  eventBus.on('runEnd', ended)
  eventBus.on('interestSettled', cashouts)
  const game = start()
  for (let completed = 1; completed <= NORMAL_RUN_ACTS * 3; completed++) {
    expect(game.getState()).toMatchObject({
      currentAct: Math.ceil(completed / 3),
      currentRound: ((completed - 1) % 3) + 1,
      phase: 'gameplay',
      hasWonRun: false,
    })
    expect(game.continueEndless()).toBe(false)
    clearRound(game)
    resume(game)
    if (completed < NORMAL_RUN_ACTS * 3) {
      expect(game.getState().phase).toBe('shop')
      expect(ended).not.toHaveBeenCalled()
      game.exitShop()
    }
  }
  expect(ended).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ victory: true, act: 6, round: 3 })
  )
  expect(cashouts).toHaveBeenCalledTimes(18)
  const saved = resume(game)
  game.exitShop()
  expect(game.getState().phase).toBe('gameOver')
  expect(game.continueEndless()).toBe(true)
  resume(game)
  expect(game.continueEndless()).toBe(false)
  expect(game.getState().gold).toBe(saved.state.gold)
  game.exitShop()
  expect(game.getState()).toMatchObject({
    currentAct: 7,
    currentRound: 1,
    hasWonRun: true,
    hasEnteredEndless: true,
  })
  expect(ended).toHaveBeenCalledTimes(1)
  expect(cashouts).toHaveBeenCalledTimes(18)
})

it.each([7, 8])(
  'lets an old in-progress Act %i save finish its current boss, not win on load',
  (act) => {
    const game = start(act)
    const ended = vi.fn()
    eventBus.on('runEnd', ended)
    resume(game)
    for (let round = 1; round <= 3; round++) {
      expect(game.getState().hasWonRun).toBe(false)
      clearRound(game)
      resume(game)
      if (round < 3) {
        expect(game.getState().phase).toBe('shop')
        expect(ended).not.toHaveBeenCalled()
        game.exitShop()
      }
    }
    expect(game.getState()).toMatchObject({
      phase: 'gameOver',
      currentAct: act,
      hasWonRun: true,
    })
    expect(ended).toHaveBeenCalledTimes(1)
    const gold = game.getState().gold
    expect(game.continueEndless()).toBe(true)
    game.exitShop()
    expect(game.getState().currentAct).toBe(act + 1)
    expect(game.getState().gold).toBe(gold)
    expect(ended).toHaveBeenCalledTimes(1)
  }
)

it('refreshes old Act 8 Showdown minAct metadata without rewriting earned scores or targets', () => {
  const game = start(8, 3)
  const state = game.getState() as OrchestratorState
  const boss = state.roundManager.getCurrentRound()!
  state.mandateEffectSystem.activateMandate(
    getMandateById(boss.bossMandate!.id)!,
    state.handTiles,
    state.decreeSystem.getOwnedDecrees()
  )
  const raw = JSON.parse(JSON.stringify(game.captureRun()))
  raw.state.roundManager.currentRound.bossMandate.minAct = 8
  raw.state.roundManager.currentAct.rounds[2].bossMandate.minAct = 8
  raw.state.mandateEffectSystem.activeMandate.minAct = 8
  // Historical targets can differ from the new, gentler curve.
  raw.state.targetScore = 180000
  raw.state.roundManager.currentRound.scoreTarget = 180000
  raw.state.roundManager.currentAct.rounds[2].scoreTarget = 180000
  raw.state.score = 1234
  raw.state.runScore = 5678
  const saved = parseClassicRunSnapshot(raw)
  expect(saved.state.roundManager.currentRound!.bossMandate!.minAct).toBe(6)
  expect(saved.state.mandateEffectSystem.activeMandate!.minAct).toBe(6)
  game.restoreRun(saved)
  expect(game.getState()).toMatchObject({
    score: 1234,
    runScore: 5678,
    targetScore: 180000,
    hasWonRun: false,
  })
  expect(game.getState().roundManager.getCurrentRound()!.scoreTarget).toBe(
    180000
  )
  expect(raw.state.roundManager.currentRound.bossMandate.minAct).toBe(8)
  clearRound(game)
  expect(game.getState().hasWonRun).toBe(true)
})

it('keeps a saved standard Act 6 boss playable and awards victory when it clears', () => {
  const game = start(6, 3)
  const state = game.getState() as OrchestratorState
  const { id, name, japaneseName, description, effect, minAct } = THE_CLUB
  state.roundManager.getCurrentRound()!.bossMandate = {
    id,
    name,
    japaneseName,
    description,
    effect,
    minAct,
  }
  state.mandateEffectSystem.activateMandate(
    THE_CLUB,
    state.handTiles,
    state.decreeSystem.getOwnedDecrees()
  )
  resume(game)
  expect(game.getState().roundManager.getCurrentRound()!.bossMandate!.id).toBe(
    THE_CLUB.id
  )
  clearRound(game)
  expect(game.getState().hasWonRun).toBe(true)
})

it.each([6, 8])(
  'does not replay Act %i boss settlement or victory after restore',
  (act) => {
    const game = start(act, 3)
    clearRound(game)
    const saved = resume(game)
    const ended = vi.fn()
    const cashouts = vi.fn()
    eventBus.on('runEnd', ended)
    eventBus.on('interestSettled', cashouts)
    const harness = game as unknown as { handleRoundWin: (effects: []) => void }
    harness.handleRoundWin([])
    expect(game.getState().gold).toBe(saved.state.gold)
    expect(game.getState().phase).toBe('gameOver')
    expect(game.continueEndless()).toBe(true)
    resume(game)
    harness.handleRoundWin([])
    expect(game.getState().gold).toBe(saved.state.gold)
    expect(ended).not.toHaveBeenCalled()
    expect(cashouts).not.toHaveBeenCalled()
  }
)
