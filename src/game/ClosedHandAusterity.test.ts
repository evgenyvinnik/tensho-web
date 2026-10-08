import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { LEGACY_AUSTERITY_EFFECT } from '../systems/austerity'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})
function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState()
  for (const d of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(d.id)
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'closed_hand_austerity')!
  )
  return game
}
function deal(game: GameOrchestrator) {
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.faceDownTileIds.clear()
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  state.handTiles = [
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
      (rank, i) => new Tile(TileSuit.Souzu, rank, `run-${i}`)
    ),
    ...[6, 6, 6].map((rank, i) => new Tile(TileSuit.Manzu, rank, `pung-${i}`)),
    ...[5, 5].map((rank, i) => new Tile(TileSuit.Pinzu, rank, `pair-${i}`)),
  ]
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  return state.handTiles.map((t) => t.id)
}
function factor(game: GameOrchestrator, ids: string[]) {
  const score = game.previewScore(ids)!
  return score.equation!.multiplier / score.yakuMultiplier
}
it('rewards complete concealed hands with run growth, without growing during preview or reload', () => {
  const game = fixture()
  for (let i = 0; i < 8; i++) {
    const ids = deal(game),
      before = game.captureRun()
    expect(factor(game, ids)).toBeCloseTo(Math.min(4, 1.5 * 1.2 ** i))
    expect(game.captureRun()).toEqual(before)
    const forecast = game.previewScore(ids)!
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
  }
})
it('does not reward tactical plays or let them advance mastery', () => {
  const game = fixture(),
    ids = deal(game)
  expect(factor(game, ids.slice(0, 3))).toBe(1)
  expect(
    game.processAction({ type: 'play', tileIds: ids.slice(0, 3) }).success
  ).toBe(true)
  game.exitShop()
  expect(factor(game, deal(game))).toBe(1.5)
})

it('preserves legacy owned effects without trusting altered rules or inventing history', () => {
  const game = fixture(),
    ids = deal(game)
  const old = JSON.parse(JSON.stringify(game.captureRun()))
  old.state.decreeSystem.ownedDecrees[0].effect = structuredClone(
    LEGACY_AUSTERITY_EFFECT
  )
  old.state.handsPlayedThisRun = 10
  delete old.state.completeConcealedHandsPlayed
  game.restoreRun(parseClassicRunSnapshot(old))
  expect(game.captureRun()).toEqual(old)
  expect(factor(game, ids)).toBe(1.5)
  for (const count of [-1, 0.1, '2', null, 11]) {
    const bad = structuredClone(old)
    bad.state.completeConcealedHandsPlayed = count
    expect(() => parseClassicRunSnapshot(bad)).toThrow(
      /completeConcealedHandsPlayed/
    )
  }
  const bad = structuredClone(old)
  bad.state.decreeSystem.ownedDecrees[0].effect.effect.multiplier = 50
  expect(() => parseClassicRunSnapshot(bad)).toThrow()
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().completeConcealedHandsPlayed).toBe(1)
  game.exitShop()
  expect(factor(game, deal(game))).toBeCloseTo(1.8)
})

it('earns history without owning the Decree, across skips, and resets on a new run', () => {
  const game = fixture(),
    state = game.getState(),
    ids = deal(game)
  state.decreeSystem.removeDecree('closed_hand_austerity')
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  game.exitShop()
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'closed_hand_austerity')!
  )
  expect(factor(game, deal(game))).toBeCloseTo(1.8)
  game.startNewRun(8)
  expect(game.getState().completeConcealedHandsPlayed).toBeUndefined()
})

it('excludes Clemency completions from both the multiplier and its history', () => {
  const game = fixture()
  deal(game)
  const state = game.getState() as OrchestratorState
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'shanten_clemency')!
  )
  state.handTiles = [
    ...[1, 2, 3, 2, 3, 4].map((r, i) => new Tile(TileSuit.Manzu, r, `m${i}`)),
    ...[3, 4, 5, 5, 5].map((r, i) => new Tile(TileSuit.Pinzu, r, `p${i}`)),
    ...[6, 7].map((r, i) => new Tile(TileSuit.Souzu, r, `s${i}`)),
  ]
  const ids = state.handTiles.map((t) => t.id),
    decree = state.decreeSystem.getOwnedDecrees()[0]
  const active = game.previewScore(ids)!
  decree.isDebuffed = true
  expect(game.previewScore(ids)!.finalScore).toBe(active.finalScore)
  decree.isDebuffed = false
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().completeConcealedHandsPlayed).toBeUndefined()
})

it('counts Seven Pairs once and copies the factor without multiplying earned history', () => {
  const game = fixture()
  deal(game)
  const state = game.getState() as OrchestratorState
  state.handTiles = [1, 2, 3, 4, 5, 6, 7].flatMap((r) =>
    [0, 1].map((i) => new Tile(TileSuit.Manzu, r, `p${r}-${i}`))
  )
  const ids = state.handTiles.map((t) => t.id)
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'decree-brainstorm')!
  )
  expect(factor(game, ids)).toBeCloseTo(1.5 ** 2)
  state.seasonSystem.forceSetSeason('Winter', true)
  expect(factor(game, ids)).toBeCloseTo(1 + (1.5 ** 2 - 1) * 0.5)
  state.seasonSystem.clear()
  state.decreeSystem.getOwnedDecrees()[0].isDebuffed = true
  expect(factor(game, ids)).toBeCloseTo(1)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().completeConcealedHandsPlayed).toBe(1)
})
