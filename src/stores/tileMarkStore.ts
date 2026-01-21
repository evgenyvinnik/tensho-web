/**
 * Tile Mark Store - Tile Modifier State Management
 *
 * Zustand store for tracking tile marks (enhancements, seals, editions)
 * attached to specific tile instances. Marks are the Tensho equivalent
 * of Balatro's card modifiers.
 *
 * Key mechanics:
 * - Marks attach to specific tile instances (by ID)
 * - Marks can decay on discard or reshuffle
 * - Marked tiles contribute extra scoring bonuses
 * - Some marks can change yaku classification for checks
 */

import { create } from 'zustand'
import {
  TileModifiers,
  EnhancementType,
  SealType,
  EditionType,
  DEFAULT_MODIFIERS,
  hasModifiers,
  calculateModifierChips,
  calculateModifierMult,
  calculateModifierMultiplier,
  getRetriggers,
  ENHANCEMENT_DEFINITIONS,
  SEAL_DEFINITIONS,
  EDITION_DEFINITIONS,
} from '../core/TileModifier'

// =============================================================================
// MARK DECAY CONFIGURATION
// =============================================================================

/**
 * Decay behavior for different mark types
 */
export interface MarkDecayConfig {
  /** Whether marks decay on discard */
  decaysOnDiscard: boolean
  /** Whether marks decay on reshuffle (round end) */
  decaysOnReshuffle: boolean
  /** Probability of decay (0-1) when triggered */
  decayChance: number
  /** Number of discards before decay (if using count-based) */
  discardsTillDecay?: number
}

/**
 * Default decay configurations by enhancement type
 */
export const ENHANCEMENT_DECAY_CONFIG: Record<EnhancementType, MarkDecayConfig> = {
  [EnhancementType.None]: { decaysOnDiscard: false, decaysOnReshuffle: false, decayChance: 0 },
  [EnhancementType.Bonus]: { decaysOnDiscard: false, decaysOnReshuffle: false, decayChance: 0 },
  [EnhancementType.Mult]: { decaysOnDiscard: false, decaysOnReshuffle: false, decayChance: 0 },
  [EnhancementType.Wild]: { decaysOnDiscard: true, decaysOnReshuffle: false, decayChance: 0.25 },
  [EnhancementType.Glass]: { decaysOnDiscard: false, decaysOnReshuffle: false, decayChance: 0 }, // Glass shatters, not decays
  [EnhancementType.Steel]: { decaysOnDiscard: false, decaysOnReshuffle: false, decayChance: 0 },
  [EnhancementType.Stone]: { decaysOnDiscard: false, decaysOnReshuffle: false, decayChance: 0 },
  [EnhancementType.Gold]: { decaysOnDiscard: true, decaysOnReshuffle: false, decayChance: 0.5 },
  [EnhancementType.Lucky]: { decaysOnDiscard: false, decaysOnReshuffle: true, decayChance: 0.15 },
}

/**
 * Decay configurations for seals
 */
export const SEAL_DECAY_CONFIG: Record<SealType, MarkDecayConfig> = {
  [SealType.None]: { decaysOnDiscard: false, decaysOnReshuffle: false, decayChance: 0 },
  [SealType.Gold]: { decaysOnDiscard: false, decaysOnReshuffle: false, decayChance: 0 },
  [SealType.Red]: { decaysOnDiscard: false, decaysOnReshuffle: false, decayChance: 0 },
  [SealType.Blue]: { decaysOnDiscard: true, decaysOnReshuffle: false, decayChance: 0.33 },
  [SealType.Purple]: { decaysOnDiscard: false, decaysOnReshuffle: false, decayChance: 0 }, // Purple creates item on discard
}

// =============================================================================
// STORE TYPES
// =============================================================================

/**
 * Tracking data for an individual tile's marks
 */
export interface TileMarkData {
  tileId: string
  modifiers: TileModifiers
  /** Number of times this tile has been discarded with marks */
  discardCount: number
  /** Round when marks were applied */
  appliedRound: number
  /** Whether this tile is shattered (Glass mark effect) */
  isShattered: boolean
  /** Track decay chances that were rolled */
  decayHistory: Array<{
    trigger: 'discard' | 'reshuffle'
    round: number
    decayed: boolean
  }>
}

/**
 * Pending consumables created by seals
 */
export interface PendingConsumable {
  type: 'orb' | 'seal'
  sourceTileId: string
  createdRound: number
}

/**
 * Store state interface
 */
export interface TileMarkState {
  // Mark data by tile ID
  marks: Record<string, TileMarkData>

  // Shattered tile IDs (removed from play)
  shatteredTileIds: string[]

  // Pending consumables from seal effects
  pendingConsumables: PendingConsumable[]

  // Current round for tracking
  currentRound: number

  // Stats
  stats: {
    totalMarksApplied: number
    totalMarksDecayed: number
    totalTilesShattered: number
    totalConsumablesCreated: number
  }

  // Actions - Mark Application
  applyEnhancement: (tileId: string, enhancement: EnhancementType) => void
  applySeal: (tileId: string, seal: SealType) => void
  applyEdition: (tileId: string, edition: EditionType) => void
  applyModifiers: (tileId: string, modifiers: Partial<TileModifiers>) => void

  // Actions - Mark Removal
  removeEnhancement: (tileId: string) => void
  removeSeal: (tileId: string) => void
  removeEdition: (tileId: string) => void
  clearMarks: (tileId: string) => void
  clearAllMarks: () => void

  // Actions - Mark Events
  onTileDiscarded: (tileId: string) => { decayed: boolean; consumableCreated: PendingConsumable | null }
  onRoundEnd: () => { decayedTileIds: string[] }
  onTileShattered: (tileId: string) => void

  // Actions - Consumables
  consumePendingConsumables: () => PendingConsumable[]

  // Actions - Round Management
  setCurrentRound: (round: number) => void
  advanceRound: () => void

  // Actions - State Reset
  reset: () => void

  // Selectors
  getModifiers: (tileId: string) => TileModifiers
  hasMarks: (tileId: string) => boolean
  isShattered: (tileId: string) => boolean
  getMarkData: (tileId: string) => TileMarkData | undefined
  getTilesWithEnhancement: (enhancement: EnhancementType) => string[]
  getTilesWithSeal: (seal: SealType) => string[]
  getTilesWithEdition: (edition: EditionType) => string[]
  getMarkedTileIds: () => string[]
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  marks: {} as Record<string, TileMarkData>,
  shatteredTileIds: [] as string[],
  pendingConsumables: [] as PendingConsumable[],
  currentRound: 1,
  stats: {
    totalMarksApplied: 0,
    totalMarksDecayed: 0,
    totalTilesShattered: 0,
    totalConsumablesCreated: 0,
  },
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useTileMarkStore = create<TileMarkState>()((set, get) => ({
  ...initialState,

  // ===========================================================================
  // MARK APPLICATION
  // ===========================================================================

  applyEnhancement: (tileId: string, enhancement: EnhancementType) => {
    set((state) => {
      const existing = state.marks[tileId]
      const currentMods = existing?.modifiers ?? { ...DEFAULT_MODIFIERS }

      const newMarkData: TileMarkData = {
        tileId,
        modifiers: { ...currentMods, enhancement },
        discardCount: existing?.discardCount ?? 0,
        appliedRound: state.currentRound,
        isShattered: existing?.isShattered ?? false,
        decayHistory: existing?.decayHistory ?? [],
      }

      return {
        marks: { ...state.marks, [tileId]: newMarkData },
        stats: {
          ...state.stats,
          totalMarksApplied: state.stats.totalMarksApplied + 1,
        },
      }
    })
  },

  applySeal: (tileId: string, seal: SealType) => {
    set((state) => {
      const existing = state.marks[tileId]
      const currentMods = existing?.modifiers ?? { ...DEFAULT_MODIFIERS }

      const newMarkData: TileMarkData = {
        tileId,
        modifiers: { ...currentMods, seal },
        discardCount: existing?.discardCount ?? 0,
        appliedRound: state.currentRound,
        isShattered: existing?.isShattered ?? false,
        decayHistory: existing?.decayHistory ?? [],
      }

      return {
        marks: { ...state.marks, [tileId]: newMarkData },
        stats: {
          ...state.stats,
          totalMarksApplied: state.stats.totalMarksApplied + 1,
        },
      }
    })
  },

  applyEdition: (tileId: string, edition: EditionType) => {
    set((state) => {
      const existing = state.marks[tileId]
      const currentMods = existing?.modifiers ?? { ...DEFAULT_MODIFIERS }

      const newMarkData: TileMarkData = {
        tileId,
        modifiers: { ...currentMods, edition },
        discardCount: existing?.discardCount ?? 0,
        appliedRound: state.currentRound,
        isShattered: existing?.isShattered ?? false,
        decayHistory: existing?.decayHistory ?? [],
      }

      return {
        marks: { ...state.marks, [tileId]: newMarkData },
        stats: {
          ...state.stats,
          totalMarksApplied: state.stats.totalMarksApplied + 1,
        },
      }
    })
  },

  applyModifiers: (tileId: string, modifiers: Partial<TileModifiers>) => {
    set((state) => {
      const existing = state.marks[tileId]
      const currentMods = existing?.modifiers ?? { ...DEFAULT_MODIFIERS }

      const newMarkData: TileMarkData = {
        tileId,
        modifiers: { ...currentMods, ...modifiers },
        discardCount: existing?.discardCount ?? 0,
        appliedRound: state.currentRound,
        isShattered: existing?.isShattered ?? false,
        decayHistory: existing?.decayHistory ?? [],
      }

      return {
        marks: { ...state.marks, [tileId]: newMarkData },
        stats: {
          ...state.stats,
          totalMarksApplied: state.stats.totalMarksApplied + 1,
        },
      }
    })
  },

  // ===========================================================================
  // MARK REMOVAL
  // ===========================================================================

  removeEnhancement: (tileId: string) => {
    set((state) => {
      const existing = state.marks[tileId]
      if (!existing) return state

      const newMods: TileModifiers = {
        ...existing.modifiers,
        enhancement: EnhancementType.None,
      }

      // If all modifiers are default, remove entry
      if (!hasModifiers(newMods)) {
        const { [tileId]: _, ...rest } = state.marks
        return { marks: rest }
      }

      return {
        marks: {
          ...state.marks,
          [tileId]: { ...existing, modifiers: newMods },
        },
      }
    })
  },

  removeSeal: (tileId: string) => {
    set((state) => {
      const existing = state.marks[tileId]
      if (!existing) return state

      const newMods: TileModifiers = {
        ...existing.modifiers,
        seal: SealType.None,
      }

      if (!hasModifiers(newMods)) {
        const { [tileId]: _, ...rest } = state.marks
        return { marks: rest }
      }

      return {
        marks: {
          ...state.marks,
          [tileId]: { ...existing, modifiers: newMods },
        },
      }
    })
  },

  removeEdition: (tileId: string) => {
    set((state) => {
      const existing = state.marks[tileId]
      if (!existing) return state

      const newMods: TileModifiers = {
        ...existing.modifiers,
        edition: EditionType.Base,
      }

      if (!hasModifiers(newMods)) {
        const { [tileId]: _, ...rest } = state.marks
        return { marks: rest }
      }

      return {
        marks: {
          ...state.marks,
          [tileId]: { ...existing, modifiers: newMods },
        },
      }
    })
  },

  clearMarks: (tileId: string) => {
    set((state) => {
      const { [tileId]: _, ...rest } = state.marks
      return { marks: rest }
    })
  },

  clearAllMarks: () => {
    set({ marks: {} })
  },

  // ===========================================================================
  // MARK EVENTS
  // ===========================================================================

  onTileDiscarded: (tileId: string) => {
    const state = get()
    const markData = state.marks[tileId]

    if (!markData) {
      return { decayed: false, consumableCreated: null }
    }

    const { modifiers, discardCount: _discardCount } = markData
    let decayed = false
    let consumableCreated: PendingConsumable | null = null

    // Check for Purple Seal - creates Fate Seal on discard
    if (modifiers.seal === SealType.Purple) {
      consumableCreated = {
        type: 'seal',
        sourceTileId: tileId,
        createdRound: state.currentRound,
      }
    }

    // Check enhancement decay
    const enhancementConfig = ENHANCEMENT_DECAY_CONFIG[modifiers.enhancement]
    if (enhancementConfig.decaysOnDiscard && Math.random() < enhancementConfig.decayChance) {
      decayed = true
      get().removeEnhancement(tileId)
    }

    // Check seal decay
    const sealConfig = SEAL_DECAY_CONFIG[modifiers.seal]
    if (sealConfig.decaysOnDiscard && Math.random() < sealConfig.decayChance) {
      decayed = true
      get().removeSeal(tileId)
    }

    // Update discard count and decay history
    set((prevState) => {
      const currentData = prevState.marks[tileId]
      if (!currentData) return prevState

      return {
        marks: {
          ...prevState.marks,
          [tileId]: {
            ...currentData,
            discardCount: currentData.discardCount + 1,
            decayHistory: [
              ...currentData.decayHistory,
              { trigger: 'discard', round: prevState.currentRound, decayed },
            ],
          },
        },
        pendingConsumables: consumableCreated
          ? [...prevState.pendingConsumables, consumableCreated]
          : prevState.pendingConsumables,
        stats: {
          ...prevState.stats,
          totalMarksDecayed: decayed
            ? prevState.stats.totalMarksDecayed + 1
            : prevState.stats.totalMarksDecayed,
          totalConsumablesCreated: consumableCreated
            ? prevState.stats.totalConsumablesCreated + 1
            : prevState.stats.totalConsumablesCreated,
        },
      }
    })

    return { decayed, consumableCreated }
  },

  onRoundEnd: () => {
    const state = get()
    const decayedTileIds: string[] = []

    // Process all marks for reshuffle decay
    for (const [tileId, markData] of Object.entries(state.marks)) {
      const { modifiers } = markData

      // Check enhancement decay on reshuffle
      const enhancementConfig = ENHANCEMENT_DECAY_CONFIG[modifiers.enhancement]
      if (enhancementConfig.decaysOnReshuffle && Math.random() < enhancementConfig.decayChance) {
        decayedTileIds.push(tileId)
        get().removeEnhancement(tileId)
      }
    }

    // Update stats
    if (decayedTileIds.length > 0) {
      set((prevState) => ({
        stats: {
          ...prevState.stats,
          totalMarksDecayed: prevState.stats.totalMarksDecayed + decayedTileIds.length,
        },
      }))
    }

    return { decayedTileIds }
  },

  onTileShattered: (tileId: string) => {
    set((state) => {
      const existing = state.marks[tileId]

      return {
        marks: existing
          ? {
              ...state.marks,
              [tileId]: { ...existing, isShattered: true },
            }
          : state.marks,
        shatteredTileIds: [...state.shatteredTileIds, tileId],
        stats: {
          ...state.stats,
          totalTilesShattered: state.stats.totalTilesShattered + 1,
        },
      }
    })
  },

  // ===========================================================================
  // CONSUMABLES
  // ===========================================================================

  consumePendingConsumables: () => {
    const { pendingConsumables } = get()
    set({ pendingConsumables: [] })
    return pendingConsumables
  },

  // ===========================================================================
  // ROUND MANAGEMENT
  // ===========================================================================

  setCurrentRound: (round: number) => {
    set({ currentRound: round })
  },

  advanceRound: () => {
    set((state) => ({ currentRound: state.currentRound + 1 }))
  },

  // ===========================================================================
  // RESET
  // ===========================================================================

  reset: () => {
    set(initialState)
  },

  // ===========================================================================
  // SELECTORS
  // ===========================================================================

  getModifiers: (tileId: string) => {
    const markData = get().marks[tileId]
    return markData?.modifiers ?? { ...DEFAULT_MODIFIERS }
  },

  hasMarks: (tileId: string) => {
    const markData = get().marks[tileId]
    return markData ? hasModifiers(markData.modifiers) : false
  },

  isShattered: (tileId: string) => {
    return get().shatteredTileIds.includes(tileId)
  },

  getMarkData: (tileId: string) => {
    return get().marks[tileId]
  },

  getTilesWithEnhancement: (enhancement: EnhancementType) => {
    const { marks } = get()
    return Object.entries(marks)
      .filter(([_, data]) => data.modifiers.enhancement === enhancement)
      .map(([tileId]) => tileId)
  },

  getTilesWithSeal: (seal: SealType) => {
    const { marks } = get()
    return Object.entries(marks)
      .filter(([_, data]) => data.modifiers.seal === seal)
      .map(([tileId]) => tileId)
  },

  getTilesWithEdition: (edition: EditionType) => {
    const { marks } = get()
    return Object.entries(marks)
      .filter(([_, data]) => data.modifiers.edition === edition)
      .map(([tileId]) => tileId)
  },

  getMarkedTileIds: () => {
    return Object.keys(get().marks)
  },
}))

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Selector: Get total chip bonus from all marked tiles
 */
export const selectTotalModifierChips = (state: TileMarkState): number => {
  let total = 0
  for (const markData of Object.values(state.marks)) {
    if (!markData.isShattered) {
      total += calculateModifierChips(markData.modifiers)
    }
  }
  return total
}

/**
 * Selector: Get total mult bonus from all marked tiles
 */
export const selectTotalModifierMult = (state: TileMarkState): number => {
  let total = 0
  for (const markData of Object.values(state.marks)) {
    if (!markData.isShattered) {
      total += calculateModifierMult(markData.modifiers)
    }
  }
  return total
}

/**
 * Selector: Get total multiplicative mult from all marked tiles
 */
export const selectTotalModifierMultiplier = (state: TileMarkState): number => {
  let total = 1
  for (const markData of Object.values(state.marks)) {
    if (!markData.isShattered) {
      total *= calculateModifierMultiplier(markData.modifiers)
    }
  }
  return total
}

/**
 * Selector: Get total retriggers from all marked tiles
 */
export const selectTotalRetriggers = (state: TileMarkState): number => {
  let total = 0
  for (const markData of Object.values(state.marks)) {
    if (!markData.isShattered) {
      total += getRetriggers(markData.modifiers)
    }
  }
  return total
}

/**
 * Selector: Count tiles with any mark
 */
export const selectMarkedTileCount = (state: TileMarkState): number => {
  return Object.keys(state.marks).length
}

/**
 * Selector: Count tiles with specific enhancement
 */
export const selectEnhancementCount = (
  state: TileMarkState,
  enhancement: EnhancementType
): number => {
  return Object.values(state.marks).filter(
    (d) => d.modifiers.enhancement === enhancement && !d.isShattered
  ).length
}

/**
 * Selector: Count tiles with specific seal
 */
export const selectSealCount = (state: TileMarkState, seal: SealType): number => {
  return Object.values(state.marks).filter(
    (d) => d.modifiers.seal === seal && !d.isShattered
  ).length
}

/**
 * Selector: Count Negative edition tiles (for decree slot bonus)
 */
export const selectNegativeEditionCount = (state: TileMarkState): number => {
  return Object.values(state.marks).filter(
    (d) => d.modifiers.edition === EditionType.Negative && !d.isShattered
  ).length
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get modifier display info for a tile
 */
export function getModifierDisplayInfo(tileId: string): {
  enhancement: { name: string; description: string } | null
  seal: { name: string; description: string } | null
  edition: { name: string; description: string } | null
} {
  const { getModifiers } = useTileMarkStore.getState()
  const modifiers = getModifiers(tileId)

  return {
    enhancement:
      modifiers.enhancement !== EnhancementType.None
        ? {
            name: ENHANCEMENT_DEFINITIONS[modifiers.enhancement].name,
            description: ENHANCEMENT_DEFINITIONS[modifiers.enhancement].description,
          }
        : null,
    seal:
      modifiers.seal !== SealType.None
        ? {
            name: SEAL_DEFINITIONS[modifiers.seal].name,
            description: SEAL_DEFINITIONS[modifiers.seal].description,
          }
        : null,
    edition:
      modifiers.edition !== EditionType.Base
        ? {
            name: EDITION_DEFINITIONS[modifiers.edition].name,
            description: EDITION_DEFINITIONS[modifiers.edition].description,
          }
        : null,
  }
}

/**
 * Format modifiers as a single string
 */
export function formatTileMarks(tileId: string): string {
  const info = getModifierDisplayInfo(tileId)
  const parts: string[] = []

  if (info.edition) parts.push(info.edition.name)
  if (info.enhancement) parts.push(info.enhancement.name)
  if (info.seal) parts.push(info.seal.name)

  return parts.length > 0 ? parts.join(' ') : 'Base'
}
