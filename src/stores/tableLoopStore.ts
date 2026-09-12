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
import { TableLoopEngine } from '../tableloop/TableLoopEngine'
import { playTableAction } from '../tableloop/audioFeedback'
import { TileSFX } from '../systems/AudioSystem'
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
  saveStatus: 'saved' | 'unavailable' | 'invalid'
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
  recoverFromRiver: (tileId: string) => void
  claimDraft: (tileId: string) => void
  passDraft: () => void
  finishRound: () => void
  openShop: () => void
  buyDecree: (id: TableDecreeId) => void
  nextRound: () => void
  restart: (seed?: number, options?: RunOptions) => void
  /** Explicit reset: remove the saved run before replacing the live engine. */
  clearSavedRun: () => void
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
  storage: RunStorage | null = browserStorage()
) =>
  create<TableLoopStore>((set, get) => {
    let initialStatus: TableLoopStore['saveStatus'] = storage
      ? 'saved'
      : 'unavailable'
    let restored: ReturnType<typeof restoreSavedRun> = null
    try {
      const raw = storage?.getItem(TABLE_SAVE_KEY)
      if (raw) {
        restored = restoreSavedRun(raw)
        if (!restored) initialStatus = 'invalid'
      }
    } catch {
      initialStatus = 'unavailable'
    }
    const engine = restored?.engine ?? new TableLoopEngine()
    let journal = restored?.journal ?? newSavedRun(engine)

    const save = () => {
      try {
        if (!storage) throw new Error('Storage unavailable')
        storage.setItem(TABLE_SAVE_KEY, JSON.stringify(journal))
        set({ saveStatus: 'saved' })
      } catch {
        set({ saveStatus: 'unavailable' })
      }
    }

    const publish = (clearSelection: boolean) => {
      set((current) => ({
        state: current.engine.getState(),
        selectedTileIds: clearSelection ? [] : current.selectedTileIds,
        targetSlot: clearSelection ? null : current.targetSlot,
      }))
    }

    const perform = (action: SavedAction, consumesSelection = false) => {
      const result = applySavedAction(get().engine, action)
      if (result.success) {
        journal = { ...journal, actions: [...journal.actions, action] }
        save()
      }
      publish(result.success && consumesSelection)
      // Some refusals return an error state without mutating the engine.
      set({ state: result.state })
      playTableAction(action, result.success, result.state)
    }

    return {
      engine,
      state: engine.getState(),
      saveStatus: initialStatus,
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

      recoverFromRiver: (tileId) => {
        perform({
          type: 'recoverFromRiver',
          tile: tileIndices(get().engine, [tileId])[0],
        })
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
        get().engine.restart(seed, options)
        journal = newSavedRun(get().engine)
        save()
        publish(true)
      },

      clearSavedRun: () => {
        if (!storage) throw new Error('Storage unavailable')
        const fresh = new TableLoopEngine()
        // Unlike ordinary play, a reset must report a failed deletion. Preserve
        // the current engine/journal if storage denies the operation.
        storage.removeItem(TABLE_SAVE_KEY)
        journal = newSavedRun(fresh)
        set({
          engine: fresh,
          state: fresh.getState(),
          selectedTileIds: [],
          targetSlot: null,
          saveStatus: 'saved',
        })
      },

      takePracticeDecree: () => {
        perform({ type: 'takePracticeDecree' })
      },

      previewPlacement: (slotIndex) =>
        get().engine.previewPlacement(get().selectedTileIds, slotIndex),
    }
  })

export const useTableLoopStore = createTableLoopStore()
