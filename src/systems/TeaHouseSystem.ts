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
import { FateSeal, FateSealSystem } from './FateSealSystem'
import { CelestialOrb, CelestialOrbSystem } from './CelestialOrbSystem'
import { VoidScript, VoidScriptSystem } from './VoidScriptSystem'
import { Tile, TileSuit, DragonType, WindType } from '../core/Tile'
import {
  EditionType as TileEditionType,
  EnhancementType,
} from '../core/TileModifier'
import {
  BASE_CHARTERS as CANONICAL_BASE_CHARTERS,
  UPGRADED_CHARTERS as CANONICAL_UPGRADED_CHARTERS,
  getCharterById,
  type CharterDefinition,
  type CharterEffect,
} from '../config/charterDefinitions'

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
  VoidScript: 0, // Guaranteed by Omens or found in Void packs
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

function toImperialCharter(definition: CharterDefinition): ImperialCharter {
  const primaryEffect = definition.effects[0]
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    cost: definition.cost,
    effect: {
      type: primaryEffect.type,
      value: primaryEffect.value,
    },
    upgradeId: definition.upgradeId,
    isUpgraded: definition.isUpgraded,
  }
}

/** Tea House presentation adapters over the canonical Charter catalog. */
export const TEA_HOUSE_BASE_CHARTERS: ImperialCharter[] =
  CANONICAL_BASE_CHARTERS.map(toImperialCharter)

export const TEA_HOUSE_UPGRADED_CHARTERS: ImperialCharter[] =
  CANONICAL_UPGRADED_CHARTERS.map(toImperialCharter)

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
  item:
    | Decree
    | BlessingPack
    | ImperialCharter
    | FateSeal
    | CelestialOrb
    | VoidScript
    | Tile
  baseCost: number
  editionCost: number
  finalCost: number
  sellValue: number
  edition?: EditionType
  isPurchased: boolean
  isLocked: boolean
}

export interface TeaHouseVisitModifiers {
  discountPercentage?: number
  freeRerolls?: number
  guaranteedItemTypes?: string[]
  decreeEdition?: EditionType
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
  private readonly random: () => number
  private itemSlotCount: number = TEA_HOUSE_BASE_ITEM_SLOTS
  private discountPercentage: number = 0
  private rerollDiscount: number = 0
  private sealWeightMultiplier: number = 1
  private orbWeightMultiplier: number = 1
  private editionFrequencyMultiplier: number = 1
  private canBuyTiles: boolean = false
  private tilesHaveEditions: boolean = false
  private purchasedCharterIds: Set<string> = new Set()
  private currentStake: number = 1
  private offeringCounter: number = 0

  // Current shop state
  private itemOfferings: TeaHouseOffering[] = []
  private packOfferings: TeaHouseOffering[] = []
  private charterOffering: TeaHouseOffering | null = null
  private rerollsThisVisit: number = 0
  private totalRerollsRun: number = 0
  private visitDiscountPercentage: number = 0
  private freeRerollsThisVisit: number = 0

  constructor(stake: number = 1, random: () => number = () => Math.random()) {
    this.currentStake = stake
    this.random = random
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
    if (this.purchasedCharterIds.has(charter.id)) return
    this.purchasedCharterIds.add(charter.id)

    const canonical = getCharterById(charter.id)
    const legacyType =
      charter.effect.type === 'seal_weight'
        ? 'seal_frequency'
        : charter.effect.type === 'orb_weight'
          ? 'orb_frequency'
          : charter.effect.type
    const effects: CharterEffect[] = canonical?.effects ?? [
      {
        type: legacyType as CharterEffect['type'],
        value: charter.effect.value,
        description: charter.description,
      },
    ]

    for (const effect of effects) {
      this.applyShopCharterEffect(effect)
    }
  }

  private applyShopCharterEffect(effect: CharterEffect): void {
    switch (effect.type) {
      case 'shop_slots':
        this.itemSlotCount = Math.min(
          this.itemSlotCount + (effect.value as number),
          TEA_HOUSE_MAX_ITEM_SLOTS
        )
        break
      case 'discount':
        this.discountPercentage += effect.value as number
        this.pricingCalculator = new PricingCalculator(this.discountPercentage)
        break
      case 'edition_frequency':
        this.editionFrequencyMultiplier *= effect.value as number
        break
      case 'reroll_discount':
        this.rerollDiscount += effect.value as number
        break
      case 'seal_frequency':
        this.sealWeightMultiplier *= effect.value as number
        break
      case 'orb_frequency':
        this.orbWeightMultiplier *= effect.value as number
        break
      case 'tile_shop':
        this.canBuyTiles = Boolean(effect.value)
        break
      case 'tile_editions':
        this.tilesHaveEditions = Boolean(effect.value)
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
    isAfterBossRound: boolean = false,
    modifiers: TeaHouseVisitModifiers = {}
  ): TeaHouseState {
    // Reset reroll count for this visit
    this.rerollsThisVisit = 0
    this.visitDiscountPercentage = Math.max(0, modifiers.discountPercentage ?? 0)
    this.freeRerollsThisVisit = Math.max(0, modifiers.freeRerolls ?? 0)

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

    this.applyGuaranteedItems(modifiers.guaranteedItemTypes ?? [], ownedDecreeIds)
    if (modifiers.decreeEdition) {
      this.applyGuaranteedDecreeEdition(modifiers.decreeEdition, ownedDecreeIds)
    }
    this.itemOfferings = this.itemOfferings.map((offering) =>
      this.applyVisitDiscount(offering)
    )
    this.packOfferings = this.packOfferings.map((offering) =>
      this.applyVisitDiscount(offering)
    )
    if (this.charterOffering) {
      this.charterOffering = this.applyVisitDiscount(this.charterOffering)
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
      case 'VoidScript':
        return this.generateVoidScriptOffering(slotIndex)
      case 'Tile':
        return this.generateTileOffering(slotIndex)
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
    if (this.canBuyTiles) weights.Tile = 4

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

    const decree = candidates[Math.floor(this.random() * candidates.length)]

    // Determine edition (random chance for special editions)
    const edition = this.generateRandomEdition()

    // Determine sticker based on stake
    const sticker = this.generateSticker()

    // Calculate costs
    const costRange = DECREE_BASE_COST_RANGES[decree.rarity]
    const baseCost =
      sticker?.type === 'Rental'
        ? 1 // Rental items cost only 1 Gold
        : Math.floor(this.random() * (costRange.max - costRange.min + 1)) + costRange.min

    const { finalCost, editionCost, sellValue } = this.pricingCalculator.calculateDecreeCost(
      baseCost,
      edition
    )

    const decreeWithSticker: Decree = {
      ...decree,
      sticker,
      edition,
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
  private generateFateSealOffering(slotIndex: number): TeaHouseOffering | null {
    const sealDef = FateSealSystem.getRandomFateSeal()
    if (!sealDef) {
      return null
    }

    const seal = FateSealSystem.createFateSealInstance(sealDef)

    const { finalCost, sellValue } = this.pricingCalculator.calculateFateSealCost()

    return {
      id: this.generateOfferingId(),
      slotIndex,
      itemType: 'FateSeal',
      item: seal,
      baseCost: seal.cost,
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
  private generateCelestialOrbOffering(slotIndex: number): TeaHouseOffering | null {
    const orbDef = CelestialOrbSystem.getRandomCelestialOrb()
    if (!orbDef) {
      return null
    }

    const orb = CelestialOrbSystem.createCelestialOrbInstance(orbDef)

    const { finalCost, sellValue } = this.pricingCalculator.calculateCelestialOrbCost()

    return {
      id: this.generateOfferingId(),
      slotIndex,
      itemType: 'CelestialOrb',
      item: orb,
      baseCost: orb.cost,
      editionCost: 0,
      finalCost,
      sellValue,
      isPurchased: false,
      isLocked: false,
    }
  }

  private generateVoidScriptOffering(slotIndex: number): TeaHouseOffering | null {
    const scriptDef = VoidScriptSystem.getRandomVoidScript()
    if (!scriptDef) return null

    const script = VoidScriptSystem.createVoidScriptInstance(scriptDef)
    const { baseCost, finalCost, sellValue } =
      this.pricingCalculator.calculateVoidScriptCost()

    return {
      id: this.generateOfferingId(),
      slotIndex,
      itemType: 'VoidScript',
      item: script,
      baseCost,
      editionCost: 0,
      finalCost,
      sellValue,
      isPurchased: false,
      isLocked: false,
    }
  }

  /** Generate a purchasable wall tile unlocked by Tile Trading. */
  private generateTileOffering(slotIndex: number): TeaHouseOffering {
    const tileFace = Math.floor(this.random() * 34)
    let tile: Tile

    if (tileFace < 27) {
      const suits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu] as const
      tile = Tile.createNumbered(
        suits[Math.floor(tileFace / 9)],
        (tileFace % 9) + 1
      )
    } else if (tileFace < 31) {
      tile = Tile.createWind((tileFace - 26) as WindType)
    } else {
      tile = Tile.createDragon((tileFace - 30) as DragonType)
    }

    // Illusion Tiles gives each shop tile a chance to carry an edition or mark.
    if (this.tilesHaveEditions && this.random() < 0.5) {
      if (this.random() < 0.5) {
        const enhancements = [
          EnhancementType.Bonus,
          EnhancementType.Mult,
          EnhancementType.Wild,
          EnhancementType.Glass,
          EnhancementType.Steel,
          EnhancementType.Gold,
          EnhancementType.Lucky,
        ]
        tile = tile.withEnhancement(
          enhancements[Math.floor(this.random() * enhancements.length)]
        )
      } else {
        const editions = [
          TileEditionType.Foil,
          TileEditionType.Holographic,
          TileEditionType.Polychrome,
          TileEditionType.Negative,
        ]
        tile = tile.withEdition(
          editions[Math.floor(this.random() * editions.length)]
        )
      }
    }

    const { baseCost, finalCost, sellValue } =
      this.pricingCalculator.calculateTileCost()
    return {
      id: this.generateOfferingId(),
      slotIndex,
      itemType: 'Tile',
      item: tile,
      baseCost,
      editionCost: 0,
      finalCost,
      sellValue,
      isPurchased: false,
      isLocked: false,
    }
  }

  private applyGuaranteedItems(itemTypes: string[], ownedDecreeIds: string[]): void {
    let itemSlot = 0
    let packSlot = 0

    for (const itemType of itemTypes) {
      if (itemType === 'BlessingPack') {
        const pack = this.packOfferings[packSlot++]
        if (pack) pack.finalCost = 0
        continue
      }

      if (itemSlot >= this.itemSlotCount) break
      let offering: TeaHouseOffering | null = null
      if (itemType === 'Decree') {
        offering = this.generateDecreeOffering(itemSlot, ownedDecreeIds)
      } else if (itemType === 'FateSeal') {
        offering = this.generateFateSealOffering(itemSlot)
      } else if (itemType === 'CelestialOrb') {
        offering = this.generateCelestialOrbOffering(itemSlot)
      } else if (itemType === 'VoidScript') {
        offering = this.generateVoidScriptOffering(itemSlot)
      } else if (itemType === 'Tile' && this.canBuyTiles) {
        offering = this.generateTileOffering(itemSlot)
      }

      if (offering) this.itemOfferings[itemSlot++] = offering
    }
  }

  private applyVisitDiscount(offering: TeaHouseOffering): TeaHouseOffering {
    if (this.visitDiscountPercentage <= 0 || offering.finalCost === 0) return offering

    const finalCost = Math.max(
      0,
      Math.floor(offering.finalCost * (1 - this.visitDiscountPercentage / 100))
    )
    return {
      ...offering,
      finalCost,
      sellValue: PricingCalculator.calculateBaseSellValue(finalCost),
    }
  }

  private applyGuaranteedDecreeEdition(
    edition: EditionType,
    ownedDecreeIds: string[]
  ): void {
    let index = this.itemOfferings.findIndex(
      (offering) => offering.itemType === 'Decree'
    )
    if (index === -1) {
      index = 0
      const decreeOffering = this.generateDecreeOffering(index, ownedDecreeIds)
      if (!decreeOffering) return
      this.itemOfferings[index] = decreeOffering
    }

    const offering = this.itemOfferings[index]
    const decree = offering.item as Decree
    this.itemOfferings[index] = {
      ...offering,
      item: { ...decree, edition },
      edition,
      editionCost: this.pricingCalculator.getEditionCost(edition),
      // Edition Omens make the affected base Decree free.
      finalCost: 0,
      sellValue: 0,
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

    const charter = available[Math.floor(this.random() * available.length)]
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
    const roll = this.random()
    const frequency = Math.max(1, this.editionFrequencyMultiplier)

    if (roll < Math.min(1, 0.02 * frequency)) {
      return 'Negative'
    } else if (roll < Math.min(1, 0.05 * frequency)) {
      return 'Polychrome'
    } else if (roll < Math.min(1, 0.1 * frequency)) {
      return 'Holographic'
    } else if (roll < Math.min(1, 0.2 * frequency)) {
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
    if (this.currentStake >= 4 && this.random() < stickerChance) {
      stickers.push('Eternal')
    }

    // Perishable at stake 7+ (Orange Stake)
    if (this.currentStake >= 7 && this.random() < stickerChance) {
      stickers.push('Perishable')
    }

    // Rental at stake 8+ (Gold Stake)
    if (this.currentStake >= 8 && this.random() < stickerChance) {
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
    if (this.rerollsThisVisit < this.freeRerollsThisVisit) return 0
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
          newItems.push(this.applyVisitDiscount(offering))
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
    this.visitDiscountPercentage = 0
    this.freeRerollsThisVisit = 0
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
    this.editionFrequencyMultiplier = 1
    this.canBuyTiles = false
    this.tilesHaveEditions = false
    this.purchasedCharterIds.clear()
    this.totalRerollsRun = 0
    this.visitDiscountPercentage = 0
    this.freeRerollsThisVisit = 0
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

    let random = this.random() * totalWeight

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
    editionFrequencyMultiplier: number
    canBuyTiles: boolean
    tilesHaveEditions: boolean
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
      editionFrequencyMultiplier: this.editionFrequencyMultiplier,
      canBuyTiles: this.canBuyTiles,
      tilesHaveEditions: this.tilesHaveEditions,
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
    editionFrequencyMultiplier?: number
    canBuyTiles?: boolean
    tilesHaveEditions?: boolean
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
    system.editionFrequencyMultiplier = state.editionFrequencyMultiplier ?? 1
    system.canBuyTiles = state.canBuyTiles ?? false
    system.tilesHaveEditions = state.tilesHaveEditions ?? false
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
