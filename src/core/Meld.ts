/**
 * Meld System for Tensho Mahjong Roguelike
 *
 * A meld is a set of tiles that form a valid group:
 * - Sequence (Shuntsu): 3 consecutive tiles of the same suit
 * - Triplet (Koutsu): 3 identical tiles
 * - Quad (Kantsu): 4 identical tiles
 * - Pair (Toitsu): 2 identical tiles (only one per hand, or 7 for Seven Pairs)
 * - Straight: 4 or 5 consecutive tiles of one suit. Tensho's own shape for
 *   tactical plays; a complete Mahjong hand never contains one.
 * - Honors: one of every Dragon, or one of every Wind. Tensho's secret shape
 *   for tactical plays; a complete Mahjong hand never contains one either.
 */

import { Tile, TileSuit } from './Tile'

export enum MeldType {
  Sequence = 'sequence', // Shuntsu (順子)
  Triplet = 'triplet', // Koutsu (刻子)
  Quad = 'quad', // Kantsu (槓子)
  Pair = 'pair', // Toitsu (対子)
  Straight = 'straight', // 4–5 consecutive tiles of one suit (連)
  Honors = 'honors', // Every Dragon (三元) or every Wind (四喜), one of each
}

/** The ranks an Honors group of this suit holds; none outside the honors. */
export function honorSetRanks(suit: TileSuit): readonly number[] {
  if (suit === TileSuit.Dragon) return [1, 2, 3]
  if (suit === TileSuit.Wind) return [1, 2, 3, 4]
  return []
}

export interface MeldData {
  type: MeldType
  tiles: Tile[]
  isConcealed: boolean
  isCalledKan?: boolean // For quads: was it declared (kan)?
}

/**
 * Represents a valid meld of tiles
 */
export class Meld implements MeldData {
  readonly type: MeldType
  readonly tiles: Tile[]
  readonly isConcealed: boolean
  readonly isCalledKan: boolean

  constructor(
    type: MeldType,
    tiles: Tile[],
    isConcealed: boolean = true,
    isCalledKan: boolean = false
  ) {
    this.type = type
    // Runs read low to high even when a Wild tile of another printed suit
    // fills one rank; every other group keeps the usual suit-then-rank order.
    const isRun = type === MeldType.Sequence || type === MeldType.Straight
    this.tiles = [...tiles].sort((a, b) =>
      isRun ? a.rank - b.rank || Tile.compare(a, b) : Tile.compare(a, b)
    )
    this.isConcealed = isConcealed
    this.isCalledKan = isCalledKan
  }

  /**
   * Get the suit of this meld (all tiles in a meld share the same suit; a
   * Wild tile takes the suit of the others)
   */
  get suit(): TileSuit {
    return Tile.groupSuit(this.tiles)
  }

  /**
   * Get the lowest rank in this meld
   */
  get lowestRank(): number {
    return Math.min(...this.tiles.map((t) => t.rank))
  }

  /**
   * Get the highest rank in this meld
   */
  get highestRank(): number {
    return Math.max(...this.tiles.map((t) => t.rank))
  }

  /**
   * Check if this meld contains any terminal tiles
   */
  get hasTerminal(): boolean {
    return this.tiles.some((t) => t.isTerminal)
  }

  /**
   * Check if this meld contains any honor tiles
   */
  get hasHonor(): boolean {
    return this.tiles.some((t) => t.isHonor)
  }

  /**
   * Check if all tiles in this meld are terminals
   */
  get isAllTerminals(): boolean {
    return this.tiles.every((t) => t.isTerminal)
  }

  /**
   * Check if all tiles in this meld are honors
   */
  get isAllHonors(): boolean {
    return this.tiles.every((t) => t.isHonor)
  }

  /**
   * Check if this meld contains any terminal or honor tiles
   */
  get hasTerminalOrHonor(): boolean {
    return this.tiles.some((t) => t.isTerminalOrHonor)
  }

  /**
   * Check if all tiles are simples (2-8)
   */
  get isAllSimples(): boolean {
    return this.tiles.every((t) => t.isSimple)
  }

  /**
   * Get a unique key for this meld type (for comparison)
   */
  get typeKey(): string {
    if (this.type === MeldType.Sequence || this.type === MeldType.Straight) {
      const prefix = this.type === MeldType.Sequence ? 'seq' : 'straight'
      return `${prefix}-${this.suit}-${this.tiles.map((tile) => tile.rank).join('-')}`
    }
    return `${this.type}-${this.suit}-${this.tiles[0].rank}`
  }

  /**
   * String representation
   */
  toString(): string {
    const concealed = this.isConcealed ? '' : '*'
    const tileStr = this.tiles.map((t) => t.toString()).join('')
    return `[${tileStr}]${concealed}`
  }

  /**
   * Check if tiles can form a valid sequence
   */
  static canFormSequence(tiles: Tile[]): boolean {
    if (tiles.length !== 3) return false

    // Must all be the same suited suit; Wild tiles count as every suit
    if (!Tile.shareSuit(tiles)) return false

    // Must be consecutive ranks
    const ranks = tiles.map((t) => t.rank).sort((a, b) => a - b)
    return ranks[1] === ranks[0] + 1 && ranks[2] === ranks[1] + 1
  }

  /**
   * Check if tiles can form a straight: 4 or 5 consecutive ranks of one suit
   */
  static canFormStraight(tiles: Tile[]): boolean {
    if (tiles.length < 4 || tiles.length > 5) return false
    if (!Tile.shareSuit(tiles)) return false
    const ranks = tiles.map((t) => t.rank).sort((a, b) => a - b)
    return ranks.every((rank, i) => i === 0 || rank === ranks[i - 1] + 1)
  }

  /**
   * Check if tiles can form a valid triplet
   */
  static canFormTriplet(tiles: Tile[]): boolean {
    if (tiles.length !== 3) return false
    return Tile.shareFace(tiles)
  }

  /**
   * Check if tiles can form a valid quad
   */
  static canFormQuad(tiles: Tile[]): boolean {
    if (tiles.length !== 4) return false
    return Tile.shareFace(tiles)
  }

  /**
   * Check if tiles can form a valid pair
   */
  static canFormPair(tiles: Tile[]): boolean {
    if (tiles.length !== 2) return false
    return Tile.shareFace(tiles)
  }

  /**
   * Try to create a meld from tiles, returns null if invalid
   */
  static tryCreate(tiles: Tile[], isConcealed: boolean = true): Meld | null {
    if (Meld.canFormPair(tiles)) {
      return new Meld(MeldType.Pair, tiles, isConcealed)
    }
    if (Meld.canFormTriplet(tiles)) {
      return new Meld(MeldType.Triplet, tiles, isConcealed)
    }
    if (Meld.canFormSequence(tiles)) {
      return new Meld(MeldType.Sequence, tiles, isConcealed)
    }
    if (Meld.canFormQuad(tiles)) {
      return new Meld(MeldType.Quad, tiles, isConcealed)
    }
    return null
  }

  /**
   * Create a sequence from starting tile
   */
  static createSequence(
    tiles: Tile[],
    isConcealed: boolean = true
  ): Meld | null {
    if (!Meld.canFormSequence(tiles)) return null
    return new Meld(MeldType.Sequence, tiles, isConcealed)
  }

  /**
   * Create a triplet
   */
  static createTriplet(
    tiles: Tile[],
    isConcealed: boolean = true
  ): Meld | null {
    if (!Meld.canFormTriplet(tiles)) return null
    return new Meld(MeldType.Triplet, tiles, isConcealed)
  }

  /**
   * Create a quad
   */
  static createQuad(
    tiles: Tile[],
    isConcealed: boolean = true,
    isCalledKan: boolean = false
  ): Meld | null {
    if (!Meld.canFormQuad(tiles)) return null
    return new Meld(MeldType.Quad, tiles, isConcealed, isCalledKan)
  }

  /**
   * Create a pair
   */
  static createPair(tiles: Tile[], isConcealed: boolean = true): Meld | null {
    if (!Meld.canFormPair(tiles)) return null
    return new Meld(MeldType.Pair, tiles, isConcealed)
  }
}

/**
 * Find all possible sequences that can be formed with a given tile
 */
export function findPossibleSequences(
  tile: Tile,
  availableTiles: Tile[]
): Tile[][] {
  if (!tile.isSuited) return []

  const results: Tile[][] = []
  const sameSuit = availableTiles.filter(
    (t) => t.suit === tile.suit && !t.equals(tile)
  )

  // Try tile as first in sequence (tile, tile+1, tile+2)
  if (tile.rank <= 7) {
    const second = sameSuit.find((t) => t.rank === tile.rank + 1)
    const third = sameSuit.find((t) => t.rank === tile.rank + 2)
    if (second && third) {
      results.push([tile, second, third])
    }
  }

  // Try tile as middle in sequence (tile-1, tile, tile+1)
  if (tile.rank >= 2 && tile.rank <= 8) {
    const first = sameSuit.find((t) => t.rank === tile.rank - 1)
    const third = sameSuit.find((t) => t.rank === tile.rank + 1)
    if (first && third) {
      results.push([first, tile, third])
    }
  }

  // Try tile as last in sequence (tile-2, tile-1, tile)
  if (tile.rank >= 3) {
    const first = sameSuit.find((t) => t.rank === tile.rank - 2)
    const second = sameSuit.find((t) => t.rank === tile.rank - 1)
    if (first && second) {
      results.push([first, second, tile])
    }
  }

  return results
}

/**
 * Find all possible triplets that can be formed with a given tile
 */
export function findPossibleTriplets(
  tile: Tile,
  availableTiles: Tile[]
): Tile[][] {
  const matching = availableTiles.filter(
    (t) => t.matches(tile) && !t.equals(tile)
  )
  if (matching.length < 2) return []

  // Return one triplet with the first two matching tiles
  return [[tile, matching[0], matching[1]]]
}

/**
 * Find all possible pairs that can be formed with a given tile
 */
export function findPossiblePairs(
  tile: Tile,
  availableTiles: Tile[]
): Tile[][] {
  const matching = availableTiles.find(
    (t) => t.matches(tile) && !t.equals(tile)
  )
  if (!matching) return []
  return [[tile, matching]]
}
