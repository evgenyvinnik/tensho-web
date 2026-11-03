import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { Tile, TileSuit, WindType } from '../core/Tile'
import { CRIMSON_HEART } from '../config/mandateDefinitions'
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

it.each([false, true])(
  'previews leave the saved Decree scaling state untouched (complete=%s)',
  (complete) => {
    const f = fixture(complete)
    const decree = f.add('moonlit_seal')
    decree.scalingValue = 0.7 // The value from an earlier paid play.
    f.state.handTiles = f.state.handTiles.map((tile, index) =>
      index >= f.state.handTiles.length - 2
        ? new Tile(TileSuit.Wind, WindType.East, tile.id)
        : tile
    )
    const before = f.game.captureRun()
    const preview = f.game.previewScore(f.ids)
    expect(preview).not.toBeNull()
    expect(f.game.previewScore(f.ids)).toEqual(preview)
    expect(f.game.captureRun()).toEqual(before)
    f.pay()
    expect(decree.scalingValue).toBe(0.2)
  }
)

it.each([
  'decree-chain-reaction',
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

it('does not let Blueprint skip a suppressed neighbor', () => {
  const { game, ids, add, suppress, pay } = fixture()
  add('decree-blueprint')
  add('decree-chain-reaction')
  add('decree-yaku-nexus')
  suppress('decree-chain-reaction', 'decree-blueprint')
  const baseline = game.previewScore(ids)!
  suppress('decree-chain-reaction')
  expect(pay().finalScore).toBe(baseline.finalScore)
})

it('honors an actual Crimson Heart activation, then restores the Decree on deactivation', () => {
  const { game, state, ids, add, pay } = fixture()
  const base = game.previewScore(ids)!
  add('decree-chain-reaction')
  const enhanced = game.previewScore(ids)!
  expect(
    state.mandateEffectSystem.activateMandate(
      CRIMSON_HEART,
      state.handTiles,
      state.decreeSystem.getOwnedDecrees()
    ).success
  ).toBe(true)
  expect(state.mandateEffectSystem.getDisabledDecreeIds()).toEqual([
    state.decreeSystem.getOwnedDecree('decree-chain-reaction')!.instanceId,
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
