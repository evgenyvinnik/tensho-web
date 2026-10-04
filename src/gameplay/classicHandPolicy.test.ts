import { afterEach, expect, it, vi } from 'vitest'
import { chooseClassicHandAction } from '../../scripts/lib/classic-hand-policy'
import type { ResourcePolicyContext } from '../../scripts/lib/classic-resource-policy'
import { Tile, TileSuit } from '../core/Tile'
import { calculateShanten, getEffectiveTiles } from '../rules/ShantenCalculator'
import { GameOrchestrator } from '../game/GameOrchestrator'
import { eventBus } from '../game/EventBus'
import { runRandom } from '../game/RunRandom'
import { buildCoachAdvice } from './beginnerCoach'

const tiles = (suit: TileSuit, ranks: number[]) =>
  ranks.map((r, i) => new Tile(suit, r, `${suit}-${i}`))
function fixture(): ResourcePolicyContext {
  const visibleTiles = [
    ...tiles(TileSuit.Manzu, [1, 2, 3, 4, 5, 6]),
    ...tiles(TileSuit.Souzu, [7, 8, 9]),
    ...tiles(TileSuit.Pinzu, [2, 3]),
    ...tiles(TileSuit.Wind, [1, 1]),
    new Tile(TileSuit.Dragon, 3, 'spare'),
  ]
  return {
    visibleTiles,
    handTileCount: 14,
    lockedTileIds: [],
    requiredPlaySize: null,
    remainingToTarget: 1000,
    chaseCompleteHands: false,
    canPerform: () => true,
    advice: {
      best: {
        tileIds: visibleTiles.slice(0, 3).map((t) => t.id),
        score: 50,
        pattern: null,
        structurePoints: 30,
      },
      shape: null,
      requiredPerHand: 100,
      keepsPace: false,
      structureGivenUp: 0,
    },
  }
}
afterEach(() => {
  eventBus.clear()
  eventBus.disableHistory()
  runRandom.reset()
  vi.restoreAllMocks()
})

it('keeps a two-sided finish instead of a disconnected Honor', () => {
  expect(chooseClassicHandAction(fixture())).toEqual({
    action: { type: 'discard', tileId: 'spare' },
    reason: 'hand-plan',
    shanten: 0,
    improvingTypes: [
      new Tile(TileSuit.Pinzu, 1, 'a').typeKey,
      new Tile(TileSuit.Pinzu, 4, 'b').typeKey,
    ],
  })
})
it('replans across two observed draws without seeing future tiles', () => {
  const c = fixture()
  c.visibleTiles = [
    ...tiles(TileSuit.Manzu, [1, 2, 3]),
    ...tiles(TileSuit.Souzu, [4, 5, 6]),
    ...tiles(TileSuit.Pinzu, [2, 3, 5, 6]),
    ...tiles(TileSuit.Wind, [1, 1]),
    ...tiles(TileSuit.Dragon, [1, 3]),
  ]
  for (const [distance, draw] of [
    [1, 1],
    [0, 4],
  ]) {
    const choice = chooseClassicHandAction(c)!
    expect(choice.shanten).toBe(distance)
    if (choice.action.type !== 'discard') throw new Error('Expected discard')
    const id = choice.action.tileId
    expect(c.visibleTiles.find((t) => t.id === id)?.suit).toBe(TileSuit.Dragon)
    c.visibleTiles = [
      ...c.visibleTiles.filter((t) => t.id !== id),
      new Tile(TileSuit.Pinzu, draw, `draw-${draw}`),
    ]
  }
  expect(calculateShanten([...c.visibleTiles]).shanten).toBe(-1)
  expect(chooseClassicHandAction(c)).toBeNull()
})
it('minimizes distance then maximizes improving types over every legal discard', () => {
  const c = fixture(),
    result = chooseClassicHandAction(c)!
  const scores = c.visibleTiles
    .map((tile) => {
      const rest = c.visibleTiles.filter((t) => t.id !== tile.id)
      return {
        distance: calculateShanten(rest).shanten,
        breadth: getEffectiveTiles(rest).length,
      }
    })
    .sort((a, b) => a.distance - b.distance || b.breadth - a.breadth)
  expect(result.shanten).toBe(scores[0].distance)
  expect(result.improvingTypes).toHaveLength(scores[0].breadth)
})
it('supports distinct Seven Pairs and Orphans', () => {
  const c = fixture()
  c.visibleTiles = [
    ...tiles(TileSuit.Manzu, [1, 1, 4, 4, 7, 7]),
    ...tiles(TileSuit.Pinzu, [2, 2, 5, 5, 8, 8]),
    new Tile(TileSuit.Wind, 1, 'head'),
    new Tile(TileSuit.Dragon, 2, 'spare'),
  ]
  expect(chooseClassicHandAction(c)?.shanten).toBe(0)
  c.visibleTiles = [
    ...tiles(TileSuit.Manzu, [1, 9]),
    ...tiles(TileSuit.Pinzu, [1, 9]),
    ...tiles(TileSuit.Souzu, [1, 9]),
    ...tiles(TileSuit.Wind, [1, 2, 3, 4]),
    ...tiles(TileSuit.Dragon, [1, 2, 3]),
    new Tile(TileSuit.Manzu, 5, 'spare'),
  ]
  expect(chooseClassicHandAction(c)?.improvingTypes).toHaveLength(13)
})
it.each([
  'hidden',
  'enlarged',
  'bonus',
  'duplicate',
  'mandate',
  'clear',
  'complete-advice',
  'no-advice',
])('does not plan unsupported or unnecessary cases: %s', (kind) => {
  const c = fixture()
  if (kind === 'hidden') c.visibleTiles = c.visibleTiles.slice(0, 13)
  if (kind === 'enlarged') c.handTileCount = 15
  if (kind === 'bonus')
    c.visibleTiles = [
      ...c.visibleTiles.slice(0, 13),
      new Tile(TileSuit.Flower, 1, 'bonus'),
    ]
  if (kind === 'duplicate')
    c.visibleTiles = [...c.visibleTiles.slice(0, 13), c.visibleTiles[0]]
  if (kind === 'mandate') c.requiredPlaySize = 5
  if (kind === 'clear') c.remainingToTarget = 40
  if (kind === 'complete-advice')
    c.advice!.best.tileIds = c.visibleTiles.map((t) => t.id)
  if (kind === 'no-advice') c.advice = null
  const canPerform = vi.fn(c.canPerform)
  expect(chooseClassicHandAction({ ...c, canPerform })).toBeNull()
  expect(canPerform).not.toHaveBeenCalled()
})
it('respects physical locks, legal redraw fallback and exhausted resources', () => {
  const c = fixture()
  c.canPerform = (a) => a.type === 'redraw'
  expect(chooseClassicHandAction(c)?.action).toEqual({
    type: 'redraw',
    tileIds: ['spare'],
  })
  c.lockedTileIds = ['spare']
  expect(chooseClassicHandAction(c)?.action).not.toEqual({
    type: 'redraw',
    tileIds: ['spare'],
  })
  c.canPerform = () => false
  expect(chooseClassicHandAction(c)).toBeNull()
})
it('is deterministic, read-only and terminates with actual engine allowances', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  let decisions = 0
  for (let step = 0; step < 10; step++) {
    const state = game.getState(),
      c = fixture()
    Object.assign(c, {
      visibleTiles: state.handTiles.filter(
        (t) => !state.faceDownTileIds.has(t.id)
      ),
      handTileCount: state.handTiles.length,
      advice: buildCoachAdvice({
        tiles: state.handTiles,
        concealedIds: state.faceDownTileIds,
        handsRemaining: state.handsRemaining,
        remainingToTarget: 1e9,
        scoreSelection: (ids) => game.previewScore(ids)?.finalScore ?? null,
      }),
      canPerform: (a: Parameters<typeof game.canPerformAction>[0]) =>
        game.canPerformAction(a),
    })
    const before = game.captureRun(),
      random = vi.spyOn(runRandom, 'next')
    eventBus.enableHistory()
    const history = eventBus.getHistory(),
      result = chooseClassicHandAction(c)
    expect(chooseClassicHandAction(c)).toEqual(result)
    expect(game.captureRun()).toEqual(before)
    expect(eventBus.getHistory()).toEqual(history)
    expect(random).not.toHaveBeenCalled()
    random.mockRestore()
    if (!result) {
      expect(decisions).toBeGreaterThan(0)
      expect(decisions).toBeLessThanOrEqual(6)
      return
    }
    expect(game.processAction(result.action).success).toBe(true)
    decisions++
  }
  throw new Error('Planner exceeded finite resource bound')
})
