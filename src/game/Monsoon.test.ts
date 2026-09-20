import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tile, TileSuit, FlowerType, SeasonType } from '../core/Tile'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { runRandom } from './RunRandom'
import { takeWallTile, takeDeadWallTile } from './wallDraw'
import { eventBus } from './EventBus'
import { useOmenStore } from '../stores/omenStore'
import { OmenTagSystem } from '../systems/OmenTagSystem'

const tile = (rank: number, id = `tile-${rank}`) =>
  new Tile(TileSuit.Pinzu, rank, id)

function fixture(seed = 1, monsoon = true) {
  const game = new GameOrchestrator()
  game.startNewRun(seed)
  const state = game.getState() as OrchestratorState
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  state.seasonSystem.clear()
  if (monsoon) state.seasonSystem.forceSetSeason('Spring', true)
  state.wall = [tile(1), tile(2), tile(3), tile(4), tile(5)]
  state.deadWall = []
  state.drawIndex = 0
  runRandom.start(seed)
  return { game, state }
}

function liveSnapshot(state: OrchestratorState) {
  return {
    hand: state.handTiles.map((t) => t.id),
    wall: state.wall.map((t) => t.id),
    dead: state.deadWall.map((t) => t.id),
    drawIndex: state.drawIndex,
    seasons: state.seasonSystem.toState(),
    flowers: state.flowerSystem.getCollection(),
    omen: state.omenSystem.getLockedSeason(),
    redraws: state.redrawsRemaining,
    gold: state.gold,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  eventBus.disableHistory()
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
})

describe('physical wall drawing', () => {
  it('keeps ordinary FIFO order and never consumes randomness for ordinary or empty draws', () => {
    const a = tile(1),
      b = tile(2),
      c = tile(3),
      d = tile(4)
    const state = { wall: [a, b, c], deadWall: [d], drawIndex: 1 }
    const random = { int: vi.fn(() => 0) }
    expect(takeWallTile(state, false, random)).toBe(b)
    expect(takeDeadWallTile(state, false, random)).toBe(d)
    expect(state.deadWall).toEqual([c])
    expect(state.wall).toEqual([a, b])
    expect(takeWallTile(state, true, random)).toBeNull()
    expect(takeDeadWallTile(state, true, random)).toBe(c)
    expect(takeDeadWallTile(state, true, random)).toBeNull()
    expect(random.int).not.toHaveBeenCalled()
  })

  it('samples the unconsumed wall only and retains exact tile identities', () => {
    const tiles = [tile(1), tile(2), tile(3), tile(4)]
    const state = { wall: [...tiles], deadWall: [], drawIndex: 1 }
    const random = { int: vi.fn((_stream: string, bound: number) => bound - 1) }
    const draws = [
      takeWallTile(state, true, random),
      takeWallTile(state, true, random),
      takeWallTile(state, true, random),
    ]
    expect(draws).toEqual([tiles[3], tiles[1], tiles[2]])
    expect(new Set(draws).size).toBe(3)
    expect(state.wall[0]).toBe(tiles[0])
    expect(random.int.mock.calls).toEqual([
      ['wall', 3],
      ['wall', 2],
    ])
  })
})

describe('Monsoon through actual actions', () => {
  it.each([false, true])(
    'changes normal draw order only while Monsoon is active (%s)',
    (monsoon) => {
      const { game, state } = fixture(1, monsoon)
      state.handTiles = state.handTiles.slice(0, 10)
      const expected = state.wall[monsoon ? 3 : 0] // seed 1: first wall sample = .60277
      expect(game.processAction({ type: 'draw' }).success).toBe(true)
      expect(state.handTiles).toContain(expected)
      expect(state.drawIndex).toBe(1)
    }
  )

  it('randomizes a bonus replacement and conserves the dead wall replenishment', () => {
    const { game, state } = fixture(1)
    state.handTiles = state.handTiles.slice(0, 10)
    const flower = Tile.createFlower(FlowerType.Plum, 'flower')
    const flowerCount = state.flowerSystem.getFlowerCount()
    const tail = tile(8, 'tail')
    state.wall = [tail, flower] // first sample chooses the Flower at index 1
    state.deadWall = [
      tile(1, 'dead-a'),
      tile(2, 'dead-b'),
      tile(3, 'dead-c'),
      tile(4, 'dead-d'),
    ]
    const expected = state.deadWall[1] // second sample .26758 selects index 1
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    expect(state.handTiles).toContain(expected)
    expect(state.deadWall).toContain(tail)
    expect(state.deadWall).not.toContain(expected)
    expect(state.flowerSystem.getFlowerCount()).toBe(flowerCount + 1)
    expect(state.wall.length - state.drawIndex).toBe(0)
  })

  it('can activate Monsoon mid-chain and apply it immediately to the replacement', () => {
    const { game, state } = fixture(3, false)
    state.handTiles = state.handTiles.slice(0, 10)
    state.seasonSystem.setAct(2)
    state.wall = [
      Tile.createSeason(SeasonType.Spring, 'spring'),
      tile(8, 'tail'),
    ]
    state.deadWall = [tile(1, 'dead-a'), tile(2, 'dead-b'), tile(3, 'dead-c')]
    const expected = state.deadWall[1] // .1764 corrupts Spring; .3641 picks replacement 1
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    expect(state.seasonSystem.areDrawsRandomized()).toBe(true)
    expect(state.handTiles).toContain(expected)
  })

  it('previews mid-chain corruption and Omen locks without rewards, RNG advancement or consumption', () => {
    function run(probes: number, locked: boolean) {
      eventBus.disableHistory()
      const { game, state } = fixture(3, false)
      state.seasonSystem.setAct(2)
      state.wall = [
        Tile.createSeason(SeasonType.Spring, 'spring'),
        tile(8, 'tail'),
      ]
      state.deadWall = [tile(1, 'dead-a'), tile(2, 'dead-b'), tile(3, 'dead-c')]
      if (locked) useOmenStore.getState().setLockedSeason('Winter', 'fixture')
      const action = {
        type: 'redraw' as const,
        tileIds: [state.handTiles[0].id],
      }
      const before = liveSnapshot(state)
      const random = vi.spyOn(runRandom, 'next')
      eventBus.enableHistory()
      for (let i = 0; i < probes; i++) {
        expect(game.canPerformAction(action)).toBe(true)
        game.getAvailableActions()
      }
      expect(liveSnapshot(state)).toEqual(before)
      expect(random).not.toHaveBeenCalled()
      expect(eventBus.getHistory()).toEqual([])
      random.mockRestore()
      expect(game.processAction(action).success).toBe(true)
      expect(state.omenSystem.getLockedSeason()).toBeNull()
      expect(state.seasonSystem.areDrawsRandomized()).toBe(!locked)
      const result = {
        received: state.handTiles
          .filter((t) => t.id.startsWith('dead-'))
          .map((t) => t.id),
        nextRandom: runRandom.next('wall'),
      }
      useOmenStore.getState().clearForNewRun()
      eventBus.clear()
      return result
    }
    expect(run(20, false)).toEqual(run(0, false))
    expect(run(20, true)).toEqual(run(0, true))
  })

  it('rejects unsupplyable random redraws without changing the physical wall or spending resources', () => {
    const { game, state } = fixture(1)
    // The first random pick is an unreplacable bonus despite a raw count of two.
    state.wall = [tile(1), Tile.createFlower(FlowerType.Plum, 'flower')]
    state.deadWall = []
    const before = liveSnapshot(state)
    const action = { type: 'redraw' as const, tileIds: [state.handTiles[0].id] }
    const random = vi.spyOn(runRandom, 'next')
    eventBus.enableHistory()
    expect(game.canPerformAction(action)).toBe(false)
    expect(game.processAction(action).success).toBe(false)
    expect(liveSnapshot(state)).toEqual(before)
    expect(random).not.toHaveBeenCalled()
    expect(eventBus.getHistory()).toEqual([])
  })

  it.each([1, 2, 3])(
    'supplies %s replacements across a randomized nested Season chain without losing playable identities',
    (count) => {
      const { game, state } = fixture(3, false)
      state.seasonSystem.setAct(2)
      state.wall = [
        Tile.createSeason(SeasonType.Spring, 'spring'),
        tile(1, 'live-a'),
        tile(2, 'live-b'),
        tile(3, 'tail-a'),
        tile(4, 'tail-b'),
        tile(6, 'tail-c'),
        tile(7, 'tail-d'),
        tile(8, 'tail-e'),
      ]
      state.deadWall = [
        Tile.createSeason(SeasonType.Summer, 'summer'),
        tile(5, 'dead'),
      ]
      const identities = () =>
        [
          ...state.handTiles,
          ...state.wall.slice(state.drawIndex),
          ...state.deadWall,
          ...state.summerReserve,
        ]
          .filter((t) => !t.isSeason && !t.isFlower)
          .map((t) => t.id)
          .sort()
      const before = identities()
      const handSize = state.handTiles.length
      const action = {
        type: 'redraw' as const,
        tileIds: state.handTiles.slice(0, count).map((t) => t.id),
      }
      for (let i = 0; i < 5; i++)
        expect(game.canPerformAction(action)).toBe(true)
      expect(game.processAction(action).success).toBe(true)
      expect(state.seasonSystem.getSeasonStack().map((s) => s.id)).toEqual([
        'spring',
        'summer',
      ])
      expect(state.handTiles).toHaveLength(handSize)
      expect(identities()).toEqual(before)
      expect(state.redrawsRemaining).toBe(2)
    }
  )

  it('consumes a restored Omen lock exactly once, matching the preview', () => {
    const { game, state } = fixture(3, false)
    state.seasonSystem.setAct(2)
    state.omenSystem = OmenTagSystem.fromState({
      ...state.omenSystem.toState(),
      lockedSeasonType: 'Winter',
    })
    state.wall = [Tile.createSeason(SeasonType.Spring, 'spring')]
    state.deadWall = [tile(1, 'dead-a')]
    const action = { type: 'redraw' as const, tileIds: [state.handTiles[0].id] }
    expect(game.canPerformAction(action)).toBe(true)
    expect(state.omenSystem.getLockedSeason()).toBe('Winter')
    expect(game.processAction(action).success).toBe(true)
    expect(state.seasonSystem.getActiveSeason()?.type).toBe('Winter')
    expect(state.seasonSystem.areDrawsRandomized()).toBe(false)
    expect(state.omenSystem.applyLockedSeason()).toBeNull()
  })

  it('returns to FIFO after round effects are cleared', () => {
    const { game, state } = fixture(1)
    state.seasonSystem.clear()
    state.handTiles = state.handTiles.slice(0, 10)
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    expect(state.handTiles).toContain(state.wall[0])
    expect(state.wall[0].id).toBe('tile-1')
  })
})
