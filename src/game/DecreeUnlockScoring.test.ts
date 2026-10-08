import { afterEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { useProgressionStore } from '../stores/progressionStore'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { runRandom } from './RunRandom'

afterEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  runRandom.reset()
  vi.restoreAllMocks()
})

it('counts paid natural Yakuman, not previews, across profile hydration and run restoration', async () => {
  const data = new Map<string, string>()
  vi.spyOn(localStorage, 'getItem').mockImplementation(
    (key) => data.get(key) ?? null
  )
  vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
    data.set(key, value)
  })
  vi.spyOn(localStorage, 'removeItem').mockImplementation((key) => {
    data.delete(key)
  })
  useProgressionStore.getState().resetProgression()
  initializeMetaProgressionBridge()
  const game = new GameOrchestrator()
  game.setDecreeUnlockResolver((id) =>
    useProgressionStore.getState().isItemUnlocked(id)
  )
  game.startNewRun(7)
  const patterns: [TileSuit, number[]][] = [
    [TileSuit.Manzu, [1, 9, 1]],
    [TileSuit.Pinzu, [1, 9]],
    [TileSuit.Souzu, [1, 9]],
    [TileSuit.Wind, [1, 2, 3, 4]],
    [TileSuit.Dragon, [1, 2, 3]],
  ]
  for (let play = 0; play < 3; play++) {
    const state = game.getState() as OrchestratorState
    state.seasonSystem.clear()
    state.mandateEffectSystem.deactivateMandate()
    state.targetScore = 1e12
    state.roundManager.getCurrentRound()!.scoreTarget = 1e12
    state.handTiles = patterns.flatMap(([suit, ranks], group) =>
      ranks.map(
        (rank, i) => new Tile(suit, rank, `yakuman-${play}-${group}-${i}`)
      )
    )
    const ids = state.handTiles.map((tile) => tile.id)
    expect(
      game
        .previewScore(ids)!
        .detectedYaku.some((y) => y.definition.id === 'kokushi')
    ).toBe(true)
    game.previewScore(ids)
    expect(useProgressionStore.getState().stats.currentRunYakumanScored).toBe(
      play
    )
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(useProgressionStore.getState().stats.currentRunYakumanScored).toBe(
      play + 1
    )
    expect(game.isDecreeUnlocked('decree-heavenly-ordinance')).toBe(true)
    expect(game.isDecreeUnlocked('decree-yakuman-blessing')).toBe(play === 2)
    if (play === 1) {
      const snapshot = parseClassicRunSnapshot(
        JSON.parse(JSON.stringify(game.captureRun()))
      )
      const storage = useProgressionStore.persist.getOptions().storage!
      const saved = await storage.getItem('tensho-progression')
      expect(saved).toBeTruthy()
      useProgressionStore.getState().resetProgression()
      await storage.setItem('tensho-progression', saved!)
      await useProgressionStore.persist.rehydrate()
      game.restoreRun(snapshot)
      expect(useProgressionStore.getState().stats.currentRunYakumanScored).toBe(
        2
      )
    }
  }
  game.startNewRun(8)
  expect(useProgressionStore.getState().stats.currentRunYakumanScored).toBe(0)
  expect(game.isDecreeUnlocked('decree-yakuman-blessing')).toBe(true)
})
