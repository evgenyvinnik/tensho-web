import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useStakeStore } from '../stores/stakeStore'
import { useTableStyleStore } from '../stores/tableStyleStore'
import { useTableLoopStore } from '../stores/tableLoopStore'
import { TABLE_SAVE_KEY } from '../tableloop/savedRun'
import {
  PROGRESSIVE_HINTS_STORAGE_KEY,
  HINTS_DISABLED_STORAGE_KEY,
} from '../config/progressiveTutorialHints'
import { gameOrchestrator } from './GameOrchestrator'
import {
  resetMetaProgressionRunContext,
  synchronizePersistedMetaState,
} from './MetaProgressionBridge'

export const TUTORIAL_PROGRESS_KEYS = [
  'tensho_tutorial_completed',
  'tensho_game_tutorial_completed',
  'tensho_codex_completed',
  PROGRESSIVE_HINTS_STORAGE_KEY,
  HINTS_DISABLED_STORAGE_KEY,
] as const

const stores = [
  useAchievementStore,
  useProgressionStore,
  useTableStyleStore,
  useStakeStore,
  useArchiveStore,
] as const
export const PROGRESS_STORAGE_KEYS = [
  ...stores.map((store) => {
    const name = store.persist.getOptions().name
    if (!name) throw new Error('Progress store requires a persistence key')
    return name
  }),
  TABLE_SAVE_KEY,
  ...TUTORIAL_PROGRESS_KEYS,
]

export type ResetProgressResult =
  | { success: true }
  | { success: false; restored: boolean }

function captureStore<State>(store: {
  getState: () => State
  setState: (state: State, replace: true) => unknown
}) {
  const previous = store.getState()
  return {
    restore: () => store.setState(previous, true),
    restored: () => store.getState() === previous,
  }
}

function captureStorage(keys: readonly string[]) {
  const storage = window.localStorage
  const before = new Map(keys.map((key) => [key, storage.getItem(key)]))
  return {
    storage,
    rollback() {
      // Best effort across every exact key even when one write is rejected.
      for (const [key, value] of before) {
        try {
          if (storage.getItem(key) === value) continue
          if (value === null) storage.removeItem(key)
          else storage.setItem(key, value)
        } catch {
          /* Verification below determines whether rollback succeeded. */
        }
      }
      try {
        return [...before].every(
          ([key, value]) => storage.getItem(key) === value
        )
      } catch {
        return false
      }
    },
  }
}

export function resetTutorialProgress(): ResetProgressResult {
  let saved: ReturnType<typeof captureStorage>
  try {
    saved = captureStorage(TUTORIAL_PROGRESS_KEYS)
  } catch {
    return { success: false, restored: true }
  }
  try {
    for (const key of TUTORIAL_PROGRESS_KEYS) saved.storage.removeItem(key)
    return { success: true }
  } catch {
    return { success: false, restored: saved.rollback() }
  }
}

/** Only call after explicit confirmation. Never clear unrelated origin data. */
export function resetAllProgress(): ResetProgressResult {
  let saved: ReturnType<typeof captureStorage>
  try {
    saved = captureStorage(PROGRESS_STORAGE_KEYS)
  } catch {
    return { success: false, restored: true }
  }
  // Separate closures retain each store's precise state type and its actions.
  const snapshots = [
    captureStore(useAchievementStore),
    captureStore(useProgressionStore),
    captureStore(useTableStyleStore),
    captureStore(useStakeStore),
    captureStore(useArchiveStore),
  ]
  try {
    useAchievementStore.getState().resetAchievements()
    useProgressionStore.getState().resetProgression()
    useTableStyleStore.getState().resetAllProgress()
    useStakeStore.getState().resetAllProgress()
    useArchiveStore.getState().resetArchive()
    synchronizePersistedMetaState()
    for (const key of TUTORIAL_PROGRESS_KEYS) saved.storage.removeItem(key)
    // Last fallible storage operation: this preserves its live engine on error.
    useTableLoopStore.getState().clearSavedRun()
  } catch {
    for (const snapshot of snapshots) {
      try {
        snapshot.restore()
      } catch {
        /* Zustand updates memory before persisting. */
      }
    }
    const persisted = saved.rollback()
    return {
      success: false,
      restored: persisted && snapshots.every((snapshot) => snapshot.restored()),
    }
  }
  resetMetaProgressionRunContext()
  // No runEnd event: deleting progress must not award a loss, win, or unlock.
  gameOrchestrator.resetGame()
  return { success: true }
}
