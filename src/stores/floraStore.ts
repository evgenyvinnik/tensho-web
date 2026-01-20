/**
 * Flora Store - Flowers and Seasons state management
 *
 * Manages the Flowers (persistent, run-wide) and Seasons (temporary, round-scoped) systems.
 * Flowers represent the "Growth" layer and Seasons represent the "Time" layer
 * in the Five-Layer System Model.
 */

import { create } from 'zustand'
import { FlowerType, SeasonType, TileSuit } from '../core/Tile'

/**
 * Flower tile with enhanced properties
 */
export interface FlowerTile {
  id: string
  type: FlowerType
  name: string
  japaneseName: string
  bonusChips: number
  bonusMult: number
  specialEffect?: FlowerEffect
}

/**
 * Special effects that flowers can provide
 */
export interface FlowerEffect {
  type: 'decree_boost' | 'yaku_boost' | 'gold_boost' | 'tile_boost'
  value: number
  description: string
}

/**
 * Season tile with temporal effects
 */
export interface SeasonTile {
  id: string
  type: SeasonType
  name: string
  japaneseName: string
  effect: SeasonEffect
}

/**
 * Effects that seasons provide (these override other effects per hierarchy)
 */
export interface SeasonEffect {
  type:
    | 'score_multiplier'
    | 'suit_boost'
    | 'time_pressure'
    | 'yaku_mutation'
    | 'tile_transformation'
    | 'gold_modifier'
  value: number
  targetSuit?: TileSuit
  description: string
}

export interface FloraState {
  flowers: FlowerTile[] // Run-wide, persistent
  seasons: SeasonTile[] // Round-scoped, temporary

  // Actions
  addFlower: (flower: FlowerTile) => void
  removeFlower: (flowerId: string) => void
  addSeason: (season: SeasonTile) => void
  removeSeason: (seasonId: string) => void
  clearSeasons: () => void // Called at end of round
  getFlowerBonus: () => { chips: number; mult: number }
  getSeasonEffects: () => SeasonEffect[]
  getDecreeBoostPercentage: () => number
  clearFlora: () => void
}

/**
 * Default bonus values per flower
 */
const FLOWER_BASE_CHIPS = 10
const FLOWER_BASE_MULT = 0.1 // +10% per flower for decree effects

export const useFloraStore = create<FloraState>()((set, get) => ({
  // Initial state
  flowers: [],
  seasons: [],

  // Actions
  addFlower: (flower: FlowerTile) => {
    set((state) => ({
      flowers: [...state.flowers, flower],
    }))
  },

  removeFlower: (flowerId: string) => {
    set((state) => ({
      flowers: state.flowers.filter((f) => f.id !== flowerId),
    }))
  },

  addSeason: (season: SeasonTile) => {
    set((state) => ({
      seasons: [...state.seasons, season],
    }))
  },

  removeSeason: (seasonId: string) => {
    set((state) => ({
      seasons: state.seasons.filter((s) => s.id !== seasonId),
    }))
  },

  clearSeasons: () => {
    set({ seasons: [] })
  },

  getFlowerBonus: () => {
    const { flowers } = get()

    const totalChips = flowers.reduce(
      (sum, f) => sum + (f.bonusChips || FLOWER_BASE_CHIPS),
      0
    )

    const totalMult = flowers.reduce(
      (sum, f) => sum + (f.bonusMult || FLOWER_BASE_MULT),
      0
    )

    return { chips: totalChips, mult: totalMult }
  },

  getSeasonEffects: () => {
    const { seasons } = get()
    return seasons.map((s) => s.effect)
  },

  getDecreeBoostPercentage: () => {
    const { flowers } = get()
    // +10% decree effect per flower (from A10 System Interaction Matrix)
    return flowers.length * 10
  },

  clearFlora: () => {
    set({
      flowers: [],
      seasons: [],
    })
  },
}))

/**
 * Selector: Get flowers count by type
 */
export const selectFlowerCounts = (
  state: FloraState
): Map<FlowerType, number> => {
  const counts = new Map<FlowerType, number>()

  for (const flower of state.flowers) {
    counts.set(flower.type, (counts.get(flower.type) ?? 0) + 1)
  }

  return counts
}

/**
 * Selector: Check if all four flowers are collected
 */
export const selectHasAllFlowers = (state: FloraState): boolean => {
  const types = new Set(state.flowers.map((f) => f.type))
  return (
    types.has(FlowerType.Plum) &&
    types.has(FlowerType.Orchid) &&
    types.has(FlowerType.Chrysanthemum) &&
    types.has(FlowerType.Bamboo)
  )
}

/**
 * Selector: Check if all four seasons are active
 */
export const selectHasAllSeasons = (state: FloraState): boolean => {
  const types = new Set(state.seasons.map((s) => s.type))
  return (
    types.has(SeasonType.Spring) &&
    types.has(SeasonType.Summer) &&
    types.has(SeasonType.Autumn) &&
    types.has(SeasonType.Winter)
  )
}

/**
 * Selector: Get active season effects of a specific type
 */
export const selectSeasonEffectsByType = (
  state: FloraState,
  type: SeasonEffect['type']
): SeasonEffect[] => {
  return state.seasons.filter((s) => s.effect.type === type).map((s) => s.effect)
}

/**
 * Helper: Generate a unique flower ID
 */
let flowerIdCounter = 0
export function generateFlowerId(): string {
  return `flower-${++flowerIdCounter}-${Date.now()}`
}

/**
 * Helper: Generate a unique season ID
 */
let seasonIdCounter = 0
export function generateSeasonId(): string {
  return `season-${++seasonIdCounter}-${Date.now()}`
}

/**
 * Helper: Create a flower tile
 */
export function createFlowerTile(
  type: FlowerType,
  bonusChips: number = FLOWER_BASE_CHIPS,
  bonusMult: number = FLOWER_BASE_MULT,
  specialEffect?: FlowerEffect
): FlowerTile {
  const flowerNames: Record<FlowerType, { name: string; japanese: string }> = {
    [FlowerType.Plum]: { name: 'Plum', japanese: '梅' },
    [FlowerType.Orchid]: { name: 'Orchid', japanese: '兰' },
    [FlowerType.Chrysanthemum]: { name: 'Chrysanthemum', japanese: '菊' },
    [FlowerType.Bamboo]: { name: 'Bamboo', japanese: '竹' },
  }

  const { name, japanese } = flowerNames[type]

  return {
    id: generateFlowerId(),
    type,
    name,
    japaneseName: japanese,
    bonusChips,
    bonusMult,
    specialEffect,
  }
}

/**
 * Helper: Create a season tile
 */
export function createSeasonTile(
  type: SeasonType,
  effect: SeasonEffect
): SeasonTile {
  const seasonNames: Record<SeasonType, { name: string; japanese: string }> = {
    [SeasonType.Spring]: { name: 'Spring', japanese: '春' },
    [SeasonType.Summer]: { name: 'Summer', japanese: '夏' },
    [SeasonType.Autumn]: { name: 'Autumn', japanese: '秋' },
    [SeasonType.Winter]: { name: 'Winter', japanese: '冬' },
  }

  const { name, japanese } = seasonNames[type]

  return {
    id: generateSeasonId(),
    type,
    name,
    japaneseName: japanese,
    effect,
  }
}
