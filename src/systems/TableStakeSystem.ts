/**
 * Table Stake System for Tensho Mahjong Roguelike
 *
 * Implements 8 difficulty tiers that stack cumulatively.
 * Based on ARCHITECTURE.MD Section 25 - Table Stakes (場代).
 *
 * Each stake adds ALL modifiers from previous stakes, creating exponential challenge.
 */

import {
  STAKE_DEFINITIONS,
  STICKER_DEFINITIONS,
  calculateCombinedModifiers,
  rollForStickers,
  getPrimarySticker,
  getStakeByTier,
  getStakeColor,
  getStakeJapaneseName,
  getStakeModifierDescriptions,
  getCumulativeModifierDescriptions,
  formatStickerProbabilities,
  isWallUnlocked,
  type StakeDefinition,
  type CombinedStakeModifiers,
  type StickerRollResult,
  type StickerConfig,
} from '../config/stakeDefinitions'
import { StickerType, Sticker } from './types'

// =============================================================================
// RE-EXPORTS FROM CONFIG
// =============================================================================

export {
  STAKE_DEFINITIONS,
  STICKER_DEFINITIONS,
  calculateCombinedModifiers,
  rollForStickers,
  getPrimarySticker,
  getStakeByTier,
  getStakeColor,
  getStakeJapaneseName,
  getStakeModifierDescriptions,
  getCumulativeModifierDescriptions,
  formatStickerProbabilities,
  isWallUnlocked,
}

export type {
  StakeDefinition,
  CombinedStakeModifiers,
  StickerRollResult,
  StickerConfig,
}

// =============================================================================
// LEGACY TYPE ALIASES (for backwards compatibility)
// =============================================================================

export type TableStake = StakeDefinition
export type StakeModifier = StakeDefinition['modifier']

/**
 * Legacy constant - use STAKE_DEFINITIONS instead
 */
export const TABLE_STAKES = STAKE_DEFINITIONS

// =============================================================================
// TABLE STAKE SYSTEM CLASS
// =============================================================================

/**
 * Manages table stake difficulty tiers with cumulative modifiers
 */
export class TableStakeSystem {
  /** Stake progress per wall (wallId -> completed stake tier) */
  private stakeProgressPerWall: Map<string, number> = new Map()

  constructor(initialProgress?: Map<string, number>) {
    if (initialProgress) {
      this.stakeProgressPerWall = new Map(initialProgress)
    }
  }

  // ===========================================================================
  // STAKE ACCESS
  // ===========================================================================

  /**
   * Get a stake definition by tier
   */
  getStake(tier: number): StakeDefinition | undefined {
    return getStakeByTier(tier)
  }

  /**
   * Get all stake definitions
   */
  getAllStakes(): StakeDefinition[] {
    return [...STAKE_DEFINITIONS]
  }

  /**
   * Check if a stake tier is unlocked for a specific wall
   */
  isUnlocked(wallId: string, stakeTier: number): boolean {
    if (stakeTier === 1) return true // White stake is always unlocked

    const completedTier = this.stakeProgressPerWall.get(wallId) ?? 0
    return stakeTier <= completedTier + 1
  }

  /**
   * Get the highest completed stake tier for a wall
   */
  getCompletedStake(wallId: string): number {
    return this.stakeProgressPerWall.get(wallId) ?? 0
  }

  /**
   * Get the highest available (unlocked) stake tier for a wall
   */
  getHighestAvailableStake(wallId: string): number {
    const completed = this.getCompletedStake(wallId)
    return Math.min(completed + 1, 8)
  }

  // ===========================================================================
  // MODIFIER CALCULATION
  // ===========================================================================

  /**
   * Calculate combined modifiers for a given stake tier
   * Stakes stack cumulatively - all previous modifiers apply
   */
  getModifiers(stakeTier: number): CombinedStakeModifiers {
    return calculateCombinedModifiers(stakeTier)
  }

  /**
   * Get scaled score requirement for an act
   * Applies score scaling from current stake modifiers
   */
  getScaledScoreRequirement(baseScore: number, stakeTier: number): number {
    const modifiers = this.getModifiers(stakeTier)
    return Math.floor(baseScore * modifiers.scoreScaling)
  }

  /**
   * Get redraw penalty for current stake
   */
  getRedrawPenalty(stakeTier: number): number {
    return this.getModifiers(stakeTier).redrawPenalty
  }

  /**
   * Check if small round rewards are disabled
   */
  hasNoSmallRoundReward(stakeTier: number): boolean {
    return this.getModifiers(stakeTier).noSmallRoundReward
  }

  // ===========================================================================
  // STICKER SYSTEM
  // ===========================================================================

  /**
   * Roll for stickers on a shop decree
   * Returns the stickers that should be applied
   */
  rollForStickers(stakeTier: number): StickerRollResult {
    return rollForStickers(stakeTier)
  }

  /**
   * Get primary sticker for simpler implementations
   */
  getPrimarySticker(stakeTier: number): StickerType | null {
    return getPrimarySticker(stakeTier)
  }

  /**
   * Create a Sticker object from roll result
   */
  createSticker(stickerType: StickerType): Sticker {
    const config = STICKER_DEFINITIONS[stickerType]

    const sticker: Sticker = {
      type: stickerType,
    }

    if (stickerType === 'Perishable') {
      sticker.roundsRemaining = config.roundsToDebuff ?? 5
    }

    if (stickerType === 'Rental') {
      sticker.goldPerRound = config.goldPerRound ?? 3
    }

    return sticker
  }

  /**
   * Create stickers from roll result
   */
  createStickersFromRoll(result: StickerRollResult): Sticker[] {
    return result.stickers.map((type) => this.createSticker(type))
  }

  /**
   * Apply stickers to a decree in the shop
   * Returns the modified decree cost and sticker info
   */
  applyShopStickers(
    stakeTier: number,
    baseCost: number
  ): {
    sticker: Sticker | undefined
    modifiedCost: number
    isRental: boolean
  } {
    const result = this.rollForStickers(stakeTier)

    if (result.stickers.length === 0) {
      return { sticker: undefined, modifiedCost: baseCost, isRental: false }
    }

    // Get primary sticker for decree
    const primaryType = result.stickers[0]
    const sticker = this.createSticker(primaryType)

    let modifiedCost = baseCost

    // Rental stickers cost only 1 Gold to purchase
    if (result.stickers.includes('Rental')) {
      modifiedCost = STICKER_DEFINITIONS.Rental.purchaseCost ?? 1
    }

    return {
      sticker,
      modifiedCost,
      isRental: result.stickers.includes('Rental'),
    }
  }

  // ===========================================================================
  // PROGRESSION
  // ===========================================================================

  /**
   * Mark a stake as completed for a wall
   */
  completeStake(wallId: string, stakeTier: number): void {
    const current = this.stakeProgressPerWall.get(wallId) ?? 0
    if (stakeTier > current && stakeTier <= 8) {
      this.stakeProgressPerWall.set(wallId, stakeTier)
    }
  }

  /**
   * Get all walls that have completed a specific stake tier
   */
  getWallsWithStake(stakeTier: number): string[] {
    const walls: string[] = []
    this.stakeProgressPerWall.forEach((completed, wallId) => {
      if (completed >= stakeTier) {
        walls.push(wallId)
      }
    })
    return walls
  }

  /**
   * Get highest stake completed across all walls
   */
  getGlobalHighestStake(): number {
    let highest = 0
    this.stakeProgressPerWall.forEach((completed) => {
      highest = Math.max(highest, completed)
    })
    return highest
  }

  /**
   * Check if a wall variant is unlocked based on stake progress
   */
  isWallUnlocked(wallId: string): boolean {
    const globalHighest = this.getGlobalHighestStake()
    return isWallUnlocked(wallId, globalHighest)
  }

  /**
   * Get progress summary for all walls
   */
  getProgressSummary(): Map<string, number> {
    return new Map(this.stakeProgressPerWall)
  }

  // ===========================================================================
  // DISPLAY HELPERS
  // ===========================================================================

  /**
   * Get stake color for UI display
   */
  getStakeColor(tier: number): string {
    return getStakeColor(tier)
  }

  /**
   * Get stake display name
   */
  getStakeName(tier: number): string {
    return STAKE_DEFINITIONS[tier - 1]?.name ?? 'Unknown Stake'
  }

  /**
   * Get stake Japanese name
   */
  getStakeJapaneseName(tier: number): string {
    return getStakeJapaneseName(tier)
  }

  /**
   * Format stake modifier description for UI
   */
  getModifierDescription(stakeTier: number): string[] {
    return getStakeModifierDescriptions(stakeTier)
  }

  /**
   * Get cumulative modifier descriptions for current stake
   */
  getCumulativeModifierDescriptions(stakeTier: number): string[] {
    return getCumulativeModifierDescriptions(stakeTier)
  }

  /**
   * Format sticker probabilities for UI
   */
  formatStickerProbabilities(stakeTier: number): string {
    return formatStickerProbabilities(stakeTier)
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Serialize system state for persistence
   */
  toState(): {
    stakeProgressPerWall: [string, number][]
  } {
    return {
      stakeProgressPerWall: Array.from(this.stakeProgressPerWall.entries()),
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    stakeProgressPerWall: [string, number][]
  }): TableStakeSystem {
    return new TableStakeSystem(new Map(state.stakeProgressPerWall))
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get stake tier from name (case-insensitive)
 */
export function getStakeTierByName(name: string): number | undefined {
  const stake = STAKE_DEFINITIONS.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  )
  return stake?.tier
}

/**
 * Get stake tier color for badge/icon display
 */
export function getStakeColorByTier(tier: number): string {
  return getStakeColor(tier)
}
