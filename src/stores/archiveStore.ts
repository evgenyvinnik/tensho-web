/**
 * Archive Store for Tensho Mahjong Roguelike
 *
 * Persisted Zustand store for the Archive of Hands (手牌録) collection system.
 * Tracks all discovered items across runs with localStorage persistence.
 *
 * Based on ARCHITECTURE.MD Section 29 - Archive of Hands.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ArchiveCategory,
  createArchiveKey,
  getPreDiscoveredItemIds,
  ARCHIVE_CATEGORIES,
  getAllArchiveCategories,
} from '../config/archiveDefinitions'
import type {
  ArchiveEntry,
  DiscoveryEvent,
  DiscoveryTrigger,
  ArchiveStats,
} from '../systems/ArchiveSystem'

// =============================================================================
// STORE STATE TYPES
// =============================================================================

/**
 * Archive store state
 */
export interface ArchiveState {
  // Archive entries indexed by composite key
  entries: Record<string, ArchiveEntry>

  // Discovery history
  discoveryHistory: DiscoveryEvent[]

  // Current run statistics
  currentRunItems: string[]

  // Actions
  discoverItem: (
    category: ArchiveCategory,
    itemId: string,
    trigger: DiscoveryTrigger,
    runNumber?: number,
    actNumber?: number
  ) => boolean
  unlockItem: (category: ArchiveCategory, itemId: string) => boolean
  incrementUsage: (category: ArchiveCategory, itemId: string) => void
  incrementWins: (itemKeys: string[]) => void
  addToCurrentRun: (category: ArchiveCategory, itemId: string) => void
  clearCurrentRun: () => void

  // Queries
  isDiscovered: (category: ArchiveCategory, itemId: string) => boolean
  getEntry: (category: ArchiveCategory, itemId: string) => ArchiveEntry | undefined
  getEntriesByCategory: (category: ArchiveCategory) => ArchiveEntry[]
  getDiscoveredEntries: () => ArchiveEntry[]
  getUndiscoveredEntries: () => ArchiveEntry[]
  getRecentDiscoveries: (count?: number) => DiscoveryEvent[]
  getStats: () => ArchiveStats
  getCategoryCompletion: (category: ArchiveCategory) => number
  isArchiveComplete: () => boolean

  // Utility
  initializeEntries: (allItems: { category: ArchiveCategory; itemId: string; unlockCondition?: string }[]) => void
  resetArchive: () => void
  unlockAll: () => void
}

// =============================================================================
// INITIAL STATE HELPERS
// =============================================================================

/**
 * Create initial entries from item definitions
 */
function createInitialEntries(): Record<string, ArchiveEntry> {
  const entries: Record<string, ArchiveEntry> = {}
  const _preDiscovered = getPreDiscoveredItemIds()

  // This will be populated when initializeEntries is called
  // Pre-discovered items get their discoveredAt set to 0

  return entries
}

/**
 * Calculate stats from entries
 */
function calculateStats(entries: Record<string, ArchiveEntry>): ArchiveStats {
  const categories = getAllArchiveCategories()
  const categoryCounts = {} as Record<ArchiveCategory, { discovered: number; total: number }>

  let totalDiscovered = 0
  let totalItems = 0
  let lastDiscoveryTime: number | null = null
  let totalTimesUsed = 0
  let totalRunsWon = 0

  for (const cat of categories) {
    const categoryEntries = Object.values(entries).filter((e) => e.category === cat.id)
    const discovered = categoryEntries.filter((e) => e.discoveredAt !== null).length

    categoryCounts[cat.id] = {
      discovered,
      total: categoryEntries.length,
    }

    totalDiscovered += discovered
    totalItems += categoryEntries.length

    for (const entry of categoryEntries) {
      totalTimesUsed += entry.timesUsed
      totalRunsWon += entry.timesWonWith

      if (entry.discoveredAt !== null) {
        if (lastDiscoveryTime === null || entry.discoveredAt > lastDiscoveryTime) {
          lastDiscoveryTime = entry.discoveredAt
        }
      }
    }
  }

  return {
    totalDiscovered,
    totalItems,
    completionPercentage: totalItems > 0 ? (totalDiscovered / totalItems) * 100 : 0,
    categoryCounts,
    lastDiscoveryTime,
    totalTimesUsed,
    totalRunsWon,
  }
}

// =============================================================================
// ARCHIVE STORE
// =============================================================================

/**
 * Archive store with persistence
 */
export const useArchiveStore = create<ArchiveState>()(
  persist(
    (set, get) => ({
      entries: createInitialEntries(),
      discoveryHistory: [],
      currentRunItems: [],

      // ===========================================================================
      // DISCOVERY ACTIONS
      // ===========================================================================

      discoverItem: (
        category: ArchiveCategory,
        itemId: string,
        trigger: DiscoveryTrigger,
        runNumber?: number,
        actNumber?: number
      ): boolean => {
        const key = createArchiveKey(category, itemId)
        const { entries, discoveryHistory } = get()
        const entry = entries[key]

        if (!entry) {
          console.warn(`Archive: Item not found: ${key}`)
          return false
        }

        // Already discovered
        if (entry.discoveredAt !== null) {
          return false
        }

        // Check if unlocked
        if (!entry.isUnlocked) {
          return false
        }

        const timestamp = Date.now()

        // Update entry
        const updatedEntry: ArchiveEntry = {
          ...entry,
          discoveredAt: timestamp,
        }

        // Record discovery event
        const event: DiscoveryEvent = {
          key,
          trigger,
          timestamp,
          runNumber,
          actNumber,
        }

        set({
          entries: {
            ...entries,
            [key]: updatedEntry,
          },
          discoveryHistory: [...discoveryHistory, event],
        })

        return true
      },

      unlockItem: (category: ArchiveCategory, itemId: string): boolean => {
        const key = createArchiveKey(category, itemId)
        const { entries } = get()
        const entry = entries[key]

        if (!entry) {
          return false
        }

        set({
          entries: {
            ...entries,
            [key]: {
              ...entry,
              isUnlocked: true,
            },
          },
        })

        return true
      },

      incrementUsage: (category: ArchiveCategory, itemId: string): void => {
        const key = createArchiveKey(category, itemId)
        const { entries, discoverItem } = get()
        const entry = entries[key]

        if (!entry) {
          return
        }

        // Auto-discover on first use if not discovered
        if (entry.discoveredAt === null && entry.isUnlocked) {
          discoverItem(category, itemId, 'purchase')
        }

        set({
          entries: {
            ...entries,
            [key]: {
              ...entry,
              timesUsed: entry.timesUsed + 1,
            },
          },
        })
      },

      incrementWins: (itemKeys: string[]): void => {
        const { entries } = get()
        const updates: Record<string, ArchiveEntry> = {}

        for (const key of itemKeys) {
          const entry = entries[key]
          if (entry) {
            updates[key] = {
              ...entry,
              timesWonWith: entry.timesWonWith + 1,
            }
          }
        }

        if (Object.keys(updates).length > 0) {
          set({
            entries: {
              ...entries,
              ...updates,
            },
          })
        }
      },

      addToCurrentRun: (category: ArchiveCategory, itemId: string): void => {
        const key = createArchiveKey(category, itemId)
        const { currentRunItems } = get()

        if (!currentRunItems.includes(key)) {
          set({
            currentRunItems: [...currentRunItems, key],
          })
        }
      },

      clearCurrentRun: (): void => {
        set({ currentRunItems: [] })
      },

      // ===========================================================================
      // QUERY METHODS
      // ===========================================================================

      isDiscovered: (category: ArchiveCategory, itemId: string): boolean => {
        const key = createArchiveKey(category, itemId)
        const entry = get().entries[key]
        return entry !== undefined && entry.discoveredAt !== null
      },

      getEntry: (category: ArchiveCategory, itemId: string): ArchiveEntry | undefined => {
        const key = createArchiveKey(category, itemId)
        return get().entries[key]
      },

      getEntriesByCategory: (category: ArchiveCategory): ArchiveEntry[] => {
        return Object.values(get().entries).filter((e) => e.category === category)
      },

      getDiscoveredEntries: (): ArchiveEntry[] => {
        return Object.values(get().entries).filter((e) => e.discoveredAt !== null)
      },

      getUndiscoveredEntries: (): ArchiveEntry[] => {
        return Object.values(get().entries).filter(
          (e) => e.discoveredAt === null && e.isUnlocked
        )
      },

      getRecentDiscoveries: (count = 10): DiscoveryEvent[] => {
        return get().discoveryHistory.slice(-count).reverse()
      },

      getStats: (): ArchiveStats => {
        return calculateStats(get().entries)
      },

      getCategoryCompletion: (category: ArchiveCategory): number => {
        const entries = get().getEntriesByCategory(category)
        const discovered = entries.filter((e) => e.discoveredAt !== null).length
        return entries.length > 0 ? (discovered / entries.length) * 100 : 0
      },

      isArchiveComplete: (): boolean => {
        return get().getStats().completionPercentage === 100
      },

      // ===========================================================================
      // UTILITY METHODS
      // ===========================================================================

      initializeEntries: (
        allItems: { category: ArchiveCategory; itemId: string; unlockCondition?: string }[]
      ): void => {
        const { entries } = get()
        const preDiscovered = getPreDiscoveredItemIds()
        const newEntries: Record<string, ArchiveEntry> = { ...entries }

        for (const item of allItems) {
          const key = createArchiveKey(item.category, item.itemId)

          // Only add if not already in store (preserve existing progress)
          if (!newEntries[key]) {
            newEntries[key] = {
              key,
              itemId: item.itemId,
              category: item.category,
              discoveredAt: preDiscovered.has(key) ? 0 : null,
              timesUsed: 0,
              timesWonWith: 0,
              isUnlocked: item.unlockCondition === undefined,
              unlockCondition: item.unlockCondition,
            }
          }
        }

        set({ entries: newEntries })
      },

      resetArchive: (): void => {
        const { entries } = get()
        const preDiscovered = getPreDiscoveredItemIds()
        const resetEntries: Record<string, ArchiveEntry> = {}

        for (const [key, entry] of Object.entries(entries)) {
          resetEntries[key] = {
            ...entry,
            timesUsed: 0,
            timesWonWith: 0,
            discoveredAt: preDiscovered.has(key) ? 0 : null,
          }
        }

        set({
          entries: resetEntries,
          discoveryHistory: [],
          currentRunItems: [],
        })
      },

      unlockAll: (): void => {
        const { entries } = get()
        const unlockTimestamp = Date.now()
        const unlockedEntries: Record<string, ArchiveEntry> = {}

        for (const [key, entry] of Object.entries(entries)) {
          unlockedEntries[key] = {
            ...entry,
            isUnlocked: true,
            discoveredAt: entry.discoveredAt ?? unlockTimestamp,
          }
        }

        set({ entries: unlockedEntries })
      },
    }),
    {
      name: 'tensho-archive',
      version: 1,
      partialize: (state) => ({
        entries: state.entries,
        discoveryHistory: state.discoveryHistory,
      }),
    }
  )
)

// =============================================================================
// INITIALIZATION HELPER
// =============================================================================

/**
 * Initialize the archive store with all game items
 * Call this on app startup after all item definitions are loaded
 */
export function initializeArchive(): void {
  // Import here to avoid circular dependencies
  import('../systems/DecreeSystem').then(({ ALL_DECREES }) => {
    import('../config/charterDefinitions').then(({ ALL_CHARTERS }) => {
      import('../config/omenDefinitions').then(({ ALL_OMENS }) => {
        import('../config/mandateDefinitions').then(({ ALL_MANDATES }) => {
          import('../systems/FateSealSystem').then(({ getAllFateSeals }) => {
            import('../systems/CelestialOrbSystem').then(({ getAllCelestialOrbs }) => {
              import('../systems/VoidScriptSystem').then(({ getAllVoidScripts }) => {
                import('../config/archiveDefinitions').then(({
                  WALL_DEFINITIONS,
                  TILE_MARK_DEFINITIONS,
                  SEAL_DEFINITIONS_ARCHIVE,
                  EDITION_DEFINITIONS_ARCHIVE,
                  PACK_VARIANT_DEFINITIONS,
                }) => {
                  const allItems: { category: ArchiveCategory; itemId: string; unlockCondition?: string }[] = []

                  // Decrees
                  for (const decree of ALL_DECREES) {
                    allItems.push({ category: 'decrees', itemId: decree.id })
                  }

                  // Walls
                  for (const wall of WALL_DEFINITIONS) {
                    allItems.push({
                      category: 'walls',
                      itemId: wall.id,
                      unlockCondition: wall.unlockCondition,
                    })
                  }

                  // Charters
                  for (const charter of ALL_CHARTERS) {
                    allItems.push({
                      category: 'charters',
                      itemId: charter.id,
                      unlockCondition: charter.unlockCondition?.description,
                    })
                  }

                  // Consumables
                  for (const seal of getAllFateSeals()) {
                    allItems.push({ category: 'consumables', itemId: seal.id })
                  }
                  for (const orb of getAllCelestialOrbs()) {
                    allItems.push({ category: 'consumables', itemId: orb.id })
                  }
                  for (const script of getAllVoidScripts()) {
                    allItems.push({ category: 'consumables', itemId: script.id })
                  }

                  // Tile Marks
                  for (const mark of TILE_MARK_DEFINITIONS) {
                    allItems.push({ category: 'tileMarks', itemId: mark.id })
                  }

                  // Seals
                  for (const seal of SEAL_DEFINITIONS_ARCHIVE) {
                    allItems.push({ category: 'seals', itemId: seal.id })
                  }

                  // Editions
                  for (const edition of EDITION_DEFINITIONS_ARCHIVE) {
                    allItems.push({ category: 'editions', itemId: edition.id })
                  }

                  // Packs
                  for (const pack of PACK_VARIANT_DEFINITIONS) {
                    allItems.push({ category: 'packs', itemId: pack.id })
                  }

                  // Omens
                  for (const omen of ALL_OMENS) {
                    allItems.push({ category: 'omens', itemId: omen.id })
                  }

                  // Mandates
                  for (const mandate of ALL_MANDATES) {
                    allItems.push({ category: 'mandates', itemId: mandate.id })
                  }

                  useArchiveStore.getState().initializeEntries(allItems)
                })
              })
            })
          })
        })
      })
    })
  })
}

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

/**
 * Get archive completion percentage
 */
export function useArchiveCompletion(): number {
  return useArchiveStore((state) => state.getStats().completionPercentage)
}

/**
 * Get category completion percentages
 */
export function useCategoryCompletions(): Record<ArchiveCategory, number> {
  return useArchiveStore((state) => {
    const stats = state.getStats()
    const completions = {} as Record<ArchiveCategory, number>
    for (const category of Object.keys(ARCHIVE_CATEGORIES) as ArchiveCategory[]) {
      const counts = stats.categoryCounts[category]
      completions[category] = counts?.total > 0 ? (counts.discovered / counts.total) * 100 : 0
    }
    return completions
  })
}

/**
 * Get recent discoveries
 */
export function useRecentDiscoveries(count = 5): DiscoveryEvent[] {
  return useArchiveStore((state) => state.getRecentDiscoveries(count))
}
