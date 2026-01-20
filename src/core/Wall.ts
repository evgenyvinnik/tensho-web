/**
 * Wall System for Tensho Mahjong Roguelike
 *
 * The wall contains:
 * - 136 standard tiles (or 144 with bonus tiles)
 * - Dead wall of 14 tiles for kan replacement draws
 * - Dora indicators
 */

import {
  Tile,
  createStandardTileSet,
  createBonusTileSet,
  createFullTileSet,
} from './Tile'

/**
 * Seeded random number generator for deterministic shuffling
 */
export class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  /**
   * Get next random number between 0 and 1
   */
  next(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296
    return this.seed / 4294967296
  }

  /**
   * Get random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /**
   * Shuffle an array in place using Fisher-Yates
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i)
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
}

export interface WallState {
  tiles: Tile[]
  deadWall: Tile[]
  drawIndex: number
  deadWallDrawIndex: number
  doraIndicators: number // Number of revealed dora indicators
  seed: number
}

/**
 * The tile wall for a round of Mahjong
 */
export class Wall {
  private _tiles: Tile[]
  private _deadWall: Tile[]
  private _drawIndex: number
  private _deadWallDrawIndex: number
  private _doraIndicators: number
  private _seed: number
  private _rng: SeededRandom

  constructor(seed?: number, includeBonusTiles: boolean = false) {
    this._seed = seed ?? Date.now()
    this._rng = new SeededRandom(this._seed)
    this._drawIndex = 0
    this._deadWallDrawIndex = 0
    this._doraIndicators = 1

    // Create and shuffle tiles
    const allTiles = includeBonusTiles
      ? createFullTileSet()
      : createStandardTileSet()
    this._rng.shuffle(allTiles)

    // Separate dead wall (14 tiles from the end)
    this._deadWall = allTiles.splice(-14)
    this._tiles = allTiles
  }

  /**
   * Get remaining tiles in main wall
   */
  get remainingTiles(): number {
    return this._tiles.length - this._drawIndex
  }

  /**
   * Get remaining tiles in dead wall for kan draws
   */
  get remainingDeadWallDraws(): number {
    // First 4 tiles of dead wall are for kan replacement
    return Math.max(0, 4 - this._deadWallDrawIndex)
  }

  /**
   * Check if wall is empty
   */
  get isEmpty(): boolean {
    return this.remainingTiles <= 0
  }

  /**
   * Get current dora indicators
   */
  get doraIndicators(): Tile[] {
    // Dora indicators are at positions 4, 6, 8, 10, 12 of dead wall
    const indicators: Tile[] = []
    for (let i = 0; i < this._doraIndicators && i < 5; i++) {
      const index = 4 + i * 2
      if (index < this._deadWall.length) {
        indicators.push(this._deadWall[index])
      }
    }
    return indicators
  }

  /**
   * Get ura-dora indicators (revealed at end if riichi)
   */
  get uraDoraIndicators(): Tile[] {
    // Ura-dora are at positions 5, 7, 9, 11, 13 of dead wall
    const indicators: Tile[] = []
    for (let i = 0; i < this._doraIndicators && i < 5; i++) {
      const index = 5 + i * 2
      if (index < this._deadWall.length) {
        indicators.push(this._deadWall[index])
      }
    }
    return indicators
  }

  /**
   * Get the seed used for this wall
   */
  get seed(): number {
    return this._seed
  }

  /**
   * Draw a tile from the main wall
   */
  draw(): Tile | null {
    if (this.isEmpty) return null
    return this._tiles[this._drawIndex++]
  }

  /**
   * Draw multiple tiles from the main wall
   */
  drawMultiple(count: number): Tile[] {
    const tiles: Tile[] = []
    for (let i = 0; i < count; i++) {
      const tile = this.draw()
      if (!tile) break
      tiles.push(tile)
    }
    return tiles
  }

  /**
   * Draw a replacement tile from dead wall (for kan or bonus tile)
   */
  drawFromDeadWall(): Tile | null {
    if (this._deadWallDrawIndex >= 4) return null
    const tile = this._deadWall[this._deadWallDrawIndex++]

    // Reveal additional dora indicator after kan
    if (this._doraIndicators < 5) {
      this._doraIndicators++
    }

    return tile
  }

  /**
   * Peek at the next tile without drawing
   */
  peek(): Tile | null {
    if (this.isEmpty) return null
    return this._tiles[this._drawIndex]
  }

  /**
   * Peek at multiple upcoming tiles
   */
  peekMultiple(count: number): Tile[] {
    const tiles: Tile[] = []
    for (let i = 0; i < count && this._drawIndex + i < this._tiles.length; i++) {
      tiles.push(this._tiles[this._drawIndex + i])
    }
    return tiles
  }

  /**
   * Get state for serialization
   */
  toState(): WallState {
    return {
      tiles: [...this._tiles],
      deadWall: [...this._deadWall],
      drawIndex: this._drawIndex,
      deadWallDrawIndex: this._deadWallDrawIndex,
      doraIndicators: this._doraIndicators,
      seed: this._seed,
    }
  }

  /**
   * Create from state
   */
  static fromState(state: WallState): Wall {
    const wall = Object.create(Wall.prototype) as Wall
    wall._tiles = [...state.tiles]
    wall._deadWall = [...state.deadWall]
    wall._drawIndex = state.drawIndex
    wall._deadWallDrawIndex = state.deadWallDrawIndex
    wall._doraIndicators = state.doraIndicators
    wall._seed = state.seed
    wall._rng = new SeededRandom(state.seed)
    return wall
  }

  /**
   * Create a wall with specific tiles (for testing)
   */
  static createWithTiles(tiles: Tile[], deadWall?: Tile[]): Wall {
    const wall = Object.create(Wall.prototype) as Wall
    wall._tiles = [...tiles]
    wall._deadWall = deadWall ?? []
    wall._drawIndex = 0
    wall._deadWallDrawIndex = 0
    wall._doraIndicators = 1
    wall._seed = 0
    wall._rng = new SeededRandom(0)
    return wall
  }
}

/**
 * Calculate the actual dora tile from an indicator
 * The dora is the next tile in sequence
 */
export function getDoraFromIndicator(indicator: Tile): {
  suit: typeof indicator.suit
  rank: number
} {
  const { suit, rank } = indicator

  // For suited tiles, next rank (9 wraps to 1)
  if (indicator.isSuited) {
    return { suit, rank: rank === 9 ? 1 : rank + 1 }
  }

  // For winds: East -> South -> West -> North -> East
  if (suit === 'wind') {
    return { suit, rank: rank === 4 ? 1 : rank + 1 }
  }

  // For dragons: White -> Green -> Red -> White
  if (suit === 'dragon') {
    return { suit, rank: rank === 3 ? 1 : rank + 1 }
  }

  return { suit, rank }
}

/**
 * Check if a tile is a dora based on indicators
 */
export function isDora(tile: Tile, indicators: Tile[]): boolean {
  for (const indicator of indicators) {
    const dora = getDoraFromIndicator(indicator)
    if (tile.suit === dora.suit && tile.rank === dora.rank) {
      return true
    }
  }
  return false
}

/**
 * Count dora in a set of tiles
 */
export function countDora(tiles: Tile[], indicators: Tile[]): number {
  return tiles.filter((t) => isDora(t, indicators)).length
}
