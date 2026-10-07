import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, SeasonType } from '../core/Tile'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { OmenTagSystem } from '../systems/OmenTagSystem'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
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
  state.seasonSystem.setAct(1)
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.handTiles = Array.from(
    { length: 14 },
    (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `hand-${i}`)
  )
  state.wall = [
    Tile.createSeason(SeasonType.Autumn, 'autumn-1'),
    ...Array.from(
      { length: 60 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
    ),
  ]
  state.deadWall = [new Tile(TileSuit.Wind, 1, 'dead-1')]
  state.drawIndex = 0
  state.discardsRemaining = 3
  state.faceDownTileIds.clear()
  state.selectedTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state }
}

it.each(['draw', 'discard', 'redraw', 'play'] as const)(
  'grants one actual discard on an Autumn drawn through %s, not during availability checks',
  (type) => {
    const { game, state } = fixture()
    if (type === 'draw') state.handTiles.pop()
    const onDraw = vi.spyOn(state.mandateEffectSystem, 'onDraw')
    const action =
      type === 'discard'
        ? { type, tileId: 'hand-0' }
        : type === 'play'
          ? { type, tileIds: ['hand-0', 'hand-1', 'hand-2'] }
          : type === 'redraw'
            ? { type, tileIds: ['hand-0'] }
            : { type }
    const before = game.captureRun()
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.captureRun()).toEqual(before)
    expect(game.processAction(action).success).toBe(true)
    expect(state.discardsRemaining).toBe(type === 'discard' ? 3 : 4)
    expect(state.seasonSystem.getAdditionalDiscards()).toBe(1)
    expect(state.seasonSystem.calculateYakuBonus()).toBeCloseTo(0.2)
    expect(state.handTiles).toHaveLength(14)
    expect(onDraw).toHaveBeenCalledTimes(1)
    const resource = state.discardsRemaining
    expect(
      game.processAction({ type: 'discard', tileId: state.handTiles[0].id })
        .success
    ).toBe(true)
    expect(state.discardsRemaining).toBe(resource - 1)
  }
)

it('stacks replacement-chain grants once, survives exact restore, and allows the last earned discard', () => {
  const { game, state } = fixture()
  state.discardsRemaining = 0
  state.deadWall.unshift(Tile.createSeason(SeasonType.Autumn, 'autumn-2'))
  expect(game.canPerformAction({ type: 'discard', tileId: 'hand-0' })).toBe(
    false
  )
  expect(
    game.processAction({ type: 'redraw', tileIds: ['hand-0'] }).success
  ).toBe(true)
  expect(state.discardsRemaining).toBe(2)
  expect(state.seasonSystem.calculateYakuBonus()).toBeCloseTo(0.4)
  const saved = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  game.restoreRun(saved)
  expect(game.captureRun()).toEqual(saved)
  for (let i = 0; i < 2; i++) {
    expect(
      game.processAction({ type: 'discard', tileId: game.getHandTiles()[0].id })
        .success
    ).toBe(true)
    expect(game.getState().discardsRemaining).toBe(1 - i)
  }
  const exhausted = game.captureRun()
  expect(
    game.processAction({ type: 'discard', tileId: game.getHandTiles()[0].id })
      .success
  ).toBe(false)
  expect(game.captureRun()).toEqual(exhausted)
})

it('grants no normal bonus for an actual corrupted Autumn draw', () => {
  const { game, state } = fixture()
  state.seasonSystem.setAct(2)
  runRandom.start(3)
  expect(
    game.processAction({ type: 'redraw', tileIds: ['hand-0'] }).success
  ).toBe(true)
  expect(state.seasonSystem.getActiveSeason()?.corruptedType).toBe('Decay')
  expect(state.discardsRemaining).toBe(3)
  expect(state.seasonSystem.calculateYakuBonus()).toBe(0)
})

it.each(['Autumn', 'Winter'] as const)(
  'honors an Omen lock to %s once without consuming it in preflight',
  (lockedSeasonType) => {
    const { game, state } = fixture()
    state.wall[0] = Tile.createSeason(SeasonType.Autumn, 'physical-autumn')
    state.omenSystem = OmenTagSystem.fromState({
      ...state.omenSystem.toState(),
      lockedSeasonType,
    })
    const action = { type: 'redraw' as const, tileIds: ['hand-0'] }
    expect(game.canPerformAction(action)).toBe(true)
    expect(state.omenSystem.getLockedSeason()).toBe(lockedSeasonType)
    expect(game.processAction(action).success).toBe(true)
    expect(state.discardsRemaining).toBe(lockedSeasonType === 'Autumn' ? 4 : 3)
    expect(state.omenSystem.applyLockedSeason()).toBeNull()
  }
)

it('grants the resource even when its replacement is exhausted, without inventing tiles', () => {
  const { game, state } = fixture()
  state.wall = [state.wall[0]]
  state.deadWall = []
  expect(
    game.processAction({ type: 'play', tileIds: ['hand-0', 'hand-1'] }).success
  ).toBe(true)
  expect(state.discardsRemaining).toBe(4)
  expect(state.handTiles).toHaveLength(12)
  expect(state.phase).toBe('gameplay')
})

it('expires the grant at the next round instead of carrying unused discards forward', () => {
  const { game, state } = fixture()
  state.wallTemplate = state.wallTemplate.filter((t) => !t.isBonus)
  expect(
    game.processAction({ type: 'redraw', tileIds: ['hand-0'] }).success
  ).toBe(true)
  expect(state.discardsRemaining).toBe(4)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  game.exitShop()
  expect(game.getState().discardsRemaining).toBe(3)
  expect(game.getState().seasonSystem.getAdditionalDiscards()).toBe(0)
})

it.each(['decree-recycler', 'decree-waste-not'])(
  'does not erase a spent discard for %s when Autumn grants a replacement action',
  (id) => {
    const { game, state } = fixture()
    const decree = ALL_DECREES.find((d) => d.id === id)!
    expect(state.decreeSystem.acquireDecree(decree)).not.toBeNull()
    // A one-discard expenditure and one Autumn grant leave the counter at 3.
    expect(
      game.processAction({ type: 'discard', tileId: 'hand-13' }).success
    ).toBe(true)
    expect(state.discardsRemaining).toBe(3)
    const ids = ['hand-0', 'hand-1']
    const forecast = game.previewScore(ids)!
    const noDecree = state.decreeSystem.getOwnedDecrees()[0]
    state.decreeSystem.removeDecree(noDecree.id)
    const base = game.previewScore(ids)!
    expect(forecast.additiveBonus - base.additiveBonus).toBe(
      id === 'decree-recycler' ? 20 : 0
    )
    expect(forecast.equation!.multiplier).toBe(base.equation!.multiplier)
    state.decreeSystem.acquireDecree(decree)
    const score = state.score
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.score - score).toBe(forecast.finalScore)
  }
)

it('includes naturally dealt Autumns in the first-round resource budget', () => {
  let observedAutumns = 0
  for (let seed = 1; seed <= 100; seed++) {
    const game = new GameOrchestrator()
    game.startNewRun(seed)
    const state = game.getState()
    const normalAutumns = state.seasonSystem
      .getSeasonStack()
      .filter((s) => s.type === 'Autumn' && !s.isCorrupted).length
    observedAutumns += normalAutumns
    expect(state.discardsRemaining).toBe(
      3 + state.decreeSystem.getAdditionalDiscards() + normalAutumns
    )
  }
  expect(observedAutumns).toBeGreaterThan(0)
})
