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
import type { RunOptions } from '../tableloop/TableLoopEngine'
import type {
  PlacementScore,
  TableDecreeId,
  TableLoopState,
} from '../tableloop/types'

interface TableLoopStore {
  engine: TableLoopEngine
  state: TableLoopState
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
  takePracticeDecree: () => void

  previewPlacement: (slotIndex: number) => PlacementScore | null
}

/**
 * Apply an engine action and republish its state.
 *
 * The selection is cleared only when the action consumed the selected tiles,
 * so a refused placement leaves the player's tiles where they were.
 */
export const useTableLoopStore = create<TableLoopStore>((set, get) => {
  const engine = new TableLoopEngine()

  const publish = (clearSelection: boolean) => {
    set((current) => ({
      state: current.engine.getState(),
      selectedTileIds: clearSelection ? [] : current.selectedTileIds,
      targetSlot: clearSelection ? null : current.targetSlot,
    }))
  }

  return {
    engine,
    state: engine.getState(),
    selectedTileIds: [],
    targetSlot: null,

    toggleTile: (tileId) =>
      set((current) => ({
        selectedTileIds: current.selectedTileIds.includes(tileId)
          ? current.selectedTileIds.filter((id) => id !== tileId)
          : [...current.selectedTileIds, tileId],
      })),

    clearSelection: () => set({ selectedTileIds: [], targetSlot: null }),

    setTargetSlot: (slot) => set({ targetSlot: slot }),

    chooseStarter: (id) => {
      get().engine.chooseStarter(id)
      publish(true)
    },

    place: (slotIndex) => {
      const result = get().engine.place(get().selectedTileIds, slotIndex)
      publish(result.success)
    },

    revise: (slotIndex) => {
      const result = get().engine.revise(get().selectedTileIds, slotIndex)
      publish(result.success)
    },

    redraw: () => {
      const result = get().engine.redraw(get().selectedTileIds)
      publish(result.success)
    },

    recoverFromRiver: (tileId) => {
      get().engine.recoverFromRiver(tileId)
      publish(false)
    },

    claimDraft: (tileId) => {
      get().engine.claimDraft(tileId)
      publish(false)
    },

    passDraft: () => {
      get().engine.passDraft()
      publish(false)
    },

    finishRound: () => {
      get().engine.finishRound()
      publish(true)
    },

    openShop: () => {
      get().engine.openShop()
      publish(true)
    },

    buyDecree: (id) => {
      get().engine.buyDecree(id)
      publish(false)
    },

    nextRound: () => {
      get().engine.nextRound()
      publish(true)
    },

    restart: (seed, options) => {
      get().engine.restart(seed, options)
      publish(true)
    },

    takePracticeDecree: () => {
      get().engine.takePracticeDecree()
      publish(false)
    },

    previewPlacement: (slotIndex) =>
      get().engine.previewPlacement(get().selectedTileIds, slotIndex),
  }
})
