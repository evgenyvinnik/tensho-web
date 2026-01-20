/**
 * Shop Store - Tea House (Shop) state management
 *
 * Manages the state of the between-round marketplace (Tea House).
 * Tracks current offerings, reroll costs, and purchase history.
 */

import { create } from 'zustand'
import {
  TeaHouseSystem,
  TeaHouseState,
  TeaHouseOffering,
  TEA_HOUSE_BASE_ITEM_SLOTS,
} from '../systems/TeaHouseSystem'
import { ImperialCharter, BlessingPack, Decree } from '../systems'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Purchase record for history tracking
 */
export interface PurchaseRecord {
  id: string
  offeringId: string
  itemType: string
  itemName: string
  cost: number
  round: number
  act: number
  timestamp: number
}

/**
 * Shop store state interface
 */
export interface ShopStoreState {
  // Tea House system instance (for complex logic)
  teaHouseSystem: TeaHouseSystem

  // Current shop state
  isShopOpen: boolean
  currentShopState: TeaHouseState | null

  // Item offerings (2 base slots, expandable to 4)
  itemOfferings: TeaHouseOffering[]

  // Blessing packs (2 packs)
  packOfferings: TeaHouseOffering[]

  // Imperial Charter (1 charter, only after boss rounds)
  charterOffering: TeaHouseOffering | null

  // Reroll tracking
  currentRerollCost: number
  rerollsThisVisit: number
  totalRerollsThisRun: number

  // Purchase history
  purchaseHistory: PurchaseRecord[]
  totalGoldSpentThisRun: number

  // Charter tracking
  purchasedCharterIds: string[]

  // Configuration
  currentStake: number
  isAfterBossRound: boolean

  // Actions
  openShop: (ownedDecreeIds: string[], isAfterBossRound: boolean) => void
  closeShop: () => void
  purchaseItem: (offeringId: string, currentGold: number, act: number, round: number) => {
    success: boolean
    cost: number
    offering: TeaHouseOffering | null
    remainingGold: number
  }
  rerollShop: (ownedDecreeIds: string[], currentGold: number) => {
    success: boolean
    cost: number
    remainingGold: number
  }
  setStake: (stake: number) => void
  applyCharter: (charter: ImperialCharter) => void
  getAvailableItems: () => TeaHouseOffering[]
  getAvailablePacks: () => TeaHouseOffering[]
  getAvailableCharter: () => TeaHouseOffering | null
  canAfford: (cost: number, currentGold: number) => boolean
  resetForNewRun: () => void
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const createInitialState = () => ({
  teaHouseSystem: new TeaHouseSystem(),
  isShopOpen: false,
  currentShopState: null,
  itemOfferings: [],
  packOfferings: [],
  charterOffering: null,
  currentRerollCost: 5,
  rerollsThisVisit: 0,
  totalRerollsThisRun: 0,
  purchaseHistory: [],
  totalGoldSpentThisRun: 0,
  purchasedCharterIds: [],
  currentStake: 1,
  isAfterBossRound: false,
})

// =============================================================================
// SHOP STORE
// =============================================================================

export const useShopStore = create<ShopStoreState>()((set, get) => ({
  ...createInitialState(),

  // ===========================================================================
  // SHOP LIFECYCLE
  // ===========================================================================

  /**
   * Open the shop and generate new offerings
   */
  openShop: (ownedDecreeIds: string[], isAfterBossRound: boolean) => {
    const { teaHouseSystem } = get()

    const shopState = teaHouseSystem.generateShop(ownedDecreeIds, isAfterBossRound)

    set({
      isShopOpen: true,
      currentShopState: shopState,
      itemOfferings: shopState.itemOfferings,
      packOfferings: shopState.packOfferings,
      charterOffering: shopState.charterOffering,
      currentRerollCost: shopState.currentRerollCost,
      rerollsThisVisit: shopState.rerollsThisVisit,
      isAfterBossRound,
    })
  },

  /**
   * Close the shop
   */
  closeShop: () => {
    set({
      isShopOpen: false,
    })
  },

  // ===========================================================================
  // PURCHASING
  // ===========================================================================

  /**
   * Purchase an item from the shop
   */
  purchaseItem: (
    offeringId: string,
    currentGold: number,
    act: number,
    round: number
  ) => {
    const { teaHouseSystem, purchaseHistory, totalGoldSpentThisRun, purchasedCharterIds } = get()

    // Find the offering
    const result = teaHouseSystem.purchaseOffering(offeringId)

    if (!result.success || !result.offering) {
      return {
        success: false,
        cost: 0,
        offering: null,
        remainingGold: currentGold,
      }
    }

    // Check if player can afford it
    if (currentGold < result.cost) {
      return {
        success: false,
        cost: 0,
        offering: null,
        remainingGold: currentGold,
      }
    }

    const remainingGold = currentGold - result.cost

    // Create purchase record
    const itemName = getItemName(result.offering)
    const purchaseRecord: PurchaseRecord = {
      id: `purchase_${Date.now()}_${Math.random()}`,
      offeringId,
      itemType: result.offering.itemType,
      itemName,
      cost: result.cost,
      round,
      act,
      timestamp: Date.now(),
    }

    // Track charter purchases
    const newPurchasedCharterIds = [...purchasedCharterIds]
    if (result.offering.itemType === 'ImperialCharter') {
      const charter = result.offering.item as ImperialCharter
      newPurchasedCharterIds.push(charter.id)
    }

    // Update shop state
    const newShopState = teaHouseSystem.getState()

    set({
      currentShopState: newShopState,
      itemOfferings: newShopState.itemOfferings,
      packOfferings: newShopState.packOfferings,
      charterOffering: newShopState.charterOffering,
      purchaseHistory: [...purchaseHistory, purchaseRecord],
      totalGoldSpentThisRun: totalGoldSpentThisRun + result.cost,
      purchasedCharterIds: newPurchasedCharterIds,
    })

    return {
      success: true,
      cost: result.cost,
      offering: result.offering,
      remainingGold,
    }
  },

  // ===========================================================================
  // REROLLING
  // ===========================================================================

  /**
   * Reroll the shop offerings
   */
  rerollShop: (ownedDecreeIds: string[], currentGold: number) => {
    const { teaHouseSystem, currentRerollCost, totalRerollsThisRun } = get()

    // Check if player can afford reroll
    if (currentGold < currentRerollCost) {
      return {
        success: false,
        cost: 0,
        remainingGold: currentGold,
      }
    }

    const result = teaHouseSystem.rerollItems(ownedDecreeIds)

    if (!result) {
      return {
        success: false,
        cost: 0,
        remainingGold: currentGold,
      }
    }

    const remainingGold = currentGold - result.cost

    set({
      currentShopState: result.newState,
      itemOfferings: result.newState.itemOfferings,
      packOfferings: result.newState.packOfferings,
      currentRerollCost: result.newState.currentRerollCost,
      rerollsThisVisit: result.newState.rerollsThisVisit,
      totalRerollsThisRun: totalRerollsThisRun + 1,
    })

    return {
      success: true,
      cost: result.cost,
      remainingGold,
    }
  },

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /**
   * Set the current stake level
   */
  setStake: (stake: number) => {
    const { teaHouseSystem } = get()
    teaHouseSystem.setStake(stake)
    set({ currentStake: stake })
  },

  /**
   * Apply a charter's effects
   */
  applyCharter: (charter: ImperialCharter) => {
    const { teaHouseSystem, purchasedCharterIds } = get()
    teaHouseSystem.applyCharter(charter)
    set({
      purchasedCharterIds: [...purchasedCharterIds, charter.id],
    })
  },

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  /**
   * Get available (unpurchased) items
   */
  getAvailableItems: () => {
    const { itemOfferings } = get()
    return itemOfferings.filter((o) => !o.isPurchased && !o.isLocked)
  },

  /**
   * Get available (unpurchased) packs
   */
  getAvailablePacks: () => {
    const { packOfferings } = get()
    return packOfferings.filter((o) => !o.isPurchased && !o.isLocked)
  },

  /**
   * Get available charter
   */
  getAvailableCharter: () => {
    const { charterOffering } = get()
    if (charterOffering && !charterOffering.isPurchased && !charterOffering.isLocked) {
      return charterOffering
    }
    return null
  },

  /**
   * Check if player can afford a cost
   */
  canAfford: (cost: number, currentGold: number) => {
    return currentGold >= cost
  },

  // ===========================================================================
  // RESET
  // ===========================================================================

  /**
   * Reset the store for a new run
   */
  resetForNewRun: () => {
    const newTeaHouseSystem = new TeaHouseSystem()
    set({
      teaHouseSystem: newTeaHouseSystem,
      isShopOpen: false,
      currentShopState: null,
      itemOfferings: [],
      packOfferings: [],
      charterOffering: null,
      currentRerollCost: 5,
      rerollsThisVisit: 0,
      totalRerollsThisRun: 0,
      purchaseHistory: [],
      totalGoldSpentThisRun: 0,
      purchasedCharterIds: [],
      currentStake: 1,
      isAfterBossRound: false,
    })
  },
}))

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Select the number of available item slots
 */
export const selectItemSlotCount = (state: ShopStoreState): number => {
  return state.itemOfferings.length || TEA_HOUSE_BASE_ITEM_SLOTS
}

/**
 * Select total purchases this run
 */
export const selectTotalPurchases = (state: ShopStoreState): number => {
  return state.purchaseHistory.length
}

/**
 * Select purchases by type
 */
export const selectPurchasesByType = (
  state: ShopStoreState,
  itemType: string
): PurchaseRecord[] => {
  return state.purchaseHistory.filter((p) => p.itemType === itemType)
}

/**
 * Select decree purchases count
 */
export const selectDecreePurchaseCount = (state: ShopStoreState): number => {
  return state.purchaseHistory.filter((p) => p.itemType === 'Decree').length
}

/**
 * Select if player has purchased a specific charter
 */
export const selectHasCharter = (state: ShopStoreState, charterId: string): boolean => {
  return state.purchasedCharterIds.includes(charterId)
}

/**
 * Select average purchase cost
 */
export const selectAveragePurchaseCost = (state: ShopStoreState): number => {
  if (state.purchaseHistory.length === 0) return 0
  return state.totalGoldSpentThisRun / state.purchaseHistory.length
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Get the display name for an offering's item
 */
function getItemName(offering: TeaHouseOffering): string {
  switch (offering.itemType) {
    case 'Decree': {
      const decree = offering.item as Decree
      return decree.name
    }
    case 'BlessingPack': {
      const pack = offering.item as BlessingPack
      return `${pack.size} ${pack.type} Pack`
    }
    case 'ImperialCharter': {
      const charter = offering.item as ImperialCharter
      return charter.name
    }
    case 'FateSeal':
      return 'Fate Seal'
    case 'CelestialOrb':
      return 'Celestial Orb'
    default:
      return 'Unknown Item'
  }
}

/**
 * Calculate sell value for an item
 */
export function calculateSellValue(baseCost: number): number {
  return Math.floor(baseCost / 2)
}
