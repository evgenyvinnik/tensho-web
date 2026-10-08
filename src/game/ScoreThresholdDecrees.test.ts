import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { Tile, TileSuit } from '../core/Tile'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { EnhancementType, EditionType } from '../core/TileModifier'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})
function fixture(ids: string[], target: number, current = 0, handsPlayed = 0) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem = new DecreeSystem(10)
  ids.forEach((id) =>
    state.decreeSystem.acquireDecree(ALL_DECREES.find((d) => d.id === id)!)
  )
  const tiles = [2, 3, 4].map(
    (rank) => new Tile(TileSuit.Souzu, rank, `threshold-${rank}`)
  )
  state.handTiles = [...tiles, ...state.handTiles.slice(3)]
  state.wallTemplate = [
    ...new Map(
      [...state.wall, ...state.handTiles].map((t) => [t.id, t])
    ).values(),
  ]
  state.targetScore = target
  state.score = current
  state.handsRemaining = state.handsAllowance - handsPlayed
  const round = state.roundManager.getCurrentRound()!
  round.scoreTarget = target
  round.currentScore = current
  const tileIds = tiles.map((t) => t.id)
  return { game, state, tileIds }
}

it.each([
  ['decree-supernova', 22, 0, 0, 112],
  ['decree-supernova', 23, 0, 0, 45],
  ['decree-supernova', 35, 25, 1, 112],
  ['decree-supernova', 35, 24, 1, 45],
  ['decree-perfectionist', 45, 0, 0, 135],
  ['decree-perfectionist', 46, 0, 0, 45],
  ['decree-perfectionist', 45, 0, 1, 45],
] as const)(
  '%s checks this play against target %s/current %s/played %s',
  (id, target, current, played, expected) => {
    const { game, state, tileIds } = fixture([id], target, current, played)
    const snapshot = JSON.parse(JSON.stringify(game.captureRun()))
    expect(game.previewScore(tileIds)!.finalScore).toBe(expected)
    expect(JSON.parse(JSON.stringify(game.captureRun()))).toEqual(snapshot)
    game.restoreRun(parseClassicRunSnapshot(snapshot))
    expect(game.previewScore(tileIds)!.finalScore).toBe(expected)
    expect(game.processAction({ type: 'play', tileIds }).success).toBe(true)
    expect(game.getState().score).toBe(current + expected)
    expect(state.decreeSystem.getOwnedDecrees()).toHaveLength(1)
  }
)

it.each([
  ['decree-supernova', 'decree-perfectionist'],
  ['decree-perfectionist', 'decree-supernova'],
])(
  'threshold bonuses do not qualify each other: %s then %s',
  (first, second) => {
    const { game, tileIds } = fixture([first, second], 30)
    expect(game.previewScore(tileIds)!.finalScore).toBe(135)
    game.processAction({ type: 'play', tileIds })
    expect(game.getState().score).toBe(135)
  }
)

it('copies use the same baseline; disabled sources cannot qualify a bonus', () => {
  const { game, state, tileIds } = fixture(
    ['decree-blueprint', 'decree-supernova'],
    22
  )
  expect(game.previewScore(tileIds)!.finalScore).toBe(281)
  state.decreeSystem.getOwnedDecree('decree-supernova')!.isDebuffed = true
  expect(game.previewScore(tileIds)!.finalScore).toBe(45)
})

it('uses final paid rounding and the persistent Immortal penalty for qualification', () => {
  const { game, state, tileIds } = fixture(['decree-supernova'], 12)
  state.lossPreventionScorePenalty = 0.5
  expect(game.previewScore(tileIds)!.finalScore).toBe(22)
  state.targetScore = 11
  state.roundManager.getCurrentRound()!.scoreTarget = 11
  expect(game.previewScore(tileIds)!.finalScore).toBe(56)
})

it('includes ordinary Decree editions in the neutral baseline', () => {
  const { game, state, tileIds } = fixture(['decree-supernova'], 47)
  state.decreeSystem.getOwnedDecrees()[0].edition = 'Foil'
  expect(game.previewScore(tileIds)!.finalScore).toBe(237) // (45 + 50) × 2.5
  state.targetScore = 48
  expect(game.previewScore(tileIds)!.finalScore).toBe(95)
})

it('uses native tile multipliers before qualification and disables both copies under suppression', () => {
  const { game, state, tileIds } = fixture(
    ['decree-blueprint', 'decree-supernova'],
    45
  )
  state.handTiles[0] = state.handTiles[0].withEnhancement(EnhancementType.Glass)
  expect(game.previewScore(tileIds)!.finalScore).toBe(562)
  const source = state.decreeSystem.getOwnedDecree('decree-supernova')!
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    disabledDecreeIds: [source.instanceId!],
  })
  expect(game.previewScore(tileIds)!.finalScore).toBe(90)
})

it('weakens the qualified bonus under Frostbite without weakening the qualification score twice', () => {
  const { game, state, tileIds } = fixture(['decree-supernova'], 47)
  state.seasonSystem.forceSetSeason('Winter', true)
  state.decreeSystem.getOwnedDecrees()[0].edition = 'Foil'
  expect(game.previewScore(tileIds)!.finalScore).toBe(70) // 45 + half the Foil bonus
  state.targetScore = 35
  state.roundManager.getCurrentRound()!.scoreTarget = 35
  expect(game.previewScore(tileIds)!.finalScore).toBe(122) // 70 × 1.75
  expect(game.processAction({ type: 'play', tileIds }).success).toBe(true)
  expect(state.score).toBe(122)
})

it('rolls Lucky only once when the outcome changes threshold qualification', () => {
  const { game, state, tileIds } = fixture(['decree-supernova'], 30)
  state.handTiles[0] = state.handTiles[0].withEnhancement(EnhancementType.Lucky)
  const random = vi.spyOn(runRandom, 'next').mockReturnValue(0.1)
  expect(game.previewScore(tileIds)!.finalScore).toBe(45)
  expect(random).not.toHaveBeenCalled()
  expect(game.processAction({ type: 'play', tileIds }).success).toBe(true)
  expect(state.score).toBe(162) // (45 + 20 Lucky chips) × 2.5
  expect(
    random.mock.calls.filter(([stream]) => stream === 'modifiers')
  ).toHaveLength(1)
})

it('normal bonuses can earn a threshold, but neither conditional bonus can bootstrap the other', () => {
  const { game, state, tileIds } = fixture(
    ['decree-perfectionist', 'decree-supernova'],
    50
  )
  expect(game.previewScore(tileIds)!.finalScore).toBe(45)
  state.handTiles[0] = state.handTiles[0].withEdition(EditionType.Polychrome)
  expect(game.previewScore(tileIds)!.finalScore).toBe(202) // 67 baseline: first clear, not double
})
