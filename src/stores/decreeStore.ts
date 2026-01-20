/**
 * Decree Store - Decree (Joker equivalent) state management
 *
 * Decrees provide persistent scoring modifiers and special effects for the run.
 * They represent the "Law" layer in the Five-Layer System Model.
 */

import { create } from 'zustand'

/**
 * Decree rarity tiers
 */
export type DecreeRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'legendary'
  | 'mythic'

/**
 * Decree edition types (visual and effect modifications)
 */
export type DecreeEdition = 'base' | 'foil' | 'holographic' | 'prismatic' | 'negative'

/**
 * Decree sticker types (from higher stakes)
 */
export type DecreeSticker = 'none' | 'eternal' | 'perishable' | 'rental'

/**
 * Effect types that a decree can have
 */
export type DecreeEffectType =
  | 'additive_chips' // +X chips
  | 'additive_mult' // +X mult
  | 'multiplicative_mult' // xX mult
  | 'gold_gain' // +X gold
  | 'retrigger' // Retrigger tiles
  | 'tile_transform' // Transform tile types
  | 'hand_size' // Modify hand size
  | 'discard_count' // Modify discard count
  | 'conditional' // Conditional effects
  | 'special' // Unique effects

export interface DecreeEffect {
  type: DecreeEffectType
  value: number
  condition?: string // e.g., "if hand contains dragon", "per flower"
}

/**
 * Decree interface representing a single decree
 */
export interface Decree {
  id: string
  name: string
  japaneseName: string // Japanese name (e.g., 皇勅)
  description: string
  rarity: DecreeRarity
  edition: DecreeEdition
  sticker: DecreeSticker
  effects: DecreeEffect[]
  sellValue: number
  isDebuffed: boolean
  roundsRemaining?: number // For perishable stickers
}

export interface DecreeState {
  decrees: Decree[]
  maxSlots: number

  // Actions
  addDecree: (decree: Decree) => boolean
  removeDecree: (decreeId: string) => void
  sellDecree: (decreeId: string) => number
  getActiveDecrees: () => Decree[]
  setDecreeDebuffed: (decreeId: string, debuffed: boolean) => void
  incrementDecreeSlots: (amount: number) => void
  decrementRoundsRemaining: () => void
  reorderDecrees: (fromIndex: number, toIndex: number) => void
  clearDecrees: () => void
}

const DEFAULT_MAX_SLOTS = 5

export const useDecreeStore = create<DecreeState>()((set, get) => ({
  // Initial state
  decrees: [],
  maxSlots: DEFAULT_MAX_SLOTS,

  // Actions
  addDecree: (decree: Decree) => {
    const { decrees, maxSlots } = get()

    // Check for negative edition which adds a slot
    const effectiveMaxSlots =
      maxSlots +
      decrees.filter((d) => d.edition === 'negative').length

    // Check if the new decree has negative edition
    const newEffectiveMaxSlots =
      effectiveMaxSlots + (decree.edition === 'negative' ? 1 : 0)

    if (decrees.length >= newEffectiveMaxSlots) {
      return false // No room for new decree
    }

    set({
      decrees: [...decrees, decree],
    })

    return true
  },

  removeDecree: (decreeId: string) => {
    set((state) => ({
      decrees: state.decrees.filter((d) => d.id !== decreeId),
    }))
  },

  sellDecree: (decreeId: string) => {
    const { decrees } = get()
    const decree = decrees.find((d) => d.id === decreeId)

    if (!decree) {
      return 0
    }

    // Cannot sell eternal decrees
    if (decree.sticker === 'eternal') {
      return 0
    }

    set({
      decrees: decrees.filter((d) => d.id !== decreeId),
    })

    return decree.sellValue
  },

  getActiveDecrees: () => {
    const { decrees } = get()
    return decrees.filter((d) => !d.isDebuffed)
  },

  setDecreeDebuffed: (decreeId: string, debuffed: boolean) => {
    set((state) => ({
      decrees: state.decrees.map((d) =>
        d.id === decreeId ? { ...d, isDebuffed: debuffed } : d
      ),
    }))
  },

  incrementDecreeSlots: (amount: number) => {
    set((state) => ({
      maxSlots: state.maxSlots + amount,
    }))
  },

  decrementRoundsRemaining: () => {
    set((state) => ({
      decrees: state.decrees.map((d) => {
        if (d.sticker === 'perishable' && d.roundsRemaining !== undefined) {
          const newRounds = d.roundsRemaining - 1
          return {
            ...d,
            roundsRemaining: newRounds,
            isDebuffed: newRounds <= 0 ? true : d.isDebuffed,
          }
        }
        return d
      }),
    }))
  },

  reorderDecrees: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newDecrees = [...state.decrees]
      const [removed] = newDecrees.splice(fromIndex, 1)

      if (removed) {
        newDecrees.splice(toIndex, 0, removed)
      }

      return { decrees: newDecrees }
    })
  },

  clearDecrees: () => {
    set({
      decrees: [],
      maxSlots: DEFAULT_MAX_SLOTS,
    })
  },
}))

/**
 * Selector: Calculate effective max slots (including negative editions)
 */
export const selectEffectiveMaxSlots = (state: DecreeState): number => {
  const negativeCount = state.decrees.filter(
    (d) => d.edition === 'negative'
  ).length
  return state.maxSlots + negativeCount
}

/**
 * Selector: Get available slots
 */
export const selectAvailableSlots = (state: DecreeState): number => {
  return selectEffectiveMaxSlots(state) - state.decrees.length
}

/**
 * Selector: Get total sell value of all decrees
 */
export const selectTotalSellValue = (state: DecreeState): number => {
  return state.decrees
    .filter((d) => d.sticker !== 'eternal')
    .reduce((sum, d) => sum + d.sellValue, 0)
}

/**
 * Helper: Generate a unique decree ID
 */
let decreeIdCounter = 0
export function generateDecreeId(): string {
  return `decree-${++decreeIdCounter}-${Date.now()}`
}

/**
 * Helper: Create a basic decree
 */
export function createDecree(
  name: string,
  japaneseName: string,
  description: string,
  rarity: DecreeRarity,
  effects: DecreeEffect[],
  sellValue: number = 1
): Decree {
  return {
    id: generateDecreeId(),
    name,
    japaneseName,
    description,
    rarity,
    edition: 'base',
    sticker: 'none',
    effects,
    sellValue,
    isDebuffed: false,
  }
}
