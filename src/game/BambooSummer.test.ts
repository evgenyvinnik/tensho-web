import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit, SeasonType, FlowerType } from '../core/Tile'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { protectSummerWall, applySeasonWallEffect } from './seasonWall'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})
const quadIds = ['terminal-0', 'terminal-1', 'terminal-2', 'terminal-3']
function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.seasonSystem.setAct(1)
  state.bambooSummerProtection = false
  state.summerReserve = []
  state.handTiles = [
    ...quadIds.map((id) => new Tile(TileSuit.Manzu, 1, id)),
    ...Array.from(
      { length: 10 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 7) + 2, `hand-${i}`)
    ),
  ]
  state.wall = [
    Tile.createSeason(SeasonType.Summer, 'summer'),
    ...Array.from(
      { length: 40 },
      (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `wall-${i}`)
    ),
  ]
  state.deadWall = [
    Tile.createFlower(FlowerType.Bamboo, 'bamboo'),
    new Tile(TileSuit.Wind, 1, 'dead'),
  ]
  state.drawIndex = 0
  state.selectedTileIds.clear()
  state.faceDownTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  expect(
    game.processAction({ type: 'redraw', tileIds: ['hand-9'] }).success
  ).toBe(true)
  expect(state.flowerSystem.hasFlowerType('Bamboo')).toBe(true)
  expect(state.summerReserve).toHaveLength(8)
  expect(state.bambooSummerProtection).toBe(false)
  return { game, state }
}
function physical(state: Readonly<OrchestratorState>) {
  return [
    ...state.handTiles,
    ...state.wall.slice(state.drawIndex),
    ...state.deadWall,
    ...state.discards,
    ...state.summerReserve,
  ]
    .map((t) => t.id)
    .sort()
}
function drought(state: OrchestratorState) {
  const system = new SeasonSystem()
  system.forceSetSeason('Summer', true)
  const seasonStack = [
    ...state.seasonSystem.getSeasonStack(),
    { ...system.getActiveSeason()!, id: 'drought' },
  ]
  state.seasonSystem = SeasonSystem.fromState({
    ...state.seasonSystem.toState(),
    seasonStack,
    activeSeason: seasonStack.at(-1)!,
  })
}

it('earns protection through a paid terminal quad, restores real tiles, and keeps forecasts pure', () => {
  const { game, state } = fixture()
  const before = game.captureRun(),
    ids = physical(state),
    template = [...state.wallTemplate]
  const reserved = [...state.summerReserve]
  const remaining = state.wall.length - state.drawIndex
  const score = game.previewScore(quadIds)!
  expect(game.canPerformAction({ type: 'play', tileIds: quadIds })).toBe(true)
  expect(game.previewScore(quadIds)).toEqual(score)
  expect(game.captureRun()).toEqual(before)
  expect(game.processAction({ type: 'play', tileIds: quadIds }).success).toBe(
    true
  )
  expect(state.score).toBe(score.finalScore)
  expect(state.handsRemaining).toBe(before.state.handsRemaining - 1)
  expect(state.bambooSummerProtection).toBe(true)
  expect(state.summerReserve).toEqual([])
  expect(state.wall.length - state.drawIndex).toBe(
    remaining + reserved.length - 4
  )
  expect(physical(state)).toEqual(ids)
  expect(state.wallTemplate).toEqual(template)
  for (const tile of reserved) expect(state.wall).toContain(tile)
  expect(game.getFloraState().bambooSummerProtection).toBe(true)
})

it('qualifies a complete hand, not just tactical plays', () => {
  const { game, state } = fixture()
  state.handTiles = [
    ...[1, 1, 1, 9, 9, 9].map(
      (rank, i) => new Tile(TileSuit.Manzu, rank, `term-${i}`)
    ),
    ...[2, 3, 4, 6, 7, 8].map(
      (rank, i) => new Tile(TileSuit.Pinzu, rank, `seq-${i}`)
    ),
    ...[1, 1].map((rank, i) => new Tile(TileSuit.Wind, rank, `eye-${i}`)),
  ]
  const ids = state.handTiles.map((t) => t.id),
    score = game.previewScore(ids)!
  expect(score.structure.kind).toBe('complete')
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.score).toBe(score.finalScore)
  expect(state.bambooSummerProtection).toBe(true)
  expect(state.summerReserve).toEqual([])
})

it.each([
  'three-terminals',
  'honors',
  'no-bamboo',
  'no-normal-summer',
  'drought',
] as const)('does not grant protection for %s', (reason) => {
  const { game, state } = fixture()
  let ids = quadIds
  if (reason === 'three-terminals') ids = quadIds.slice(0, 3)
  if (reason === 'honors')
    state.handTiles.splice(
      0,
      4,
      ...quadIds.map((id) => new Tile(TileSuit.Wind, 1, id))
    )
  if (reason === 'no-bamboo') state.flowerSystem.clear()
  if (reason === 'no-normal-summer')
    state.seasonSystem.forceSetSeason('Summer', true)
  if (reason === 'drought') drought(state)
  const reserved = [...state.summerReserve]
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.bambooSummerProtection).toBe(false)
  expect(state.summerReserve).toEqual(reserved)
})

it.each([false, true])(
  'respects Eternal Garden and its disabled=%s state',
  (disabled) => {
    const { game, state } = fixture()
    state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Plum, 'plum'))
    state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Orchid, 'orchid'))
    const owned = state.decreeSystem.acquireDecree(
      ALL_DECREES.find((d) => d.id === 'decree-eternal-garden')!
    )!
    expect(owned).not.toBeNull()
    drought(state)
    if (disabled)
      state.mandateEffectSystem = MandateEffectSystem.fromJSON({
        ...state.mandateEffectSystem.toJSON(),
        disabledDecreeIds: [owned.instanceId ?? owned.id],
      })
    expect(game.getFloraState().flowersSuppressed).toBe(disabled)
    expect(game.processAction({ type: 'play', tileIds: quadIds }).success).toBe(
      true
    )
    expect(state.bambooSummerProtection).toBe(!disabled)
  }
)

it('persists the earned reward exactly, and a later Drought does not rewind it', () => {
  const { game, state } = fixture()
  expect(game.processAction({ type: 'play', tileIds: quadIds }).success).toBe(
    true
  )
  drought(state)
  const saved = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  game.restoreRun(saved)
  expect(game.captureRun()).toEqual(saved)
  const restored = game.getState() as OrchestratorState
  expect(game.getFloraState().flowersSuppressed).toBe(true)
  restored.wall.splice(
    restored.drawIndex,
    0,
    Tile.createSeason(SeasonType.Summer, 'later-summer')
  )
  const action = {
    type: 'redraw' as const,
    tileIds: [restored.handTiles[0].id],
  }
  const before = game.captureRun()
  expect(game.canPerformAction(action)).toBe(true)
  expect(game.captureRun()).toEqual(before)
  expect(game.processAction(action).success).toBe(true)
  expect(restored.bambooSummerProtection).toBe(true)
  expect(restored.summerReserve).toEqual([])
})

it('includes protection in dry-run replacement capacity, without prematurely spending it', () => {
  const { game, state } = fixture()
  expect(game.processAction({ type: 'play', tileIds: quadIds }).success).toBe(
    true
  )
  state.wall = [
    Tile.createSeason(SeasonType.Summer, 'tiny-summer'),
    new Tile(TileSuit.Pinzu, 2, 'tiny-0'),
    new Tile(TileSuit.Pinzu, 3, 'tiny-1'),
  ]
  state.deadWall = [new Tile(TileSuit.Wind, 1, 'replacement')]
  state.drawIndex = 0
  const ids = state.handTiles.slice(0, 2).map((t) => t.id)
  const before = game.captureRun()
  expect(game.canPerformAction({ type: 'redraw', tileIds: ids })).toBe(true)
  expect(game.captureRun()).toEqual(before)
  expect(game.processAction({ type: 'redraw', tileIds: ids }).success).toBe(
    true
  )
  expect(state.summerReserve).toEqual([])
})

it('does not duplicate restored tiles or reinstate Summer shrinkage after repeated rewards', () => {
  const tiles = Array.from(
    { length: 10 },
    (_, i) => new Tile(TileSuit.Pinzu, 2, `t-${i}`)
  )
  const state = {
    wall: tiles.slice(0, 7),
    summerReserve: tiles.slice(7),
    drawIndex: 2,
    bambooSummerProtection: false,
  }
  expect(protectSummerWall(state)).toBe(3)
  expect(protectSummerWall(state)).toBe(0)
  const seasons = new SeasonSystem()
  seasons.forceSetSeason('Summer')
  applySeasonWallEffect(state, seasons.getActiveSeason())
  expect(state.wall).toEqual(tiles)
  expect(state.drawIndex).toBe(2)
  expect(state.summerReserve).toEqual([])
})

it('loads legacy saves without granting protection, and rejects malformed flags/reserves', () => {
  const { game } = fixture()
  const old = JSON.parse(JSON.stringify(game.captureRun()))
  old.version = 1
  delete old.state.bambooSummerProtection
  expect(parseClassicRunSnapshot(old)).toEqual(old)
  game.restoreRun(old)
  expect(game.getState().bambooSummerProtection).toBe(false)
  expect(game.captureRun()).toEqual({
    ...old,
    version: 2,
    state: { ...old.state, bambooSummerProtection: false },
  })
  for (const value of ['true', 1, null, true]) {
    const bad = JSON.parse(JSON.stringify(game.captureRun()))
    bad.state.bambooSummerProtection = value
    expect(() => parseClassicRunSnapshot(bad)).toThrow()
  }
})

it('expires at the next round and rejects unpaid attempts to earn it', () => {
  const { game, state } = fixture()
  state.wallTemplate = state.wallTemplate.filter((t) => !t.isBonus)
  state.handsRemaining = 0
  const before = game.captureRun()
  expect(game.processAction({ type: 'play', tileIds: quadIds }).success).toBe(
    false
  )
  expect(game.captureRun()).toEqual(before)
  state.handsRemaining = 3
  expect(game.processAction({ type: 'play', tileIds: quadIds }).success).toBe(
    true
  )
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  game.exitShop()
  expect(game.getState().bambooSummerProtection).toBe(false)
  expect(game.getState().seasonSystem.getSeasonStack()).toEqual([])
})

it.each([false, true])(
  'cleans up the reward on round completion (won=%s)',
  (won) => {
    const { game, state } = fixture()
    state.handsRemaining = 1
    if (won) {
      state.targetScore = 1
      state.roundManager.getCurrentRound()!.scoreTarget = 1
    }
    const result = game.processAction({ type: 'play', tileIds: quadIds })
    expect(result.success).toBe(true)
    expect(state.summerReserve).toEqual([])
    expect(state.phase).toBe(won ? 'shop' : 'gameOver')
    expect(state.bambooSummerProtection).toBe(false)
  }
)
