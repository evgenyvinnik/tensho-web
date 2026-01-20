/**
 * Shop Generator for Tensho Tea House
 *
 * Handles random generation of shop offerings based on:
 * - Item type weights (Decrees 71.4%, Fate Seals 14.3%, Orbs 14.3%)
 * - Rarity weights (Common 70%, Uncommon 25%, Rare 5%)
 * - Current game state (act, owned items)
 * - Charter modifications (increased weights, additional slots)
 *
 * Separated from TeaHouseSystem for cleaner code organization and testing.
 */

import {
  DecreeRarity,
  ShopItemType,
  PackSize,
  PackType,
  BlessingPack,
  ImperialCharter,
  Decree,
  Sticker,
  StickerType,
} from './types'
import { ALL_DECREES } from './DecreeSystem'
import { PricingCalculator, EditionType } from './PricingCalculator'

// =============================================================================
// GENERATION CONFIGURATION
// =============================================================================

/**
 * Configuration for shop generation
 */
export interface ShopGeneratorConfig {
  /** Number of item slots to generate */
  itemSlotCount: number
  /** Number of pack slots to generate */
  packSlotCount: number
  /** Whether to generate a charter (after boss rounds) */
  includeCharter: boolean
  /** Current stake level (affects sticker generation) */
  stakeLevel: number
  /** Decree IDs to exclude (already owned) */
  excludedDecreeIds: string[]
  /** Weight multiplier for Fate Seals */
  sealWeightMultiplier: number
  /** Weight multiplier for Celestial Orbs */
  orbWeightMultiplier: number
  /** IDs of already purchased charters */
  purchasedCharterIds: Set<string>
}

/**
 * Default configuration
 */
export const DEFAULT_GENERATOR_CONFIG: ShopGeneratorConfig = {
  itemSlotCount: 2,
  packSlotCount: 2,
  includeCharter: false,
  stakeLevel: 1,
  excludedDecreeIds: [],
  sealWeightMultiplier: 1,
  orbWeightMultiplier: 1,
  purchasedCharterIds: new Set(),
}

// =============================================================================
// ITEM TYPE WEIGHTS
// =============================================================================

/**
 * Base weights for shop item types
 * Decree: 20/28 = 71.4%
 * Fate Seal: 4/28 = 14.3%
 * Celestial Orb: 4/28 = 14.3%
 */
export const BASE_ITEM_WEIGHTS = {
  Decree: 20,
  FateSeal: 4,
  CelestialOrb: 4,
} as const

/**
 * Decree rarity weights
 * Common: 70%, Uncommon: 25%, Rare: 5%
 */
export const RARITY_WEIGHTS: Record<DecreeRarity, number> = {
  LocalEdict: 70,
  RegionalMandate: 25,
  ImperialDecree: 5,
  HeavenlyOrdinance: 0, // Only from special sources
}

/**
 * Pack size weights
 * Normal: 60%, Jumbo: 30%, Mega: 10%
 */
export const PACK_SIZE_WEIGHTS: Record<PackSize, number> = {
  Normal: 60,
  Jumbo: 30,
  Mega: 10,
}

/**
 * Pack type weights
 */
export const PACK_TYPE_WEIGHTS: Record<PackType, number> = {
  Tile: 35,
  Arcana: 35,
  Celestial: 35,
  Decree: 10,
  Void: 5,
}

/**
 * Edition probabilities
 * Negative: 2%, Polychrome: 3%, Holographic: 5%, Foil: 10%
 */
export const EDITION_PROBABILITIES = {
  Negative: 0.02,
  Polychrome: 0.03,
  Holographic: 0.05,
  Foil: 0.1,
} as const

// =============================================================================
// GENERATED ITEM TYPES
// =============================================================================

/**
 * Base interface for all generated shop items
 */
export interface GeneratedShopItem {
  id: string
  slotIndex: number
  type: ShopItemType
  baseCost: number
  editionCost: number
  finalCost: number
  sellValue: number
  edition?: EditionType
}

/**
 * Generated decree offering
 */
export interface GeneratedDecree extends GeneratedShopItem {
  type: 'Decree'
  decree: Decree
  sticker?: Sticker
}

/**
 * Generated Fate Seal offering
 */
export interface GeneratedFateSeal extends GeneratedShopItem {
  type: 'FateSeal'
  sealName: string
}

/**
 * Generated Celestial Orb offering
 */
export interface GeneratedCelestialOrb extends GeneratedShopItem {
  type: 'CelestialOrb'
  orbName: string
}

/**
 * Generated Blessing Pack offering
 */
export interface GeneratedPack extends GeneratedShopItem {
  type: 'BlessingPack'
  pack: BlessingPack
}

/**
 * Generated Imperial Charter offering
 */
export interface GeneratedCharter extends GeneratedShopItem {
  type: 'ImperialCharter'
  charter: ImperialCharter
}

/**
 * Union type for all generated items
 */
export type GeneratedItem =
  | GeneratedDecree
  | GeneratedFateSeal
  | GeneratedCelestialOrb
  | GeneratedPack
  | GeneratedCharter

/**
 * Result of shop generation
 */
export interface GeneratedShop {
  items: GeneratedItem[]
  packs: GeneratedPack[]
  charter: GeneratedCharter | null
}

// =============================================================================
// SHOP GENERATOR CLASS
// =============================================================================

/**
 * Generates random shop offerings
 */
export class ShopGenerator {
  private pricingCalculator: PricingCalculator
  private idCounter: number = 0

  constructor(discountPercentage: number = 0) {
    this.pricingCalculator = new PricingCalculator(discountPercentage)
  }

  /**
   * Update the pricing calculator discount
   */
  setDiscount(percentage: number): void {
    this.pricingCalculator = new PricingCalculator(percentage)
  }

  // ===========================================================================
  // MAIN GENERATION METHODS
  // ===========================================================================

  /**
   * Generate a complete shop
   */
  generateShop(config: Partial<ShopGeneratorConfig> = {}): GeneratedShop {
    const fullConfig = { ...DEFAULT_GENERATOR_CONFIG, ...config }

    // Generate item offerings
    const items: GeneratedItem[] = []
    for (let i = 0; i < fullConfig.itemSlotCount; i++) {
      const item = this.generateItem(i, fullConfig)
      if (item) {
        items.push(item)
      }
    }

    // Generate pack offerings
    const packs: GeneratedPack[] = []
    for (let i = 0; i < fullConfig.packSlotCount; i++) {
      packs.push(this.generatePack(i))
    }

    // Generate charter (if after boss round)
    let charter: GeneratedCharter | null = null
    if (fullConfig.includeCharter) {
      charter = this.generateCharter(fullConfig.purchasedCharterIds)
    }

    return { items, packs, charter }
  }

  /**
   * Regenerate just the items (for reroll)
   */
  regenerateItems(
    count: number,
    config: Partial<ShopGeneratorConfig> = {}
  ): GeneratedItem[] {
    const fullConfig = { ...DEFAULT_GENERATOR_CONFIG, ...config }
    const items: GeneratedItem[] = []

    for (let i = 0; i < count; i++) {
      const item = this.generateItem(i, fullConfig)
      if (item) {
        items.push(item)
      }
    }

    return items
  }

  // ===========================================================================
  // ITEM GENERATION
  // ===========================================================================

  /**
   * Generate a single shop item (Decree, Fate Seal, or Celestial Orb)
   */
  generateItem(
    slotIndex: number,
    config: ShopGeneratorConfig
  ): GeneratedItem | null {
    const itemType = this.selectItemType(config)

    switch (itemType) {
      case 'Decree':
        return this.generateDecree(slotIndex, config)
      case 'FateSeal':
        return this.generateFateSeal(slotIndex)
      case 'CelestialOrb':
        return this.generateCelestialOrb(slotIndex)
      default:
        return null
    }
  }

  /**
   * Select an item type based on weighted random selection
   */
  private selectItemType(config: ShopGeneratorConfig): 'Decree' | 'FateSeal' | 'CelestialOrb' {
    const weights = {
      Decree: BASE_ITEM_WEIGHTS.Decree,
      FateSeal: BASE_ITEM_WEIGHTS.FateSeal * config.sealWeightMultiplier,
      CelestialOrb: BASE_ITEM_WEIGHTS.CelestialOrb * config.orbWeightMultiplier,
    }

    return this.weightedRandomSelect(weights) as 'Decree' | 'FateSeal' | 'CelestialOrb'
  }

  /**
   * Generate a Decree offering
   */
  generateDecree(
    slotIndex: number,
    config: ShopGeneratorConfig
  ): GeneratedDecree | null {
    // Select rarity
    const rarity = this.weightedRandomSelect(RARITY_WEIGHTS) as DecreeRarity

    // Find available decrees
    let candidates = ALL_DECREES.filter(
      (d) => d.rarity === rarity && !config.excludedDecreeIds.includes(d.id)
    )

    // Fallback to any rarity if none available
    if (candidates.length === 0) {
      candidates = ALL_DECREES.filter((d) => !config.excludedDecreeIds.includes(d.id))
    }

    if (candidates.length === 0) {
      return null
    }

    // Select random decree
    const decree = candidates[Math.floor(Math.random() * candidates.length)]

    // Generate optional edition
    const edition = this.generateEdition()

    // Generate sticker based on stake
    const sticker = this.generateSticker(config.stakeLevel)

    // Calculate pricing
    const pricing = this.pricingCalculator.generateDecreePricing(decree.rarity, edition)

    // Rental items cost only 1 Gold
    const adjustedPricing = sticker?.type === 'Rental'
      ? {
          ...pricing,
          baseCost: 1,
          totalBeforeDiscount: 1 + pricing.editionCost,
          finalCost: 1,
          sellValue: 0, // Can't sell rental items
        }
      : pricing

    return {
      id: this.generateId('decree'),
      slotIndex,
      type: 'Decree',
      decree,
      sticker,
      baseCost: adjustedPricing.baseCost,
      editionCost: adjustedPricing.editionCost,
      finalCost: adjustedPricing.finalCost,
      sellValue: adjustedPricing.sellValue,
      edition,
    }
  }

  /**
   * Generate a Fate Seal offering
   */
  generateFateSeal(slotIndex: number): GeneratedFateSeal {
    const pricing = this.pricingCalculator.calculateFateSealCost()

    return {
      id: this.generateId('seal'),
      slotIndex,
      type: 'FateSeal',
      sealName: 'Random Fate Seal',
      baseCost: pricing.baseCost,
      editionCost: 0,
      finalCost: pricing.finalCost,
      sellValue: pricing.sellValue,
    }
  }

  /**
   * Generate a Celestial Orb offering
   */
  generateCelestialOrb(slotIndex: number): GeneratedCelestialOrb {
    const pricing = this.pricingCalculator.calculateCelestialOrbCost()

    return {
      id: this.generateId('orb'),
      slotIndex,
      type: 'CelestialOrb',
      orbName: 'Random Celestial Orb',
      baseCost: pricing.baseCost,
      editionCost: 0,
      finalCost: pricing.finalCost,
      sellValue: pricing.sellValue,
    }
  }

  // ===========================================================================
  // PACK GENERATION
  // ===========================================================================

  /**
   * Generate a Blessing Pack offering
   */
  generatePack(slotIndex: number): GeneratedPack {
    const packType = this.weightedRandomSelect(PACK_TYPE_WEIGHTS) as PackType
    const packSize = this.weightedRandomSelect(PACK_SIZE_WEIGHTS) as PackSize

    const pack: BlessingPack = {
      id: this.generateId('pack'),
      type: packType,
      size: packSize,
      cost: this.pricingCalculator.getPackCost(packSize),
      choiceCount: packSize === 'Normal' ? 3 : 5,
      selectCount: packSize === 'Mega' ? 2 : 1,
    }

    const pricing = this.pricingCalculator.calculatePackCost(packSize)

    return {
      id: pack.id,
      slotIndex,
      type: 'BlessingPack',
      pack,
      baseCost: pricing.baseCost,
      editionCost: 0,
      finalCost: pricing.finalCost,
      sellValue: pricing.sellValue,
    }
  }

  // ===========================================================================
  // CHARTER GENERATION
  // ===========================================================================

  /**
   * Generate an Imperial Charter offering
   */
  generateCharter(purchasedIds: Set<string>): GeneratedCharter | null {
    const available = this.getAvailableCharters(purchasedIds)

    if (available.length === 0) {
      return null
    }

    const charter = available[Math.floor(Math.random() * available.length)]
    const pricing = this.pricingCalculator.calculateCharterCost()

    return {
      id: this.generateId('charter'),
      slotIndex: 0,
      type: 'ImperialCharter',
      charter,
      baseCost: pricing.baseCost,
      editionCost: 0,
      finalCost: pricing.finalCost,
      sellValue: pricing.sellValue,
    }
  }

  /**
   * Get available charters for purchase
   */
  private getAvailableCharters(purchasedIds: Set<string>): ImperialCharter[] {
    const baseCharters = this.getBaseCharters()
    const upgradedCharters = this.getUpgradedCharters()
    const available: ImperialCharter[] = []

    for (const charter of baseCharters) {
      if (!purchasedIds.has(charter.id)) {
        available.push(charter)
      } else if (charter.upgradeId) {
        const upgrade = upgradedCharters.find((c) => c.id === charter.upgradeId)
        if (upgrade && !purchasedIds.has(upgrade.id)) {
          available.push(upgrade)
        }
      }
    }

    return available
  }

  /**
   * Get base charter definitions
   */
  private getBaseCharters(): ImperialCharter[] {
    return [
      {
        id: 'abundant_stock',
        name: 'Abundant Stock',
        description: '+1 shop slot (to 3)',
        cost: 10,
        effect: { type: 'shop_slots', value: 1 },
        upgradeId: 'plentiful_stock',
        isUpgraded: false,
      },
      {
        id: 'discount_sale',
        name: 'Discount Sale',
        description: '25% off all shop items',
        cost: 10,
        effect: { type: 'discount', value: 25 },
        upgradeId: 'liquidation_sale',
        isUpgraded: false,
      },
      {
        id: 'reroll_surplus',
        name: 'Reroll Surplus',
        description: 'Rerolls cost 2 Gold less',
        cost: 10,
        effect: { type: 'reroll_discount', value: 2 },
        upgradeId: 'reroll_abundance',
        isUpgraded: false,
      },
      {
        id: 'steady_hand',
        name: 'Steady Hand',
        description: '+1 hand per round',
        cost: 10,
        effect: { type: 'hands', value: 1 },
        upgradeId: 'swift_hand',
        isUpgraded: false,
      },
      {
        id: 'frugal_discard',
        name: 'Frugal Discard',
        description: '+1 redraw per round',
        cost: 10,
        effect: { type: 'discards', value: 1 },
        upgradeId: 'wasteful_plenty',
        isUpgraded: false,
      },
      {
        id: 'seed_pouch',
        name: 'Seed Pouch',
        description: 'Interest cap raised to 10 Gold',
        cost: 10,
        effect: { type: 'interest_cap', value: 10 },
        upgradeId: 'money_tree',
        isUpgraded: false,
      },
    ]
  }

  /**
   * Get upgraded charter definitions
   */
  private getUpgradedCharters(): ImperialCharter[] {
    return [
      {
        id: 'plentiful_stock',
        name: 'Plentiful Stock',
        description: '+1 shop slot (to 4)',
        cost: 10,
        effect: { type: 'shop_slots', value: 1 },
        isUpgraded: true,
      },
      {
        id: 'liquidation_sale',
        name: 'Liquidation Sale',
        description: '50% off all shop items',
        cost: 10,
        effect: { type: 'discount', value: 25 },
        isUpgraded: true,
      },
      {
        id: 'reroll_abundance',
        name: 'Reroll Abundance',
        description: 'Rerolls cost 2 Gold less again',
        cost: 10,
        effect: { type: 'reroll_discount', value: 2 },
        isUpgraded: true,
      },
      {
        id: 'swift_hand',
        name: 'Swift Hand',
        description: '+1 additional hand per round',
        cost: 10,
        effect: { type: 'hands', value: 1 },
        isUpgraded: true,
      },
      {
        id: 'wasteful_plenty',
        name: 'Wasteful Plenty',
        description: '+1 additional redraw per round',
        cost: 10,
        effect: { type: 'discards', value: 1 },
        isUpgraded: true,
      },
      {
        id: 'money_tree',
        name: 'Money Tree',
        description: 'Interest cap raised to 20 Gold',
        cost: 10,
        effect: { type: 'interest_cap', value: 20 },
        isUpgraded: true,
      },
    ]
  }

  // ===========================================================================
  // EDITION & STICKER GENERATION
  // ===========================================================================

  /**
   * Generate a random edition for an item
   */
  generateEdition(): EditionType | undefined {
    const roll = Math.random()
    let cumulative = 0

    for (const [edition, probability] of Object.entries(EDITION_PROBABILITIES)) {
      cumulative += probability
      if (roll < cumulative) {
        return edition as EditionType
      }
    }

    return undefined
  }

  /**
   * Generate a sticker based on stake level
   */
  generateSticker(stakeLevel: number): Sticker | undefined {
    if (stakeLevel < 4) return undefined

    const stickerChance = 0.3
    const stickers: StickerType[] = []

    // Eternal at stake 4+ (Black Stake)
    if (stakeLevel >= 4 && Math.random() < stickerChance) {
      stickers.push('Eternal')
    }

    // Perishable at stake 7+ (Orange Stake)
    if (stakeLevel >= 7 && Math.random() < stickerChance) {
      stickers.push('Perishable')
    }

    // Rental at stake 8+ (Gold Stake)
    if (stakeLevel >= 8 && Math.random() < stickerChance) {
      stickers.push('Rental')
    }

    if (stickers.length === 0) return undefined

    // Cannot have both Eternal and Perishable
    if (stickers.includes('Eternal') && stickers.includes('Perishable')) {
      const index = stickers.indexOf('Perishable')
      stickers.splice(index, 1)
    }

    const stickerType = stickers[0]

    switch (stickerType) {
      case 'Eternal':
        return { type: 'Eternal' }
      case 'Perishable':
        return { type: 'Perishable', roundsRemaining: 5 }
      case 'Rental':
        return { type: 'Rental', goldPerRound: 3 }
      default:
        return undefined
    }
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Generate a unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${++this.idCounter}_${Date.now()}`
  }

  /**
   * Weighted random selection
   */
  private weightedRandomSelect(weights: Record<string, number>): string {
    const entries = Object.entries(weights).filter(([, weight]) => weight > 0)
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0)

    if (totalWeight === 0) {
      return entries[0]?.[0] ?? ''
    }

    let random = Math.random() * totalWeight

    for (const [key, weight] of entries) {
      random -= weight
      if (random <= 0) {
        return key
      }
    }

    return entries[0][0]
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const shopGenerator = new ShopGenerator()
