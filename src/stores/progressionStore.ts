/**
 * Progression Store - Meta-Progression State Management
 *
 * Manages persistent lifetime stats and unlocks across runs.
 * Based on ARCHITECTURE.MD meta-progression systems.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  type LifetimeStats,
  type SerializableLifetimeStats,
  type UnlockStatus,
  type UnlockCheckResult,
  type ProgressionEventPayload,
  type UnlockContext,
  DEFAULT_LIFETIME_STATS,
  metaProgressionSystem,
  processProgressionEvent,
} from '../systems/MetaProgressionSystem'

import {
  type UnlockCategory,
  type UnlockDefinition,
  ALL_UNLOCKS,
  getUnlockById,
  getUnlocksByCategory,
  getDefaultUnlocks,
} from '../config/unlockDefinitions'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Unlock record stored in the progression store
 */
export interface UnlockRecord {
  id: string
  unlockedAt: number
  unlocksId: string
  category: UnlockCategory
}

/**
 * Progression store state
 */
export interface ProgressionState {
  // Lifetime statistics
  stats: LifetimeStats

  // Unlocked content
  unlocks: Record<string, UnlockRecord>

  // Recently unlocked (for notifications)
  recentUnlocks: string[]

  // Actions - Stat updates
  incrementStat: (
    stat: keyof LifetimeStats,
    amount?: number
  ) => void
  setStat: (
    stat: keyof LifetimeStats,
    value: number | Set<string> | Record<string, number> | Record<string, number[]>
  ) => void
  updateStats: (updates: Partial<LifetimeStats>) => void
  processEvent: (event: ProgressionEventPayload) => UnlockCheckResult

  // Actions - Unlock management
  checkUnlocks: () => UnlockCheckResult
  unlockItem: (unlockId: string) => void
  clearRecentUnlocks: () => void

  // Queries
  isUnlocked: (unlockId: string) => boolean
  isItemUnlocked: (itemId: string) => boolean
  getUnlockedItems: (category: UnlockCategory) => string[]
  getUnlockStatus: (unlockId: string) => UnlockStatus | undefined
  getUnlocksByCategory: (category: UnlockCategory) => UnlockStatus[]
  getCategoryCompletion: (category: UnlockCategory) => {
    unlocked: number
    total: number
    percentage: number
  }
  getOverallCompletion: () => {
    unlocked: number
    total: number
    percentage: number
  }

  // Discovery tracking
  discoverItem: (itemId: string, itemType: 'fateSeal' | 'celestialOrb' | 'voidScript' | 'decree' | 'mandate') => void

  // Run lifecycle
  startRun: () => void
  endRun: (won: boolean, stakeTier: number, wallId: string, roundsCompleted: number, hadFlowers: boolean) => void

  // Reset
  resetProgression: () => void
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get unlocked IDs set from unlock records
 */
function getUnlockedIdsSet(unlocks: Record<string, UnlockRecord>): Set<string> {
  return new Set(Object.keys(unlocks))
}

/**
 * Create unlock context from state
 */
function createContext(
  stats: LifetimeStats,
  unlocks: Record<string, UnlockRecord>
): UnlockContext {
  return {
    stats,
    unlockedIds: getUnlockedIdsSet(unlocks),
  }
}

/**
 * Create initial unlocks from defaults
 */
function createInitialUnlocks(): Record<string, UnlockRecord> {
  const unlocks: Record<string, UnlockRecord> = {}
  const defaults = getDefaultUnlocks()

  for (const unlock of defaults) {
    unlocks[unlock.id] = {
      id: unlock.id,
      unlockedAt: 0,
      unlocksId: unlock.unlocksId,
      category: unlock.category,
    }
  }

  return unlocks
}

/**
 * Serialize stats for persistence
 */
function serializeStatsForStorage(stats: LifetimeStats): SerializableLifetimeStats {
  return metaProgressionSystem.serializeStats(stats)
}

/**
 * Deserialize stats from persistence
 */
function deserializeStatsFromStorage(serialized: SerializableLifetimeStats): LifetimeStats {
  return metaProgressionSystem.deserializeStats(serialized)
}

// =============================================================================
// STORE CREATION
// =============================================================================

export const useProgressionStore = create<ProgressionState>()(
  persist(
    (set, get) => ({
      // Initial state
      stats: { ...DEFAULT_LIFETIME_STATS },
      unlocks: createInitialUnlocks(),
      recentUnlocks: [],

      // =====================================================================
      // STAT UPDATES
      // =====================================================================

      incrementStat: (stat, amount = 1) => {
        const { stats } = get()
        const currentValue = stats[stat]

        if (typeof currentValue === 'number') {
          set({
            stats: {
              ...stats,
              [stat]: currentValue + amount,
            },
          })
        }
      },

      setStat: (stat, value) => {
        const { stats } = get()
        set({
          stats: {
            ...stats,
            [stat]: value,
          },
        })
      },

      updateStats: (updates) => {
        const { stats } = get()
        set({
          stats: {
            ...stats,
            ...updates,
          },
        })
      },

      processEvent: (event) => {
        const { stats, unlocks } = get()

        // Process the event to get stat updates
        const statUpdates = processProgressionEvent(event, stats)

        // Merge updates into stats
        const newStats = { ...stats, ...statUpdates }

        // Check for new unlocks
        const context = createContext(newStats, unlocks)
        const result = metaProgressionSystem.checkAllUnlocks(context)

        // Apply new unlocks
        const newUnlocks = { ...unlocks }
        const newRecentUnlocks: string[] = []

        for (const unlock of result.newUnlocks) {
          newUnlocks[unlock.id] = {
            id: unlock.id,
            unlockedAt: Date.now(),
            unlocksId: unlock.unlocksId,
            category: unlock.category,
          }
          newRecentUnlocks.push(unlock.id)
        }

        set({
          stats: newStats,
          unlocks: newUnlocks,
          recentUnlocks: [...get().recentUnlocks, ...newRecentUnlocks],
        })

        return result
      },

      // =====================================================================
      // UNLOCK MANAGEMENT
      // =====================================================================

      checkUnlocks: () => {
        const { stats, unlocks } = get()
        const context = createContext(stats, unlocks)
        const result = metaProgressionSystem.checkAllUnlocks(context)

        // Apply new unlocks
        if (result.newUnlocks.length > 0) {
          const newUnlocks = { ...unlocks }
          const newRecentUnlocks: string[] = []

          for (const unlock of result.newUnlocks) {
            newUnlocks[unlock.id] = {
              id: unlock.id,
              unlockedAt: Date.now(),
              unlocksId: unlock.unlocksId,
              category: unlock.category,
            }
            newRecentUnlocks.push(unlock.id)
          }

          set({
            unlocks: newUnlocks,
            recentUnlocks: [...get().recentUnlocks, ...newRecentUnlocks],
          })
        }

        return result
      },

      unlockItem: (unlockId) => {
        const unlock = getUnlockById(unlockId)
        if (!unlock) return

        const { unlocks } = get()
        if (unlocks[unlockId]) return // Already unlocked

        set({
          unlocks: {
            ...unlocks,
            [unlockId]: {
              id: unlockId,
              unlockedAt: Date.now(),
              unlocksId: unlock.unlocksId,
              category: unlock.category,
            },
          },
          recentUnlocks: [...get().recentUnlocks, unlockId],
        })
      },

      clearRecentUnlocks: () => {
        set({ recentUnlocks: [] })
      },

      // =====================================================================
      // QUERIES
      // =====================================================================

      isUnlocked: (unlockId) => {
        const { unlocks } = get()
        return unlockId in unlocks
      },

      isItemUnlocked: (itemId) => {
        const { unlocks } = get()
        const unlockedIds = getUnlockedIdsSet(unlocks)
        return metaProgressionSystem.isItemUnlocked(itemId, unlockedIds)
      },

      getUnlockedItems: (category) => {
        const { unlocks } = get()
        const unlockedIds = getUnlockedIdsSet(unlocks)
        return metaProgressionSystem.getUnlockedItems(category, unlockedIds)
      },

      getUnlockStatus: (unlockId) => {
        const { stats, unlocks } = get()
        const context = createContext(stats, unlocks)
        return metaProgressionSystem.getUnlockStatus(unlockId, context)
      },

      getUnlocksByCategory: (category) => {
        const { stats, unlocks } = get()
        const context = createContext(stats, unlocks)
        return metaProgressionSystem.getUnlocksByCategory(category, context)
      },

      getCategoryCompletion: (category) => {
        const { unlocks } = get()
        const unlockedIds = getUnlockedIdsSet(unlocks)
        return metaProgressionSystem.calculateCategoryCompletion(category, unlockedIds)
      },

      getOverallCompletion: () => {
        const { unlocks } = get()
        const unlockedIds = getUnlockedIdsSet(unlocks)
        return metaProgressionSystem.calculateOverallCompletion(unlockedIds)
      },

      // =====================================================================
      // DISCOVERY TRACKING
      // =====================================================================

      discoverItem: (itemId, itemType) => {
        const { stats } = get()
        let updates: Partial<LifetimeStats> = {}

        switch (itemType) {
          case 'fateSeal': {
            const newSet = new Set(stats.fateSealsDiscovered)
            newSet.add(itemId)
            updates = { fateSealsDiscovered: newSet }
            break
          }
          case 'celestialOrb': {
            const newSet = new Set(stats.celestialOrbsDiscovered)
            newSet.add(itemId)
            updates = { celestialOrbsDiscovered: newSet }
            break
          }
          case 'voidScript': {
            const newSet = new Set(stats.voidScriptsDiscovered)
            newSet.add(itemId)
            updates = { voidScriptsDiscovered: newSet }
            break
          }
          case 'decree': {
            const newSet = new Set(stats.decreesDiscovered)
            newSet.add(itemId)
            updates = { decreesDiscovered: newSet }
            break
          }
          case 'mandate': {
            const newSet = new Set(stats.mandatesDiscovered)
            newSet.add(itemId)
            updates = { mandatesDiscovered: newSet }
            break
          }
        }

        set({
          stats: { ...stats, ...updates },
        })
      },

      // =====================================================================
      // RUN LIFECYCLE
      // =====================================================================

      startRun: () => {
        const result = get().processEvent({ type: 'run_started' })
        return result
      },

      endRun: (won, stakeTier, wallId, roundsCompleted, hadFlowers) => {
        // Process run completed event
        get().processEvent({ type: 'run_completed' })

        // If won, process victory event
        if (won) {
          get().processEvent({
            type: 'run_won',
            stakeTier,
            wallId,
            roundsCompleted,
            hadFlowers,
          })
        } else {
          get().processEvent({ type: 'run_lost' })
        }

        // Check for any new unlocks
        get().checkUnlocks()
      },

      // =====================================================================
      // RESET
      // =====================================================================

      resetProgression: () => {
        set({
          stats: { ...DEFAULT_LIFETIME_STATS },
          unlocks: createInitialUnlocks(),
          recentUnlocks: [],
        })
      },
    }),
    {
      name: 'tensho-progression',
      version: 1,
      partialize: (state) => ({
        stats: serializeStatsForStorage(state.stats),
        unlocks: state.unlocks,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as {
          stats: SerializableLifetimeStats
          unlocks: Record<string, UnlockRecord>
        }

        return {
          ...current,
          stats: persistedState?.stats
            ? deserializeStatsFromStorage(persistedState.stats)
            : current.stats,
          unlocks: persistedState?.unlocks ?? current.unlocks,
        }
      },
    }
  )
)

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Select total unlocks count
 */
export const selectTotalUnlocks = (state: ProgressionState): number => {
  return Object.keys(state.unlocks).length
}

/**
 * Select unlocks by category count
 */
export const selectCategoryUnlockCount = (
  state: ProgressionState,
  category: UnlockCategory
): number => {
  return Object.values(state.unlocks).filter((u) => u.category === category).length
}

/**
 * Select recent unlocks count
 */
export const selectRecentUnlocksCount = (state: ProgressionState): number => {
  return state.recentUnlocks.length
}

/**
 * Select if there are pending unlock notifications
 */
export const selectHasPendingUnlockNotifications = (state: ProgressionState): boolean => {
  return state.recentUnlocks.length > 0
}

/**
 * Select highest act reached
 */
export const selectHighestAct = (state: ProgressionState): number => {
  return state.stats.highestActReached
}

/**
 * Select total runs won
 */
export const selectTotalWins = (state: ProgressionState): number => {
  return state.stats.totalRunsWon
}

/**
 * Select total gold spent
 */
export const selectTotalGoldSpent = (state: ProgressionState): number => {
  return state.stats.totalGoldSpent
}

/**
 * Select highest single hand score
 */
export const selectHighestHandScore = (state: ProgressionState): number => {
  return state.stats.highestSingleHandScore
}

/**
 * Select total tiles played
 */
export const selectTotalTilesPlayed = (state: ProgressionState): number => {
  return state.stats.totalTilesPlayed
}

/**
 * Select total decrees purchased
 */
export const selectTotalDecreesPurchased = (state: ProgressionState): number => {
  return state.stats.totalDecreesPurchased
}

/**
 * Select yakuman count
 */
export const selectYakumanCount = (state: ProgressionState): number => {
  return state.stats.yakumanScored
}

/**
 * Select fastest win rounds
 */
export const selectFastestWin = (state: ProgressionState): number | null => {
  const fastest = state.stats.fastestWinRounds
  return fastest === Infinity ? null : fastest
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get unlock definition with status
 */
export function getUnlockWithStatus(
  unlockId: string,
  state: ProgressionState
): { definition: UnlockDefinition; status: UnlockStatus } | undefined {
  const definition = getUnlockById(unlockId)
  if (!definition) return undefined

  const status = state.getUnlockStatus(unlockId)
  if (!status) return undefined

  return { definition, status }
}

/**
 * Get all unlocks with their status for a category
 */
export function getAllUnlocksWithStatus(
  category: UnlockCategory,
  state: ProgressionState
): { definition: UnlockDefinition; status: UnlockStatus }[] {
  const definitions = getUnlocksByCategory(category)
  return definitions
    .map((definition) => {
      const status = state.getUnlockStatus(definition.id)
      return status ? { definition, status } : undefined
    })
    .filter((item): item is { definition: UnlockDefinition; status: UnlockStatus } => item !== undefined)
}

/**
 * Format lifetime stat for display
 */
export function formatLifetimeStat(stat: keyof LifetimeStats, value: number): string {
  if (stat === 'fastestWinRounds' && value === Infinity) {
    return 'N/A'
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }

  return value.toLocaleString()
}
