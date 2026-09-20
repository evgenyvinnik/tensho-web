import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { Tile, TileSuit } from '../core/Tile'
import { DecreeSystem, HONOR_TRANSMUTATION } from '../systems/DecreeSystem'
import type { ScoreAddedEffect } from './ActionProcessor'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

function fixture(ranks: number[], suit = TileSuit.Souzu) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem = new DecreeSystem()
  state.handTiles = ranks.map(
    (rank, index) => new Tile(suit, rank, `structure-${index}`)
  )
  state.wall = Array.from(
    { length: 40 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state, ids: state.handTiles.map((t) => t.id) }
}

it.each([
  [[4, 5, 6], 3, 0, 30],
  [[4, 4], 2, 0, 15],
  [[4, 4, 4], 3, 0, 40],
  [[4, 4, 4, 4], 4, 0, 65],
  [[4, 5, 6, 9], 3, 1, 30],
  [[1, 4, 8], 0, 3, 0],
] as [number[], number, number, number][])(
  'reports the grouping actually used to preview and pay %j',
  (ranks, groupedTiles, looseTiles, points) => {
    const { game, ids } = fixture(ranks)
    const preview = game.previewScore(ids)!
    expect(preview.structure).toEqual({
      kind: 'tactical',
      groupedTiles,
      looseTiles,
    })
    expect(preview.structurePoints).toBe(points)
    expect(game.previewScore(ids)).toEqual(preview)
    const result = game.processAction({ type: 'play', tileIds: ids })
    expect(result.success).toBe(true)
    const paid = result.effects.find(
      (effect) => effect.type === 'score_added'
    ) as ScoreAddedEffect
    expect(paid.breakdown.structure).toEqual(preview.structure)
    expect(paid.score).toBe(preview.finalScore)
  }
)

it('reports transformed Honor groups instead of reparsing the visible tiles in the UI', () => {
  const { game, state, ids } = fixture([1, 2, 3], TileSuit.Wind)
  expect(game.previewScore(ids)!.structure).toEqual({
    kind: 'tactical',
    groupedTiles: 0,
    looseTiles: 3,
  })
  state.decreeSystem.acquireDecree(HONOR_TRANSMUTATION)
  expect(game.previewScore(ids)!.structure).toEqual({
    kind: 'tactical',
    groupedTiles: 3,
    looseTiles: 0,
  })
})

it('distinguishes a complete hand from an all-grouped tactical play', () => {
  const { game, ids } = fixture([1, 2, 3, 4, 5, 6, 7, 8, 9, 7, 8, 9, 5, 5])
  expect(game.previewScore(ids)!.structure).toEqual({
    kind: 'complete',
    groupedTiles: 14,
    looseTiles: 0,
  })
})

it('does not relabel suppressed tiles as loose when their structure still scores', () => {
  const { game, state, ids } = fixture([4, 5, 6])
  state.debuffSystem.debuffTiles(ids, {
    type: 'system',
    reason: 'Structure fixture',
  })
  const preview = game.previewScore(ids)!
  expect(preview.structure).toEqual({
    kind: 'tactical',
    groupedTiles: 3,
    looseTiles: 0,
  })
  expect(preview.tilePoints).toBe(0)
  expect(preview.structurePoints).toBe(30)
  expect(preview.finalScore).toBe(30)
})
