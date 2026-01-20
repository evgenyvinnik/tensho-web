/**
 * Omen Store - Omen Tag state management
 *
 * Manages the Omen Tags system for skip rewards.
 * Omen Tags (兆標) are one-time destiny modifiers that trigger once, then vanish.
 * They are awarded when skipping Small or Large rounds before the Boss round.
 */

import { create } from 'zustand'
import type { SeasonVariant, DecreeRarity, PackType } from '../systems/types'

// Import from omenDefinitions for the actual definitions
import type {
  OmenDefinition,
  OmenTrigger,
  OmenEffectType,
} from '../config/omenDefinitions'
import {
  ALL_OMENS,
  getRandomOmen,
} from '../config/omenDefinitions'

// Re-export types for convenience
export type OmenTagDefinition = OmenDefinition
export type OmenTriggerCondition = OmenTrigger
export type { OmenEffectType }

// Tile edition type (for omen effects that grant editions)
export type TileEdition = 'Foil' | 'Holographic' | 'Polychrome' | 'Negative'

// Active omen tag instance
export interface ActiveOmenTag {
  id: string
  definitionId: string
  acquiredAct: number
  acquiredRound: number
  isConsumed: boolean
  triggeredAt?: number
}

// Use ALL_OMENS as the tag definitions
export const ALL_OMEN_TAGS = ALL_OMENS

// Default unlocked tags (all available by default for now)
export const DEFAULT_UNLOCKED_OMEN_TAGS = ALL_OMENS.map((o) => o.id)

// Helper functions for display
export function getOmenTagDisplayName(definitionId: string): string {
  const def = ALL_OMENS.find((o) => o.id === definitionId)
  return def?.name ?? definitionId
}

export function getOmenTagJapaneseName(definitionId: string): string {
  const def = ALL_OMENS.find((o) => o.id === definitionId)
  return def?.japaneseName ?? ''
}

export function getOmenTagDescription(definitionId: string): string {
  const def = ALL_OMENS.find((o) => o.id === definitionId)
  return def?.effect.description ?? ''
}

export function getRandomWeightedOmenTag(excludeIds: string[] = []): OmenDefinition | null {
  return getRandomOmen(excludeIds)
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Status of an omen tag
 */
export type OmenStatus =
  | 'active' // Ready to trigger
  | 'triggered' // Has triggered but effects may still apply (for passive/scaling)
  | 'consumed' // Fully consumed and removed

/**
 * Omen history entry for tracking consumed omens
 */
export interface OmenHistoryEntry {
  id: string
  definitionId: string
  name: string
  japaneseName: string
  acquiredAct: number
  acquiredRound: number
  consumedAct: number
  consumedRound: number
  triggerCondition: OmenTriggerCondition
  effectDescription: string
}

/**
 * Locked season state from omen trade-offs
 */
export interface LockedSeason {
  seasonType: SeasonVariant
  sourceOmenId: string
  isApplied: boolean
}

/**
 * Omen store state
 */
export interface OmenState {
  // Active tags queue (FIFO - oldest first triggers first)
  activeTags: ActiveOmenTag[]

  // Consumed tags (history for this run)
  consumedTags: ActiveOmenTag[]

  // Tags pending for next shop
  pendingShopTags: ActiveOmenTag[]

  // Tags pending for next boss
  pendingBossTags: ActiveOmenTag[]

  // Run statistics for scaling effects
  roundsSkippedThisRun: number
  handsPlayedThisRun: number
  unusedDiscardsThisRun: number

  // Special states
  hasDoubleOmenActive: boolean
  lockedSeason: LockedSeason | null
  noInterestRounds: number

  // Unlocked tags (persisted across runs)
  unlockedTagIds: string[]

  // Current position
  currentAct: number
  currentRound: number

  // History for display
  omenHistory: OmenHistoryEntry[]

  // Actions
  addTag: (definitionId: string) => ActiveOmenTag | null
  awardRandomTag: () => ActiveOmenTag | null
  consumeTag: (tagId: string) => boolean
  consumeShopTags: () => ActiveOmenTag[]
  consumeBossTags: () => ActiveOmenTag[]
  copyNextTag: () => void

  // State updates
  setCurrentPosition: (act: number, round: number) => void
  incrementRoundsSkipped: () => void
  incrementHandsPlayed: () => void
  addUnusedDiscards: (count: number) => void
  unlockTag: (tagId: string) => boolean
  setLockedSeason: (seasonType: SeasonVariant, omenId: string) => void
  applyLockedSeason: () => SeasonVariant | null
  decrementNoInterestRounds: () => void

  // Queries
  getTagDefinition: (definitionId: string) => OmenTagDefinition | undefined
  getActiveTags: () => ActiveOmenTag[]
  getInstantTags: () => ActiveOmenTag[]
  getPendingShopTags: () => ActiveOmenTag[]
  getPendingBossTags: () => ActiveOmenTag[]
  getTotalSkippedRounds: () => number
  getOmenHistory: () => OmenHistoryEntry[]
  hasActiveOmenWithEffect: (effectType: OmenEffectType) => boolean

  // Effect calculations
  calculateInstantGold: (tagId: string, currentGold: number) => number
  calculateScalingGold: (tagId: string) => number
  hasFreeCoupon: () => boolean
  hasFreeRerolls: () => boolean
  getFreeDecreeInfo: () => { rarity: DecreeRarity; edition?: TileEdition }[]
  getFreePacks: () => { packType: PackType; isMega: boolean }[]
  getPendingBossGold: () => number
  hasBossReroll: () => boolean
  isDoubleOmenActive: () => boolean
  getHandSizeBonus: () => number
  getCreatedDecreeCount: () => number
  getYakuUpgradeLevels: () => number

  // Run lifecycle
  clearForNewRun: () => void
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate unique tag instance ID
 */
function generateTagId(definitionId: string): string {
  return `omen-${definitionId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Create history entry from consumed tag
 */
function createHistoryEntry(
  tag: ActiveOmenTag,
  currentAct: number,
  currentRound: number
): OmenHistoryEntry {
  const definition = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
  return {
    id: tag.id,
    definitionId: tag.definitionId,
    name: definition?.name ?? tag.definitionId,
    japaneseName: definition?.japaneseName ?? '',
    acquiredAct: tag.acquiredAct,
    acquiredRound: tag.acquiredRound,
    consumedAct: currentAct,
    consumedRound: currentRound,
    triggerCondition: definition?.triggerCondition ?? 'instant',
    effectDescription: definition?.effect.description ?? '',
  }
}

// =============================================================================
// STORE
// =============================================================================

export const useOmenStore = create<OmenState>()((set, get) => ({
  // Initial state
  activeTags: [],
  consumedTags: [],
  pendingShopTags: [],
  pendingBossTags: [],
  roundsSkippedThisRun: 0,
  handsPlayedThisRun: 0,
  unusedDiscardsThisRun: 0,
  hasDoubleOmenActive: false,
  lockedSeason: null,
  noInterestRounds: 0,
  unlockedTagIds: [...DEFAULT_UNLOCKED_OMEN_TAGS],
  currentAct: 1,
  currentRound: 1,
  omenHistory: [],

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  addTag: (definitionId: string) => {
    const definition = ALL_OMEN_TAGS.find((t) => t.id === definitionId)
    if (!definition) return null

    const state = get()

    // Check if tag is unlocked
    if (!state.unlockedTagIds.includes(definitionId)) {
      return null
    }

    const tag: ActiveOmenTag = {
      id: generateTagId(definitionId),
      definitionId,
      acquiredAct: state.currentAct,
      acquiredRound: state.currentRound,
      roundsSkippedThisRun: state.roundsSkippedThisRun,
      isConsumed: false,
    }

    // Check for Double Omen duplication
    if (state.hasDoubleOmenActive && definition.id !== 'double_omen') {
      const duplicateTag: ActiveOmenTag = {
        ...tag,
        id: generateTagId(`${definitionId}-dup`),
      }

      // Route the duplicate tag
      const duplicateShopTags =
        definition.triggerCondition === 'nextShop'
          ? [...state.pendingShopTags, duplicateTag]
          : state.pendingShopTags
      const duplicateBossTags =
        definition.triggerCondition === 'nextBoss'
          ? [...state.pendingBossTags, duplicateTag]
          : state.pendingBossTags

      set({
        activeTags: [...state.activeTags, duplicateTag],
        pendingShopTags: duplicateShopTags,
        pendingBossTags: duplicateBossTags,
        hasDoubleOmenActive: false,
      })
    }

    // Handle Double Omen specially - activates immediately and sets flag
    if (definition.id === 'double_omen') {
      const historyEntry = createHistoryEntry(tag, state.currentAct, state.currentRound)
      set({
        hasDoubleOmenActive: true,
        consumedTags: [...state.consumedTags, { ...tag, isConsumed: true }],
        omenHistory: [...state.omenHistory, historyEntry],
      })
      return tag
    }

    // Route to appropriate queue based on trigger condition
    const newPendingShopTags =
      definition.triggerCondition === 'nextShop'
        ? [...state.pendingShopTags, tag]
        : state.pendingShopTags
    const newPendingBossTags =
      definition.triggerCondition === 'nextBoss'
        ? [...state.pendingBossTags, tag]
        : state.pendingBossTags

    set({
      activeTags: [...state.activeTags, tag],
      pendingShopTags: newPendingShopTags,
      pendingBossTags: newPendingBossTags,
    })

    return tag
  },

  awardRandomTag: () => {
    const state = get()
    const unlockedTags = ALL_OMEN_TAGS.filter((t) =>
      state.unlockedTagIds.includes(t.id)
    )

    if (unlockedTags.length === 0) return null

    const definition = getRandomWeightedOmenTag()
    if (!definition) return null

    return get().addTag(definition.id)
  },

  consumeTag: (tagId: string) => {
    const state = get()
    const tagIndex = state.activeTags.findIndex((t) => t.id === tagId)
    if (tagIndex === -1) return false

    const tag = state.activeTags[tagIndex]
    const consumedTag = { ...tag, isConsumed: true }
    const historyEntry = createHistoryEntry(tag, state.currentAct, state.currentRound)

    set({
      activeTags: state.activeTags.filter((t) => t.id !== tagId),
      consumedTags: [...state.consumedTags, consumedTag],
      pendingShopTags: state.pendingShopTags.filter((t) => t.id !== tagId),
      pendingBossTags: state.pendingBossTags.filter((t) => t.id !== tagId),
      omenHistory: [...state.omenHistory, historyEntry],
    })

    return true
  },

  consumeShopTags: () => {
    const state = get()
    const tags = [...state.pendingShopTags]
    const consumedTags = tags.map((t) => ({ ...t, isConsumed: true }))
    const historyEntries = tags.map((t) =>
      createHistoryEntry(t, state.currentAct, state.currentRound)
    )

    set({
      activeTags: state.activeTags.filter(
        (t) => !state.pendingShopTags.some((p) => p.id === t.id)
      ),
      consumedTags: [...state.consumedTags, ...consumedTags],
      pendingShopTags: [],
      omenHistory: [...state.omenHistory, ...historyEntries],
    })

    return tags
  },

  consumeBossTags: () => {
    const state = get()
    const tags = [...state.pendingBossTags]
    const consumedTags = tags.map((t) => ({ ...t, isConsumed: true }))
    const historyEntries = tags.map((t) =>
      createHistoryEntry(t, state.currentAct, state.currentRound)
    )

    set({
      activeTags: state.activeTags.filter(
        (t) => !state.pendingBossTags.some((p) => p.id === t.id)
      ),
      consumedTags: [...state.consumedTags, ...consumedTags],
      pendingBossTags: [],
      omenHistory: [...state.omenHistory, ...historyEntries],
    })

    return tags
  },

  copyNextTag: () => {
    set({ hasDoubleOmenActive: true })
  },

  // ==========================================================================
  // STATE UPDATES
  // ==========================================================================

  setCurrentPosition: (act: number, round: number) => {
    set({ currentAct: act, currentRound: round })
  },

  incrementRoundsSkipped: () => {
    set((state) => ({
      roundsSkippedThisRun: state.roundsSkippedThisRun + 1,
    }))
  },

  incrementHandsPlayed: () => {
    set((state) => ({
      handsPlayedThisRun: state.handsPlayedThisRun + 1,
    }))
  },

  addUnusedDiscards: (count: number) => {
    set((state) => ({
      unusedDiscardsThisRun: state.unusedDiscardsThisRun + count,
    }))
  },

  unlockTag: (tagId: string) => {
    const tag = ALL_OMEN_TAGS.find((t) => t.id === tagId)
    if (!tag) return false

    set((state) => ({
      unlockedTagIds: [...new Set([...state.unlockedTagIds, tagId])],
    }))
    return true
  },

  setLockedSeason: (seasonType: SeasonVariant, omenId: string) => {
    set({
      lockedSeason: {
        seasonType,
        sourceOmenId: omenId,
        isApplied: false,
      },
    })
  },

  applyLockedSeason: () => {
    const state = get()
    if (!state.lockedSeason || state.lockedSeason.isApplied) {
      return null
    }

    const seasonType = state.lockedSeason.seasonType

    set({
      lockedSeason: {
        ...state.lockedSeason,
        isApplied: true,
      },
    })

    // Clear after applied
    setTimeout(() => {
      set({ lockedSeason: null })
    }, 0)

    return seasonType
  },

  decrementNoInterestRounds: () => {
    set((state) => ({
      noInterestRounds: Math.max(0, state.noInterestRounds - 1),
    }))
  },

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  getTagDefinition: (definitionId: string) => {
    return ALL_OMEN_TAGS.find((t) => t.id === definitionId)
  },

  getActiveTags: () => {
    return get().activeTags.filter((t) => !t.isConsumed)
  },

  getInstantTags: () => {
    const state = get()
    return state.activeTags.filter((tag) => {
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      return def?.triggerCondition === 'instant' && !tag.isConsumed
    })
  },

  getPendingShopTags: () => {
    return [...get().pendingShopTags]
  },

  getPendingBossTags: () => {
    return [...get().pendingBossTags]
  },

  getTotalSkippedRounds: () => {
    return get().roundsSkippedThisRun
  },

  getOmenHistory: () => {
    return [...get().omenHistory]
  },

  hasActiveOmenWithEffect: (effectType: OmenEffectType) => {
    const state = get()
    return state.activeTags.some((tag) => {
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      return def?.effect.type === effectType && !tag.isConsumed
    })
  },

  // ==========================================================================
  // EFFECT CALCULATIONS
  // ==========================================================================

  calculateInstantGold: (tagId: string, currentGold: number) => {
    const state = get()
    const tag = state.activeTags.find((t) => t.id === tagId)
    if (!tag) return 0

    const definition = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    if (!definition || definition.effect.type !== 'goldBonus') return 0

    // Economy Omen doubles gold with max cap
    if (definition.id === 'economy_omen') {
      const bonus = Math.min(currentGold, definition.effect.maxValue ?? 40)
      return bonus
    }

    return definition.effect.value ?? 0
  },

  calculateScalingGold: (tagId: string) => {
    const state = get()
    const tag = state.activeTags.find((t) => t.id === tagId)
    if (!tag) return 0

    const definition = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    if (!definition || definition.effect.type !== 'economyScaling') return 0

    const value = definition.effect.value ?? 1
    const condition = definition.effect.scalingCondition

    switch (condition) {
      case 'handsPlayed':
        return value * state.handsPlayedThisRun
      case 'unusedDiscards':
        return value * state.unusedDiscardsThisRun
      case 'roundsSkipped':
        // Speed Omen: 5 Gold per skip, minimum 5
        return Math.max(5, value * state.roundsSkippedThisRun)
      default:
        return 0
    }
  },

  hasFreeCoupon: () => {
    const state = get()
    return state.pendingShopTags.some((tag) => {
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      return def?.id === 'coupon_omen'
    })
  },

  hasFreeRerolls: () => {
    const state = get()
    return state.pendingShopTags.some((tag) => {
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      return def?.id === 'd6_omen'
    })
  },

  getFreeDecreeInfo: () => {
    const state = get()
    const result: { rarity: DecreeRarity; edition?: TileEdition }[] = []

    for (const tag of state.pendingShopTags) {
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      if (!def) continue

      if (def.effect.type === 'freeDecree' && def.effect.rarity) {
        result.push({ rarity: def.effect.rarity })
      } else if (def.effect.type === 'freeEdition' && def.effect.edition) {
        result.push({ rarity: 'LocalEdict', edition: def.effect.edition })
      }
    }

    return result
  },

  getFreePacks: () => {
    const state = get()
    const result: { packType: PackType; isMega: boolean }[] = []

    // Check instant tags for free packs
    for (const tag of state.activeTags) {
      if (tag.isConsumed) continue
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      if (!def || def.effect.type !== 'freePack') continue

      // Ethereal (Void) pack is not Mega size
      const isMega = def.id !== 'ethereal_omen'
      result.push({ packType: def.effect.packType!, isMega })
    }

    return result
  },

  getPendingBossGold: () => {
    const state = get()
    let total = 0

    for (const tag of state.pendingBossTags) {
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      if (!def) continue

      if (def.effect.type === 'goldBonus' && def.id === 'investment_omen') {
        total += def.effect.value ?? 25
      }
    }

    return total
  },

  hasBossReroll: () => {
    const state = get()
    return state.pendingBossTags.some((tag) => {
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      return def?.id === 'boss_omen'
    })
  },

  isDoubleOmenActive: () => {
    return get().hasDoubleOmenActive
  },

  getHandSizeBonus: () => {
    const state = get()
    let bonus = 0

    for (const tag of state.pendingShopTags) {
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      if (def?.id === 'juggle_omen') {
        bonus += def.effect.value ?? 3
      }
    }

    return bonus
  },

  getCreatedDecreeCount: () => {
    const state = get()
    let count = 0

    for (const tag of state.activeTags) {
      if (tag.isConsumed) continue
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      if (def?.id === 'topup_omen') {
        count += def.effect.value ?? 2
      }
    }

    return count
  },

  getYakuUpgradeLevels: () => {
    const state = get()
    let levels = 0

    for (const tag of state.activeTags) {
      if (tag.isConsumed) continue
      const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
      if (def?.id === 'orbital_omen') {
        levels += def.effect.value ?? 3
      }
    }

    return levels
  },

  // ==========================================================================
  // RUN LIFECYCLE
  // ==========================================================================

  clearForNewRun: () => {
    set((state) => ({
      activeTags: [],
      consumedTags: [],
      pendingShopTags: [],
      pendingBossTags: [],
      roundsSkippedThisRun: 0,
      handsPlayedThisRun: 0,
      unusedDiscardsThisRun: 0,
      hasDoubleOmenActive: false,
      lockedSeason: null,
      noInterestRounds: 0,
      currentAct: 1,
      currentRound: 1,
      omenHistory: [],
      // Keep unlockedTagIds across runs
      unlockedTagIds: state.unlockedTagIds,
    }))
  },
}))

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Get total number of active omens
 */
export const selectActiveOmenCount = (state: OmenState): number => {
  return state.activeTags.filter((t) => !t.isConsumed).length
}

/**
 * Get total number of omens consumed this run
 */
export const selectConsumedOmenCount = (state: OmenState): number => {
  return state.consumedTags.length
}

/**
 * Get pending shop tag count
 */
export const selectPendingShopTagCount = (state: OmenState): number => {
  return state.pendingShopTags.length
}

/**
 * Get pending boss tag count
 */
export const selectPendingBossTagCount = (state: OmenState): number => {
  return state.pendingBossTags.length
}

/**
 * Check if any instant tags are pending
 */
export const selectHasInstantTags = (state: OmenState): boolean => {
  return state.activeTags.some((tag) => {
    const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    return def?.triggerCondition === 'instant' && !tag.isConsumed
  })
}

/**
 * Get rounds skipped this run
 */
export const selectRoundsSkipped = (state: OmenState): number => {
  return state.roundsSkippedThisRun
}

/**
 * Check if interest is blocked by trade-offs
 */
export const selectIsInterestBlocked = (state: OmenState): boolean => {
  return state.noInterestRounds > 0
}

/**
 * Get locked season if any
 */
export const selectLockedSeason = (state: OmenState): SeasonVariant | null => {
  if (state.lockedSeason && !state.lockedSeason.isApplied) {
    return state.lockedSeason.seasonType
  }
  return null
}

/**
 * Check if a specific tag type is pending
 */
export const selectHasPendingTagType = (
  state: OmenState,
  tagId: string
): boolean => {
  return (
    state.pendingShopTags.some((t) => t.definitionId === tagId) ||
    state.pendingBossTags.some((t) => t.definitionId === tagId)
  )
}

/**
 * Get all tag definitions with unlock status
 */
export const selectTagsWithUnlockStatus = (
  state: OmenState
): { definition: OmenTagDefinition; isUnlocked: boolean }[] => {
  return ALL_OMEN_TAGS.map((def) => ({
    definition: def,
    isUnlocked: state.unlockedTagIds.includes(def.id),
  }))
}

/**
 * Get shop discount from omens
 */
export const selectShopDiscountFromOmens = (state: OmenState): number => {
  // Coupon Omen makes initial items free (100% discount)
  const hasCoupon = state.pendingShopTags.some((tag) => {
    const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    return def?.id === 'coupon_omen'
  })

  return hasCoupon ? 100 : 0
}

/**
 * Get free rerolls from omens (D6 Omen makes rerolls start at 0)
 */
export const selectFreeRerollsFromOmens = (state: OmenState): number => {
  const hasD6 = state.pendingShopTags.some((tag) => {
    const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    return def?.id === 'd6_omen'
  })

  // D6 Omen resets reroll cost to 0 (infinite free rerolls until cost increases)
  return hasD6 ? 999 : 0
}

/**
 * Get bonus hand size for next round
 */
export const selectNextRoundHandSizeBonus = (state: OmenState): number => {
  let bonus = 0

  for (const tag of state.pendingShopTags) {
    const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    if (def?.id === 'juggle_omen') {
      bonus += def.effect.value ?? 3
    }
  }

  return bonus
}

/**
 * Get gold bonus from scaling omens
 */
export const selectGoldBonusFromOmens = (state: OmenState): number => {
  let gold = 0

  for (const tag of state.activeTags) {
    if (tag.isConsumed) continue
    const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    if (!def || def.effect.type !== 'economyScaling') continue

    const value = def.effect.value ?? 1
    const condition = def.effect.scalingCondition

    switch (condition) {
      case 'handsPlayed':
        gold += value * state.handsPlayedThisRun
        break
      case 'unusedDiscards':
        gold += value * state.unusedDiscardsThisRun
        break
      case 'roundsSkipped':
        gold += Math.max(5, value * state.roundsSkippedThisRun)
        break
    }
  }

  return gold
}

/**
 * Get guaranteed shop items from active omens
 */
export const selectGuaranteedShopItems = (
  state: OmenState
): { itemType: string; omenId: string }[] => {
  const items: { itemType: string; omenId: string }[] = []

  for (const tag of state.activeTags) {
    if (tag.isConsumed) continue
    const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    if (!def || def.effect.type !== 'guaranteedItem') continue

    if (def.effect.itemType) {
      items.push({
        itemType: def.effect.itemType,
        omenId: tag.id,
      })
    }
  }

  return items
}

/**
 * Get next decree edition from active omens
 */
export const selectNextDecreeEdition = (
  state: OmenState
): { editionType: string; omenId: string } | null => {
  for (const tag of state.activeTags) {
    if (tag.isConsumed) continue
    const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    if (!def || def.effect.type !== 'decreeEdition') continue

    if (def.effect.editionType) {
      return {
        editionType: def.effect.editionType,
        omenId: tag.id,
      }
    }
  }

  return null
}

/**
 * Get draw bonus for next round from active omens
 */
export const selectNextRoundDrawBonus = (state: OmenState): number => {
  let bonus = 0

  for (const tag of state.activeTags) {
    if (tag.isConsumed) continue
    const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    if (!def || def.effect.type !== 'drawBonus') continue

    bonus += def.effect.value ?? 0
  }

  return bonus
}

/**
 * Get discard bonus for next round from active omens
 */
export const selectNextRoundDiscardBonus = (state: OmenState): number => {
  let bonus = 0

  for (const tag of state.activeTags) {
    if (tag.isConsumed) continue
    const def = ALL_OMEN_TAGS.find((t) => t.id === tag.definitionId)
    if (!def || def.effect.type !== 'discardBonus') continue

    bonus += def.effect.value ?? 0
  }

  return bonus
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate unique omen ID
 */
let omenIdCounter = 0
export function generateOmenId(): string {
  return `omen-${++omenIdCounter}-${Date.now()}`
}
