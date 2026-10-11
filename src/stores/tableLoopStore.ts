/**
 * Table Loop store.
 *
 * A thin binding between the authoritative `TableLoopEngine` and React. The
 * engine owns every rule; this store owns only the transient UI selection and
 * mirrors the latest engine state so components can subscribe to it.
 *
 * @module stores/tableLoopStore
 */

import { create } from 'zustand'
import { registerReloadGuard } from '../pwa/reloadGuards'
import { TableLoopEngine } from '../tableloop/TableLoopEngine'
import { playTableAction } from '../tableloop/audioFeedback'
import { TileSFX } from '../systems/AudioSystem'
import { withTableSaveLock } from '../tableloop/saveLock'
import { RUN_SAVE_EPOCH_KEY } from '../game/runSaveEpoch'
import type { RunOptions } from '../tableloop/TableLoopEngine'
import {
  applySavedAction,
  newSavedRun,
  restoreSavedRun,
  tileIndices,
  TABLE_SAVE_KEY,
  type SavedAction,
} from '../tableloop/savedRun'
import type {
  PlacementScore,
  TableDecreeId,
  TableLoopState,
} from '../tableloop/types'

interface TableLoopStore {
  engine: TableLoopEngine
  state: TableLoopState
  saveStatus: 'saved' | 'saving' | 'unavailable' | 'invalid' | 'conflict'
  /** Committed journal changes that have not reached storage yet. */
  unsaved: boolean
  retrySave: () => Promise<boolean>
  refreshSave: () => void
  /** Explicit consent to discard this window's branch and load the latest record. */
  loadSavedRun: () => Promise<boolean>
  /** Reset coordinator calls this only after durable deletion under the write lock. */
  forgetAfterReset: (stamp?: string | null) => void
  /** Rack tiles the player has tapped, in tap order. */
  selectedTileIds: string[]
  /** Slot the player is aiming at, or null for "the first slot that fits". */
  targetSlot: number | null

  toggleTile: (tileId: string) => void
  clearSelection: () => void
  setTargetSlot: (slot: number | null) => void

  chooseStarter: (id: TableDecreeId) => void
  place: (slotIndex: number) => void
  revise: (slotIndex: number) => void
  redraw: () => void
  swapWithRiver: (tileId: string) => boolean
  claimDraft: (tileId: string) => void
  passDraft: () => void
  finishRound: () => void
  openShop: () => void
  buyDecree: (id: TableDecreeId) => void
  nextRound: () => void
  restart: (seed?: number, options?: RunOptions) => void
  /** Explicit reset: remove the saved run before replacing the live engine. */
  clearSavedRun: () => Promise<void>
  takePracticeDecree: () => void

  previewPlacement: (slotIndex: number) => PlacementScore | null
}

/**
 * Apply an engine action and republish its state.
 *
 * The selection is cleared only when the action consumed the selected tiles,
 * so a refused placement leaves the player's tiles where they were.
 */
type RunStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function browserStorage(): RunStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const createTableLoopStore = (
  storage: RunStorage | null | (() => RunStorage | null) = browserStorage,
  exclusive: typeof withTableSaveLock = withTableSaveLock
) =>
  create<TableLoopStore>((set, get) => {
    // Resolve access again for writes: an initially denied localStorage getter
    // must not permanently strand a live journal after permission is restored.
    const resolveStorage =
      typeof storage === 'function' ? storage : () => storage
    let initialStatus: TableLoopStore['saveStatus'] = 'saved'
    let restored: ReturnType<typeof restoreSavedRun> = null
    // Undefined means the initial read failed: permission returning is not
    // permission to overwrite a record we never observed.
    let baseline: string | null | undefined
    let baselineEpoch: string | null | undefined
    try {
      const currentStorage = resolveStorage()
      if (!currentStorage) initialStatus = 'unavailable'
      const raw = currentStorage?.getItem(TABLE_SAVE_KEY)
      baseline = currentStorage ? (raw ?? null) : undefined
      baselineEpoch = currentStorage?.getItem(RUN_SAVE_EPOCH_KEY)
      if (raw) {
        restored = restoreSavedRun(raw)
        if (!restored) initialStatus = 'invalid'
      }
    } catch {
      initialStatus = 'unavailable'
      baseline = undefined
      baselineEpoch = undefined
    }
    const engine = restored?.engine ?? new TableLoopEngine()
    let journal = restored?.journal ?? newSavedRun(engine)
    let epoch = 0
    let pending: Promise<boolean> | null = null
    const conflict = () => {
      epoch++
      // An untouched/still-durable branch has nothing local to lose on reload.
      // A simultaneous rejected checkpoint, however, retains its unsaved flag.
      set({ saveStatus: 'conflict' })
      return false
    }
    const matches = (currentStorage: RunStorage) => {
      const raw = currentStorage.getItem(TABLE_SAVE_KEY)
      const stamp = currentStorage.getItem(RUN_SAVE_EPOCH_KEY)
      return (
        (baseline === undefined ? raw === null : raw === baseline) &&
        (baselineEpoch === undefined ? stamp === null : stamp === baselineEpoch)
      )
    }
    const canAct = () => {
      if (get().saveStatus === 'conflict') return false
      try {
        const currentStorage = resolveStorage()
        if (currentStorage && !matches(currentStorage)) return conflict()
        return true
      } catch {
        // Allow an explicitly unsaved in-memory game; the locked writer still
        // must compare the exact old record if access returns later.
        return true
      }
    }
    const save = (): Promise<boolean> => {
      if (get().saveStatus === 'conflict') return Promise.resolve(false)
      if (pending) return pending
      if (!get().unsaved) return Promise.resolve(true)
      const generation = epoch
      const operation = exclusive(() => {
        if (generation !== epoch) return false
        const currentStorage = resolveStorage()
        if (!currentStorage) throw new Error('Storage unavailable')
        if (!matches(currentStorage)) return conflict()
        // Transport identity, not gameplay RNG. Replaying the same seed and
        // actions must not recreate an obsolete checkpoint's exact bytes.
        const raw = JSON.stringify({
          ...journal,
          checkpointId: crypto.randomUUID(),
        })
        currentStorage.setItem(TABLE_SAVE_KEY, raw)
        baseline = raw
        baselineEpoch ??= null
        set({ saveStatus: 'saved', unsaved: false })
        return true
      })
        .catch(() => {
          if (generation === epoch && get().saveStatus !== 'conflict')
            set({ saveStatus: 'unavailable', unsaved: true })
          return false
        })
        .finally(() => {
          if (pending === operation) {
            pending = null
            if (get().unsaved && get().saveStatus === 'saving') void save()
          }
        })
      pending = operation
      return operation
    }
    const changed = () => {
      set({ saveStatus: 'saving', unsaved: true })
      void save()
    }
    const replaceLocal = (
      next: TableLoopEngine,
      raw: string | null,
      stamp: string | null
    ) => {
      epoch++
      pending = null
      baseline = raw
      baselineEpoch = stamp
      set({
        engine: next,
        state: next.getState(),
        selectedTileIds: [],
        targetSlot: null,
        saveStatus: 'saved',
        unsaved: false,
      })
    }
    const forgetAfterReset = (stamp: string | null = null) => {
      const fresh = new TableLoopEngine()
      journal = newSavedRun(fresh)
      replaceLocal(fresh, null, stamp)
    }

    const publish = (clearSelection: boolean) => {
      set((current) => ({
        state: current.engine.getState(),
        selectedTileIds: clearSelection ? [] : current.selectedTileIds,
        targetSlot: clearSelection ? null : current.targetSlot,
      }))
    }

    const perform = (action: SavedAction, consumesSelection = false) => {
      if (!canAct()) return false
      const result = applySavedAction(get().engine, action)
      if (result.success) {
        journal = { ...journal, actions: [...journal.actions, action] }
        changed()
      }
      publish(result.success && consumesSelection)
      // Some refusals return an error state without mutating the engine.
      set({ state: result.state })
      playTableAction(action, result.success, result.state)
      return result.success
    }

    return {
      engine,
      state: engine.getState(),
      saveStatus: initialStatus,
      unsaved: false,
      // Only a committed action can make this journal dirty. An update must
      // not overwrite an invalid original save with a fresh, untouched run.
      retrySave: save,
      refreshSave: () => {
        canAct()
      },
      forgetAfterReset,
      loadSavedRun: async () => {
        try {
          return await exclusive(() => {
            const currentStorage = resolveStorage()
            if (!currentStorage) return false
            const raw = currentStorage.getItem(TABLE_SAVE_KEY)
            const latest = raw === null ? null : restoreSavedRun(raw)
            if (raw !== null && !latest) return false
            // Finish all fallible reads before replacing even the private journal.
            const stamp = currentStorage.getItem(RUN_SAVE_EPOCH_KEY)
            const next = latest?.engine ?? new TableLoopEngine()
            journal = latest?.journal ?? newSavedRun(next)
            replaceLocal(next, raw, stamp)
            return true
          })
        } catch {
          return false
        }
      },
      selectedTileIds: [],
      targetSlot: null,

      toggleTile: (tileId) => {
        if (get().selectedTileIds.includes(tileId)) TileSFX.deselect()
        else TileSFX.select()
        set((current) => ({
          selectedTileIds: current.selectedTileIds.includes(tileId)
            ? current.selectedTileIds.filter((id) => id !== tileId)
            : [...current.selectedTileIds, tileId],
        }))
      },

      clearSelection: () => set({ selectedTileIds: [], targetSlot: null }),

      setTargetSlot: (slot) => set({ targetSlot: slot }),

      chooseStarter: (id) => {
        perform({ type: 'chooseStarter', decree: id }, true)
      },

      place: (slotIndex) => {
        perform(
          {
            type: 'place',
            tiles: tileIndices(get().engine, get().selectedTileIds),
            slot: slotIndex,
          },
          true
        )
      },

      revise: (slotIndex) => {
        perform(
          {
            type: 'revise',
            tiles: tileIndices(get().engine, get().selectedTileIds),
            slot: slotIndex,
          },
          true
        )
      },

      redraw: () => {
        perform(
          {
            type: 'redraw',
            tiles: tileIndices(get().engine, get().selectedTileIds),
          },
          true
        )
      },

      swapWithRiver: (tileId) => {
        const selected = get().selectedTileIds
        return perform(
          {
            type: 'swapWithRiver',
            tile: tileIndices(get().engine, [tileId])[0],
            rackTile: tileIndices(get().engine, [
              selected.length === 1 ? selected[0] : '',
            ])[0],
          },
          true
        )
      },

      claimDraft: (tileId) => {
        perform({
          type: 'claimDraft',
          tile: tileIndices(get().engine, [tileId])[0],
        })
      },

      passDraft: () => {
        perform({ type: 'passDraft' })
      },

      finishRound: () => {
        perform({ type: 'finishRound' }, true)
      },

      openShop: () => {
        perform({ type: 'openShop' }, true)
      },

      buyDecree: (id) => {
        perform({ type: 'buyDecree', decree: id })
      },

      nextRound: () => {
        perform({ type: 'nextRound' }, true)
      },

      restart: (seed, options) => {
        if (!canAct()) return
        epoch++
        pending = null
        get().engine.restart(seed, options)
        journal = newSavedRun(get().engine)
        changed()
        publish(true)
      },

      clearSavedRun: () =>
        exclusive(() => {
          const currentStorage = resolveStorage()
          if (!currentStorage) throw new Error('Storage unavailable')
          const prior = currentStorage.getItem(RUN_SAVE_EPOCH_KEY)
          const stamp = crypto.randomUUID()
          currentStorage.setItem(RUN_SAVE_EPOCH_KEY, stamp)
          try {
            currentStorage.removeItem(TABLE_SAVE_KEY)
          } catch (error) {
            if (prior === null) currentStorage.removeItem(RUN_SAVE_EPOCH_KEY)
            else currentStorage.setItem(RUN_SAVE_EPOCH_KEY, prior)
            throw error
          }
          forgetAfterReset(stamp)
        }),

      takePracticeDecree: () => {
        perform({ type: 'takePracticeDecree' })
      },

      previewPlacement: (slotIndex) =>
        get().engine.previewPlacement(get().selectedTileIds, slotIndex),
    }
  })

export const useTableLoopStore = createTableLoopStore()

const unregisterReloadGuard = registerReloadGuard(
  'table-loop',
  () =>
    !useTableLoopStore.getState().unsaved ||
    useTableLoopStore.getState().retrySave()
)
const beforeUnload = (event: BeforeUnloadEvent) => {
  if (!useTableLoopStore.getState().unsaved) return
  event.preventDefault()
  event.returnValue = ''
}
window.addEventListener('beforeunload', beforeUnload)
const storageChanged = (event: StorageEvent) => {
  if (
    event.key === TABLE_SAVE_KEY ||
    event.key === RUN_SAVE_EPOCH_KEY ||
    event.key === null
  )
    useTableLoopStore.getState().refreshSave()
}
const visibilityChanged = () => {
  useTableLoopStore.getState().refreshSave()
}
window.addEventListener('storage', storageChanged)
document.addEventListener('visibilitychange', visibilityChanged)
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    unregisterReloadGuard()
    window.removeEventListener('beforeunload', beforeUnload)
    window.removeEventListener('storage', storageChanged)
    document.removeEventListener('visibilitychange', visibilityChanged)
  })
