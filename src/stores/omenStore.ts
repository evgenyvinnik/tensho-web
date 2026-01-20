/**
 * Omen Store - Omen Tag state management
 *
 * Manages the Omen Tags system for skip rewards.
 * Omen Tags are one-time destiny modifiers that trigger once, then vanish.
 * They are awarded when skipping Small or Large rounds.
 */

import { create } from 'zustand'
import type { SeasonVariant } from '../systems/types'
import type {
  OmenDefinition,
  OmenCategory,
  OmenRarity,
  OmenTrigger,
  OmenEffect,
  OmenTradeoff,
} from '../config/omenDefinitions'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Status of an omen tag
 */
export type OmenStatus =
  | 'active' // Ready to trigger
  | 'triggered' // Has triggered but effects may still apply (for passive/scaling)
  | 'consumed' // Fully consumed and removed

/**
 * Active omen tag instance
 */
export interface ActiveOmen {
  id: string
  definition: OmenDefinition
  status: OmenStatus
  acquiredRound: number
  acquiredAct: number
  triggeredRound?: number
  /** For scaling effects: number of rounds skipped when acquired */
  skippedRoundsAtAcquisition: number
  /** For temporary effects: rounds remaining */
  roundsRemaining?: number
  /** For scaling effects: current accumulated value */
  currentScalingValue?: number
}

/**
 * Omen history entry for tracking consumed omens
 */
export interface OmenHistoryEntry {
  omenId: string
  definitionId: string
  omenName: string
  acquiredRound: number
  acquiredAct: number
  triggeredRound?: number
  consumedRound: number
  effect: OmenEffect
}

/**
 * Locked season state from omen trade-offs
 */
export interface LockedSeason {
  seasonType: SeasonVariant
  sourceOmenId: string
  isApplied: boolean
}

/**
 * Omen store state
 */
export interface OmenState {
  /** Currently active omen tags */
  activeOmens: ActiveOmen[]
  /** History of consumed omens */
  omenHistory: OmenHistoryEntry[]
  /** Total rounds skipped this run */
  totalRoundsSkipped: number
  /** Locked season from omen trade-offs */
  lockedSeason: LockedSeason | null
  /** Rounds without interest from trade-offs */
  noInterestRounds: number
  /** Current round number for tracking */
  currentRound: number
  /** Current act number for tracking */
  currentAct: number

  // Actions
  addOmen: (omen: OmenDefinition) => ActiveOmen | null
  removeOmen: (omenId: string) => boolean
  triggerOmen: (omenId: string) => ActiveOmen | null
  consumeOmen: (omenId: string) => OmenHistoryEntry | null
  getActiveOmensByTrigger: (trigger: OmenTrigger) => ActiveOmen[]
  getActiveOmensByCategory: (category: OmenCategory) => ActiveOmen[]
  incrementSkippedRounds: () => void
  setRoundInfo: (round: number, act: number) => void
  applyLockedSeason: () => SeasonVariant | null
  decrementNoInterestRounds: () => void
  updateScalingOmens: () => void
  hasActiveOmenWithEffect: (effectType: string) => boolean
  getOmenHistoryForRun: () => OmenHistoryEntry[]
  getTotalSkippedRounds: () => number
  clearOmens: () => void
  clearForNewRun: () => void

  // Selectors
  getPassiveMultBonus: () => number
  getNextShopEffects: () => ActiveOmen[]
  getNextRoundEffects: () => ActiveOmen[]
  getNextHandEffects: () => ActiveOmen[]
}

// =============================================================================
// STORE
// =============================================================================

export const useOmenStore = create<OmenState>()((set, get) => ({
  // Initial state
  activeOmens: [],
  omenHistory: [],
  totalRoundsSkipped: 0,
  lockedSeason: null,
  noInterestRounds: 0,
  currentRound: 0,
  currentAct: 1,

  // Actions
  addOmen: (omen: OmenDefinition) => {
    const state = get()
    const newOmen: ActiveOmen = {
      id: `omen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      definition: omen,
      status: 'active',
      acquiredRound: state.currentRound,
      acquiredAct: state.currentAct,
      skippedRoundsAtAcquisition: state.totalRoundsSkipped,
      currentScalingValue: omen.effect.scalesWithSkips
        ? (omen.effect.value as number) * state.totalRoundsSkipped
        : undefined,
    }

    // Handle trade-offs
    if (omen.tradeoff.type === 'lock_season' && omen.tradeoff.value) {
      set({
        lockedSeason: {
          seasonType: omen.tradeoff.value as SeasonVariant,
          sourceOmenId: newOmen.id,
          isApplied: false,
        },
      })
    }

    if (omen.tradeoff.type === 'no_interest') {
      set((s) => ({
        noInterestRounds: s.noInterestRounds + (omen.tradeoff.value as number || 1),
      }))
    }

    // Handle immediate trigger omens
    if (omen.trigger === 'OnAcquire') {
      newOmen.status = 'triggered'
      newOmen.triggeredRound = state.currentRound

      // For scaling effects, keep them active
      if (!omen.effect.scalesWithSkips && omen.effect.type !== 'mult_per_skip') {
        // Immediate effects get consumed after applying
        const historyEntry: OmenHistoryEntry = {
          omenId: newOmen.id,
          definitionId: omen.id,
          omenName: omen.name,
          acquiredRound: newOmen.acquiredRound,
          acquiredAct: newOmen.acquiredAct,
          triggeredRound: newOmen.triggeredRound,
          consumedRound: state.currentRound,
          effect: omen.effect,
        }

        set((s) => ({
          activeOmens: [...s.activeOmens, newOmen],
          omenHistory: [...s.omenHistory, historyEntry],
        }))

        return newOmen
      }
    }

    set((s) => ({
      activeOmens: [...s.activeOmens, newOmen],
    }))

    return newOmen
  },

  removeOmen: (omenId: string) => {
    const state = get()
    const omen = state.activeOmens.find((o) => o.id === omenId)
    if (!omen) return false

    set((s) => ({
      activeOmens: s.activeOmens.filter((o) => o.id !== omenId),
    }))

    return true
  },

  triggerOmen: (omenId: string) => {
    const state = get()
    const omenIndex = state.activeOmens.findIndex((o) => o.id === omenId)
    if (omenIndex === -1) return null

    const omen = state.activeOmens[omenIndex]
    if (omen.status !== 'active') return null

    const updatedOmen: ActiveOmen = {
      ...omen,
      status: 'triggered',
      triggeredRound: state.currentRound,
    }

    const newOmens = [...state.activeOmens]
    newOmens[omenIndex] = updatedOmen

    set({ activeOmens: newOmens })

    return updatedOmen
  },

  consumeOmen: (omenId: string) => {
    const state = get()
    const omen = state.activeOmens.find((o) => o.id === omenId)
    if (!omen) return null

    const historyEntry: OmenHistoryEntry = {
      omenId: omen.id,
      definitionId: omen.definition.id,
      omenName: omen.definition.name,
      acquiredRound: omen.acquiredRound,
      acquiredAct: omen.acquiredAct,
      triggeredRound: omen.triggeredRound,
      consumedRound: state.currentRound,
      effect: omen.definition.effect,
    }

    set((s) => ({
      activeOmens: s.activeOmens.filter((o) => o.id !== omenId),
      omenHistory: [...s.omenHistory, historyEntry],
    }))

    return historyEntry
  },

  getActiveOmensByTrigger: (trigger: OmenTrigger) => {
    const state = get()
    return state.activeOmens.filter(
      (o) => o.definition.trigger === trigger && o.status === 'active'
    )
  },

  getActiveOmensByCategory: (category: OmenCategory) => {
    const state = get()
    return state.activeOmens.filter(
      (o) => o.definition.category === category && o.status === 'active'
    )
  },

  incrementSkippedRounds: () => {
    set((state) => {
      const newTotal = state.totalRoundsSkipped + 1

      // Update scaling omens
      const updatedOmens = state.activeOmens.map((omen) => {
        if (omen.definition.effect.scalesWithSkips) {
          return {
            ...omen,
            currentScalingValue:
              (omen.definition.effect.value as number) * newTotal,
          }
        }
        return omen
      })

      return {
        totalRoundsSkipped: newTotal,
        activeOmens: updatedOmens,
      }
    })
  },

  setRoundInfo: (round: number, act: number) => {
    set({ currentRound: round, currentAct: act })
  },

  applyLockedSeason: () => {
    const state = get()
    if (!state.lockedSeason || state.lockedSeason.isApplied) {
      return null
    }

    const seasonType = state.lockedSeason.seasonType

    set({
      lockedSeason: {
        ...state.lockedSeason,
        isApplied: true,
      },
    })

    // Clear the lock after it's applied
    setTimeout(() => {
      set({ lockedSeason: null })
    }, 0)

    return seasonType
  },

  decrementNoInterestRounds: () => {
    set((state) => ({
      noInterestRounds: Math.max(0, state.noInterestRounds - 1),
    }))
  },

  updateScalingOmens: () => {
    const state = get()
    const updatedOmens = state.activeOmens.map((omen) => {
      if (omen.definition.effect.scalesWithSkips) {
        return {
          ...omen,
          currentScalingValue:
            (omen.definition.effect.value as number) * state.totalRoundsSkipped,
        }
      }
      return omen
    })

    set({ activeOmens: updatedOmens })
  },

  hasActiveOmenWithEffect: (effectType: string) => {
    const state = get()
    return state.activeOmens.some(
      (o) => o.definition.effect.type === effectType && o.status === 'active'
    )
  },

  getOmenHistoryForRun: () => {
    return get().omenHistory
  },

  getTotalSkippedRounds: () => {
    return get().totalRoundsSkipped
  },

  clearOmens: () => {
    set({
      activeOmens: [],
    })
  },

  clearForNewRun: () => {
    set({
      activeOmens: [],
      omenHistory: [],
      totalRoundsSkipped: 0,
      lockedSeason: null,
      noInterestRounds: 0,
      currentRound: 0,
      currentAct: 1,
    })
  },

  // Selectors
  getPassiveMultBonus: () => {
    const state = get()
    let totalMult = 0

    for (const omen of state.activeOmens) {
      if (
        omen.definition.trigger === 'Passive' &&
        omen.definition.effect.type === 'mult_per_skip'
      ) {
        totalMult +=
          omen.currentScalingValue ??
          (omen.definition.effect.value as number) * state.totalRoundsSkipped
      }
    }

    return totalMult
  },

  getNextShopEffects: () => {
    const state = get()
    return state.activeOmens.filter(
      (o) => o.definition.trigger === 'OnNextShop' && o.status === 'active'
    )
  },

  getNextRoundEffects: () => {
    const state = get()
    return state.activeOmens.filter(
      (o) => o.definition.trigger === 'OnNextRound' && o.status === 'active'
    )
  },

  getNextHandEffects: () => {
    const state = get()
    return state.activeOmens.filter(
      (o) => o.definition.trigger === 'OnNextHand' && o.status === 'active'
    )
  },
}))

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Get total number of active omens
 */
export const selectActiveOmenCount = (state: OmenState): number => {
  return state.activeOmens.filter((o) => o.status === 'active').length
}

/**
 * Get total number of omens consumed this run
 */
export const selectConsumedOmenCount = (state: OmenState): number => {
  return state.omenHistory.length
}

/**
 * Get omens by rarity
 */
export const selectOmensByRarity = (
  state: OmenState,
  rarity: OmenRarity
): ActiveOmen[] => {
  return state.activeOmens.filter((o) => o.definition.rarity === rarity)
}

/**
 * Check if interest is blocked by trade-offs
 */
export const selectIsInterestBlocked = (state: OmenState): boolean => {
  return state.noInterestRounds > 0
}

/**
 * Get locked season if any
 */
export const selectLockedSeason = (state: OmenState): SeasonVariant | null => {
  if (state.lockedSeason && !state.lockedSeason.isApplied) {
    return state.lockedSeason.seasonType
  }
  return null
}

/**
 * Get shop discount from omens
 */
export const selectShopDiscountFromOmens = (state: OmenState): number => {
  let discount = 0

  for (const omen of state.activeOmens) {
    if (
      omen.status === 'active' &&
      omen.definition.trigger === 'OnNextShop' &&
      omen.definition.effect.type === 'discount'
    ) {
      discount += omen.definition.effect.value as number
    }
  }

  return discount
}

/**
 * Get free rerolls from omens
 */
export const selectFreeRerollsFromOmens = (state: OmenState): number => {
  let rerolls = 0

  for (const omen of state.activeOmens) {
    if (
      omen.status === 'active' &&
      omen.definition.trigger === 'OnNextShop' &&
      omen.definition.effect.type === 'free_reroll'
    ) {
      rerolls += omen.definition.effect.value as number
    }
  }

  return rerolls
}

/**
 * Get guaranteed items for next shop
 */
export const selectGuaranteedShopItems = (
  state: OmenState
): { itemType: string; omenId: string }[] => {
  const items: { itemType: string; omenId: string }[] = []

  for (const omen of state.activeOmens) {
    if (
      omen.status === 'active' &&
      omen.definition.trigger === 'OnNextShop' &&
      omen.definition.effect.type === 'guaranteed_item' &&
      omen.definition.effect.itemType
    ) {
      items.push({
        itemType: omen.definition.effect.itemType,
        omenId: omen.id,
      })
    }
  }

  return items
}

/**
 * Get edition to apply on next decree purchase
 */
export const selectNextDecreeEdition = (
  state: OmenState
): { editionType: string; omenId: string } | null => {
  for (const omen of state.activeOmens) {
    if (
      omen.status === 'active' &&
      omen.definition.trigger === 'OnNextShop' &&
      omen.definition.effect.type === 'edition_apply' &&
      omen.definition.effect.editionType
    ) {
      return {
        editionType: omen.definition.effect.editionType,
        omenId: omen.id,
      }
    }
  }

  return null
}

/**
 * Get bonus draws for next round
 */
export const selectNextRoundDrawBonus = (state: OmenState): number => {
  let bonus = 0

  for (const omen of state.activeOmens) {
    if (
      omen.status === 'active' &&
      omen.definition.trigger === 'OnNextRound' &&
      omen.definition.effect.type === 'draw_bonus'
    ) {
      bonus += omen.definition.effect.value as number
    }
  }

  return bonus
}

/**
 * Get bonus discards for next round
 */
export const selectNextRoundDiscardBonus = (state: OmenState): number => {
  let bonus = 0

  for (const omen of state.activeOmens) {
    if (
      omen.status === 'active' &&
      omen.definition.trigger === 'OnNextRound' &&
      omen.definition.effect.type === 'discard_refund'
    ) {
      bonus += omen.definition.effect.value as number
    }
  }

  return bonus
}

/**
 * Get bonus hand size for next round
 */
export const selectNextRoundHandSizeBonus = (state: OmenState): number => {
  let bonus = 0

  for (const omen of state.activeOmens) {
    if (
      omen.status === 'active' &&
      omen.definition.trigger === 'OnNextRound' &&
      omen.definition.effect.type === 'hand_size_bonus'
    ) {
      bonus += omen.definition.effect.value as number
    }
  }

  return bonus
}

/**
 * Get gold bonus from scaling omens
 */
export const selectGoldBonusFromOmens = (state: OmenState): number => {
  let gold = 0

  for (const omen of state.activeOmens) {
    if (omen.definition.effect.type === 'gold_per_skip') {
      gold +=
        omen.currentScalingValue ??
        (omen.definition.effect.value as number) * state.totalRoundsSkipped
    }
  }

  return gold
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate unique omen ID
 */
let omenIdCounter = 0
export function generateOmenId(): string {
  return `omen-${++omenIdCounter}-${Date.now()}`
}
