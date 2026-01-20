/**
 * Archive System for Tensho Mahjong Roguelike
 *
 * The Archive of Hands (手牌録) tracks all discovered items across runs.
 * This system handles discovery mechanics, statistics, and data generation
 * for the collection screen.
 *
 * Based on ARCHITECTURE.MD Section 29 - Archive of Hands.
 */

import {
  ArchiveCategory,
  ARCHIVE_CATEGORIES,
  getAllArchiveCategories,
  createArchiveKey,
  parseArchiveKey,
  getPreDiscoveredItemIds,
  WALL_DEFINITIONS,
  TILE_MARK_DEFINITIONS,
  SEAL_DEFINITIONS_ARCHIVE,
  EDITION_DEFINITIONS_ARCHIVE,
  PACK_VARIANT_DEFINITIONS,
} from '../config/archiveDefinitions'
import { ALL_DECREES } from './DecreeSystem'
import { ALL_CHARTERS } from '../config/charterDefinitions'
import { ALL_OMENS } from '../config/omenDefinitions'
import { ALL_MANDATES } from '../config/mandateDefinitions'
import { getAllFateSeals } from './FateSealSystem'
import { getAllCelestialOrbs } from './CelestialOrbSystem'
import { getAllVoidScripts } from './VoidScriptSystem'

// =============================================================================
// ARCHIVE ENTRY TYPES
// =============================================================================

/**
 * Archive entry for a single discoverable item
 */
export interface ArchiveEntry {
  /** Composite key: "category:itemId" */
  key: string
  /** Item ID within its category */
  itemId: string
  /** Category this item belongs to */
  category: ArchiveCategory
  /** Timestamp when item was discovered (null if not yet discovered) */
  discoveredAt: number | null
  /** Number of times this item has been used/obtained */
  timesUsed: number
  /** Number of runs won with this item active/owned */
  timesWonWith: number
  /** Whether the item is unlocked for appearance */
  isUnlocked: boolean
  /** Optional unlock condition description */
  unlockCondition?: string
}

/**
 * Discovery event types
 */
export type DiscoveryTrigger =
  | 'purchase' // Bought from shop
  | 'pack_open' // Opened from pack
  | 'mandate_encounter' // Encountered boss mandate
  | 'skip_reward' // Awarded from skipping round
  | 'win' // Discovered upon winning
  | 'starting' // Pre-discovered on new profile
  | 'unlock' // Unlocked via achievement/condition

/**
 * Discovery event record
 */
export interface DiscoveryEvent {
  key: string
  trigger: DiscoveryTrigger
  timestamp: number
  runNumber?: number
  actNumber?: number
}

/**
 * Archive statistics
 */
export interface ArchiveStats {
  totalDiscovered: number
  totalItems: number
  completionPercentage: number
  categoryCounts: Record<ArchiveCategory, { discovered: number; total: number }>
  lastDiscoveryTime: number | null
  totalTimesUsed: number
  totalRunsWon: number
}

// =============================================================================
// ARCHIVE SYSTEM CLASS
// =============================================================================

/**
 * Manages the Archive of Hands collection system
 */
export class ArchiveSystem {
  private entries: Map<string, ArchiveEntry> = new Map()
  private discoveryHistory: DiscoveryEvent[] = []

  constructor() {
    this.initializeArchive()
  }

  /**
   * Initialize archive with all known items
   */
  private initializeArchive(): void {
    // Pre-discovered items
    const preDiscovered = getPreDiscoveredItemIds()

    // Initialize Decrees
    for (const decree of ALL_DECREES) {
      const key = createArchiveKey('decrees', decree.id)
      this.entries.set(key, {
        key,
        itemId: decree.id,
        category: 'decrees',
        discoveredAt: preDiscovered.has(key) ? 0 : null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: true, // All decrees start unlocked
      })
    }

    // Initialize Walls
    for (const wall of WALL_DEFINITIONS) {
      const key = createArchiveKey('walls', wall.id)
      this.entries.set(key, {
        key,
        itemId: wall.id,
        category: 'walls',
        discoveredAt: preDiscovered.has(key) ? 0 : null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: wall.unlockCondition === undefined,
        unlockCondition: wall.unlockCondition,
      })
    }

    // Initialize Imperial Charters
    for (const charter of ALL_CHARTERS) {
      const key = createArchiveKey('charters', charter.id)
      this.entries.set(key, {
        key,
        itemId: charter.id,
        category: 'charters',
        discoveredAt: null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: !charter.isUpgraded, // Base charters unlocked, upgraded require base
        unlockCondition: charter.unlockCondition?.description,
      })
    }

    // Initialize Consumables (Fate Seals, Celestial Orbs, Void Scripts)
    for (const seal of getAllFateSeals()) {
      const key = createArchiveKey('consumables', seal.id)
      this.entries.set(key, {
        key,
        itemId: seal.id,
        category: 'consumables',
        discoveredAt: null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: true,
      })
    }

    for (const orb of getAllCelestialOrbs()) {
      const key = createArchiveKey('consumables', orb.id)
      this.entries.set(key, {
        key,
        itemId: orb.id,
        category: 'consumables',
        discoveredAt: null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: true,
      })
    }

    for (const script of getAllVoidScripts()) {
      const key = createArchiveKey('consumables', script.id)
      this.entries.set(key, {
        key,
        itemId: script.id,
        category: 'consumables',
        discoveredAt: null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: true,
      })
    }

    // Initialize Tile Marks
    for (const mark of TILE_MARK_DEFINITIONS) {
      const key = createArchiveKey('tileMarks', mark.id)
      this.entries.set(key, {
        key,
        itemId: mark.id,
        category: 'tileMarks',
        discoveredAt: preDiscovered.has(key) ? 0 : null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: true,
      })
    }

    // Initialize Seals
    for (const seal of SEAL_DEFINITIONS_ARCHIVE) {
      const key = createArchiveKey('seals', seal.id)
      this.entries.set(key, {
        key,
        itemId: seal.id,
        category: 'seals',
        discoveredAt: preDiscovered.has(key) ? 0 : null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: true,
      })
    }

    // Initialize Editions
    for (const edition of EDITION_DEFINITIONS_ARCHIVE) {
      const key = createArchiveKey('editions', edition.id)
      this.entries.set(key, {
        key,
        itemId: edition.id,
        category: 'editions',
        discoveredAt: preDiscovered.has(key) ? 0 : null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: true,
      })
    }

    // Initialize Blessing Pack Variants
    for (const pack of PACK_VARIANT_DEFINITIONS) {
      const key = createArchiveKey('packs', pack.id)
      this.entries.set(key, {
        key,
        itemId: pack.id,
        category: 'packs',
        discoveredAt: null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: true,
      })
    }

    // Initialize Omens
    for (const omen of ALL_OMENS) {
      const key = createArchiveKey('omens', omen.id)
      this.entries.set(key, {
        key,
        itemId: omen.id,
        category: 'omens',
        discoveredAt: null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: true,
      })
    }

    // Initialize Mandates
    for (const mandate of ALL_MANDATES) {
      const key = createArchiveKey('mandates', mandate.id)
      this.entries.set(key, {
        key,
        itemId: mandate.id,
        category: 'mandates',
        discoveredAt: null,
        timesUsed: 0,
        timesWonWith: 0,
        isUnlocked: true,
      })
    }
  }

  // ===========================================================================
  // DISCOVERY METHODS
  // ===========================================================================

  /**
   * Discover an item
   */
  discoverItem(
    category: ArchiveCategory,
    itemId: string,
    trigger: DiscoveryTrigger,
    runNumber?: number,
    actNumber?: number
  ): boolean {
    const key = createArchiveKey(category, itemId)
    const entry = this.entries.get(key)

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

    // Mark as discovered
    entry.discoveredAt = Date.now()

    // Record discovery event
    this.discoveryHistory.push({
      key,
      trigger,
      timestamp: entry.discoveredAt,
      runNumber,
      actNumber,
    })

    return true
  }

  /**
   * Check if an item is discovered
   */
  isDiscovered(category: ArchiveCategory, itemId: string): boolean {
    const key = createArchiveKey(category, itemId)
    const entry = this.entries.get(key)
    return entry !== undefined && entry.discoveredAt !== null
  }

  /**
   * Unlock an item for appearance
   */
  unlockItem(category: ArchiveCategory, itemId: string): boolean {
    const key = createArchiveKey(category, itemId)
    const entry = this.entries.get(key)

    if (!entry) {
      return false
    }

    entry.isUnlocked = true
    return true
  }

  /**
   * Increment usage count for an item
   */
  incrementUsage(category: ArchiveCategory, itemId: string): void {
    const key = createArchiveKey(category, itemId)
    const entry = this.entries.get(key)

    if (entry) {
      entry.timesUsed++

      // Auto-discover on first use if not discovered
      if (entry.discoveredAt === null && entry.isUnlocked) {
        this.discoverItem(category, itemId, 'purchase')
      }
    }
  }

  /**
   * Increment win count for items used in a winning run
   */
  incrementWins(itemKeys: string[]): void {
    for (const key of itemKeys) {
      const entry = this.entries.get(key)
      if (entry) {
        entry.timesWonWith++
      }
    }
  }

  // ===========================================================================
  // QUERY METHODS
  // ===========================================================================

  /**
   * Get an archive entry by key
   */
  getEntry(category: ArchiveCategory, itemId: string): ArchiveEntry | undefined {
    const key = createArchiveKey(category, itemId)
    return this.entries.get(key)
  }

  /**
   * Get all entries for a category
   */
  getEntriesByCategory(category: ArchiveCategory): ArchiveEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.category === category)
  }

  /**
   * Get all discovered entries
   */
  getDiscoveredEntries(): ArchiveEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.discoveredAt !== null)
  }

  /**
   * Get all undiscovered entries
   */
  getUndiscoveredEntries(): ArchiveEntry[] {
    return Array.from(this.entries.values()).filter(
      (e) => e.discoveredAt === null && e.isUnlocked
    )
  }

  /**
   * Get recent discoveries (last N)
   */
  getRecentDiscoveries(count: number = 10): DiscoveryEvent[] {
    return this.discoveryHistory.slice(-count).reverse()
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  /**
   * Calculate archive statistics
   */
  getStats(): ArchiveStats {
    const categories = getAllArchiveCategories()
    const categoryCounts = {} as Record<ArchiveCategory, { discovered: number; total: number }>

    let totalDiscovered = 0
    let totalItems = 0
    let lastDiscoveryTime: number | null = null
    let totalTimesUsed = 0
    let totalRunsWon = 0

    for (const cat of categories) {
      const entries = this.getEntriesByCategory(cat.id)
      const discovered = entries.filter((e) => e.discoveredAt !== null).length

      categoryCounts[cat.id] = {
        discovered,
        total: entries.length,
      }

      totalDiscovered += discovered
      totalItems += entries.length

      for (const entry of entries) {
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

  /**
   * Get completion percentage for a category
   */
  getCategoryCompletion(category: ArchiveCategory): number {
    const entries = this.getEntriesByCategory(category)
    const discovered = entries.filter((e) => e.discoveredAt !== null).length
    return entries.length > 0 ? (discovered / entries.length) * 100 : 0
  }

  /**
   * Check if archive is complete
   */
  isArchiveComplete(): boolean {
    return this.getStats().completionPercentage === 100
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Export archive state for persistence
   */
  toState(): {
    entries: [string, ArchiveEntry][]
    discoveryHistory: DiscoveryEvent[]
  } {
    return {
      entries: Array.from(this.entries.entries()),
      discoveryHistory: [...this.discoveryHistory],
    }
  }

  /**
   * Import archive state from persistence
   */
  static fromState(state: {
    entries: [string, ArchiveEntry][]
    discoveryHistory: DiscoveryEvent[]
  }): ArchiveSystem {
    const system = new ArchiveSystem()

    // Override with saved state
    for (const [key, entry] of state.entries) {
      // Only update if the entry exists (to handle new items added in updates)
      if (system.entries.has(key)) {
        system.entries.set(key, entry)
      }
    }

    system.discoveryHistory = [...state.discoveryHistory]

    return system
  }

  /**
   * Reset archive to initial state (keeps pre-discovered items)
   */
  reset(): void {
    const preDiscovered = getPreDiscoveredItemIds()

    for (const entry of this.entries.values()) {
      entry.timesUsed = 0
      entry.timesWonWith = 0
      entry.discoveredAt = preDiscovered.has(entry.key) ? 0 : null
    }

    this.discoveryHistory = []
  }

  /**
   * Unlock all items (disables achievement tracking per ARCHITECTURE.MD)
   */
  unlockAll(): void {
    for (const entry of this.entries.values()) {
      entry.isUnlocked = true
      if (entry.discoveredAt === null) {
        entry.discoveredAt = Date.now()
      }
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get display name for a discovery trigger
 */
export function getDiscoveryTriggerName(trigger: DiscoveryTrigger): string {
  const names: Record<DiscoveryTrigger, string> = {
    purchase: 'Purchased',
    pack_open: 'Opened from Pack',
    mandate_encounter: 'Mandate Encountered',
    skip_reward: 'Skip Reward',
    win: 'Victory Bonus',
    starting: 'Starter Item',
    unlock: 'Unlocked',
  }
  return names[trigger]
}

/**
 * Get Japanese name for a discovery trigger
 */
export function getDiscoveryTriggerJapaneseName(trigger: DiscoveryTrigger): string {
  const names: Record<DiscoveryTrigger, string> = {
    purchase: '購入',
    pack_open: '開封',
    mandate_encounter: '局遭遇',
    skip_reward: '見送り報酬',
    win: '勝利報酬',
    starting: '初期所持',
    unlock: '解放',
  }
  return names[trigger]
}

/**
 * Format discovery date
 */
export function formatDiscoveryDate(timestamp: number | null): string {
  if (timestamp === null) {
    return 'Not discovered'
  }
  if (timestamp === 0) {
    return 'Starter item'
  }
  return new Date(timestamp).toLocaleDateString()
}

/**
 * Create a singleton archive system instance
 */
let archiveSystemInstance: ArchiveSystem | null = null

export function getArchiveSystem(): ArchiveSystem {
  if (!archiveSystemInstance) {
    archiveSystemInstance = new ArchiveSystem()
  }
  return archiveSystemInstance
}

export function resetArchiveSystem(): void {
  archiveSystemInstance = null
}
