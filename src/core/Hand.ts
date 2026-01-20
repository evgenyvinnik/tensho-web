/**
 * Hand System for Tensho Mahjong Roguelike
 *
 * A hand consists of:
 * - 13-14 tiles in the concealed portion
 * - 0-4 declared melds (open or concealed kans)
 * - Bonus tiles collected (flowers/seasons)
 */

import { Tile, TileSuit, countTilesByType } from './Tile'
import { Meld, MeldType } from './Meld'

export interface HandState {
  tiles: Tile[] // Concealed tiles in hand
  declaredMelds: Meld[] // Open melds or concealed kans
  bonusTiles: Tile[] // Collected flowers and seasons
  drawnTile: Tile | null // The most recently drawn tile (14th tile)
}

/**
 * Represents a player's hand in Mahjong
 */
export class Hand {
  private _tiles: Tile[]
  private _declaredMelds: Meld[]
  private _bonusTiles: Tile[]
  private _drawnTile: Tile | null

  constructor(
    tiles: Tile[] = [],
    declaredMelds: Meld[] = [],
    bonusTiles: Tile[] = []
  ) {
    this._tiles = [...tiles]
    this._declaredMelds = [...declaredMelds]
    this._bonusTiles = [...bonusTiles]
    this._drawnTile = null
  }

  /**
   * Get all concealed tiles (sorted)
   */
  get tiles(): Tile[] {
    return [...this._tiles].sort(Tile.compare)
  }

  /**
   * Get all tiles including the drawn tile
   */
  get allTiles(): Tile[] {
    const all = [...this._tiles]
    if (this._drawnTile) {
      all.push(this._drawnTile)
    }
    return all.sort(Tile.compare)
  }

  /**
   * Get declared melds
   */
  get declaredMelds(): Meld[] {
    return [...this._declaredMelds]
  }

  /**
   * Get bonus tiles
   */
  get bonusTiles(): Tile[] {
    return [...this._bonusTiles]
  }

  /**
   * Get the most recently drawn tile
   */
  get drawnTile(): Tile | null {
    return this._drawnTile
  }

  /**
   * Get total tile count (including melds)
   */
  get tileCount(): number {
    const meldTileCount = this._declaredMelds.reduce(
      (sum, m) => sum + m.tiles.length,
      0
    )
    return this._tiles.length + (this._drawnTile ? 1 : 0) + meldTileCount
  }

  /**
   * Get concealed tile count
   */
  get concealedTileCount(): number {
    return this._tiles.length + (this._drawnTile ? 1 : 0)
  }

  /**
   * Check if the hand is fully concealed (no open melds)
   */
  get isConcealed(): boolean {
    return this._declaredMelds.every((m) => m.isConcealed)
  }

  /**
   * Check if hand has 14 tiles (ready to discard or declare win)
   */
  get hasDrawnTile(): boolean {
    return this._drawnTile !== null
  }

  /**
   * Add a tile to the hand
   */
  addTile(tile: Tile): void {
    if (tile.isBonus) {
      this._bonusTiles.push(tile)
    } else if (this._drawnTile === null) {
      this._drawnTile = tile
    } else {
      // Merge drawn tile into hand and set new drawn tile
      this._tiles.push(this._drawnTile)
      this._drawnTile = tile
    }
  }

  /**
   * Draw a tile (sets it as the drawn tile)
   */
  drawTile(tile: Tile): boolean {
    if (tile.isBonus) {
      this._bonusTiles.push(tile)
      return false // Indicates bonus tile was drawn, need replacement
    }

    if (this._drawnTile !== null) {
      this._tiles.push(this._drawnTile)
    }
    this._drawnTile = tile
    return true
  }

  /**
   * Remove a tile by ID
   */
  removeTileById(tileId: string): Tile | null {
    // Check drawn tile first
    if (this._drawnTile?.id === tileId) {
      const tile = this._drawnTile
      this._drawnTile = null
      return tile
    }

    // Check hand tiles
    const index = this._tiles.findIndex((t) => t.id === tileId)
    if (index !== -1) {
      const [tile] = this._tiles.splice(index, 1)
      return tile
    }

    return null
  }

  /**
   * Discard a tile and merge drawn tile into hand
   */
  discard(tileId: string): Tile | null {
    const discarded = this.removeTileById(tileId)

    // If we discarded from hand (not drawn tile), merge drawn tile
    if (discarded && this._drawnTile && discarded.id !== this._drawnTile.id) {
      // This case shouldn't happen in normal play, but handle it
    } else if (this._drawnTile && discarded?.id !== this._drawnTile.id) {
      // Discarded from hand, merge drawn tile
      this._tiles.push(this._drawnTile)
      this._drawnTile = null
    }

    return discarded
  }

  /**
   * Declare a meld from hand tiles
   */
  declareMeld(tileIds: string[], isConcealed: boolean = false): Meld | null {
    // Collect tiles from hand
    const tiles: Tile[] = []
    for (const id of tileIds) {
      const tile = this.allTiles.find((t) => t.id === id)
      if (!tile) return null
      tiles.push(tile)
    }

    // Try to create a meld
    const meld = Meld.tryCreate(tiles, isConcealed)
    if (!meld) return null

    // Remove tiles from hand
    for (const id of tileIds) {
      this.removeTileById(id)
    }

    this._declaredMelds.push(meld)
    return meld
  }

  /**
   * Sort the hand tiles
   */
  sort(): void {
    this._tiles.sort(Tile.compare)
  }

  /**
   * Get tile counts by type
   */
  getTileCounts(): Map<string, number> {
    return countTilesByType(this.allTiles)
  }

  /**
   * Get tiles of a specific suit
   */
  getTilesBySuit(suit: TileSuit): Tile[] {
    return this.allTiles.filter((t) => t.suit === suit)
  }

  /**
   * Find tiles matching a specific tile type
   */
  findMatchingTiles(tile: Tile): Tile[] {
    return this.allTiles.filter((t) => t.matches(tile))
  }

  /**
   * Check if hand contains a specific tile type
   */
  containsTileType(suit: TileSuit, rank: number): boolean {
    return this.allTiles.some((t) => t.suit === suit && t.rank === rank)
  }

  /**
   * Get the number of each unique tile type
   */
  getUniqueTileCounts(): Map<string, { tile: Tile; count: number }> {
    const counts = new Map<string, { tile: Tile; count: number }>()
    for (const tile of this.allTiles) {
      const key = tile.typeKey
      const existing = counts.get(key)
      if (existing) {
        existing.count++
      } else {
        counts.set(key, { tile, count: 1 })
      }
    }
    return counts
  }

  /**
   * Clone the hand
   */
  clone(): Hand {
    const hand = new Hand(
      [...this._tiles],
      this._declaredMelds.map(
        (m) => new Meld(m.type, [...m.tiles], m.isConcealed, m.isCalledKan)
      ),
      [...this._bonusTiles]
    )
    hand._drawnTile = this._drawnTile
    return hand
  }

  /**
   * Get state for serialization
   */
  toState(): HandState {
    return {
      tiles: [...this._tiles],
      declaredMelds: [...this._declaredMelds],
      bonusTiles: [...this._bonusTiles],
      drawnTile: this._drawnTile,
    }
  }

  /**
   * Create from state
   */
  static fromState(state: HandState): Hand {
    const hand = new Hand(state.tiles, state.declaredMelds, state.bonusTiles)
    hand._drawnTile = state.drawnTile
    return hand
  }

  /**
   * String representation
   */
  toString(): string {
    const handStr = this.tiles.map((t) => t.toString()).join(' ')
    const drawnStr = this._drawnTile ? ` | ${this._drawnTile.toString()}` : ''
    const meldsStr =
      this._declaredMelds.length > 0
        ? ` [${this._declaredMelds.map((m) => m.toString()).join(' ')}]`
        : ''
    const bonusStr =
      this._bonusTiles.length > 0
        ? ` (${this._bonusTiles.map((t) => t.toString()).join(' ')})`
        : ''
    return `${handStr}${drawnStr}${meldsStr}${bonusStr}`
  }
}

/**
 * A parsed hand structure for scoring
 */
export interface ParsedHand {
  melds: Meld[] // All melds (4 groups for standard hand)
  pair: Meld // The pair
  waitType: WaitType
  winningTile: Tile
  isConcealed: boolean
}

export enum WaitType {
  Ryanmen = 'ryanmen', // Two-sided wait (e.g., 23 waiting for 1 or 4)
  Kanchan = 'kanchan', // Middle wait (e.g., 13 waiting for 2)
  Penchan = 'penchan', // Edge wait (e.g., 12 waiting for 3, or 89 waiting for 7)
  Shanpon = 'shanpon', // Pair wait (e.g., two pairs, waiting for triplet)
  Tanki = 'tanki', // Single wait (pair wait)
}
