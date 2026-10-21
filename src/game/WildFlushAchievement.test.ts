import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { DecreeSystem } from '../systems/DecreeSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'

const earned = () =>
  useAchievementStore.getState().achievements.wild_flush.unlocked

function fixture(wildCount = 14) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  const tiles = [
    ...[1, 2, 3, 1, 2, 3, 4, 5, 6, 9, 9].map(
      (rank, i) => new Tile(TileSuit.Manzu, rank, `suited-${i}`)
    ),
    ...[1, 1, 1].map((rank, i) => new Tile(TileSuit.Wind, rank, `honor-${i}`)),
  ]
  state.handTiles = tiles.map((tile, i) =>
    i < wildCount ? tile.withEnhancement(EnhancementType.Wild) : tile
  )
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  state.selectedTileIds.clear()
  state.faceDownTileIds.clear()
  return { game, ids: state.handTiles.map((tile) => tile.id) }
}

beforeEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  useArchiveStore.getState().resetArchive()
  useAchievementStore.getState().resetAchievements()
  initializeMetaProgressionBridge()
})
afterEach(() => shutdownMetaProgressionBridge())

it('awards only after paying an all-Wild complete Half Flush, not its preview', () => {
  const { game, ids } = fixture()
  const preview = game.previewScore(ids)!
  expect(preview.detectedYaku.map((yaku) => yaku.definition.id)).toContain(
    'honitsu'
  )
  expect(preview.finalScore).toBeGreaterThan(0)
  expect(earned()).toBe(false)
  const notified = vi.fn()
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (achievementId === 'wild_flush') notified()
  })
  try {
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(earned()).toBe(true)
    expect(notified).toHaveBeenCalledTimes(1)
    useAchievementStore.getState().checkAchievements()
    expect(notified).toHaveBeenCalledTimes(1)
  } finally {
    off()
  }
})

it.each([0, 1, 13])(
  'does not substitute %i Wild tiles for the all-Wild requirement',
  (wildCount) => {
    const { game, ids } = fixture(wildCount)
    expect(
      game.previewScore(ids)!.detectedYaku.map((yaku) => yaku.definition.id)
    ).toContain('honitsu')
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(earned()).toBe(false)
  }
)

it('does not call an all-Wild tactical pair a complete Half Flush', () => {
  const { game, ids } = fixture()
  expect(
    game.processAction({ type: 'play', tileIds: ids.slice(9, 11) }).success
  ).toBe(true)
  expect(earned()).toBe(false)
})

it('does not award a blocked or zero-scoring hand', () => {
  for (const { blocked, score } of [
    { blocked: true, score: 100 },
    { blocked: false, score: 0 },
  ]) {
    eventBus.emit('handPlayed', {
      tiles: ['wild'],
      score,
      yakuIds: ['honitsu'],
      allPlayedTilesWild: true,
      pattern: 'mahjong',
      blocked,
      equation: { points: score, multiplier: 1, adjustment: 0, total: score },
    })
  }
  expect(earned()).toBe(false)
})

it('does not create the achievement during Full Unlock play', () => {
  const { game, ids } = fixture()
  useProgressionStore.setState({ fullUnlockEnabled: true })
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(earned()).toBe(false)
})
