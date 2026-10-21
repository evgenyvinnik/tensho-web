import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { THE_EYE } from '../config/mandateDefinitions'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'
import type { ScoreBreakdown } from '../rules/ScoringEngine'

/** The repetition factor: the final Mult over its additive parts. */
const repetitionFactor = (score: ScoreBreakdown) =>
  score.equation!.multiplier /
  (score.yakuMultiplier + score.pattern.mult + score.dragonMult)

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})
function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'yaku_repetition_charter')!
  )
  return game
}
function deal(game: GameOrchestrator, clear = true) {
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.faceDownTileIds.clear()
  state.targetScore = clear ? 1 : 1e12
  state.roundManager.getCurrentRound()!.scoreTarget = state.targetScore
  state.handTiles = [
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
      (rank, i) => new Tile(TileSuit.Souzu, rank, `run-${i}`)
    ),
    ...[6, 6, 6].map(
      (rank, i) => new Tile(TileSuit.Manzu, rank, `triplet-${i}`)
    ),
    ...[5, 5].map((rank, i) => new Tile(TileSuit.Pinzu, rank, `pair-${i}`)),
  ]
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  return state.handTiles.map((tile) => tile.id)
}

it('compounds each matching family over consecutive rounds, without preview/reload growth', () => {
  const game = fixture()
  for (let round = 0; round < 4; round++) {
    const ids = deal(game)
    const before = game.captureRun()
    const forecast = game.previewScore(ids)!
    const families = forecast.detectedYaku.length
    expect(families).toBeGreaterThan(0)
    expect(repetitionFactor(forecast)).toBeCloseTo(
      Math.min(4, 1.2 ** (round * families))
    )
    expect(game.previewScore(ids)).toEqual(forecast)
    expect(game.captureRun()).toEqual(before)
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(game.getState().score).toBe(forecast.finalScore)
    const saved = parseClassicRunSnapshot(
      JSON.parse(JSON.stringify(game.captureRun()))
    )
    game.restoreRun(saved)
    expect(game.captureRun()).toEqual(saved)
    game.exitShop()
    expect(game.getState().phase).toBe('gameplay')
  }
})

it('pays no repetition bonus on a hand the Eye blocks', () => {
  const game = fixture()
  const ids = deal(game, false)
  const state = game.getState() as OrchestratorState
  state.previousRoundYakuIds = new Set(
    game.previewScore(ids)!.detectedYaku.map((y) => y.definition.id)
  )
  state.mandateEffectSystem.activateMandate(
    THE_EYE,
    state.handTiles,
    state.decreeSystem.getOwnedDecrees()
  )
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    playedPatternIds: ['mahjong'],
  })
  const score = game.previewScore(ids)!
  expect(score.blockedByMandate).toBe(true)
  expect(score.detectedYaku).toEqual([])
  expect(score.finalScore).toBe(0)
})

it('grows only at round settlement, retains unused families during the round, and breaks them after a miss', () => {
  const game = fixture()
  let ids = deal(game)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  const earned = { ...game.getState().previousRoundYakuStreaks }
  expect(Object.values(earned).every((n) => n === 1)).toBe(true)
  game.exitShop()
  for (let play = 0; play < 2; play++) {
    ids = deal(game, false)
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(game.getState().previousRoundYakuStreaks).toEqual(earned)
  }
  // A tactical clear does not erase full-hand Yaku already scored this round.
  ids = deal(game)
  expect(
    game.processAction({ type: 'play', tileIds: ids.slice(0, 3) }).success
  ).toBe(true)
  expect(
    Object.values(game.getState().previousRoundYakuStreaks!).every(
      (n) => n === 2
    )
  ).toBe(true)
  game.exitShop()
  ids = deal(game)
  expect(
    game.processAction({ type: 'play', tileIds: ids.slice(0, 3) }).success
  ).toBe(true)
  expect(game.getState().previousRoundYakuStreaks).toEqual({})
  game.exitShop()
  const forecast = game.previewScore(deal(game))!
  expect(repetitionFactor(forecast)).toBe(1)
})

it('starts a fresh run without history', () => {
  const game = fixture()
  expect(
    game.processAction({ type: 'play', tileIds: deal(game) }).success
  ).toBe(true)
  expect(
    Object.keys(game.getState().previousRoundYakuStreaks ?? {}).length
  ).toBeGreaterThan(0)
  expect(game.getState().previousRoundYakuIds.size).toBeGreaterThan(0)
  game.startNewRun(8)
  expect(game.getState().previousRoundYakuStreaks).toBeUndefined()
  expect(game.getState().previousRoundYakuIds.size).toBe(0)
})

it('preserves legacy history without inventing earlier rounds and validates new history strictly', () => {
  const game = fixture()
  const ids = deal(game, false)
  const state = game.getState() as OrchestratorState
  state.previousRoundYakuIds = new Set(['ittsu'])
  const legacy = JSON.parse(JSON.stringify(game.captureRun()))
  delete legacy.state.previousRoundYakuStreaks
  game.restoreRun(parseClassicRunSnapshot(legacy))
  expect(game.captureRun()).toEqual(legacy)
  const forecast = game.previewScore(ids)!
  expect(repetitionFactor(forecast)).toBeCloseTo(1.2)
  for (const history of [
    { ittsu: 0 },
    { ittsu: -1 },
    { ittsu: 1.5 },
    { ittsu: '2' },
    { ittsu: null },
    {},
    { ittsu: 2, tanyao: 1 },
  ]) {
    const corrupt = structuredClone(legacy)
    corrupt.state.previousRoundYakuStreaks = history
    expect(() => parseClassicRunSnapshot(corrupt)).toThrow(
      /previousRoundYakuStreaks/
    )
  }
  const valid = structuredClone(legacy)
  valid.state.previousRoundYakuStreaks = { ittsu: 4 }
  game.restoreRun(parseClassicRunSnapshot(valid))
  expect(game.captureRun()).toEqual(valid)
  expect(repetitionFactor(game.previewScore(ids)!)).toBeCloseTo(1.2 ** 4)
})

it('caps the bonus, copies it per active Decree, and lets suppression/Frostbite reduce it', () => {
  const game = fixture()
  const ids = deal(game, false)
  const state = game.getState() as OrchestratorState
  state.previousRoundYakuIds = new Set(['ittsu'])
  state.previousRoundYakuStreaks = { ittsu: 50 }
  const repetition = state.decreeSystem.getOwnedDecrees()[0]
  const ratio = () => repetitionFactor(game.previewScore(ids)!)
  expect(ratio()).toBeCloseTo(4)
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'decree-brainstorm')!
  )
  expect(ratio()).toBeCloseTo(16)
  state.seasonSystem.forceSetSeason('Winter', true)
  expect(ratio()).toBeCloseTo(1 + (16 - 1) * 0.5)
  state.seasonSystem.clear()
  repetition.isDebuffed = true
  expect(ratio()).toBe(1)
})
