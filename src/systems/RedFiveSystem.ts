/**
 * Red Five System (Aka-Dora) for Tensho Mahjong Roguelike
 *
 * Red fives are variant tiles that provide bonus scoring when included in a hand.
 * In traditional Riichi Mahjong, one 5 from each suited tile (Manzu, Pinzu, Souzu)
 * can be designated as "red" (aka), providing dora-like bonuses.
 *
 * In Tensho, red fives provide:
 * - +50 bonus chips when scored (similar to Foil edition)
 * - Visual distinction (red coloring)
 *
 * Red fives are optional and can be enabled/disabled in settings.
 */

import { Tile, TileSuit } from '../core/Tile'

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Bonus chips provided by red fives when scored
 */
export const RED_FIVE_CHIP_BONUS = 50

/**
 * The rank that can be red (only 5s)
 */
export const RED_FIVE_RANK = 5

/**
 * Suits that can have red fives (only suited tiles)
 */
export const RED_FIVE_SUITS: TileSuit[] = [
  TileSuit.Manzu,
  TileSuit.Pinzu,
  TileSuit.Souzu,
]

/**
 * Total number of red fives when enabled (one per suit)
 */
export const RED_FIVE_COUNT = RED_FIVE_SUITS.length // 3

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Configuration for the Red Five system
 */
export interface RedFiveConfig {
  /** Whether red fives are enabled */
  enabled: boolean
  /** Bonus chips per red five when scored */
  chipBonus: number
  /** Suits that have red fives */
  suits: TileSuit[]
}

/**
 * Default configuration (disabled for backward compatibility)
 */
export const DEFAULT_RED_FIVE_CONFIG: RedFiveConfig = {
  enabled: false,
  chipBonus: RED_FIVE_CHIP_BONUS,
  suits: [...RED_FIVE_SUITS],
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a tile is a red five
 */
export function isRedFive(tile: Tile): boolean {
  return tile.isRed && tile.rank === RED_FIVE_RANK && tile.isSuited
}

/**
 * Check if a tile can be a red five (is a 5 of a suited tile)
 */
export function canBeRedFive(tile: Tile): boolean {
  return tile.rank === RED_FIVE_RANK && tile.isSuited
}

/**
 * Calculate red five bonus chips for a collection of tiles
 */
export function calculateRedFiveBonus(tiles: Tile[], config: RedFiveConfig = DEFAULT_RED_FIVE_CONFIG): number {
  if (!config.enabled) return 0

  let bonus = 0
  for (const tile of tiles) {
    if (isRedFive(tile) && config.suits.includes(tile.suit)) {
      bonus += config.chipBonus
    }
  }
  return bonus
}

/**
 * Count red fives in a collection of tiles
 */
export function countRedFives(tiles: Tile[]): number {
  return tiles.filter(isRedFive).length
}

/**
 * Get a list of red fives from a collection of tiles
 */
export function getRedFives(tiles: Tile[]): Tile[] {
  return tiles.filter(isRedFive)
}

// =============================================================================
// RED FIVE SYSTEM CLASS
// =============================================================================

/**
 * RedFiveSystem manages red five configuration and scoring
 */
export class RedFiveSystem {
  private config: RedFiveConfig

  constructor(config: Partial<RedFiveConfig> = {}) {
    this.config = { ...DEFAULT_RED_FIVE_CONFIG, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): RedFiveConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<RedFiveConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Enable red fives
   */
  enable(): void {
    this.config.enabled = true
  }

  /**
   * Disable red fives
   */
  disable(): void {
    this.config.enabled = false
  }

  /**
   * Check if red fives are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Get chip bonus per red five
   */
  getChipBonus(): number {
    return this.config.chipBonus
  }

  /**
   * Set chip bonus per red five
   */
  setChipBonus(bonus: number): void {
    this.config.chipBonus = bonus
  }

  /**
   * Calculate bonus chips for tiles
   */
  calculateBonus(tiles: Tile[]): number {
    return calculateRedFiveBonus(tiles, this.config)
  }

  /**
   * Check if a tile provides red five bonus
   */
  providesBonus(tile: Tile): boolean {
    return this.config.enabled && isRedFive(tile) && this.config.suits.includes(tile.suit)
  }

  /**
   * Get bonus for a single tile
   */
  getTileBonus(tile: Tile): number {
    return this.providesBonus(tile) ? this.config.chipBonus : 0
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...DEFAULT_RED_FIVE_CONFIG }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global red five system instance
 */
export const redFiveSystem = new RedFiveSystem()
