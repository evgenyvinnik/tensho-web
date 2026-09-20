import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus, type GameEventData } from './EventBus'
import { runRandom } from './RunRandom'
import { Tile, TileSuit, FlowerType } from '../core/Tile'
import { EditionType } from '../core/TileModifier'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { useOmenStore } from '../stores/omenStore'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

it('stacks two Frostbites, rather than treating their presence as a boolean', () => {
  const { game, state, ids } = fixture()
  acquire(state, 'decree-half-suited')
  acquire(state, 'decree-gentle-breeze')
  state.seasonSystem.forceSetSeason('Winter', true)
  const seasonState = state.seasonSystem.toState()
  state.seasonSystem = SeasonSystem.fromState({
    ...seasonState,
    seasonStack: [
      ...seasonState.seasonStack,
      { ...seasonState.seasonStack[0], id: 'second-frostbite' },
    ],
  })
  expect(state.seasonSystem.getDecreeEffectModifier()).toBe(0.25)
  expect(pay(game, ids).equation).toEqual({
    points: 50,
    multiplier: 1.5,
    adjustment: 0,
    total: 75,
  })
})

function fixture(complete = false) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem
    .getOwnedDecrees()
    .forEach((d) => state.decreeSystem.removeDecree(d.id))
  state.handTiles = complete
    ? [
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
          (n, i) => new Tile(TileSuit.Souzu, n, `run-${i}`)
        ),
        ...[6, 6, 6].map((n, i) => new Tile(TileSuit.Manzu, n, `triplet-${i}`)),
        ...[5, 5].map((n, i) => new Tile(TileSuit.Pinzu, n, `pair-${i}`)),
      ]
    : [4, 5, 6].map((n, i) => new Tile(TileSuit.Souzu, n, `play-${i}`))
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state, ids: state.handTiles.map((t) => t.id) }
}

function acquire(state: OrchestratorState, id: string) {
  const definition = ALL_DECREES.find((d) => d.id === id)!
  expect(definition).toBeDefined()
  expect(state.decreeSystem.acquireDecree(definition)).not.toBeNull()
}

function pay(game: GameOrchestrator, ids: string[]) {
  const preview = game.previewScore(ids)!
  const before = game.getState().score
  let paid: GameEventData['handPlayed'] | undefined
  const off = eventBus.on('handPlayed', (event) => {
    paid = event
  })
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  off()
  expect(game.getState().score - before).toBe(preview.finalScore)
  expect(paid?.equation).toEqual(preview.equation)
  return preview
}

it.each([false, true])(
  'halves the flat Decree contribution in preview and payment (complete=%s)',
  (complete) => {
    const { game, state, ids } = fixture(complete)
    const base = game.previewScore(ids)!
    acquire(state, 'decree-half-suited')
    expect(game.previewScore(ids)!.additiveBonus - base.additiveBonus).toBe(20)
    state.seasonSystem.forceSetSeason('Winter', true)
    const before = JSON.stringify(state.decreeSystem.toState())
    const frozen = game.previewScore(ids)!
    expect(frozen.additiveBonus - base.additiveBonus).toBe(10)
    expect(game.previewScore(ids)).toEqual(frozen)
    expect(JSON.stringify(state.decreeSystem.toState())).toBe(before)
    expect(pay(game, ids).finalScore).toBe(
      Math.floor((base.equation!.points + 10) * base.equation!.multiplier)
    )
  }
)

it('halves a Decree Foil edition but preserves a tile Foil edition', () => {
  const { game, state, ids } = fixture()
  state.handTiles[0] = state.handTiles[0].withEdition(EditionType.Foil)
  const base = game.previewScore(ids)!
  expect(base.additiveBonus).toBe(50)
  acquire(state, 'decree-half-suited')
  state.decreeSystem.applyEdition('decree-half-suited', 'Foil')
  state.seasonSystem.forceSetSeason('Winter', true)
  const score = pay(game, ids)
  expect(score.additiveBonus).toBe(50 + (20 + 50) / 2)
  expect(score.finalScore).toBe(130)
})

it('does not halve tile bonuses without a contributing Decree', () => {
  const { game, state, ids } = fixture()
  state.handTiles[0] = state.handTiles[0].withEdition(EditionType.Foil)
  const base = game.previewScore(ids)!
  state.seasonSystem.forceSetSeason('Winter', true)
  expect(pay(game, ids).finalScore).toBe(base.finalScore)
})

it('halves flat and multiplier bonuses independently, preserving the base multiplier', () => {
  const { game, state, ids } = fixture()
  acquire(state, 'decree-half-suited')
  acquire(state, 'decree-gentle-breeze')
  state.seasonSystem.forceSetSeason('Winter', true)
  expect(pay(game, ids).equation).toEqual({
    points: 55,
    multiplier: 2,
    adjustment: 0,
    total: 110,
  })
})

it('preserves fractional empowered bonuses until final score rounding', () => {
  const { game, state, ids } = fixture()
  state.flowerSystem.addFlower(
    new Tile(TileSuit.Flower, FlowerType.Orchid, 'orchid')
  )
  acquire(state, 'decree-misty-jade')
  state.seasonSystem.forceSetSeason('Winter', true)
  const score = pay(game, ids)
  expect(score.additiveBonus).toBe(16.5)
  expect(score.equation!.points).toBe(61.5)
  expect(score.finalScore).toBe(61)
})

it('excludes disabled Decrees and restores normal bonuses when Frostbite clears', () => {
  const { game, state, ids } = fixture()
  acquire(state, 'decree-half-suited')
  state.seasonSystem.forceSetSeason('Winter', true)
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    disabledDecreeIds: ['decree-half-suited'],
  })
  expect(game.previewScore(ids)!.additiveBonus).toBe(0)
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    disabledDecreeIds: [],
  })
  expect(game.previewScore(ids)!.additiveBonus).toBe(10)
  state.seasonSystem.clear()
  expect(pay(game, ids).additiveBonus).toBe(20)
})
