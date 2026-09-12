import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useStakeStore } from '../stores/stakeStore'
import { useTableStyleStore } from '../stores/tableStyleStore'
import { useSettingsStore } from '../stores/settingsStore'
import {
  useTableLoopStore,
  createTableLoopStore,
} from '../stores/tableLoopStore'
import { ArchiveSystem } from '../systems/ArchiveSystem'
import { TABLE_SAVE_KEY } from '../tableloop/savedRun'
import { gameOrchestrator as game } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import {
  resetAllProgress,
  resetTutorialProgress,
  PROGRESS_STORAGE_KEYS,
  TUTORIAL_PROGRESS_KEYS,
} from './resetProgress'

describe('explicit progress reset', () => {
  let data: Map<string, string>
  beforeEach(() => {
    data = new Map()
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
    expect(resetAllProgress()).toEqual({ success: true })
    initializeMetaProgressionBridge()
    game.startNewRun(7)
    eventBus.emit('actComplete', { actNumber: 3, totalScore: 5000 })
    useTableStyleStore.getState().selectStyle('red_lacquer')
    useStakeStore.getState().recordVictory(5000, 8, 'red_lacquer', 2)
    useArchiveStore.getState().unlockAll()
    useTableLoopStore.getState().restart(7, { draftEnabled: true })
    useTableLoopStore.getState().chooseStarter('echoing_bamboo')
    useTableLoopStore
      .getState()
      .toggleTile(useTableLoopStore.getState().state.rack[0].id)
    for (const key of TUTORIAL_PROGRESS_KEYS) localStorage.setItem(key, 'true')
    useSettingsStore.setState({
      language: 'es',
      reducedMotion: true,
      musicEnabled: false,
    })
    localStorage.setItem('tensho-language', 'es')
    localStorage.setItem('unrelated-project', 'keep me')
  })
  afterEach(() => {
    shutdownMetaProgressionBridge()
    vi.restoreAllMocks()
  })

  it('clears every progression system, runs, and tutorial keys but preserves preferences and unrelated data', () => {
    const settings = useSettingsStore.getState()
    const ended = vi.fn()
    const started = vi.fn()
    const offEnd = eventBus.on('runEnd', ended)
    const offStart = eventBus.on('runStart', started)
    expect(resetAllProgress()).toEqual({ success: true })
    expect(useAchievementStore.getState().getUnlockedCount()).toBe(0)
    expect(useAchievementStore.getState().stats.runsCompleted).toBe(0)
    expect(useProgressionStore.getState().stats.totalRunsStarted).toBe(0)
    expect(useProgressionStore.getState().stats.highestActReached).toBe(0)
    expect(useTableStyleStore.getState().unlockedStyles).toEqual(['green_felt'])
    expect(useTableStyleStore.getState().currentStyleId).toBe('green_felt')
    expect(useStakeStore.getState().wallProgress).toEqual({})
    expect(useStakeStore.getState().globalHighestCompleted).toBe(0)
    expect(useArchiveStore.getState().entries).toEqual(
      Object.fromEntries(new ArchiveSystem().toState().entries)
    )
    expect(useArchiveStore.getState().discoveryHistory).toEqual([])
    expect(useArchiveStore.getState().currentRunItems).toEqual([])
    expect(useAchievementStore.getState().stats.totalItemsDiscovered).toBe(
      useArchiveStore.getState().getDiscoveredEntries().length
    )
    expect(game.getState()).toMatchObject({
      phase: 'menu',
      isRunActive: false,
      handTiles: [],
    })
    expect(useTableLoopStore.getState()).toMatchObject({
      selectedTileIds: [],
      targetSlot: null,
      state: { phase: 'choosingStart', draftEnabled: false, ownedDecrees: [] },
    })
    expect(localStorage.getItem(TABLE_SAVE_KEY)).toBeNull()
    for (const key of TUTORIAL_PROGRESS_KEYS)
      expect(localStorage.getItem(key)).toBeNull()
    expect(useSettingsStore.getState()).toBe(settings)
    expect(localStorage.getItem('tensho-language')).toBe('es')
    expect(localStorage.getItem('unrelated-project')).toBe('keep me')
    expect(ended).not.toHaveBeenCalled()
    expect(started).not.toHaveBeenCalled()
    offEnd()
    offStart()
  })

  it('is repeatable and keeps the bridge attached exactly once for the next real run', () => {
    expect(resetAllProgress().success).toBe(true)
    expect(resetAllProgress().success).toBe(true)
    shutdownMetaProgressionBridge()
    initializeMetaProgressionBridge()
    expect(useTableStyleStore.getState().unlockedStyles).toEqual(['green_felt'])
    expect(useProgressionStore.getState().stats.totalRunsStarted).toBe(0)
    game.startNewRun(8)
    expect(useProgressionStore.getState().stats.totalRunsStarted).toBe(1)
    expect(game.getState().phase).toBe('gameplay')
    expect(useStakeStore.getState().globalHighestCompleted).toBe(0)
  })

  it('starts a new Table Loop journal rather than resurrecting removed actions', () => {
    expect(resetAllProgress().success).toBe(true)
    useTableLoopStore.getState().chooseStarter('patient_pair')
    const restored = createTableLoopStore(localStorage).getState()
    expect(restored.state.ownedDecrees).toEqual(['patient_pair'])
    expect(
      JSON.parse(localStorage.getItem(TABLE_SAVE_KEY)!).actions
    ).toHaveLength(1)
  })

  it('rolls back stores and exact saved values when the final run deletion fails', () => {
    const before = new Map(data)
    const run = game.getState()
    const table = useTableLoopStore.getState()
    const archive = useArchiveStore.getState()
    vi.mocked(localStorage.removeItem).mockImplementation((key) => {
      if (key === TABLE_SAVE_KEY) throw new Error('denied')
      data.delete(key)
    })
    expect(resetAllProgress()).toEqual({ success: false, restored: true })
    expect(data).toEqual(before)
    expect(game.getState()).toBe(run)
    expect(useTableLoopStore.getState()).toBe(table)
    expect(useArchiveStore.getState()).toBe(archive)
  })

  it('reports partial persistence when rollback itself cannot restore a changed key', () => {
    let writes = 0
    vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
      if (++writes > 1) throw new Error('storage locked')
      data.set(key, value)
    })
    const run = game.getState()
    expect(resetAllProgress()).toEqual({ success: false, restored: false })
    expect(game.getState()).toBe(run)
  })

  it('does not change anything if the backup cannot be read', () => {
    const before = new Map(data)
    const run = game.getState()
    vi.mocked(localStorage.getItem).mockImplementation(() => {
      throw new Error('denied')
    })
    expect(resetAllProgress()).toEqual({ success: false, restored: true })
    expect(data).toEqual(before)
    expect(game.getState()).toBe(run)
  })

  it('tutorial-only reset leaves all gameplay and earned progression untouched', () => {
    const before = new Map(data)
    const run = game.getState()
    expect(resetTutorialProgress()).toEqual({ success: true })
    for (const key of PROGRESS_STORAGE_KEYS.filter(
      (key) =>
        !TUTORIAL_PROGRESS_KEYS.includes(
          key as (typeof TUTORIAL_PROGRESS_KEYS)[number]
        )
    )) {
      expect(localStorage.getItem(key)).toBe(before.get(key) ?? null)
    }
    for (const key of TUTORIAL_PROGRESS_KEYS)
      expect(localStorage.getItem(key)).toBeNull()
    expect(game.getState()).toBe(run)
  })

  it('rolls back a partial tutorial deletion instead of reporting success', () => {
    const before = new Map(data)
    vi.mocked(localStorage.removeItem).mockImplementation((key) => {
      if (key === TUTORIAL_PROGRESS_KEYS[1]) throw new Error('denied')
      data.delete(key)
    })
    expect(resetTutorialProgress()).toEqual({ success: false, restored: true })
    expect(data).toEqual(before)
  })
})
