/**
 * Yaku Detector for Tensho Mahjong Roguelike
 *
 * Detects all valid yaku (scoring patterns) in a completed hand.
 * Each yaku has a tier (1-4) and a multiplier for scoring.
 *
 * Yaku Tiers:
 * - Tier 1: Common yaku (1 han equivalent)
 * - Tier 2: Intermediate yaku (2 han equivalent)
 * - Tier 3: Advanced yaku (3+ han equivalent)
 * - Tier 4: Yakuman (limit hands)
 */

import { Tile, TileSuit, DragonType, WindType } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { ParsedHand, WaitType } from '../core/Hand'
import { isSevenPairs, isKokushi } from './HandValidator'

/**
 * Definition of a yaku
 */
export interface YakuDefinition {
  id: string
  name: string
  japaneseName: string
  tier: 1 | 2 | 3 | 4
  multiplier: number // For Tensho scoring
  requiresConcealed: boolean
  description: string
}

/**
 * Detected yaku result
 */
export interface DetectedYaku {
  definition: YakuDefinition
  isApplicable: boolean
}

/**
 * Context for yaku detection
 */
export interface YakuContext {
  tiles: Tile[]
  parsedHand: ParsedHand | null
  declaredMelds: Meld[]
  isConcealed: boolean
  isTsumo: boolean // Self-draw win
  isRiichi: boolean // Declared riichi
  seatWind: WindType
  roundWind: WindType
  winningTile: Tile | null
  /** Tanyao Dispensation: terminals are legal, while Honors remain excluded. */
  tanyaoAllowsTerminals?: boolean
}

// ============================================================================
// TIER 1 YAKU DEFINITIONS
// ============================================================================

export const RIICHI: YakuDefinition = {
  id: 'riichi',
  name: 'Riichi',
  japaneseName: '立直',
  tier: 1,
  multiplier: 1.2,
  requiresConcealed: true,
  description: 'Declared riichi before winning',
}

export const TANYAO: YakuDefinition = {
  id: 'tanyao',
  name: 'Tanyao',
  japaneseName: '断幺九',
  tier: 1,
  multiplier: 1.3,
  requiresConcealed: false,
  description: 'All simples (no terminals or honors)',
}

export const PINFU: YakuDefinition = {
  id: 'pinfu',
  name: 'Pinfu',
  japaneseName: '平和',
  tier: 1,
  multiplier: 1.3,
  requiresConcealed: true,
  description: 'All sequences, valueless pair, ryanmen wait',
}

export const YAKUHAI: YakuDefinition = {
  id: 'yakuhai',
  name: 'Yakuhai',
  japaneseName: '役牌',
  tier: 1,
  multiplier: 1.2,
  requiresConcealed: false,
  description: 'Triplet/quad of dragons, seat wind, or round wind',
}

export const MENZEN_TSUMO: YakuDefinition = {
  id: 'menzen_tsumo',
  name: 'Menzen Tsumo',
  japaneseName: '門前清自摸和',
  tier: 1,
  multiplier: 1.3,
  requiresConcealed: true,
  description: 'Self-draw win with concealed hand',
}

// ============================================================================
// TIER 2 YAKU DEFINITIONS
// ============================================================================

export const IIPEIKOU: YakuDefinition = {
  id: 'iipeikou',
  name: 'Iipeikou',
  japaneseName: '一盃口',
  tier: 2,
  multiplier: 1.6,
  requiresConcealed: true,
  description: 'Two identical sequences',
}

export const SANSHOKU_DOUJUN: YakuDefinition = {
  id: 'sanshoku_doujun',
  name: 'Sanshoku Doujun',
  japaneseName: '三色同順',
  tier: 2,
  multiplier: 1.8,
  requiresConcealed: false,
  description: 'Same sequence in all three suits',
}

export const ITTSU: YakuDefinition = {
  id: 'ittsu',
  name: 'Ittsu',
  japaneseName: '一気通貫',
  tier: 2,
  multiplier: 2.0,
  requiresConcealed: false,
  description: 'Straight 1-2-3, 4-5-6, 7-8-9 in one suit',
}

export const TOITOI: YakuDefinition = {
  id: 'toitoi',
  name: 'Toitoi',
  japaneseName: '対々和',
  tier: 2,
  multiplier: 2.0,
  requiresConcealed: false,
  description: 'All triplets/quads',
}

export const CHANTA: YakuDefinition = {
  id: 'chanta',
  name: 'Chanta',
  japaneseName: '混全帯幺九',
  tier: 2,
  multiplier: 1.8,
  requiresConcealed: false,
  description: 'All melds contain a terminal or honor',
}

export const HONROUTOU: YakuDefinition = {
  id: 'honroutou',
  name: 'Honroutou',
  japaneseName: '混老頭',
  tier: 2,
  multiplier: 2.2,
  requiresConcealed: false,
  description: 'All terminals and honors only',
}

// ============================================================================
// TIER 3 YAKU DEFINITIONS
// ============================================================================

export const HONITSU: YakuDefinition = {
  id: 'honitsu',
  name: 'Honitsu',
  japaneseName: '混一色',
  tier: 3,
  multiplier: 2.5,
  requiresConcealed: false,
  description: 'One suit plus honors',
}

export const CHINITSU: YakuDefinition = {
  id: 'chinitsu',
  name: 'Chinitsu',
  japaneseName: '清一色',
  tier: 3,
  multiplier: 3.0,
  requiresConcealed: false,
  description: 'All tiles from one suit',
}

export const RYANPEIKOU: YakuDefinition = {
  id: 'ryanpeikou',
  name: 'Ryanpeikou',
  japaneseName: '二盃口',
  tier: 3,
  multiplier: 3.2,
  requiresConcealed: true,
  description: 'Two pairs of identical sequences',
}

export const JUNCHAN: YakuDefinition = {
  id: 'junchan',
  name: 'Junchan',
  japaneseName: '純全帯幺九',
  tier: 3,
  multiplier: 2.8,
  requiresConcealed: false,
  description: 'All melds contain a terminal (no honors)',
}

export const SEVEN_PAIRS: YakuDefinition = {
  id: 'seven_pairs',
  name: 'Seven Pairs',
  japaneseName: '七対子',
  tier: 3,
  multiplier: 2.6,
  requiresConcealed: true,
  description: 'Seven different pairs',
}

// ============================================================================
// TIER 4 YAKU DEFINITIONS (YAKUMAN)
// ============================================================================

export const KOKUSHI: YakuDefinition = {
  id: 'kokushi',
  name: 'Kokushi Musou',
  japaneseName: '国士無双',
  tier: 4,
  multiplier: 5.0,
  requiresConcealed: true,
  description: 'Thirteen Orphans - one of each terminal and honor plus pair',
}

export const SUU_ANKOU: YakuDefinition = {
  id: 'suu_ankou',
  name: 'Suu Ankou',
  japaneseName: '四暗刻',
  tier: 4,
  multiplier: 4.5,
  requiresConcealed: true,
  description: 'Four concealed triplets',
}

export const DAI_SANGEN: YakuDefinition = {
  id: 'dai_sangen',
  name: 'Dai Sangen',
  japaneseName: '大三元',
  tier: 4,
  multiplier: 4.0,
  requiresConcealed: false,
  description: 'Triplets/quads of all three dragons',
}

export const CHINROUTOU: YakuDefinition = {
  id: 'chinroutou',
  name: 'Chinroutou',
  japaneseName: '清老頭',
  tier: 4,
  multiplier: 4.2,
  requiresConcealed: false,
  description: 'All terminals only',
}

export const CHUUREN_POUTOU: YakuDefinition = {
  id: 'chuuren_poutou',
  name: 'Chuuren Poutou',
  japaneseName: '九蓮宝燈',
  tier: 4,
  multiplier: 5.5,
  requiresConcealed: true,
  description: 'Nine Gates - 1112345678999 + any tile of same suit',
}

// ============================================================================
// ALL YAKU LIST
// ============================================================================

export const ALL_YAKU: YakuDefinition[] = [
  // Tier 1
  RIICHI,
  TANYAO,
  PINFU,
  YAKUHAI,
  MENZEN_TSUMO,
  // Tier 2
  IIPEIKOU,
  SANSHOKU_DOUJUN,
  ITTSU,
  TOITOI,
  CHANTA,
  HONROUTOU,
  // Tier 3
  HONITSU,
  CHINITSU,
  RYANPEIKOU,
  JUNCHAN,
  SEVEN_PAIRS,
  // Tier 4
  KOKUSHI,
  SUU_ANKOU,
  DAI_SANGEN,
  CHINROUTOU,
  CHUUREN_POUTOU,
]

// ============================================================================
// YAKU DETECTION FUNCTIONS
// ============================================================================

/**
 * Check if hand satisfies Tanyao (all simples)
 */
export function checkTanyao(
  tiles: Tile[],
  allowTerminals: boolean = false
): boolean {
  return tiles.every((tile) =>
    allowTerminals ? tile.isSuited : tile.isSimple
  )
}

/**
 * Check if hand satisfies Pinfu
 */
export function checkPinfu(context: YakuContext): boolean {
  if (!context.isConcealed) return false
  if (!context.parsedHand) return false

  const { melds, pair, waitType } = context.parsedHand

  // All melds must be sequences
  const allMeldsSequences = melds.every(
    (m) => m.type === MeldType.Sequence
  )
  if (!allMeldsSequences) return false

  // Must have ryanmen wait
  if (waitType !== WaitType.Ryanmen) return false

  // Pair must be valueless (not dragons, seat wind, or round wind)
  const pairTile = pair.tiles[0]
  if (pairTile.suit === TileSuit.Dragon) return false
  if (
    pairTile.suit === TileSuit.Wind &&
    (pairTile.rank === context.seatWind || pairTile.rank === context.roundWind)
  ) {
    return false
  }

  return true
}

/**
 * Check for Yakuhai (value tiles)
 */
export function checkYakuhai(context: YakuContext): number {
  if (!context.parsedHand) return 0

  let yakuhaiCount = 0
  const allMelds = [...context.parsedHand.melds, ...context.declaredMelds]

  for (const meld of allMelds) {
    if (meld.type !== MeldType.Triplet && meld.type !== MeldType.Quad) continue

    const tile = meld.tiles[0]

    // Dragons are always yakuhai
    if (tile.suit === TileSuit.Dragon) {
      yakuhaiCount++
    }

    // Seat wind
    if (tile.suit === TileSuit.Wind && tile.rank === context.seatWind) {
      yakuhaiCount++
    }

    // Round wind (can stack with seat wind)
    if (tile.suit === TileSuit.Wind && tile.rank === context.roundWind) {
      yakuhaiCount++
    }
  }

  return yakuhaiCount
}

/**
 * Check for Iipeikou (one pair of identical sequences)
 */
export function checkIipeikou(context: YakuContext): boolean {
  if (!context.isConcealed) return false
  if (!context.parsedHand) return false

  const sequences = context.parsedHand.melds.filter(
    (m) => m.type === MeldType.Sequence
  )
  if (sequences.length < 2) return false

  // Check for matching sequences
  for (let i = 0; i < sequences.length - 1; i++) {
    for (let j = i + 1; j < sequences.length; j++) {
      if (sequences[i].typeKey === sequences[j].typeKey) {
        return true
      }
    }
  }

  return false
}

/**
 * Check for Ryanpeikou (two pairs of identical sequences)
 */
export function checkRyanpeikou(context: YakuContext): boolean {
  if (!context.isConcealed) return false
  if (!context.parsedHand) return false

  const sequences = context.parsedHand.melds.filter(
    (m) => m.type === MeldType.Sequence
  )
  if (sequences.length < 4) return false

  // Count sequence types
  const typeCounts = new Map<string, number>()
  for (const seq of sequences) {
    const key = seq.typeKey
    typeCounts.set(key, (typeCounts.get(key) ?? 0) + 1)
  }

  // Need exactly two types with count 2 each
  const pairs = Array.from(typeCounts.values()).filter((c) => c === 2)
  return pairs.length === 2
}

/**
 * Check for Sanshoku Doujun (same sequence in all three suits)
 */
export function checkSanshokuDoujun(context: YakuContext): boolean {
  if (!context.parsedHand) return false

  const allMelds = [...context.parsedHand.melds, ...context.declaredMelds]
  const sequences = allMelds.filter((m) => m.type === MeldType.Sequence)

  // Group sequences by starting rank
  const byRank = new Map<number, Set<TileSuit>>()
  for (const seq of sequences) {
    const rank = seq.lowestRank
    const suits = byRank.get(rank) ?? new Set()
    suits.add(seq.suit)
    byRank.set(rank, suits)
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
 * Check for Ittsu (straight 1-2-3, 4-5-6, 7-8-9 in one suit)
 */
export function checkIttsu(context: YakuContext): boolean {
  if (!context.parsedHand) return false

  const allMelds = [...context.parsedHand.melds, ...context.declaredMelds]
  const sequences = allMelds.filter((m) => m.type === MeldType.Sequence)

  // Group by suit
  const bySuit = new Map<TileSuit, Set<number>>()
  for (const seq of sequences) {
    const startRanks = bySuit.get(seq.suit) ?? new Set()
    startRanks.add(seq.lowestRank)
    bySuit.set(seq.suit, startRanks)
  }

  // Check if any suit has 1, 4, 7
  for (const startRanks of bySuit.values()) {
    if (startRanks.has(1) && startRanks.has(4) && startRanks.has(7)) {
      return true
    }
  }

  return false
}

/**
 * Check for Toitoi (all triplets)
 */
export function checkToitoi(context: YakuContext): boolean {
  if (!context.parsedHand) return false

  const allMelds = [...context.parsedHand.melds, ...context.declaredMelds]

  // All 4 melds must be triplets or quads
  return allMelds.every(
    (m) => m.type === MeldType.Triplet || m.type === MeldType.Quad
  )
}

/**
 * Check for Chanta (all melds contain terminal or honor)
 */
export function checkChanta(context: YakuContext): boolean {
  if (!context.parsedHand) return false

  const allMelds = [...context.parsedHand.melds, ...context.declaredMelds]
  const pair = context.parsedHand.pair

  // All melds must contain a terminal or honor
  const meldsValid = allMelds.every((m) => m.hasTerminalOrHonor)
  const pairValid = pair.hasTerminalOrHonor

  // Must have at least one honor and one terminal sequence
  const hasHonor = allMelds.some((m) => m.hasHonor) || pair.hasHonor
  const hasSequenceWithTerminal = allMelds.some(
    (m) => m.type === MeldType.Sequence && m.hasTerminal
  )

  return meldsValid && pairValid && hasHonor && hasSequenceWithTerminal
}

/**
 * Check for Junchan (all melds contain terminal, no honors)
 */
export function checkJunchan(context: YakuContext): boolean {
  if (!context.parsedHand) return false

  const allMelds = [...context.parsedHand.melds, ...context.declaredMelds]
  const pair = context.parsedHand.pair

  // No honors allowed
  const tiles = context.tiles
  if (tiles.some((t) => t.isHonor)) return false

  // All melds must contain a terminal
  const meldsValid = allMelds.every((m) => m.hasTerminal)
  const pairValid = pair.hasTerminal

  // Must have at least one sequence (otherwise it's Chinroutou)
  const hasSequence = allMelds.some((m) => m.type === MeldType.Sequence)

  return meldsValid && pairValid && hasSequence
}

/**
 * Check for Honroutou (all terminals and honors)
 */
export function checkHonroutou(context: YakuContext): boolean {
  const tiles = context.tiles
  return tiles.every((t) => t.isTerminalOrHonor)
}

/**
 * Check for Honitsu (one suit plus honors)
 */
export function checkHonitsu(context: YakuContext): boolean {
  const tiles = context.tiles
  const suitedTiles = tiles.filter((t) => t.isSuited)
  const honorTiles = tiles.filter((t) => t.isHonor)

  // Must have both suited and honor tiles
  if (suitedTiles.length === 0 || honorTiles.length === 0) return false

  // All suited tiles must be same suit
  const suit = suitedTiles[0].suit
  return suitedTiles.every((t) => t.suit === suit)
}

/**
 * Check for Chinitsu (all one suit)
 */
export function checkChinitsu(context: YakuContext): boolean {
  const tiles = context.tiles
  if (tiles.length === 0) return false

  const suitedTiles = tiles.filter((t) => t.isSuited)

  // All tiles must be suited
  if (suitedTiles.length !== tiles.length) return false

  // All same suit
  const suit = tiles[0].suit
  return tiles.every((t) => t.suit === suit)
}

/**
 * Check for Suu Ankou (four concealed triplets)
 */
export function checkSuuAnkou(context: YakuContext): boolean {
  if (!context.isConcealed) return false
  if (!context.parsedHand) return false

  const allMelds = [...context.parsedHand.melds, ...context.declaredMelds]

  // All 4 melds must be concealed triplets
  const concealedTriplets = allMelds.filter(
    (m) =>
      (m.type === MeldType.Triplet || m.type === MeldType.Quad) && m.isConcealed
  )

  return concealedTriplets.length === 4
}

/**
 * Check for Dai Sangen (big three dragons)
 */
export function checkDaiSangen(context: YakuContext): boolean {
  if (!context.parsedHand) return false

  const allMelds = [...context.parsedHand.melds, ...context.declaredMelds]

  // Must have triplet/quad of all three dragons
  const dragonRanks = new Set<number>()

  for (const meld of allMelds) {
    if (meld.type !== MeldType.Triplet && meld.type !== MeldType.Quad) continue
    if (meld.suit !== TileSuit.Dragon) continue
    dragonRanks.add(meld.tiles[0].rank)
  }

  return (
    dragonRanks.has(DragonType.White) &&
    dragonRanks.has(DragonType.Green) &&
    dragonRanks.has(DragonType.Red)
  )
}

/**
 * Check for Chinroutou (all terminals)
 */
export function checkChinroutou(context: YakuContext): boolean {
  const tiles = context.tiles
  return tiles.every((t) => t.isTerminal)
}

/**
 * Check for Chuuren Poutou (Nine Gates)
 * Pattern: 1112345678999 + any tile of same suit
 */
export function checkChuurenPoutou(context: YakuContext): boolean {
  if (!context.isConcealed) return false

  const tiles = context.tiles

  // Must be all one suit
  if (!tiles.every((t) => t.isSuited)) return false
  const suit = tiles[0].suit
  if (!tiles.every((t) => t.suit === suit)) return false

  // Count each rank
  const counts = new Array(10).fill(0)
  for (const tile of tiles) {
    counts[tile.rank]++
  }

  // Base pattern: 3x1, 1x2, 1x3, 1x4, 1x5, 1x6, 1x7, 1x8, 3x9
  // Plus one extra of any rank
  const basePattern = [0, 3, 1, 1, 1, 1, 1, 1, 1, 3] // 13 tiles

  // Check if counts match base pattern with one extra
  let extraCount = 0
  for (let i = 1; i <= 9; i++) {
    const diff = counts[i] - basePattern[i]
    if (diff < 0) return false
    if (diff > 1) return false
    extraCount += diff
  }

  return extraCount === 1
}

/**
 * Detect all applicable yaku for a hand
 */
export function detectYaku(context: YakuContext): DetectedYaku[] {
  const detected: DetectedYaku[] = []

  // Check for special hands first (they override standard yaku)
  if (isKokushi(context.tiles)) {
    detected.push({ definition: KOKUSHI, isApplicable: true })
    return detected // Kokushi doesn't combine with other yaku
  }

  if (isSevenPairs(context.tiles)) {
    detected.push({ definition: SEVEN_PAIRS, isApplicable: true })

    // Seven pairs can combine with some yaku
    if (checkTanyao(context.tiles, context.tanyaoAllowsTerminals)) {
      detected.push({ definition: TANYAO, isApplicable: true })
    }
    if (checkHonitsu(context)) {
      detected.push({ definition: HONITSU, isApplicable: true })
    }
    if (checkChinitsu(context)) {
      detected.push({ definition: CHINITSU, isApplicable: true })
    }
    if (checkHonroutou(context)) {
      detected.push({ definition: HONROUTOU, isApplicable: true })
    }

    return detected
  }

  // Standard hand yaku detection

  // Tier 4 (Yakuman) - check first as they're most valuable
  if (checkChuurenPoutou(context)) {
    detected.push({ definition: CHUUREN_POUTOU, isApplicable: true })
    return detected // Yakuman don't stack
  }

  if (checkSuuAnkou(context)) {
    detected.push({ definition: SUU_ANKOU, isApplicable: true })
    return detected
  }

  if (checkDaiSangen(context)) {
    detected.push({ definition: DAI_SANGEN, isApplicable: true })
    return detected
  }

  if (checkChinroutou(context)) {
    detected.push({ definition: CHINROUTOU, isApplicable: true })
    return detected
  }

  // Tier 1
  if (context.isRiichi) {
    detected.push({ definition: RIICHI, isApplicable: true })
  }

  if (context.isTsumo && context.isConcealed) {
    detected.push({ definition: MENZEN_TSUMO, isApplicable: true })
  }

  if (checkTanyao(context.tiles, context.tanyaoAllowsTerminals)) {
    detected.push({ definition: TANYAO, isApplicable: true })
  }

  if (checkPinfu(context)) {
    detected.push({ definition: PINFU, isApplicable: true })
  }

  const yakuhaiCount = checkYakuhai(context)
  for (let i = 0; i < yakuhaiCount; i++) {
    detected.push({ definition: YAKUHAI, isApplicable: true })
  }

  // Tier 2
  if (checkRyanpeikou(context)) {
    detected.push({ definition: RYANPEIKOU, isApplicable: true })
  } else if (checkIipeikou(context)) {
    detected.push({ definition: IIPEIKOU, isApplicable: true })
  }

  if (checkSanshokuDoujun(context)) {
    detected.push({ definition: SANSHOKU_DOUJUN, isApplicable: true })
  }

  if (checkIttsu(context)) {
    detected.push({ definition: ITTSU, isApplicable: true })
  }

  if (checkToitoi(context)) {
    detected.push({ definition: TOITOI, isApplicable: true })
  }

  if (checkJunchan(context)) {
    detected.push({ definition: JUNCHAN, isApplicable: true })
  } else if (checkChanta(context)) {
    detected.push({ definition: CHANTA, isApplicable: true })
  }

  if (checkHonroutou(context)) {
    detected.push({ definition: HONROUTOU, isApplicable: true })
  }

  // Tier 3
  if (checkChinitsu(context)) {
    detected.push({ definition: CHINITSU, isApplicable: true })
  } else if (checkHonitsu(context)) {
    detected.push({ definition: HONITSU, isApplicable: true })
  }

  return detected
}

/**
 * Calculate the total yaku multiplier by stacking multiplicatively
 */
export function calculateYakuMultiplier(detected: DetectedYaku[]): number {
  return detected.reduce((total, y) => total * y.definition.multiplier, 1)
}

/**
 * Get yaku by ID
 */
export function getYakuById(id: string): YakuDefinition | undefined {
  return ALL_YAKU.find((y) => y.id === id)
}

/**
 * Get all yaku of a specific tier
 */
export function getYakuByTier(tier: 1 | 2 | 3 | 4): YakuDefinition[] {
  return ALL_YAKU.filter((y) => y.tier === tier)
}
