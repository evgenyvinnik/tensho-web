import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit, createStandardTileSet } from '../core/Tile'
import {
  GameOrchestrator,
  type OrchestratorState,
} from '../game/GameOrchestrator'
import { eventBus } from '../game/EventBus'
import { runRandom } from '../game/RunRandom'
import { isCompleteHand } from '../rules/HandValidator'
import {
  HAND_BUILDING_EXAMPLE as example,
  type GuideTileGroup,
} from './handExample'

function tiles(groups: GuideTileGroup[], prefix: string): Tile[] {
  return groups.flatMap((group, g) =>
    group.ranks.map(
      (rank, r) => new Tile(group.suit, rank, `${prefix}-${g}-${r}`)
    )
  )
}
function faces(hand: Tile[]): string[] {
  return hand.map((t) => `${t.suit}-${t.rank}`).sort()
}
function fixture(replacements = tiles(example.replacements, 'replacement')) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  for (const d of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(d.id)
  state.faceDownTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const keep = tiles(example.keep, 'keep')
  const exchange = tiles(example.exchange, 'exchange')
  state.handTiles = [...keep, ...exchange]
  // A physically possible standard wall, excluding the authored starting rack
  // and replacement copies. This is a worked example, not a seeded forecast.
  const wall = createStandardTileSet(false)
  for (const tile of [...state.handTiles, ...replacements]) {
    const index = wall.findIndex(
      (t) => t.suit === tile.suit && t.rank === tile.rank
    )
    expect(index).toBeGreaterThanOrEqual(0)
    wall.splice(index, 1)
  }
  state.wall = [...replacements, ...wall]
  state.deadWall = []
  state.drawIndex = 0
  state.redrawsRemaining = 2
  state.wallTemplate = [...state.handTiles, ...state.wall]
  return { game, state, keep, exchange }
}
afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

it('executes the published two-tile example for one redraw and declares the illustrated hand', () => {
  const { game, state, keep, exchange } = fixture()
  expect(isCompleteHand(state.handTiles)).toBe(false)
  const before = game.captureRun()
  const advice = game.getHandBuildingAdvice()
  expect(advice.kind).toBe('redraw')
  if (advice.kind !== 'redraw') throw Error('No hand-building advice')
  expect(advice.exchange).toEqual(exchange)
  expect(advice.keep).toEqual(keep)
  expect(advice.needed).toBe(2)
  expect(game.captureRun()).toEqual(before)
  const hands = state.handsRemaining
  expect(
    game.processAction({ type: 'redraw', tileIds: exchange.map((t) => t.id) })
      .success
  ).toBe(true)
  expect(state.redrawsRemaining).toBe(1)
  expect(state.handsRemaining).toBe(hands)
  for (const tile of keep) expect(state.handTiles).toContainEqual(tile)
  expect(state.handTiles).toHaveLength(14)
  expect(faces(state.handTiles)).toEqual(
    faces(tiles(example.complete, 'complete'))
  )
  expect(isCompleteHand(state.handTiles)).toBe(true)
  expect(game.getHandBuildingAdvice()).toEqual({ kind: 'complete' })
  const ids = state.handTiles.map((t) => t.id)
  const forecast = game.previewScore(ids)!
  expect(forecast.finalScore).toBeGreaterThan(0)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().handsRemaining).toBe(hands - 1)
  expect(game.getState().score).toBe(forecast.finalScore)
  expect(game.getState().phase).toBe('gameplay')
})

it('does not promise completion when the same exchange draws unhelpful tiles', () => {
  const { game, state, exchange } = fixture([
    new Tile(TileSuit.Manzu, 9, 'unhelpful-1'),
    new Tile(TileSuit.Manzu, 9, 'unhelpful-2'),
  ])
  expect(
    game.processAction({ type: 'redraw', tileIds: exchange.map((t) => t.id) })
      .success
  ).toBe(true)
  expect(state.redrawsRemaining).toBe(1)
  expect(isCompleteHand(state.handTiles)).toBe(false)
})
