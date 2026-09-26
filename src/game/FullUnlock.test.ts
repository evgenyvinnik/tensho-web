import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ALL_UNLOCKS, CHARTER_UNLOCKS } from '../config/unlockDefinitions'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import {
  useAchievementStore,
  ACHIEVEMENT_DEFINITIONS,
} from '../stores/achievementStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useTableStyleStore } from '../stores/tableStyleStore'
import { useStakeStore } from '../stores/stakeStore'
import { useSettingsStore } from '../stores/settingsStore'
import {
  activateFullUnlock,
  resetAllProgress,
  resetTutorialProgress,
} from './resetProgress'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
  synchronizePersistedMetaState,
} from './MetaProgressionBridge'
import { GameOrchestrator } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { TEA_HOUSE_BASE_CHARTERS } from '../systems/TeaHouseSystem'

beforeEach(() => {
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
  shutdownMetaProgressionBridge()
  expect(resetAllProgress().success).toBe(true)
  initializeMetaProgressionBridge()
})
afterEach(() => {
  vi.restoreAllMocks()
  shutdownMetaProgressionBridge()
  resetAllProgress()
})

it('unlocks every catalog item, table and valid stake without manufacturing wins or achievements', () => {
  const achievements = useAchievementStore.getState()
  const stats = useProgressionStore.getState().stats
  expect(activateFullUnlock()).toEqual({ success: true })
  expect(useProgressionStore.getState().fullUnlockEnabled).toBe(true)
  for (const definition of ALL_UNLOCKS)
    expect(
      useProgressionStore.getState().isItemUnlocked(definition.unlocksId)
    ).toBe(true)
  for (const table of TABLE_STYLE_DEFINITIONS) {
    expect(useTableStyleStore.getState().selectStyle(table.id)).toBe(true)
    expect(useStakeStore.getState().getHighestAvailableStake(table.id)).toBe(8)
    for (let tier = 1; tier <= 8; tier++)
      expect(useStakeStore.getState().selectStake(table.id, tier)).toBe(true)
  }
  for (const tier of [0, 9, NaN, 1.5])
    expect(useStakeStore.getState().selectStake('green_felt', tier)).toBe(false)
  expect(
    Object.values(useArchiveStore.getState().entries).every(
      (entry) => entry.isUnlocked
    )
  ).toBe(true)
  expect(useStakeStore.getState().wallProgress).toEqual({})
  expect(useStakeStore.getState().globalHighestCompleted).toBe(0)
  expect(useProgressionStore.getState().stats).toEqual(stats)
  expect(useProgressionStore.getState().recentUnlocks).toEqual([])
  expect(useAchievementStore.getState()).toBe(achievements)
})

it('stops all achievement mutations and notifications but preserves earned achievements', () => {
  const first = ACHIEVEMENT_DEFINITIONS[0].id
  const second = ACHIEVEMENT_DEFINITIONS[1].id
  useAchievementStore.getState().unlockAchievement(first)
  const earned = useAchievementStore.getState().achievements
  const stats = useAchievementStore.getState().stats
  activateFullUnlock()
  const notified = vi.fn()
  const off = eventBus.on('achievementUnlocked', notified)
  const store = useAchievementStore.getState()
  store.unlockAchievement(second)
  store.updateProgress(second, 999)
  store.incrementStat('totalTilesPlayed', 9999)
  store.setStat('highestActReached', 99)
  store.checkAchievements()
  const game = new GameOrchestrator()
  game.startNewRun(7)
  eventBus.emit('handPlayed', {
    tiles: ['a', 'b'],
    score: 1e9,
    equation: { points: 1e9, multiplier: 1, adjustment: 0, total: 1e9 },
    yakuIds: [],
  })
  synchronizePersistedMetaState()
  expect(useAchievementStore.getState().achievements).toEqual(earned)
  expect(useAchievementStore.getState().stats).toEqual(stats)
  expect(store.getUnseenUnlocks()).toEqual([])
  expect(notified).not.toHaveBeenCalled()
  expect(useProgressionStore.getState().stats.totalTilesPlayed).toBe(2)
  off()
})

it('still requires current-run bases and real payment eligibility for all Charter upgrades', () => {
  activateFullUnlock()
  const game = new GameOrchestrator()
  game.setCharterUnlockResolver((id) =>
    useProgressionStore.getState().isItemUnlocked(id)
  )
  game.startNewRun(7)
  for (const unlock of CHARTER_UNLOCKS)
    expect(
      game.getState().charterSystem.canPurchaseCharter(unlock.unlocksId)
    ).toBe(false)
  expect(useStakeStore.getState().selectStake('unknown-table', 8)).toBe(false)
  for (const base of TEA_HOUSE_BASE_CHARTERS)
    expect(game.addImperialCharter(base)).toBe(true)
  for (const unlock of CHARTER_UNLOCKS)
    expect(
      game.getState().charterSystem.canPurchaseCharter(unlock.unlocksId)
    ).toBe(true)
})

it('persists the mode and quietly restores the full catalog after hydration', async () => {
  activateFullUnlock()
  const storage = useProgressionStore.persist.getOptions().storage!
  const saved = await storage.getItem('tensho-progression')
  expect(saved!.state).toMatchObject({ fullUnlockEnabled: true })
  useProgressionStore.setState({ fullUnlockEnabled: false })
  await storage.setItem('tensho-progression', saved!)
  await useProgressionStore.persist.rehydrate()
  useTableStyleStore.getState().resetAllProgress()
  useArchiveStore.getState().resetArchive()
  synchronizePersistedMetaState()
  expect(useProgressionStore.getState().fullUnlockEnabled).toBe(true)
  expect(useTableStyleStore.getState().getLockedStyles()).toEqual([])
  expect(
    Object.values(useArchiveStore.getState().entries).every(
      (entry) => entry.isUnlocked
    )
  ).toBe(true)
  expect(useProgressionStore.getState().recentUnlocks).toEqual([])
})

it('keeps legacy profiles earned and does not infer Full Unlock from Archive flags', async () => {
  useArchiveStore.getState().unlockAll()
  const storage = useProgressionStore.persist.getOptions().storage!
  const saved = await storage.getItem('tensho-progression')
  delete (saved!.state as { fullUnlockEnabled?: boolean }).fullUnlockEnabled
  await storage.setItem('tensho-progression', saved!)
  await useProgressionStore.persist.rehydrate()
  synchronizePersistedMetaState()
  expect(useProgressionStore.getState().fullUnlockEnabled).toBe(false)
  expect(useProgressionStore.getState().isItemUnlocked('money_tree')).toBe(
    false
  )
})

it('requires a full progress reset, not preferences/tutorial/achievement reset, to return to earned mode', () => {
  activateFullUnlock()
  useAchievementStore.getState().resetAchievements()
  resetTutorialProgress()
  useSettingsStore.getState().resetSettings()
  expect(useProgressionStore.getState().fullUnlockEnabled).toBe(true)
  expect(resetAllProgress()).toEqual({ success: true })
  expect(useProgressionStore.getState().fullUnlockEnabled).toBe(false)
  expect(useProgressionStore.getState().isItemUnlocked('money_tree')).toBe(
    false
  )
  expect(useTableStyleStore.getState().getUnlockedStyles()).toHaveLength(1)
  expect(useStakeStore.getState().getHighestAvailableStake('green_felt')).toBe(
    1
  )
  useAchievementStore
    .getState()
    .unlockAchievement(ACHIEVEMENT_DEFINITIONS[0].id)
  expect(useAchievementStore.getState().getUnlockedCount()).toBe(1)
})

it('rolls back live and persisted state when enabling cannot be saved', () => {
  const progression = useProgressionStore.getState()
  const archive = useArchiveStore.getState()
  const tables = useTableStyleStore.getState()
  const before = localStorage.getItem('tensho-progression')
  const original = vi.mocked(localStorage.setItem).getMockImplementation()!
  vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
    if (key === 'tensho-archive') throw new Error('denied')
    original(key, value)
  })
  expect(activateFullUnlock()).toEqual({ success: false, restored: true })
  expect(useProgressionStore.getState()).toBe(progression)
  expect(useArchiveStore.getState()).toBe(archive)
  expect(useTableStyleStore.getState()).toBe(tables)
  expect(localStorage.getItem('tensho-progression')).toBe(before)
})

it('does not mutate if persistence cannot be read, and reports an incomplete rollback', () => {
  const initial = useProgressionStore.getState()
  const read = vi.mocked(localStorage.getItem).getMockImplementation()!
  const reader = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
    throw new Error('read denied')
  })
  expect(activateFullUnlock()).toEqual({ success: false, restored: true })
  expect(useProgressionStore.getState()).toBe(initial)
  reader.mockImplementation(read)
  const original = vi.mocked(localStorage.setItem).getMockImplementation()!
  let writes = 0
  vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
    if (++writes > 1) throw new Error('storage locked')
    original(key, value)
  })
  expect(activateFullUnlock()).toEqual({ success: false, restored: false })
  expect(useProgressionStore.getState()).toBe(initial)
})

it('keeps Full Unlock and suppressed achievements after a failed full reset', () => {
  activateFullUnlock()
  const before = localStorage.getItem('tensho-progression')
  const original = vi.mocked(localStorage.setItem).getMockImplementation()!
  vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
    if (key === 'tensho-archive') throw new Error('denied')
    original(key, value)
  })
  expect(resetAllProgress()).toEqual({ success: false, restored: true })
  expect(useProgressionStore.getState().fullUnlockEnabled).toBe(true)
  expect(localStorage.getItem('tensho-progression')).toBe(before)
  useAchievementStore
    .getState()
    .unlockAchievement(ACHIEVEMENT_DEFINITIONS[0].id)
  expect(useAchievementStore.getState().getUnlockedCount()).toBe(0)
})

it.each([Infinity, 12])(
  'preserves fastest-win statistics through JSON hydration (%s)',
  async (rounds) => {
    const achievements = useAchievementStore.getState()
    achievements.setStat('fastestWinRounds', rounds)
    useProgressionStore.getState().setStat('fastestWinRounds', rounds)
    await useProgressionStore.persist.rehydrate()
    expect(useProgressionStore.getState().stats.fastestWinRounds).toBe(rounds)
    await useAchievementStore.persist.rehydrate()
    expect(useAchievementStore.getState().stats.fastestWinRounds).toBe(rounds)
    useAchievementStore.getState().checkAchievements()
    const speed = ACHIEVEMENT_DEFINITIONS.find(
      (definition) => definition.condition.type === 'win_in_rounds'
    )!
    expect(useAchievementStore.getState().achievements[speed.id].unlocked).toBe(
      rounds <= speed.condition.target!
    )
  }
)
