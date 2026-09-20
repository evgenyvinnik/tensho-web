import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { Tile, TileSuit, WindType, DragonType } from '../core/Tile'
import { CRIMSON_HEART, THE_ARM } from '../config/mandateDefinitions'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { useOmenStore } from '../stores/omenStore'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function fixture(complete = true, table = 'green_felt') {
  const game = new GameOrchestrator()
  game.startNewRun(7, 1, table)
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
    : [4, 5, 6].map((n) => new Tile(TileSuit.Souzu, n, `play-${n}`))
  state.wall = Array.from(
    { length: 40 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const ids = state.handTiles.map((tile) => tile.id)
  const add = (id: string) => {
    const owned = state.decreeSystem.acquireDecree(
      ALL_DECREES.find((d) => d.id === id)!
    )
    expect(owned).not.toBeNull()
    return owned!
  }
  const suppress = (...ids: string[]) => {
    state.mandateEffectSystem = MandateEffectSystem.fromJSON({
      ...state.mandateEffectSystem.toJSON(),
      disabledDecreeIds: ids,
    })
  }
  const frost = (count = 1) => {
    state.seasonSystem.forceSetSeason('Winter', true)
    const saved = state.seasonSystem.toState()
    state.seasonSystem = SeasonSystem.fromState({
      ...saved,
      seasonStack: Array.from({ length: count }, (_, i) => ({
        ...saved.seasonStack[0],
        id: `frost-${i}`,
      })),
    })
  }
  const pay = () => {
    const preview = game.previewScore(ids)!
    expect(game.previewScore(ids)).toEqual(preview)
    const scoreBefore = state.score
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.score - scoreBefore).toBe(preview.finalScore)
    return preview
  }
  return { game, state, ids, add, suppress, frost, pay }
}

for (const count of [1, 2]) {
  it.each([
    ['decree-yaku-amplifier'],
    ['decree-yaku-nexus'],
    ['decree-yaku-amplifier', 'decree-yaku-nexus'],
  ])(
    `scales only the combined Yaku Decree contribution with ${count} Frostbites: %j`,
    (...decrees) => {
      const { game, ids, add, frost, pay } = fixture()
      const baseline = game.previewScore(ids)!
      decrees.forEach(add)
      const enhanced = game.previewScore(ids)!
      expect(enhanced.yakuMultiplier).toBeGreaterThan(baseline.yakuMultiplier)
      frost(count)
      const paid = pay()
      expect(paid.yakuMultiplier).toBeCloseTo(
        baseline.yakuMultiplier +
          (enhanced.yakuMultiplier - baseline.yakuMultiplier) * 0.5 ** count
      )
      expect(paid.basePoints).toBe(baseline.basePoints)
      expect(paid.detectedYaku.map((y) => y.definition.id)).toEqual(
        baseline.detectedYaku.map((y) => y.definition.id)
      )
    }
  )
}

it.each([
  'decree-yaku-amplifier',
  'decree-yaku-nexus',
  'decree-triple-echo',
  'decree-echo-dimension',
])('does not score a Mandate-disabled secondary effect: %s', (id) => {
  const { game, ids, add, suppress, pay } = fixture()
  if (id === 'decree-echo-dimension') add('decree-triple-echo')
  const baseline = game.previewScore(ids)!
  add(id)
  expect(game.previewScore(ids)!.finalScore).toBeGreaterThan(
    baseline.finalScore
  )
  suppress(id)
  expect(pay().finalScore).toBe(baseline.finalScore)
})

it('does not apply Yaku powers to a tactical play with no Yaku', () => {
  const { game, ids, add, frost, pay } = fixture(false)
  const baseline = game.previewScore(ids)!
  expect(baseline.detectedYaku).toHaveLength(0)
  add('decree-yaku-amplifier')
  add('decree-yaku-nexus')
  frost()
  expect(pay().finalScore).toBe(baseline.finalScore)
})

it('does not let Blueprint skip a suppressed Yaku neighbor', () => {
  const { game, ids, add, suppress, pay } = fixture()
  add('decree-blueprint')
  add('decree-yaku-amplifier')
  add('decree-yaku-nexus')
  suppress('decree-yaku-amplifier', 'decree-blueprint')
  const baseline = game.previewScore(ids)!
  expect(baseline.yakuMultiplier).toBe(4)
  suppress('decree-yaku-amplifier')
  expect(pay().finalScore).toBe(baseline.finalScore)
})

it('honors an actual Crimson Heart activation, then restores the Decree on deactivation', () => {
  const { game, state, ids, add, pay } = fixture()
  const base = game.previewScore(ids)!
  add('decree-yaku-amplifier')
  const enhanced = game.previewScore(ids)!
  expect(
    state.mandateEffectSystem.activateMandate(
      CRIMSON_HEART,
      state.handTiles,
      state.decreeSystem.getOwnedDecrees()
    ).success
  ).toBe(true)
  expect(state.mandateEffectSystem.getDisabledDecreeIds()).toEqual([
    'decree-yaku-amplifier',
  ])
  expect(game.previewScore(ids)!.finalScore).toBe(base.finalScore)
  state.mandateEffectSystem.deactivateMandate()
  expect(pay().finalScore).toBe(enhanced.finalScore)
})

it('copies Echo Dimension amplification and disables its copies with the source', () => {
  const { game, ids, add, suppress, pay } = fixture(false)
  add('decree-triple-echo')
  add('decree-blueprint')
  add('decree-echo-dimension')
  expect(game.previewScore(ids)!.basePoints).toBe(105) // 15 tile points × 5 triggers + 30 structure.
  suppress('decree-blueprint')
  expect(game.previewScore(ids)!.basePoints).toBe(75)
  suppress('decree-echo-dimension')
  expect(pay().basePoints).toBe(60)
})

it('keeps The Arm tier reduction as the baseline for Frostbite', () => {
  const { game, state, ids, add, frost, pay } = fixture()
  state.mandateEffectSystem.activateMandate(THE_ARM, state.handTiles, [])
  const base = game.previewScore(ids)!
  add('decree-yaku-nexus')
  expect(game.previewScore(ids)!.yakuMultiplier).toBe(base.yakuMultiplier)
  add('decree-yaku-amplifier')
  const enhanced = game.previewScore(ids)!
  frost()
  expect(pay().yakuMultiplier).toBeCloseTo(
    base.yakuMultiplier + (enhanced.yakuMultiplier - base.yakuMultiplier) / 2
  )
})

it('preserves Dragon’s Den native Yakuman benefit while weakening its Decree boost', () => {
  const { game, state, add, frost } = fixture(true, 'dragons_den')
  state.handTiles = [
    ...[WindType.East, WindType.South, WindType.West].flatMap((wind) =>
      [0, 1, 2].map((i) => Tile.createWind(wind, `w-${wind}-${i}`))
    ),
    ...[0, 1, 2].map((i) => Tile.createDragon(DragonType.Red, `red-${i}`)),
    ...[0, 1].map((i) => Tile.createDragon(DragonType.Green, `green-${i}`)),
  ]
  const ids = state.handTiles.map((tile) => tile.id)
  const base = game.previewScore(ids)!
  expect(base.detectedYaku.some((y) => y.definition.tier === 4)).toBe(true)
  add('decree-yaku-amplifier')
  const enhanced = game.previewScore(ids)!
  frost()
  const preview = game.previewScore(ids)!
  expect(preview.yakuMultiplier).toBeCloseTo(
    base.yakuMultiplier + (enhanced.yakuMultiplier - base.yakuMultiplier) / 2
  )
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.score).toBe(preview.finalScore)
})
