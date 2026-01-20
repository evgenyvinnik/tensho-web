/**
 * Consumable System for Tensho Mahjong Roguelike
 *
 * Base consumable management system covering:
 * - Fate Seals (Tarot analog): Single-use hand manipulation
 * - Celestial Orbs (Planet analog): Yaku family permanent upgrades
 * - Void Scripts (Spectral analog): Powerful effects with downsides
 *
 * Consumables are acquired from:
 * - Blessing Packs (booster packs)
 * - Shop purchases
 * - Omen Tags (skip rewards)
 * - Special effects
 *
 * Authority Hierarchy:
 * Heaven (Seasons) > Court (Decrees) > Nature (Flowers) > Table (Tiles) > Grammar (Yaku)
 * Fate Seals operate at "Heaven" authority level.
 */

// =============================================================================
// CONSUMABLE TYPES
// =============================================================================

/**
 * Categories of consumables
 */
export type ConsumableType = 'FateSeal' | 'CelestialOrb' | 'VoidScript'

/**
 * Rarity tiers for consumables
 */
export type ConsumableRarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary'

/**
 * Edition types for consumables (visual and effect modifications)
 */
export type ConsumableEdition = 'Base' | 'Foil' | 'Holographic' | 'Polychrome' | 'Negative'

/**
 * Base interface for all consumables
 */
export interface BaseConsumable {
  id: string
  instanceId: string // Unique instance ID for owned consumables
  type: ConsumableType
  name: string
  japaneseName: string
  description: string
  rarity: ConsumableRarity
  edition: ConsumableEdition
  cost: number
  sellValue: number
  isUsed: boolean
}

/**
 * Result of using a consumable
 */
export interface ConsumableUseResult {
  success: boolean
  message: string
  effects: ConsumableEffectResult[]
}

/**
 * Individual effect result from using a consumable
 */
export interface ConsumableEffectResult {
  type: string
  description: string
  value?: number | string
  affectedTiles?: string[]
  affectedDecrees?: string[]
}

// =============================================================================
// CONSUMABLE INVENTORY
// =============================================================================

/**
 * Default consumable slot limits
 */
export const DEFAULT_CONSUMABLE_SLOTS = 2
export const MAX_CONSUMABLE_SLOTS = 5

/**
 * Consumable inventory management
 */
export interface ConsumableInventory {
  fateSealSlots: number
  celestialOrbSlots: number
  voidScriptSlots: number
  fateSeals: BaseConsumable[]
  celestialOrbs: BaseConsumable[]
  voidScripts: BaseConsumable[]
}

/**
 * Create an empty consumable inventory
 */
export function createEmptyInventory(): ConsumableInventory {
  return {
    fateSealSlots: DEFAULT_CONSUMABLE_SLOTS,
    celestialOrbSlots: DEFAULT_CONSUMABLE_SLOTS,
    voidScriptSlots: DEFAULT_CONSUMABLE_SLOTS,
    fateSeals: [],
    celestialOrbs: [],
    voidScripts: [],
  }
}

// =============================================================================
// CONSUMABLE SYSTEM CLASS
// =============================================================================

/**
 * Manages consumable inventory, usage, and acquisition
 */
export class ConsumableSystem {
  private inventory: ConsumableInventory
  private currentRound: number = 0
  private sealsUsedThisRound: number = 0
  private scriptsUsedThisRound: number = 0
  private maxSealsPerRound: number = 1
  private maxScriptsPerRound: number = 1

  constructor(initialInventory?: Partial<ConsumableInventory>) {
    this.inventory = {
      ...createEmptyInventory(),
      ...initialInventory,
    }
  }

  // ===========================================================================
  // INVENTORY MANAGEMENT
  // ===========================================================================

  /**
   * Get the current inventory
   */
  getInventory(): ConsumableInventory {
    return { ...this.inventory }
  }

  /**
   * Get all consumables of a specific type
   */
  getConsumablesByType(type: ConsumableType): BaseConsumable[] {
    switch (type) {
      case 'FateSeal':
        return [...this.inventory.fateSeals]
      case 'CelestialOrb':
        return [...this.inventory.celestialOrbs]
      case 'VoidScript':
        return [...this.inventory.voidScripts]
    }
  }

  /**
   * Get available slots for a consumable type
   */
  getAvailableSlots(type: ConsumableType): number {
    switch (type) {
      case 'FateSeal':
        return this.inventory.fateSealSlots - this.inventory.fateSeals.length
      case 'CelestialOrb':
        return this.inventory.celestialOrbSlots - this.inventory.celestialOrbs.length
      case 'VoidScript':
        return this.inventory.voidScriptSlots - this.inventory.voidScripts.length
    }
  }

  /**
   * Get total slots for a consumable type
   */
  getTotalSlots(type: ConsumableType): number {
    switch (type) {
      case 'FateSeal':
        return this.inventory.fateSealSlots
      case 'CelestialOrb':
        return this.inventory.celestialOrbSlots
      case 'VoidScript':
        return this.inventory.voidScriptSlots
    }
  }

  /**
   * Add a slot for a consumable type
   */
  addSlot(type: ConsumableType): void {
    switch (type) {
      case 'FateSeal':
        this.inventory.fateSealSlots = Math.min(
          this.inventory.fateSealSlots + 1,
          MAX_CONSUMABLE_SLOTS
        )
        break
      case 'CelestialOrb':
        this.inventory.celestialOrbSlots = Math.min(
          this.inventory.celestialOrbSlots + 1,
          MAX_CONSUMABLE_SLOTS
        )
        break
      case 'VoidScript':
        this.inventory.voidScriptSlots = Math.min(
          this.inventory.voidScriptSlots + 1,
          MAX_CONSUMABLE_SLOTS
        )
        break
    }
  }

  /**
   * Remove a slot for a consumable type
   */
  removeSlot(type: ConsumableType): boolean {
    const current = this.getTotalSlots(type)
    const used = this.getConsumablesByType(type).length

    // Cannot remove slot if all slots are used
    if (used >= current) {
      return false
    }

    switch (type) {
      case 'FateSeal':
        this.inventory.fateSealSlots = Math.max(0, this.inventory.fateSealSlots - 1)
        break
      case 'CelestialOrb':
        this.inventory.celestialOrbSlots = Math.max(0, this.inventory.celestialOrbSlots - 1)
        break
      case 'VoidScript':
        this.inventory.voidScriptSlots = Math.max(0, this.inventory.voidScriptSlots - 1)
        break
    }

    return true
  }

  // ===========================================================================
  // ACQUISITION
  // ===========================================================================

  /**
   * Check if a consumable can be acquired
   */
  canAcquire(consumable: BaseConsumable): boolean {
    return this.getAvailableSlots(consumable.type) > 0
  }

  /**
   * Acquire a consumable (add to inventory)
   */
  acquire(consumable: BaseConsumable): boolean {
    if (!this.canAcquire(consumable)) {
      return false
    }

    const inventoryItem = {
      ...consumable,
      instanceId: generateConsumableInstanceId(),
      isUsed: false,
    }

    switch (consumable.type) {
      case 'FateSeal':
        this.inventory.fateSeals.push(inventoryItem)
        break
      case 'CelestialOrb':
        this.inventory.celestialOrbs.push(inventoryItem)
        break
      case 'VoidScript':
        this.inventory.voidScripts.push(inventoryItem)
        break
    }

    return true
  }

  /**
   * Remove a consumable by instance ID
   */
  remove(instanceId: string): BaseConsumable | null {
    // Search in all consumable arrays
    for (const list of [
      this.inventory.fateSeals,
      this.inventory.celestialOrbs,
      this.inventory.voidScripts,
    ]) {
      const index = list.findIndex((c) => c.instanceId === instanceId)
      if (index !== -1) {
        const [removed] = list.splice(index, 1)
        return removed
      }
    }

    return null
  }

  /**
   * Sell a consumable for gold
   */
  sell(instanceId: string): number {
    const consumable = this.remove(instanceId)
    if (!consumable) {
      return 0
    }

    return consumable.sellValue
  }

  // ===========================================================================
  // USAGE
  // ===========================================================================

  /**
   * Check if a Fate Seal can be used this round
   */
  canUseFateSeal(): boolean {
    return (
      this.sealsUsedThisRound < this.maxSealsPerRound &&
      this.inventory.fateSeals.length > 0
    )
  }

  /**
   * Check if a Void Script can be used this round
   */
  canUseVoidScript(): boolean {
    return (
      this.scriptsUsedThisRound < this.maxScriptsPerRound &&
      this.inventory.voidScripts.length > 0
    )
  }

  /**
   * Get how many Fate Seals can still be used this round
   */
  getFateSealUsesRemaining(): number {
    return Math.max(0, this.maxSealsPerRound - this.sealsUsedThisRound)
  }

  /**
   * Get how many Void Scripts can still be used this round
   */
  getVoidScriptUsesRemaining(): number {
    return Math.max(0, this.maxScriptsPerRound - this.scriptsUsedThisRound)
  }

  /**
   * Mark a Fate Seal as used
   * Called by FateSealSystem after successful use
   */
  markFateSealUsed(): void {
    this.sealsUsedThisRound++
  }

  /**
   * Mark a Void Script as used
   * Called by VoidScriptSystem after successful use
   */
  markVoidScriptUsed(): void {
    this.scriptsUsedThisRound++
  }

  /**
   * Set max seals per round (can be modified by Decrees/Charters)
   */
  setMaxSealsPerRound(max: number): void {
    this.maxSealsPerRound = max
  }

  /**
   * Set max scripts per round (can be modified by Decrees/Charters)
   */
  setMaxScriptsPerRound(max: number): void {
    this.maxScriptsPerRound = max
  }

  // ===========================================================================
  // ROUND MANAGEMENT
  // ===========================================================================

  /**
   * Called at the start of a new round
   */
  onRoundStart(): void {
    this.currentRound++
    this.sealsUsedThisRound = 0
    this.scriptsUsedThisRound = 0
  }

  /**
   * Called at the end of a round
   */
  onRoundEnd(): void {
    // Mark any used consumables for removal
    this.inventory.fateSeals = this.inventory.fateSeals.filter((c) => !c.isUsed)
    this.inventory.voidScripts = this.inventory.voidScripts.filter((c) => !c.isUsed)
    // Note: Celestial Orbs are not removed after use - they are permanent upgrades
  }

  /**
   * Get the current round number
   */
  getCurrentRound(): number {
    return this.currentRound
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Serialize the consumable system state
   */
  toState(): {
    inventory: ConsumableInventory
    currentRound: number
    sealsUsedThisRound: number
    scriptsUsedThisRound: number
    maxSealsPerRound: number
    maxScriptsPerRound: number
  } {
    return {
      inventory: { ...this.inventory },
      currentRound: this.currentRound,
      sealsUsedThisRound: this.sealsUsedThisRound,
      scriptsUsedThisRound: this.scriptsUsedThisRound,
      maxSealsPerRound: this.maxSealsPerRound,
      maxScriptsPerRound: this.maxScriptsPerRound,
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    inventory: ConsumableInventory
    currentRound: number
    sealsUsedThisRound: number
    scriptsUsedThisRound: number
    maxSealsPerRound: number
    maxScriptsPerRound: number
  }): ConsumableSystem {
    const system = new ConsumableSystem(state.inventory)
    system.currentRound = state.currentRound
    system.sealsUsedThisRound = state.sealsUsedThisRound
    system.scriptsUsedThisRound = state.scriptsUsedThisRound
    system.maxSealsPerRound = state.maxSealsPerRound
    system.maxScriptsPerRound = state.maxScriptsPerRound
    return system
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a unique consumable instance ID
 */
let consumableInstanceCounter = 0
export function generateConsumableInstanceId(): string {
  return `consumable-${++consumableInstanceCounter}-${Date.now()}`
}

/**
 * Reset the instance ID counter (for testing)
 */
export function resetConsumableInstanceCounter(): void {
  consumableInstanceCounter = 0
}

/**
 * Calculate sell value for a consumable
 * Default: half of cost, rounded down
 */
export function calculateSellValue(cost: number, edition: ConsumableEdition): number {
  const editionMultiplier =
    edition === 'Foil'
      ? 1.2
      : edition === 'Holographic'
        ? 1.4
        : edition === 'Polychrome'
          ? 1.6
          : edition === 'Negative'
            ? 2.0
            : 1.0

  return Math.floor((cost * editionMultiplier) / 2)
}

/**
 * Get cost modifier for an edition
 */
export function getEditionCostModifier(edition: ConsumableEdition): number {
  switch (edition) {
    case 'Foil':
      return 2
    case 'Holographic':
      return 3
    case 'Polychrome':
      return 5
    case 'Negative':
      return 5
    default:
      return 0
  }
}

/**
 * Get display name for a consumable type
 */
export function getConsumableTypeName(type: ConsumableType): string {
  switch (type) {
    case 'FateSeal':
      return 'Fate Seal'
    case 'CelestialOrb':
      return 'Celestial Orb'
    case 'VoidScript':
      return 'Void Script'
  }
}

/**
 * Get Japanese name for a consumable type
 */
export function getConsumableTypeJapaneseName(type: ConsumableType): string {
  switch (type) {
    case 'FateSeal':
      return '運命符'
    case 'CelestialOrb':
      return '天球'
    case 'VoidScript':
      return '虚空巻'
  }
}
