/**
 * Tile System for Tensho Mahjong Roguelike
 *
 * Standard Riichi Mahjong set:
 * - 136 standard tiles (34 unique × 4 copies)
 * - 8 bonus tiles (4 Flowers + 4 Seasons)
 *
 * With modifier support:
 * - Enhancements (Marks): Bonus, Mult, Wild, Glass, Steel, Stone, Gold, Lucky
 * - Seals: Gold, Red, Blue, Purple
 * - Editions: Base, Foil, Holographic, Polychrome, Negative
 */

import {
  TileModifiers,
  EnhancementType,
  SealType,
  EditionType,
  DEFAULT_MODIFIERS,
  hasModifiers as checkHasModifiers,
  calculateModifierChips,
  calculateModifierMult,
  calculateModifierMultiplier,
  getRetriggers,
  isWild as checkIsWild,
  alwaysScores as checkAlwaysScores,
  canShatter as checkCanShatter,
  hasHeldEffect as checkHasHeldEffect,
  isLucky as checkIsLucky,
  formatModifiers,
  ENHANCEMENT_DEFINITIONS,
  SEAL_DEFINITIONS,
  EDITION_DEFINITIONS,
} from './TileModifier'

export enum TileSuit {
  Manzu = 'manzu', // Characters (萬子)
  Pinzu = 'pinzu', // Circles (筒子)
  Souzu = 'souzu', // Bamboo (索子)
  Wind = 'wind', // Winds (風牌)
  Dragon = 'dragon', // Dragons (三元牌)
  Flower = 'flower', // Bonus flowers
  Season = 'season', // Bonus seasons
}

export enum WindType {
  East = 1,
  South = 2,
  West = 3,
  North = 4,
}

export enum DragonType {
  White = 1, // 白 (Haku)
  Green = 2, // 發 (Hatsu)
  Red = 3, // 中 (Chun)
}

export enum FlowerType {
  Plum = 1, // 梅
  Orchid = 2, // 兰
  Chrysanthemum = 3, // 菊
  Bamboo = 4, // 竹
}

export enum SeasonType {
  Spring = 1, // 春
  Summer = 2, // 夏
  Autumn = 3, // 秋
  Winter = 4, // 冬
}

export interface TileData {
  suit: TileSuit
  rank: number // 1-9 for suited, 1-4 for winds, 1-3 for dragons, 1-4 for flowers/seasons
  id: string // Unique identifier for this specific tile instance
  isRed: boolean // For red fives (aka-dora)
  modifiers: TileModifiers // Enhancement, seal, and edition modifiers
}

/**
 * Immutable Tile class representing a single mahjong tile
 */
export class Tile implements TileData {
  readonly suit: TileSuit
  readonly rank: number
  readonly id: string
  readonly isRed: boolean
  readonly modifiers: TileModifiers

  constructor(
    suit: TileSuit,
    rank: number,
    id: string,
    isRed: boolean = false,
    modifiers: TileModifiers = { ...DEFAULT_MODIFIERS }
  ) {
    this.suit = suit
    this.rank = rank
    this.id = id
    this.isRed = isRed
    this.modifiers = modifiers
  }

  /**
   * Returns true if this is a terminal tile (1 or 9 of a suited tile)
   */
  get isTerminal(): boolean {
    return this.isSuited && (this.rank === 1 || this.rank === 9)
  }

  /**
   * Returns true if this is an honor tile (wind or dragon)
   */
  get isHonor(): boolean {
    return this.suit === TileSuit.Wind || this.suit === TileSuit.Dragon
  }

  /**
   * Returns true if this is a simple tile (2-8 of a suited tile)
   */
  get isSimple(): boolean {
    return this.isSuited && this.rank >= 2 && this.rank <= 8
  }

  /**
   * Returns true if this is a suited tile (manzu, pinzu, or souzu)
   */
  get isSuited(): boolean {
    return (
      this.suit === TileSuit.Manzu ||
      this.suit === TileSuit.Pinzu ||
      this.suit === TileSuit.Souzu
    )
  }

  /**
   * Returns true if this is a bonus tile (flower or season)
   */
  get isBonus(): boolean {
    return this.suit === TileSuit.Flower || this.suit === TileSuit.Season
  }

  /**
   * Returns true if this is a terminal or honor tile
   */
  get isTerminalOrHonor(): boolean {
    return this.isTerminal || this.isHonor
  }

  // ===========================================================================
  // MODIFIER PROPERTIES
  // ===========================================================================

  /**
   * Returns true if this tile has any modifiers (enhancement, seal, or edition)
   */
  get hasModifiers(): boolean {
    return checkHasModifiers(this.modifiers)
  }

  /**
   * Returns true if this tile is wild (counts as every suit)
   */
  get isWild(): boolean {
    return checkIsWild(this.modifiers)
  }

  /**
   * Returns true if this tile always scores (Stone mark)
   */
  get alwaysScores(): boolean {
    return checkAlwaysScores(this.modifiers)
  }

  /**
   * Returns true if this tile can shatter (Glass mark)
   */
  get canShatter(): boolean {
    return checkCanShatter(this.modifiers)
  }

  /**
   * Returns true if this tile has a held effect (Steel mark)
   */
  get hasHeldEffect(): boolean {
    return checkHasHeldEffect(this.modifiers)
  }

  /**
   * Returns true if this tile has lucky effect
   */
  get isLucky(): boolean {
    return checkIsLucky(this.modifiers)
  }

  /**
   * Get enhancement type
   */
  get enhancement(): EnhancementType {
    return this.modifiers.enhancement
  }

  /**
   * Get seal type
   */
  get seal(): SealType {
    return this.modifiers.seal
  }

  /**
   * Get edition type
   */
  get edition(): EditionType {
    return this.modifiers.edition
  }

  /**
   * Get chip bonus from modifiers
   */
  get modifierChips(): number {
    return calculateModifierChips(this.modifiers)
  }

  /**
   * Get additive mult bonus from modifiers
   */
  get modifierMult(): number {
    return calculateModifierMult(this.modifiers)
  }

  /**
   * Get multiplicative mult from modifiers
   */
  get modifierMultiplier(): number {
    return calculateModifierMultiplier(this.modifiers)
  }

  /**
   * Get number of retriggers from seal
   */
  get retriggers(): number {
    return getRetriggers(this.modifiers)
  }

  /**
   * Get formatted modifier string for display
   */
  get modifierDisplay(): string {
    return formatModifiers(this.modifiers)
  }

  /**
   * Get enhancement definition
   */
  get enhancementDef() {
    return ENHANCEMENT_DEFINITIONS[this.modifiers.enhancement]
  }

  /**
   * Get seal definition
   */
  get sealDef() {
    return SEAL_DEFINITIONS[this.modifiers.seal]
  }

  /**
   * Get edition definition
   */
  get editionDef() {
    return EDITION_DEFINITIONS[this.modifiers.edition]
  }

  // ===========================================================================
  // MODIFIER METHODS
  // ===========================================================================

  /**
   * Create a new tile with a specific enhancement
   */
  withEnhancement(enhancement: EnhancementType): Tile {
    return new Tile(this.suit, this.rank, this.id, this.isRed, {
      ...this.modifiers,
      enhancement,
    })
  }

  /**
   * Create a new tile with a specific seal
   */
  withSeal(seal: SealType): Tile {
    return new Tile(this.suit, this.rank, this.id, this.isRed, {
      ...this.modifiers,
      seal,
    })
  }

  /**
   * Create a new tile with a specific edition
   */
  withEdition(edition: EditionType): Tile {
    return new Tile(this.suit, this.rank, this.id, this.isRed, {
      ...this.modifiers,
      edition,
    })
  }

  /**
   * Create a new tile with all modifiers replaced
   */
  withModifiers(modifiers: Partial<TileModifiers>): Tile {
    return new Tile(this.suit, this.rank, this.id, this.isRed, {
      ...this.modifiers,
      ...modifiers,
    })
  }

  /**
   * Create a new tile with modifiers cleared
   */
  withoutModifiers(): Tile {
    return new Tile(this.suit, this.rank, this.id, this.isRed, { ...DEFAULT_MODIFIERS })
  }

  // ===========================================================================
  // MATCHING METHODS
  // ===========================================================================

  /**
   * Returns true if this tile matches another tile's suit and rank
   * Wild tiles match any suit
   */
  matches(other: Tile): boolean {
    // Wild tiles match any suit (but still need same rank for suited tiles)
    if (this.isWild || other.isWild) {
      if (this.isSuited && other.isSuited) {
        return this.rank === other.rank
      }
    }
    return this.suit === other.suit && this.rank === other.rank
  }

  /**
   * Returns true if this tile is exactly the same instance
   */
  equals(other: Tile): boolean {
    return this.id === other.id
  }

  /**
   * Get a unique key for this tile type (not instance)
   */
  get typeKey(): string {
    return `${this.suit}-${this.rank}`
  }

  /**
   * String representation for display
   * Format: rank + suit abbreviation (e.g., "5m", "3p", "7s", "Ew", "Dw")
   */
  toString(): string {
    const suitChar = this.getSuitChar()
    const redSuffix = this.isRed ? 'r' : ''

    if (this.suit === TileSuit.Wind) {
      const windNames = ['', 'E', 'S', 'W', 'N']
      return `${windNames[this.rank]}${suitChar}`
    }

    if (this.suit === TileSuit.Dragon) {
      const dragonNames = ['', 'W', 'G', 'R'] // White, Green, Red
      return `${dragonNames[this.rank]}${suitChar}`
    }

    if (this.suit === TileSuit.Flower) {
      const flowerNames = ['', 'Plum', 'Orchid', 'Chrys', 'Bamboo']
      return flowerNames[this.rank]
    }

    if (this.suit === TileSuit.Season) {
      const seasonNames = ['', 'Spring', 'Summer', 'Autumn', 'Winter']
      return seasonNames[this.rank]
    }

    return `${this.rank}${suitChar}${redSuffix}`
  }

  private getSuitChar(): string {
    switch (this.suit) {
      case TileSuit.Manzu:
        return 'm'
      case TileSuit.Pinzu:
        return 'p'
      case TileSuit.Souzu:
        return 's'
      case TileSuit.Wind:
        return 'w'
      case TileSuit.Dragon:
        return 'd'
      default:
        return ''
    }
  }

  /**
   * Compare tiles for sorting (by suit, then rank)
   */
  static compare(a: Tile, b: Tile): number {
    const suitOrder: TileSuit[] = [
      TileSuit.Manzu,
      TileSuit.Pinzu,
      TileSuit.Souzu,
      TileSuit.Wind,
      TileSuit.Dragon,
      TileSuit.Flower,
      TileSuit.Season,
    ]

    const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit)
    if (suitDiff !== 0) return suitDiff

    return a.rank - b.rank
  }

  /**
   * Create a copy of this tile with a new ID
   */
  clone(newId: string): Tile {
    return new Tile(this.suit, this.rank, newId, this.isRed, { ...this.modifiers })
  }
}

/**
 * Generate a unique tile ID
 */
let tileIdCounter = 0
export function generateTileId(): string {
  return `tile-${++tileIdCounter}-${Date.now()}`
}

/**
 * Reset tile ID counter (useful for testing)
 */
export function resetTileIdCounter(): void {
  tileIdCounter = 0
}

/**
 * Create a standard 136-tile Riichi Mahjong set (without bonus tiles)
 */
export function createStandardTileSet(): Tile[] {
  const tiles: Tile[] = []

  // Suited tiles: Manzu, Pinzu, Souzu (1-9, 4 copies each)
  const suitedSuits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]
  for (const suit of suitedSuits) {
    for (let rank = 1; rank <= 9; rank++) {
      for (let copy = 0; copy < 4; copy++) {
        // One red five per suit (copy index 0)
        const isRed = rank === 5 && copy === 0
        tiles.push(new Tile(suit, rank, generateTileId(), isRed))
      }
    }
  }

  // Wind tiles (East, South, West, North - 4 copies each)
  for (let rank = 1; rank <= 4; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push(new Tile(TileSuit.Wind, rank, generateTileId()))
    }
  }

  // Dragon tiles (White, Green, Red - 4 copies each)
  for (let rank = 1; rank <= 3; rank++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push(new Tile(TileSuit.Dragon, rank, generateTileId()))
    }
  }

  return tiles
}

/**
 * Create the 8 bonus tiles (4 flowers + 4 seasons)
 */
export function createBonusTileSet(): Tile[] {
  const tiles: Tile[] = []

  // Flowers
  for (let rank = 1; rank <= 4; rank++) {
    tiles.push(new Tile(TileSuit.Flower, rank, generateTileId()))
  }

  // Seasons
  for (let rank = 1; rank <= 4; rank++) {
    tiles.push(new Tile(TileSuit.Season, rank, generateTileId()))
  }

  return tiles
}

/**
 * Create a full 144-tile set (136 standard + 8 bonus)
 */
export function createFullTileSet(): Tile[] {
  return [...createStandardTileSet(), ...createBonusTileSet()]
}

/**
 * Count tiles by type
 */
export function countTilesByType(tiles: Tile[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const tile of tiles) {
    const key = tile.typeKey
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/**
 * Group tiles by suit
 */
export function groupTilesBySuit(tiles: Tile[]): Map<TileSuit, Tile[]> {
  const groups = new Map<TileSuit, Tile[]>()
  for (const tile of tiles) {
    const group = groups.get(tile.suit) ?? []
    group.push(tile)
    groups.set(tile.suit, group)
  }
  return groups
}

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

export {
  // Types
  TileModifiers,
  EnhancementType,
  SealType,
  EditionType,
  // Definitions
  EnhancementDefinition,
  SealDefinition,
  EditionDefinition,
  ENHANCEMENT_DEFINITIONS,
  SEAL_DEFINITIONS,
  EDITION_DEFINITIONS,
  DEFAULT_MODIFIERS,
  // Functions
  calculateModifierEffects,
  rollLuckyEffect,
  rollShatter,
  getAllEnhancements,
  getAllSeals,
  getSpecialEditions,
  getRandomEnhancement,
  getRandomSeal,
  getRandomEdition,
} from './TileModifier'
