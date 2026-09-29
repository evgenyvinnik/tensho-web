import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

it('keeps expired Perishable copies saveable across subsequent rounds and reload', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const system = new DecreeSystem()
  ;(game.getState() as OrchestratorState).decreeSystem = system
  const owned = system.acquireDecree(ALL_DECREES[0], {
    type: 'Perishable',
    roundsRemaining: 1,
  })!
  for (let round = 0; round < 4; round++) {
    system.onRoundStart()
    expect(owned.isDebuffed).toBe(true)
    expect(owned.sticker?.roundsRemaining).toBe(0)
    const snapshot = JSON.parse(JSON.stringify(game.captureRun()))
    expect(() => parseClassicRunSnapshot(snapshot)).not.toThrow()
  }
  game.restoreRun(parseClassicRunSnapshot(game.captureRun()))
  const restored = game.getState().decreeSystem
  restored.onRoundStart()
  expect(restored.getOwnedDecrees()[0].sticker?.roundsRemaining).toBe(0)
  expect(restored.getActiveDecrees()).toHaveLength(0)
})
