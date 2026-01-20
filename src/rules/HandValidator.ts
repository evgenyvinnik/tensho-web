/**
 * Hand Validator for Tensho Mahjong Roguelike
 *
 * Validates hand structures:
 * - Standard form: 4 melds + 1 pair (14 tiles)
 * - Seven Pairs (Chiitoitsu): 7 distinct pairs
 * - Thirteen Orphans (Kokushi Musou): All terminals and honors + 1 duplicate
 */

import { Tile, TileSuit } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { Hand, ParsedHand, WaitType } from '../core/Hand'

/**
 * Result of hand validation
 */
export interface ValidationResult {
  isComplete: boolean
  isSevenPairs: boolean
  isKokushi: boolean
  isStandardForm: boolean
  parsedHands: ParsedHand[] // Multiple ways to parse the same hand
  errors: string[]
}

/**
 * The 13 terminal and honor tile types for Kokushi
 */
const KOKUSHI_TILES: Array<{ suit: TileSuit; rank: number }> = [
  { suit: TileSuit.Manzu, rank: 1 },
  { suit: TileSuit.Manzu, rank: 9 },
  { suit: TileSuit.Pinzu, rank: 1 },
  { suit: TileSuit.Pinzu, rank: 9 },
  { suit: TileSuit.Souzu, rank: 1 },
  { suit: TileSuit.Souzu, rank: 9 },
  { suit: TileSuit.Wind, rank: 1 }, // East
  { suit: TileSuit.Wind, rank: 2 }, // South
  { suit: TileSuit.Wind, rank: 3 }, // West
  { suit: TileSuit.Wind, rank: 4 }, // North
  { suit: TileSuit.Dragon, rank: 1 }, // White
  { suit: TileSuit.Dragon, rank: 2 }, // Green
  { suit: TileSuit.Dragon, rank: 3 }, // Red
]

/**
 * Get a tile type key for comparison
 */
function getTileTypeKey(suit: TileSuit, rank: number): string {
  return `${suit}-${rank}`
}

/**
 * Count tiles by type from an array of tiles
 */
function countByType(tiles: Tile[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const tile of tiles) {
    const key = tile.typeKey
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/**
 * Check if hand forms valid Seven Pairs (Chiitoitsu)
 * Requirements:
 * - Exactly 14 tiles
 * - 7 distinct pairs (no quads allowed)
 */
export function isSevenPairs(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false

  const counts = countByType(tiles)

  // Must have exactly 7 distinct tile types, each with exactly 2 copies
  if (counts.size !== 7) return false

  for (const count of counts.values()) {
    if (count !== 2) return false
  }

  return true
}

/**
 * Check if hand forms valid Thirteen Orphans (Kokushi Musou)
 * Requirements:
 * - Exactly 14 tiles
 * - One of each terminal and honor (13 unique types)
 * - One duplicate of any terminal or honor
 */
export function isKokushi(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false

  const counts = countByType(tiles)

  // Check that we have all 13 kokushi tiles
  for (const kt of KOKUSHI_TILES) {
    const key = getTileTypeKey(kt.suit, kt.rank)
    if (!counts.has(key)) return false
  }

  // Verify total is 14 tiles and only terminals/honors
  let total = 0
  for (const [key, count] of counts) {
    // Verify this is a terminal or honor
    const isKokushiTile = KOKUSHI_TILES.some(
      (kt) => getTileTypeKey(kt.suit, kt.rank) === key
    )
    if (!isKokushiTile) return false
    total += count
  }

  // Should be exactly 14 tiles (13 unique + 1 duplicate)
  return total === 14
}

/**
 * Try to parse tiles into 4 melds + 1 pair (standard form)
 * Returns all possible valid parsings
 */
export function parseStandardForm(
  tiles: Tile[],
  declaredMelds: Meld[] = [],
  winningTile?: Tile
): ParsedHand[] {
  const results: ParsedHand[] = []

  // Calculate how many melds we still need to find
  const neededMelds = 4 - declaredMelds.length

  // Find all valid decompositions
  const decompositions = findDecompositions(tiles, neededMelds)

  for (const decomposition of decompositions) {
    const { melds, pair } = decomposition

    // Combine with declared melds
    const allMelds = [...declaredMelds, ...melds]

    // Determine wait type if we have a winning tile
    const waitType = winningTile
      ? determineWaitType(decomposition, winningTile)
      : WaitType.Ryanmen

    // Check if hand is concealed
    const isConcealed = declaredMelds.every((m) => m.isConcealed)

    results.push({
      melds: allMelds,
      pair,
      waitType,
      winningTile: winningTile ?? tiles[0], // Default to first tile if not specified
      isConcealed,
    })
  }

  return results
}

/**
 * Internal structure for decomposition results
 */
interface Decomposition {
  melds: Meld[]
  pair: Meld
}

/**
 * Find all valid decompositions of tiles into melds and a pair
 */
function findDecompositions(
  tiles: Tile[],
  neededMelds: number
): Decomposition[] {
  const results: Decomposition[] = []

  // Get tile counts
  const counts = new Map<string, Tile[]>()
  for (const tile of tiles) {
    const key = tile.typeKey
    const group = counts.get(key) ?? []
    group.push(tile)
    counts.set(key, group)
  }

  // Try each possible pair
  for (const [, tileGroup] of counts) {
    if (tileGroup.length >= 2) {
      // Create a pair with first two tiles
      const pairTiles = tileGroup.slice(0, 2)
      const pair = new Meld(MeldType.Pair, pairTiles, true)

      // Remove pair tiles and try to form melds with the rest
      const remaining = removeTiles(tiles, pairTiles)
      const meldResults = findMelds(remaining, neededMelds)

      for (const melds of meldResults) {
        results.push({ melds, pair })
      }
    }
  }

  return results
}

/**
 * Remove specific tiles from an array (by id)
 */
function removeTiles(tiles: Tile[], toRemove: Tile[]): Tile[] {
  const result = [...tiles]
  for (const tile of toRemove) {
    const index = result.findIndex((t) => t.id === tile.id)
    if (index !== -1) {
      result.splice(index, 1)
    }
  }
  return result
}

/**
 * Find all ways to decompose tiles into exactly N melds
 */
function findMelds(tiles: Tile[], count: number): Meld[][] {
  if (count === 0) {
    return tiles.length === 0 ? [[]] : []
  }

  if (tiles.length < count * 3) {
    return []
  }

  const results: Meld[][] = []
  const sortedTiles = [...tiles].sort(Tile.compare)

  // Try to form a meld starting with the first tile
  const firstTile = sortedTiles[0]
  const remaining = sortedTiles.slice(1)

  // Try triplet first
  const matchingTiles = remaining.filter((t) => t.matches(firstTile))
  if (matchingTiles.length >= 2) {
    const tripletTiles = [firstTile, matchingTiles[0], matchingTiles[1]]
    const triplet = new Meld(MeldType.Triplet, tripletTiles, true)
    const afterTriplet = removeTiles(sortedTiles, tripletTiles)
    const subResults = findMelds(afterTriplet, count - 1)
    for (const sub of subResults) {
      results.push([triplet, ...sub])
    }
  }

  // Try sequence (only for suited tiles)
  if (firstTile.isSuited && firstTile.rank <= 7) {
    const second = remaining.find(
      (t) => t.suit === firstTile.suit && t.rank === firstTile.rank + 1
    )
    const third = remaining.find(
      (t) =>
        t.suit === firstTile.suit &&
        t.rank === firstTile.rank + 2 &&
        (!second || t.id !== second.id)
    )

    if (second && third) {
      const sequenceTiles = [firstTile, second, third]
      const sequence = new Meld(MeldType.Sequence, sequenceTiles, true)
      const afterSequence = removeTiles(sortedTiles, sequenceTiles)
      const subResults = findMelds(afterSequence, count - 1)
      for (const sub of subResults) {
        results.push([sequence, ...sub])
      }
    }
  }

  return results
}

/**
 * Determine the wait type based on how the winning tile completes the hand
 */
function determineWaitType(
  decomposition: Decomposition,
  winningTile: Tile
): WaitType {
  // Check if winning tile completed the pair
  if (decomposition.pair.tiles.some((t) => t.id === winningTile.id)) {
    return WaitType.Tanki
  }

  // Find which meld contains the winning tile
  for (const meld of decomposition.melds) {
    if (!meld.tiles.some((t) => t.id === winningTile.id)) continue

    if (meld.type === MeldType.Triplet) {
      return WaitType.Shanpon
    }

    if (meld.type === MeldType.Sequence) {
      const ranks = meld.tiles.map((t) => t.rank).sort((a, b) => a - b)
      const winRank = winningTile.rank

      // Middle tile = kanchan
      if (winRank === ranks[1]) {
        return WaitType.Kanchan
      }

      // Edge wait: 123 waiting on 3, or 789 waiting on 7
      if (
        (ranks[0] === 1 && winRank === 3) ||
        (ranks[2] === 9 && winRank === 7)
      ) {
        return WaitType.Penchan
      }

      // Otherwise it's a two-sided wait
      return WaitType.Ryanmen
    }
  }

  return WaitType.Ryanmen
}

/**
 * Validate if a hand is complete (can declare a win)
 */
export function validateHand(hand: Hand, winningTile?: Tile): ValidationResult {
  const tiles = hand.allTiles
  const declaredMelds = hand.declaredMelds
  const errors: string[] = []

  // Check tile count
  const totalTiles =
    tiles.length + declaredMelds.reduce((sum, m) => sum + m.tiles.length, 0)

  if (totalTiles !== 14) {
    errors.push(`Invalid tile count: ${totalTiles} (expected 14)`)
  }

  // Check for bonus tiles in hand (they should be separated)
  const bonusTiles = tiles.filter((t) => t.isBonus)
  if (bonusTiles.length > 0) {
    errors.push('Bonus tiles found in hand (should be in bonus pile)')
  }

  const regularTiles = tiles.filter((t) => !t.isBonus)

  // Check for special forms (only valid when fully concealed)
  const checkSevenPairs =
    declaredMelds.length === 0 && isSevenPairs(regularTiles)
  const checkKokushi = declaredMelds.length === 0 && isKokushi(regularTiles)

  // Try to parse as standard form
  const parsedHands = parseStandardForm(regularTiles, declaredMelds, winningTile)

  const isComplete =
    checkSevenPairs || checkKokushi || parsedHands.length > 0

  return {
    isComplete,
    isSevenPairs: checkSevenPairs,
    isKokushi: checkKokushi,
    isStandardForm: parsedHands.length > 0,
    parsedHands,
    errors,
  }
}

/**
 * Check if a set of tiles forms a complete hand structure
 * (Pure function version without Hand object)
 */
export function isCompleteHand(
  tiles: Tile[],
  declaredMelds: Meld[] = []
): boolean {
  const totalTiles =
    tiles.length + declaredMelds.reduce((sum, m) => sum + m.tiles.length, 0)

  if (totalTiles !== 14) return false

  // Filter out bonus tiles
  const regularTiles = tiles.filter((t) => !t.isBonus)

  // Check special forms (only when no declared melds)
  if (declaredMelds.length === 0) {
    if (isSevenPairs(regularTiles)) return true
    if (isKokushi(regularTiles)) return true
  }

  // Check standard form
  const parsedHands = parseStandardForm(regularTiles, declaredMelds)
  return parsedHands.length > 0
}

/**
 * Get all possible winning tiles for a tenpai hand
 */
export function getWaitingTiles(
  tiles: Tile[],
  declaredMelds: Meld[] = []
): Tile[] {
  const waitingTiles: Tile[] = []

  // Generate all possible tiles to check
  const suitedSuits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]

  for (const suit of suitedSuits) {
    for (let rank = 1; rank <= 9; rank++) {
      const testTile = new Tile(suit, rank, `test-${suit}-${rank}`)
      const testHand = [...tiles, testTile]

      if (isCompleteHand(testHand, declaredMelds)) {
        waitingTiles.push(testTile)
      }
    }
  }

  // Check honors
  for (let rank = 1; rank <= 4; rank++) {
    const windTile = new Tile(TileSuit.Wind, rank, `test-wind-${rank}`)
    if (isCompleteHand([...tiles, windTile], declaredMelds)) {
      waitingTiles.push(windTile)
    }
  }

  for (let rank = 1; rank <= 3; rank++) {
    const dragonTile = new Tile(TileSuit.Dragon, rank, `test-dragon-${rank}`)
    if (isCompleteHand([...tiles, dragonTile], declaredMelds)) {
      waitingTiles.push(dragonTile)
    }
  }

  return waitingTiles
}

export { KOKUSHI_TILES }
