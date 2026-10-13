import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, FlowerType, SeasonType } from '../core/Tile'
import { calculateModifierEffects, SealType } from '../core/TileModifier'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { RIVER_TAX } from '../systems/DecreeSystem'
import {
  CERULEAN_BELL,
  THE_HOOK,
  THE_WATER,
} from '../config/mandateDefinitions'
import { FateSealSystem, FATE_SEALS } from '../systems/FateSealSystem'
import { runRandom } from './RunRandom'
import { eventBus } from './EventBus'
import type { PlayerAction } from './ActionProcessor'
import { advanceToRound } from '../test/roundHelpers'

function fixture(seed = 7) {
  const game = new GameOrchestrator()
  game.startNewRun(seed)
  const state = game.getState() as OrchestratorState
  for (const decree of state.decreeSystem.getOwnedDecrees()) {
    state.decreeSystem.removeDecree(decree.id)
  }
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state }
}

function snapshot(state: OrchestratorState) {
  return {
    hand: state.handTiles.map((t) => ({ ...t })),
    wall: state.wall.map((t) => ({ ...t })),
    dead: state.deadWall.map((t) => ({ ...t })),
    river: state.discards.map((t) => ({ ...t })),
    selected: [...state.selectedTileIds],
    hidden: [...state.faceDownTileIds],
    index: state.drawIndex,
    resources: [
      state.handsRemaining,
      state.discardsRemaining,
      state.redrawsRemaining,
      state.gold,
      state.score,
    ],
    phase: state.phase,
    seals: state.fateSeals.map((s) => s.instanceId),
    mandate: state.mandateEffectSystem.toJSON(),
    flowers: state.flowerSystem.getFlowerCount(),
  }
}

function expectRejected(game: GameOrchestrator, action: PlayerAction) {
  const state = game.getState() as OrchestratorState
  const before = snapshot(state)
  const random = vi.spyOn(runRandom, 'next')
  eventBus.enableHistory()
  expect(game.canPerformAction(action)).toBe(false)
  const result = game.processAction(action)
  expect(result.success).toBe(false)
  expect(result.effects).toEqual([])
  expect(result.errors?.length).toBeGreaterThan(0)
  expect(snapshot(state)).toEqual(before)
  expect(eventBus.getHistory()).toEqual([])
  expect(random).not.toHaveBeenCalled()
  random.mockRestore()
}

function activeTiles(state: OrchestratorState) {
  return [
    ...state.handTiles,
    ...state.wall.slice(state.drawIndex),
    ...state.deadWall,
    ...state.discards,
  ]
    .filter((t) => !t.isFlower && !t.isSeason)
    .map((t) => t.id)
    .sort()
}

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  eventBus.disableHistory()
})

describe('Classic REDRAW resources', () => {
  it('rejects duplicate, missing and empty selections before mutation', () => {
    const { game, state } = fixture()
    const ids = state.handTiles.slice(0, 4).map((t) => t.id)
    for (const tileIds of [[], [ids[0], ids[0]], [ids[0], 'missing']]) {
      expectRejected(game, { type: 'redraw', tileIds })
    }
  })

  it('redraws any number of tiles, up to the whole hand', () => {
    const { game, state } = fixture()
    const size = state.handTiles.length
    const all = state.handTiles.map((t) => t.id)
    expect(game.canPerformAction({ type: 'redraw', tileIds: all })).toBe(true)
    expect(game.processAction({ type: 'redraw', tileIds: all }).success).toBe(
      true
    )
    expect(state.handTiles).toHaveLength(size)
    expect(state.handTiles.some((t) => all.includes(t.id))).toBe(false)
    expect(state.discards.map((t) => t.id)).toEqual(
      expect.arrayContaining(all)
    )
  })

  it('makes locked REDRAW availability match execution', () => {
    const { game, state } = fixture()
    const ids = state.handTiles.map((t) => t.id)
    state.mandateEffectSystem = MandateEffectSystem.fromJSON({
      ...state.mandateEffectSystem.toJSON(),
      lockedTileIds: ids,
    })
    expectRejected(game, { type: 'redraw', tileIds: [ids[0]] })
    expect(game.getAvailableActions()).not.toContain('redraw')
  })

  it.each(['menu', 'shop', 'gameOver'] as const)(
    'offers no gameplay resources during %s',
    (phase) => {
      const { game, state } = fixture()
      state.phase = phase
      expectRejected(game, { type: 'redraw', tileIds: [state.handTiles[0].id] })
      expect(game.getAvailableActions()).toEqual([])
    }
  )

  it('keeps the last Turn for a play and rejects an insufficient wall without spending anything', () => {
    const { game, state } = fixture()
    const tileIds = state.handTiles.slice(0, 2).map((t) => t.id)
    state.redrawsRemaining = 0
    state.handsRemaining = 1
    expectRejected(game, { type: 'redraw', tileIds })
    state.handsRemaining = 4
    state.redrawsRemaining = 3
    state.wall = state.wall.slice(state.drawIndex, state.drawIndex + 1)
    state.drawIndex = 0
    expectRejected(game, { type: 'redraw', tileIds })
  })

  it('sends tiles to the river, pays REDRAW rewards and conserves physical tiles', () => {
    const { game, state } = fixture()
    expect(state.decreeSystem.acquireDecree(RIVER_TAX)).not.toBeNull()
    const [selected, other] = state.handTiles
    const replacements = [
      new Tile(TileSuit.Pinzu, 5, 'replacement-1'),
      new Tile(TileSuit.Pinzu, 6, 'replacement-2'),
    ]
    state.wall = replacements
    state.drawIndex = 0
    state.deadWall = []
    state.redrawsRemaining = 1
    const before = activeTiles(state)
    const gold = state.gold
    const turns = state.handsRemaining
    state.selectedTileIds.add(selected.id)
    state.faceDownTileIds.add(selected.id)
    eventBus.enableHistory()
    expect(
      game.processAction({ type: 'redraw', tileIds: [selected.id] }).success
    ).toBe(true)
    expect(state.handTiles.some((t) => t.id === selected.id)).toBe(false)
    expect(state.handTiles).toContain(replacements[0])
    expect(state.discards).toContain(selected)
    expect(state.selectedTileIds.has(selected.id)).toBe(false)
    expect(state.faceDownTileIds.has(selected.id)).toBe(false)
    expect(activeTiles(state)).toEqual(before)
    // The free redraw is spent first; River Tax pays once per REDRAW.
    expect(state.redrawsRemaining).toBe(0)
    expect(state.handsRemaining).toBe(turns)
    expect(state.gold).toBe(gold + 2)
    expect(eventBus.getHistoryByEvent('tileDiscarded')).toHaveLength(1)
    expect(eventBus.getHistoryByEvent('tileDrawn')).toHaveLength(1)
    // Redrawn tiles stay in the river: the next REDRAW draws a new tile.
    expect(
      game.processAction({ type: 'redraw', tileIds: [other.id] }).success
    ).toBe(true)
    expect(state.handTiles).toContain(replacements[1])
    expect(state.handTiles).not.toContain(selected)
    expect(state.discards).toEqual(expect.arrayContaining([selected, other]))
    expect(state.handsRemaining).toBe(turns - 1)
    expect(state.gold).toBe(gold + 4)
    expect(activeTiles(state)).toEqual(before)
  })

  it('shuffles reproducibly and does not mutate the wall during availability checks', () => {
    function run(probes: number) {
      const { game, state } = fixture(24)
      const tileIds = state.handTiles.slice(0, 3).map((t) => t.id)
      const before = snapshot(state)
      const physical = activeTiles(state)
      for (let i = 0; i < probes; i++)
        expect(game.canPerformAction({ type: 'redraw', tileIds })).toBe(true)
      expect(snapshot(state)).toEqual(before)
      expect(game.processAction({ type: 'redraw', tileIds }).success).toBe(true)
      expect(activeTiles(state)).toEqual(physical)
      expect(state.handTiles).toHaveLength(before.hand.length)
      return state.wall.map((t) => [t.suit, t.rank, t.modifiers])
    }
    expect(run(12)).toEqual(run(0))
  })

  it('resolves nested bonus replacements and conserves playable tiles', () => {
    const { game, state } = fixture()
    const selected = state.handTiles.slice(0, 2).map((t) => t.id)
    const first = new Tile(TileSuit.Pinzu, 1, 'first')
    const second = new Tile(TileSuit.Pinzu, 2, 'second')
    state.wall = [
      Tile.createFlower(FlowerType.Plum, 'flower'),
      second,
      new Tile(TileSuit.Pinzu, 3, 'tail-1'),
      new Tile(TileSuit.Pinzu, 4, 'tail-2'),
    ]
    state.drawIndex = 0
    state.deadWall = [Tile.createSeason(SeasonType.Spring, 'season'), first]
    const before = activeTiles(state)
    const size = state.handTiles.length
    expect(game.canPerformAction({ type: 'redraw', tileIds: selected })).toBe(
      true
    )
    expect(
      game.processAction({ type: 'redraw', tileIds: selected }).success
    ).toBe(true)
    expect(state.handTiles).toHaveLength(size)
    expect(state.handTiles).toEqual(expect.arrayContaining([first, second]))
    expect(activeTiles(state)).toEqual(before)
  })

  it('rejects a raw-wall count that bonus chains cannot turn into replacements', () => {
    const { game, state } = fixture()
    state.wall = [Tile.createFlower(FlowerType.Plum, 'flower')]
    state.drawIndex = 0
    state.deadWall = [Tile.createSeason(SeasonType.Spring, 'season')]
    expectRejected(game, { type: 'redraw', tileIds: [state.handTiles[0].id] })
    expect(game.getAvailableActions()).not.toContain('redraw')
  })

  it('accounts for dead-wall replenishment consuming later main-wall replacements', () => {
    const { game, state } = fixture()
    state.wall = [
      Tile.createFlower(FlowerType.Plum, 'flower'),
      new Tile(TileSuit.Pinzu, 1, 'tail'),
    ]
    state.drawIndex = 0
    state.deadWall = [new Tile(TileSuit.Pinzu, 2, 'dead')]
    expectRejected(game, {
      type: 'redraw',
      tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
    })
    expect(
      game.canPerformAction({
        type: 'redraw',
        tileIds: [state.handTiles[0].id],
      })
    ).toBe(true)
  })

  it('creates Purple Seal rewards on redraw and respects capacity', () => {
    const { game, state } = fixture()
    expect(state.decreeSystem.acquireDecree(RIVER_TAX)).not.toBeNull()
    const purple = state.handTiles[0].withSeal(SealType.Purple)
    state.handTiles[0] = purple
    const gold = state.gold
    expect(
      calculateModifierEffects(purple.modifiers, 'redrawn').createdConsumable
    ).toBe('seal')
    expect(
      calculateModifierEffects(purple.modifiers, 'discarded').createdConsumable
    ).toBe('seal')
    expect(
      game.processAction({ type: 'redraw', tileIds: [purple.id] }).success
    ).toBe(true)
    expect(state.fateSeals).toHaveLength(1)
    expect(state.gold).toBe(gold + 2)
    while (game.canAddConsumable())
      game.addFateSeal(
        FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_the_empress)
      )
    const capacity = state.fateSeals.length
    const other = state.handTiles[0].withSeal(SealType.Purple)
    state.handTiles[0] = other
    expect(
      game.processAction({ type: 'redraw', tileIds: [other.id] }).success
    ).toBe(true)
    expect(state.fateSeals).toHaveLength(capacity)
    expect(state.discards).toEqual(expect.arrayContaining([purple, other]))
    expect(state.wall.slice(state.drawIndex)).not.toContain(purple)
    expect(state.gold).toBe(gold + 4)
  })

  it.each([CERULEAN_BELL, THE_HOOK])(
    'applies $name once per redraw cycle',
    (mandate) => {
      const { game, state } = fixture()
      state.mandateEffectSystem = MandateEffectSystem.fromJSON({
        ...state.mandateEffectSystem.toJSON(),
        activeMandate: mandate,
      })
      const onDraw = vi.spyOn(state.mandateEffectSystem, 'onDraw')
      const tileIds = state.handTiles.slice(0, 3).map((t) => t.id)
      expect(game.processAction({ type: 'redraw', tileIds }).success).toBe(true)
      expect(onDraw).toHaveBeenCalledTimes(1)
      if (mandate === CERULEAN_BELL)
        expect(state.mandateEffectSystem.getLockedTileIds()).toHaveLength(1)
      // The Hook sends two more tiles to the river after the redrawn ones.
      else expect(state.discards).toHaveLength(tileIds.length + 2)
    }
  )

  it('lets The Water forbid every REDRAW, free or paid, but not a play', () => {
    const { game } = fixture()
    game.getState().roundManager.getCurrentAct()!.rounds[2].bossMandate =
      THE_WATER
    advanceToRound(game, 'Boss')
    expect(game.getState().redrawsRemaining).toBe(0)
    expect(game.getState().handsRemaining).toBeGreaterThan(1)
    const tileIds = game
      .getHandTiles()
      .slice(0, 2)
      .map((t) => t.id)
    expectRejected(game, { type: 'redraw', tileIds: [tileIds[0]] })
    expect(game.canPerformAction({ type: 'play', tileIds })).toBe(true)
  })
})
