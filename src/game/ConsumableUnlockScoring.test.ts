import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { useProgressionStore } from '../stores/progressionStore'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  shutdownMetaProgressionBridge()
  eventBus.clear()
  useProgressionStore.getState().resetProgression()
  runRandom.reset()
})

it.each([
  { yaku: 'seven_pairs', orb: 'planet_x_orb', ascended: false },
  { yaku: 'seven_pairs', orb: 'planet_x_orb', ascended: true },
  { yaku: 'chanta', orb: 'ceres_orb', ascended: false },
])(
  'earns $orb only after a paid $yaku hand (ascended=$ascended)',
  ({ yaku, orb, ascended }) => {
    useProgressionStore.getState().resetProgression()
    initializeMetaProgressionBridge()
    const game = new GameOrchestrator()
    game.setConsumableUnlockResolver((id) =>
      useProgressionStore.getState().isItemUnlocked(id)
    )
    game.startNewRun(7)
    const state = game.getState() as OrchestratorState
    state.seasonSystem.clear()
    state.mandateEffectSystem.deactivateMandate()
    state.targetScore = 1e12
    state.roundManager.getCurrentRound()!.scoreTarget = 1e12
    if (ascended) {
      state.flowerSystem.addFlower(Tile.createFlower(1, 'f1'))
      state.flowerSystem.addFlower(Tile.createFlower(2, 'f2'))
      state.decreeSystem.acquireDecree(
        ALL_DECREES.find((d) => d.id === 'yakuman_succession')!
      )
    }
    const patterns: [TileSuit, number[]][] =
      yaku === 'seven_pairs'
        ? [
            [TileSuit.Manzu, [1, 1, 2, 2, 4, 4]],
            [TileSuit.Pinzu, [3, 3, 5, 5]],
            [TileSuit.Souzu, [6, 6, 8, 8]],
          ]
        : [
            [TileSuit.Manzu, [1, 2, 3, 7, 8, 9]],
            [TileSuit.Pinzu, [1, 2, 3]],
            [TileSuit.Wind, [1, 1, 1]],
            [TileSuit.Dragon, [2, 2]],
          ]
    state.handTiles = patterns.flatMap(([suit, ranks], group) =>
      ranks.map((rank, i) => new Tile(suit, rank, `${group}-${i}`))
    )
    const ids = state.handTiles.map((tile) => tile.id)
    const forecast = game.previewScore(ids)!
    expect(
      forecast.detectedYaku.some(
        (y) =>
          y.definition.id === yaku && (y.definition.tier === 4) === ascended
      )
    ).toBe(true)
    expect(game.isConsumableUnlocked(orb)).toBe(false)
    expect(
      useProgressionStore.getState().stats.yakuScored[yaku]
    ).toBeUndefined()
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(game.isConsumableUnlocked(orb)).toBe(true)
    expect(useProgressionStore.getState().stats.yakuScored[yaku]).toBe(1)
    expect(useProgressionStore.getState().stats.currentRunYakuIds).toContain(
      yaku
    )
    expect(useProgressionStore.getState().stats.yakumanScored).toBe(
      ascended ? 1 : 0
    )
  }
)
