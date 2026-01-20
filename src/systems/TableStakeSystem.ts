/**
 * Table Stake System for Tensho Mahjong Roguelike
 *
 * Implements 8 difficulty tiers that stack cumulatively.
 * Based on ARCHITECTURE.MD Section 25 - Table Stakes (場代).
 *
 * Each stake adds ALL modifiers from previous stakes, creating exponential challenge.
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Stake modifier that affects gameplay
 */
export interface StakeModifier {
  /** No reward Gold from Small Rounds */
  noSmallRoundReward?: boolean
  /** Score requirement scaling multiplier */
  scoreScaling?: number
  /** Chance for Eternal sticker on shop Decrees (0-1) */
  eternalChance?: number
  /** Reduction in redraws per round */
  redrawPenalty?: number
  /** Chance for Perishable sticker on shop Decrees (0-1) */
  perishableChance?: number
  /** Chance for Rental sticker on shop Decrees (0-1) */
  rentalChance?: number
}

/**
 * Table stake tier definition
 */
export interface TableStake {
  /** Tier number (1-8) */
  tier: number
  /** Display name in English */
  name: string
  /** Japanese name with kanji */
  japaneseName: string
  /** Color hex code for UI */
  color: string
  /** New modifier introduced at this stake */
  modifier: StakeModifier
  /** Wall variant unlocked at this stake */
  unlocks?: string
}

/**
 * Combined modifiers from all active stakes
 */
export interface CombinedStakeModifiers {
  noSmallRoundReward: boolean
  scoreScaling: number
  eternalChance: number
  redrawPenalty: number
  perishableChance: number
  rentalChance: number
}

// =============================================================================
// STAKE DEFINITIONS
// =============================================================================

/**
 * All 8 table stakes as defined in ARCHITECTURE.MD
 */
export const TABLE_STAKES: TableStake[] = [
  {
    tier: 1,
    name: 'White Stake',
    japaneseName: '白場',
    color: '#E0E0E0',
    modifier: {},
    unlocks: undefined, // Starting tier
  },
  {
    tier: 2,
    name: 'Red Stake',
    japaneseName: '赤場',
    color: '#E53935',
    modifier: { noSmallRoundReward: true },
    unlocks: 'crimson_wall',
  },
  {
    tier: 3,
    name: 'Green Stake',
    japaneseName: '緑場',
    color: '#43A047',
    modifier: { scoreScaling: 1.3 }, // Faster scaling
    unlocks: 'jade_wall',
  },
  {
    tier: 4,
    name: 'Black Stake',
    japaneseName: '黒場',
    color: '#212121',
    modifier: { eternalChance: 0.3 },
    unlocks: 'obsidian_wall',
  },
  {
    tier: 5,
    name: 'Blue Stake',
    japaneseName: '青場',
    color: '#1E88E5',
    modifier: { redrawPenalty: 1 },
    unlocks: 'azure_wall',
  },
  {
    tier: 6,
    name: 'Purple Stake',
    japaneseName: '紫場',
    color: '#8E24AA',
    modifier: { scoreScaling: 1.5 }, // Even faster scaling (stacks with Green)
    unlocks: undefined,
  },
  {
    tier: 7,
    name: 'Orange Stake',
    japaneseName: '橙場',
    color: '#FB8C00',
    modifier: { perishableChance: 0.3 },
    unlocks: 'sunset_wall',
  },
  {
    tier: 8,
    name: 'Gold Stake',
    japaneseName: '金場',
    color: '#FFD700',
    modifier: { rentalChance: 0.3 },
    unlocks: undefined, // Maximum difficulty
  },
]

/**
 * Default combined modifiers (no stakes active)
 */
const DEFAULT_MODIFIERS: CombinedStakeModifiers = {
  noSmallRoundReward: false,
  scoreScaling: 1.0,
  eternalChance: 0,
  redrawPenalty: 0,
  perishableChance: 0,
  rentalChance: 0,
}

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
  getStake(tier: number): TableStake | undefined {
    return TABLE_STAKES.find((s) => s.tier === tier)
  }

  /**
   * Get all stake definitions
   */
  getAllStakes(): TableStake[] {
    return [...TABLE_STAKES]
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
    const combined: CombinedStakeModifiers = { ...DEFAULT_MODIFIERS }

    for (let tier = 1; tier <= Math.min(stakeTier, 8); tier++) {
      const stake = TABLE_STAKES[tier - 1]
      if (!stake) continue

      const mod = stake.modifier

      // Boolean modifiers - once true, always true
      if (mod.noSmallRoundReward) {
        combined.noSmallRoundReward = true
      }

      // Score scaling - multiplicative stacking
      if (mod.scoreScaling) {
        combined.scoreScaling *= mod.scoreScaling
      }

      // Sticker chances - additive (capped at 1.0)
      if (mod.eternalChance) {
        combined.eternalChance = Math.min(1, combined.eternalChance + mod.eternalChance)
      }
      if (mod.perishableChance) {
        combined.perishableChance = Math.min(1, combined.perishableChance + mod.perishableChance)
      }
      if (mod.rentalChance) {
        combined.rentalChance = Math.min(1, combined.rentalChance + mod.rentalChance)
      }

      // Redraw penalty - additive
      if (mod.redrawPenalty) {
        combined.redrawPenalty += mod.redrawPenalty
      }
    }

    return combined
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
   * Determine which sticker (if any) to apply to a shop decree
   * Returns null if no sticker should be applied
   */
  rollForSticker(stakeTier: number): 'Eternal' | 'Perishable' | 'Rental' | null {
    const modifiers = this.getModifiers(stakeTier)

    // Roll for each sticker type independently
    // A decree can have multiple stickers at high stakes
    const stickers: Array<'Eternal' | 'Perishable' | 'Rental'> = []

    if (Math.random() < modifiers.eternalChance) {
      stickers.push('Eternal')
    }
    if (Math.random() < modifiers.perishableChance) {
      stickers.push('Perishable')
    }
    if (Math.random() < modifiers.rentalChance) {
      stickers.push('Rental')
    }

    // Eternal and Perishable cannot both apply (Eternal wins)
    if (stickers.includes('Eternal') && stickers.includes('Perishable')) {
      const idx = stickers.indexOf('Perishable')
      stickers.splice(idx, 1)
    }

    // For simplicity, return the first sticker
    // Full implementation would support multiple stickers
    return stickers[0] ?? null
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
   * Check if a wall variant is unlocked based on stake progress
   */
  isWallUnlocked(wallId: string): boolean {
    // Find which stake unlocks this wall
    const stake = TABLE_STAKES.find((s) => s.unlocks === wallId)
    if (!stake) {
      // Wall doesn't require stake unlock (e.g., Red Wall is default)
      return true
    }

    // Check if any wall has completed the required stake
    for (const [, completedTier] of this.stakeProgressPerWall) {
      if (completedTier >= stake.tier) {
        return true
      }
    }

    return false
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
    return TABLE_STAKES[tier - 1]?.color ?? '#E0E0E0'
  }

  /**
   * Get stake display name
   */
  getStakeName(tier: number): string {
    return TABLE_STAKES[tier - 1]?.name ?? 'Unknown Stake'
  }

  /**
   * Get stake Japanese name
   */
  getStakeJapaneseName(tier: number): string {
    return TABLE_STAKES[tier - 1]?.japaneseName ?? '不明'
  }

  /**
   * Format stake modifier description for UI
   */
  getModifierDescription(stakeTier: number): string[] {
    const descriptions: string[] = []
    const stake = TABLE_STAKES[stakeTier - 1]
    if (!stake) return descriptions

    const mod = stake.modifier

    if (mod.noSmallRoundReward) {
      descriptions.push('Small Rounds give no reward Gold')
    }
    if (mod.scoreScaling) {
      const percent = Math.round((mod.scoreScaling - 1) * 100)
      descriptions.push(`Score requirements +${percent}% faster scaling`)
    }
    if (mod.eternalChance) {
      descriptions.push(`${Math.round(mod.eternalChance * 100)}% Eternal stickers on shop Decrees`)
    }
    if (mod.redrawPenalty) {
      descriptions.push(`-${mod.redrawPenalty} Redraw per round`)
    }
    if (mod.perishableChance) {
      descriptions.push(`${Math.round(mod.perishableChance * 100)}% Perishable stickers on shop Decrees`)
    }
    if (mod.rentalChance) {
      descriptions.push(`${Math.round(mod.rentalChance * 100)}% Rental stickers on shop Decrees`)
    }

    return descriptions
  }

  /**
   * Get cumulative modifier descriptions for current stake
   */
  getCumulativeModifierDescriptions(stakeTier: number): string[] {
    const allDescriptions: string[] = []

    for (let tier = 1; tier <= Math.min(stakeTier, 8); tier++) {
      const descriptions = this.getModifierDescription(tier)
      allDescriptions.push(...descriptions)
    }

    return allDescriptions
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
  const stake = TABLE_STAKES.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  )
  return stake?.tier
}

/**
 * Get stake tier color for badge/icon display
 */
export function getStakeColorByTier(tier: number): string {
  return TABLE_STAKES[tier - 1]?.color ?? '#E0E0E0'
}

/**
 * Format stake sticker probability string for UI
 * Example: At Gold Stake: "28% None, 21.6% Eternal, 21.6% Perishable, 21.6% Rental"
 */
export function formatStickerProbabilities(stakeTier: number): string {
  const modifiers = new TableStakeSystem().getModifiers(stakeTier)

  const parts: string[] = []

  const eternal = modifiers.eternalChance
  const perishable = modifiers.perishableChance
  const rental = modifiers.rentalChance

  // Probability of no sticker
  const noneProb = (1 - eternal) * (1 - perishable) * (1 - rental)

  if (noneProb > 0) {
    parts.push(`${Math.round(noneProb * 100)}% None`)
  }
  if (eternal > 0) {
    parts.push(`${Math.round(eternal * 100)}% Eternal`)
  }
  if (perishable > 0) {
    parts.push(`${Math.round(perishable * 100)}% Perishable`)
  }
  if (rental > 0) {
    parts.push(`${Math.round(rental * 100)}% Rental`)
  }

  return parts.join(', ')
}
