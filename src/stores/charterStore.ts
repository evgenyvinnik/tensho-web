/**
 * Charter Store - Imperial Charter (Voucher equivalent) state management
 *
 * Imperial Charters are permanent upgrades purchased after defeating Boss Mandates.
 * They provide run-wide bonuses that persist until the run ends.
 *
 * This store manages:
 * - Owned charters for the current run
 * - Unlocked upgraded charters (based on purchased base charters)
 * - Active charter effects
 * - Mandate reroll tracking
 */

import { create } from 'zustand'
import {
  CharterDefinition,
  CharterEffect,
  CHARTER_COST,
  getCharterById,
  getUpgradedCharter,
  getAvailableCharters,
  isCharterAvailable,
} from '../config/charterDefinitions'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Owned charter with acquisition metadata
 */
export interface OwnedCharter extends CharterDefinition {
  acquiredAct: number
  acquiredRound: number
}

/**
 * Calculated charter effects from all owned charters
 */
export interface CharterEffects {
  shopSlots: number
  discountPercentage: number
  editionFrequencyMultiplier: number
  rerollDiscount: number
  consumableSlots: number
  voidInArcana: boolean
  celestialFavor: boolean
  orbMultiplier: number
  additionalHands: number
  additionalRedraws: number
  sealFrequencyMultiplier: number
  orbFrequencyMultiplier: number
  interestCap: number
  decreeSlots: number
  canBuyTiles: boolean
  tilesHaveEditions: boolean
  actsSkipped: number
  handsPenalty: number
  redrawsPenalty: number
  mandateRerollsPerAct: number
  handSizeBonus: number
}

/**
 * Default charter effects
 */
const DEFAULT_EFFECTS: CharterEffects = {
  shopSlots: 0,
  discountPercentage: 0,
  editionFrequencyMultiplier: 1,
  rerollDiscount: 0,
  consumableSlots: 0,
  voidInArcana: false,
  celestialFavor: false,
  orbMultiplier: 1,
  additionalHands: 0,
  additionalRedraws: 0,
  sealFrequencyMultiplier: 1,
  orbFrequencyMultiplier: 1,
  interestCap: 5,
  decreeSlots: 0,
  canBuyTiles: false,
  tilesHaveEditions: false,
  actsSkipped: 0,
  handsPenalty: 0,
  redrawsPenalty: 0,
  mandateRerollsPerAct: 0,
  handSizeBonus: 0,
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

export interface CharterState {
  // State
  ownedCharters: OwnedCharter[]
  purchasedIds: Set<string>
  currentAct: number
  currentRound: number
  mandateRerollsUsedThisAct: number

  // Actions
  purchaseCharter: (charterId: string) => OwnedCharter | null
  canPurchaseCharter: (charterId: string) => boolean
  hasCharter: (charterId: string) => boolean
  getOwnedCharters: () => OwnedCharter[]
  getAvailableCharters: () => CharterDefinition[]
  getRandomAvailableCharter: () => CharterDefinition | null
  calculateEffects: () => CharterEffects
  updateProgress: (act: number, round: number) => void
  canRerollMandate: () => boolean
  useMandateReroll: () => boolean
  getMandateRerollsRemaining: () => number
  getMandateRerollCost: () => number
  getCharterCount: () => number
  getCharterCost: () => number
  isUpgradeAvailable: (baseCharterId: string) => boolean
  clearCharters: () => void
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Apply a single charter effect to the effects object
 */
function applyEffect(effects: CharterEffects, effect: CharterEffect): void {
  switch (effect.type) {
    case 'shop_slots':
      effects.shopSlots += effect.value as number
      break

    case 'discount':
      effects.discountPercentage += effect.value as number
      break

    case 'edition_frequency':
      effects.editionFrequencyMultiplier *= effect.value as number
      break

    case 'reroll_discount':
      effects.rerollDiscount += effect.value as number
      break

    case 'consumable_slots':
      effects.consumableSlots += effect.value as number
      break

    case 'void_in_arcana':
      effects.voidInArcana = effect.value as boolean
      break

    case 'celestial_favor':
      effects.celestialFavor = effect.value as boolean
      break

    case 'orb_mult':
      effects.orbMultiplier *= effect.value as number
      break

    case 'hands':
      effects.additionalHands += effect.value as number
      break

    case 'redraws':
      effects.additionalRedraws += effect.value as number
      break

    case 'seal_frequency':
      effects.sealFrequencyMultiplier *= effect.value as number
      break

    case 'orb_frequency':
      effects.orbFrequencyMultiplier *= effect.value as number
      break

    case 'interest_cap':
      effects.interestCap = Math.max(effects.interestCap, effect.value as number)
      break

    case 'decree_slots':
      effects.decreeSlots += effect.value as number
      break

    case 'tile_shop':
      effects.canBuyTiles = effect.value as boolean
      break

    case 'tile_editions':
      effects.tilesHaveEditions = effect.value as boolean
      break

    case 'skip_act':
      effects.actsSkipped += effect.value as number
      break

    case 'hands_penalty':
      effects.handsPenalty += Math.abs(effect.value as number)
      break

    case 'redraws_penalty':
      effects.redrawsPenalty += Math.abs(effect.value as number)
      break

    case 'mandate_reroll':
      if (effect.value === -1 || effects.mandateRerollsPerAct === -1) {
        effects.mandateRerollsPerAct = -1
      } else {
        effects.mandateRerollsPerAct += effect.value as number
      }
      break

    case 'hand_size':
      effects.handSizeBonus += effect.value as number
      break

    case 'no_effect':
      // Empty Scroll does nothing
      break
  }
}

// =============================================================================
// STORE
// =============================================================================

export const useCharterStore = create<CharterState>()((set, get) => ({
  // Initial state
  ownedCharters: [],
  purchasedIds: new Set(),
  currentAct: 1,
  currentRound: 1,
  mandateRerollsUsedThisAct: 0,

  // Actions
  purchaseCharter: (charterId: string) => {
    const state = get()

    if (!isCharterAvailable(charterId, state.purchasedIds)) {
      return null
    }

    const charter = getCharterById(charterId)
    if (!charter) {
      return null
    }

    const ownedCharter: OwnedCharter = {
      ...charter,
      acquiredAct: state.currentAct,
      acquiredRound: state.currentRound,
    }

    set({
      ownedCharters: [...state.ownedCharters, ownedCharter],
      purchasedIds: new Set([...state.purchasedIds, charterId]),
    })

    return ownedCharter
  },

  canPurchaseCharter: (charterId: string) => {
    const { purchasedIds } = get()
    return isCharterAvailable(charterId, purchasedIds)
  },

  hasCharter: (charterId: string) => {
    const { purchasedIds } = get()
    return purchasedIds.has(charterId)
  },

  getOwnedCharters: () => {
    const { ownedCharters } = get()
    return [...ownedCharters]
  },

  getAvailableCharters: () => {
    const { purchasedIds } = get()
    return getAvailableCharters(purchasedIds)
  },

  getRandomAvailableCharter: () => {
    const { purchasedIds } = get()
    const available = getAvailableCharters(purchasedIds)

    if (available.length === 0) {
      return null
    }

    // Prefer base charters if not all base charters are purchased
    const availableBases = available.filter((c) => !c.isUpgraded)
    const availableUpgrades = available.filter((c) => c.isUpgraded)

    // 70% chance to show base charter if available, 30% for upgrade
    if (
      availableBases.length > 0 &&
      (availableUpgrades.length === 0 || Math.random() < 0.7)
    ) {
      return availableBases[Math.floor(Math.random() * availableBases.length)]
    }

    if (availableUpgrades.length > 0) {
      return availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)]
    }

    return available[Math.floor(Math.random() * available.length)]
  },

  calculateEffects: () => {
    const { ownedCharters } = get()
    const effects = { ...DEFAULT_EFFECTS }

    for (const charter of ownedCharters) {
      for (const effect of charter.effects) {
        applyEffect(effects, effect)
      }
    }

    return effects
  },

  updateProgress: (act: number, round: number) => {
    const state = get()

    if (act !== state.currentAct) {
      // Reset mandate rerolls when entering a new act
      set({
        currentAct: act,
        currentRound: round,
        mandateRerollsUsedThisAct: 0,
      })
    } else {
      set({
        currentAct: act,
        currentRound: round,
      })
    }
  },

  canRerollMandate: () => {
    const state = get()
    const effects = get().calculateEffects()

    if (effects.mandateRerollsPerAct === -1) {
      return true // Unlimited
    }

    return state.mandateRerollsUsedThisAct < effects.mandateRerollsPerAct
  },

  useMandateReroll: () => {
    const state = get()

    if (!get().canRerollMandate()) {
      return false
    }

    set({
      mandateRerollsUsedThisAct: state.mandateRerollsUsedThisAct + 1,
    })

    return true
  },

  getMandateRerollsRemaining: () => {
    const state = get()
    const effects = get().calculateEffects()

    if (effects.mandateRerollsPerAct === -1) {
      return -1 // Unlimited
    }

    return Math.max(0, effects.mandateRerollsPerAct - state.mandateRerollsUsedThisAct)
  },

  getMandateRerollCost: () => {
    return 10 // Always 10 Gold per the spec
  },

  getCharterCount: () => {
    const { ownedCharters } = get()
    return ownedCharters.length
  },

  getCharterCost: () => {
    return CHARTER_COST
  },

  isUpgradeAvailable: (baseCharterId: string) => {
    const { purchasedIds } = get()

    if (!purchasedIds.has(baseCharterId)) {
      return false
    }

    const upgraded = getUpgradedCharter(baseCharterId)
    if (!upgraded) {
      return false
    }

    return !purchasedIds.has(upgraded.id)
  },

  clearCharters: () => {
    set({
      ownedCharters: [],
      purchasedIds: new Set(),
      currentAct: 1,
      currentRound: 1,
      mandateRerollsUsedThisAct: 0,
    })
  },
}))

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Selector: Get total discount percentage from charters
 */
export const selectDiscountPercentage = (state: CharterState): number => {
  return state.calculateEffects().discountPercentage
}

/**
 * Selector: Get additional shop slots from charters
 */
export const selectAdditionalShopSlots = (state: CharterState): number => {
  return state.calculateEffects().shopSlots
}

/**
 * Selector: Get additional hands from charters
 */
export const selectAdditionalHands = (state: CharterState): number => {
  const effects = state.calculateEffects()
  return effects.additionalHands + effects.handsPenalty
}

/**
 * Selector: Get additional redraws from charters
 */
export const selectAdditionalRedraws = (state: CharterState): number => {
  const effects = state.calculateEffects()
  return effects.additionalRedraws + effects.redrawsPenalty
}

/**
 * Selector: Get interest cap from charters
 */
export const selectInterestCap = (state: CharterState): number => {
  return state.calculateEffects().interestCap
}

/**
 * Selector: Get additional decree slots from charters
 */
export const selectAdditionalDecreeSlots = (state: CharterState): number => {
  return state.calculateEffects().decreeSlots
}

/**
 * Selector: Get hand size bonus from charters
 */
export const selectHandSizeBonus = (state: CharterState): number => {
  return state.calculateEffects().handSizeBonus
}

/**
 * Selector: Check if tiles can be purchased
 */
export const selectCanBuyTiles = (state: CharterState): boolean => {
  return state.calculateEffects().canBuyTiles
}

/**
 * Selector: Get reroll discount from charters
 */
export const selectRerollDiscount = (state: CharterState): number => {
  return state.calculateEffects().rerollDiscount
}

/**
 * Selector: Get acts to skip from charters
 */
export const selectActsToSkip = (state: CharterState): number => {
  return state.calculateEffects().actsSkipped
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique charter instance ID
 */
let charterIdCounter = 0
export function generateCharterId(): string {
  return `charter-${++charterIdCounter}-${Date.now()}`
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Type exports
export type {
  CharterDefinition,
  CharterEffect,
  CharterEffectType,
} from '../config/charterDefinitions'

// Value exports
export {
  BASE_CHARTERS,
  UPGRADED_CHARTERS,
  ALL_CHARTERS,
  CHARTER_COST,
  getCharterById,
  getUpgradedCharter,
  isCharterAvailable,
} from '../config/charterDefinitions'
