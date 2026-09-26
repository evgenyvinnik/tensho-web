/**
 * Shanten Calculator for Tensho Mahjong Roguelike
 *
 * Calculates the minimum number of tile changes needed to reach tenpai (ready hand).
 * Shanten values:
 * - -1: Complete hand (can declare win)
 * - 0: Tenpai (one tile away from completion)
 * - 1-6: Number of tiles away from tenpai
 *
 * Supports:
 * - Standard form (4 melds + 1 pair)
 * - Seven Pairs (Chiitoitsu)
 * - Thirteen Orphans (Kokushi)
 */

import { Tile, TileSuit } from '../core/Tile'
import { Meld } from '../core/Meld'
import { parseStandardForm, KOKUSHI_TILES } from './HandValidator'

/**
 * Result of shanten calculation
 */
export interface ShantenResult {
  shanten: number // -1 = complete, 0 = tenpai, 1+ = tiles away from tenpai
  standardShanten: number
  sevenPairsShanten: number
  kokushiShanten: number
  bestForm: 'standard' | 'sevenPairs' | 'kokushi'
}

/**
 * Tile counts representation for efficient calculation
 * Index mapping: [suit][rank] where suit 0-2 are suited (manzu, pinzu, souzu)
 * and suit 3 is honors (winds 1-4, dragons 5-7)
 */
type TileCounts = number[][]

/**
 * Convert tiles to a count array for efficient calculation
 */
function tilesToCounts(tiles: Tile[]): TileCounts {
  // 4 suits x 10 ranks (index 0 unused for easier rank mapping)
  const counts: TileCounts = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Manzu
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Pinzu
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Souzu
    [0, 0, 0, 0, 0, 0, 0, 0], // Honors (winds 1-4, dragons 5-7)
  ]

  for (const tile of tiles) {
    if (tile.isBonus) continue

    if (tile.suit === TileSuit.Manzu) {
      counts[0][tile.rank]++
    } else if (tile.suit === TileSuit.Pinzu) {
      counts[1][tile.rank]++
    } else if (tile.suit === TileSuit.Souzu) {
      counts[2][tile.rank]++
    } else if (tile.suit === TileSuit.Wind) {
      counts[3][tile.rank]++
    } else if (tile.suit === TileSuit.Dragon) {
      counts[3][tile.rank + 4]++ // Dragons at indices 5, 6, 7
    }
  }

  return counts
}

/**
 * Calculate shanten for Seven Pairs (Chiitoitsu)
 * Formula: 6 - pairs + max(0, 7 - uniqueTileTypes)
 */
export function calculateSevenPairsShanten(tiles: Tile[]): number {
  if (tiles.length > 14) return 8 // Invalid

  const counts = new Map<string, number>()
  for (const tile of tiles) {
    if (tile.isBonus) continue
    const key = tile.typeKey
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  let pairs = 0
  let uniqueTypes = 0

  for (const count of counts.values()) {
    uniqueTypes++
    if (count >= 2) {
      pairs++
    }
  }

  // Need 7 pairs and 7 unique types
  // Shanten = 6 - pairs + max(0, 7 - uniqueTypes)
  // When we need more unique types, we need extra exchanges
  const neededUniques = Math.max(0, 7 - uniqueTypes)
  return 6 - pairs + neededUniques
}

/**
 * Calculate shanten for Thirteen Orphans (Kokushi)
 * Formula: 13 - uniqueTerminalHonors - hasPair
 */
export function calculateKokushiShanten(tiles: Tile[]): number {
  if (tiles.length > 14) return 13 // Invalid

  const kokushiKeys = new Set(
    KOKUSHI_TILES.map((kt) => `${kt.suit}-${kt.rank}`)
  )

  const counts = new Map<string, number>()
  for (const tile of tiles) {
    if (tile.isBonus) continue
    const key = tile.typeKey
    if (kokushiKeys.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  const uniqueKokushi = counts.size
  const hasPair = Array.from(counts.values()).some((c) => c >= 2) ? 1 : 0

  // Need all 13 kokushi types plus one pair
  return 13 - uniqueKokushi - hasPair
}

/**
 * Calculate shanten for standard form (4 melds + 1 pair)
 * Uses a recursive algorithm to find the minimum shanten
 */
export function calculateStandardShanten(
  tiles: Tile[],
  declaredMelds: Meld[] = []
): number {
  const regularTiles = tiles.filter((t) => !t.isBonus)

  // Check if already complete
  if (parseStandardForm(regularTiles, declaredMelds).length > 0) {
    return -1
  }

  const counts = tilesToCounts(regularTiles)
  const neededMelds = 4 - declaredMelds.length

  // Start with worst case shanten
  let minShanten = 8

  // Try each possible pair
  for (let suit = 0; suit < 4; suit++) {
    const maxRank = suit < 3 ? 9 : 7
    for (let rank = 1; rank <= maxRank; rank++) {
      if (counts[suit][rank] >= 2) {
        // Remove pair
        counts[suit][rank] -= 2

        // Calculate shanten with this pair
        const result = calculateShantenWithPair(counts, neededMelds)
        minShanten = Math.min(minShanten, result)

        // Restore pair
        counts[suit][rank] += 2
      }
    }
  }

  // Also try without a pair (incomplete hand)
  const noPairResult = calculateShantenWithoutPair(counts, neededMelds)
  minShanten = Math.min(minShanten, noPairResult)

  // A larger rack may contain a winning subset plus unrelated tiles. Only the
  // validator above can call the entire rack complete.
  // Bonus replacement failures and rack-size effects can leave fewer than 13
  // regular tiles. Four melds with no head tile still need two draws, not one.
  const missingTilesBeforeReady = neededMelds * 3 + 1 - regularTiles.length
  return Math.max(0, minShanten, missingTilesBeforeReady)
}

/**
 * Calculate shanten when a pair has been selected
 */
function calculateShantenWithPair(
  counts: TileCounts,
  neededMelds: number
): number {
  return calculateGroupShanten(counts, neededMelds) - 1
}

/**
 * Calculate shanten without a pair selected yet
 */
function calculateShantenWithoutPair(
  counts: TileCounts,
  neededMelds: number
): number {
  return calculateGroupShanten(counts, neededMelds)
}

/**
 * Keep every useful meld/partial-meld count, rather than choosing a greedy
 * decomposition. A sequence can consume tiles needed by a better triplet or
 * two partial groups. The memo is local: no tile identities or run state leak.
 */
function calculateGroupShanten(
  counts: TileCounts,
  neededMelds: number
): number {
  type Groups = [melds: number, partials: number]
  const memo = new Map<string, Groups[]>()
  function decompose(c: number[], suited: boolean): Groups[] {
    const key = `${suited}:${c.join(',')}`
    const cached = memo.get(key)
    if (cached) return cached
    const rank = c.findIndex((count) => count > 0)
    if (rank < 0) return [[0, 0]]
    const outcomes = new Map<string, Groups>()
    function take(ranks: number[], meld: number, partial: number): void {
      for (const r of ranks) c[r]--
      for (const [m, t] of decompose(c, suited)) {
        const groups: Groups = [m + meld, t + partial]
        if (groups[0] <= neededMelds && groups[1] <= neededMelds) {
          outcomes.set(groups.join(','), groups)
        }
      }
      for (const r of ranks) c[r]++
    }
    // This tile can remain unused, or participate in any available group.
    take([rank], 0, 0)
    if (c[rank] >= 3) take([rank, rank, rank], 1, 0)
    if (c[rank] >= 2) take([rank, rank], 0, 1)
    if (suited) {
      if (rank <= 7 && c[rank + 1] && c[rank + 2]) {
        take([rank, rank + 1, rank + 2], 1, 0)
      }
      if (rank <= 8 && c[rank + 1]) take([rank, rank + 1], 0, 1)
      if (rank <= 7 && c[rank + 2]) take([rank, rank + 2], 0, 1)
    }
    const result = [...outcomes.values()]
    memo.set(key, result)
    return result
  }

  let combinations: Groups[] = [[0, 0]]
  for (let suit = 0; suit < counts.length; suit++) {
    const next = new Map<string, Groups>()
    for (const [m, t] of combinations) {
      for (const [sm, st] of decompose([...counts[suit]], suit < 3)) {
        if (m + sm > neededMelds) continue
        const groups: Groups = [m + sm, Math.min(neededMelds, t + st)]
        next.set(groups.join(','), groups)
      }
    }
    combinations = [...next.values()]
  }

  return Math.min(
    ...combinations.map(
      ([m, t]) => neededMelds * 2 - m * 2 - Math.min(t, neededMelds - m)
    )
  )
}

/**
 * Calculate shanten for all forms and return the minimum
 */
export function calculateShanten(
  tiles: Tile[],
  declaredMelds: Meld[] = []
): ShantenResult {
  const regularTiles = tiles.filter((t) => !t.isBonus)

  // Calculate shanten for each form
  const standardShanten = calculateStandardShanten(regularTiles, declaredMelds)

  // Seven pairs and Kokushi only work with fully concealed hands
  const sevenPairsShanten =
    declaredMelds.length === 0 ? calculateSevenPairsShanten(regularTiles) : 8

  const kokushiShanten =
    declaredMelds.length === 0 ? calculateKokushiShanten(regularTiles) : 13

  // Find minimum
  const minShanten = Math.min(
    standardShanten,
    sevenPairsShanten,
    kokushiShanten
  )

  let bestForm: 'standard' | 'sevenPairs' | 'kokushi' = 'standard'
  if (
    minShanten === sevenPairsShanten &&
    sevenPairsShanten <= standardShanten
  ) {
    bestForm = 'sevenPairs'
  } else if (
    minShanten === kokushiShanten &&
    kokushiShanten < standardShanten
  ) {
    bestForm = 'kokushi'
  }

  return {
    shanten: minShanten,
    standardShanten,
    sevenPairsShanten,
    kokushiShanten,
    bestForm,
  }
}

/**
 * Check if hand is in tenpai (shanten = 0)
 */
export function isTenpai(tiles: Tile[], declaredMelds: Meld[] = []): boolean {
  return calculateShanten(tiles, declaredMelds).shanten === 0
}

/**
 * Check if hand is complete (shanten = -1)
 */
export function isComplete(tiles: Tile[], declaredMelds: Meld[] = []): boolean {
  return calculateShanten(tiles, declaredMelds).shanten === -1
}

/**
 * Get effective tiles (tiles that reduce shanten)
 */
export function getEffectiveTiles(
  tiles: Tile[],
  declaredMelds: Meld[] = []
): Tile[] {
  const currentShanten = calculateShanten(tiles, declaredMelds).shanten
  const effectiveTiles: Tile[] = []

  // Generate all possible tiles to test
  const suitedSuits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]

  for (const suit of suitedSuits) {
    for (let rank = 1; rank <= 9; rank++) {
      const testTile = new Tile(suit, rank, `test-${suit}-${rank}`)
      const testHand = [...tiles, testTile]

      if (calculateShanten(testHand, declaredMelds).shanten < currentShanten) {
        effectiveTiles.push(testTile)
      }
    }
  }

  // Check honors
  for (let rank = 1; rank <= 4; rank++) {
    const windTile = new Tile(TileSuit.Wind, rank, `test-wind-${rank}`)
    if (
      calculateShanten([...tiles, windTile], declaredMelds).shanten <
      currentShanten
    ) {
      effectiveTiles.push(windTile)
    }
  }

  for (let rank = 1; rank <= 3; rank++) {
    const dragonTile = new Tile(TileSuit.Dragon, rank, `test-dragon-${rank}`)
    if (
      calculateShanten([...tiles, dragonTile], declaredMelds).shanten <
      currentShanten
    ) {
      effectiveTiles.push(dragonTile)
    }
  }

  return effectiveTiles
}

/**
 * Get waiting tiles (tiles that complete the hand from tenpai)
 */
export function getWaitingTiles(
  tiles: Tile[],
  declaredMelds: Meld[] = []
): Tile[] {
  const result = calculateShanten(tiles, declaredMelds)
  if (result.shanten !== 0) return [] // Not in tenpai

  const waitingTiles: Tile[] = []
  const suitedSuits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]

  for (const suit of suitedSuits) {
    for (let rank = 1; rank <= 9; rank++) {
      const testTile = new Tile(suit, rank, `test-${suit}-${rank}`)
      const testHand = [...tiles, testTile]

      if (isComplete(testHand, declaredMelds)) {
        waitingTiles.push(testTile)
      }
    }
  }

  // Check honors
  for (let rank = 1; rank <= 4; rank++) {
    const windTile = new Tile(TileSuit.Wind, rank, `test-wind-${rank}`)
    if (isComplete([...tiles, windTile], declaredMelds)) {
      waitingTiles.push(windTile)
    }
  }

  for (let rank = 1; rank <= 3; rank++) {
    const dragonTile = new Tile(TileSuit.Dragon, rank, `test-dragon-${rank}`)
    if (isComplete([...tiles, dragonTile], declaredMelds)) {
      waitingTiles.push(dragonTile)
    }
  }

  return waitingTiles
}
