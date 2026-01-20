/**
 * Charter System for Tensho Mahjong Roguelike
 *
 * Imperial Charters are permanent upgrades purchased after defeating Boss Mandates.
 * They provide run-wide bonuses that persist until the run ends.
 *
 * Key rules:
 * - One Charter appears per shop (after Boss rounds only)
 * - Charters cannot be rerolled
 * - Base cost: 10 Gold
 * - Each charter is unique and non-repeatable in a run
 * - Upgraded versions only appear after the base is purchased
 */

import {
  CharterDefinition,
  CharterEffectType,
  CharterEffect,
  BASE_CHARTERS,
  UPGRADED_CHARTERS,
  ALL_CHARTERS,
  getCharterById,
  getUpgradedCharter,
  isCharterAvailable,
  getAvailableCharters,
  CHARTER_COST,
} from '../config/charterDefinitions'

// =============================================================================
// CHARTER SYSTEM TYPES
// =============================================================================

/**
 * Owned charter with acquisition metadata
 */
export interface OwnedCharter extends CharterDefinition {
  acquiredAct: number
  acquiredRound: number
}

/**
 * Active charter effects calculated from all owned charters
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
  mandateRerollsPerAct: number // -1 means unlimited
  handSizeBonus: number
}

/**
 * Default charter effects (no charters purchased)
 */
export const DEFAULT_CHARTER_EFFECTS: CharterEffects = {
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
  interestCap: 5, // Default interest cap
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
// CHARTER SYSTEM CLASS
// =============================================================================

/**
 * Manages imperial charter acquisition and effects
 */
export class CharterSystem {
  private ownedCharters: OwnedCharter[] = []
  private purchasedIds: Set<string> = new Set()
  private currentAct: number = 1
  private currentRound: number = 1
  private mandateRerollsUsedThisAct: number = 0

  constructor() {
    this.reset()
  }

  /**
   * Reset the charter system for a new run
   */
  reset(): void {
    this.ownedCharters = []
    this.purchasedIds = new Set()
    this.currentAct = 1
    this.currentRound = 1
    this.mandateRerollsUsedThisAct = 0
  }

  /**
   * Update current act and round
   */
  updateProgress(act: number, round: number): void {
    if (act !== this.currentAct) {
      this.mandateRerollsUsedThisAct = 0
    }
    this.currentAct = act
    this.currentRound = round
  }

  /**
   * Get all owned charters
   */
  getOwnedCharters(): OwnedCharter[] {
    return [...this.ownedCharters]
  }

  /**
   * Get the set of purchased charter IDs
   */
  getPurchasedIds(): Set<string> {
    return new Set(this.purchasedIds)
  }

  /**
   * Check if a specific charter is owned
   */
  hasCharter(charterId: string): boolean {
    return this.purchasedIds.has(charterId)
  }

  /**
   * Check if a charter can be purchased
   */
  canPurchaseCharter(charterId: string): boolean {
    return isCharterAvailable(charterId, this.purchasedIds)
  }

  /**
   * Purchase a charter
   */
  purchaseCharter(charterId: string): OwnedCharter | null {
    if (!this.canPurchaseCharter(charterId)) {
      return null
    }

    const charter = getCharterById(charterId)
    if (!charter) {
      return null
    }

    const ownedCharter: OwnedCharter = {
      ...charter,
      acquiredAct: this.currentAct,
      acquiredRound: this.currentRound,
    }

    this.ownedCharters.push(ownedCharter)
    this.purchasedIds.add(charterId)

    return ownedCharter
  }

  /**
   * Get a random available charter for the shop
   */
  getRandomAvailableCharter(): CharterDefinition | null {
    const available = getAvailableCharters(this.purchasedIds)

    if (available.length === 0) {
      return null
    }

    // Prefer base charters if not all base charters are purchased
    const availableBases = available.filter((c) => !c.isUpgraded)
    const availableUpgrades = available.filter((c) => c.isUpgraded)

    // 70% chance to show base charter if available, 30% for upgrade
    if (availableBases.length > 0 && (availableUpgrades.length === 0 || Math.random() < 0.7)) {
      return availableBases[Math.floor(Math.random() * availableBases.length)]
    }

    if (availableUpgrades.length > 0) {
      return availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)]
    }

    return available[Math.floor(Math.random() * available.length)]
  }

  /**
   * Calculate all active charter effects
   */
  calculateEffects(): CharterEffects {
    const effects = { ...DEFAULT_CHARTER_EFFECTS }

    for (const charter of this.ownedCharters) {
      for (const effect of charter.effects) {
        this.applyEffect(effects, effect)
      }
    }

    return effects
  }

  /**
   * Apply a single charter effect
   */
  private applyEffect(effects: CharterEffects, effect: CharterEffect): void {
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
        // Take the maximum interest cap
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
        effects.handsPenalty += effect.value as number
        break

      case 'redraws_penalty':
        effects.redrawsPenalty += effect.value as number
        break

      case 'mandate_reroll':
        if (effect.value === -1 || effects.mandateRerollsPerAct === -1) {
          effects.mandateRerollsPerAct = -1 // Unlimited
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

  /**
   * Check if the player can reroll the boss mandate
   */
  canRerollMandate(): boolean {
    const effects = this.calculateEffects()

    if (effects.mandateRerollsPerAct === -1) {
      return true // Unlimited
    }

    return this.mandateRerollsUsedThisAct < effects.mandateRerollsPerAct
  }

  /**
   * Use a mandate reroll
   */
  useMandateReroll(): boolean {
    if (!this.canRerollMandate()) {
      return false
    }

    this.mandateRerollsUsedThisAct++
    return true
  }

  /**
   * Get the cost of rerolling the boss mandate
   */
  getMandateRerollCost(): number {
    return 10 // Always 10 Gold per the spec
  }

  /**
   * Get the number of mandate rerolls remaining this act
   */
  getMandateRerollsRemaining(): number {
    const effects = this.calculateEffects()

    if (effects.mandateRerollsPerAct === -1) {
      return -1 // Unlimited
    }

    return Math.max(0, effects.mandateRerollsPerAct - this.mandateRerollsUsedThisAct)
  }

  /**
   * Get number of purchased charters
   */
  getCharterCount(): number {
    return this.ownedCharters.length
  }

  /**
   * Get the charter cost
   */
  getCharterCost(): number {
    return CHARTER_COST
  }

  /**
   * Check if an upgraded charter is available
   */
  isUpgradeAvailable(baseCharterId: string): boolean {
    if (!this.hasCharter(baseCharterId)) {
      return false
    }

    const upgraded = getUpgradedCharter(baseCharterId)
    if (!upgraded) {
      return false
    }

    return !this.hasCharter(upgraded.id)
  }

  /**
   * Serialize charter system state
   */
  toState(): {
    ownedCharters: OwnedCharter[]
    purchasedIds: string[]
    currentAct: number
    currentRound: number
    mandateRerollsUsedThisAct: number
  } {
    return {
      ownedCharters: [...this.ownedCharters],
      purchasedIds: Array.from(this.purchasedIds),
      currentAct: this.currentAct,
      currentRound: this.currentRound,
      mandateRerollsUsedThisAct: this.mandateRerollsUsedThisAct,
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    ownedCharters: OwnedCharter[]
    purchasedIds: string[]
    currentAct: number
    currentRound: number
    mandateRerollsUsedThisAct: number
  }): CharterSystem {
    const system = new CharterSystem()
    system.ownedCharters = [...state.ownedCharters]
    system.purchasedIds = new Set(state.purchasedIds)
    system.currentAct = state.currentAct
    system.currentRound = state.currentRound
    system.mandateRerollsUsedThisAct = state.mandateRerollsUsedThisAct
    return system
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  CharterDefinition,
  CharterEffectType,
  CharterEffect,
  BASE_CHARTERS,
  UPGRADED_CHARTERS,
  ALL_CHARTERS,
  CHARTER_COST,
  getCharterById,
  getUpgradedCharter,
  getAvailableCharters,
  isCharterAvailable,
} from '../config/charterDefinitions'
