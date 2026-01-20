/**
 * Meta Progression System for Tensho Mahjong Roguelike
 *
 * Handles persistent unlocks across runs based on lifetime stats and achievements.
 * Integrates with progression store to track and update unlock status.
 */

import {
  type UnlockDefinition,
  type UnlockCondition,
  type UnlockConditionType,
  type UnlockCategory,
  ALL_UNLOCKS,
  getUnlockById,
  getUnlocksByCategory,
  getDefaultUnlocks,
  getStakeTierFromName,
  STAKE_NAME_TO_TIER,
} from '../config/unlockDefinitions'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Lifetime statistics tracked for meta-progression
 */
export interface LifetimeStats {
  // Run statistics
  totalRunsStarted: number
  totalRunsCompleted: number
  totalRunsWon: number

  // Act/Round statistics
  highestActReached: number
  totalRoundsCompleted: number
  totalRoundsSkipped: number
  fastestWinRounds: number

  // Scoring statistics
  highestSingleHandScore: number
  highestRoundScore: number
  highestRunScore: number
  totalScoreAllTime: number

  // Economy statistics
  totalGoldEarned: number
  totalGoldSpent: number
  maxGoldInRun: number

  // Tile statistics
  totalTilesPlayed: number
  totalTilesDiscarded: number
  totalTilesBought: number

  // Shop statistics
  totalDecreesPurchased: number
  totalChartersPurchased: number
  totalFateSealsBought: number
  totalCelestialOrbsBought: number
  totalPacksOpened: number
  totalRerolls: number
  maxChartersInRun: number

  // Consumable statistics
  totalFateSealsUsed: number
  totalCelestialOrbsUsed: number
  totalVoidScriptsUsed: number

  // Collection/discovery statistics
  fateSealsDiscovered: Set<string>
  celestialOrbsDiscovered: Set<string>
  voidScriptsDiscovered: Set<string>
  decreesDiscovered: Set<string>
  mandatesDiscovered: Set<string>
  chartersPurchased: Set<string>

  // Yaku statistics
  yakuScored: Record<string, number>
  yakumanScored: number
  totalYakuScored: number

  // Special conditions
  maxConsecutiveInterestRounds: number
  emptyScrollRedeems: number
  minHandSizeAchieved: number
  corruptedSeasonsSurvived: number
  winsWithoutFlowers: number
  editionDecreesOwned: number

  // Stake victories per wall
  stakeVictories: Record<string, number[]> // wallId -> array of completed stake tiers

  // Current run tracking (for in-run conditions)
  currentRunChartersPurchased: number
  currentRunDecreesOwned: number
  currentRunFlowersCollected: number
  currentRunGold: number
  currentRunRoundsCompleted: number
}

/**
 * Unlock status for a specific item
 */
export interface UnlockStatus {
  unlockId: string
  isUnlocked: boolean
  unlockedAt?: number
  progress: UnlockConditionProgress[]
}

/**
 * Progress on a specific condition
 */
export interface UnlockConditionProgress {
  type: UnlockConditionType
  current: number
  target: number
  isMet: boolean
  description: string
}

/**
 * Result of checking unlocks after an event
 */
export interface UnlockCheckResult {
  newUnlocks: UnlockDefinition[]
  progressUpdates: { unlock: UnlockDefinition; progress: UnlockConditionProgress[] }[]
}

/**
 * Context for evaluating unlock conditions
 */
export interface UnlockContext {
  stats: LifetimeStats
  unlockedIds: Set<string>
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default lifetime stats for a new player
 */
export const DEFAULT_LIFETIME_STATS: LifetimeStats = {
  totalRunsStarted: 0,
  totalRunsCompleted: 0,
  totalRunsWon: 0,
  highestActReached: 0,
  totalRoundsCompleted: 0,
  totalRoundsSkipped: 0,
  fastestWinRounds: Infinity,
  highestSingleHandScore: 0,
  highestRoundScore: 0,
  highestRunScore: 0,
  totalScoreAllTime: 0,
  totalGoldEarned: 0,
  totalGoldSpent: 0,
  maxGoldInRun: 0,
  totalTilesPlayed: 0,
  totalTilesDiscarded: 0,
  totalTilesBought: 0,
  totalDecreesPurchased: 0,
  totalChartersPurchased: 0,
  totalFateSealsBought: 0,
  totalCelestialOrbsBought: 0,
  totalPacksOpened: 0,
  totalRerolls: 0,
  maxChartersInRun: 0,
  totalFateSealsUsed: 0,
  totalCelestialOrbsUsed: 0,
  totalVoidScriptsUsed: 0,
  fateSealsDiscovered: new Set(),
  celestialOrbsDiscovered: new Set(),
  voidScriptsDiscovered: new Set(),
  decreesDiscovered: new Set(),
  mandatesDiscovered: new Set(),
  chartersPurchased: new Set(),
  yakuScored: {},
  yakumanScored: 0,
  totalYakuScored: 0,
  maxConsecutiveInterestRounds: 0,
  emptyScrollRedeems: 0,
  minHandSizeAchieved: 13,
  corruptedSeasonsSurvived: 0,
  winsWithoutFlowers: 0,
  editionDecreesOwned: 0,
  stakeVictories: {},
  currentRunChartersPurchased: 0,
  currentRunDecreesOwned: 0,
  currentRunFlowersCollected: 0,
  currentRunGold: 0,
  currentRunRoundsCompleted: 0,
}

/**
 * Serializable version of lifetime stats (Sets converted to arrays)
 */
export interface SerializableLifetimeStats
  extends Omit<
    LifetimeStats,
    | 'fateSealsDiscovered'
    | 'celestialOrbsDiscovered'
    | 'voidScriptsDiscovered'
    | 'decreesDiscovered'
    | 'mandatesDiscovered'
    | 'chartersPurchased'
  > {
  fateSealsDiscovered: string[]
  celestialOrbsDiscovered: string[]
  voidScriptsDiscovered: string[]
  decreesDiscovered: string[]
  mandatesDiscovered: string[]
  chartersPurchased: string[]
}

// =============================================================================
// META PROGRESSION SYSTEM CLASS
// =============================================================================

/**
 * System for managing meta-progression across runs
 */
export class MetaProgressionSystem {
  // =========================================================================
  // CONDITION EVALUATION
  // =========================================================================

  /**
   * Evaluate a single unlock condition against current context
   */
  evaluateCondition(
    condition: UnlockCondition,
    context: UnlockContext
  ): UnlockConditionProgress {
    const { stats } = context
    let current = 0
    let target = condition.target ?? 1
    let isMet = false

    switch (condition.type) {
      // Progression-based
      case 'reach_act':
        current = stats.highestActReached
        isMet = current >= target
        break

      case 'complete_act':
        current = stats.highestActReached > target ? 1 : 0
        target = 1
        isMet = current >= target
        break

      case 'win_run':
        current = stats.totalRunsWon
        target = 1
        isMet = current >= target
        break

      case 'win_stake': {
        const stakeName = condition.value ?? 'white'
        const stakeTier = getStakeTierFromName(stakeName)
        // Check if any wall has this stake completed
        let hasWon = false
        for (const victories of Object.values(stats.stakeVictories)) {
          if (victories.includes(stakeTier)) {
            hasWon = true
            break
          }
        }
        current = hasWon ? 1 : 0
        target = 1
        isMet = hasWon
        break
      }

      case 'win_stake_with_wall': {
        const [wallId, stakeName] = (condition.value ?? 'red_wall:white').split(':')
        const stakeTier = getStakeTierFromName(stakeName ?? 'white')
        const wallVictories = stats.stakeVictories[wallId ?? ''] ?? []
        current = wallVictories.includes(stakeTier) ? 1 : 0
        target = 1
        isMet = current >= target
        break
      }

      // Score-based
      case 'single_hand_score':
        current = stats.highestSingleHandScore
        isMet = current >= target
        break

      case 'round_score':
        current = stats.highestRoundScore
        isMet = current >= target
        break

      case 'run_score':
        current = stats.highestRunScore
        isMet = current >= target
        break

      // Collection-based
      case 'collect_all_flowers':
        current = stats.currentRunFlowersCollected >= 4 ? 1 : 0
        target = 1
        isMet = current >= target
        break

      case 'collect_all_seasons':
        // This needs to be tracked separately during gameplay
        current = 0
        target = 1
        isMet = false
        break

      case 'collect_items':
        switch (condition.value) {
          case 'gold':
            current = stats.maxGoldInRun
            break
          case 'edition_decrees':
            current = stats.editionDecreesOwned
            break
          case 'fate_seals_bought':
            current = stats.totalFateSealsBought
            break
          case 'celestial_orbs_bought':
            current = stats.totalCelestialOrbsBought
            break
          case 'min_hand_size':
            current = stats.minHandSizeAchieved <= target ? 1 : 0
            target = 1
            break
          default:
            current = 0
        }
        isMet = current >= target
        break

      // Gameplay-based
      case 'decrees_owned':
        current = stats.currentRunDecreesOwned
        isMet = current >= target
        break

      case 'yaku_scored': {
        const yakuId = condition.value ?? ''
        current = stats.yakuScored[yakuId] ?? 0
        isMet = current >= target
        break
      }

      case 'yakuman_scored':
        current = stats.yakumanScored
        target = 1
        isMet = current >= target
        break

      case 'survive_corrupted_seasons':
        current = stats.corruptedSeasonsSurvived
        isMet = current >= target
        break

      case 'skip_rounds':
        current = stats.totalRoundsSkipped
        isMet = current >= target
        break

      case 'rounds_completed':
        // For speed runs, check if won in fewer rounds
        current = stats.fastestWinRounds === Infinity ? 0 : stats.fastestWinRounds
        isMet = current > 0 && current <= target
        break

      case 'win_without_flowers':
        current = stats.winsWithoutFlowers
        target = 1
        isMet = current >= target
        break

      // Cumulative stats
      case 'total_gold_spent':
        current = stats.totalGoldSpent
        isMet = current >= target
        break

      case 'total_tiles_played':
        current = stats.totalTilesPlayed
        isMet = current >= target
        break

      case 'total_tiles_discarded':
        current = stats.totalTilesDiscarded
        isMet = current >= target
        break

      case 'total_decrees_purchased':
        current = stats.totalDecreesPurchased
        isMet = current >= target
        break

      case 'total_rerolls':
        current = stats.totalRerolls
        isMet = current >= target
        break

      case 'total_fate_seals_used':
        current = stats.totalFateSealsUsed
        isMet = current >= target
        break

      case 'total_celestial_orbs_used':
        current = stats.totalCelestialOrbsUsed
        isMet = current >= target
        break

      case 'total_packs_opened':
        current = stats.totalPacksOpened
        isMet = current >= target
        break

      case 'total_runs':
        current = stats.totalRunsStarted
        isMet = current >= target
        break

      case 'total_wins':
        current = stats.totalRunsWon
        isMet = current >= target
        break

      case 'max_interest_rounds':
        current = stats.maxConsecutiveInterestRounds
        isMet = current >= target
        break

      case 'empty_scroll_redeemed':
        current = stats.emptyScrollRedeems
        isMet = current >= target
        break

      case 'tiles_bought':
        current = stats.totalTilesBought
        isMet = current >= target
        break

      // Specific achievements
      case 'charter_purchased': {
        const charterId = condition.value ?? ''
        current = stats.chartersPurchased.has(charterId) ? 1 : 0
        target = 1
        isMet = current >= target
        break
      }

      case 'discovery': {
        const discoveryType = condition.value ?? ''
        switch (discoveryType) {
          case 'all_fate_seals':
            // Assume 22 fate seals total
            current = stats.fateSealsDiscovered.size
            target = 22
            isMet = current >= target
            break
          case 'all_celestial_orbs':
            // Assume 13 celestial orbs total
            current = stats.celestialOrbsDiscovered.size
            target = 13
            isMet = current >= target
            break
          case 'all_void_scripts':
            // Assume 20 void scripts total
            current = stats.voidScriptsDiscovered.size
            target = 20
            isMet = current >= target
            break
          case 'mandates':
            current = stats.mandatesDiscovered.size
            isMet = current >= (condition.target ?? 0)
            break
          default:
            current = 0
            isMet = false
        }
        break
      }

      case 'charters_in_run':
        current = stats.currentRunChartersPurchased
        isMet = current >= target
        break

      default:
        current = 0
        isMet = false
    }

    return {
      type: condition.type,
      current,
      target,
      isMet,
      description: condition.description,
    }
  }

  /**
   * Check if all conditions for an unlock are met
   */
  checkUnlockConditions(
    unlock: UnlockDefinition,
    context: UnlockContext
  ): { allMet: boolean; progress: UnlockConditionProgress[] } {
    if (unlock.unlockedByDefault) {
      return {
        allMet: true,
        progress: [],
      }
    }

    const progress = unlock.conditions.map((condition) =>
      this.evaluateCondition(condition, context)
    )

    const allMet = progress.every((p) => p.isMet)

    return { allMet, progress }
  }

  /**
   * Check all unlocks and return newly unlocked items
   */
  checkAllUnlocks(context: UnlockContext): UnlockCheckResult {
    const newUnlocks: UnlockDefinition[] = []
    const progressUpdates: { unlock: UnlockDefinition; progress: UnlockConditionProgress[] }[] = []

    for (const unlock of ALL_UNLOCKS) {
      // Skip already unlocked
      if (context.unlockedIds.has(unlock.id)) {
        continue
      }

      const { allMet, progress } = this.checkUnlockConditions(unlock, context)

      if (allMet) {
        newUnlocks.push(unlock)
      } else if (progress.some((p) => p.current > 0)) {
        // Has some progress
        progressUpdates.push({ unlock, progress })
      }
    }

    return { newUnlocks, progressUpdates }
  }

  // =========================================================================
  // STATUS QUERIES
  // =========================================================================

  /**
   * Get unlock status for a specific unlock
   */
  getUnlockStatus(
    unlockId: string,
    context: UnlockContext
  ): UnlockStatus | undefined {
    const unlock = getUnlockById(unlockId)
    if (!unlock) return undefined

    const isUnlocked = context.unlockedIds.has(unlockId)
    const { progress } = this.checkUnlockConditions(unlock, context)

    return {
      unlockId,
      isUnlocked,
      progress,
    }
  }

  /**
   * Get all unlocks in a category with their status
   */
  getUnlocksByCategory(
    category: UnlockCategory,
    context: UnlockContext
  ): UnlockStatus[] {
    const unlocks = getUnlocksByCategory(category)
    return unlocks.map((unlock) => ({
      unlockId: unlock.id,
      isUnlocked: context.unlockedIds.has(unlock.id),
      progress: this.checkUnlockConditions(unlock, context).progress,
    }))
  }

  /**
   * Check if a specific item is unlocked
   */
  isItemUnlocked(itemId: string, unlockedIds: Set<string>): boolean {
    // Check if any unlock that unlocks this item is in the unlocked set
    for (const unlock of ALL_UNLOCKS) {
      if (unlock.unlocksId === itemId && unlockedIds.has(unlock.id)) {
        return true
      }
      // Also check default unlocks
      if (unlock.unlocksId === itemId && unlock.unlockedByDefault) {
        return true
      }
    }
    return false
  }

  /**
   * Get all unlocked item IDs by category
   */
  getUnlockedItems(
    category: UnlockCategory,
    unlockedIds: Set<string>
  ): string[] {
    const items: string[] = []
    const unlocks = getUnlocksByCategory(category)

    for (const unlock of unlocks) {
      if (unlock.unlockedByDefault || unlockedIds.has(unlock.id)) {
        items.push(unlock.unlocksId)
      }
    }

    return items
  }

  // =========================================================================
  // STAT TRACKING HELPERS
  // =========================================================================

  /**
   * Calculate completion percentage for a category
   */
  calculateCategoryCompletion(
    category: UnlockCategory,
    unlockedIds: Set<string>
  ): { unlocked: number; total: number; percentage: number } {
    const unlocks = getUnlocksByCategory(category)
    const unlocked = unlocks.filter(
      (u) => u.unlockedByDefault || unlockedIds.has(u.id)
    ).length
    const total = unlocks.length
    const percentage = total > 0 ? (unlocked / total) * 100 : 0

    return { unlocked, total, percentage }
  }

  /**
   * Calculate overall completion percentage
   */
  calculateOverallCompletion(unlockedIds: Set<string>): {
    unlocked: number
    total: number
    percentage: number
  } {
    const unlocked = ALL_UNLOCKS.filter(
      (u) => u.unlockedByDefault || unlockedIds.has(u.id)
    ).length
    const total = ALL_UNLOCKS.length
    const percentage = total > 0 ? (unlocked / total) * 100 : 0

    return { unlocked, total, percentage }
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  /**
   * Convert lifetime stats to serializable format
   */
  serializeStats(stats: LifetimeStats): SerializableLifetimeStats {
    return {
      ...stats,
      fateSealsDiscovered: Array.from(stats.fateSealsDiscovered),
      celestialOrbsDiscovered: Array.from(stats.celestialOrbsDiscovered),
      voidScriptsDiscovered: Array.from(stats.voidScriptsDiscovered),
      decreesDiscovered: Array.from(stats.decreesDiscovered),
      mandatesDiscovered: Array.from(stats.mandatesDiscovered),
      chartersPurchased: Array.from(stats.chartersPurchased),
    }
  }

  /**
   * Convert serialized stats back to LifetimeStats
   */
  deserializeStats(serialized: SerializableLifetimeStats): LifetimeStats {
    return {
      ...serialized,
      fateSealsDiscovered: new Set(serialized.fateSealsDiscovered),
      celestialOrbsDiscovered: new Set(serialized.celestialOrbsDiscovered),
      voidScriptsDiscovered: new Set(serialized.voidScriptsDiscovered),
      decreesDiscovered: new Set(serialized.decreesDiscovered),
      mandatesDiscovered: new Set(serialized.mandatesDiscovered),
      chartersPurchased: new Set(serialized.chartersPurchased),
    }
  }

  /**
   * Get default unlocked IDs (for new players)
   */
  getDefaultUnlockedIds(): Set<string> {
    return new Set(getDefaultUnlocks().map((u) => u.id))
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Singleton instance of MetaProgressionSystem
 */
export const metaProgressionSystem = new MetaProgressionSystem()

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Event types that can trigger stat updates
 */
export type ProgressionEventType =
  | 'run_started'
  | 'run_completed'
  | 'run_won'
  | 'run_lost'
  | 'round_completed'
  | 'round_skipped'
  | 'act_reached'
  | 'hand_scored'
  | 'yaku_scored'
  | 'yakuman_scored'
  | 'tile_played'
  | 'tile_discarded'
  | 'gold_earned'
  | 'gold_spent'
  | 'decree_purchased'
  | 'charter_purchased'
  | 'fate_seal_used'
  | 'celestial_orb_used'
  | 'void_script_used'
  | 'pack_opened'
  | 'shop_rerolled'
  | 'item_discovered'
  | 'interest_collected'
  | 'flower_collected'
  | 'corrupted_season_survived'

/**
 * Payload for progression events
 */
export interface ProgressionEventPayload {
  type: ProgressionEventType
  value?: number
  itemId?: string
  itemType?: string
  stakeTier?: number
  wallId?: string
  wasMaxInterest?: boolean
  hadFlowers?: boolean
  roundsCompleted?: number
}

/**
 * Process a progression event and return stat updates
 */
export function processProgressionEvent(
  event: ProgressionEventPayload,
  stats: LifetimeStats
): Partial<LifetimeStats> {
  const updates: Partial<LifetimeStats> = {}

  switch (event.type) {
    case 'run_started':
      updates.totalRunsStarted = stats.totalRunsStarted + 1
      updates.currentRunChartersPurchased = 0
      updates.currentRunDecreesOwned = 0
      updates.currentRunFlowersCollected = 0
      updates.currentRunGold = 0
      updates.currentRunRoundsCompleted = 0
      break

    case 'run_completed':
      updates.totalRunsCompleted = stats.totalRunsCompleted + 1
      break

    case 'run_won':
      updates.totalRunsWon = stats.totalRunsWon + 1
      if (event.roundsCompleted !== undefined) {
        if (event.roundsCompleted < stats.fastestWinRounds) {
          updates.fastestWinRounds = event.roundsCompleted
        }
      }
      if (event.stakeTier !== undefined && event.wallId !== undefined) {
        const newVictories = { ...stats.stakeVictories }
        if (!newVictories[event.wallId]) {
          newVictories[event.wallId] = []
        }
        if (!newVictories[event.wallId].includes(event.stakeTier)) {
          newVictories[event.wallId] = [...newVictories[event.wallId], event.stakeTier]
        }
        updates.stakeVictories = newVictories
      }
      if (!event.hadFlowers) {
        updates.winsWithoutFlowers = stats.winsWithoutFlowers + 1
      }
      break

    case 'round_completed':
      updates.totalRoundsCompleted = stats.totalRoundsCompleted + 1
      updates.currentRunRoundsCompleted = stats.currentRunRoundsCompleted + 1
      break

    case 'round_skipped':
      updates.totalRoundsSkipped = stats.totalRoundsSkipped + 1
      break

    case 'act_reached':
      if ((event.value ?? 0) > stats.highestActReached) {
        updates.highestActReached = event.value
      }
      break

    case 'hand_scored':
      if ((event.value ?? 0) > stats.highestSingleHandScore) {
        updates.highestSingleHandScore = event.value
      }
      updates.totalScoreAllTime = stats.totalScoreAllTime + (event.value ?? 0)
      break

    case 'yaku_scored':
      if (event.itemId) {
        const newYakuScored = { ...stats.yakuScored }
        newYakuScored[event.itemId] = (newYakuScored[event.itemId] ?? 0) + 1
        updates.yakuScored = newYakuScored
        updates.totalYakuScored = stats.totalYakuScored + 1
      }
      break

    case 'yakuman_scored':
      updates.yakumanScored = stats.yakumanScored + 1
      break

    case 'tile_played':
      updates.totalTilesPlayed = stats.totalTilesPlayed + (event.value ?? 1)
      break

    case 'tile_discarded':
      updates.totalTilesDiscarded = stats.totalTilesDiscarded + (event.value ?? 1)
      break

    case 'gold_earned':
      updates.totalGoldEarned = stats.totalGoldEarned + (event.value ?? 0)
      updates.currentRunGold = stats.currentRunGold + (event.value ?? 0)
      if (updates.currentRunGold > stats.maxGoldInRun) {
        updates.maxGoldInRun = updates.currentRunGold
      }
      break

    case 'gold_spent':
      updates.totalGoldSpent = stats.totalGoldSpent + (event.value ?? 0)
      updates.currentRunGold = Math.max(0, stats.currentRunGold - (event.value ?? 0))
      break

    case 'decree_purchased':
      updates.totalDecreesPurchased = stats.totalDecreesPurchased + 1
      updates.currentRunDecreesOwned = stats.currentRunDecreesOwned + 1
      if (event.itemId) {
        const newDiscovered = new Set(stats.decreesDiscovered)
        newDiscovered.add(event.itemId)
        updates.decreesDiscovered = newDiscovered
      }
      break

    case 'charter_purchased':
      updates.totalChartersPurchased = stats.totalChartersPurchased + 1
      updates.currentRunChartersPurchased = stats.currentRunChartersPurchased + 1
      if (stats.currentRunChartersPurchased + 1 > stats.maxChartersInRun) {
        updates.maxChartersInRun = stats.currentRunChartersPurchased + 1
      }
      if (event.itemId) {
        const newCharters = new Set(stats.chartersPurchased)
        newCharters.add(event.itemId)
        updates.chartersPurchased = newCharters
        // Track Empty Scroll redeems
        if (event.itemId === 'empty_scroll') {
          updates.emptyScrollRedeems = stats.emptyScrollRedeems + 1
        }
      }
      break

    case 'fate_seal_used':
      updates.totalFateSealsUsed = stats.totalFateSealsUsed + 1
      if (event.itemId) {
        const newDiscovered = new Set(stats.fateSealsDiscovered)
        newDiscovered.add(event.itemId)
        updates.fateSealsDiscovered = newDiscovered
      }
      break

    case 'celestial_orb_used':
      updates.totalCelestialOrbsUsed = stats.totalCelestialOrbsUsed + 1
      if (event.itemId) {
        const newDiscovered = new Set(stats.celestialOrbsDiscovered)
        newDiscovered.add(event.itemId)
        updates.celestialOrbsDiscovered = newDiscovered
      }
      break

    case 'void_script_used':
      updates.totalVoidScriptsUsed = stats.totalVoidScriptsUsed + 1
      if (event.itemId) {
        const newDiscovered = new Set(stats.voidScriptsDiscovered)
        newDiscovered.add(event.itemId)
        updates.voidScriptsDiscovered = newDiscovered
      }
      break

    case 'pack_opened':
      updates.totalPacksOpened = stats.totalPacksOpened + 1
      break

    case 'shop_rerolled':
      updates.totalRerolls = stats.totalRerolls + 1
      break

    case 'item_discovered':
      if (event.itemId && event.itemType === 'mandate') {
        const newDiscovered = new Set(stats.mandatesDiscovered)
        newDiscovered.add(event.itemId)
        updates.mandatesDiscovered = newDiscovered
      }
      break

    case 'interest_collected':
      if (event.wasMaxInterest) {
        updates.maxConsecutiveInterestRounds = stats.maxConsecutiveInterestRounds + 1
      } else {
        updates.maxConsecutiveInterestRounds = 0
      }
      break

    case 'flower_collected':
      updates.currentRunFlowersCollected = stats.currentRunFlowersCollected + 1
      break

    case 'corrupted_season_survived':
      updates.corruptedSeasonsSurvived = stats.corruptedSeasonsSurvived + 1
      break
  }

  return updates
}
