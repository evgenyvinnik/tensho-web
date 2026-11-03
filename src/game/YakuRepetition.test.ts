/**
 * Pattern Repetition Charter (`yaku_repetition_charter`): a play pattern
 * played in back-to-back rounds compounds ×1.2 per earlier round in its
 * streak, capped at ×4 before Flowers.
 */
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
/** Deal Two Pairs (2m 2m 5p 5p), a Pair (1s 1s) and spares. */
function deal(game: GameOrchestrator, clear = true) {
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.faceDownTileIds.clear()
  state.targetScore = clear ? 1 : 1e12
  state.roundManager.getCurrentRound()!.scoreTarget = state.targetScore
  const make = (suit: TileSuit, ranks: number[], key: string) =>
    ranks.map((rank, i) => new Tile(suit, rank, `${key}-${i}`))
  state.handTiles = [
    ...make(TileSuit.Manzu, [2, 2], 'pm'),
    ...make(TileSuit.Pinzu, [5, 5], 'pp'),
    ...make(TileSuit.Souzu, [1, 1], 'pair'),
    ...make(TileSuit.Manzu, [9, 7, 4], 'spare'),
  ]
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  const ids = state.handTiles.map((tile) => tile.id)
  return { twoPairs: ids.slice(0, 4), pair: ids.slice(4, 6) }
}

it('compounds a repeated pattern over consecutive rounds, without preview/reload growth', () => {
  const game = fixture()
  for (let round = 0; round < 4; round++) {
    const { twoPairs } = deal(game)
    const before = game.captureRun()
    const forecast = game.previewScore(twoPairs)!
    expect(forecast.pattern.id).toBe('two_pairs')
    expect(repetitionFactor(forecast)).toBeCloseTo(Math.min(4, 1.2 ** round))
    expect(game.previewScore(twoPairs)).toEqual(forecast)
    expect(game.captureRun()).toEqual(before)
    expect(
      game.processAction({ type: 'play', tileIds: twoPairs }).success
    ).toBe(true)
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

it('pays no repetition bonus on a play the Eye blocks', () => {
  const game = fixture()
  const { twoPairs } = deal(game, false)
  const state = game.getState() as OrchestratorState
  state.previousRoundYakuIds = new Set(['two_pairs'])
  state.mandateEffectSystem.activateMandate(
    THE_EYE,
    state.handTiles,
    state.decreeSystem.getOwnedDecrees()
  )
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    playedPatternIds: ['two_pairs'],
  })
  const score = game.previewScore(twoPairs)!
  expect(score.blockedByMandate).toBe(true)
  expect(score.finalScore).toBe(0)
})

it('grows only at round settlement, keeps patterns played earlier in the round, and breaks them after a miss', () => {
  const game = fixture()
  let hand = deal(game)
  expect(
    game.processAction({ type: 'play', tileIds: hand.twoPairs }).success
  ).toBe(true)
  expect(game.getState().previousRoundYakuStreaks).toEqual({ two_pairs: 1 })
  game.exitShop()
  for (let play = 0; play < 2; play++) {
    hand = deal(game, false)
    expect(
      game.processAction({ type: 'play', tileIds: hand.twoPairs }).success
    ).toBe(true)
    expect(game.getState().previousRoundYakuStreaks).toEqual({ two_pairs: 1 })
  }
  // A different pattern clears the round; Two Pairs still counts for it.
  hand = deal(game)
  expect(game.processAction({ type: 'play', tileIds: hand.pair }).success).toBe(
    true
  )
  expect(game.getState().previousRoundYakuStreaks).toEqual({
    two_pairs: 2,
    pair: 1,
  })
  game.exitShop()
  hand = deal(game)
  expect(game.processAction({ type: 'play', tileIds: hand.pair }).success).toBe(
    true
  )
  expect(game.getState().previousRoundYakuStreaks).toEqual({ pair: 2 })
  game.exitShop()
  expect(repetitionFactor(game.previewScore(deal(game).twoPairs)!)).toBe(1)
})

it('starts a fresh run without history', () => {
  const game = fixture()
  expect(
    game.processAction({ type: 'play', tileIds: deal(game).twoPairs }).success
  ).toBe(true)
  expect(game.getState().previousRoundYakuIds.size).toBeGreaterThan(0)
  game.startNewRun(8)
  expect(game.getState().previousRoundYakuStreaks).toBeUndefined()
  expect(game.getState().previousRoundYakuIds.size).toBe(0)
})

it('preserves legacy history without inventing earlier rounds and validates new history strictly', () => {
  const game = fixture()
  const { twoPairs } = deal(game, false)
  const state = game.getState() as OrchestratorState
  state.previousRoundYakuIds = new Set(['two_pairs'])
  const legacy = JSON.parse(JSON.stringify(game.captureRun()))
  delete legacy.state.previousRoundYakuStreaks
  game.restoreRun(parseClassicRunSnapshot(legacy))
  expect(game.captureRun()).toEqual(legacy)
  expect(repetitionFactor(game.previewScore(twoPairs)!)).toBeCloseTo(1.2)
  for (const history of [
    { two_pairs: 0 },
    { two_pairs: -1 },
    { two_pairs: 1.5 },
    { two_pairs: '2' },
    { two_pairs: null },
    {},
    { two_pairs: 2, pair: 1 },
  ]) {
    const corrupt = structuredClone(legacy)
    corrupt.state.previousRoundYakuStreaks = history
    expect(() => parseClassicRunSnapshot(corrupt)).toThrow(
      /previousRoundYakuStreaks/
    )
  }
  const valid = structuredClone(legacy)
  valid.state.previousRoundYakuStreaks = { two_pairs: 4 }
  game.restoreRun(parseClassicRunSnapshot(valid))
  expect(game.captureRun()).toEqual(valid)
  expect(repetitionFactor(game.previewScore(twoPairs)!)).toBeCloseTo(1.2 ** 4)
})

it('ignores Yaku left in history by older saves', () => {
  const game = fixture()
  const { twoPairs } = deal(game, false)
  const state = game.getState() as OrchestratorState
  state.previousRoundYakuIds = new Set(['ittsu', 'tanyao'])
  state.previousRoundYakuStreaks = { ittsu: 3, tanyao: 2 }
  expect(repetitionFactor(game.previewScore(twoPairs)!)).toBe(1)
})

it('caps the bonus, copies it per active Decree, and lets suppression/Frostbite reduce it', () => {
  const game = fixture()
  const { twoPairs } = deal(game, false)
  const state = game.getState() as OrchestratorState
  state.previousRoundYakuIds = new Set(['two_pairs'])
  state.previousRoundYakuStreaks = { two_pairs: 50 }
  const repetition = state.decreeSystem.getOwnedDecrees()[0]
  const ratio = () => repetitionFactor(game.previewScore(twoPairs)!)
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
