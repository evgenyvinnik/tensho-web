import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, SeasonType, FlowerType } from '../core/Tile'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  for (const d of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(d.id)
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  state.faceDownTileIds.clear()
  state.handTiles = [
    ...[1, 2, 3].map((rank, i) => new Tile(TileSuit.Manzu, rank, `m-${i}`)),
    ...[4, 5, 6].map((rank, i) => new Tile(TileSuit.Souzu, rank, `s-${i}`)),
    ...[2, 3, 5, 6].map((rank, i) => new Tile(TileSuit.Pinzu, rank, `p-${i}`)),
    ...[1, 1].map((rank, i) => new Tile(TileSuit.Wind, rank, `w-${i}`)),
    ...[1, 3].map((rank, i) => new Tile(TileSuit.Dragon, rank, `spare-${i}`)),
  ]
  state.wall = Array.from(
    { length: 40 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.deadWall = []
  state.drawIndex = 0
  state.redrawsRemaining = 2
  state.wallTemplate = [...state.handTiles, ...state.wall]
  return { game, state }
}

afterEach(() => {
  eventBus.clear()
  eventBus.disableHistory()
  runRandom.reset()
  vi.restoreAllMocks()
})

it('offers a two-tile exchange without spending, scoring, advancing RNG, or emitting events', () => {
  const { game, state } = fixture()
  eventBus.enableHistory()
  const before = game.captureRun(),
    history = eventBus.getHistory()
  const random = vi.spyOn(runRandom, 'next')
  const advice = game.getHandBuildingAdvice()
  expect(advice.kind).toBe('redraw')
  if (advice.kind !== 'redraw') throw Error('No plan')
  expect(advice.exchange.map((t) => t.id)).toEqual(['spare-0', 'spare-1'])
  expect(advice.keep).toHaveLength(12)
  expect(advice.needed).toBe(2)
  expect(advice.redrawsRemaining).toBe(2)
  expect(game.getHandBuildingAdvice()).toEqual(advice)
  expect(game.captureRun()).toEqual(before)
  expect(eventBus.getHistory()).toEqual(history)
  expect(random).not.toHaveBeenCalled()
  const redraw = game.processAction({
    type: 'redraw',
    tileIds: advice.exchange.map((t) => t.id),
  })
  expect(redraw.success).toBe(true)
  expect(state.redrawsRemaining).toBe(1)
  expect(state.handTiles).toHaveLength(14)
  for (const t of advice.keep) expect(state.handTiles).toContainEqual(t)
})

it('does not expose faces, shape or candidates when any current tile is hidden', () => {
  const { game, state } = fixture()
  state.faceDownTileIds.add(state.handTiles[0].id)
  const preview = vi.spyOn(game, 'previewScore')
  expect(game.getHandBuildingAdvice()).toEqual({ kind: 'hidden' })
  expect(preview).not.toHaveBeenCalled()
})

it('does not rank candidates by the unseen wall', () => {
  const { game, state } = fixture()
  const original = game.getHandBuildingAdvice()
  state.wall = state.wall.map((t) => new Tile(TileSuit.Souzu, 9, t.id))
  expect(game.getHandBuildingAdvice()).toEqual(original)
})

it.each(['empty', 'exhausted', 'bonus-chain', 'inactive'] as const)(
  'has no actionable plan for %s',
  (kind) => {
    const { game, state } = fixture()
    if (kind === 'empty') state.wall = []
    if (kind === 'exhausted') state.redrawsRemaining = 0
    if (kind === 'bonus-chain')
      state.wall = [new Tile(TileSuit.Flower, 1, 'bonus')]
    if (kind === 'inactive') state.phase = 'shop'
    expect(game.getHandBuildingAdvice()).toEqual({ kind: 'unavailable' })
  }
)

it('keeps locked tiles and checks multi-tile replacement capacity', () => {
  const { game, state } = fixture()
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    lockedTileIds: ['spare-0'],
  })
  state.wall = state.wall.slice(0, 1)
  const advice = game.getHandBuildingAdvice()
  expect(advice.kind).toBe('redraw')
  if (advice.kind !== 'redraw') throw Error('No plan')
  expect(advice.exchange).toHaveLength(1)
  expect(advice.keep.some((t) => t.id === 'spare-0')).toBe(true)
  expect(
    game.canPerformAction({
      type: 'redraw',
      tileIds: advice.exchange.map((t) => t.id),
    })
  ).toBe(true)
})

it.each([
  'broken_stair_edict',
  'false_eye_mandate',
  'honor_transmutation',
  'celestial_wildcard',
  'shanten_clemency',
])('explains unsupported active grammar: %s', (id) => {
  const { game, state } = fixture()
  state.decreeSystem.acquireDecree(ALL_DECREES.find((d) => d.id === id)!)
  expect(game.getHandBuildingAdvice()).toEqual({ kind: 'unsupported' })
})

it('respects Winter and structural Flower permissions rather than presenting ordinary advice', () => {
  const { game, state } = fixture()
  state.seasonSystem.addSeason(
    Tile.createSeason(SeasonType.Winter, 'winter'),
    'Winter'
  )
  expect(game.getHandBuildingAdvice()).toEqual({ kind: 'unsupported' })
  state.seasonSystem.clear()
  for (const mutation of ['plum_overlap', 'bamboo_wild_anchor']) {
    state.flowerSystem.addFlower(
      Tile.createFlower(
        mutation === 'plum_overlap' ? FlowerType.Plum : FlowerType.Bamboo,
        mutation
      )
    )
    state.flowerSystem.unlockMutation(mutation)
    expect(game.getHandBuildingAdvice()).toEqual({ kind: 'unsupported' })
    state.flowerSystem.clear()
  }
})

it('does not exchange a complete hand or a known round-clearing play', () => {
  const { game, state } = fixture()
  state.targetScore = 1
  expect(game.getHandBuildingAdvice()).toEqual({ kind: 'clear' })
  state.targetScore = 1e9
  state.handTiles[12] = new Tile(TileSuit.Pinzu, 1, 'finish-a')
  state.handTiles[13] = new Tile(TileSuit.Pinzu, 4, 'finish-b')
  expect(game.getHandBuildingAdvice()).toEqual({ kind: 'complete' })
})

it.each([13, 15])(
  'does not apply fourteen-tile advice to a %s-tile rack',
  (count) => {
    const { game, state } = fixture()
    state.handTiles =
      count === 13
        ? state.handTiles.slice(0, 13)
        : [...state.handTiles, new Tile(TileSuit.Wind, 2, 'extra')]
    expect(game.getHandBuildingAdvice()).toEqual({ kind: 'unsupported' })
  }
)
