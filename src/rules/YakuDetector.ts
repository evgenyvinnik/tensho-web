/**
 * Yaku Detector for Tensho Mahjong Roguelike
 *
 * Analyzes a parsed hand and detects all applicable yaku.
 */

import { Tile, TileSuit, DragonType, WindType } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { ParsedHand, WaitType } from '../core/Hand'
import {
  YakuDefinition,
  DetectedYaku,
  YakuContext,
  YAKU_DEFINITIONS,
  getYakuById,
} from './YakuDefinition'

/**
 * Check if all tiles are simples (2-8)
 */
function isAllSimples(hand: ParsedHand): boolean {
  const allMelds = [...hand.melds, hand.pair]
  return allMelds.every((meld) => meld.isAllSimples)
}

/**
 * Check if hand is all sequences with valueless pair and good wait
 */
function isPinfu(hand: ParsedHand, context: YakuContext): boolean {
  if (!hand.isConcealed) return false

  // All melds must be sequences
  if (!hand.melds.every((m) => m.type === MeldType.Sequence)) return false

  // Pair must not be valuable (not dragons, not seat/round wind)
  const pairTile = hand.pair.tiles[0]
  if (pairTile.suit === TileSuit.Dragon) return false
  if (pairTile.suit === TileSuit.Wind) {
    if (pairTile.rank === context.seatWind || pairTile.rank === context.roundWind) {
      return false
    }
  }

  // Must be a two-sided wait (ryanmen)
  return hand.waitType === WaitType.Ryanmen
}

/**
 * Check for identical sequences (iipeikou)
 */
function countIdenticalSequencePairs(hand: ParsedHand): number {
  const sequences = hand.melds.filter((m) => m.type === MeldType.Sequence)
  let pairs = 0

  for (let i = 0; i < sequences.length; i++) {
    for (let j = i + 1; j < sequences.length; j++) {
      if (sequences[i].typeKey === sequences[j].typeKey) {
        pairs++
      }
    }
  }

  return pairs
}

/**
 * Check for sanshoku doujun (same sequence in all suits)
 */
function hasSanshokuDoujun(hand: ParsedHand): boolean {
  const sequences = hand.melds.filter((m) => m.type === MeldType.Sequence)
  if (sequences.length < 3) return false

  // Group by starting rank
  const byRank = new Map<number, Set<TileSuit>>()
  for (const seq of sequences) {
    const rank = seq.lowestRank
    if (!byRank.has(rank)) byRank.set(rank, new Set())
    byRank.get(rank)!.add(seq.suit)
  }

  // Check if any rank has all three suits
  for (const suits of byRank.values()) {
    if (
      suits.has(TileSuit.Manzu) &&
      suits.has(TileSuit.Pinzu) &&
      suits.has(TileSuit.Souzu)
    ) {
      return true
    }
  }

  return false
}

/**
 * Check for ittsu (straight 1-9 in one suit)
 */
function hasIttsu(hand: ParsedHand): boolean {
  const sequences = hand.melds.filter((m) => m.type === MeldType.Sequence)
  if (sequences.length < 3) return false

  // Group by suit
  const bySuit = new Map<TileSuit, Set<number>>()
  for (const seq of sequences) {
    if (!seq.tiles[0].isSuited) continue
    if (!bySuit.has(seq.suit)) bySuit.set(seq.suit, new Set())
    bySuit.get(seq.suit)!.add(seq.lowestRank)
  }

  // Check if any suit has 1-2-3, 4-5-6, 7-8-9
  for (const ranks of bySuit.values()) {
    if (ranks.has(1) && ranks.has(4) && ranks.has(7)) {
      return true
    }
  }

  return false
}

/**
 * Check if all melds are triplets/quads
 */
function isToitoi(hand: ParsedHand): boolean {
  return hand.melds.every(
    (m) => m.type === MeldType.Triplet || m.type === MeldType.Quad
  )
}

/**
 * Check if all groups contain terminals or honors
 */
function isChanta(hand: ParsedHand): boolean {
  const allMelds = [...hand.melds, hand.pair]
  return allMelds.every((meld) => meld.hasTerminalOrHonor)
}

/**
 * Check if only terminals and honors
 */
function isHonroutou(hand: ParsedHand): boolean {
  const allTiles = [
    ...hand.melds.flatMap((m) => m.tiles),
    ...hand.pair.tiles,
  ]
  return allTiles.every((t) => t.isTerminalOrHonor)
}

/**
 * Count concealed triplets
 */
function countConcealedTriplets(hand: ParsedHand): number {
  return hand.melds.filter(
    (m) => (m.type === MeldType.Triplet || m.type === MeldType.Quad) && m.isConcealed
  ).length
}

/**
 * Check for sanshoku doukou (same triplet in all suits)
 */
function hasSanshokuDoukou(hand: ParsedHand): boolean {
  const triplets = hand.melds.filter(
    (m) => m.type === MeldType.Triplet || m.type === MeldType.Quad
  )
  if (triplets.length < 3) return false

  // Group by rank
  const byRank = new Map<number, Set<TileSuit>>()
  for (const trip of triplets) {
    if (!trip.tiles[0].isSuited) continue
    const rank = trip.tiles[0].rank
    if (!byRank.has(rank)) byRank.set(rank, new Set())
    byRank.get(rank)!.add(trip.suit)
  }

  // Check if any rank has all three suits
  for (const suits of byRank.values()) {
    if (
      suits.has(TileSuit.Manzu) &&
      suits.has(TileSuit.Pinzu) &&
      suits.has(TileSuit.Souzu)
    ) {
      return true
    }
  }

  return false
}

/**
 * Count dragon triplets and pairs
 */
function getDragonCounts(hand: ParsedHand): { triplets: number; pairs: number } {
  let triplets = 0
  let pairs = 0

  for (const meld of hand.melds) {
    if (meld.tiles[0].suit === TileSuit.Dragon) {
      if (meld.type === MeldType.Triplet || meld.type === MeldType.Quad) {
        triplets++
      }
    }
  }

  if (hand.pair.tiles[0].suit === TileSuit.Dragon) {
    pairs++
  }

  return { triplets, pairs }
}

/**
 * Check for honitsu (one suit plus honors)
 */
function getFlushInfo(hand: ParsedHand): { suit: TileSuit | null; hasHonors: boolean } {
  const allTiles = [
    ...hand.melds.flatMap((m) => m.tiles),
    ...hand.pair.tiles,
  ]

  let mainSuit: TileSuit | null = null
  let hasHonors = false

  for (const tile of allTiles) {
    if (tile.isHonor) {
      hasHonors = true
    } else if (tile.isSuited) {
      if (mainSuit === null) {
        mainSuit = tile.suit
      } else if (mainSuit !== tile.suit) {
        return { suit: null, hasHonors: false } // Multiple suits
      }
    }
  }

  return { suit: mainSuit, hasHonors }
}

/**
 * Check if all groups contain terminals (no honors)
 */
function isJunchan(hand: ParsedHand): boolean {
  const allMelds = [...hand.melds, hand.pair]

  // Must have terminals in all groups
  if (!allMelds.every((meld) => meld.hasTerminal)) return false

  // Must not have any honors
  const allTiles = allMelds.flatMap((m) => m.tiles)
  return !allTiles.some((t) => t.isHonor)
}

/**
 * Count wind triplets and pairs
 */
function getWindCounts(hand: ParsedHand): { triplets: number; pairs: number } {
  let triplets = 0
  let pairs = 0

  for (const meld of hand.melds) {
    if (meld.tiles[0].suit === TileSuit.Wind) {
      if (meld.type === MeldType.Triplet || meld.type === MeldType.Quad) {
        triplets++
      }
    }
  }

  if (hand.pair.tiles[0].suit === TileSuit.Wind) {
    pairs++
  }

  return { triplets, pairs }
}

/**
 * Check if all tiles are green (23468s, green dragon)
 */
function isAllGreen(hand: ParsedHand): boolean {
  const allTiles = [
    ...hand.melds.flatMap((m) => m.tiles),
    ...hand.pair.tiles,
  ]

  const greenRanks = [2, 3, 4, 6, 8]

  return allTiles.every((tile) => {
    if (tile.suit === TileSuit.Dragon && tile.rank === DragonType.Green) {
      return true
    }
    if (tile.suit === TileSuit.Souzu && greenRanks.includes(tile.rank)) {
      return true
    }
    return false
  })
}

/**
 * Check for four quads
 */
function hasFourQuads(hand: ParsedHand): boolean {
  return hand.melds.filter((m) => m.type === MeldType.Quad).length === 4
}

/**
 * Detect all yaku in a parsed hand
 */
export function detectYaku(context: YakuContext): DetectedYaku[] {
  const detected: DetectedYaku[] = []
  const hand = context.parsedHand

  const addYaku = (id: string, count: number = 1) => {
    const def = getYakuById(id)
    if (!def) return

    // Check if requires concealed
    if (def.requiresConcealed && !hand.isConcealed) return

    // Calculate actual multiplier
    let multiplier = def.multiplier
    if (!hand.isConcealed && def.openMultiplier) {
      multiplier = def.openMultiplier
    }

    detected.push({ definition: def, multiplier, count })
  }

  // === Situational Yaku ===
  if (context.isRiichi) {
    addYaku('riichi')
    if (context.isIppatsu) {
      addYaku('ippatsu')
    }
  }

  if (context.isTsumo && hand.isConcealed) {
    addYaku('menzen_tsumo')
  }

  // === Hand Pattern Yaku ===

  // Tanyao (all simples)
  if (isAllSimples(hand)) {
    addYaku('tanyao')
  }

  // Pinfu
  if (isPinfu(hand, context)) {
    addYaku('pinfu')
  }

  // Yakuhai (dragon triplets)
  for (const meld of hand.melds) {
    if (
      meld.tiles[0].suit === TileSuit.Dragon &&
      (meld.type === MeldType.Triplet || meld.type === MeldType.Quad)
    ) {
      addYaku('yakuhai_dragon')
    }
  }

  // Yakuhai (wind triplets - seat/round wind)
  for (const meld of hand.melds) {
    if (
      meld.tiles[0].suit === TileSuit.Wind &&
      (meld.type === MeldType.Triplet || meld.type === MeldType.Quad)
    ) {
      const windRank = meld.tiles[0].rank
      if (windRank === context.seatWind) {
        addYaku('yakuhai_wind')
      }
      if (windRank === context.roundWind && windRank !== context.seatWind) {
        addYaku('yakuhai_wind')
      }
    }
  }

  // Iipeikou / Ryanpeikou
  const identicalPairs = countIdenticalSequencePairs(hand)
  if (identicalPairs >= 2 && hand.isConcealed) {
    addYaku('ryanpeikou')
  } else if (identicalPairs >= 1 && hand.isConcealed) {
    addYaku('iipeikou')
  }

  // Sanshoku Doujun
  if (hasSanshokuDoujun(hand)) {
    addYaku('sanshoku_doujun')
  }

  // Ittsu
  if (hasIttsu(hand)) {
    addYaku('ittsu')
  }

  // Toitoi
  if (isToitoi(hand)) {
    addYaku('toitoi')
  }

  // Chanta / Junchan
  if (isJunchan(hand)) {
    addYaku('junchan')
  } else if (isChanta(hand)) {
    addYaku('chanta')
  }

  // Honroutou
  if (isHonroutou(hand)) {
    addYaku('honroutou')
  }

  // Sanankou
  const concealedTriplets = countConcealedTriplets(hand)
  if (concealedTriplets >= 3) {
    addYaku('sanankou')
  }

  // Sanshoku Doukou
  if (hasSanshokuDoukou(hand)) {
    addYaku('sanshoku_doukou')
  }

  // Dragons
  const dragons = getDragonCounts(hand)
  if (dragons.triplets === 3) {
    addYaku('daisangen')
  } else if (dragons.triplets === 2 && dragons.pairs === 1) {
    addYaku('shousangen')
  }

  // Flush variants
  const flush = getFlushInfo(hand)
  if (flush.suit !== null) {
    if (flush.hasHonors) {
      addYaku('honitsu')
    } else {
      addYaku('chinitsu')
    }
  }

  // Winds
  const winds = getWindCounts(hand)
  if (winds.triplets === 4) {
    addYaku('daisuushii')
  } else if (winds.triplets === 3 && winds.pairs === 1) {
    addYaku('shousuushii')
  }

  // Yakuman checks
  if (concealedTriplets === 4 && hand.isConcealed) {
    addYaku('suuankou')
  }

  if (isAllGreen(hand)) {
    addYaku('ryuuiisou')
  }

  if (hasFourQuads(hand)) {
    addYaku('suukantsu')
  }

  // All honors
  const allTiles = [...hand.melds.flatMap((m) => m.tiles), ...hand.pair.tiles]
  if (allTiles.every((t) => t.isHonor)) {
    addYaku('tsuuiisou')
  }

  // All terminals
  if (allTiles.every((t) => t.isTerminal)) {
    addYaku('chinroutou')
  }

  return detected
}

/**
 * Calculate total multiplier from detected yaku
 */
export function calculateYakuMultiplier(detected: DetectedYaku[]): number {
  return detected.reduce((total, y) => total * y.multiplier * y.count, 1)
}
