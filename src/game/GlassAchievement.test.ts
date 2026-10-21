import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { runRandom } from './RunRandom'

function fixture(tiles: Tile[]) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  Object.assign(state, {
    handTiles: tiles,
    targetScore: 1e9,
    selectedTileIds: new Set(),
    faceDownTileIds: new Set(),
  })
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return game
}

const glass = (id: string) =>
  new Tile(TileSuit.Manzu, 3, id).withEnhancement(EnhancementType.Glass)
const plain = () => new Tile(TileSuit.Manzu, 3, 'plain')
const count = () =>
  useAchievementStore.getState().stats.maxGlassTilesBrokenInHand
const earned = () =>
  useAchievementStore.getState().achievements.shattered.unlocked

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

it('counts two physical Glass breaks from paid play, never from repeated previews', () => {
  const game = fixture([glass('glass-a'), glass('glass-b')])
  vi.spyOn(runRandom, 'next').mockReturnValue(0)
  for (let i = 0; i < 3; i++)
    expect(game.previewScore(['glass-a', 'glass-b'])).not.toBeNull()
  expect(count()).toBe(0)
  expect(earned()).toBe(false)
  const notifications = vi.fn()
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (achievementId === 'shattered') notifications()
  })
  try {
    expect(
      game.processAction({ type: 'play', tileIds: ['glass-a', 'glass-b'] })
        .success
    ).toBe(true)
    expect(count()).toBe(2)
    expect(earned()).toBe(true)
    expect(notifications).toHaveBeenCalledTimes(1)
    useAchievementStore.getState().checkAchievements()
    expect(notifications).toHaveBeenCalledTimes(1)
  } finally {
    off()
  }
})

it('does not count a Decree retrigger as another broken physical tile', () => {
  const game = fixture([glass('repeat-glass'), plain()])
  expect(
    game
      .getState()
      .decreeSystem.acquireDecree(
        ALL_DECREES.find((decree) => decree.id === 'decree-echo-stone')!
      )
  ).toBeTruthy()
  vi.spyOn(runRandom, 'next').mockReturnValue(0)
  expect(
    game.processAction({ type: 'play', tileIds: ['repeat-glass', 'plain'] })
      .success
  ).toBe(true)
  expect(count()).toBe(1)
  expect(earned()).toBe(false)
})

it('does not count an unbroken Glass tile', () => {
  const game = fixture([glass('survivor'), plain()])
  vi.spyOn(runRandom, 'next').mockReturnValue(0.99)
  expect(
    game.processAction({ type: 'play', tileIds: ['survivor', 'plain'] }).success
  ).toBe(true)
  expect(count()).toBe(0)
  expect(earned()).toBe(false)
})

it('does not combine separate plays across profile rehydration or runs', async () => {
  const first = fixture([glass('first'), plain()])
  vi.spyOn(runRandom, 'next').mockReturnValue(0)
  expect(
    first.processAction({ type: 'play', tileIds: ['first', 'plain'] }).success
  ).toBe(true)
  expect(count()).toBe(1)
  const { stats, achievements } = useAchievementStore.getState()
  const saved = JSON.stringify({ state: { stats, achievements }, version: 2 })
  useAchievementStore.getState().resetAchievements()
  vi.spyOn(localStorage, 'getItem').mockImplementation((key) =>
    key === 'tensho-achievements' ? saved : null
  )
  await useAchievementStore.persist.rehydrate()
  expect(count()).toBe(1)
  shutdownMetaProgressionBridge()
  initializeMetaProgressionBridge()
  const second = fixture([glass('second'), plain()])
  expect(
    second.processAction({ type: 'play', tileIds: ['second', 'plain'] }).success
  ).toBe(true)
  expect(count()).toBe(1)
  expect(earned()).toBe(false)
  const third = fixture([glass('together-a'), glass('together-b')])
  expect(
    third.processAction({ type: 'play', tileIds: ['together-a', 'together-b'] })
      .success
  ).toBe(true)
  expect(count()).toBe(2)
  expect(earned()).toBe(true)
})

it('does not combine two one-tile breaks within the same round', () => {
  const game = fixture([glass('single-a'), plain()])
  vi.spyOn(runRandom, 'next').mockReturnValue(0)
  expect(
    game.processAction({ type: 'play', tileIds: ['single-a', 'plain'] }).success
  ).toBe(true)
  const state = game.getState() as OrchestratorState
  state.handTiles = [glass('single-b'), plain()]
  expect(
    game.processAction({ type: 'play', tileIds: ['single-b', 'plain'] }).success
  ).toBe(true)
  expect(count()).toBe(1)
  expect(earned()).toBe(false)
})

it('hydrates an older profile with zero unrecorded breaks without losing earned awards', async () => {
  useAchievementStore.getState().unlockAchievement('victory')
  useAchievementStore.getState().markAsSeen('victory')
  const { stats, achievements } = useAchievementStore.getState()
  const oldStats = Object.fromEntries(
    Object.entries(stats).filter(
      ([key]) =>
        key !== 'maxGlassTilesBrokenInHand' &&
        key !== 'highestYakuLevel' &&
        key !== 'wildHalfFlushesScored'
    )
  )
  const saved = JSON.stringify({
    state: { stats: oldStats, achievements },
    version: 2,
  })
  vi.spyOn(localStorage, 'getItem').mockImplementation((key) =>
    key === 'tensho-achievements' ? saved : null
  )
  await useAchievementStore.persist.rehydrate()
  expect(count()).toBe(0)
  expect(useAchievementStore.getState().stats.highestYakuLevel).toBe(1)
  expect(useAchievementStore.getState().stats.wildHalfFlushesScored).toBe(0)
  expect(useAchievementStore.getState().achievements.victory).toEqual(
    achievements.victory
  )
  expect(earned()).toBe(false)
})

it('does not record breaks or earn the award during Full Unlock play', () => {
  const game = fixture([glass('cheat-a'), glass('cheat-b')])
  useProgressionStore.setState({ fullUnlockEnabled: true })
  vi.spyOn(runRandom, 'next').mockReturnValue(0)
  expect(
    game.processAction({ type: 'play', tileIds: ['cheat-a', 'cheat-b'] })
      .success
  ).toBe(true)
  expect(count()).toBe(0)
  expect(earned()).toBe(false)
})
