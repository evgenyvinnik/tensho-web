/**
 * DeadPool (Discard Pile) System for Tensho Mahjong Roguelike
 *
 * Tracks discarded tiles that cannot be redrawn.
 * In single-player Tensho, this represents tiles removed from play.
 */

import { Tile, TileSuit, countTilesByType } from './Tile'

export interface DeadPoolState {
  discards: Tile[]
}

/**
 * The discard pile / dead pool
 */
export class DeadPool {
  private _discards: Tile[]

  constructor(discards: Tile[] = []) {
    this._discards = [...discards]
  }

  /**
   * Get all discarded tiles
   */
  get discards(): Tile[] {
    return [...this._discards]
  }

  /**
   * Get discard count
   */
  get count(): number {
    return this._discards.length
  }

  /**
   * Add a tile to the discard pile
   */
  add(tile: Tile): void {
    this._discards.push(tile)
  }

  /**
   * Add multiple tiles to the discard pile
   */
  addMultiple(tiles: Tile[]): void {
    this._discards.push(...tiles)
  }

  /**
   * Get the last discarded tile
   */
  getLastDiscard(): Tile | null {
    return this._discards.length > 0
      ? this._discards[this._discards.length - 1]
      : null
  }

  /**
   * Get the last N discarded tiles
   */
  getLastDiscards(count: number): Tile[] {
    return this._discards.slice(-count)
  }

  /**
   * Check if a specific tile type has been discarded
   */
  hasDiscarded(suit: TileSuit, rank: number): boolean {
    return this._discards.some((t) => t.suit === suit && t.rank === rank)
  }

  /**
   * Count how many of a specific tile type have been discarded
   */
  countDiscarded(suit: TileSuit, rank: number): number {
    return this._discards.filter((t) => t.suit === suit && t.rank === rank)
      .length
  }

  /**
   * Get tiles discarded of a specific suit
   */
  getDiscardsBySuit(suit: TileSuit): Tile[] {
    return this._discards.filter((t) => t.suit === suit)
  }

  /**
   * Get discard counts by type
   */
  getDiscardCounts(): Map<string, number> {
    return countTilesByType(this._discards)
  }

  /**
   * Check if a tile is "safe" (all 4 copies discarded)
   */
  isFullyDiscarded(suit: TileSuit, rank: number): boolean {
    return this.countDiscarded(suit, rank) >= 4
  }

  /**
   * Get all fully discarded tile types
   */
  getFullyDiscardedTypes(): Array<{ suit: TileSuit; rank: number }> {
    const counts = this.getDiscardCounts()
    const fullyDiscarded: Array<{ suit: TileSuit; rank: number }> = []

    for (const [key, count] of counts) {
      if (count >= 4) {
        const [suit, rank] = key.split('-')
        fullyDiscarded.push({ suit: suit as TileSuit, rank: parseInt(rank) })
      }
    }

    return fullyDiscarded
  }

  /**
   * Remove and return the last discarded tile (for special effects)
   */
  retrieveLastDiscard(): Tile | null {
    return this._discards.pop() ?? null
  }

  /**
   * Clear all discards (for new round)
   */
  clear(): void {
    this._discards = []
  }

  /**
   * Get state for serialization
   */
  toState(): DeadPoolState {
    return {
      discards: [...this._discards],
    }
  }

  /**
   * Create from state
   */
  static fromState(state: DeadPoolState): DeadPool {
    return new DeadPool(state.discards)
  }

  /**
   * String representation (last 6 discards)
   */
  toString(): string {
    const recent = this.getLastDiscards(6)
    const recentStr = recent.map((t) => t.toString()).join(' ')
    const moreCount = this._discards.length - recent.length
    const moreStr = moreCount > 0 ? `(+${moreCount} more) ` : ''
    return `${moreStr}${recentStr}`
  }
}
