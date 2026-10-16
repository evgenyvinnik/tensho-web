/**
 * A Stone Mark covers its tile's face: the tile has no rank or suit, joins no
 * group, and pays exactly its +50 — in a tactical play or riding along with a
 * complete hand.
 */

import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { DecreeSystem } from '../systems/DecreeSystem'
import { useOmenStore } from '../stores/omenStore'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

const stone = (tile: Tile) => tile.withEnhancement(EnhancementType.Stone)
const ranks = (suit: TileSuit, values: number[]) =>
  values.map((n, i) => new Tile(suit, n, `${suit}-${i}`))

function setup(tiles: Tile[]) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  Object.assign(state, {
    handTiles: tiles,
    targetScore: 1e9,
    selectedTileIds: new Set(),
    faceDownTileIds: new Set(),
  })
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return game
}

it('never pairs with its old face and pays exactly its +50', () => {
  const game = setup([
    stone(new Tile(TileSuit.Manzu, 3, 'stone')),
    new Tile(TileSuit.Manzu, 3, 'face'),
  ])
  const preview = game.previewScore(['stone', 'face'])!
  expect(preview.structurePoints).toBe(0)
  expect(preview.structure).toEqual({
    kind: 'tactical',
    groupedTiles: 0,
    looseTiles: 1,
  })
  expect(preview.modifierChips).toBe(50)
  // 50 from the Stone, half of the loose 3-Manzu's 5 points.
  expect(preview.finalScore).toBe(52)

  const before = game.getState().score
  expect(
    game.processAction({ type: 'play', tileIds: ['stone', 'face'] }).success
  ).toBe(true)
  expect(game.getState().score - before).toBe(preview.finalScore)
})

it('cannot complete a sequence or lend a Dragon its Mult', () => {
  const game = setup([
    new Tile(TileSuit.Souzu, 3, 's3'),
    stone(new Tile(TileSuit.Souzu, 4, 's4')),
    new Tile(TileSuit.Souzu, 5, 's5'),
    new Tile(TileSuit.Dragon, 1, 'd1'),
    new Tile(TileSuit.Dragon, 1, 'd2'),
    stone(new Tile(TileSuit.Dragon, 1, 'd3')),
  ])
  const preview = game.previewScore(['s3', 's4', 's5', 'd1', 'd2', 'd3'])!
  // Only the plain Dragon pair groups; the Stone Dragon is no Dragon.
  expect(preview.structurePoints).toBe(15)
  expect(preview.dragonMult).toBe(4)
  expect(preview.modifierChips).toBe(100)
})

it('rides along with a complete hand without being part of it', () => {
  const hand = [
    ...ranks(TileSuit.Manzu, [1, 2, 3, 4, 5, 6]),
    ...ranks(TileSuit.Pinzu, [2, 3, 4]),
    ...ranks(TileSuit.Souzu, [6, 7, 8]),
    ...ranks(TileSuit.Wind, [1, 1]),
  ]
  const rider = stone(new Tile(TileSuit.Manzu, 9, 'rider'))
  const game = setup([...hand, rider])
  const ids = hand.map((tile) => tile.id)

  expect(game.isCompleteHand([...ids, 'rider'])).toBe(true)
  const plain = game.previewScore(ids)!
  const withStone = game.previewScore([...ids, 'rider'])!
  expect(withStone.structure.kind).toBe('complete')
  expect(withStone.modifierChips).toBe(50)
  expect(withStone.finalScore).toBeGreaterThan(plain.finalScore)

  // A Stone cannot stand in for a tile the hand needs.
  const swapped = setup([...hand.slice(1), stone(hand[0])])
  expect(swapped.isCompleteHand(ids)).toBe(false)
})
