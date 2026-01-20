/**
 * Shop System (Court Exchange) for Tensho Mahjong Roguelike
 *
 * The Court Exchange is the between-round marketplace where players acquire:
 * - Decrees (rule-modifying effects)
 * - Fate Seals (consumables)
 * - Celestial Orbs (yaku upgrades)
 * - Blessing Packs (booster packs)
 * - Imperial Charters (permanent upgrades)
 *
 * Shop Layout:
 * - 2 item slots (can be increased via charters)
 * - 2 blessing pack slots
 * - 1 imperial charter slot
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
import { DecreeSystem, ALL_DECREES } from './DecreeSystem'

// =============================================================================
// SHOP CONSTANTS
// =============================================================================

/**
 * Base number of item slots in shop
 */
export const BASE_ITEM_SLOTS = 2

/**
 * Base number of blessing pack slots
 */
export const BASE_PACK_SLOTS = 2

/**
 * Base reroll cost
 */
export const BASE_REROLL_COST = 5

/**
 * Reroll cost increment per reroll
 */
export const REROLL_COST_INCREMENT = 1

/**
 * Item type weights for shop generation
 * Decree: 71.4%, Fate Seal: 14.3%, Celestial Orb: 14.3%
 */
export const ITEM_TYPE_WEIGHTS: Record<string, number> = {
  Decree: 20,
  FateSeal: 4,
  CelestialOrb: 4,
}

/**
 * Decree rarity weights
 * Common: 70%, Uncommon: 25%, Rare: 5%
 */
export const DECREE_RARITY_WEIGHTS: Record<DecreeRarity, number> = {
  LocalEdict: 70,
  RegionalMandate: 25,
  ImperialDecree: 5,
  HeavenlyOrdinance: 0, // Only available through special means
}

/**
 * Cost ranges by decree rarity
 */
export const DECREE_COST_RANGES: Record<DecreeRarity, { min: number; max: number }> = {
  LocalEdict: { min: 1, max: 6 },
  RegionalMandate: { min: 4, max: 8 },
  ImperialDecree: { min: 7, max: 10 },
  HeavenlyOrdinance: { min: 15, max: 20 },
}

/**
 * Fixed costs for other item types
 */
export const ITEM_COSTS: Record<string, number> = {
  FateSeal: 3,
  CelestialOrb: 3,
  VoidScript: 4,
  Tile: 1,
}

/**
 * Blessing pack costs by size
 */
export const PACK_COSTS: Record<PackSize, number> = {
  Normal: 4,
  Jumbo: 6,
  Mega: 8,
}

/**
 * Imperial charter base cost
 */
export const CHARTER_COST = 10

/**
 * Pack appearance weights (Normal / Jumbo / Mega)
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

// =============================================================================
// IMPERIAL CHARTERS
// =============================================================================

/**
 * Base imperial charters available
 */
export const BASE_CHARTERS: ImperialCharter[] = [
  {
    id: 'abundant_stock',
    name: 'Abundant Stock',
    description: '+1 shop slot (to 3)',
    cost: CHARTER_COST,
    effect: { type: 'shop_slots', value: 1 },
    upgradeId: 'plentiful_stock',
    isUpgraded: false,
  },
  {
    id: 'discount_sale',
    name: 'Discount Sale',
    description: 'All shop items 25% off',
    cost: CHARTER_COST,
    effect: { type: 'discount', value: 25 },
    upgradeId: 'liquidation_sale',
    isUpgraded: false,
  },
  {
    id: 'reroll_surplus',
    name: 'Reroll Surplus',
    description: 'Rerolls cost 2 Gold less',
    cost: CHARTER_COST,
    effect: { type: 'reroll_discount', value: 2 },
    upgradeId: 'reroll_abundance',
    isUpgraded: false,
  },
  {
    id: 'steady_hand',
    name: 'Steady Hand',
    description: '+1 hand per round',
    cost: CHARTER_COST,
    effect: { type: 'hands', value: 1 },
    upgradeId: 'swift_hand',
    isUpgraded: false,
  },
  {
    id: 'frugal_discard',
    name: 'Frugal Discard',
    description: '+1 discard per round',
    cost: CHARTER_COST,
    effect: { type: 'discards', value: 1 },
    upgradeId: 'wasteful_plenty',
    isUpgraded: false,
  },
  {
    id: 'seed_pouch',
    name: 'Seed Pouch',
    description: 'Interest cap raised to 10 Gold',
    cost: CHARTER_COST,
    effect: { type: 'interest_cap', value: 10 },
    upgradeId: 'money_tree',
    isUpgraded: false,
  },
]

/**
 * Upgraded imperial charters
 */
export const UPGRADED_CHARTERS: ImperialCharter[] = [
  {
    id: 'plentiful_stock',
    name: 'Plentiful Stock',
    description: '+1 shop slot (to 4)',
    cost: CHARTER_COST,
    effect: { type: 'shop_slots', value: 1 },
    isUpgraded: true,
  },
  {
    id: 'liquidation_sale',
    name: 'Liquidation Sale',
    description: 'All shop items 50% off',
    cost: CHARTER_COST,
    effect: { type: 'discount', value: 25 }, // Additional 25%
    isUpgraded: true,
  },
  {
    id: 'reroll_abundance',
    name: 'Reroll Abundance',
    description: 'Rerolls cost 2 Gold less again',
    cost: CHARTER_COST,
    effect: { type: 'reroll_discount', value: 2 },
    isUpgraded: true,
  },
  {
    id: 'swift_hand',
    name: 'Swift Hand',
    description: '+1 additional hand per round',
    cost: CHARTER_COST,
    effect: { type: 'hands', value: 1 },
    isUpgraded: true,
  },
  {
    id: 'wasteful_plenty',
    name: 'Wasteful Plenty',
    description: '+1 additional discard per round',
    cost: CHARTER_COST,
    effect: { type: 'discards', value: 1 },
    isUpgraded: true,
  },
  {
    id: 'money_tree',
    name: 'Money Tree',
    description: 'Interest cap raised to 20 Gold',
    cost: CHARTER_COST,
    effect: { type: 'interest_cap', value: 20 },
    isUpgraded: true,
  },
]

// =============================================================================
// SHOP SYSTEM CLASS
// =============================================================================

/**
 * Manages shop generation, pricing, and purchases
 */
export class ShopSystem {
  private itemSlots: ShopItem[] = []
  private packSlots: ShopItem[] = []
  private charterSlot: ShopItem | null = null
  private rerollCount: number = 0
  private baseItemSlotCount: number = BASE_ITEM_SLOTS
  private discountPercentage: number = 0
  private rerollDiscount: number = 0
  private purchasedCharterIds: Set<string> = new Set()
  private currentStake: number = 1

  constructor() {
    this.clear()
  }

  /**
   * Set the current stake level (affects sticker probabilities)
   */
  setStake(stake: number): void {
    this.currentStake = stake
  }

  /**
   * Add shop slots from charters
   */
  addItemSlot(): void {
    this.baseItemSlotCount++
  }

  /**
   * Add discount from charters
   */
  addDiscount(percentage: number): void {
    this.discountPercentage += percentage
  }

  /**
   * Add reroll discount from charters
   */
  addRerollDiscount(amount: number): void {
    this.rerollDiscount += amount
  }

  /**
   * Record a purchased charter
   */
  recordCharterPurchase(charterId: string): void {
    this.purchasedCharterIds.add(charterId)
  }

  /**
   * Generate a new shop
   */
  generateShop(
    ownedDecreeIds: string[] = [],
    isAfterBoss: boolean = false
  ): ShopState {
    this.rerollCount = 0
    this.itemSlots = []
    this.packSlots = []
    this.charterSlot = null

    // Generate item slots
    for (let i = 0; i < this.baseItemSlotCount; i++) {
      const item = this.generateShopItem(ownedDecreeIds)
      if (item) {
        this.itemSlots.push(item)
      }
    }

    // Generate blessing packs
    for (let i = 0; i < BASE_PACK_SLOTS; i++) {
      const pack = this.generateBlessingPack()
      if (pack) {
        this.packSlots.push(pack)
      }
    }

    // Generate imperial charter (only after boss rounds)
    if (isAfterBoss) {
      this.charterSlot = this.generateCharterOffer()
    }

    return this.getState()
  }

  /**
   * Generate a single shop item
   */
  private generateShopItem(excludeDecreeIds: string[]): ShopItem | null {
    const itemType = this.selectWeightedRandom(ITEM_TYPE_WEIGHTS) as ShopItemType

    if (itemType === 'Decree') {
      return this.generateDecreeItem(excludeDecreeIds)
    } else if (itemType === 'FateSeal') {
      return this.generateFateSealItem()
    } else if (itemType === 'CelestialOrb') {
      return this.generateCelestialOrbItem()
    }

    return null
  }

  /**
   * Generate a decree shop item
   */
  private generateDecreeItem(excludeIds: string[]): ShopItem | null {
    const rarity = this.selectWeightedRandom(DECREE_RARITY_WEIGHTS) as DecreeRarity
    const candidates = ALL_DECREES.filter(
      (d) => d.rarity === rarity && !excludeIds.includes(d.id)
    )

    if (candidates.length === 0) {
      // Fallback to any available decree
      const allCandidates = ALL_DECREES.filter((d) => !excludeIds.includes(d.id))
      if (allCandidates.length === 0) return null
      const decree = allCandidates[Math.floor(Math.random() * allCandidates.length)]
      return this.createDecreeShopItem(decree)
    }

    const decree = candidates[Math.floor(Math.random() * candidates.length)]
    return this.createDecreeShopItem(decree)
  }

  /**
   * Create a decree shop item with pricing and stickers
   */
  private createDecreeShopItem(decree: Decree): ShopItem {
    const costRange = DECREE_COST_RANGES[decree.rarity]
    const baseCost =
      Math.floor(Math.random() * (costRange.max - costRange.min + 1)) + costRange.min

    // Determine sticker based on stake
    const sticker = this.generateSticker()

    const decreeWithSticker: Decree = {
      ...decree,
      sticker,
    }

    // Rental items cost only 1 gold
    const actualBaseCost = sticker?.type === 'Rental' ? 1 : baseCost
    const discountedCost = this.applyDiscount(actualBaseCost)

    return {
      id: `shop-${decree.id}-${Date.now()}`,
      type: 'Decree',
      item: decreeWithSticker,
      baseCost: actualBaseCost,
      discountedCost,
      isPurchased: false,
    }
  }

  /**
   * Generate a sticker based on current stake
   */
  private generateSticker(): Sticker | undefined {
    // Stickers only appear at higher stakes
    if (this.currentStake < 4) return undefined

    const stickerChance = 0.3

    // Check for each sticker type based on stake
    const stickers: StickerType[] = []

    // Eternal at stake 4+
    if (this.currentStake >= 4 && Math.random() < stickerChance) {
      stickers.push('Eternal')
    }

    // Perishable at stake 7+
    if (this.currentStake >= 7 && Math.random() < stickerChance) {
      stickers.push('Perishable')
    }

    // Rental at stake 8+
    if (this.currentStake >= 8 && Math.random() < stickerChance) {
      stickers.push('Rental')
    }

    if (stickers.length === 0) return undefined

    // Can't have both Eternal and Perishable
    if (stickers.includes('Eternal') && stickers.includes('Perishable')) {
      stickers.splice(stickers.indexOf('Perishable'), 1)
    }

    // Return the first applicable sticker (or combine Rental with others)
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

  /**
   * Generate a Fate Seal shop item
   */
  private generateFateSealItem(): ShopItem {
    const baseCost = ITEM_COSTS.FateSeal
    const discountedCost = this.applyDiscount(baseCost)

    return {
      id: `shop-fate-seal-${Date.now()}`,
      type: 'FateSeal',
      item: { id: 'random_fate_seal', name: 'Random Fate Seal' },
      baseCost,
      discountedCost,
      isPurchased: false,
    }
  }

  /**
   * Generate a Celestial Orb shop item
   */
  private generateCelestialOrbItem(): ShopItem {
    const baseCost = ITEM_COSTS.CelestialOrb
    const discountedCost = this.applyDiscount(baseCost)

    return {
      id: `shop-celestial-orb-${Date.now()}`,
      type: 'CelestialOrb',
      item: { id: 'random_celestial_orb', name: 'Random Celestial Orb' },
      baseCost,
      discountedCost,
      isPurchased: false,
    }
  }

  /**
   * Generate a blessing pack
   */
  private generateBlessingPack(): ShopItem {
    const packType = this.selectWeightedRandom(PACK_TYPE_WEIGHTS) as PackType
    const packSize = this.selectWeightedRandom(PACK_SIZE_WEIGHTS) as PackSize

    const pack: BlessingPack = {
      id: `pack-${packType}-${packSize}-${Date.now()}`,
      type: packType,
      size: packSize,
      cost: PACK_COSTS[packSize],
      choiceCount: packSize === 'Normal' ? 3 : 5,
      selectCount: packSize === 'Mega' ? 2 : 1,
    }

    const discountedCost = this.applyDiscount(pack.cost)

    return {
      id: pack.id,
      type: 'BlessingPack',
      item: pack,
      baseCost: pack.cost,
      discountedCost,
      isPurchased: false,
    }
  }

  /**
   * Generate an imperial charter offer
   */
  private generateCharterOffer(): ShopItem | null {
    // Get available charters (not purchased, and upgraded ones require base)
    const available = this.getAvailableCharters()

    if (available.length === 0) {
      return null
    }

    const charter = available[Math.floor(Math.random() * available.length)]
    const discountedCost = this.applyDiscount(charter.cost)

    return {
      id: `shop-charter-${charter.id}`,
      type: 'ImperialCharter',
      item: charter,
      baseCost: charter.cost,
      discountedCost,
      isPurchased: false,
    }
  }

  /**
   * Get available charters for purchase
   */
  private getAvailableCharters(): ImperialCharter[] {
    const available: ImperialCharter[] = []

    for (const charter of BASE_CHARTERS) {
      if (!this.purchasedCharterIds.has(charter.id)) {
        available.push(charter)
      } else if (charter.upgradeId) {
        // Base charter is purchased, check if upgrade is available
        const upgrade = UPGRADED_CHARTERS.find((c) => c.id === charter.upgradeId)
        if (upgrade && !this.purchasedCharterIds.has(upgrade.id)) {
          available.push(upgrade)
        }
      }
    }

    return available
  }

  /**
   * Apply discount to a cost
   */
  private applyDiscount(cost: number): number {
    const discount = 1 - this.discountPercentage / 100
    return Math.max(1, Math.floor(cost * discount))
  }

  /**
   * Get current reroll cost
   */
  getRerollCost(): number {
    return Math.max(
      0,
      BASE_REROLL_COST + this.rerollCount * REROLL_COST_INCREMENT - this.rerollDiscount
    )
  }

  /**
   * Reroll the item slots
   */
  rerollItems(ownedDecreeIds: string[] = []): ShopState | null {
    this.rerollCount++

    // Clear unpurchased items
    this.itemSlots = this.itemSlots.filter((item) => item.isPurchased)

    // Generate new items
    const slotsNeeded = this.baseItemSlotCount - this.itemSlots.length
    for (let i = 0; i < slotsNeeded; i++) {
      const item = this.generateShopItem(ownedDecreeIds)
      if (item) {
        this.itemSlots.push(item)
      }
    }

    return this.getState()
  }

  /**
   * Purchase an item from the shop
   */
  purchaseItem(itemId: string): { success: boolean; cost: number } {
    // Check item slots
    let item = this.itemSlots.find((i) => i.id === itemId)
    if (item) {
      if (item.isPurchased) {
        return { success: false, cost: 0 }
      }
      item.isPurchased = true
      return { success: true, cost: item.discountedCost }
    }

    // Check pack slots
    item = this.packSlots.find((i) => i.id === itemId)
    if (item) {
      if (item.isPurchased) {
        return { success: false, cost: 0 }
      }
      item.isPurchased = true
      return { success: true, cost: item.discountedCost }
    }

    // Check charter slot
    if (this.charterSlot?.id === itemId) {
      if (this.charterSlot.isPurchased) {
        return { success: false, cost: 0 }
      }
      this.charterSlot.isPurchased = true
      const charter = this.charterSlot.item as ImperialCharter
      this.recordCharterPurchase(charter.id)
      return { success: true, cost: this.charterSlot.discountedCost }
    }

    return { success: false, cost: 0 }
  }

  /**
   * Calculate sell value for an item
   */
  calculateSellValue(baseCost: number): number {
    return Math.floor(baseCost / 2)
  }

  /**
   * Get the current shop state
   */
  getState(): ShopState {
    return {
      itemSlots: [...this.itemSlots],
      blessingPacks: [...this.packSlots],
      charter: this.charterSlot,
      rerollCost: this.getRerollCost(),
      rerollCount: this.rerollCount,
      discountPercentage: this.discountPercentage,
    }
  }

  /**
   * Clear shop state
   */
  clear(): void {
    this.itemSlots = []
    this.packSlots = []
    this.charterSlot = null
    this.rerollCount = 0
  }

  /**
   * Helper: Select a random item based on weights
   */
  private selectWeightedRandom(weights: Record<string, number>): string {
    const entries = Object.entries(weights)
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0)
    let random = Math.random() * totalWeight

    for (const [key, weight] of entries) {
      random -= weight
      if (random <= 0) {
        return key
      }
    }

    return entries[0][0]
  }

  /**
   * Get item availability info for UI
   */
  getAvailableItems(): {
    items: ShopItem[]
    packs: ShopItem[]
    charter: ShopItem | null
  } {
    return {
      items: this.itemSlots.filter((i) => !i.isPurchased),
      packs: this.packSlots.filter((p) => !p.isPurchased),
      charter: this.charterSlot?.isPurchased ? null : this.charterSlot,
    }
  }

  /**
   * Serialize shop system state
   */
  toState(): {
    itemSlots: ShopItem[]
    packSlots: ShopItem[]
    charterSlot: ShopItem | null
    rerollCount: number
    baseItemSlotCount: number
    discountPercentage: number
    rerollDiscount: number
    purchasedCharterIds: string[]
    currentStake: number
  } {
    return {
      itemSlots: [...this.itemSlots],
      packSlots: [...this.packSlots],
      charterSlot: this.charterSlot,
      rerollCount: this.rerollCount,
      baseItemSlotCount: this.baseItemSlotCount,
      discountPercentage: this.discountPercentage,
      rerollDiscount: this.rerollDiscount,
      purchasedCharterIds: Array.from(this.purchasedCharterIds),
      currentStake: this.currentStake,
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    itemSlots: ShopItem[]
    packSlots: ShopItem[]
    charterSlot: ShopItem | null
    rerollCount: number
    baseItemSlotCount: number
    discountPercentage: number
    rerollDiscount: number
    purchasedCharterIds: string[]
    currentStake: number
  }): ShopSystem {
    const system = new ShopSystem()
    system.itemSlots = [...state.itemSlots]
    system.packSlots = [...state.packSlots]
    system.charterSlot = state.charterSlot
    system.rerollCount = state.rerollCount
    system.baseItemSlotCount = state.baseItemSlotCount
    system.discountPercentage = state.discountPercentage
    system.rerollDiscount = state.rerollDiscount
    system.purchasedCharterIds = new Set(state.purchasedCharterIds)
    system.currentStake = state.currentStake
    return system
  }
}
