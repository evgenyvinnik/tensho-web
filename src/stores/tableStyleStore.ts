/**
 * Table Style Store - Table Style selection and unlock state management
 *
 * Manages table style selection, unlocks, and progression.
 * Table styles are tracked independently and persist across runs.
 *
 * Based on ARCHITECTURE.MD Section "Table Styles System (P3)".
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  TABLE_STYLE_DEFINITIONS,
  getTableStyleById,
  getDefaultTableStyle,
  isUnlockConditionMet,
  getUnlockProgress,
  type TableStyleDefinition,
  type PlayerUnlockStats,
  type ActiveTableModifiers,
  DEFAULT_TABLE_MODIFIERS,
  getDecreeSlotModifier,
  getFlowerRateModifier,
  getShopDiscountModifier,
  getBaseScoreModifier,
  getYakumanMultiplierModifier,
  getScoreTargetModifier,
  areFlowersDisabled,
  hasEarlyCorruptedSeasons,
  grantsRegionalMandate,
} from '../systems/TableStyleSystem'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Unlock history entry
 */
export interface TableStyleUnlock {
  styleId: string
  unlockedAt: number // Timestamp
}

/**
 * Player statistics tracked for unlock conditions
 */
export interface TableStyleStats {
  /** Highest act completed */
  highestActCompleted: number
  /** Maximum flowers collected in a single run */
  maxFlowersInRun: number
  /** Maximum decrees owned at end of winning run */
  maxDecreesInWin: number
  /** Total decrees purchased across all runs */
  totalDecreesPurchased: number
  /** Whether player has won without collecting flowers */
  hasWonWithoutFlowers: boolean
  /** Maximum corrupted seasons survived in one run */
  maxCorruptedSeasonsSurvived: number
  /** Whether player has scored a yakuman */
  hasScoredYakuman: boolean
}

/**
 * Table style store state
 */
export interface TableStyleState {
  // Current run state
  /** Currently selected table style ID for active run */
  currentStyleId: string

  // Progression state (persisted)
  /** Set of unlocked table style IDs */
  unlockedStyles: string[]
  /** Unlock history */
  unlockHistory: TableStyleUnlock[]
  /** Statistics for unlock tracking */
  stats: TableStyleStats

  // Computed/cached modifiers for current run
  /** Active modifiers from current style */
  activeModifiers: ActiveTableModifiers

  // Actions
  /** Select a table style for a new run */
  selectStyle: (styleId: string) => boolean
  /** Check if a style is unlocked */
  isStyleUnlocked: (styleId: string) => boolean
  /** Get a style definition by ID */
  getStyle: (styleId: string) => TableStyleDefinition | undefined
  /** Get all style definitions */
  getAllStyles: () => TableStyleDefinition[]
  /** Get all unlocked styles */
  getUnlockedStyles: () => TableStyleDefinition[]
  /** Get all locked styles */
  getLockedStyles: () => TableStyleDefinition[]
  /** Get current style definition */
  getCurrentStyle: () => TableStyleDefinition
  /** Get active modifiers */
  getActiveModifiers: () => ActiveTableModifiers
  /** Get unlock progress for a style (0-1) */
  getUnlockProgress: (styleId: string) => number
  /** Update statistics from gameplay */
  updateStats: (updates: Partial<TableStyleStats>) => void
  /** Check and process unlocks based on current stats */
  processUnlocks: () => string[]
  /** Manually unlock a style (for testing/achievements) */
  unlockStyle: (styleId: string) => boolean
  /** Reset run state (keeps progression) */
  resetRunState: () => void
  /** Reset all progression (for testing/debug) */
  resetAllProgress: () => void
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_STYLE_ID = 'green_felt'

const DEFAULT_STATS: TableStyleStats = {
  highestActCompleted: 0,
  maxFlowersInRun: 0,
  maxDecreesInWin: 0,
  totalDecreesPurchased: 0,
  hasWonWithoutFlowers: false,
  maxCorruptedSeasonsSurvived: 0,
  hasScoredYakuman: false,
}

/**
 * Calculate active modifiers for a style ID
 */
function calculateActiveModifiers(styleId: string): ActiveTableModifiers {
  return {
    decreeSlotModifier: getDecreeSlotModifier(styleId),
    flowerRateMultiplier: 1.0 + getFlowerRateModifier(styleId) / 100,
    shopDiscountPercent: getShopDiscountModifier(styleId),
    baseScoreMultiplier: 1.0 + getBaseScoreModifier(styleId) / 100,
    yakumanMultiplierBonus: getYakumanMultiplierModifier(styleId),
    scoreTargetMultiplier: 1.0 + getScoreTargetModifier(styleId) / 100,
    flowersDisabled: areFlowersDisabled(styleId),
    earlyCorruptedSeasons: hasEarlyCorruptedSeasons(styleId),
    grantRegionalMandate: grantsRegionalMandate(styleId),
  }
}

// =============================================================================
// STORE
// =============================================================================

export const useTableStyleStore = create<TableStyleState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStyleId: DEFAULT_STYLE_ID,
      unlockedStyles: [DEFAULT_STYLE_ID],
      unlockHistory: [],
      stats: { ...DEFAULT_STATS },
      activeModifiers: { ...DEFAULT_TABLE_MODIFIERS },

      // Actions
      selectStyle: (styleId: string) => {
        const state = get()

        // Check if style exists
        const style = getTableStyleById(styleId)
        if (!style) {
          return false
        }

        // Check if style is unlocked
        if (!state.unlockedStyles.includes(styleId)) {
          return false
        }

        // Calculate modifiers for selected style
        const modifiers = calculateActiveModifiers(styleId)

        set({
          currentStyleId: styleId,
          activeModifiers: modifiers,
        })

        return true
      },

      isStyleUnlocked: (styleId: string) => {
        const { unlockedStyles } = get()
        return unlockedStyles.includes(styleId)
      },

      getStyle: (styleId: string) => {
        return getTableStyleById(styleId)
      },

      getAllStyles: () => {
        return [...TABLE_STYLE_DEFINITIONS]
      },

      getUnlockedStyles: () => {
        const { unlockedStyles } = get()
        return TABLE_STYLE_DEFINITIONS.filter((style) =>
          unlockedStyles.includes(style.id)
        )
      },

      getLockedStyles: () => {
        const { unlockedStyles } = get()
        return TABLE_STYLE_DEFINITIONS.filter(
          (style) => !unlockedStyles.includes(style.id)
        )
      },

      getCurrentStyle: () => {
        const { currentStyleId } = get()
        return getTableStyleById(currentStyleId) ?? getDefaultTableStyle()
      },

      getActiveModifiers: () => {
        return get().activeModifiers
      },

      getUnlockProgress: (styleId: string) => {
        const { unlockedStyles, stats } = get()

        // If already unlocked, return 1
        if (unlockedStyles.includes(styleId)) {
          return 1
        }

        const style = getTableStyleById(styleId)
        if (!style) return 0

        return getUnlockProgress(style, stats as PlayerUnlockStats)
      },

      updateStats: (updates: Partial<TableStyleStats>) => {
        const { stats } = get()

        const newStats: TableStyleStats = {
          ...stats,
          ...updates,
          // For max values, take the greater of old and new
          highestActCompleted: Math.max(
            stats.highestActCompleted,
            updates.highestActCompleted ?? 0
          ),
          maxFlowersInRun: Math.max(
            stats.maxFlowersInRun,
            updates.maxFlowersInRun ?? 0
          ),
          maxDecreesInWin: Math.max(
            stats.maxDecreesInWin,
            updates.maxDecreesInWin ?? 0
          ),
          maxCorruptedSeasonsSurvived: Math.max(
            stats.maxCorruptedSeasonsSurvived,
            updates.maxCorruptedSeasonsSurvived ?? 0
          ),
          // For accumulating values, add to existing
          totalDecreesPurchased:
            stats.totalDecreesPurchased + (updates.totalDecreesPurchased ?? 0),
          // For boolean flags, OR them
          hasWonWithoutFlowers:
            stats.hasWonWithoutFlowers ||
            (updates.hasWonWithoutFlowers ?? false),
          hasScoredYakuman:
            stats.hasScoredYakuman || (updates.hasScoredYakuman ?? false),
        }

        set({ stats: newStats })
      },

      processUnlocks: () => {
        const { unlockedStyles, stats, unlockHistory } = get()
        const newlyUnlocked: string[] = []
        const newUnlockHistory = [...unlockHistory]

        for (const style of TABLE_STYLE_DEFINITIONS) {
          if (!unlockedStyles.includes(style.id)) {
            if (isUnlockConditionMet(style, stats as PlayerUnlockStats)) {
              newlyUnlocked.push(style.id)
              newUnlockHistory.push({
                styleId: style.id,
                unlockedAt: Date.now(),
              })
            }
          }
        }

        if (newlyUnlocked.length > 0) {
          set({
            unlockedStyles: [...unlockedStyles, ...newlyUnlocked],
            unlockHistory: newUnlockHistory,
          })
        }

        return newlyUnlocked
      },

      unlockStyle: (styleId: string) => {
        const { unlockedStyles, unlockHistory } = get()

        // Check if style exists
        const style = getTableStyleById(styleId)
        if (!style) {
          return false
        }

        // Check if already unlocked
        if (unlockedStyles.includes(styleId)) {
          return false
        }

        set({
          unlockedStyles: [...unlockedStyles, styleId],
          unlockHistory: [
            ...unlockHistory,
            {
              styleId,
              unlockedAt: Date.now(),
            },
          ],
        })

        return true
      },

      resetRunState: () => {
        set({
          currentStyleId: DEFAULT_STYLE_ID,
          activeModifiers: { ...DEFAULT_TABLE_MODIFIERS },
        })
      },

      resetAllProgress: () => {
        set({
          currentStyleId: DEFAULT_STYLE_ID,
          unlockedStyles: [DEFAULT_STYLE_ID],
          unlockHistory: [],
          stats: { ...DEFAULT_STATS },
          activeModifiers: { ...DEFAULT_TABLE_MODIFIERS },
        })
      },
    }),
    {
      name: 'tensho-table-style-progress',
      // Persist progression data, stats, and unlock history
      partialize: (state) => ({
        unlockedStyles: state.unlockedStyles,
        unlockHistory: state.unlockHistory,
        stats: state.stats,
      }),
    }
  )
)

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Select the current table style definition
 */
export const selectCurrentStyle = (
  state: TableStyleState
): TableStyleDefinition => {
  return getTableStyleById(state.currentStyleId) ?? getDefaultTableStyle()
}

/**
 * Select current style display name
 */
export const selectCurrentStyleName = (state: TableStyleState): string => {
  const style = selectCurrentStyle(state)
  return style.displayName
}

/**
 * Select current style Japanese name
 */
export const selectCurrentStyleJapaneseName = (state: TableStyleState): string => {
  const style = selectCurrentStyle(state)
  return style.japaneseName
}

/**
 * Select current style theme color
 */
export const selectCurrentStyleThemeColor = (state: TableStyleState): string => {
  const style = selectCurrentStyle(state)
  return style.themeColor
}

/**
 * Select current style accent color
 */
export const selectCurrentStyleAccentColor = (state: TableStyleState): string => {
  const style = selectCurrentStyle(state)
  return style.accentColor
}

/**
 * Select decree slot modifier from current style
 */
export const selectDecreeSlotModifier = (state: TableStyleState): number => {
  return state.activeModifiers.decreeSlotModifier
}

/**
 * Select flower rate multiplier from current style
 */
export const selectFlowerRateMultiplier = (state: TableStyleState): number => {
  return state.activeModifiers.flowerRateMultiplier
}

/**
 * Select shop discount percentage from current style
 */
export const selectShopDiscountPercent = (state: TableStyleState): number => {
  return state.activeModifiers.shopDiscountPercent
}

/**
 * Select base score multiplier from current style
 */
export const selectBaseScoreMultiplier = (state: TableStyleState): number => {
  return state.activeModifiers.baseScoreMultiplier
}

/**
 * Select yakuman multiplier bonus from current style
 */
export const selectYakumanMultiplierBonus = (state: TableStyleState): number => {
  return state.activeModifiers.yakumanMultiplierBonus
}

/**
 * Select score target multiplier from current style
 */
export const selectScoreTargetMultiplier = (state: TableStyleState): number => {
  return state.activeModifiers.scoreTargetMultiplier
}

/**
 * Select whether flowers are disabled
 */
export const selectFlowersDisabled = (state: TableStyleState): boolean => {
  return state.activeModifiers.flowersDisabled
}

/**
 * Select whether corrupted seasons appear early
 */
export const selectEarlyCorruptedSeasons = (state: TableStyleState): boolean => {
  return state.activeModifiers.earlyCorruptedSeasons
}

/**
 * Select whether regional mandate is granted
 */
export const selectGrantRegionalMandate = (state: TableStyleState): boolean => {
  return state.activeModifiers.grantRegionalMandate
}

/**
 * Select count of unlocked styles
 */
export const selectUnlockedStyleCount = (state: TableStyleState): number => {
  return state.unlockedStyles.length
}

/**
 * Select total style count
 */
 
export const selectTotalStyleCount = (_state: TableStyleState): number => {
  return TABLE_STYLE_DEFINITIONS.length
}

/**
 * Select unlock completion percentage
 */
export const selectUnlockCompletionPercent = (state: TableStyleState): number => {
  return (state.unlockedStyles.length / TABLE_STYLE_DEFINITIONS.length) * 100
}

/**
 * Select most recently unlocked style
 */
export const selectMostRecentUnlock = (
  state: TableStyleState
): TableStyleUnlock | undefined => {
  if (state.unlockHistory.length === 0) return undefined
  return state.unlockHistory[state.unlockHistory.length - 1]
}

/**
 * Select total decrees purchased
 */
export const selectTotalDecreesPurchased = (state: TableStyleState): number => {
  return state.stats.totalDecreesPurchased
}

/**
 * Select highest act completed
 */
export const selectHighestActCompleted = (state: TableStyleState): number => {
  return state.stats.highestActCompleted
}

/**
 * Select whether player has scored a yakuman
 */
export const selectHasScoredYakuman = (state: TableStyleState): boolean => {
  return state.stats.hasScoredYakuman
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get styles with unlock status for display
 */
export function getStylesWithUnlockStatus(
  unlockedStyles: string[],
  stats: TableStyleStats
): Array<{
  style: TableStyleDefinition
  isUnlocked: boolean
  progress: number
}> {
  return TABLE_STYLE_DEFINITIONS.map((style) => {
    const isUnlocked = unlockedStyles.includes(style.id)
    const progress = isUnlocked
      ? 1
      : getUnlockProgress(style, stats as PlayerUnlockStats)

    return {
      style,
      isUnlocked,
      progress,
    }
  })
}

/**
 * Get display-friendly style progress
 */
export function getStyleProgressDisplay(
  unlockedStyles: string[]
): { id: string; name: string; unlocked: boolean }[] {
  return TABLE_STYLE_DEFINITIONS.map((style) => ({
    id: style.id,
    name: style.displayName,
    unlocked: unlockedStyles.includes(style.id),
  }))
}

/**
 * Calculate collection completion for achievement tracking
 */
export function calculateStyleCollectionPercentage(
  unlockedStyles: string[]
): number {
  return (unlockedStyles.length / TABLE_STYLE_DEFINITIONS.length) * 100
}

/**
 * Get unlock requirements summary for a style
 */
export function getUnlockRequirementsSummary(styleId: string): {
  description: string
  threshold?: number
} | null {
  const style = getTableStyleById(styleId)
  if (!style) return null

  return {
    description: style.unlockCondition.description,
    threshold: style.unlockCondition.threshold,
  }
}
