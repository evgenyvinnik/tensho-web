import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, SeasonType } from '../core/Tile'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { THE_SERPENT, CERULEAN_BELL } from '../config/mandateDefinitions'
import { parseClassicRunSnapshot } from './validateClassicRun'

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.handTiles = Array.from(
    { length: 14 },
    (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `hand-${i}`)
  )
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.deadWall = [
    new Tile(TileSuit.Wind, 1, 'dead-1'),
    new Tile(TileSuit.Wind, 2, 'dead-2'),
  ]
  state.drawIndex = 0
  state.faceDownTileIds.clear()
  state.selectedTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  state.seasonSystem.setAct(1)
  return { game, state }
}

it.each(['draw', 'discard', 'redraw', 'play'] as const)(
  'fills new Spring spaces through actual %s, settling one Mandate cycle',
  (type) => {
    const { game, state } = fixture()
    if (type === 'draw') state.handTiles.pop()
    state.wall.unshift(Tile.createSeason(SeasonType.Spring, 'spring'))
    const onDraw = vi.spyOn(state.mandateEffectSystem, 'onDraw')
    const before = JSON.stringify(game.captureRun())
    const action =
      type === 'discard'
        ? { type, tileId: 'hand-0' }
        : type === 'play'
          ? { type, tileIds: ['hand-0', 'hand-1', 'hand-2'] }
          : type === 'redraw'
            ? { type, tileIds: ['hand-0'] }
            : { type }
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.canPerformAction(action)).toBe(true)
    expect(JSON.stringify(game.captureRun())).toBe(before)
    const result = game.processAction(action)
    expect(result.success).toBe(true)
    expect(state.seasonSystem.getDrawBonus()).toBe(2)
    expect(state.handTiles).toHaveLength(16)
    expect(new Set(state.handTiles.map((t) => t.id)).size).toBe(16)
    expect(onDraw).toHaveBeenCalledTimes(1)
    if (type === 'redraw') {
      expect(state.handTiles.some((t) => t.id === 'hand-0')).toBe(false)
      expect(state.wall.some((t) => t.id === 'hand-0')).toBe(true)
      const additions = result.effects.filter((e) => e.type === 'tile_added')
      expect(additions).toHaveLength(3)
    }
  }
)

it('stacks Springs drawn in a replacement chain and keeps the expanded rack stable across plays and restore', () => {
  const { game, state } = fixture()
  state.wall.unshift(Tile.createSeason(SeasonType.Spring, 'spring-1'))
  state.deadWall.unshift(Tile.createSeason(SeasonType.Spring, 'spring-2'))
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-0' }).success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(18)
  expect(state.seasonSystem.getDrawBonus()).toBe(4)
  const snapshot = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  game.restoreRun(snapshot)
  expect(game.captureRun()).toEqual(snapshot)
  for (let i = 0; i < 2; i++) {
    const ids = game
      .getHandTiles()
      .slice(0, 3)
      .map((t) => t.id)
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(game.getHandTiles()).toHaveLength(18)
  }
})

it('does not grant the normal draw bonus for corrupted Spring (Monsoon)', () => {
  const { game, state } = fixture()
  state.seasonSystem.forceSetSeason('Spring', true)
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-0' }).success
  ).toBe(true)
  expect(state.seasonSystem.getDrawBonus()).toBe(0)
  expect(state.handTiles).toHaveLength(14)
})

it('does not invent tiles when the live wall cannot fill Spring spaces', () => {
  const { game, state } = fixture()
  state.wall = [Tile.createSeason(SeasonType.Spring, 'spring')]
  state.deadWall = [new Tile(TileSuit.Wind, 1, 'last-replacement')]
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-0' }).success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(14)
  expect(state.handTiles.some((t) => t.id === 'last-replacement')).toBe(true)
  expect(state.phase).toBe('gameplay')
})

it('keeps only one Bell lock after the Spring expansion', () => {
  const { game, state } = fixture()
  state.mandateEffectSystem.activateMandate(CERULEAN_BELL, state.handTiles, [])
  state.wall.unshift(Tile.createSeason(SeasonType.Spring, 'spring'))
  const onDraw = vi.spyOn(state.mandateEffectSystem, 'onDraw')
  expect(
    game.processAction({ type: 'redraw', tileIds: ['hand-0'] }).success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(16)
  expect(onDraw).toHaveBeenCalledTimes(1)
  expect(state.mandateEffectSystem.getLockedTileIds()).toHaveLength(1)
})

it("adds new Spring spaces once while retaining Serpent's later three-tile replacements", () => {
  const { game, state } = fixture()
  state.mandateEffectSystem.activateMandate(THE_SERPENT, state.handTiles, [])
  state.wall.unshift(Tile.createSeason(SeasonType.Spring, 'spring'))
  expect(
    game.processAction({
      type: 'play',
      tileIds: ['hand-0', 'hand-1', 'hand-2'],
    }).success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(16)
  const ids = state.handTiles.slice(0, 5).map((t) => t.id)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.handTiles).toHaveLength(14)
})

it('expires Spring capacity with the round rather than permanently changing the rack', () => {
  const { game, state } = fixture()
  state.seasonSystem.forceSetSeason('Spring')
  state.wallTemplate = state.wallTemplate.filter((t) => !t.isBonus)
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-0' }).success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(16)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  expect(state.seasonSystem.getDrawBonus()).toBe(0)
  game.exitShop()
  expect(game.getState().phase).toBe('gameplay')
  expect(game.getHandTiles()).toHaveLength(14)
})
