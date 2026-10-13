import { afterEach, describe, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { upgradeClassicRunSnapshot } from './migrateClassicSnapshot'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'

afterEach(() => {
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
})

/** Play the highest-paying pair-or-better until the round ends. */
function finishRound(game: GameOrchestrator) {
  for (let guard = 0; guard < 40 && game.getState().phase === 'gameplay'; guard++) {
    const tiles = game.getState().handTiles
    let played = false
    for (let i = 0; i < tiles.length && !played; i++)
      for (let j = i + 1; j < tiles.length && !played; j++) {
        const ids = [tiles[i].id, tiles[j].id]
        if (game.canPerformAction({ type: 'play', tileIds: ids }))
          played = game.processAction({ type: 'play', tileIds: ids }).success
      }
    if (!played) break
  }
}

describe('version 3 saves', () => {
  it.each([3, 11, 27])(
    'round-trips a run in play and in the Tea House (seed %i)',
    (seed) => {
      const game = new GameOrchestrator()
      game.startNewRun(seed)
      const inPlay = JSON.parse(JSON.stringify(game.captureRun()))
      expect(() => parseClassicRunSnapshot(inPlay)).not.toThrow()
      const playsBefore = game.getState().handsPlayedThisRun
      finishRound(game)
      expect(game.getState().handsPlayedThisRun).toBeGreaterThan(playsBefore)
      const after = JSON.parse(JSON.stringify(game.captureRun()))
      expect(after.version).toBe(3)
      expect(() => parseClassicRunSnapshot(after)).not.toThrow()
    }
  )

  it('keeps a Boss-shop Charter offer valid and leaves current saves unchanged', () => {
    const game = new GameOrchestrator()
    game.setCharterUnlockResolver(() => true)
    game.startNewRun(7)
    Object.assign(game.getState() as OrchestratorState, {
      phase: 'shop',
      lastCompletedRoundType: 'Boss',
      gold: 100,
    })
    expect(game.shop.open()).toBe(true)
    expect(game.shop.state.charterOffering).not.toBeNull()
    const saved = JSON.parse(JSON.stringify(game.captureRun()))
    // Reading a current save re-reads its items from the catalog: a no-op.
    expect(upgradeClassicRunSnapshot(saved)).toEqual(saved)
    expect(() => parseClassicRunSnapshot(saved)).not.toThrow()
  })
})
