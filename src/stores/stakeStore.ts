/**
 * Stake Store - Table Stakes difficulty tier state management
 *
 * Manages stake selection, unlocks, and progression for each Wall variant.
 * Stakes are tracked per-Wall independently.
 *
 * Based on ARCHITECTURE.MD Section 25 - Table Stakes (場代).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  STAKE_DEFINITIONS,
  calculateCombinedModifiers,
  rollForStickers,
  getStakeByTier,
  isWallUnlocked,
  type StakeDefinition,
  type CombinedStakeModifiers,
  type StickerRollResult,
} from '../config/stakeDefinitions'
import { StickerType } from '../systems/types'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Victory marker for completed stake runs
 */
export interface StakeVictory {
  wallId: string
  stakeTier: number
  completedAt: number // Timestamp
  finalScore: number
  actsCompleted: number
}

/**
 * Per-wall stake progress
 */
export interface WallStakeProgress {
  /** Wall identifier */
  wallId: string
  /** Highest stake tier completed (0 = none) */
  highestCompleted: number
  /** Victory history for this wall */
  victories: StakeVictory[]
}

/**
 * Stake store state
 */
export interface StakeState {
  // Current run state
  /** Currently selected stake tier for active run */
  currentStakeTier: number
  /** Wall being used in current run */
  currentWallId: string

  // Progression state (persisted)
  /** Progress per wall */
  wallProgress: Record<string, WallStakeProgress>
  /** Highest stake completed across all walls */
  globalHighestCompleted: number

  // Computed/cached modifiers for current run
  /** Combined modifiers for current stake */
  activeModifiers: CombinedStakeModifiers

  // Actions
  /** Select a stake tier for a new run */
  selectStake: (wallId: string, stakeTier: number) => boolean
  /** Record a victory at current stake */
  recordVictory: (finalScore: number, actsCompleted: number) => void
  /** Check if a stake is unlocked for a wall */
  isStakeUnlocked: (wallId: string, stakeTier: number) => boolean
  /** Check if a wall is unlocked */
  isWallUnlocked: (wallId: string) => boolean
  /** Get highest available stake for a wall */
  getHighestAvailableStake: (wallId: string) => number
  /** Get all stake definitions */
  getStakeDefinitions: () => StakeDefinition[]
  /** Get stake definition by tier */
  getStake: (tier: number) => StakeDefinition | undefined
  /** Get combined modifiers for a stake tier */
  getModifiers: (stakeTier: number) => CombinedStakeModifiers
  /** Roll for stickers on a shop decree */
  rollForDecreeStickers: () => StickerRollResult
  /** Get progress for a wall */
  getWallProgress: (wallId: string) => WallStakeProgress
  /** Reset run state (keeps progression) */
  resetRunState: () => void
  /** Reset all progression (for testing/debug) */
  resetAllProgress: () => void
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_WALL_ID = 'red_wall'
const DEFAULT_STAKE_TIER = 1

const DEFAULT_MODIFIERS: CombinedStakeModifiers = {
  noSmallRoundReward: false,
  scoreScaling: 1.0,
  eternalChance: 0,
  redrawPenalty: 0,
  perishableChance: 0,
  rentalChance: 0,
}

function createDefaultWallProgress(wallId: string): WallStakeProgress {
  return {
    wallId,
    highestCompleted: 0,
    victories: [],
  }
}

// =============================================================================
// STORE
// =============================================================================

export const useStakeStore = create<StakeState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStakeTier: DEFAULT_STAKE_TIER,
      currentWallId: DEFAULT_WALL_ID,
      wallProgress: {},
      globalHighestCompleted: 0,
      activeModifiers: { ...DEFAULT_MODIFIERS },

      // Actions
      selectStake: (wallId: string, stakeTier: number) => {
        const state = get()

        // Validate stake tier
        if (stakeTier < 1 || stakeTier > 8) {
          return false
        }

        // Check if stake is unlocked for this wall
        if (!state.isStakeUnlocked(wallId, stakeTier)) {
          return false
        }

        // Check if wall is unlocked
        if (!state.isWallUnlocked(wallId)) {
          return false
        }

        // Calculate modifiers for selected stake
        const modifiers = calculateCombinedModifiers(stakeTier)

        set({
          currentStakeTier: stakeTier,
          currentWallId: wallId,
          activeModifiers: modifiers,
        })

        return true
      },

      recordVictory: (finalScore: number, actsCompleted: number) => {
        const { currentStakeTier, currentWallId, wallProgress, globalHighestCompleted } = get()

        const victory: StakeVictory = {
          wallId: currentWallId,
          stakeTier: currentStakeTier,
          completedAt: Date.now(),
          finalScore,
          actsCompleted,
        }

        // Get or create wall progress
        const progress = wallProgress[currentWallId] ?? createDefaultWallProgress(currentWallId)

        // Update highest completed for this wall
        const newHighestCompleted = Math.max(progress.highestCompleted, currentStakeTier)

        // Update global highest
        const newGlobalHighest = Math.max(globalHighestCompleted, currentStakeTier)

        set({
          wallProgress: {
            ...wallProgress,
            [currentWallId]: {
              ...progress,
              highestCompleted: newHighestCompleted,
              victories: [...progress.victories, victory],
            },
          },
          globalHighestCompleted: newGlobalHighest,
        })
      },

      isStakeUnlocked: (wallId: string, stakeTier: number) => {
        if (stakeTier === 1) return true // White stake always unlocked

        const { wallProgress } = get()
        const progress = wallProgress[wallId]

        if (!progress) {
          // No progress for this wall, only tier 1 is unlocked
          return stakeTier === 1
        }

        // Must complete previous tier to unlock next
        return stakeTier <= progress.highestCompleted + 1
      },

      isWallUnlocked: (wallId: string) => {
        const { globalHighestCompleted } = get()
        return isWallUnlocked(wallId, globalHighestCompleted)
      },

      getHighestAvailableStake: (wallId: string) => {
        const { wallProgress } = get()
        const progress = wallProgress[wallId]

        if (!progress) {
          return 1 // Only white stake available
        }

        // Can play up to one tier above completed
        return Math.min(progress.highestCompleted + 1, 8)
      },

      getStakeDefinitions: () => {
        return STAKE_DEFINITIONS
      },

      getStake: (tier: number) => {
        return getStakeByTier(tier)
      },

      getModifiers: (stakeTier: number) => {
        return calculateCombinedModifiers(stakeTier)
      },

      rollForDecreeStickers: () => {
        const { currentStakeTier } = get()
        return rollForStickers(currentStakeTier)
      },

      getWallProgress: (wallId: string) => {
        const { wallProgress } = get()
        return wallProgress[wallId] ?? createDefaultWallProgress(wallId)
      },

      resetRunState: () => {
        set({
          currentStakeTier: DEFAULT_STAKE_TIER,
          currentWallId: DEFAULT_WALL_ID,
          activeModifiers: { ...DEFAULT_MODIFIERS },
        })
      },

      resetAllProgress: () => {
        set({
          currentStakeTier: DEFAULT_STAKE_TIER,
          currentWallId: DEFAULT_WALL_ID,
          wallProgress: {},
          globalHighestCompleted: 0,
          activeModifiers: { ...DEFAULT_MODIFIERS },
        })
      },
    }),
    {
      name: 'tensho-stake-progress',
      // Only persist progression data, not current run state
      partialize: (state) => ({
        wallProgress: state.wallProgress,
        globalHighestCompleted: state.globalHighestCompleted,
      }),
    }
  )
)

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Select the current stake definition
 */
export const selectCurrentStake = (state: StakeState): StakeDefinition | undefined => {
  return getStakeByTier(state.currentStakeTier)
}

/**
 * Select current stake color
 */
export const selectCurrentStakeColor = (state: StakeState): string => {
  const stake = getStakeByTier(state.currentStakeTier)
  return stake?.color ?? '#E0E0E0'
}

/**
 * Select current stake name
 */
export const selectCurrentStakeName = (state: StakeState): string => {
  const stake = getStakeByTier(state.currentStakeTier)
  return stake?.name ?? 'White Stake'
}

/**
 * Select current stake Japanese name
 */
export const selectCurrentStakeJapaneseName = (state: StakeState): string => {
  const stake = getStakeByTier(state.currentStakeTier)
  return stake?.japaneseName ?? '白場'
}

/**
 * Select if small round rewards are disabled
 */
export const selectNoSmallRoundReward = (state: StakeState): boolean => {
  return state.activeModifiers.noSmallRoundReward
}

/**
 * Select score scaling multiplier
 */
export const selectScoreScaling = (state: StakeState): number => {
  return state.activeModifiers.scoreScaling
}

/**
 * Select redraw penalty
 */
export const selectRedrawPenalty = (state: StakeState): number => {
  return state.activeModifiers.redrawPenalty
}

/**
 * Select total victories across all walls
 */
export const selectTotalVictories = (state: StakeState): number => {
  let total = 0
  for (const progress of Object.values(state.wallProgress)) {
    total += progress.victories.length
  }
  return total
}

/**
 * Select victories at a specific stake tier
 */
export const selectVictoriesAtStake = (state: StakeState, stakeTier: number): StakeVictory[] => {
  const victories: StakeVictory[] = []
  for (const progress of Object.values(state.wallProgress)) {
    for (const victory of progress.victories) {
      if (victory.stakeTier === stakeTier) {
        victories.push(victory)
      }
    }
  }
  return victories
}

/**
 * Select walls that have completed a specific stake
 */
export const selectWallsWithStake = (state: StakeState, stakeTier: number): string[] => {
  const walls: string[] = []
  for (const [wallId, progress] of Object.entries(state.wallProgress)) {
    if (progress.highestCompleted >= stakeTier) {
      walls.push(wallId)
    }
  }
  return walls
}

/**
 * Check if gold stake has been completed on any wall
 */
export const selectHasGoldStakeVictory = (state: StakeState): boolean => {
  return state.globalHighestCompleted >= 8
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get display-friendly stake progress for a wall
 */
export function getWallStakeProgressDisplay(
  progress: WallStakeProgress
): { tier: number; name: string; completed: boolean }[] {
  return STAKE_DEFINITIONS.map((stake) => ({
    tier: stake.tier,
    name: stake.name,
    completed: progress.highestCompleted >= stake.tier,
  }))
}

/**
 * Calculate completion percentage for collection tracking
 */
export function calculateStakeCompletionPercentage(
  wallProgress: Record<string, WallStakeProgress>,
  totalWalls: number
): number {
  const maxPossible = totalWalls * 8 // 8 stakes per wall

  let totalCompleted = 0
  for (const progress of Object.values(wallProgress)) {
    totalCompleted += progress.highestCompleted
  }

  return (totalCompleted / maxPossible) * 100
}
