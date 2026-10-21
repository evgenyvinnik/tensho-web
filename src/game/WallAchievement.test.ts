import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import { DecreeSystem } from '../systems/DecreeSystem'
import { VOID_SCRIPTS, VoidScriptSystem } from '../systems/VoidScriptSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { runRandom } from './RunRandom'

const stats = () => useAchievementStore.getState().stats
const earned = (id: string) =>
  useAchievementStore.getState().achievements[id].unlocked

function start() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  return game
}

function release(game: GameOrchestrator, count = 2) {
  const seal = FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_release)
  const targets = game
    .getSealableWallTiles()
    .slice(0, count)
    .map((t) => t.id)
  expect(targets).toHaveLength(count)
  expect(game.applyFateSeal(seal, 'pack_open', targets)).toBe(true)
}

beforeEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  useArchiveStore.getState().resetArchive()
  useAchievementStore.getState().resetAchievements()
  initializeMetaProgressionBridge()
})

afterEach(() => {
  shutdownMetaProgressionBridge()
  vi.restoreAllMocks()
  runRandom.reset()
})

it('awards neither wall achievement before an actual run exists', () => {
  useAchievementStore.getState().checkAchievements()
  const game = new GameOrchestrator()
  game.resetGame()
  expect(stats().maximumWallSize).toBe(0)
  expect(stats().minimumWallSize).toBe(Number.MAX_SAFE_INTEGER)
  expect(earned('deck_maximalist')).toBe(false)
  expect(earned('deck_minimalist')).toBe(false)
})

it('observes the full starting collection, not the partially dealt draw pile', () => {
  const notifications = vi.fn()
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (achievementId === 'deck_maximalist') notifications()
  })
  try {
    const game = start()
    expect(game.getState().wallTemplate).toHaveLength(144)
    expect(stats().minimumWallSize).toBe(144)
    expect(stats().maximumWallSize).toBe(144)
    expect(earned('deck_maximalist')).toBe(true)
    expect(earned('deck_minimalist')).toBe(false)
    game.startNewRun(8)
    expect(notifications).toHaveBeenCalledTimes(1)
  } finally {
    off()
  }
})

it('does not count a depleted draw pile or REDRAW as permanent thinning', () => {
  const game = start()
  const state = game.getState() as OrchestratorState
  state.drawIndex = state.wall.length - 3
  expect(
    game.processAction({
      type: 'redraw',
      tileIds: [state.handTiles[0].id],
    }).success
  ).toBe(true)
  expect(state.wallTemplate).toHaveLength(144)
  expect(stats().minimumWallSize).toBe(144)
  expect(earned('deck_minimalist')).toBe(false)
})

it('tracks real Seal removals through the 20-tile threshold and announces once', () => {
  const game = start()
  const notifications = vi.fn()
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (achievementId === 'deck_minimalist') notifications()
  })
  try {
    while (game.getState().wallTemplate.length > 22) release(game)
    expect(stats().minimumWallSize).toBe(22)
    expect(earned('deck_minimalist')).toBe(false)
    release(game)
    expect(stats().minimumWallSize).toBe(20)
    expect(earned('deck_minimalist')).toBe(true)
    release(game)
    expect(stats().minimumWallSize).toBe(18)
    expect(notifications).toHaveBeenCalledTimes(1)
    expect(stats().maximumWallSize).toBe(144)
  } finally {
    off()
  }
})

it('counts Tile Pack growth and observes only the settled Script result', () => {
  const game = start()
  expect(game.addTileToWall(new Tile(TileSuit.Manzu, 3, 'pack-growth'))).toBe(
    true
  )
  expect(stats().maximumWallSize).toBe(145)
  const observations: number[] = []
  const off = eventBus.on('wallCompositionChanged', ({ tileCount }) => {
    observations.push(tileCount)
  })
  try {
    const script = VoidScriptSystem.createVoidScriptInstance(
      VOID_SCRIPTS.script_of_kinship
    )
    expect(game.addVoidScript(script)).toBe(true)
    expect(
      game.processAction({
        type: 'useScript',
        scriptId: script.instanceId,
      }).success
    ).toBe(true)
    const size = game.getState().wallTemplate.length
    expect(size).toBeGreaterThan(145)
    expect(observations).toEqual([size])
    expect(stats().minimumWallSize).toBe(144)
    expect(stats().maximumWallSize).toBe(size)
  } finally {
    off()
  }
})

it('records Glass destruction on the final losing play', () => {
  const game = start()
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  const pair = state.wallTemplate
    .filter((t) => t.suit === TileSuit.Manzu && t.rank === 3)
    .slice(0, 2)
    .map((t) => t.withEnhancement(EnhancementType.Glass))
  state.wallTemplate = state.wallTemplate.map(
    (t) => pair.find((p) => p.id === t.id) ?? t
  )
  state.handTiles = pair
  state.handsRemaining = 1
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  vi.spyOn(runRandom, 'next').mockReturnValue(0)
  expect(
    game.processAction({ type: 'play', tileIds: pair.map((t) => t.id) }).success
  ).toBe(true)
  expect(state.isRunActive).toBe(false)
  expect(state.wallTemplate).toHaveLength(142)
  expect(stats().minimumWallSize).toBe(142)
})

it('restores observed sizes without replaying earned notifications or run counts', () => {
  const game = start()
  release(game)
  const checkpoint = game.captureRun()
  const notifications = vi.fn()
  const off = eventBus.on('achievementUnlocked', notifications)
  try {
    new GameOrchestrator().restoreRun(checkpoint)
    expect(stats().minimumWallSize).toBe(142)
    expect(stats().maximumWallSize).toBe(144)
    expect(useProgressionStore.getState().stats.totalRunsStarted).toBe(1)
    expect(notifications).not.toHaveBeenCalled()
  } finally {
    off()
  }
})

it('does not create progress in Full Unlock mode', () => {
  useProgressionStore.setState({ fullUnlockEnabled: true })
  const game = start()
  release(game)
  expect(stats().maximumWallSize).toBe(0)
  expect(stats().minimumWallSize).toBe(Number.MAX_SAFE_INTEGER)
  expect(earned('deck_maximalist')).toBe(false)
})

it.each([-1, 0.5, NaN, Infinity])(
  'ignores invalid observed size %s',
  (tileCount) => {
    eventBus.emit('wallCompositionChanged', { tileCount })
    expect(stats().maximumWallSize).toBe(0)
    expect(stats().minimumWallSize).toBe(Number.MAX_SAFE_INTEGER)
  }
)

it.each([false, true])(
  'migrates placeholder counters but preserves earned awards (%s)',
  async (unlocked) => {
    const store = useAchievementStore.getState()
    const saved = JSON.stringify({
      version: 2,
      state: {
        stats: {
          ...store.stats,
          maximumWallSize: 136,
          minimumWallSize: 136,
          totalTilesPlayed: 51,
        },
        achievements: {
          ...store.achievements,
          deck_maximalist: {
            id: 'deck_maximalist',
            unlocked,
            seen: unlocked,
          },
        },
      },
    })
    vi.spyOn(localStorage, 'getItem').mockImplementation((key) =>
      key === 'tensho-achievements' ? saved : null
    )
    await useAchievementStore.persist.rehydrate()
    useAchievementStore.getState().checkAchievements()
    expect(stats().minimumWallSize).toBe(Number.MAX_SAFE_INTEGER)
    expect(stats().maximumWallSize).toBe(0)
    expect(stats().totalTilesPlayed).toBe(51)
    expect(earned('deck_maximalist')).toBe(unlocked)
    expect(earned('deck_minimalist')).toBe(false)
  }
)

it('preserves version 3 observed extrema on profile rehydration', async () => {
  const game = start()
  release(game)
  const { stats, achievements } = useAchievementStore.getState()
  const saved = JSON.stringify({ version: 3, state: { stats, achievements } })
  useAchievementStore.getState().resetAchievements()
  vi.spyOn(localStorage, 'getItem').mockImplementation((key) =>
    key === 'tensho-achievements' ? saved : null
  )
  await useAchievementStore.persist.rehydrate()
  expect(useAchievementStore.getState().stats.minimumWallSize).toBe(142)
  expect(useAchievementStore.getState().stats.maximumWallSize).toBe(144)
})
