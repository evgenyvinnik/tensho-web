import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, FlowerType } from '../core/Tile'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function fixture(complete = false) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  for (const d of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(d.id)
  const tiles = [
    ...[1, 1, 1].map((rank, i) => new Tile(TileSuit.Wind, rank, `honor-${i}`)),
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
      (rank, i) => new Tile(TileSuit.Souzu, rank, `suit-${i}`)
    ),
    ...[5, 5].map((rank, i) => new Tile(TileSuit.Pinzu, rank, `pair-${i}`)),
  ]
  state.handTiles = tiles
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Manzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return {
    game,
    state,
    ids: (complete ? tiles : tiles.slice(0, 3)).map((t) => t.id),
  }
}

function acquire(state: OrchestratorState, id: string) {
  expect(
    state.decreeSystem.acquireDecree(ALL_DECREES.find((d) => d.id === id)!)
  ).not.toBeNull()
}

function flower(state: OrchestratorState) {
  state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Orchid, 'orchid'))
}

function pay(game: GameOrchestrator, ids: string[]) {
  const before = JSON.stringify(game.captureRun())
  const forecast = game.previewScore(ids)!
  expect(JSON.stringify(game.captureRun())).toBe(before)
  const score = game.getState().score
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().score - score).toBe(forecast.finalScore)
  return forecast
}

it.each([
  ['decree-half-suited', false],
  ['decree-half-suited', true],
  ['decree-gentle-breeze', false],
  ['decree-gentle-breeze', true],
  ['moonlit_seal', false],
  ['moonlit_seal', true],
] as const)(
  'Drought removes only Flower empowerment from %s (complete=%s)',
  (decree, complete) => {
    const { game, state, ids } = fixture(complete)
    acquire(state, decree)
    state.seasonSystem.forceSetSeason('Summer', true)
    const withoutFlower = game.previewScore(ids)!
    flower(state)
    expect(game.getFloraState().flowersSuppressed).toBe(true)
    const forecast = game.previewScore(ids)!
    expect(forecast.additiveBonus).toBe(withoutFlower.additiveBonus)
    expect(forecast.equation!.multiplier).toBe(
      withoutFlower.equation!.multiplier
    )
    expect(forecast.finalScore).toBe(withoutFlower.finalScore)
    expect(pay(game, ids).finalScore).toBe(withoutFlower.finalScore)
    expect(state.flowerSystem.getFlowerCount()).toBe(1)
  }
)

it('restores empowerment when Drought clears, without removing collected Flowers', () => {
  const { game, state, ids } = fixture()
  acquire(state, 'decree-gentle-breeze')
  flower(state)
  const normal = game.previewScore(ids)!
  state.seasonSystem.forceSetSeason('Summer', true)
  expect(game.previewScore(ids)!.equation!.multiplier).toBe(3)
  state.seasonSystem.clear()
  expect(pay(game, ids).equation).toEqual(normal.equation)
  expect(state.flowerSystem.getFlowerCount()).toBe(1)
})

it('uses Eternal Garden protection, but not when the protector is mandate-disabled', () => {
  const { game, state, ids } = fixture()
  acquire(state, 'decree-gentle-breeze')
  acquire(state, 'decree-eternal-garden')
  flower(state)
  const protectedScore = game.previewScore(ids)!
  state.seasonSystem.forceSetSeason('Summer', true)
  expect(game.getFloraState().flowersProtected).toBe(true)
  expect(game.previewScore(ids)!.finalScore).toBe(protectedScore.finalScore)
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    disabledDecreeIds: ['decree-eternal-garden'],
  })
  expect(game.getFloraState().flowersSuppressed).toBe(true)
  expect(pay(game, ids).equation!.multiplier).toBe(3)
})

it('stacks Drought with Frostbite without halving base tile or shape points', () => {
  const { game, state, ids } = fixture()
  acquire(state, 'decree-gentle-breeze')
  flower(state)
  state.seasonSystem.forceSetSeason('Summer', true)
  const drought = state.seasonSystem.toState()
  state.seasonSystem.forceSetSeason('Winter', true)
  const frostbite = state.seasonSystem.toState()
  state.seasonSystem = SeasonSystem.fromState({
    ...frostbite,
    seasonStack: [...drought.seasonStack, ...frostbite.seasonStack],
  })
  const forecast = pay(game, ids)
  expect(forecast.equation).toEqual({
    points: 85,
    multiplier: 2,
    adjustment: 0,
    total: 170,
  })
})

it("keeps a Decree's collected-Flower condition while suppressing the Flower's empowerment", () => {
  const { game, state, ids } = fixture()
  acquire(state, 'decree-flower-friend')
  flower(state)
  expect(game.previewScore(ids)!.additiveBonus).toBe(11)
  state.seasonSystem.forceSetSeason('Summer', true)
  expect(pay(game, ids).additiveBonus).toBe(10)
  expect(state.flowerSystem.getFlowerCount()).toBe(1)
})

it('applies the same suppression to copied effects', () => {
  const { game, state, ids } = fixture()
  acquire(state, 'decree-blueprint')
  acquire(state, 'decree-half-suited')
  flower(state)
  expect(game.previewScore(ids)!.additiveBonus).toBe(44)
  state.seasonSystem.forceSetSeason('Summer', true)
  expect(pay(game, ids).additiveBonus).toBe(40)
})
