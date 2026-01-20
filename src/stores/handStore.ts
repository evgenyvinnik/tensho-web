/**
 * Hand Store - Current hand state management
 *
 * Manages the player's current hand of tiles, melds, and selection state.
 */

import { create } from 'zustand'
import { Tile } from '../core/Tile'
import { Meld } from '../core/Meld'

export interface HandState {
  tiles: Tile[]
  melds: Meld[]
  selectedTileIds: string[]

  // Actions
  setHand: (tiles: Tile[]) => void
  addTile: (tile: Tile) => void
  removeTile: (tileId: string) => void
  selectTile: (tileId: string) => void
  deselectTile: (tileId: string) => void
  toggleTileSelection: (tileId: string) => void
  clearSelection: () => void
  addMeld: (meld: Meld) => void
  removeMeld: (meldIndex: number) => void
  sortHand: () => void
  clearHand: () => void
}

export const useHandStore = create<HandState>()((set, get) => ({
  // Initial state
  tiles: [],
  melds: [],
  selectedTileIds: [],

  // Actions
  setHand: (tiles: Tile[]) => {
    set({
      tiles: [...tiles].sort(Tile.compare),
      melds: [],
      selectedTileIds: [],
    })
  },

  addTile: (tile: Tile) => {
    set((state) => ({
      tiles: [...state.tiles, tile].sort(Tile.compare),
    }))
  },

  removeTile: (tileId: string) => {
    set((state) => ({
      tiles: state.tiles.filter((t) => t.id !== tileId),
      selectedTileIds: state.selectedTileIds.filter((id) => id !== tileId),
    }))
  },

  selectTile: (tileId: string) => {
    const { tiles, selectedTileIds } = get()

    // Only select if tile exists and not already selected
    const tileExists = tiles.some((t) => t.id === tileId)
    if (tileExists && !selectedTileIds.includes(tileId)) {
      set({
        selectedTileIds: [...selectedTileIds, tileId],
      })
    }
  },

  deselectTile: (tileId: string) => {
    set((state) => ({
      selectedTileIds: state.selectedTileIds.filter((id) => id !== tileId),
    }))
  },

  toggleTileSelection: (tileId: string) => {
    const { selectedTileIds } = get()

    if (selectedTileIds.includes(tileId)) {
      set({
        selectedTileIds: selectedTileIds.filter((id) => id !== tileId),
      })
    } else {
      set({
        selectedTileIds: [...selectedTileIds, tileId],
      })
    }
  },

  clearSelection: () => {
    set({ selectedTileIds: [] })
  },

  addMeld: (meld: Meld) => {
    set((state) => {
      // Remove tiles used in the meld from hand
      const meldTileIds = new Set(meld.tiles.map((t) => t.id))
      const remainingTiles = state.tiles.filter((t) => !meldTileIds.has(t.id))

      return {
        tiles: remainingTiles,
        melds: [...state.melds, meld],
        selectedTileIds: state.selectedTileIds.filter(
          (id) => !meldTileIds.has(id)
        ),
      }
    })
  },

  removeMeld: (meldIndex: number) => {
    set((state) => {
      if (meldIndex < 0 || meldIndex >= state.melds.length) {
        return state
      }

      const meld = state.melds[meldIndex]
      const newMelds = state.melds.filter((_, i) => i !== meldIndex)

      // Return meld tiles back to hand
      return {
        tiles: [...state.tiles, ...meld.tiles].sort(Tile.compare),
        melds: newMelds,
      }
    })
  },

  sortHand: () => {
    set((state) => ({
      tiles: [...state.tiles].sort(Tile.compare),
    }))
  },

  clearHand: () => {
    set({
      tiles: [],
      melds: [],
      selectedTileIds: [],
    })
  },
}))

/**
 * Selector: Get selected tiles
 */
export const selectSelectedTiles = (state: HandState): Tile[] => {
  const selectedSet = new Set(state.selectedTileIds)
  return state.tiles.filter((t) => selectedSet.has(t.id))
}

/**
 * Selector: Get unselected tiles
 */
export const selectUnselectedTiles = (state: HandState): Tile[] => {
  const selectedSet = new Set(state.selectedTileIds)
  return state.tiles.filter((t) => !selectedSet.has(t.id))
}

/**
 * Selector: Check if a tile is selected
 */
export const selectIsTileSelected = (
  state: HandState,
  tileId: string
): boolean => {
  return state.selectedTileIds.includes(tileId)
}
