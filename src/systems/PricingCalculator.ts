/**
 * Pricing Calculator for Tensho Mahjong Roguelike
 *
 * Handles all cost and sell value calculations for the Tea House shop.
 *
 * Pricing Rules (from ARCHITECTURE.MD Section 26):
 *
 * Base Costs by Rarity:
 * - Common (LocalEdict): 1-6 Gold
 * - Uncommon (RegionalMandate): 4-8 Gold
 * - Rare (ImperialDecree): 7-10 Gold
 * - Legendary (HeavenlyOrdinance): 20 Gold (special sources only)
 *
 * Edition Additional Costs:
 * - Foil: +2 Gold
 * - Holographic: +3 Gold
 * - Polychrome: +5 Gold
 * - Negative: +5 Gold
 *
 * Other Item Costs:
 * - Fate Seal: 3 Gold
 * - Celestial Orb: 3 Gold
 * - Void Script: 4 Gold
 * - Tile: 1 Gold
 * - Blessing Pack (Normal): 4 Gold
 * - Blessing Pack (Jumbo): 6 Gold
 * - Blessing Pack (Mega): 8 Gold
 * - Imperial Charter: 10 Gold
 *
 * Pricing Formula:
 * buy_cost = (base_cost + edition_cost) x (1 - discount_percent/100)
 * sell_value = floor(buy_cost / 2)
 */

import { DecreeRarity, PackSize, type DecreeEdition } from './types'

// =============================================================================
// EDITION TYPES
// =============================================================================

/**
 * Edition types that can modify items
 */
export type EditionType = DecreeEdition

// =============================================================================
// COST CONSTANTS
// =============================================================================

/**
 * Base cost ranges by decree rarity
 */
export const DECREE_BASE_COST_RANGES: Record<DecreeRarity, { min: number; max: number }> = {
  LocalEdict: { min: 1, max: 6 },
  RegionalMandate: { min: 4, max: 8 },
  ImperialDecree: { min: 7, max: 10 },
  HeavenlyOrdinance: { min: 20, max: 20 },
}

/**
 * Additional costs for editions
 */
export const EDITION_ADDITIONAL_COSTS: Record<EditionType, number> = {
  Foil: 2,
  Holographic: 3,
  Polychrome: 5,
  Negative: 5,
}

/**
 * Fixed costs for consumable items
 */
export const CONSUMABLE_COSTS = {
  FateSeal: 3,
  CelestialOrb: 3,
  VoidScript: 4,
  Tile: 1,
} as const

/**
 * Blessing pack costs by size
 */
export const PACK_COSTS: Record<PackSize, number> = {
  Normal: 4,
  Jumbo: 6,
  Mega: 8,
}

/**
 * Imperial Charter base cost
 */
export const CHARTER_BASE_COST = 10

// =============================================================================
// PRICING CALCULATOR CLASS
// =============================================================================

/**
 * Calculates costs and sell values for all shop items
 */
export class PricingCalculator {
  private discountPercentage: number

  constructor(discountPercentage: number = 0) {
    this.discountPercentage = Math.min(100, Math.max(0, discountPercentage))
  }

  /**
   * Update the discount percentage
   */
  setDiscount(percentage: number): void {
    this.discountPercentage = Math.min(100, Math.max(0, percentage))
  }

  /**
   * Get the current discount percentage
   */
  getDiscount(): number {
    return this.discountPercentage
  }

  /**
   * Apply discount to a base cost
   */
  applyDiscount(baseCost: number): number {
    const discountMultiplier = 1 - this.discountPercentage / 100
    return Math.max(1, Math.floor(baseCost * discountMultiplier))
  }

  /**
   * Calculate sell value (floor of half the buy cost)
   */
  static calculateBaseSellValue(buyCost: number): number {
    return Math.floor(buyCost / 2)
  }

  // ===========================================================================
  // DECREE PRICING
  // ===========================================================================

  /**
   * Get a random base cost for a decree of given rarity
   */
  getRandomDecreeBaseCost(rarity: DecreeRarity): number {
    const range = DECREE_BASE_COST_RANGES[rarity]
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
  }

  /**
   * Calculate the edition cost for a decree
   */
  getEditionCost(edition?: EditionType): number {
    if (!edition) return 0
    return EDITION_ADDITIONAL_COSTS[edition]
  }

  /**
   * Calculate full decree cost with edition and discount
   */
  calculateDecreeCost(
    baseCost: number,
    edition?: EditionType
  ): {
    baseCost: number
    editionCost: number
    totalBeforeDiscount: number
    finalCost: number
    sellValue: number
  } {
    const editionCost = this.getEditionCost(edition)
    const totalBeforeDiscount = baseCost + editionCost
    const finalCost = this.applyDiscount(totalBeforeDiscount)
    const sellValue = PricingCalculator.calculateBaseSellValue(finalCost)

    return {
      baseCost,
      editionCost,
      totalBeforeDiscount,
      finalCost,
      sellValue,
    }
  }

  /**
   * Generate full pricing for a decree given its rarity
   */
  generateDecreePricing(
    rarity: DecreeRarity,
    edition?: EditionType
  ): {
    baseCost: number
    editionCost: number
    totalBeforeDiscount: number
    finalCost: number
    sellValue: number
  } {
    const baseCost = this.getRandomDecreeBaseCost(rarity)
    return this.calculateDecreeCost(baseCost, edition)
  }

  // ===========================================================================
  // CONSUMABLE PRICING
  // ===========================================================================

  /**
   * Calculate Fate Seal cost
   */
  calculateFateSealCost(): {
    baseCost: number
    finalCost: number
    sellValue: number
  } {
    const baseCost = CONSUMABLE_COSTS.FateSeal
    const finalCost = this.applyDiscount(baseCost)
    const sellValue = PricingCalculator.calculateBaseSellValue(finalCost)

    return { baseCost, finalCost, sellValue }
  }

  /**
   * Calculate Celestial Orb cost
   */
  calculateCelestialOrbCost(): {
    baseCost: number
    finalCost: number
    sellValue: number
  } {
    const baseCost = CONSUMABLE_COSTS.CelestialOrb
    const finalCost = this.applyDiscount(baseCost)
    const sellValue = PricingCalculator.calculateBaseSellValue(finalCost)

    return { baseCost, finalCost, sellValue }
  }

  /**
   * Calculate Void Script cost
   */
  calculateVoidScriptCost(): {
    baseCost: number
    finalCost: number
    sellValue: number
  } {
    const baseCost = CONSUMABLE_COSTS.VoidScript
    const finalCost = this.applyDiscount(baseCost)
    const sellValue = PricingCalculator.calculateBaseSellValue(finalCost)

    return { baseCost, finalCost, sellValue }
  }

  /**
   * Calculate Tile cost
   */
  calculateTileCost(): {
    baseCost: number
    finalCost: number
    sellValue: number
  } {
    const baseCost = CONSUMABLE_COSTS.Tile
    const finalCost = this.applyDiscount(baseCost)
    const sellValue = PricingCalculator.calculateBaseSellValue(finalCost)

    return { baseCost, finalCost, sellValue }
  }

  // ===========================================================================
  // BLESSING PACK PRICING
  // ===========================================================================

  /**
   * Get base cost for a pack size
   */
  getPackCost(size: PackSize): number {
    return PACK_COSTS[size]
  }

  /**
   * Calculate Blessing Pack cost
   */
  calculatePackCost(size: PackSize): {
    baseCost: number
    finalCost: number
    sellValue: number
  } {
    const baseCost = PACK_COSTS[size]
    const finalCost = this.applyDiscount(baseCost)
    const sellValue = PricingCalculator.calculateBaseSellValue(finalCost)

    return { baseCost, finalCost, sellValue }
  }

  // ===========================================================================
  // IMPERIAL CHARTER PRICING
  // ===========================================================================

  /**
   * Calculate Imperial Charter cost
   */
  calculateCharterCost(): {
    baseCost: number
    finalCost: number
    sellValue: number
  } {
    const baseCost = CHARTER_BASE_COST
    const finalCost = this.applyDiscount(baseCost)
    const sellValue = PricingCalculator.calculateBaseSellValue(finalCost)

    return { baseCost, finalCost, sellValue }
  }

  // ===========================================================================
  // SELL VALUE CALCULATIONS
  // ===========================================================================

  /**
   * Calculate sell value for any item
   * Sell value = floor(buy_cost / 2)
   */
  calculateSellValue(baseCost: number, edition?: EditionType): number {
    const editionCost = this.getEditionCost(edition)
    const totalCost = baseCost + editionCost
    // Note: Sell value is based on total cost before discount
    return PricingCalculator.calculateBaseSellValue(totalCost)
  }

  /**
   * Calculate sell value for a decree with known final cost
   */
  calculateSellValueFromFinalCost(finalCost: number): number {
    return PricingCalculator.calculateBaseSellValue(finalCost)
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Get display text for a cost with optional discount indicator
   */
  formatCostDisplay(
    baseCost: number,
    finalCost: number
  ): {
    original: string
    final: string
    hasDiscount: boolean
    savingsPercent: number
  } {
    const hasDiscount = finalCost < baseCost
    const savingsPercent = hasDiscount
      ? Math.round(((baseCost - finalCost) / baseCost) * 100)
      : 0

    return {
      original: `${baseCost}G`,
      final: `${finalCost}G`,
      hasDiscount,
      savingsPercent,
    }
  }

  /**
   * Check if player can afford an item
   */
  canAfford(playerGold: number, cost: number): boolean {
    return playerGold >= cost
  }

  /**
   * Calculate remaining gold after purchase
   */
  calculateRemainingGold(playerGold: number, cost: number): number {
    return Math.max(0, playerGold - cost)
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the rarity cost range as a display string
 */
export function getRarityCostRangeDisplay(rarity: DecreeRarity): string {
  const range = DECREE_BASE_COST_RANGES[rarity]
  if (range.min === range.max) {
    return `${range.min}G`
  }
  return `${range.min}-${range.max}G`
}

/**
 * Get edition cost display
 */
export function getEditionCostDisplay(edition: EditionType): string {
  return `+${EDITION_ADDITIONAL_COSTS[edition]}G`
}

/**
 * Get all editions sorted by cost
 */
export function getEditionsByCost(): EditionType[] {
  return (Object.keys(EDITION_ADDITIONAL_COSTS) as EditionType[]).sort(
    (a, b) => EDITION_ADDITIONAL_COSTS[a] - EDITION_ADDITIONAL_COSTS[b]
  )
}
