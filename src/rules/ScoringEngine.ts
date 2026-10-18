/**
 * Scoring Engine for Tensho Mahjong Roguelike
 *
 * Calculates final score using the Tensho formula:
 * Final Score = (Base Points + Additive Bonuses) x Multiplicative Multipliers
 *
 * Base points come from tiles and hand structure:
 * - Terminals (1,9): 10 points each
 * - Simples (2-8): 5 points each
 * - Winds: 50 points each; Dragons: 15 points each
 * - Pair: +15, Sequence: +30, Triplet: +40, Quad: +65,
 *   Straight of 4: +45, Straight of 5: +60
 * - A tile in a tactical play that belongs to no group scores half
 * - A Stone tile has no face: it joins no group and scores only its Stone Mark
 *
 * Mult starts at 1 (or the Yaku multiplier of a complete hand) and adds:
 * - the play pattern's Mult (see PlayPattern.ts)
 * - +2 for every Dragon that scores inside a group
 * - every scored Mark or Edition "+N Mult" (Mult Mark +4, Holo +10, Lucky +20)
 *
 * Tile modifiers also add:
 * - points from Marks and Editions (Bonus: +30, Stone: +100, Foil: +50)
 * - ×Mult layers (Glass ×2, Polychrome ×1.5, ×1.5 per Steel Mark held in rack)
 * - Seal effects (Gold: ¥3, Red: retrigger, etc.)
 *
 * Red fives (aka-dora) add:
 * - +50 bonus chips per red five when enabled
 */

import { Tile, TileSuit, WindType } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { ParsedHand } from '../core/Hand'
import {
  DetectedYaku,
  YakuContext,
  detectYaku,
  calculateYakuMultiplier,
} from './YakuDetector'
import { tileModifierSystem } from '../systems/TileModifierSystem'
import { redFiveSystem, countRedFives } from '../systems/RedFiveSystem'
import type { ScoreEquation } from './ScoreEquation'
import {
  classifyMahjong,
  classifyPlay,
  DRAGON_GROUP_MULT,
  type PlayPattern,
} from './PlayPattern'

/** Structural classification before numeric bonuses/debuffs, shared with the forecast. */
export interface ScoredStructure {
  kind: 'tactical' | 'complete'
  groupedTiles: number
  looseTiles: number
}

/**
 * Detailed score breakdown
 */
export interface ScoreBreakdown {
  // Base components
  basePoints: number
  tilePoints: number
  structurePoints: number
  structure: ScoredStructure
  /** Actual gapped groups in this scored interpretation, for optional explanations. */
  skippedSequences?: Tile[][]
  flowerSequences?: { overlapping: Tile[][]; anchored: Tile[][] }

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

  /** What the play scored as, and the Mult its pattern adds. */
  pattern: PlayPattern
  /** Mult added by Dragons scoring inside a group (+2 each trigger). */
  dragonMult: number

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
  /** Present after the orchestrator applies all gameplay-system layers. */
  equation?: ScoreEquation
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
  /**
   * Extra scoring repetitions per tile id, contributed by Decrees. A tile with
   * one extra trigger contributes its points and modifier bonuses twice.
   */
  extraRetriggers?: ReadonlyMap<string, number>
  /** Share of Decree repeat rewards retained; never scales native tile effects. */
  retriggerStrength?: number
  /** Rack tiles left out of this play; each held Steel Mark multiplies it. */
  heldTiles?: Tile[]
}

/**
 * Share of its face value a tile keeps when it belongs to no group.
 *
 * Section 1.1 of `docs/GAMEPLAY_EXPERIMENTS.md` records the problem this
 * solves: a player who learned to spot a sequence (15 tile points + 20
 * structure = 35) scored less than one who tapped three unrelated Honors (45
 * and no structure). Recognising a pattern has to be worth learning.
 *
 * Halving rather than zeroing is deliberate. The document asks for loose-tile
 * strategies to stay possible rather than be deleted, and for different builds
 * to keep valuing different things — an Honor triplet still beats a run of
 * simples.
 *
 * Complete hands are untouched by construction: every tile in a winning hand
 * belongs to a meld or the pair, so nothing about the eight-Act target curve or
 * the Decrees that scale off it moves.
 */
export const UNGROUPED_TILE_SHARE = 0.5

/**
 * Get points for a single tile based on its type
 */
export function getTilePoints(tile: Tile): number {
  // A Stone has no face; its Stone Mark chips are its whole value.
  if (tile.isStone) return 0
  if (tile.suit === TileSuit.Wind) return WIND_TILE_POINTS
  if (tile.isHonor) return DRAGON_TILE_POINTS
  if (tile.isTerminal) return 10
  if (tile.isSimple) return 5
  return 0 // Bonus tiles don't count
}

/** Winds are the big-points honors. */
export const WIND_TILE_POINTS = 50
/** Dragons keep modest points; their power is Mult (see DRAGON_GROUP_MULT). */
export const DRAGON_TILE_POINTS = 15

/**
 * Points a group is worth for being a group.
 *
 * Raised from 10/20/30/50 alongside the ungrouped-tile discount above. The two
 * changes move value from loose tiles into recognised shapes rather than taking
 * it out of the game: measured over 150 seeded runs, a policy that always plays
 * its highest-scoring selection clears 1.37 rounds a run against 1.32 before,
 * so the Act curve is where it was while the reward for spotting a pattern is
 * not. See `scripts/classic-balance.mts`.
 *
 * The one table. `PartialHandParser` searches with these weights and the coach
 * ranks with them, so they may not be copied.
 */
export const STRUCTURE_POINTS_BY_TYPE: Record<MeldType, number> = {
  [MeldType.Pair]: 15,
  [MeldType.Sequence]: 30,
  [MeldType.Triplet]: 40,
  [MeldType.Quad]: 65,
  // A four-tile straight; a five-tile straight is worth STRAIGHT_5_POINTS.
  [MeldType.Straight]: 45,
}

/** Structure points for a five-tile straight. */
export const STRAIGHT_5_POINTS = 60

/** Structure points for a group of this type and size. */
export function structurePointsFor(type: MeldType, size: number): number {
  return type === MeldType.Straight && size >= 5
    ? STRAIGHT_5_POINTS
    : STRUCTURE_POINTS_BY_TYPE[type]
}

/**
 * Get points for a meld structure
 */
export function getMeldStructurePoints(meld: Meld): number {
  return structurePointsFor(meld.type, meld.tiles.length) ?? 0
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
  // A retriggered tile scores its whole contribution again, so expand the
  // scoring list rather than only repeating modifier bonuses.
  const strength = context.retriggerStrength ?? 1
  const triggerCountFor = (tile: Tile): number =>
    (1 + tile.retriggers) *
    (1 + Math.max(0, context.extraRetriggers?.get(tile.id) ?? 0))
  const triggeredTiles = scoringTiles.flatMap((tile) =>
    new Array<Tile>(triggerCountFor(tile)).fill(tile)
  )
  const nativeTriggeredTiles = scoringTiles.flatMap((tile) =>
    new Array<Tile>(1 + tile.retriggers).fill(tile)
  )

  // A tactical selection pays full price only for the tiles it actually
  // organised; the rest are loose change. `partialMelds` is undefined for a
  // complete hand, where every tile is grouped anyway.
  const groupedTileIds = isPartial
    ? new Set(
        context.partialMelds!.flatMap((meld) =>
          meld.tiles.map((tile) => tile.id)
        )
      )
    : null
  // Count tiles in the scored parse, not retriggers or only non-debuffed tiles:
  // suppression changes a tile's value, not whether it belongs to a group.
  // A Stone belongs to no group, but it is not loose either: it always scores.
  const structureTiles = context.tiles.filter(
    (tile) => !tile.isBonus && !tile.isStone
  )
  const looseTiles = groupedTileIds
    ? structureTiles.filter((tile) => !groupedTileIds.has(tile.id)).length
    : 0
  const tilePointsFor = (tile: Tile): number => {
    const base = getTilePoints(tile)
    if (!groupedTileIds || groupedTileIds.has(tile.id)) return base
    return Math.floor(base * UNGROUPED_TILE_SHARE)
  }

  const tilePoints = scoringTiles.reduce(
    (sum, tile) =>
      sum +
      tilePointsFor(tile) *
        (1 + tile.retriggers) *
        (1 +
          Math.max(0, context.extraRetriggers?.get(tile.id) ?? 0) * strength),
    0
  )
  const structurePoints = isPartial
    ? context.partialMelds!.reduce(
        (sum, meld) => sum + getMeldStructurePoints(meld),
        0
      )
    : calculateStructurePoints(context.parsedHand)
  const basePoints = tilePoints + structurePoints

  // 2. Calculate modifier bonuses from played tiles
  const modifierResult = tileModifierSystem.scoreTilesWithModifiers(
    scoringTiles,
    'played',
    {
      preview: context.previewMode,
      extraRetriggers: context.extraRetriggers,
      retriggerStrength: strength,
    }
  )
  // Tiles kept in the rack pay only their held ×Mult (Steel). A held Gold
  // Mark's coins belong to the end of the round, not to every play.
  const heldMultiplier = tileModifierSystem.scoreTilesWithModifiers(
    (context.heldTiles ?? []).filter(
      (tile) => !context.debuffedTileIds?.has(tile.id)
    ),
    'held',
    { preview: context.previewMode }
  ).totalMultiplier
  const modifierChips = modifierResult.totalChips
  const modifierMult = modifierResult.totalMult
  const modifierMultiplier = modifierResult.totalMultiplier * heldMultiplier
  const goldEarned = modifierResult.totalGold
  const shatteredTiles = [...new Set(modifierResult.shatteredTileIds)]

  // 3. Calculate red five bonus chips
  const redFiveCount = countRedFives(triggeredTiles)
  const nativeRedFiveChips = redFiveSystem.calculateBonus(nativeTriggeredTiles)
  const redFiveChips =
    nativeRedFiveChips +
    (redFiveSystem.calculateBonus(triggeredTiles) - nativeRedFiveChips) *
      strength

  // Track retriggered tiles (Red Seal and Decree retriggers)
  const retriggeredTiles: string[] = []
  for (const tile of scoringTiles) {
    if (tile.retriggers > 0 || triggerCountFor(tile) > 1) {
      retriggeredTiles.push(tile.id)
    }
  }

  // 4. Create yaku context and detect yaku
  const yakuContext: YakuContext = {
    // A Stone has no rank or suit for a Yaku to read.
    tiles: context.tiles.filter((tile) => !tile.isStone),
    parsedHand: context.parsedHand,
    declaredMelds: context.declaredMelds,
    isConcealed: context.isConcealed,
    isTsumo: context.isTsumo,
    seatWind: context.seatWind,
    roundWind: context.roundWind,
    winningTile: context.winningTile,
    tanyaoAllowsTerminals: context.tanyaoAllowsTerminals,
  }

  // Yaku require a complete winning hand; a partial selection never earns one.
  const detectedYaku = isPartial ? [] : detectYaku(yakuContext)

  // 5. Calculate yaku multiplier (multiplicative stacking)
  const yakuMultiplier = calculateYakuMultiplier(detectedYaku)

  // 5b. The pattern's Mult, and every grouped Dragon's. Every tile of a
  // complete hand belongs to its structure; a tactical play's loose Dragons
  // score only their (halved) points.
  const pattern = isPartial
    ? classifyPlay(context.partialMelds!)
    : classifyMahjong([
        ...(context.parsedHand?.melds ?? []),
        ...(context.parsedHand?.pair?.tiles.length
          ? [context.parsedHand.pair]
          : []),
      ])
  const dragonMult = scoringTiles.reduce(
    (sum, tile) =>
      tile.suit === TileSuit.Dragon &&
      !tile.isStone &&
      (!groupedTileIds || groupedTileIds.has(tile.id))
        ? sum +
          DRAGON_GROUP_MULT *
            (1 + tile.retriggers) *
            (1 +
              Math.max(0, context.extraRetriggers?.get(tile.id) ?? 0) *
                strength)
        : sum,
    0
  )

  // 6. Apply additional bonuses from game systems (including red fives)
  const additiveBonus =
    (context.additiveBonus ?? 0) + modifierChips + redFiveChips
  const multiplicativeBonus =
    (context.multiplicativeBonus ?? 1) * modifierMultiplier

  // 7. Calculate final score
  // Formula: Final Score = (Base Points + Additive Bonuses) x Multiplicative Multipliers
  // A Mark or Edition's "+N Mult" joins the play's Mult, like a Dragon's.
  const subtotal = basePoints + additiveBonus
  const finalScore = Math.floor(
    subtotal *
      (yakuMultiplier + pattern.mult + dragonMult + modifierMult) *
      multiplicativeBonus
  )

  return {
    basePoints,
    tilePoints,
    structurePoints,
    skippedSequences: (context.partialMelds ?? context.parsedHand?.melds ?? [])
      .filter(
        (meld) =>
          meld.type === MeldType.Sequence &&
          meld.highestRank - meld.lowestRank === 3
      )
      .map((meld) => meld.tiles),
    structure: {
      kind: isPartial ? 'tactical' : 'complete',
      groupedTiles: structureTiles.length - looseTiles,
      looseTiles,
    },
    modifierChips,
    modifierMult,
    modifierMultiplier,
    redFiveCount,
    redFiveChips,
    detectedYaku,
    yakuMultiplier,
    pattern,
    dragonMult,
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
    seatWind?: WindType
    roundWind?: WindType
    winningTile?: Tile
    additiveBonus?: number
    multiplicativeBonus?: number
    debuffedTileIds?: ReadonlySet<string>
    tanyaoAllowsTerminals?: boolean
    partialMelds?: Meld[]
    previewMode?: boolean
    extraRetriggers?: ReadonlyMap<string, number>
    retriggerStrength?: number
    heldTiles?: Tile[]
  } = {}
): ScoringContext {
  return {
    tiles,
    parsedHand,
    declaredMelds: options.declaredMelds ?? [],
    isConcealed: options.isConcealed ?? true,
    isTsumo: options.isTsumo ?? true,
    seatWind: options.seatWind ?? WindType.East,
    roundWind: options.roundWind ?? WindType.East,
    winningTile: options.winningTile ?? tiles[tiles.length - 1],
    additiveBonus: options.additiveBonus,
    multiplicativeBonus: options.multiplicativeBonus,
    debuffedTileIds: options.debuffedTileIds,
    tanyaoAllowsTerminals: options.tanyaoAllowsTerminals,
    partialMelds: options.partialMelds,
    previewMode: options.previewMode,
    extraRetriggers: options.extraRetriggers,
    retriggerStrength: options.retriggerStrength,
    heldTiles: options.heldTiles,
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
  if (
    breakdown.modifierChips > 0 ||
    breakdown.modifierMult > 0 ||
    breakdown.modifierMultiplier !== 1
  ) {
    lines.push('Tile Modifiers:')
    if (breakdown.modifierChips > 0) {
      lines.push(`  Bonus Chips: +${breakdown.modifierChips}`)
    }
    if (breakdown.modifierMult > 0) {
      lines.push(`  Bonus Mult: +${breakdown.modifierMult}`)
    }
    if (breakdown.modifierMultiplier !== 1) {
      lines.push(
        `  Mult Multiplier: x${breakdown.modifierMultiplier.toFixed(2)}`
      )
    }
    lines.push('')
  }

  // Red fives (aka-dora)
  if (breakdown.redFiveCount > 0 && breakdown.redFiveChips > 0) {
    lines.push(
      `Red Fives: ${breakdown.redFiveCount} (+${breakdown.redFiveChips} chips)`
    )
    lines.push('')
  }

  if (breakdown.detectedYaku.length > 0) {
    lines.push('Yaku:')
    for (const yaku of breakdown.detectedYaku) {
      lines.push(
        `  ${yaku.definition.name}: x${yaku.definition.multiplier.toFixed(2)}`
      )
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

  if (
    breakdown.retriggeredTiles.length > 0 ||
    breakdown.shatteredTiles.length > 0 ||
    breakdown.goldEarned > 0
  ) {
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
