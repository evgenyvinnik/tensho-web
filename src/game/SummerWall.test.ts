import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tile, TileSuit, SeasonType } from '../core/Tile'
import { SeasonSystem } from '../systems/SeasonSystem'
import { applySeasonWallEffect } from './seasonWall'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'

const tiles = (count: number, prefix: string) =>
  Array.from(
    { length: count },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `${prefix}-${i}`)
  )

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(1)
  const state = game.getState() as OrchestratorState
  state.decreeSystem
    .getOwnedDecrees()
    .forEach((d) => state.decreeSystem.removeDecree(d.id))
  state.handTiles = tiles(10, 'hand')
  state.wall = [
    Tile.createSeason(SeasonType.Summer, 'summer'),
    ...tiles(20, 'wall'),
  ]
  state.deadWall = tiles(3, 'dead')
  state.summerReserve = []
  state.drawIndex = 0
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.seasonSystem.setAct(1)
  state.wallTemplate = [...state.handTiles, ...state.wall, ...state.deadWall]
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state }
}

afterEach(() => {
  vi.restoreAllMocks()
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
})

describe('Summer wall tradeoff', () => {
  it.each([0, 1, 5, 10, 21])(
    'retains floor(80%%) of %s unconsumed tiles without touching the consumed prefix',
    (count) => {
      const prefix = tiles(2, 'consumed')
      const live = tiles(count, 'live')
      const state = {
        wall: [...prefix, ...live],
        drawIndex: 2,
        summerReserve: [] as Tile[],
      }
      const seasons = new SeasonSystem()
      seasons.forceSetSeason('Summer')
      applySeasonWallEffect(state, seasons.getActiveSeason())
      const keep = Math.floor((count * 80) / 100)
      expect(state.wall).toEqual([...prefix, ...live.slice(0, keep)])
      expect(state.summerReserve).toEqual(live.slice(keep))
      for (const tile of state.summerReserve) expect(live).toContain(tile)
      expect(state.drawIndex).toBe(2)
    }
  )

  it('applies the score benefit and wall cost on a real Summer draw, keeping permanent tiles unchanged', () => {
    const { game, state } = fixture()
    const template = [...state.wallTemplate]
    const dead = [...state.deadWall]
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    expect(state.seasonSystem.calculateScoreModifier()).toBeCloseTo(1.3)
    expect(state.summerReserve.map((t) => t.id)).toEqual([
      'wall-16',
      'wall-17',
      'wall-18',
      'wall-19',
    ])
    // Summer retains 16; the replacement moves one of those into the dead wall.
    expect(state.wall.length - state.drawIndex).toBe(15)
    expect(state.handTiles).toContain(dead[0])
    expect(state.deadWall).toEqual([
      dead[1],
      dead[2],
      template.find((t) => t.id === 'wall-15'),
    ])
    expect(state.wallTemplate).toEqual(template)
  })

  it('compounds each new Summer against the then-remaining wall, not on every subsequent draw', () => {
    const { game, state } = fixture()
    state.wall.splice(1, 0, Tile.createSeason(SeasonType.Summer, 'summer-two'))
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    expect(state.summerReserve).toHaveLength(5)
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    expect(state.summerReserve).toHaveLength(8)
    expect(state.wall.length - state.drawIndex).toBe(10)
    expect(state.seasonSystem.calculateScoreModifier()).toBeCloseTo(1.69)
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    expect(state.summerReserve).toHaveLength(8)
    expect(state.wall.length - state.drawIndex).toBe(9)
  })

  it('does not apply the normal Summer tradeoff to corrupted Drought', () => {
    const { game, state } = fixture()
    state.seasonSystem.setAct(2)
    runRandom.start(3) // first corruption sample < .2
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    expect(state.seasonSystem.areFlowersSuppressed()).toBe(true)
    expect(state.summerReserve).toEqual([])
    expect(state.wall.length - state.drawIndex).toBe(19)
  })

  it('applies an Omen-locked Summer to a different physical Season tile', () => {
    const { game, state } = fixture()
    state.wall[0] = Tile.createSeason(SeasonType.Spring, 'locked-spring')
    useOmenStore.getState().setLockedSeason('Summer', 'fixture')
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    expect(state.summerReserve).toHaveLength(4)
    expect(state.seasonSystem.getActiveSeason()).toMatchObject({
      id: 'locked-spring',
      type: 'Summer',
    })
    expect(state.omenSystem.getLockedSeason()).toBeNull()
  })

  it('preflights the reduced pool without spending tiles, resources, locks or random draws', () => {
    const { game, state } = fixture()
    state.wall = [state.wall[0], ...tiles(2, 'tiny-wall')]
    state.deadWall = tiles(1, 'replacement')
    const wall = [...state.wall],
      dead = [...state.deadWall]
    const before = {
      gold: state.gold,
      redraws: state.redrawsRemaining,
      hand: [...state.handTiles],
    }
    const random = vi.spyOn(runRandom, 'next')
    const two = {
      type: 'redraw' as const,
      tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
    }
    for (let i = 0; i < 10; i++) expect(game.canPerformAction(two)).toBe(false)
    expect(game.processAction(two).success).toBe(false)
    expect(state.wall).toEqual(wall)
    expect(state.deadWall).toEqual(dead)
    expect(state.summerReserve).toEqual([])
    expect(state.seasonSystem.getSeasonStack()).toEqual([])
    expect({
      gold: state.gold,
      redraws: state.redrawsRemaining,
      hand: state.handTiles,
    }).toEqual(before)
    expect(random).not.toHaveBeenCalled()
    random.mockRestore()
    expect(
      game.processAction({ type: 'redraw', tileIds: [two.tileIds[0]] }).success
    ).toBe(true)
    expect(state.handTiles).toContain(dead[0])
    expect(state.summerReserve.map((t) => t.id)).toEqual(['tiny-wall-1'])
  })

  it('returns the whole permanent collection to the next round, including the set-aside identities', () => {
    const { game, state } = fixture()
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    const reserved = state.summerReserve.map((t) => t.id)
    const template = state.wallTemplate.map((t) => t.id).sort()
    expect(game.processAction({ type: 'skip' }).success).toBe(true)
    const physical = [
      ...state.handTiles,
      ...state.wall.slice(state.drawIndex),
      ...state.deadWall,
      ...state.summerReserve,
    ]
      .map((t) => t.id)
      .concat(state.seasonSystem.getSeasonStack().map((s) => s.id))
      .sort()
    expect(state.wallTemplate.map((t) => t.id).sort()).toEqual(template)
    expect(physical).toEqual(template)
    for (const id of reserved) expect(physical).toContain(id)
  })
})
