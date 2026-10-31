import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { SHANTEN_CLEMENCY } from '../systems/DecreeSystem'
import { VOID_SCRIPTS, VoidScriptSystem } from '../systems/VoidScriptSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'

const numbered = (suit: TileSuit, ranks: number[], prefix: string) =>
  ranks.map((rank, i) => new Tile(suit, rank, `${prefix}-${i}`))
// One tile short of complete: 6 or 9 Bamboo finishes it.
const oneAway = () => [
  ...numbered(TileSuit.Manzu, [1, 2, 3, 2, 3, 4], 'characters'),
  ...numbered(TileSuit.Pinzu, [3, 4, 5, 5, 5], 'circles'),
  ...numbered(TileSuit.Souzu, [7, 8], 'bamboo'),
]
// Three groups and a pair, plus three tiles that form no group.
const oneLooseGroup = (prefix = 'loose') => [
  ...numbered(TileSuit.Manzu, [1, 2, 3, 4, 5, 6], `${prefix}-characters`),
  ...numbered(TileSuit.Pinzu, [7, 7, 7, 2, 2], `${prefix}-circles`),
  ...numbered(TileSuit.Souzu, [1, 5], `${prefix}-bamboo`),
  new Tile(TileSuit.Wind, 3, `${prefix}-west`),
]

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function fixture(tiles: Tile[]) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem
    .getOwnedDecrees()
    .forEach((d) => state.decreeSystem.removeDecree(d.id))
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.handTiles = tiles
  state.wall = numbered(
    TileSuit.Souzu,
    Array.from({ length: 60 }, (_, i) => (i % 9) + 1),
    'wall'
  )
  state.drawIndex = 0
  state.selectedTileIds.clear()
  state.faceDownTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state, ids: tiles.map((t) => t.id) }
}

function useScript(game: GameOrchestrator, id: string) {
  const item = VoidScriptSystem.createVoidScriptInstance(VOID_SCRIPTS[id])
  expect(game.addVoidScript(item)).toBe(true)
  expect(
    game.processAction({ type: 'useScript', scriptId: item.instanceId }).success
  ).toBe(true)
}

it('scores a hand one tile short of complete after Script of Eclipse, at full score', () => {
  const { game, state, ids } = fixture(oneAway())
  expect(game.isCompleteHand(ids)).toBe(false)
  expect(game.previewScore(ids)).toBeNull()

  useScript(game, 'script_of_eclipse')
  expect(game.isCompleteHand(ids)).toBe(true)
  const interpretation = game.inspectCompleteHand(ids)!
  expect(interpretation.completionTile).toBeDefined()
  expect(interpretation.usedShantenClemency).toBe(false)

  const preview = game.previewScore(ids)!
  expect(preview.pattern.id).toBe('mahjong')
  // Shanten Clemency completes the same hand at half score.
  const clemency = fixture(oneAway())
  expect(clemency.game.addDecree(SHANTEN_CLEMENCY)).toBe(true)
  expect(clemency.game.previewScore(clemency.ids)!.finalScore).toBe(
    Math.floor(preview.finalScore * 0.5)
  )

  const before = state.score
  const concealed = state.completeConcealedHandsPlayed ?? 0
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.score - before).toBe(preview.finalScore)
  expect(state.completeConcealedHandsPlayed ?? 0).toBe(concealed)
  // Eclipse lasts the round, not one hand.
  expect(state.voidScriptSystem.isShantenScoringAllowed()).toBe(true)
})

it('waives the Shanten Clemency penalty while Eclipse is active', () => {
  const { game, ids } = fixture(oneAway())
  expect(game.addDecree(SHANTEN_CLEMENCY)).toBe(true)
  const penalized = game.previewScore(ids)!.finalScore
  useScript(game, 'script_of_eclipse')
  expect(game.inspectCompleteHand(ids)!.usedShantenClemency).toBe(false)
  expect(Math.floor(game.previewScore(ids)!.finalScore * 0.5)).toBe(penalized)
})

it('lets the next complete hand include one loose group after Script of Silence', () => {
  const { game, state, ids } = fixture(oneLooseGroup())
  expect(game.isCompleteHand(ids)).toBe(false)

  useScript(game, 'script_of_silence')
  expect(game.isCompleteHand(ids)).toBe(true)
  const preview = game.previewScore(ids)!
  expect(preview.pattern.id).toBe('mahjong')
  // The loose trio earns no group bonus: two sequences, a triplet, a pair.
  expect(preview.structurePoints).toBe(30 + 30 + 40 + 15)

  const before = state.score
  const concealed = state.completeConcealedHandsPlayed ?? 0
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.score - before).toBe(preview.finalScore)
  expect(state.completeConcealedHandsPlayed ?? 0).toBe(concealed)

  // Silence is spent: the next loose group does not fit again.
  expect(state.voidScriptSystem.isMeldValidationBypassed()).toBe(false)
  const again = oneLooseGroup('again')
  state.handTiles = again
  expect(game.isCompleteHand(again.map((t) => t.id))).toBe(false)
})

it('keeps Silence through tactical plays and natural hands until a hand needs it', () => {
  const pair = numbered(TileSuit.Souzu, [9, 9], 'pair')
  const natural = [
    ...numbered(TileSuit.Manzu, [1, 2, 3, 4, 5, 6], 'natural-characters'),
    ...numbered(TileSuit.Pinzu, [7, 7, 7, 2, 2], 'natural-circles'),
    ...numbered(TileSuit.Souzu, [3, 4, 5], 'natural-bamboo'),
  ]
  const { game, state } = fixture([...pair, ...natural])
  useScript(game, 'script_of_silence')
  const play = (tiles: Tile[]) =>
    game.processAction({ type: 'play', tileIds: tiles.map((t) => t.id) })

  expect(play(pair).success).toBe(true)
  expect(state.voidScriptSystem.isMeldValidationBypassed()).toBe(true)
  expect(play(natural).success).toBe(true)
  expect(state.voidScriptSystem.isMeldValidationBypassed()).toBe(true)

  const loose = oneLooseGroup()
  state.handTiles = loose
  expect(play(loose).success).toBe(true)
  expect(state.voidScriptSystem.isMeldValidationBypassed()).toBe(false)
})

it('ends Eclipse with the round but carries Silence until it is used', () => {
  const system = new VoidScriptSystem()
  for (const id of ['script_of_eclipse', 'script_of_silence'])
    system.useScript(
      VoidScriptSystem.createVoidScriptInstance(VOID_SCRIPTS[id]),
      {}
    )
  system.onHandEnd()
  expect(system.isShantenScoringAllowed()).toBe(true)
  expect(system.isMeldValidationBypassed()).toBe(true)
  system.onRoundEnd()
  expect(system.isShantenScoringAllowed()).toBe(false)
  expect(system.isMeldValidationBypassed()).toBe(true)
  const restored = VoidScriptSystem.fromState(system.toState())
  expect(restored.isMeldValidationBypassed()).toBe(true)
  restored.useMeldValidationBypass()
  expect(restored.isMeldValidationBypassed()).toBe(false)
})
