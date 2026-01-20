/**
 * Tea House System (茶寮) for Tensho Mahjong Roguelike
 *
 * The Tea House is the between-round marketplace where players acquire:
 * - Decrees (rule-modifying effects)
 * - Fate Seals (consumables)
 * - Celestial Orbs (yaku upgrades)
 * - Blessing Packs (booster packs)
 * - Imperial Charters (permanent upgrades)
 *
 * Shop Layout (from ARCHITECTURE.MD Section 26):
 * - 2 item slots (expandable via charters to 4)
 * - 2 blessing pack slots
 * - 1 imperial charter slot (appears after boss rounds)
 *
 * Item Weights:
 * - Decree: 71.4% (weight 20)
 * - Fate Seal: 14.3% (weight 4)
 * - Celestial Orb: 14.3% (weight 4)
 *
 * Decree Rarity:
 * - Common: 70%
 * - Uncommon: 25%
 * - Rare: 5%
 * - Legendary: Special sources only
 */

import {
  ShopState,
  ShopItem,
  ShopItemType,
  BlessingPack,
  PackSize,
  PackType,
  ImperialCharter,
  Decree,
  DecreeRarity,
  Sticker,
  StickerType,
} from './types'
import { ALL_DECREES } from './DecreeSystem'
import {
  PricingCalculator,
  EditionType,
  DECREE_BASE_COST_RANGES,
} from './PricingCalculator'

// =============================================================================
// TEA HOUSE CONSTANTS
// =============================================================================

/**
 * Base number of item slots in the Tea House
 */
export const TEA_HOUSE_BASE_ITEM_SLOTS = 2

/**
 * Maximum item slots after all charters
 */
export const TEA_HOUSE_MAX_ITEM_SLOTS = 4

/**
 * Base number of blessing pack slots
 */
export const TEA_HOUSE_PACK_SLOTS = 2

/**
 * Base reroll cost in Gold
 */
export const TEA_HOUSE_BASE_REROLL_COST = 5

/**
 * Reroll cost increment per reroll in current visit
 */
export const TEA_HOUSE_REROLL_INCREMENT = 1

/**
 * Item type weights for shop generation
 * Total weight = 28, so:
 * - Decree: 20/28 = 71.4%
 * - Fate Seal: 4/28 = 14.3%
 * - Celestial Orb: 4/28 = 14.3%
 */
export const ITEM_TYPE_WEIGHTS: Record<ShopItemType, number> = {
  Decree: 20,
  FateSeal: 4,
  CelestialOrb: 4,
  Tile: 0, // Only with Tile Trading charter
  BlessingPack: 0, // Separate slots
  ImperialCharter: 0, // Separate slot
}

/**
 * Decree rarity weights
 * Common: 70%, Uncommon: 25%, Rare: 5%
 */
export const DECREE_RARITY_WEIGHTS: Record<DecreeRarity, number> = {
  LocalEdict: 70, // Common
  RegionalMandate: 25, // Uncommon
  ImperialDecree: 5, // Rare
  HeavenlyOrdinance: 0, // Legendary - special sources only
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
 * Pack type weights (from ARCHITECTURE.MD A6)
 * Tile/Arcana/Celestial packs are more common than Decree/Void packs
 */
export const PACK_TYPE_WEIGHTS: Record<PackType, number> = {
  Tile: 35,
  Arcana: 35,
  Celestial: 35,
  Decree: 10,
  Void: 5,
}

// =============================================================================
// IMPERIAL CHARTERS (from ARCHITECTURE.MD Section 28)
// =============================================================================

/**
 * Base Imperial Charters available for purchase
 */
export const TEA_HOUSE_BASE_CHARTERS: ImperialCharter[] = [
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
  {
    id: 'seal_merchant',
    name: 'Seal Merchant',
    description: 'Fate Seals appear 2x more often',
    cost: 10,
    effect: { type: 'seal_weight', value: 2 },
    upgradeId: 'seal_tycoon',
    isUpgraded: false,
  },
  {
    id: 'orb_merchant',
    name: 'Orb Merchant',
    description: 'Celestial Orbs appear 2x more often',
    cost: 10,
    effect: { type: 'orb_weight', value: 2 },
    upgradeId: 'orb_tycoon',
    isUpgraded: false,
  },
]

/**
 * Upgraded Imperial Charters (available after purchasing base version)
 */
export const TEA_HOUSE_UPGRADED_CHARTERS: ImperialCharter[] = [
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
    effect: { type: 'discount', value: 25 }, // Additional 25% on top of base
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
  {
    id: 'seal_tycoon',
    name: 'Seal Tycoon',
    description: 'Fate Seals appear 4x more often',
    cost: 10,
    effect: { type: 'seal_weight', value: 2 }, // 2x on top of base 2x
    isUpgraded: true,
  },
  {
    id: 'orb_tycoon',
    name: 'Orb Tycoon',
    description: 'Celestial Orbs appear 4x more often',
    cost: 10,
    effect: { type: 'orb_weight', value: 2 },
    isUpgraded: true,
  },
]

// =============================================================================
// TEA HOUSE OFFERING TYPES
// =============================================================================

/**
 * Represents a single offering in the Tea House
 */
export interface TeaHouseOffering {
  id: string
  slotIndex: number
  itemType: ShopItemType
  item: Decree | BlessingPack | ImperialCharter | FateSealPlaceholder | CelestialOrbPlaceholder
  baseCost: number
  editionCost: number
  finalCost: number
  sellValue: number
  edition?: EditionType
  isPurchased: boolean
  isLocked: boolean
}

/**
 * Placeholder for Fate Seal (actual seal system not implemented yet)
 */
export interface FateSealPlaceholder {
  id: string
  name: string
  type: 'FateSeal'
}

/**
 * Placeholder for Celestial Orb (actual orb system not implemented yet)
 */
export interface CelestialOrbPlaceholder {
  id: string
  name: string
  type: 'CelestialOrb'
}

/**
 * Tea House state
 */
export interface TeaHouseState {
  itemOfferings: TeaHouseOffering[]
  packOfferings: TeaHouseOffering[]
  charterOffering: TeaHouseOffering | null
  currentRerollCost: number
  rerollsThisVisit: number
  totalRerollsRun: number
  isAfterBossRound: boolean
}

// =============================================================================
// TEA HOUSE SYSTEM CLASS
// =============================================================================

/**
 * Manages the Tea House shop system
 */
export class TeaHouseSystem {
  private pricingCalculator: PricingCalculator
  private itemSlotCount: number = TEA_HOUSE_BASE_ITEM_SLOTS
  private discountPercentage: number = 0
  private rerollDiscount: number = 0
  private sealWeightMultiplier: number = 1
  private orbWeightMultiplier: number = 1
  private purchasedCharterIds: Set<string> = new Set()
  private currentStake: number = 1
  private offeringCounter: number = 0

  // Current shop state
  private itemOfferings: TeaHouseOffering[] = []
  private packOfferings: TeaHouseOffering[] = []
  private charterOffering: TeaHouseOffering | null = null
  private rerollsThisVisit: number = 0
  private totalRerollsRun: number = 0

  constructor(stake: number = 1) {
    this.currentStake = stake
    this.pricingCalculator = new PricingCalculator(0) // Will update discount via applyCharters
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /**
   * Set the current table stake level
   */
  setStake(stake: number): void {
    this.currentStake = stake
  }

  /**
   * Apply effects from purchased charters
   */
  applyCharter(charter: ImperialCharter): void {
    this.purchasedCharterIds.add(charter.id)

    switch (charter.effect.type) {
      case 'shop_slots':
        this.itemSlotCount = Math.min(
          this.itemSlotCount + (charter.effect.value as number),
          TEA_HOUSE_MAX_ITEM_SLOTS
        )
        break
      case 'discount':
        this.discountPercentage += charter.effect.value as number
        this.pricingCalculator = new PricingCalculator(this.discountPercentage)
        break
      case 'reroll_discount':
        this.rerollDiscount += charter.effect.value as number
        break
      case 'seal_weight':
        this.sealWeightMultiplier *= charter.effect.value as number
        break
      case 'orb_weight':
        this.orbWeightMultiplier *= charter.effect.value as number
        break
    }
  }

  /**
   * Check if a charter has been purchased
   */
  hasCharter(charterId: string): boolean {
    return this.purchasedCharterIds.has(charterId)
  }

  // ===========================================================================
  // SHOP GENERATION
  // ===========================================================================

  /**
   * Generate a new Tea House shop
   * Called when player enters the shop between rounds
   */
  generateShop(
    ownedDecreeIds: string[] = [],
    isAfterBossRound: boolean = false
  ): TeaHouseState {
    // Reset reroll count for this visit
    this.rerollsThisVisit = 0

    // Generate item offerings
    this.itemOfferings = []
    for (let i = 0; i < this.itemSlotCount; i++) {
      const offering = this.generateItemOffering(i, ownedDecreeIds)
      if (offering) {
        this.itemOfferings.push(offering)
      }
    }

    // Generate blessing pack offerings
    this.packOfferings = []
    for (let i = 0; i < TEA_HOUSE_PACK_SLOTS; i++) {
      const offering = this.generatePackOffering(i)
      this.packOfferings.push(offering)
    }

    // Generate imperial charter (only after boss rounds)
    this.charterOffering = null
    if (isAfterBossRound) {
      this.charterOffering = this.generateCharterOffering()
    }

    return this.getState()
  }

  /**
   * Generate a single item offering (Decree, Fate Seal, or Celestial Orb)
   */
  private generateItemOffering(
    slotIndex: number,
    excludeDecreeIds: string[]
  ): TeaHouseOffering | null {
    const itemType = this.selectItemType()

    switch (itemType) {
      case 'Decree':
        return this.generateDecreeOffering(slotIndex, excludeDecreeIds)
      case 'FateSeal':
        return this.generateFateSealOffering(slotIndex)
      case 'CelestialOrb':
        return this.generateCelestialOrbOffering(slotIndex)
      default:
        return null
    }
  }

  /**
   * Select an item type based on weights
   */
  private selectItemType(): ShopItemType {
    const weights = { ...ITEM_TYPE_WEIGHTS }

    // Apply weight multipliers from charters
    weights.FateSeal *= this.sealWeightMultiplier
    weights.CelestialOrb *= this.orbWeightMultiplier

    return this.selectWeightedRandom(weights) as ShopItemType
  }

  /**
   * Generate a Decree offering
   */
  private generateDecreeOffering(
    slotIndex: number,
    excludeIds: string[]
  ): TeaHouseOffering | null {
    // Select rarity
    const rarity = this.selectWeightedRandom(DECREE_RARITY_WEIGHTS) as DecreeRarity

    // Find available decrees of this rarity
    let candidates = ALL_DECREES.filter(
      (d) => d.rarity === rarity && !excludeIds.includes(d.id)
    )

    // Fallback to any available decree if none of the selected rarity
    if (candidates.length === 0) {
      candidates = ALL_DECREES.filter((d) => !excludeIds.includes(d.id))
    }

    if (candidates.length === 0) {
      return null
    }

    const decree = candidates[Math.floor(Math.random() * candidates.length)]

    // Determine edition (random chance for special editions)
    const edition = this.generateRandomEdition()

    // Determine sticker based on stake
    const sticker = this.generateSticker()

    // Calculate costs
    const costRange = DECREE_BASE_COST_RANGES[decree.rarity]
    const baseCost =
      sticker?.type === 'Rental'
        ? 1 // Rental items cost only 1 Gold
        : Math.floor(Math.random() * (costRange.max - costRange.min + 1)) + costRange.min

    const { finalCost, editionCost, sellValue } = this.pricingCalculator.calculateDecreeCost(
      baseCost,
      edition
    )

    const decreeWithSticker: Decree = {
      ...decree,
      sticker,
    }

    return {
      id: this.generateOfferingId(),
      slotIndex,
      itemType: 'Decree',
      item: decreeWithSticker,
      baseCost,
      editionCost,
      finalCost,
      sellValue,
      edition,
      isPurchased: false,
      isLocked: false,
    }
  }

  /**
   * Generate a Fate Seal offering
   */
  private generateFateSealOffering(slotIndex: number): TeaHouseOffering {
    const seal: FateSealPlaceholder = {
      id: `fate_seal_${Date.now()}_${Math.random()}`,
      name: 'Random Fate Seal',
      type: 'FateSeal',
    }

    const { finalCost, sellValue } = this.pricingCalculator.calculateFateSealCost()

    return {
      id: this.generateOfferingId(),
      slotIndex,
      itemType: 'FateSeal',
      item: seal,
      baseCost: 3,
      editionCost: 0,
      finalCost,
      sellValue,
      isPurchased: false,
      isLocked: false,
    }
  }

  /**
   * Generate a Celestial Orb offering
   */
  private generateCelestialOrbOffering(slotIndex: number): TeaHouseOffering {
    const orb: CelestialOrbPlaceholder = {
      id: `celestial_orb_${Date.now()}_${Math.random()}`,
      name: 'Random Celestial Orb',
      type: 'CelestialOrb',
    }

    const { finalCost, sellValue } = this.pricingCalculator.calculateCelestialOrbCost()

    return {
      id: this.generateOfferingId(),
      slotIndex,
      itemType: 'CelestialOrb',
      item: orb,
      baseCost: 3,
      editionCost: 0,
      finalCost,
      sellValue,
      isPurchased: false,
      isLocked: false,
    }
  }

  /**
   * Generate a Blessing Pack offering
   */
  private generatePackOffering(slotIndex: number): TeaHouseOffering {
    const packType = this.selectWeightedRandom(PACK_TYPE_WEIGHTS) as PackType
    const packSize = this.selectWeightedRandom(PACK_SIZE_WEIGHTS) as PackSize

    const pack: BlessingPack = {
      id: `pack_${packType}_${packSize}_${Date.now()}`,
      type: packType,
      size: packSize,
      cost: this.pricingCalculator.getPackCost(packSize),
      choiceCount: packSize === 'Normal' ? 3 : 5,
      selectCount: packSize === 'Mega' ? 2 : 1,
    }

    const { finalCost, sellValue } = this.pricingCalculator.calculatePackCost(packSize)

    return {
      id: this.generateOfferingId(),
      slotIndex,
      itemType: 'BlessingPack',
      item: pack,
      baseCost: pack.cost,
      editionCost: 0,
      finalCost,
      sellValue,
      isPurchased: false,
      isLocked: false,
    }
  }

  /**
   * Generate an Imperial Charter offering
   */
  private generateCharterOffering(): TeaHouseOffering | null {
    const available = this.getAvailableCharters()

    if (available.length === 0) {
      return null
    }

    const charter = available[Math.floor(Math.random() * available.length)]
    const { finalCost, sellValue } = this.pricingCalculator.calculateCharterCost()

    return {
      id: this.generateOfferingId(),
      slotIndex: 0,
      itemType: 'ImperialCharter',
      item: charter,
      baseCost: charter.cost,
      editionCost: 0,
      finalCost,
      sellValue,
      isPurchased: false,
      isLocked: false,
    }
  }

  /**
   * Get charters available for purchase
   */
  private getAvailableCharters(): ImperialCharter[] {
    const available: ImperialCharter[] = []

    for (const charter of TEA_HOUSE_BASE_CHARTERS) {
      if (!this.purchasedCharterIds.has(charter.id)) {
        // Base charter not purchased, add it
        available.push(charter)
      } else if (charter.upgradeId) {
        // Base is purchased, check if upgrade is available
        const upgrade = TEA_HOUSE_UPGRADED_CHARTERS.find(
          (c) => c.id === charter.upgradeId
        )
        if (upgrade && !this.purchasedCharterIds.has(upgrade.id)) {
          available.push(upgrade)
        }
      }
    }

    return available
  }

  // ===========================================================================
  // EDITIONS & STICKERS
  // ===========================================================================

  /**
   * Generate a random edition for an item
   * Small chance for special editions
   */
  private generateRandomEdition(): EditionType | undefined {
    const roll = Math.random()

    if (roll < 0.02) {
      return 'Negative'
    } else if (roll < 0.05) {
      return 'Polychrome'
    } else if (roll < 0.10) {
      return 'Holographic'
    } else if (roll < 0.20) {
      return 'Foil'
    }

    return undefined
  }

  /**
   * Generate a sticker based on current stake
   */
  private generateSticker(): Sticker | undefined {
    // Stickers only appear at higher stakes
    if (this.currentStake < 4) return undefined

    const stickerChance = 0.3
    const stickers: StickerType[] = []

    // Eternal at stake 4+ (Black Stake)
    if (this.currentStake >= 4 && Math.random() < stickerChance) {
      stickers.push('Eternal')
    }

    // Perishable at stake 7+ (Orange Stake)
    if (this.currentStake >= 7 && Math.random() < stickerChance) {
      stickers.push('Perishable')
    }

    // Rental at stake 8+ (Gold Stake)
    if (this.currentStake >= 8 && Math.random() < stickerChance) {
      stickers.push('Rental')
    }

    if (stickers.length === 0) return undefined

    // Cannot have both Eternal and Perishable
    if (stickers.includes('Eternal') && stickers.includes('Perishable')) {
      stickers.splice(stickers.indexOf('Perishable'), 1)
    }

    const primarySticker = stickers[0]

    switch (primarySticker) {
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
  // REROLL MECHANICS
  // ===========================================================================

  /**
   * Get the current reroll cost
   */
  getCurrentRerollCost(): number {
    const baseCost = TEA_HOUSE_BASE_REROLL_COST + this.rerollsThisVisit * TEA_HOUSE_REROLL_INCREMENT
    return Math.max(0, baseCost - this.rerollDiscount)
  }

  /**
   * Reroll the item offerings
   * Returns the cost paid or null if reroll failed
   */
  rerollItems(ownedDecreeIds: string[] = []): { cost: number; newState: TeaHouseState } | null {
    const cost = this.getCurrentRerollCost()

    // Track reroll
    this.rerollsThisVisit++
    this.totalRerollsRun++

    // Keep purchased items, regenerate unpurchased ones
    const purchasedItems = this.itemOfferings.filter((o) => o.isPurchased)
    const newItems: TeaHouseOffering[] = []

    for (let i = 0; i < this.itemSlotCount; i++) {
      const purchased = purchasedItems.find((o) => o.slotIndex === i)
      if (purchased) {
        newItems.push(purchased)
      } else {
        const offering = this.generateItemOffering(i, ownedDecreeIds)
        if (offering) {
          newItems.push(offering)
        }
      }
    }

    this.itemOfferings = newItems

    // Note: Blessing packs and charter do NOT reroll
    return {
      cost,
      newState: this.getState(),
    }
  }

  // ===========================================================================
  // PURCHASE & SELL
  // ===========================================================================

  /**
   * Purchase an offering from the shop
   */
  purchaseOffering(offeringId: string): {
    success: boolean
    cost: number
    offering: TeaHouseOffering | null
  } {
    // Check item offerings
    let offering = this.itemOfferings.find((o) => o.id === offeringId)
    if (offering) {
      if (offering.isPurchased || offering.isLocked) {
        return { success: false, cost: 0, offering: null }
      }
      offering.isPurchased = true
      return { success: true, cost: offering.finalCost, offering }
    }

    // Check pack offerings
    offering = this.packOfferings.find((o) => o.id === offeringId)
    if (offering) {
      if (offering.isPurchased || offering.isLocked) {
        return { success: false, cost: 0, offering: null }
      }
      offering.isPurchased = true
      return { success: true, cost: offering.finalCost, offering }
    }

    // Check charter offering
    if (this.charterOffering?.id === offeringId) {
      if (this.charterOffering.isPurchased || this.charterOffering.isLocked) {
        return { success: false, cost: 0, offering: null }
      }
      this.charterOffering.isPurchased = true
      const charter = this.charterOffering.item as ImperialCharter
      this.applyCharter(charter)
      return { success: true, cost: this.charterOffering.finalCost, offering: this.charterOffering }
    }

    return { success: false, cost: 0, offering: null }
  }

  /**
   * Calculate sell value for an item
   */
  calculateSellValue(baseCost: number, edition?: EditionType): number {
    return this.pricingCalculator.calculateSellValue(baseCost, edition)
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /**
   * Get the current Tea House state
   */
  getState(): TeaHouseState {
    return {
      itemOfferings: [...this.itemOfferings],
      packOfferings: [...this.packOfferings],
      charterOffering: this.charterOffering,
      currentRerollCost: this.getCurrentRerollCost(),
      rerollsThisVisit: this.rerollsThisVisit,
      totalRerollsRun: this.totalRerollsRun,
      isAfterBossRound: this.charterOffering !== null,
    }
  }

  /**
   * Get available (unpurchased) offerings
   */
  getAvailableOfferings(): {
    items: TeaHouseOffering[]
    packs: TeaHouseOffering[]
    charter: TeaHouseOffering | null
  } {
    return {
      items: this.itemOfferings.filter((o) => !o.isPurchased && !o.isLocked),
      packs: this.packOfferings.filter((o) => !o.isPurchased && !o.isLocked),
      charter:
        this.charterOffering && !this.charterOffering.isPurchased && !this.charterOffering.isLocked
          ? this.charterOffering
          : null,
    }
  }

  /**
   * Clear the shop
   */
  clear(): void {
    this.itemOfferings = []
    this.packOfferings = []
    this.charterOffering = null
    this.rerollsThisVisit = 0
  }

  /**
   * Reset for a new run
   */
  resetForNewRun(): void {
    this.clear()
    this.itemSlotCount = TEA_HOUSE_BASE_ITEM_SLOTS
    this.discountPercentage = 0
    this.rerollDiscount = 0
    this.sealWeightMultiplier = 1
    this.orbWeightMultiplier = 1
    this.purchasedCharterIds.clear()
    this.totalRerollsRun = 0
    this.pricingCalculator = new PricingCalculator(0)
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Generate a unique offering ID
   */
  private generateOfferingId(): string {
    return `offering_${++this.offeringCounter}_${Date.now()}`
  }

  /**
   * Select a random item based on weights
   */
  private selectWeightedRandom(weights: Record<string, number>): string {
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

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Serialize the Tea House system state
   */
  toSerializedState(): {
    itemSlotCount: number
    discountPercentage: number
    rerollDiscount: number
    sealWeightMultiplier: number
    orbWeightMultiplier: number
    purchasedCharterIds: string[]
    currentStake: number
    itemOfferings: TeaHouseOffering[]
    packOfferings: TeaHouseOffering[]
    charterOffering: TeaHouseOffering | null
    rerollsThisVisit: number
    totalRerollsRun: number
    offeringCounter: number
  } {
    return {
      itemSlotCount: this.itemSlotCount,
      discountPercentage: this.discountPercentage,
      rerollDiscount: this.rerollDiscount,
      sealWeightMultiplier: this.sealWeightMultiplier,
      orbWeightMultiplier: this.orbWeightMultiplier,
      purchasedCharterIds: Array.from(this.purchasedCharterIds),
      currentStake: this.currentStake,
      itemOfferings: this.itemOfferings,
      packOfferings: this.packOfferings,
      charterOffering: this.charterOffering,
      rerollsThisVisit: this.rerollsThisVisit,
      totalRerollsRun: this.totalRerollsRun,
      offeringCounter: this.offeringCounter,
    }
  }

  /**
   * Restore from serialized state
   */
  static fromSerializedState(state: {
    itemSlotCount: number
    discountPercentage: number
    rerollDiscount: number
    sealWeightMultiplier: number
    orbWeightMultiplier: number
    purchasedCharterIds: string[]
    currentStake: number
    itemOfferings: TeaHouseOffering[]
    packOfferings: TeaHouseOffering[]
    charterOffering: TeaHouseOffering | null
    rerollsThisVisit: number
    totalRerollsRun: number
    offeringCounter: number
  }): TeaHouseSystem {
    const system = new TeaHouseSystem(state.currentStake)
    system.itemSlotCount = state.itemSlotCount
    system.discountPercentage = state.discountPercentage
    system.rerollDiscount = state.rerollDiscount
    system.sealWeightMultiplier = state.sealWeightMultiplier
    system.orbWeightMultiplier = state.orbWeightMultiplier
    system.purchasedCharterIds = new Set(state.purchasedCharterIds)
    system.itemOfferings = state.itemOfferings
    system.packOfferings = state.packOfferings
    system.charterOffering = state.charterOffering
    system.rerollsThisVisit = state.rerollsThisVisit
    system.totalRerollsRun = state.totalRerollsRun
    system.offeringCounter = state.offeringCounter
    system.pricingCalculator = new PricingCalculator(state.discountPercentage)
    return system
  }
}
