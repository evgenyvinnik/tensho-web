/**
 * Wall Store - Wall and dead pool state management
 *
 * Manages the tile wall, dead wall, discards, and drawing mechanics.
 */

import { create } from 'zustand'
import { Tile, createStandardTileSet, createBonusTileSet } from '../core/Tile'

/**
 * Simple seeded random number generator (mulberry32)
 */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fisher-Yates shuffle with optional seed
 */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array]
  const random = seed !== undefined ? mulberry32(seed) : Math.random

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

export interface WallState {
  wall: Tile[]
  deadWall: Tile[]
  discards: Tile[]
  drawIndex: number

  // Actions
  initializeWall: (seed?: number) => void
  drawTile: () => Tile | null
  drawFromDeadWall: () => Tile | null
  addToDiscards: (tile: Tile) => void
  getRemainingTiles: () => number
  getDeadWallRemaining: () => number
  peekNextTile: () => Tile | null
  clearWall: () => void
}

// Dead wall size (dora indicators + kan replacement tiles)
const DEAD_WALL_SIZE = 14

export const useWallStore = create<WallState>()((set, get) => ({
  // Initial state
  wall: [],
  deadWall: [],
  discards: [],
  drawIndex: 0,

  // Actions
  initializeWall: (seed?: number) => {
    // Create full tile set (136 standard + 8 bonus = 144 tiles)
    const standardTiles = createStandardTileSet()
    const bonusTiles = createBonusTileSet()
    const allTiles = [...standardTiles, ...bonusTiles]

    // Shuffle with optional seed for reproducibility
    const shuffled = shuffleArray(allTiles, seed)

    // Separate dead wall (last 14 tiles after shuffle)
    const deadWall = shuffled.slice(-DEAD_WALL_SIZE)
    const wall = shuffled.slice(0, -DEAD_WALL_SIZE)

    set({
      wall,
      deadWall,
      discards: [],
      drawIndex: 0,
    })
  },

  drawTile: () => {
    const { wall, drawIndex } = get()

    if (drawIndex >= wall.length) {
      return null // Wall exhausted
    }

    const tile = wall[drawIndex]

    set({ drawIndex: drawIndex + 1 })

    return tile
  },

  drawFromDeadWall: () => {
    const { deadWall, wall, drawIndex } = get()

    if (deadWall.length === 0) {
      return null
    }

    // Draw from dead wall (replacement draw for kan or bonus tiles)
    const tile = deadWall[0]
    const newDeadWall = deadWall.slice(1)

    // Replenish dead wall from the end of the main wall if available
    const remainingWall = wall.length - drawIndex
    if (remainingWall > 0) {
      const lastTileIndex = wall.length - 1
      const replenishTile = wall[lastTileIndex]
      newDeadWall.push(replenishTile)

      set({
        deadWall: newDeadWall,
        wall: wall.slice(0, -1),
      })
    } else {
      set({ deadWall: newDeadWall })
    }

    return tile
  },

  addToDiscards: (tile: Tile) => {
    set((state) => ({
      discards: [...state.discards, tile],
    }))
  },

  getRemainingTiles: () => {
    const { wall, drawIndex } = get()
    return wall.length - drawIndex
  },

  getDeadWallRemaining: () => {
    const { deadWall } = get()
    return deadWall.length
  },

  peekNextTile: () => {
    const { wall, drawIndex } = get()

    if (drawIndex >= wall.length) {
      return null
    }

    return wall[drawIndex]
  },

  clearWall: () => {
    set({
      wall: [],
      deadWall: [],
      discards: [],
      drawIndex: 0,
    })
  },
}))

/**
 * Selector: Get all visible discards
 */
export const selectVisibleDiscards = (state: WallState): Tile[] => {
  return state.discards
}

/**
 * Selector: Check if wall is exhausted
 */
export const selectIsWallExhausted = (state: WallState): boolean => {
  return state.drawIndex >= state.wall.length
}

/**
 * Selector: Get drawn tiles (tiles already drawn from wall)
 */
export const selectDrawnTiles = (state: WallState): Tile[] => {
  return state.wall.slice(0, state.drawIndex)
}
