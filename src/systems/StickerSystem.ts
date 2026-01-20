/**
 * Sticker System for Tensho Mahjong Roguelike
 *
 * Stickers are persistent modifiers attached to Decrees at higher Table Stakes.
 * Based on ARCHITECTURE.MD Section 19 - Stickers.
 *
 * Sticker Types:
 * - Eternal (永劫貼): Decree cannot be sold or destroyed
 * - Perishable (腐朽貼): Decree becomes debuffed after 5 rounds
 * - Rental (租借貼): Costs 1 Gold, deducts 3 Gold at end of every round
 *
 * Sticker Rules:
 * - Eternal and Perishable are mutually exclusive (Eternal wins)
 * - Rental can combine with either Eternal or Perishable
 * - Stickers appear at specific stake tiers:
 *   - Eternal: Tier 4+ (Black Stake)
 *   - Perishable: Tier 7+ (Orange Stake)
 *   - Rental: Tier 8 (Gold Stake)
 */

import { StickerType, Sticker, OwnedDecree } from './types'
import {
  STICKER_DEFINITIONS,
  rollForStickers,
  getStickerProbabilities,
  type StickerRollResult,
  type StickerConfig,
} from '../config/stakeDefinitions'

// =============================================================================
// STICKER DEFAULTS
// =============================================================================

/**
 * Default rounds before Perishable sticker debuffs a decree
 */
export const PERISHABLE_ROUNDS = 5

/**
 * Default gold cost per round for Rental sticker
 */
export const RENTAL_GOLD_PER_ROUND = 3

/**
 * Default purchase cost for Rental decrees
 */
export const RENTAL_PURCHASE_COST = 1

// =============================================================================
// STICKER SYSTEM CLASS
// =============================================================================

/**
 * Manages sticker application, tracking, and effects
 */
export class StickerSystem {
  /**
   * Create a sticker instance from a sticker type
   */
  static createSticker(type: StickerType): Sticker {
    const config = STICKER_DEFINITIONS[type]

    const sticker: Sticker = {
      type,
    }

    // Add type-specific properties
    if (type === 'Perishable') {
      sticker.roundsRemaining = config.roundsToDebuff ?? PERISHABLE_ROUNDS
    }

    if (type === 'Rental') {
      sticker.goldPerRound = config.goldPerRound ?? RENTAL_GOLD_PER_ROUND
    }

    return sticker
  }

  /**
   * Roll for and create stickers based on current stake tier
   * Returns array of stickers that should be applied
   */
  static rollStickersForDecree(stakeTier: number): Sticker[] {
    const result = rollForStickers(stakeTier)
    return result.stickers.map((type) => this.createSticker(type))
  }

  /**
   * Get the primary sticker for display purposes
   * Priority: Eternal > Perishable > Rental
   */
  static getPrimarySticker(stickers: Sticker[]): Sticker | null {
    if (stickers.length === 0) return null

    // Check for Eternal first (highest priority)
    const eternal = stickers.find((s) => s.type === 'Eternal')
    if (eternal) return eternal

    // Then Perishable
    const perishable = stickers.find((s) => s.type === 'Perishable')
    if (perishable) return perishable

    // Finally Rental
    const rental = stickers.find((s) => s.type === 'Rental')
    if (rental) return rental

    return stickers[0] ?? null
  }

  /**
   * Check if a decree can be sold based on its stickers
   */
  static canSellDecree(decree: OwnedDecree): boolean {
    if (!decree.sticker) return true
    return decree.sticker.type !== 'Eternal'
  }

  /**
   * Check if a decree can be destroyed based on its stickers
   */
  static canDestroyDecree(decree: OwnedDecree): boolean {
    if (!decree.sticker) return true
    return decree.sticker.type !== 'Eternal'
  }

  /**
   * Update a Perishable sticker at round start
   * Returns true if the decree should become debuffed
   */
  static updatePerishableSticker(sticker: Sticker): boolean {
    if (sticker.type !== 'Perishable') return false
    if (sticker.roundsRemaining === undefined) return false

    sticker.roundsRemaining--
    return sticker.roundsRemaining <= 0
  }

  /**
   * Calculate rental costs for a collection of decrees
   */
  static calculateRentalCosts(decrees: OwnedDecree[]): number {
    let total = 0

    for (const decree of decrees) {
      if (decree.sticker?.type === 'Rental') {
        total += decree.sticker.goldPerRound ?? RENTAL_GOLD_PER_ROUND
      }
    }

    return total
  }

  /**
   * Get the adjusted purchase cost for a decree with stickers
   * Rental stickers set purchase cost to 1 Gold
   */
  static getAdjustedPurchaseCost(baseCost: number, stickers: Sticker[]): number {
    const hasRental = stickers.some((s) => s.type === 'Rental')
    if (hasRental) {
      return RENTAL_PURCHASE_COST
    }
    return baseCost
  }

  /**
   * Get the sticker configuration
   */
  static getStickerConfig(type: StickerType): StickerConfig {
    return STICKER_DEFINITIONS[type]
  }

  /**
   * Get display name for a sticker type
   */
  static getStickerName(type: StickerType): string {
    return STICKER_DEFINITIONS[type].name
  }

  /**
   * Get Japanese name for a sticker type
   */
  static getStickerJapaneseName(type: StickerType): string {
    return STICKER_DEFINITIONS[type].japaneseName
  }

  /**
   * Get description for a sticker type
   */
  static getStickerDescription(type: StickerType): string {
    return STICKER_DEFINITIONS[type].description
  }

  /**
   * Format sticker status for UI display
   */
  static formatStickerStatus(sticker: Sticker): string {
    switch (sticker.type) {
      case 'Eternal':
        return 'Eternal - Cannot sell'
      case 'Perishable':
        return sticker.roundsRemaining !== undefined
          ? `Perishable - ${sticker.roundsRemaining} rounds remaining`
          : 'Perishable'
      case 'Rental':
        return `Rental - $${sticker.goldPerRound ?? RENTAL_GOLD_PER_ROUND}/round`
      default:
        return sticker.type
    }
  }

  /**
   * Check if a sticker type can appear at a given stake tier
   */
  static canStickerAppearAtStake(type: StickerType, stakeTier: number): boolean {
    const config = STICKER_DEFINITIONS[type]
    return stakeTier >= config.minTier
  }

  /**
   * Get available sticker types at a given stake tier
   */
  static getAvailableStickerTypes(stakeTier: number): StickerType[] {
    const available: StickerType[] = []

    for (const [type, config] of Object.entries(STICKER_DEFINITIONS)) {
      if (stakeTier >= config.minTier) {
        available.push(type as StickerType)
      }
    }

    return available
  }

  /**
   * Get sticker probabilities at a given stake tier
   */
  static getStickerProbabilities(
    stakeTier: number
  ): Record<string, number> {
    return getStickerProbabilities(stakeTier)
  }

  /**
   * Validate sticker combinations
   * Eternal and Perishable cannot both apply
   */
  static validateStickerCombination(stickers: StickerType[]): StickerType[] {
    const hasEternal = stickers.includes('Eternal')
    const hasPerishable = stickers.includes('Perishable')

    // If both Eternal and Perishable, remove Perishable
    if (hasEternal && hasPerishable) {
      return stickers.filter((s) => s !== 'Perishable')
    }

    return stickers
  }
}

// =============================================================================
// STICKER STATE MANAGEMENT
// =============================================================================

/**
 * State for tracking stickers on decrees during a run
 */
export interface StickerRunState {
  /** Map of decree ID to applied stickers */
  decreeStickers: Map<string, Sticker[]>
  /** Total rental costs paid this run */
  totalRentalPaid: number
  /** Number of decrees debuffed by Perishable */
  perishablesDebuffed: number
}

/**
 * Create initial sticker run state
 */
export function createStickerRunState(): StickerRunState {
  return {
    decreeStickers: new Map(),
    totalRentalPaid: 0,
    perishablesDebuffed: 0,
  }
}

/**
 * Process stickers at end of round
 * Returns the gold to deduct from rental costs
 */
export function processEndOfRoundStickers(
  decrees: OwnedDecree[],
  state: StickerRunState
): {
  rentalCost: number
  newlyDebuffedDecreeIds: string[]
} {
  let rentalCost = 0
  const newlyDebuffedDecreeIds: string[] = []

  for (const decree of decrees) {
    if (!decree.sticker) continue

    // Process Rental stickers
    if (decree.sticker.type === 'Rental') {
      rentalCost += decree.sticker.goldPerRound ?? RENTAL_GOLD_PER_ROUND
    }

    // Process Perishable stickers
    if (decree.sticker.type === 'Perishable') {
      const shouldDebuff = StickerSystem.updatePerishableSticker(decree.sticker)
      if (shouldDebuff && !decree.isDebuffed) {
        newlyDebuffedDecreeIds.push(decree.id)
        state.perishablesDebuffed++
      }
    }
  }

  state.totalRentalPaid += rentalCost

  return {
    rentalCost,
    newlyDebuffedDecreeIds,
  }
}

/**
 * Process stickers at start of round
 * Updates Perishable countdowns
 */
export function processStartOfRoundStickers(
  decrees: OwnedDecree[]
): string[] {
  const debuffedIds: string[] = []

  for (const decree of decrees) {
    if (!decree.sticker) continue
    if (decree.isDebuffed) continue

    // Check if Perishable sticker should trigger
    if (decree.sticker.type === 'Perishable') {
      if (
        decree.sticker.roundsRemaining !== undefined &&
        decree.sticker.roundsRemaining <= 0
      ) {
        debuffedIds.push(decree.id)
      }
    }
  }

  return debuffedIds
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export {
  type StickerRollResult,
  type StickerConfig,
  STICKER_DEFINITIONS,
}
