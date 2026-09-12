import { afterEach, describe, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import {
  CERULEAN_BELL,
  THE_NEEDLE,
  THE_PSYCHIC,
  type MandateDefinition,
} from '../config/mandateDefinitions'
import { Tile, TileSuit } from '../core/Tile'
import { buildCoachAdvice } from '../gameplay/beginnerCoach'
import { eventBus } from './EventBus'
import { useOmenStore } from '../stores/omenStore'
import {
  SCORE_SURGE_OMEN,
  MULTIPLICATION_OMEN,
} from '../config/omenDefinitions'

function gameWithBoss(mandate: MandateDefinition) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  game.getState().roundManager.getCurrentAct()!.rounds[2].bossMandate = mandate
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  return game
}

function snapshot(game: GameOrchestrator) {
  const state = game.getState()
  return {
    phase: state.phase,
    score: state.score,
    runScore: state.runScore,
    gold: state.gold,
    hands: state.handsRemaining,
    discards: state.discardsRemaining,
    redraws: state.redrawsRemaining,
    tiles: state.handTiles.map((t) => t.id),
    wall: state.wall.map((t) => t.id),
    drawIndex: state.drawIndex,
    mandate: state.mandateEffectSystem.toJSON(),
    omens: JSON.stringify(useOmenStore.getState()),
    decrees: state.decreeSystem.toState(),
  }
}

function expectRejectedWithoutMutation(game: GameOrchestrator, ids: string[]) {
  const before = snapshot(game)
  eventBus.enableHistory()
  expect(game.validatePlaySelection(ids).isValid).toBe(false)
  expect(game.previewScore(ids)).toBeNull()
  expect(game.canPerformAction({ type: 'play', tileIds: ids })).toBe(false)
  const result = game.processAction({ type: 'play', tileIds: ids })
  expect(result.success).toBe(false)
  expect(result.effects).toEqual([])
  expect(snapshot(game)).toEqual(before)
  expect(eventBus.getHistory()).toEqual([])
}

afterEach(() => {
  eventBus.clear()
  eventBus.disableHistory()
})

describe('one authoritative play validator', () => {
  it('previews stacked next-hand Omens without consuming them, then grants them once', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState() as OrchestratorState
    state.targetScore = 1e9
    state.roundManager.getCurrentRound()!.scoreTarget = 1e9
    const ids = state.handTiles.slice(0, 3).map((t) => t.id)
    const base = game.previewScore(ids)!.finalScore
    useOmenStore.getState().addOmen(SCORE_SURGE_OMEN)
    useOmenStore.getState().addOmen(MULTIPLICATION_OMEN)
    const before = snapshot(game)
    const forecast = game.previewScore(ids)!.finalScore
    expect(forecast).toBe(Math.floor((base + 100) * 1.5))
    expect(game.previewScore(ids)!.finalScore).toBe(forecast)
    expect(snapshot(game)).toEqual(before)
    const result = game.processAction({ type: 'play', tileIds: ids })
    expect(result.success).toBe(true)
    expect(state.score).toBe(forecast)
    expect(state.omenSystem.peekHandScoredOmens()).toEqual({
      scoreBonus: 0,
      multBonus: 0,
      consumedOmenIds: [],
    })
  })
  it('rejects empty, duplicate and unknown tile identities in forecasts and commits', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const ids = game
      .getHandTiles()
      .slice(0, 3)
      .map((t) => t.id)
    for (const invalid of [
      [],
      ids.slice(0, 1),
      [ids[0], ids[0]],
      [...ids, ids[0]],
      [...ids, 'missing'],
    ]) {
      expectRejectedWithoutMutation(game, invalid)
    }
  })

  it.each(['menu', 'shop', 'gameOver'] as const)(
    'does not forecast or offer plays in %s',
    (phase) => {
      const game = new GameOrchestrator()
      game.startNewRun(7)
      const ids = game
        .getHandTiles()
        .slice(0, 3)
        .map((t) => t.id)
      ;(game.getState() as OrchestratorState).phase = phase
      expectRejectedWithoutMutation(game, ids)
    }
  )

  it('rejects exhausted hands even if the selected tiles form a scoring shape', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    ;(game.getState() as OrchestratorState).handsRemaining = 0
    expectRejectedWithoutMutation(
      game,
      game
        .getHandTiles()
        .slice(0, 3)
        .map((t) => t.id)
    )
  })

  it('honors fixed hand size in the forecast, coach, controls, and committed play', () => {
    const game = gameWithBoss(THE_PSYCHIC)
    const state = game.getState()
    expectRejectedWithoutMutation(
      game,
      state.handTiles.slice(0, 3).map((t) => t.id)
    )
    eventBus.disableHistory()
    const advice = buildCoachAdvice({
      tiles: state.handTiles,
      scoreSelection: (ids) => game.previewScore(ids)?.finalScore ?? null,
      remainingToTarget: state.targetScore,
      handsRemaining: state.handsRemaining,
    })
    expect(advice).not.toBeNull()
    expect(advice!.best.tileIds).toHaveLength(5)
    expect(
      game.canPerformAction({ type: 'play', tileIds: advice!.best.tileIds })
    ).toBe(true)
    const before = state.score
    const forecast = game.previewScore(advice!.best.tileIds)!.finalScore
    expect(
      game.processAction({ type: 'play', tileIds: advice!.best.tileIds })
        .success
    ).toBe(true)
    expect(state.score - before).toBe(forecast)
  })

  it('requires locked physical tiles and includes them in coach candidates', () => {
    const game = gameWithBoss(CERULEAN_BELL)
    const state = game.getState()
    const required = state.mandateEffectSystem.getLockedTileIds()
    expect(required.length).toBeGreaterThan(0)
    const unlocked = state.handTiles
      .filter((t) => !required.includes(t.id))
      .slice(0, 3)
      .map((t) => t.id)
    expectRejectedWithoutMutation(game, unlocked)
    const advice = buildCoachAdvice({
      tiles: state.handTiles,
      requiredTileIds: required,
      scoreSelection: (ids) => game.previewScore(ids)?.finalScore ?? null,
      remainingToTarget: state.targetScore,
      handsRemaining: state.handsRemaining,
    })
    expect(advice).not.toBeNull()
    for (const id of required) expect(advice!.best.tileIds).toContain(id)
    expect(
      game.processAction({ type: 'play', tileIds: advice!.best.tileIds })
        .success
    ).toBe(true)
  })

  it('does not let a resource bonus bypass the single-hand mandate', () => {
    const game = gameWithBoss(THE_NEEDLE)
    const state = game.getState() as OrchestratorState
    // Isolate the rule from automatic round loss: one of two granted hands spent.
    state.handsAllowance = 2
    state.handsRemaining = 1
    expectRejectedWithoutMutation(
      game,
      state.handTiles.slice(0, 3).map((t) => t.id)
    )
  })

  it('considers a complete visible Mahjong hand but still rejects it under the Psychic', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const tiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 2, 2, 2, 4, 4].map(
      (rank, i) => new Tile(TileSuit.Souzu, rank, `complete-${i}`)
    )
    const state = game.getState() as OrchestratorState
    state.handTiles = tiles
    const ids = tiles.map((t) => t.id)
    expect(game.isCompleteHand(ids)).toBe(true)
    expect(game.previewScore(ids)).not.toBeNull()
    const priced: string[][] = []
    buildCoachAdvice({
      tiles,
      scoreSelection: (selection) => {
        priced.push(selection)
        return game.previewScore(selection)?.finalScore ?? null
      },
      remainingToTarget: state.targetScore,
      handsRemaining: state.handsRemaining,
    })
    expect(priced).toContainEqual(ids)
    state.mandateEffectSystem.activateMandate(THE_PSYCHIC, tiles, [])
    expectRejectedWithoutMutation(game, ids)
    expect(game.isCompleteHand(ids)).toBe(true)
  })

  it('rejects an oversized incomplete selection before score effects are emitted', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    expectRejectedWithoutMutation(
      game,
      game
        .getHandTiles()
        .slice(0, 6)
        .map((t) => t.id)
    )
  })
})
