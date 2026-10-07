import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, SeasonType, FlowerType } from '../core/Tile'
import { MeldType } from '../core/Meld'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import { OmenTagSystem } from '../systems/OmenTagSystem'
import {
  findBeginnerSuggestion,
  buildCoachAdvice,
} from '../gameplay/beginnerCoach'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { CERULEAN_BELL } from '../config/mandateDefinitions'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function fixture(middle = 2) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.seasonSystem.setAct(1)
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.handTiles = [
    ...[1, middle, 4].map(
      (rank, i) => new Tile(TileSuit.Manzu, rank, `gap-${i}`)
    ),
    ...[2, 3, 4, 5, 6, 7].map(
      (rank, i) => new Tile(TileSuit.Pinzu, rank, `pin-${i}`)
    ),
    ...[6, 7, 8].map((rank, i) => new Tile(TileSuit.Souzu, rank, `sou-${i}`)),
    new Tile(TileSuit.Wind, 1, 'pair'),
    new Tile(TileSuit.Wind, 1, 'redraw'),
  ]
  state.wall = [
    Tile.createSeason(SeasonType.Winter, 'winter'),
    ...Array.from(
      { length: 60 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
    ),
  ]
  state.deadWall = [new Tile(TileSuit.Wind, 1, 'replacement')]
  state.drawIndex = 0
  state.faceDownTileIds.clear()
  state.selectedTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state }
}
const gap = ['gap-0', 'gap-1', 'gap-2']
const activate = (game: GameOrchestrator) =>
  expect(
    game.processAction({ type: 'redraw', tileIds: ['redraw'] }).success
  ).toBe(true)

it.each([2, 3])(
  'connects a drawn Winter to tactical and complete scoring with 1-%s-4',
  (middle) => {
    const { game, state } = fixture(middle)
    expect(game.previewScore(gap)?.structurePoints).toBe(0)
    expect(game.findCompleteHandSelection()).toBeNull()
    const before = game.captureRun()
    expect(game.canPerformAction({ type: 'redraw', tileIds: ['redraw'] })).toBe(
      true
    )
    expect(game.captureRun()).toEqual(before)
    activate(game)
    expect(state.seasonSystem.isHandLegalityLoosened()).toBe(true)
    const forecast = game.previewScore(gap)!
    expect(forecast.structurePoints).toBe(30)
    expect(forecast.finalScore).toBe(37)
    expect(forecast.skippedSequences?.[0].map((t) => t.id)).toEqual(gap)
    const complete = game.findCompleteHandSelection()!
    expect(complete).toHaveLength(14)
    expect(game.previewScore(complete)?.structure.kind).toBe('complete')
    const saved = parseClassicRunSnapshot(
      JSON.parse(JSON.stringify(game.captureRun()))
    )
    game.restoreRun(saved)
    expect(game.captureRun()).toEqual(saved)
    expect(game.previewScore(gap)).toEqual(forecast)
    const restored = game.getState()
    const score = restored.score
    const hands = restored.handsRemaining
    expect(game.processAction({ type: 'play', tileIds: gap }).success).toBe(
      true
    )
    expect(restored.score - score).toBe(forecast.finalScore)
    expect(restored.handsRemaining).toBe(hands - 1)
    expect(restored.handTiles.some((t) => gap.includes(t.id))).toBe(false)
  }
)

it('finds and pays a full gapped hand out of an enlarged rack without consuming its spare', () => {
  const { game, state } = fixture()
  activate(game)
  const spare = new Tile(TileSuit.Dragon, 3, 'spare')
  state.handTiles.push(spare)
  const before = game.captureRun()
  const ids = game.findCompleteHandSelection()!
  expect(ids).toHaveLength(14)
  expect(ids).not.toContain(spare.id)
  expect(game.inspectCompleteHand(ids)).toMatchObject({
    naturalComplete: false,
    substitutions: [],
    allWild: false,
  })
  const forecast = game.previewScore(ids)!
  expect(forecast.skippedSequences).toHaveLength(1)
  const advice = buildCoachAdvice({
    tiles: state.handTiles,
    partialRules: game.getPartialHandRules(),
    completeHandTileIds: ids,
    scoreSelection: (selection) =>
      game.previewScore(selection)?.finalScore ?? null,
    remainingToTarget: 1e9,
    handsRemaining: state.handsRemaining,
  })
  expect(advice?.best.tileIds).toEqual(ids)
  expect(game.captureRun()).toEqual(before)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.score).toBe(forecast.finalScore)
  expect(state.handTiles).toContain(spare)
})

it('teaches and prices a gapped sequence without consulting concealed tiles', () => {
  const { game, state } = fixture()
  activate(game)
  const tiles = state.handTiles.slice(0, 3)
  const rules = game.getPartialHandRules()
  expect(findBeginnerSuggestion(tiles)?.kind).toBe('redraw')
  expect(findBeginnerSuggestion(tiles, new Set(), rules)).toMatchObject({
    kind: MeldType.Sequence,
    tileIds: gap,
    structurePoints: 30,
  })
  expect(findBeginnerSuggestion(tiles, new Set(['gap-1']), rules)?.kind).toBe(
    'redraw'
  )
  const advice = buildCoachAdvice({
    tiles,
    partialRules: rules,
    scoreSelection: (ids) => game.previewScore(ids)?.finalScore ?? null,
    handsRemaining: 3,
    remainingToTarget: 10,
  })
  expect(advice?.best).toMatchObject({
    tileIds: gap,
    pattern: MeldType.Sequence,
    structurePoints: 30,
    score: 37,
  })
})

it('stacks the penalty, not the permitted gap width, and preserves Chrysanthemum protection', () => {
  const { game, state } = fixture()
  state.deadWall.unshift(Tile.createSeason(SeasonType.Winter, 'winter-2'))
  activate(game)
  expect(state.seasonSystem.getSeasonStack()).toHaveLength(2)
  expect(game.previewScore(gap)?.finalScore).toBe(28)
  state.handTiles[2] = new Tile(TileSuit.Manzu, 5, 'gap-2')
  expect(game.previewScore(gap)?.structurePoints).toBe(0)
  state.handTiles[2] = new Tile(TileSuit.Manzu, 4, 'gap-2')
  state.flowerSystem.addFlower(
    Tile.createFlower(FlowerType.Chrysanthemum, 'chrysanthemum')
  )
  const withWinter = game.previewScore(gap)!
  const seasons = state.seasonSystem
  // Match legality without a penalty using the same authored Decree rule.
  state.seasonSystem = new SeasonSystem()
  const decree = ALL_DECREES.find((d) => d.id === 'broken_stair_edict')!
  expect(state.decreeSystem.acquireDecree(decree)).not.toBeNull()
  expect(game.previewScore(gap)?.finalScore).toBe(withWinter.finalScore)
  state.seasonSystem = seasons
})

it('does not grant normal Winter legality for an actual Frostbite draw', () => {
  const { game, state } = fixture()
  state.seasonSystem.setAct(2)
  runRandom.start(3)
  activate(game)
  expect(state.seasonSystem.getActiveSeason()?.corruptedType).toBe('Frostbite')
  expect(game.getPartialHandRules().allowSequenceSkip).toBe(false)
  expect(game.previewScore(gap)?.structurePoints).toBe(0)
  expect(game.findCompleteHandSelection()).toBeNull()
})

it.each(['Winter', 'Summer'] as const)(
  'uses the effective Omen Season %s rather than the physical Winter',
  (lockedSeasonType) => {
    const { game, state } = fixture()
    state.omenSystem = OmenTagSystem.fromState({
      ...state.omenSystem.toState(),
      lockedSeasonType,
    })
    activate(game)
    expect(game.getPartialHandRules().allowSequenceSkip).toBe(
      lockedSeasonType === 'Winter'
    )
  }
)

it('expires round legality and does not reactivate it while loading the next round', () => {
  const { game, state } = fixture()
  state.wallTemplate = state.wallTemplate.filter((tile) => !tile.isBonus)
  activate(game)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  game.exitShop()
  expect(game.getPartialHandRules().allowSequenceSkip).toBe(false)
  const saved = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  game.restoreRun(saved)
  expect(game.captureRun()).toEqual(saved)
  expect(game.getPartialHandRules().allowSequenceSkip).toBe(false)
})

it('shares Broken Stair legality but respects a mandate disabling the Decree', () => {
  const { game, state } = fixture()
  const decree = ALL_DECREES.find((d) => d.id === 'broken_stair_edict')!
  const owned = state.decreeSystem.acquireDecree(decree)!
  expect(owned).not.toBeNull()
  expect(game.previewScore(gap)?.structurePoints).toBe(30)
  expect(game.findCompleteHandSelection()).toHaveLength(14)
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    disabledDecreeIds: [owned.instanceId ?? owned.id],
  })
  expect(game.getPartialHandRules().allowSequenceSkip).toBe(false)
  expect(game.previewScore(gap)?.structurePoints).toBe(0)
  activate(game)
  expect(game.getPartialHandRules().allowSequenceSkip).toBe(true)
})

it('never uses Winter to bypass forced tiles, hidden faces, or exhausted plays', () => {
  const { game, state } = fixture()
  activate(game)
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    activeMandate: CERULEAN_BELL,
    lockedTileIds: ['pin-0'],
  })
  expect(game.previewScore(gap)).toBeNull()
  expect(game.previewScore([...gap, 'pin-0'])?.structurePoints).toBe(30)
  state.faceDownTileIds.add('pin-0')
  expect(game.findCompleteHandSelection()).toBeNull()
  expect(game.inspectCompleteHand(state.handTiles.map((t) => t.id))).toBeNull()
  state.handsRemaining = 0
  const saved = game.captureRun()
  expect(
    game.processAction({ type: 'play', tileIds: [...gap, 'pin-0'] }).success
  ).toBe(false)
  expect(game.captureRun()).toEqual(saved)
})
