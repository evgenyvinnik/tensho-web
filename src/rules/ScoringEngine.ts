/**
 * Scoring Engine for Tensho Mahjong Roguelike
 *
 * Calculates final score using the Tensho formula:
 * Final Score = (Base Points + Additive Bonuses) x Multiplicative Multipliers
 *
 * Base points come from tiles and hand structure:
 * - Terminals (1,9): 10 points each
 * - Simples (2-8): 5 points each
 * - Honors: 15 points each
 * - Pair: +10, Sequence: +20, Triplet: +30, Quad: +50
 *
 * Tile modifiers add:
 * - Enhancement chips/mult (Bonus: +30, Mult: +4, etc.)
 * - Edition chips/mult (Foil: +50, Holo: +10, Poly: x1.5)
 * - Seal effects (Gold: ¥3, Red: retrigger, etc.)
 *
 * Red fives (aka-dora) add:
 * - +50 bonus chips per red five when enabled
 */

import { Tile, WindType } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { ParsedHand } from '../core/Hand'
import { DetectedYaku, YakuContext, detectYaku, calculateYakuMultiplier } from './YakuDetector'
import { tileModifierSystem } from '../systems/TileModifierSystem'
import { redFiveSystem, countRedFives } from '../systems/RedFiveSystem'

/**
 * Detailed score breakdown
 */
export interface ScoreBreakdown {
  // Base components
  basePoints: number
  tilePoints: number
  structurePoints: number

  // Tile modifier bonuses
  modifierChips: number
  modifierMult: number
  modifierMultiplier: number

  // Red fives (aka-dora)
  redFiveCount: number
  redFiveChips: number

  // Yaku
  detectedYaku: DetectedYaku[]
  yakuMultiplier: number

  // Bonuses from game systems
  additiveBonus: number

  // Retrigger info
  retriggeredTiles: string[]

  // Shattered tiles (Glass)
  shatteredTiles: string[]

  // Gold earned from modifiers
  goldEarned: number

  // Final
  subtotal: number
  finalScore: number
}

/**
 * Scoring context
 */
export interface ScoringContext {
  tiles: Tile[]
  parsedHand: ParsedHand
  declaredMelds: Meld[]
  isConcealed: boolean
  isTsumo: boolean
  isRiichi: boolean
  seatWind: WindType
  roundWind: WindType
  winningTile: Tile
  additiveBonus?: number // Extra additive bonuses from game systems
  multiplicativeBonus?: number // Extra multiplicative bonuses from game systems
  debuffedTileIds?: ReadonlySet<string> // Suppressed for points/marks, still valid structurally
  tanyaoAllowsTerminals?: boolean // Tanyao Dispensation rule rewrite
  /**
   * Set for a partial play: the selection is not a complete winning hand, so
   * structure comes from these groups and no yaku are awarded. Everything else
   * (tile points, modifiers, red fives, retriggers) scores normally.
   */
  partialMelds?: Meld[]
  /** Score without mutating tile state, for the pre-play preview. */
  previewMode?: boolean
}

/**
 * Get points for a single tile based on its type
 */
export function getTilePoints(tile: Tile): number {
  if (tile.isHonor) return 15
  if (tile.isTerminal) return 10
  if (tile.isSimple) return 5
  return 0 // Bonus tiles don't count
}

/**
 * Get points for a meld structure
 */
export function getMeldStructurePoints(meld: Meld): number {
  switch (meld.type) {
    case MeldType.Pair:
      return 10
    case MeldType.Sequence:
      return 20
    case MeldType.Triplet:
      return 30
    case MeldType.Quad:
      return 50
    default:
      return 0
  }
}

/**
 * Calculate tile points from all tiles in the hand
 */
export function calculateTilePoints(tiles: Tile[]): number {
  return tiles.reduce((sum, tile) => sum + getTilePoints(tile), 0)
}

/**
 * Calculate structure points from all melds
 */
export function calculateStructurePoints(parsedHand: ParsedHand): number {
  let points = 0

  // Points from the 4 melds
  for (const meld of parsedHand.melds) {
    points += getMeldStructurePoints(meld)
  }

  // Points from the pair
  points += getMeldStructurePoints(parsedHand.pair)

  return points
}

/**
 * Calculate base points (tiles + structure)
 */
export function calculateBasePoints(
  tiles: Tile[],
  parsedHand: ParsedHand
): { tilePoints: number; structurePoints: number; basePoints: number } {
  const tilePoints = calculateTilePoints(tiles)
  const structurePoints = calculateStructurePoints(parsedHand)
  const basePoints = tilePoints + structurePoints

  return { tilePoints, structurePoints, basePoints }
}

/**
 * Calculate the complete score for a winning hand
 */
export function calculateScore(context: ScoringContext): ScoreBreakdown {
  const scoringTiles = context.debuffedTileIds
    ? context.tiles.filter((tile) => !context.debuffedTileIds?.has(tile.id))
    : context.tiles

  // 1. Calculate base points
  const isPartial = context.partialMelds !== undefined
  const tilePoints = calculateTilePoints(scoringTiles)
  const structurePoints = isPartial
    ? context.partialMelds!.reduce((sum, meld) => sum + getMeldStructurePoints(meld), 0)
    : calculateStructurePoints(context.parsedHand)
  const basePoints = tilePoints + structurePoints

  // 2. Calculate modifier bonuses from played tiles
  const modifierResult = tileModifierSystem.scoreTilesWithModifiers(
    scoringTiles,
    'played',
    { preview: context.previewMode }
  )
  const modifierChips = modifierResult.totalChips
  const modifierMult = modifierResult.totalMult
  const modifierMultiplier = modifierResult.totalMultiplier
  const goldEarned = modifierResult.totalGold
  const shatteredTiles = modifierResult.shatteredTileIds

  // 3. Calculate red five bonus chips
  const redFiveCount = countRedFives(scoringTiles)
  const redFiveChips = redFiveSystem.calculateBonus(scoringTiles)

  // Track retriggered tiles (Red Seal)
  const retriggeredTiles: string[] = []
  for (const tile of scoringTiles) {
    if (tile.retriggers > 0) {
      retriggeredTiles.push(tile.id)
    }
  }

  // 4. Create yaku context and detect yaku
  const yakuContext: YakuContext = {
    tiles: context.tiles,
    parsedHand: context.parsedHand,
    declaredMelds: context.declaredMelds,
    isConcealed: context.isConcealed,
    isTsumo: context.isTsumo,
    isRiichi: context.isRiichi,
    seatWind: context.seatWind,
    roundWind: context.roundWind,
    winningTile: context.winningTile,
    tanyaoAllowsTerminals: context.tanyaoAllowsTerminals,
  }

  // Yaku require a complete winning hand; a partial selection never earns one.
  const detectedYaku = isPartial ? [] : detectYaku(yakuContext)

  // 5. Calculate yaku multiplier (multiplicative stacking)
  const yakuMultiplier = calculateYakuMultiplier(detectedYaku)

  // 6. Apply additional bonuses from game systems (including red fives)
  const additiveBonus = (context.additiveBonus ?? 0) + modifierChips + modifierMult + redFiveChips
  const multiplicativeBonus = (context.multiplicativeBonus ?? 1) * modifierMultiplier

  // 7. Calculate final score
  // Formula: Final Score = (Base Points + Additive Bonuses) x Multiplicative Multipliers
  const subtotal = basePoints + additiveBonus
  const finalScore = Math.floor(subtotal * yakuMultiplier * multiplicativeBonus)

  return {
    basePoints,
    tilePoints,
    structurePoints,
    modifierChips,
    modifierMult,
    modifierMultiplier,
    redFiveCount,
    redFiveChips,
    detectedYaku,
    yakuMultiplier,
    additiveBonus,
    retriggeredTiles,
    shatteredTiles,
    goldEarned,
    subtotal,
    finalScore,
  }
}

/**
 * Create a default scoring context for simple calculations
 */
export function createScoringContext(
  tiles: Tile[],
  parsedHand: ParsedHand,
  options: {
    declaredMelds?: Meld[]
    isConcealed?: boolean
    isTsumo?: boolean
    isRiichi?: boolean
    seatWind?: WindType
    roundWind?: WindType
    winningTile?: Tile
    additiveBonus?: number
    multiplicativeBonus?: number
    debuffedTileIds?: ReadonlySet<string>
    tanyaoAllowsTerminals?: boolean
    partialMelds?: Meld[]
    previewMode?: boolean
  } = {}
): ScoringContext {
  return {
    tiles,
    parsedHand,
    declaredMelds: options.declaredMelds ?? [],
    isConcealed: options.isConcealed ?? true,
    isTsumo: options.isTsumo ?? true,
    isRiichi: options.isRiichi ?? false,
    seatWind: options.seatWind ?? WindType.East,
    roundWind: options.roundWind ?? WindType.East,
    winningTile: options.winningTile ?? tiles[tiles.length - 1],
    additiveBonus: options.additiveBonus,
    multiplicativeBonus: options.multiplicativeBonus,
    debuffedTileIds: options.debuffedTileIds,
    tanyaoAllowsTerminals: options.tanyaoAllowsTerminals,
    partialMelds: options.partialMelds,
    previewMode: options.previewMode,
  }
}

/**
 * Quick score calculation for a parsed hand with minimal context
 */
export function quickScore(tiles: Tile[], parsedHand: ParsedHand): number {
  const context = createScoringContext(tiles, parsedHand)
  return calculateScore(context).finalScore
}

/**
 * Format score breakdown for display
 */
export function formatScoreBreakdown(breakdown: ScoreBreakdown): string {
  const lines: string[] = []

  lines.push('=== SCORE BREAKDOWN ===')
  lines.push('')
  lines.push(`Tile Points: ${breakdown.tilePoints}`)
  lines.push(`Structure Points: ${breakdown.structurePoints}`)
  lines.push(`Base Points: ${breakdown.basePoints}`)
  lines.push('')

  // Modifier bonuses
  if (breakdown.modifierChips > 0 || breakdown.modifierMult > 0 || breakdown.modifierMultiplier !== 1) {
    lines.push('Tile Modifiers:')
    if (breakdown.modifierChips > 0) {
      lines.push(`  Bonus Chips: +${breakdown.modifierChips}`)
    }
    if (breakdown.modifierMult > 0) {
      lines.push(`  Bonus Mult: +${breakdown.modifierMult}`)
    }
    if (breakdown.modifierMultiplier !== 1) {
      lines.push(`  Mult Multiplier: x${breakdown.modifierMultiplier.toFixed(2)}`)
    }
    lines.push('')
  }

  // Red fives (aka-dora)
  if (breakdown.redFiveCount > 0 && breakdown.redFiveChips > 0) {
    lines.push(`Red Fives: ${breakdown.redFiveCount} (+${breakdown.redFiveChips} chips)`)
    lines.push('')
  }

  if (breakdown.detectedYaku.length > 0) {
    lines.push('Yaku:')
    for (const yaku of breakdown.detectedYaku) {
      lines.push(`  ${yaku.definition.name}: x${yaku.definition.multiplier.toFixed(2)}`)
    }
    lines.push(`Total Yaku Multiplier: x${breakdown.yakuMultiplier.toFixed(2)}`)
    lines.push('')
  }

  if (breakdown.additiveBonus > 0) {
    lines.push(`Additive Bonus: +${breakdown.additiveBonus}`)
  }

  lines.push(`Subtotal: ${breakdown.subtotal}`)
  lines.push('')

  // Retriggers and special effects
  if (breakdown.retriggeredTiles.length > 0) {
    lines.push(`Retriggered Tiles: ${breakdown.retriggeredTiles.length}`)
  }

  if (breakdown.shatteredTiles.length > 0) {
    lines.push(`Shattered Tiles: ${breakdown.shatteredTiles.length}`)
  }

  if (breakdown.goldEarned > 0) {
    lines.push(`Gold Earned: ¥${breakdown.goldEarned}`)
  }

  if (breakdown.retriggeredTiles.length > 0 || breakdown.shatteredTiles.length > 0 || breakdown.goldEarned > 0) {
    lines.push('')
  }

  lines.push(`FINAL SCORE: ${breakdown.finalScore}`)

  return lines.join('\n')
}

/**
 * Calculate score from tiles without a parsed hand (for simpler cases)
 * This is a convenience function that creates a minimal context
 */
export function calculateSimpleScore(
  tiles: Tile[],
  parsedHand: ParsedHand,
  yakuMultiplier: number = 1
): number {
  const { basePoints } = calculateBasePoints(tiles, parsedHand)
  return Math.floor(basePoints * yakuMultiplier)
}

/**
 * Estimate score range for a hand in progress
 * Useful for AI and player guidance
 */
export function estimateScoreRange(
  tiles: Tile[],
  estimatedYakuMultiplier: number = 1.5
): { min: number; max: number; average: number } {
  const tilePoints = calculateTilePoints(tiles)

  // Estimate structure points based on remaining tiles
  const estimatedStructureMin = 90 // 4 sequences + 1 pair minimum
  const estimatedStructureMax = 170 // 4 quads + 1 pair maximum
  const estimatedStructureAvg = 130 // Typical hand

  const min = Math.floor(
    (tilePoints + estimatedStructureMin) * estimatedYakuMultiplier
  )
  const max = Math.floor(
    (tilePoints + estimatedStructureMax) * estimatedYakuMultiplier * 2
  )
  const average = Math.floor(
    (tilePoints + estimatedStructureAvg) * estimatedYakuMultiplier
  )

  return { min, max, average }
}
