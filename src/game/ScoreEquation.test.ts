import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus, type GameEventData } from './EventBus'
import { Tile, TileSuit } from '../core/Tile'
import { VoidScriptSystem } from '../systems/VoidScriptSystem'
import { useOmenStore } from '../stores/omenStore'
import {
  SCORE_SURGE_OMEN,
  MULTIPLICATION_OMEN,
} from '../config/omenDefinitions'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem
    .getOwnedDecrees()
    .forEach((d) => state.decreeSystem.removeDecree(d.id))
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  state.wall = Array.from(
    { length: 80 },
    (_, i) => new Tile(TileSuit.Manzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.handsRemaining = 10
  return game
}

function deal(game: GameOrchestrator, complete: boolean) {
  const tiles = complete
    ? [
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
          (rank, i) => new Tile(TileSuit.Souzu, rank, `sequence-${i}`)
        ),
        ...[6, 6, 6].map(
          (rank, i) => new Tile(TileSuit.Manzu, rank, `triplet-${i}`)
        ),
        ...[5, 5].map((rank, i) => new Tile(TileSuit.Pinzu, rank, `pair-${i}`)),
      ]
    : [4, 5, 6].map((rank, i) => new Tile(TileSuit.Souzu, rank, `partial-${i}`))
  ;(game.getState() as OrchestratorState).handTiles = tiles
  return tiles.map((tile) => tile.id)
}

function pay(game: GameOrchestrator, ids: string[]) {
  const before = game.getState().score
  const preview = game.previewScore(ids)!
  let payment: GameEventData['handPlayed'] | undefined
  const off = eventBus.on('handPlayed', (data) => {
    payment = data
  })
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  off()
  expect(payment).toBeDefined()
  const equation = payment!.equation
  expect(equation).toEqual(preview.equation)
  expect(equation.total).toBe(preview.finalScore)
  expect(equation.total).toBe(game.getState().score - before)
  expect(payment!.score).toBe(equation.total)
  expect(
    Math.floor(equation.points * equation.multiplier) + equation.adjustment
  ).toBe(equation.total)
  expect(Object.isFrozen(equation)).toBe(true)
  return equation
}

it('settles complete, repeated complete, partial, and zero-paid plays independently', () => {
  const game = fixture()
  expect(pay(game, deal(game, true))).toEqual({
    points: 225,
    multiplier: 2.6,
    adjustment: 0,
    total: 585,
  })
  expect(pay(game, deal(game, true))).toEqual({
    points: 225,
    multiplier: 2.6,
    adjustment: 0,
    total: 585,
  })
  expect(pay(game, deal(game, false))).toEqual({
    points: 45,
    multiplier: 1,
    adjustment: 0,
    total: 45,
  })
  game.getState().seasonSystem.forceSetSeason('Autumn', true)
  for (let i = 0; i < 5; i++) game.getState().seasonSystem.onDiscard()
  expect(pay(game, deal(game, false))).toEqual({
    points: 45,
    multiplier: 1,
    adjustment: -45,
    total: 0,
  })
  expect(game.getState().score).toBe(1215)
})

it('includes season and loss-prevention multipliers in the receipt, not just Yaku', () => {
  const game = fixture()
  game.getState().seasonSystem.forceSetSeason('Summer')
  ;(game.getState() as OrchestratorState).lossPreventionScorePenalty = 0.5
  const receipt = pay(game, deal(game, false))
  expect(receipt.multiplier).toBeCloseTo(0.65)
  expect(receipt.total).toBe(29)
})

it.each([false, true])(
  'resettles post-score Script and Omen effects (complete=%s)',
  (complete) => {
    const game = fixture()
    const ids = deal(game, complete)
    const base = game.previewScore(ids)!.finalScore
    ;(game.getState() as OrchestratorState).voidScriptSystem =
      VoidScriptSystem.fromState({
        ...game.getState().voidScriptSystem.toState(),
        baseScoreHalved: true,
      })
    useOmenStore.getState().addOmen(SCORE_SURGE_OMEN)
    useOmenStore.getState().addOmen(MULTIPLICATION_OMEN)
    const expected = Math.floor((Math.floor(base / 2) + 100) * 1.5)
    expect(game.previewScore(ids)!.finalScore).toBe(expected)
    expect(game.previewScore(ids)!.finalScore).toBe(expected)
    const receipt = pay(game, ids)
    expect(receipt.total).toBe(expected)
    expect(receipt.adjustment).not.toBe(0)
    expect(
      game.getState().omenSystem.peekHandScoredOmens().consumedOmenIds
    ).toEqual([])
    expect(game.getState().voidScriptSystem.isBaseScoreHalved()).toBe(false)
  }
)
