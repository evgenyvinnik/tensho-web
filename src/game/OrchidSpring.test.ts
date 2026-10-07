import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, FlowerType, SeasonType } from '../core/Tile'
import { SeasonSystem } from '../systems/SeasonSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { ALL_DECREES } from '../systems/DecreeSystem'
import {
  THE_SERPENT,
  THE_HOOK,
  THE_FISH,
  CERULEAN_BELL,
} from '../config/mandateDefinitions'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'

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
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.flowerSystem.clear()
  state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Orchid, 'orchid'))
  state.seasonSystem.clear()
  state.seasonSystem.setAct(1)
  state.seasonSystem.forceSetSeason('Spring')
  state.mandateEffectSystem.deactivateMandate()
  state.handTiles = Array.from(
    { length: 16 },
    (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `hand-${i}`)
  )
  state.wall = [
    new Tile(TileSuit.Wind, 1, 'honor'),
    ...Array.from(
      { length: 50 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
    ),
  ]
  state.drawIndex = 0
  state.deadWall = [
    new Tile(TileSuit.Manzu, 1, 'gift'),
    new Tile(TileSuit.Dragon, 1, 'gift-honor'),
  ]
  state.summerReserve = []
  state.faceDownTileIds.clear()
  state.selectedTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state }
}

function physical(state: Readonly<OrchestratorState>) {
  return [
    ...state.handTiles,
    ...state.discards,
    ...state.deadWall,
    ...state.wall.slice(state.drawIndex),
    ...state.summerReserve,
  ]
    .filter((t) => !t.isBonus)
    .map((t) => t.id)
    .sort()
}

function addDrought(state: OrchestratorState) {
  const drought = new SeasonSystem()
  drought.forceSetSeason('Summer', true)
  const activeSeason = { ...drought.getActiveSeason()!, id: 'drought' }
  state.seasonSystem = SeasonSystem.fromState({
    ...state.seasonSystem.toState(),
    activeSeason,
    seasonStack: [...state.seasonSystem.getSeasonStack(), activeSeason],
  })
}

it.each(['draw', 'discard', 'redraw', 'play'] as const)(
  'earns an extra physical tile through %s without changing normal capacity or previews',
  (type) => {
    const { game, state } = fixture()
    if (type === 'draw') state.handTiles.pop()
    const action =
      type === 'discard'
        ? { type, tileId: 'hand-0' }
        : type === 'play'
          ? { type, tileIds: ['hand-0', 'hand-1', 'hand-2'] }
          : type === 'redraw'
            ? { type, tileIds: ['hand-0'] }
            : { type }
    const before = game.captureRun(),
      identities = physical(state)
    const onDraw = vi.spyOn(state.mandateEffectSystem, 'onDraw')
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.captureRun()).toEqual(before)
    const preview =
      type === 'play'
        ? game.previewScore(['hand-0', 'hand-1', 'hand-2'])!
        : null
    expect(game.processAction(action).success).toBe(true)
    expect(state.handTiles).toHaveLength(17)
    expect(game.canPerformAction({ type: 'draw' })).toBe(false)
    expect(state.handTiles.map((t) => t.id)).toContain('gift')
    expect(physical(state)).toEqual(identities)
    expect(state.seasonSystem.getDrawBonus()).toBe(2)
    expect(onDraw).toHaveBeenCalledTimes(1)
    expect(onDraw.mock.calls[0][1].id).toBe('gift')
    if (preview) expect(state.score).toBe(preview.finalScore)
    if (type === 'redraw')
      expect(state.handTiles.some((t) => t.id === 'hand-0')).toBe(false)
    const snapshot = parseClassicRunSnapshot(
      JSON.parse(JSON.stringify(game.captureRun()))
    )
    game.restoreRun(snapshot)
    expect(game.captureRun()).toEqual(snapshot)
    expect(
      game.processAction({
        type: 'play',
        tileIds: ['hand-3', 'hand-4', 'hand-5'],
      }).success
    ).toBe(true)
    expect(game.getHandTiles()).toHaveLength(16)
  }
)

it('pays once for each natural Honor, not once per cycle or recursively for bonus Honors', () => {
  const { game, state } = fixture()
  state.wall.unshift(
    new Tile(TileSuit.Dragon, 2, 'honor-2'),
    new Tile(TileSuit.Wind, 3, 'honor-3')
  )
  const bloom = vi.fn(),
    draws: string[] = []
  eventBus.on('orchidBloom', bloom)
  eventBus.on('tileDrawn', ({ tileId }) => draws.push(tileId))
  const result = game.processAction({
    type: 'redraw',
    tileIds: ['hand-0', 'hand-1', 'hand-2'],
  })
  expect(result.success).toBe(true)
  expect(state.handTiles).toHaveLength(19)
  expect(state.handTiles.some((t) => t.id === 'gift-honor')).toBe(true)
  expect(bloom).toHaveBeenCalledWith({ count: 3 })
  expect(draws).toHaveLength(6)
  expect(new Set(draws).size).toBe(6)
  expect(
    result.effects.filter((effect) => effect.type === 'tile_added')
  ).toHaveLength(6)
})

it('pays the complete-hand forecast before granting extra tiles in its refill', () => {
  const { game, state } = fixture()
  state.handTiles = [
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
      (rank, i) => new Tile(TileSuit.Souzu, rank, `run-${i}`)
    ),
    ...[2, 3, 4].map((rank, i) => new Tile(TileSuit.Pinzu, rank, `run-b-${i}`)),
    new Tile(TileSuit.Wind, 1, 'eye-1'),
    new Tile(TileSuit.Wind, 1, 'eye-2'),
  ]
  const ids = state.handTiles.map((t) => t.id)
  const before = game.captureRun(),
    preview = game.previewScore(ids)!
  expect(preview.structure.kind).toBe('complete')
  expect(game.captureRun()).toEqual(before)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.score - before.state.score).toBe(preview.finalScore)
  expect(state.handTiles).toHaveLength(17)
  expect(state.handTiles.some((t) => t.id === 'gift')).toBe(true)
  expect(state.handsRemaining).toBe(before.state.handsRemaining - 1)
})

it.each([
  'no-orchid',
  'no-spring',
  'corrupted-spring',
  'drought',
  'held-honor',
] as const)('does not grant a draw for %s', (reason) => {
  const { game, state } = fixture()
  if (reason === 'no-orchid') state.flowerSystem.clear()
  if (reason === 'no-spring' || reason === 'corrupted-spring') {
    state.seasonSystem.clear()
    if (reason === 'corrupted-spring')
      state.seasonSystem.forceSetSeason('Spring', true)
    state.handTiles = state.handTiles.slice(0, 14)
  }
  if (reason === 'drought') addDrought(state)
  if (reason === 'held-honor') {
    state.handTiles[1] = new Tile(TileSuit.Wind, 2, 'held-honor')
    state.wall.shift()
  }
  const count = state.handTiles.length,
    dead = [...state.deadWall]
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-0' }).success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(count)
  expect(state.deadWall).toEqual(dead)
})

it.each([false, true])(
  'respects Eternal Garden with disabled=%s',
  (disabled) => {
    const { game, state } = fixture()
    addDrought(state)
    state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Plum, 'plum'))
    state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Bamboo, 'bamboo'))
    const owned = state.decreeSystem.acquireDecree(
      ALL_DECREES.find((d) => d.id === 'decree-eternal-garden')!
    )!
    expect(owned).not.toBeNull()
    if (disabled)
      state.mandateEffectSystem = MandateEffectSystem.fromJSON({
        ...state.mandateEffectSystem.toJSON(),
        disabledDecreeIds: [owned.instanceId ?? owned.id],
      })
    expect(
      game.processAction({ type: 'discard', tileId: 'hand-0' }).success
    ).toBe(true)
    expect(state.handTiles).toHaveLength(disabled ? 16 : 17)
  }
)

it('uses replacement-chain Honors after collecting Orchid, but not Honors drawn before collection', () => {
  const { game, state } = fixture()
  state.flowerSystem.clear()
  state.wall.splice(1, 0, Tile.createFlower(FlowerType.Orchid, 'new-orchid'))
  state.deadWall = [
    new Tile(TileSuit.Dragon, 1, 'replacement-honor'),
    new Tile(TileSuit.Manzu, 1, 'earned'),
  ]
  expect(
    game.processAction({ type: 'redraw', tileIds: ['hand-0', 'hand-1'] })
      .success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(17)
  expect(state.handTiles.some((t) => t.id === 'earned')).toBe(true)
})

it('fills Spring drawn through Dead Wall Writ, then resolves Orchid once before the Mandate', () => {
  const { game, state } = fixture()
  state.seasonSystem.clear()
  state.handTiles = state.handTiles.slice(0, 14)
  state.deadWall.unshift(Tile.createSeason(SeasonType.Spring, 'new-spring'))
  state.deadWall[1] = new Tile(TileSuit.Dragon, 1, 'replacement-honor')
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'dead_wall_writ')!
  )
  const onDraw = vi.spyOn(state.mandateEffectSystem, 'onDraw')
  expect(game.useDeadWallWrit('hand-0').success).toBe(true)
  // One replacement Honor plus the live-wall Honor in Spring's two new spaces.
  expect(state.handTiles).toHaveLength(18)
  expect(onDraw).toHaveBeenCalledTimes(1)
  expect(game.canUseDeadWallWrit('hand-1')).toBe(false)
})

it.each([THE_HOOK, THE_FISH, CERULEAN_BELL, THE_SERPENT])(
  'settles $name once after all extra draws',
  (mandate) => {
    const { game, state } = fixture()
    state.mandateEffectSystem.activateMandate(mandate, state.handTiles, [])
    const onDraw = vi.spyOn(state.mandateEffectSystem, 'onDraw')
    expect(
      game.processAction(
        mandate === THE_FISH
          ? { type: 'play', tileIds: ['hand-0', 'hand-1', 'hand-2'] }
          : { type: 'discard', tileId: 'hand-0' }
      ).success
    ).toBe(true)
    expect(onDraw).toHaveBeenCalledTimes(1)
    expect(onDraw.mock.calls[0][1].id).toBe('gift')
    expect(state.handTiles.some((t) => t.id === 'gift')).toBe(true)
    if (mandate === CERULEAN_BELL)
      expect(state.mandateEffectSystem.getLockedTileIds()).toHaveLength(1)
    if (mandate === THE_HOOK) expect(state.handTiles).toHaveLength(15)
    if (mandate === THE_FISH)
      expect(state.faceDownTileIds.has('gift')).toBe(true)
    if (mandate === THE_SERPENT) expect(state.handTiles).toHaveLength(19)
  }
)

it('does not invent tiles or carry unpaid credits into a later action', () => {
  const { game, state } = fixture()
  state.deadWall = []
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-0' }).success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(16)
  state.deadWall = [new Tile(TileSuit.Manzu, 1, 'late-dead')]
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-1' }).success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(16)
  expect(state.deadWall[0].id).toBe('late-dead')
})

it('resolves bonus Flowers and Spring without recursively farming new Honor draws', () => {
  const { game, state } = fixture()
  state.deadWall = [
    Tile.createSeason(SeasonType.Spring, 'extra-spring'),
    new Tile(TileSuit.Dragon, 1, 'extra-honor'),
  ]
  const identities = physical(state)
  expect(
    game.processAction({ type: 'discard', tileId: 'hand-0' }).success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(18)
  expect(state.seasonSystem.getDrawBonus()).toBe(4)
  expect(physical(state)).toEqual(identities)
})

it('does not retroactively credit an Honor drawn before Spring activates', () => {
  const { game, state } = fixture()
  state.seasonSystem.clear()
  state.handTiles = state.handTiles.slice(0, 14)
  state.wall.splice(1, 0, Tile.createSeason(SeasonType.Spring, 'late-spring'))
  // The dead-wall replacement and the two new spaces are all suited.
  state.deadWall[1] = new Tile(TileSuit.Pinzu, 1, 'unused-dead')
  expect(
    game.processAction({ type: 'redraw', tileIds: ['hand-0', 'hand-1'] })
      .success
  ).toBe(true)
  expect(state.handTiles).toHaveLength(16)
  expect(state.deadWall[0].id).toBe('unused-dead')
})

it('retains already earned credits when a later normal draw activates Drought', () => {
  const { game, state } = fixture()
  state.seasonSystem.setAct(2)
  state.wall.splice(1, 0, Tile.createSeason(SeasonType.Summer, 'later-drought'))
  // Force only this corruption choice, not the draw/replacement implementation.
  vi.spyOn(state.seasonSystem, 'addSeason').mockImplementation(() => {
    addDrought(state)
    return state.seasonSystem.getActiveSeason()
  })
  state.deadWall[1] = new Tile(TileSuit.Manzu, 2, 'earned-before-drought')
  expect(
    game.processAction({ type: 'redraw', tileIds: ['hand-0', 'hand-1'] })
      .success
  ).toBe(true)
  expect(game.getFloraState().flowersSuppressed).toBe(true)
  expect(state.handTiles).toHaveLength(17)
  expect(state.handTiles.some((t) => t.id === 'earned-before-drought')).toBe(
    true
  )
})

it('normal starting deals grant extra draws and round expiry never replays old credits', () => {
  const { game, state } = fixture()
  // Control draw sources at the next real round boundary, not the deal method.
  const sources = game as unknown as {
    drawTileInternal(): Tile | null
    drawFromDeadWall(): Tile | null
  }
  let index = 0
  vi.spyOn(sources, 'drawTileInternal')
    .mockImplementation(() => new Tile(TileSuit.Pinzu, 2, `new-${index++}`))
    .mockReturnValueOnce(Tile.createSeason(SeasonType.Spring, 'dealt-spring'))
    .mockReturnValueOnce(new Tile(TileSuit.Wind, 1, 'dealt-honor'))
  vi.spyOn(sources, 'drawFromDeadWall')
    .mockReturnValueOnce(new Tile(TileSuit.Pinzu, 1, 'dealt-replacement'))
    .mockReturnValueOnce(new Tile(TileSuit.Dragon, 1, 'dealt-bonus'))
  // Skip begins the next round directly (there is no Tea House after a skip).
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  expect(state.seasonSystem.getDrawBonus()).toBe(2)
  expect(game.getState().phase).toBe('gameplay')
  expect(game.getHandTiles()).toHaveLength(17)
  expect(game.getHandTiles().some((t) => t.id === 'dealt-bonus')).toBe(true)
})
