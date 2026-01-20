/**
 * Season System for Tensho Mahjong Roguelike
 *
 * Seasons are round-scoped temporary modifiers that affect the current round only.
 * They are the highest authority in the system hierarchy and can override other effects.
 *
 * Base Seasons:
 * - Spring: +2 draws per hand
 * - Summer: Base score +30%, wall size -20%
 * - Autumn: Yaku multipliers +20%, larger discard pool
 * - Winter: Hand legality loosened, score -25%
 *
 * Corrupted Seasons (Act II+):
 * - Drought: Flowers are suppressed
 * - Monsoon: Draw order is randomized
 * - Frostbite: Decree effects are halved
 * - Decay: Each discard reduces score floor
 */

import { Tile, TileSuit } from '../core/Tile'
import {
  SeasonTile,
  SeasonVariant,
  SeasonEffect,
  SeasonState,
  CorruptedSeasonVariant,
  CorruptedSeasonEffect,
  ScoringContext,
} from './types'

// =============================================================================
// SEASON DEFINITIONS
// =============================================================================

/**
 * Base effects for each season type
 */
export const SEASON_BASE_EFFECTS: Record<SeasonVariant, SeasonEffect> = {
  Spring: {
    type: 'draw_bonus',
    value: 2,
    description: '+2 draws per hand',
  },
  Summer: {
    type: 'score_modifier',
    value: 0.3, // +30% base score
    description: 'Base score +30%, wall size -20%',
  },
  Autumn: {
    type: 'yaku_modifier',
    value: 0.2, // +20% to yaku multipliers
    description: 'Yaku multipliers +20%, larger discard pool',
  },
  Winter: {
    type: 'legality_modifier',
    value: -0.25, // -25% score
    description: 'Hand legality loosened, score -25%',
  },
}

/**
 * Corrupted season effects
 */
export const CORRUPTED_SEASON_EFFECTS: Record<CorruptedSeasonVariant, CorruptedSeasonEffect> = {
  Drought: {
    type: 'suppress_flowers',
    severity: 1,
    description: 'Flowers are suppressed this round',
  },
  Monsoon: {
    type: 'randomize_draws',
    severity: 1,
    description: 'Draw order is randomized',
  },
  Frostbite: {
    type: 'halve_decrees',
    severity: 0.5,
    description: 'Decree effects are halved',
  },
  Decay: {
    type: 'discard_penalty',
    severity: 10, // Points lost per discard
    description: 'Each discard reduces score floor',
  },
}

/**
 * Mapping from corrupted to base season types
 */
export const CORRUPTED_TO_BASE_SEASON: Record<CorruptedSeasonVariant, SeasonVariant> = {
  Drought: 'Summer',
  Monsoon: 'Spring',
  Frostbite: 'Winter',
  Decay: 'Autumn',
}

// =============================================================================
// SEASON SYSTEM CLASS
// =============================================================================

/**
 * Manages season effects and round-scoped modifiers
 */
export class SeasonSystem {
  private activeSeason: SeasonTile | null = null
  private seasonStack: SeasonTile[] = []
  private currentAct: number = 1
  private discardCount: number = 0

  constructor() {
    this.clear()
  }

  /**
   * Get the currently active season
   */
  getActiveSeason(): SeasonTile | null {
    return this.activeSeason
  }

  /**
   * Get all stacked seasons
   */
  getSeasonStack(): SeasonTile[] {
    return [...this.seasonStack]
  }

  /**
   * Check if the current round has corrupted season effects
   */
  isCorruptedRound(): boolean {
    return this.seasonStack.some((s) => s.isCorrupted)
  }

  /**
   * Set the current act (affects corrupted season availability)
   */
  setAct(actNumber: number): void {
    this.currentAct = actNumber
  }

  /**
   * Add a season tile to the round
   */
  addSeason(tile: Tile): SeasonTile | null {
    if (tile.suit !== TileSuit.Season) {
      return null
    }

    const seasonVariant = this.getSeasonVariantFromRank(tile.rank)
    if (!seasonVariant) {
      return null
    }

    // Determine if season should be corrupted (Act II+, with probability)
    const isCorrupted = this.shouldBeCorrupted(seasonVariant)
    const corruptedType = isCorrupted
      ? this.getCorruptedVariant(seasonVariant)
      : undefined

    const seasonTile: SeasonTile = {
      id: tile.id,
      type: seasonVariant,
      effect: SEASON_BASE_EFFECTS[seasonVariant],
      isCorrupted,
      corruptedType,
      corruptedEffect: corruptedType
        ? CORRUPTED_SEASON_EFFECTS[corruptedType]
        : undefined,
    }

    this.seasonStack.push(seasonTile)

    // First season becomes the active season
    if (!this.activeSeason) {
      this.activeSeason = seasonTile
    }

    return seasonTile
  }

  /**
   * Convert tile rank to season variant
   */
  private getSeasonVariantFromRank(rank: number): SeasonVariant | null {
    switch (rank) {
      case 1:
        return 'Spring'
      case 2:
        return 'Summer'
      case 3:
        return 'Autumn'
      case 4:
        return 'Winter'
      default:
        return null
    }
  }

  /**
   * Determine if a season should be corrupted
   */
  private shouldBeCorrupted(seasonVariant: SeasonVariant): boolean {
    // Corrupted seasons only appear from Act II onwards
    if (this.currentAct < 2) {
      return false
    }

    // Probability increases with act number
    // Act 2: 20%, Act 3: 30%, Act 4+: 40%
    const baseProbability = Math.min(0.2 + (this.currentAct - 2) * 0.1, 0.4)
    return Math.random() < baseProbability
  }

  /**
   * Get the corrupted variant for a season
   */
  private getCorruptedVariant(seasonVariant: SeasonVariant): CorruptedSeasonVariant {
    switch (seasonVariant) {
      case 'Spring':
        return 'Monsoon'
      case 'Summer':
        return 'Drought'
      case 'Autumn':
        return 'Decay'
      case 'Winter':
        return 'Frostbite'
    }
  }

  /**
   * Get draw bonus from active seasons
   */
  getDrawBonus(): number {
    let bonus = 0
    for (const season of this.seasonStack) {
      if (!season.isCorrupted && season.effect.type === 'draw_bonus') {
        bonus += season.effect.value
      }
    }
    return bonus
  }

  /**
   * Get wall size modifier from active seasons
   */
  getWallSizeModifier(): number {
    let modifier = 1.0
    for (const season of this.seasonStack) {
      if (season.type === 'Summer' && !season.isCorrupted) {
        modifier *= 0.8 // -20% wall size
      }
    }
    return modifier
  }

  /**
   * Get discard pool modifier from active seasons
   */
  getDiscardPoolModifier(): number {
    let modifier = 1.0
    for (const season of this.seasonStack) {
      if (season.type === 'Autumn' && !season.isCorrupted) {
        modifier *= 1.2 // +20% discard pool
      }
    }
    return modifier
  }

  /**
   * Calculate score modifier from active seasons
   */
  calculateScoreModifier(): number {
    let modifier = 1.0

    for (const season of this.seasonStack) {
      if (season.isCorrupted) {
        continue // Corrupted seasons don't give base bonuses
      }

      switch (season.type) {
        case 'Summer':
          modifier *= 1.3 // +30% base score
          break
        case 'Winter':
          modifier *= 0.75 // -25% score
          break
      }
    }

    return modifier
  }

  /**
   * Calculate yaku multiplier bonus from active seasons
   */
  calculateYakuBonus(): number {
    let bonus = 0

    for (const season of this.seasonStack) {
      if (season.type === 'Autumn' && !season.isCorrupted) {
        bonus += 0.2 // +20% to yaku multipliers
      }
    }

    return bonus
  }

  /**
   * Check if flowers are suppressed (Drought)
   */
  areFlowersSuppressed(): boolean {
    return this.seasonStack.some(
      (s) => s.isCorrupted && s.corruptedType === 'Drought'
    )
  }

  /**
   * Check if draws should be randomized (Monsoon)
   */
  areDrawsRandomized(): boolean {
    return this.seasonStack.some(
      (s) => s.isCorrupted && s.corruptedType === 'Monsoon'
    )
  }

  /**
   * Get decree effect modifier (Frostbite halves effects)
   */
  getDecreeEffectModifier(): number {
    const hasFrostbite = this.seasonStack.some(
      (s) => s.isCorrupted && s.corruptedType === 'Frostbite'
    )
    return hasFrostbite ? 0.5 : 1.0
  }

  /**
   * Track discard for Decay effect
   */
  onDiscard(): void {
    this.discardCount++
  }

  /**
   * Get score penalty from Decay
   */
  getDecayPenalty(): number {
    const hasDecay = this.seasonStack.some(
      (s) => s.isCorrupted && s.corruptedType === 'Decay'
    )

    if (!hasDecay) {
      return 0
    }

    const decayEffect = CORRUPTED_SEASON_EFFECTS.Decay
    return this.discardCount * decayEffect.severity
  }

  /**
   * Check if hand legality is loosened (Winter)
   */
  isHandLegalityLoosened(): boolean {
    return this.seasonStack.some(
      (s) => s.type === 'Winter' && !s.isCorrupted
    )
  }

  /**
   * Apply all season modifiers to scoring context
   */
  applySeasonModifiers(context: ScoringContext): {
    scoreMultiplier: number
    yakuBonus: number
    flowersSuppressed: boolean
    decreeModifier: number
    decayPenalty: number
  } {
    return {
      scoreMultiplier: this.calculateScoreModifier(),
      yakuBonus: this.calculateYakuBonus(),
      flowersSuppressed: this.areFlowersSuppressed(),
      decreeModifier: this.getDecreeEffectModifier(),
      decayPenalty: this.getDecayPenalty(),
    }
  }

  /**
   * Get the current season state
   */
  getState(): SeasonState {
    return {
      activeSeason: this.activeSeason,
      seasonStack: [...this.seasonStack],
      isCorruptedRound: this.isCorruptedRound(),
      effectMultiplier: this.calculateScoreModifier(),
    }
  }

  /**
   * Clear season state for new round
   */
  clear(): void {
    this.activeSeason = null
    this.seasonStack = []
    this.discardCount = 0
  }

  /**
   * Clear for new act (keeps act number)
   */
  clearForNewAct(): void {
    this.clear()
  }

  /**
   * Get a summary of active effects for UI display
   */
  getEffectSummary(): {
    name: string
    description: string
    isPositive: boolean
  }[] {
    const effects: { name: string; description: string; isPositive: boolean }[] = []

    for (const season of this.seasonStack) {
      if (season.isCorrupted && season.corruptedEffect) {
        effects.push({
          name: season.corruptedType ?? 'Corrupted',
          description: season.corruptedEffect.description,
          isPositive: false,
        })
      } else {
        effects.push({
          name: season.type,
          description: season.effect.description,
          isPositive: true,
        })
      }
    }

    return effects
  }

  /**
   * Force a specific season (for testing or mandates)
   */
  forceSetSeason(seasonVariant: SeasonVariant, isCorrupted: boolean = false): void {
    const seasonTile: SeasonTile = {
      id: `forced-${seasonVariant}-${Date.now()}`,
      type: seasonVariant,
      effect: SEASON_BASE_EFFECTS[seasonVariant],
      isCorrupted,
      corruptedType: isCorrupted ? this.getCorruptedVariant(seasonVariant) : undefined,
      corruptedEffect: isCorrupted
        ? CORRUPTED_SEASON_EFFECTS[this.getCorruptedVariant(seasonVariant)]
        : undefined,
    }

    this.clear()
    this.activeSeason = seasonTile
    this.seasonStack.push(seasonTile)
  }

  /**
   * Serialize season system state
   */
  toState(): {
    activeSeason: SeasonTile | null
    seasonStack: SeasonTile[]
    currentAct: number
    discardCount: number
  } {
    return {
      activeSeason: this.activeSeason,
      seasonStack: [...this.seasonStack],
      currentAct: this.currentAct,
      discardCount: this.discardCount,
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    activeSeason: SeasonTile | null
    seasonStack: SeasonTile[]
    currentAct: number
    discardCount: number
  }): SeasonSystem {
    const system = new SeasonSystem()
    system.activeSeason = state.activeSeason
    system.seasonStack = [...state.seasonStack]
    system.currentAct = state.currentAct
    system.discardCount = state.discardCount
    return system
  }
}

/**
 * Create a season tile from a standard tile
 */
export function createSeasonTile(
  tile: Tile,
  currentAct: number = 1
): SeasonTile | null {
  if (tile.suit !== TileSuit.Season) {
    return null
  }

  const variants: SeasonVariant[] = ['Spring', 'Summer', 'Autumn', 'Winter']
  const variant = variants[tile.rank - 1]

  if (!variant) {
    return null
  }

  // Determine corruption
  const shouldCorrupt = currentAct >= 2 && Math.random() < Math.min(0.2 + (currentAct - 2) * 0.1, 0.4)
  const corruptedVariant = shouldCorrupt
    ? (Object.entries(CORRUPTED_TO_BASE_SEASON).find(([, v]) => v === variant)?.[0] as CorruptedSeasonVariant)
    : undefined

  return {
    id: tile.id,
    type: variant,
    effect: SEASON_BASE_EFFECTS[variant],
    isCorrupted: shouldCorrupt,
    corruptedType: corruptedVariant,
    corruptedEffect: corruptedVariant ? CORRUPTED_SEASON_EFFECTS[corruptedVariant] : undefined,
  }
}

/**
 * Get the Japanese name for a season
 */
export function getSeasonJapaneseName(variant: SeasonVariant): string {
  switch (variant) {
    case 'Spring':
      return '春'
    case 'Summer':
      return '夏'
    case 'Autumn':
      return '秋'
    case 'Winter':
      return '冬'
  }
}

/**
 * Get the Japanese name for a corrupted season
 */
export function getCorruptedSeasonJapaneseName(variant: CorruptedSeasonVariant): string {
  switch (variant) {
    case 'Drought':
      return '旱魃'
    case 'Monsoon':
      return '豪雨'
    case 'Frostbite':
      return '凍傷'
    case 'Decay':
      return '腐敗'
  }
}
