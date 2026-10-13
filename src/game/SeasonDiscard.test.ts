import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit } from '../core/Tile'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { THE_HOOK } from '../config/mandateDefinitions'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { clearRound } from '../test/roundHelpers'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.forceSetSeason('Autumn', true)
  state.decreeSystem
    .getOwnedDecrees()
    .forEach((d) => state.decreeSystem.removeDecree(d.id))
  state.handTiles = Array.from(
    { length: 14 },
    (_, i) => new Tile(TileSuit.Souzu, i < 2 ? 1 : (i % 9) + 1, `hand-${i}`)
  )
  state.wall = Array.from(
    { length: 40 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state }
}

const redraw = (game: GameOrchestrator, tileIds: string[]) =>
  game.processAction({ type: 'redraw', tileIds }).success

it('each REDRAW grows Decay once, however many tiles it sends, and the preview and committed score agree', () => {
  const { game, state } = fixture()
  state.redrawsRemaining = 3
  const pair = ['hand-0', 'hand-1']
  const before = game.previewScore(pair)!.finalScore
  expect(redraw(game, ['hand-2'])).toBe(true)
  expect(state.seasonSystem.getDecayPenalty()).toBe(10)
  expect(game.previewScore(pair)!.finalScore).toBe(before - 10)
  expect(redraw(game, ['hand-3', 'hand-4', 'hand-5'])).toBe(true)
  expect(state.seasonSystem.getDecayPenalty()).toBe(20)
  const preview = game.previewScore(pair)!.finalScore
  expect(preview).toBe(before - 20)
  const score = state.score
  expect(game.processAction({ type: 'play', tileIds: pair }).success).toBe(true)
  expect(state.score - score).toBe(preview)
  // Played tiles enter the river but are not REDRAWs.
  expect(state.seasonSystem.getDecayPenalty()).toBe(20)
})

it('rejected REDRAWs do not grow Decay, while each Hook discard does', () => {
  const { game, state } = fixture()
  expect(redraw(game, ['missing'])).toBe(false)
  expect(state.seasonSystem.getDecayPenalty()).toBe(0)
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    activeMandate: THE_HOOK,
  })
  expect(redraw(game, ['hand-3'])).toBe(true)
  // The redrawn tile and The Hook's two forced discards.
  expect(state.discards).toHaveLength(3)
  expect(state.seasonSystem.getDecayPenalty()).toBe(30)
})

it('clears the penalty when the round ends', () => {
  const { game, state } = fixture()
  expect(redraw(game, ['hand-2'])).toBe(true)
  expect(state.seasonSystem.getDecayPenalty()).toBe(10)
  clearRound(game)
  expect(state.seasonSystem.toState().discardCount).toBe(0)
  expect(state.seasonSystem.getDecayPenalty()).toBe(0)
})

it('reports actual Drought suppression and honors only an enabled protective Decree', () => {
  const { game, state } = fixture()
  state.seasonSystem.forceSetSeason('Summer', true)
  state.flowerSystem.addFlower(new Tile(TileSuit.Flower, 4, 'bamboo'))
  expect(game.getFloraState()).toMatchObject({
    flowersSuppressed: true,
    flowersProtected: false,
  })
  const protector = ALL_DECREES.find(
    (decree) => decree.id === 'decree-eternal-garden'
  )!
  expect(state.decreeSystem.acquireDecree(protector)).not.toBeNull()
  expect(game.getFloraState()).toMatchObject({
    flowersSuppressed: false,
    flowersProtected: true,
  })
  const protectedScore = game.previewScore(['hand-0', 'hand-1'])!.finalScore
  state.seasonSystem.clear()
  expect(game.previewScore(['hand-0', 'hand-1'])!.finalScore).toBe(
    protectedScore
  )
  state.seasonSystem.forceSetSeason('Summer', true)
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    disabledDecreeIds: [protector.id],
  })
  expect(game.getFloraState()).toMatchObject({
    flowersSuppressed: true,
    flowersProtected: false,
  })
  state.seasonSystem.clear()
  expect(game.getFloraState()).toMatchObject({
    flowersSuppressed: false,
    flowersProtected: false,
    seasons: [],
    decayPenalty: 0,
  })
})
