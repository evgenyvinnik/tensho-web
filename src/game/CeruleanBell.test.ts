import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { CERULEAN_BELL, THE_HOOK } from '../config/mandateDefinitions'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { Tile, TileSuit } from '../core/Tile'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { buildCoachAdvice } from '../gameplay/beginnerCoach'
import { SHOWDOWN_MANDATES } from '../systems/RoundManager'
import { parseClassicRunSnapshot } from './validateClassicRun'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

it('keeps only the latest physical lock after repeated draw cycles', () => {
  const system = new MandateEffectSystem()
  const rack = Array.from(
    { length: 14 },
    (_, i) => new Tile(TileSuit.Manzu, (i % 9) + 1, `tile-${i}`)
  )
  system.activateMandate(CERULEAN_BELL, rack, [])
  for (let i = 0; i < 20; i++) {
    const result = system.onDraw(rack, rack[i % rack.length])
    expect(result.lockedTileId).not.toBeNull()
    expect(system.getLockedTileIds()).toEqual([result.lockedTileId])
  }
})

it('normalizes legacy accumulated Bell locks to their latest insertion without RNG changes', () => {
  const system = new MandateEffectSystem()
  system.activateMandate(CERULEAN_BELL, [], [])
  const legacy = {
    ...system.toJSON(),
    lockedTileIds: ['a', 'b', 'c', 'd', 'e', 'f'],
  }
  const restored = MandateEffectSystem.fromJSON(legacy)
  expect(restored.toJSON()).toEqual({ ...legacy, lockedTileIds: ['f'] })
  expect(legacy.lockedTileIds).toHaveLength(6)
  expect(
    MandateEffectSystem.fromJSON({
      ...legacy,
      activeMandate: THE_HOOK,
    }).getLockedTileIds()
  ).toHaveLength(6)
  expect(
    MandateEffectSystem.fromJSON({
      ...legacy,
      lockedTileIds: [],
    }).getLockedTileIds()
  ).toEqual([])
})

it('allows six real exchanges then a legal tactical play, preserving current lock after restore', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  game.getState().roundManager.getCurrentAct()!.rounds[2].bossMandate =
    SHOWDOWN_MANDATES.find((m) => m.id === CERULEAN_BELL.id)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  for (let i = 0; i < 6; i++) {
    const state = game.getState()
    const locked = state.mandateEffectSystem.getLockedTileIds()
    expect(locked).toHaveLength(1)
    const tile = state.handTiles.find((t) => !locked.includes(t.id))!
    const action =
      i < 3
        ? { type: 'discard' as const, tileId: tile.id }
        : { type: 'redraw' as const, tileIds: [tile.id] }
    expect(game.processAction(action).success).toBe(true)
    expect(state.mandateEffectSystem.getLockedTileIds()).toHaveLength(1)
  }
  const snapshot = game.captureRun()
  parseClassicRunSnapshot(JSON.parse(JSON.stringify(snapshot)))
  const restored = new GameOrchestrator()
  restored.restoreRun(snapshot)
  expect(restored.captureRun()).toEqual(snapshot)
  const state = restored.getState()
  const advice = buildCoachAdvice({
    tiles: state.handTiles,
    requiredTileIds: state.mandateEffectSystem.getLockedTileIds(),
    scoreSelection: (ids) => restored.previewScore(ids)?.finalScore ?? null,
    remainingToTarget: state.targetScore,
    handsRemaining: state.handsRemaining,
  })
  expect(advice).not.toBeNull()
  expect(
    restored.processAction({ type: 'play', tileIds: advice!.best.tileIds })
      .success
  ).toBe(true)
})
