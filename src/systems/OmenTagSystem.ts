/**
 * Omen Tag System for Tensho Mahjong Roguelike
 *
 * Omen Tags (兆標) are Balatro's Tags analog - one-time destiny modifiers
 * that trigger when earned (by skipping rounds) or affect the next shop/boss.
 *
 * Tags are earned by skipping Small or Large rounds before the Boss round.
 * Some tags trigger instantly, others affect the next shop or boss encounter.
 */

import { DecreeRarity, PackType } from './types'

// =============================================================================
// OMEN TAG TYPES
// =============================================================================

/**
 * Types of editions that can be applied via Omen Tags
 */
export type TileEdition = 'Foil' | 'Holographic' | 'Prismatic' | 'Negative'

/**
 * Trigger condition for when an Omen Tag activates
 */
export type OmenTriggerCondition = 'instant' | 'nextShop' | 'nextBoss' | 'endOfAct'

/**
 * Types of effects an Omen Tag can have
 */
export type OmenEffectType =
  | 'freeDecree' // Get a free decree in next shop
  | 'freeEdition' // Get a decree with a specific edition
  | 'freePack' // Open a free Mega pack immediately
  | 'goldBonus' // Gain gold (immediate or after boss)
  | 'shopModifier' // Modify next shop (free items, free rerolls, etc.)
  | 'upgradeYaku' // Upgrade a random yaku by levels
  | 'copyTag' // Copy the next tag earned
  | 'createDecrees' // Create random decrees immediately
  | 'handSizeBonus' // Temporary hand size increase
  | 'economyScaling' // Gold based on run stats

/**
 * Omen Tag effect definition
 */
export interface OmenEffect {
  type: OmenEffectType
  rarity?: DecreeRarity // For freeDecree effects
  edition?: TileEdition // For freeEdition effects
  packType?: PackType // For freePack effects
  value?: number // Numeric value (gold amount, upgrade levels, etc.)
  maxValue?: number // Maximum value for scaled effects
  description: string
  scalingCondition?: 'roundsSkipped' | 'handsPlayed' | 'unusedDiscards' // For economy scaling
}

/**
 * Omen Tag definition
 */
export interface OmenTagDefinition {
  id: string
  name: string
  japaneseName: string
  effect: OmenEffect
  triggerCondition: OmenTriggerCondition
  unlockCondition?: string // Optional unlock condition description
}

/**
 * Active Omen Tag instance
 */
export interface ActiveOmenTag {
  id: string // Unique instance ID
  definitionId: string // Reference to OmenTagDefinition
  acquiredAct: number
  acquiredRound: number
  roundsSkippedThisRun: number // For Speed Omen calculations
  isConsumed: boolean
}

// =============================================================================
// OMEN TAG DEFINITIONS (24 TOTAL FROM ITEM_LIBRARIES.md A7)
// =============================================================================

/**
 * Uncommon Omen - Free Uncommon Decree in next shop
 */
export const UNCOMMON_OMEN: OmenTagDefinition = {
  id: 'uncommon_omen',
  name: 'Uncommon Omen',
  japaneseName: '珍品の兆',
  effect: {
    type: 'freeDecree',
    rarity: 'RegionalMandate', // Uncommon
    description: 'Next shop has a free Uncommon Decree',
  },
  triggerCondition: 'nextShop',
}

/**
 * Rare Omen - Free Rare Decree in next shop
 */
export const RARE_OMEN: OmenTagDefinition = {
  id: 'rare_omen',
  name: 'Rare Omen',
  japaneseName: '稀少の兆',
  effect: {
    type: 'freeDecree',
    rarity: 'ImperialDecree', // Rare
    description: 'Next shop has a free Rare Decree',
  },
  triggerCondition: 'nextShop',
  unlockCondition: 'Discover Blueprint Decree',
}

/**
 * Negative Omen - Free Negative edition Decree
 */
export const NEGATIVE_OMEN: OmenTagDefinition = {
  id: 'negative_omen',
  name: 'Negative Omen',
  japaneseName: '負極の兆',
  effect: {
    type: 'freeEdition',
    edition: 'Negative',
    description: 'Next base Decree becomes Negative and free (+1 Decree slot)',
  },
  triggerCondition: 'nextShop',
}

/**
 * Foil Omen - Free Foil edition Decree
 */
export const FOIL_OMEN: OmenTagDefinition = {
  id: 'foil_omen',
  name: 'Foil Omen',
  japaneseName: '箔の兆',
  effect: {
    type: 'freeEdition',
    edition: 'Foil',
    description: 'Next base Decree becomes Foil and free (+50 Chips)',
  },
  triggerCondition: 'nextShop',
}

/**
 * Holographic Omen - Free Holographic edition Decree
 */
export const HOLOGRAPHIC_OMEN: OmenTagDefinition = {
  id: 'holographic_omen',
  name: 'Holographic Omen',
  japaneseName: '光沢の兆',
  effect: {
    type: 'freeEdition',
    edition: 'Holographic',
    description: 'Next base Decree becomes Holographic and free (+10 Mult)',
  },
  triggerCondition: 'nextShop',
}

/**
 * Prismatic Omen - Free Prismatic edition Decree
 */
export const PRISMATIC_OMEN: OmenTagDefinition = {
  id: 'prismatic_omen',
  name: 'Prismatic Omen',
  japaneseName: '虹彩の兆',
  effect: {
    type: 'freeEdition',
    edition: 'Prismatic',
    description: 'Next base Decree becomes Prismatic and free (x1.5 Mult)',
  },
  triggerCondition: 'nextShop',
}

/**
 * Investment Omen - Gain gold after defeating next Boss
 */
export const INVESTMENT_OMEN: OmenTagDefinition = {
  id: 'investment_omen',
  name: 'Investment Omen',
  japaneseName: '投資の兆',
  effect: {
    type: 'goldBonus',
    value: 25,
    description: 'Gain 25 Gold after defeating next Boss Mandate (stackable)',
  },
  triggerCondition: 'nextBoss',
}

/**
 * Charter Omen - Adds an Imperial Charter to next shop
 */
export const CHARTER_OMEN: OmenTagDefinition = {
  id: 'charter_omen',
  name: 'Charter Omen',
  japaneseName: '許可の兆',
  effect: {
    type: 'shopModifier',
    description: 'Adds an Imperial Charter to next shop (can stack)',
  },
  triggerCondition: 'nextShop',
}

/**
 * Boss Omen - Rerolls the next Boss Mandate
 */
export const BOSS_OMEN: OmenTagDefinition = {
  id: 'boss_omen',
  name: 'Boss Omen',
  japaneseName: '親分の兆',
  effect: {
    type: 'shopModifier',
    description: 'Rerolls the next Boss Mandate for free',
  },
  triggerCondition: 'nextBoss',
}

/**
 * Standard Omen - Open free Mega Tile Pack immediately
 */
export const STANDARD_OMEN: OmenTagDefinition = {
  id: 'standard_omen',
  name: 'Standard Omen',
  japaneseName: '標準の兆',
  effect: {
    type: 'freePack',
    packType: 'Tile',
    description: 'Open a free Mega Standard (Tile) Pack immediately',
  },
  triggerCondition: 'instant',
}

/**
 * Charm Omen - Open free Mega Arcana Pack immediately
 */
export const CHARM_OMEN: OmenTagDefinition = {
  id: 'charm_omen',
  name: 'Charm Omen',
  japaneseName: '魅力の兆',
  effect: {
    type: 'freePack',
    packType: 'Arcana',
    description: 'Open a free Mega Arcana Pack immediately',
  },
  triggerCondition: 'instant',
}

/**
 * Meteor Omen - Open free Mega Celestial Pack immediately
 */
export const METEOR_OMEN: OmenTagDefinition = {
  id: 'meteor_omen',
  name: 'Meteor Omen',
  japaneseName: '流星の兆',
  effect: {
    type: 'freePack',
    packType: 'Celestial',
    description: 'Open a free Mega Celestial Pack immediately',
  },
  triggerCondition: 'instant',
}

/**
 * Buffoon Omen - Open free Mega Decree Pack immediately
 */
export const BUFFOON_OMEN: OmenTagDefinition = {
  id: 'buffoon_omen',
  name: 'Buffoon Omen',
  japaneseName: '道化の兆',
  effect: {
    type: 'freePack',
    packType: 'Decree',
    description: 'Open a free Mega Decree Pack immediately',
  },
  triggerCondition: 'instant',
}

/**
 * Handy Omen - Gain gold per hand played this run
 */
export const HANDY_OMEN: OmenTagDefinition = {
  id: 'handy_omen',
  name: 'Handy Omen',
  japaneseName: '巧手の兆',
  effect: {
    type: 'economyScaling',
    value: 1,
    scalingCondition: 'handsPlayed',
    description: 'Gain 1 Gold per hand played this run',
  },
  triggerCondition: 'instant',
}

/**
 * Garbage Omen - Gain gold per unused discard this run
 */
export const GARBAGE_OMEN: OmenTagDefinition = {
  id: 'garbage_omen',
  name: 'Garbage Omen',
  japaneseName: '不用の兆',
  effect: {
    type: 'economyScaling',
    value: 1,
    scalingCondition: 'unusedDiscards',
    description: 'Gain 1 Gold per unused discard this run',
  },
  triggerCondition: 'instant',
}

/**
 * Ethereal Omen - Open free Void Pack immediately (not Mega)
 */
export const ETHEREAL_OMEN: OmenTagDefinition = {
  id: 'ethereal_omen',
  name: 'Ethereal Omen',
  japaneseName: '幽玄の兆',
  effect: {
    type: 'freePack',
    packType: 'Void',
    description: 'Open a free Spectral (Void) Pack immediately (not Mega size)',
  },
  triggerCondition: 'instant',
}

/**
 * Coupon Omen - All initial shop items free
 */
export const COUPON_OMEN: OmenTagDefinition = {
  id: 'coupon_omen',
  name: 'Coupon Omen',
  japaneseName: '割引の兆',
  effect: {
    type: 'shopModifier',
    description: 'Next shop: all initial items are free (one-time)',
  },
  triggerCondition: 'nextShop',
}

/**
 * Double Omen - Copies the next tag earned
 */
export const DOUBLE_OMEN: OmenTagDefinition = {
  id: 'double_omen',
  name: 'Double Omen',
  japaneseName: '双子の兆',
  effect: {
    type: 'copyTag',
    description: 'Copies the next Tag selected (powerful combo potential)',
  },
  triggerCondition: 'instant',
}

/**
 * Juggle Omen - Temporary hand size increase
 */
export const JUGGLE_OMEN: OmenTagDefinition = {
  id: 'juggle_omen',
  name: 'Juggle Omen',
  japaneseName: '手捌の兆',
  effect: {
    type: 'handSizeBonus',
    value: 3,
    description: '+3 Hand Size for next round only (temporary)',
  },
  triggerCondition: 'nextShop', // Applies at start of next gameplay
}

/**
 * D6 Omen - Free rerolls in next shop
 */
export const D6_OMEN: OmenTagDefinition = {
  id: 'd6_omen',
  name: 'D6 Omen',
  japaneseName: '骰子の兆',
  effect: {
    type: 'shopModifier',
    description: 'Next shop: Rerolls start at 0 Gold (still increases)',
  },
  triggerCondition: 'nextShop',
}

/**
 * Top-up Omen - Create Common Decrees immediately
 */
export const TOPUP_OMEN: OmenTagDefinition = {
  id: 'topup_omen',
  name: 'Top-up Omen',
  japaneseName: '補充の兆',
  effect: {
    type: 'createDecrees',
    rarity: 'LocalEdict', // Common
    value: 2,
    description: 'Create up to 2 Common Decrees immediately (if room)',
  },
  triggerCondition: 'instant',
}

/**
 * Speed Omen - Gain gold per skipped round this run
 */
export const SPEED_OMEN: OmenTagDefinition = {
  id: 'speed_omen',
  name: 'Speed Omen',
  japaneseName: '疾走の兆',
  effect: {
    type: 'economyScaling',
    value: 5,
    scalingCondition: 'roundsSkipped',
    description: 'Gain 5 Gold per skipped Mandate this run (minimum 5 Gold)',
  },
  triggerCondition: 'instant',
}

/**
 * Orbital Omen - Upgrades a random Yaku by 3 levels
 */
export const ORBITAL_OMEN: OmenTagDefinition = {
  id: 'orbital_omen',
  name: 'Orbital Omen',
  japaneseName: '軌道の兆',
  effect: {
    type: 'upgradeYaku',
    value: 3,
    description: 'Upgrades a random Yaku by 3 levels (powerful)',
  },
  triggerCondition: 'instant',
}

/**
 * Economy Omen - Doubles your gold (max +40)
 */
export const ECONOMY_OMEN: OmenTagDefinition = {
  id: 'economy_omen',
  name: 'Economy Omen',
  japaneseName: '経済の兆',
  effect: {
    type: 'goldBonus',
    value: 2, // Multiplier (doubles)
    maxValue: 40,
    description: 'Doubles your gold (max +40 Gold, instant)',
  },
  triggerCondition: 'instant',
}

// =============================================================================
// OMEN TAG COLLECTIONS
// =============================================================================

/**
 * All omen tag definitions
 */
export const ALL_OMEN_TAGS: OmenTagDefinition[] = [
  UNCOMMON_OMEN,
  RARE_OMEN,
  NEGATIVE_OMEN,
  FOIL_OMEN,
  HOLOGRAPHIC_OMEN,
  PRISMATIC_OMEN,
  INVESTMENT_OMEN,
  CHARTER_OMEN,
  BOSS_OMEN,
  STANDARD_OMEN,
  CHARM_OMEN,
  METEOR_OMEN,
  BUFFOON_OMEN,
  HANDY_OMEN,
  GARBAGE_OMEN,
  ETHEREAL_OMEN,
  COUPON_OMEN,
  DOUBLE_OMEN,
  JUGGLE_OMEN,
  D6_OMEN,
  TOPUP_OMEN,
  SPEED_OMEN,
  ORBITAL_OMEN,
  ECONOMY_OMEN,
]

/**
 * Instant-trigger omen tags
 */
export const INSTANT_OMEN_TAGS: OmenTagDefinition[] = ALL_OMEN_TAGS.filter(
  (tag) => tag.triggerCondition === 'instant'
)

/**
 * Shop-affecting omen tags
 */
export const SHOP_OMEN_TAGS: OmenTagDefinition[] = ALL_OMEN_TAGS.filter(
  (tag) => tag.triggerCondition === 'nextShop'
)

/**
 * Boss-affecting omen tags
 */
export const BOSS_OMEN_TAGS: OmenTagDefinition[] = ALL_OMEN_TAGS.filter(
  (tag) => tag.triggerCondition === 'nextBoss'
)

/**
 * Default unlocked omen tags (available from start)
 */
export const DEFAULT_UNLOCKED_OMEN_TAGS: string[] = ALL_OMEN_TAGS.filter(
  (tag) => !tag.unlockCondition
).map((tag) => tag.id)

// =============================================================================
// OMEN TAG SYSTEM CLASS
// =============================================================================

/**
 * Manages omen tag acquisition, triggering, and effects
 */
export class OmenTagSystem {
  private activeTags: ActiveOmenTag[] = []
  private consumedTags: ActiveOmenTag[] = []
  private pendingShopTags: ActiveOmenTag[] = []
  private pendingBossTags: ActiveOmenTag[] = []
  private roundsSkippedThisRun: number = 0
  private handsPlayedThisRun: number = 0
  private unusedDiscardsThisRun: number = 0
  private hasDoubleOmenActive: boolean = false
  private unlockedTagIds: Set<string> = new Set(DEFAULT_UNLOCKED_OMEN_TAGS)
  private currentAct: number = 1
  private currentRound: number = 1

  constructor() {
    this.clear()
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /**
   * Clear all active tags (for new run)
   */
  clear(): void {
    this.activeTags = []
    this.consumedTags = []
    this.pendingShopTags = []
    this.pendingBossTags = []
    this.roundsSkippedThisRun = 0
    this.handsPlayedThisRun = 0
    this.unusedDiscardsThisRun = 0
    this.hasDoubleOmenActive = false
    this.currentAct = 1
    this.currentRound = 1
  }

  /**
   * Set current act/round for tag tracking
   */
  setCurrentPosition(act: number, round: number): void {
    this.currentAct = act
    this.currentRound = round
  }

  /**
   * Increment rounds skipped counter
   */
  incrementRoundsSkipped(): void {
    this.roundsSkippedThisRun++
  }

  /**
   * Increment hands played counter
   */
  incrementHandsPlayed(): void {
    this.handsPlayedThisRun++
  }

  /**
   * Add unused discards to counter
   */
  addUnusedDiscards(count: number): void {
    this.unusedDiscardsThisRun += count
  }

  /**
   * Unlock a tag by ID
   */
  unlockTag(tagId: string): boolean {
    const tag = ALL_OMEN_TAGS.find((t) => t.id === tagId)
    if (!tag) return false

    this.unlockedTagIds.add(tagId)
    return true
  }

  /**
   * Check if a tag is unlocked
   */
  isTagUnlocked(tagId: string): boolean {
    return this.unlockedTagIds.has(tagId)
  }

  // ===========================================================================
  // TAG ACQUISITION
  // ===========================================================================

  /**
   * Award a random omen tag (called when skipping a round)
   */
  awardRandomTag(): ActiveOmenTag | null {
    const unlockedTags = ALL_OMEN_TAGS.filter((t) => this.isTagUnlocked(t.id))

    if (unlockedTags.length === 0) return null

    const definition = unlockedTags[Math.floor(Math.random() * unlockedTags.length)]
    return this.addTag(definition.id)
  }

  /**
   * Add a specific tag by definition ID
   */
  addTag(definitionId: string): ActiveOmenTag | null {
    const definition = ALL_OMEN_TAGS.find((t) => t.id === definitionId)
    if (!definition) return null

    const tag: ActiveOmenTag = {
      id: `omen-${definitionId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      definitionId,
      acquiredAct: this.currentAct,
      acquiredRound: this.currentRound,
      roundsSkippedThisRun: this.roundsSkippedThisRun,
      isConsumed: false,
    }

    // Check for Double Omen duplication
    if (this.hasDoubleOmenActive && definition.id !== 'double_omen') {
      this.hasDoubleOmenActive = false
      // Add a duplicate of this tag
      const duplicateTag: ActiveOmenTag = {
        ...tag,
        id: `omen-${definitionId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-dup`,
      }
      this.activeTags.push(duplicateTag)
      this.routeTag(duplicateTag, definition)
    }

    // Handle Double Omen specially - it activates immediately
    if (definition.id === 'double_omen') {
      this.hasDoubleOmenActive = true
      tag.isConsumed = true
      this.consumedTags.push(tag)
      return tag
    }

    this.activeTags.push(tag)
    this.routeTag(tag, definition)

    return tag
  }

  /**
   * Route a tag to the appropriate pending queue or trigger immediately
   */
  private routeTag(tag: ActiveOmenTag, definition: OmenTagDefinition): void {
    switch (definition.triggerCondition) {
      case 'instant':
        // Instant tags are processed immediately by the caller
        break
      case 'nextShop':
        this.pendingShopTags.push(tag)
        break
      case 'nextBoss':
        this.pendingBossTags.push(tag)
        break
      case 'endOfAct':
        // Handled when act ends
        break
    }
  }

  // ===========================================================================
  // TAG CONSUMPTION
  // ===========================================================================

  /**
   * Get all pending shop tags and mark them as consumed
   */
  consumeShopTags(): ActiveOmenTag[] {
    const tags = [...this.pendingShopTags]
    for (const tag of tags) {
      tag.isConsumed = true
      this.consumedTags.push(tag)
    }
    this.pendingShopTags = []
    return tags
  }

  /**
   * Get all pending boss tags and mark them as consumed
   */
  consumeBossTags(): ActiveOmenTag[] {
    const tags = [...this.pendingBossTags]
    for (const tag of tags) {
      tag.isConsumed = true
      this.consumedTags.push(tag)
    }
    this.pendingBossTags = []
    return tags
  }

  /**
   * Consume a specific tag by ID
   */
  consumeTag(tagId: string): boolean {
    const tagIndex = this.activeTags.findIndex((t) => t.id === tagId)
    if (tagIndex === -1) return false

    const tag = this.activeTags[tagIndex]
    tag.isConsumed = true
    this.consumedTags.push(tag)
    this.activeTags.splice(tagIndex, 1)

    // Also remove from pending queues
    this.pendingShopTags = this.pendingShopTags.filter((t) => t.id !== tagId)
    this.pendingBossTags = this.pendingBossTags.filter((t) => t.id !== tagId)

    return true
  }

  // ===========================================================================
  // EFFECT CALCULATIONS
  // ===========================================================================

  /**
   * Calculate gold from instant gold effects
   */
  calculateInstantGold(tagId: string, currentGold: number): number {
    const tag = this.activeTags.find((t) => t.id === tagId)
    if (!tag) return 0

    const definition = this.getTagDefinition(tag.definitionId)
    if (!definition || definition.effect.type !== 'goldBonus') return 0

    // Economy Omen doubles gold with max cap
    if (definition.id === 'economy_omen') {
      const bonus = Math.min(currentGold, definition.effect.maxValue ?? 40)
      return bonus
    }

    return definition.effect.value ?? 0
  }

  /**
   * Calculate gold from economy scaling effects
   */
  calculateScalingGold(tagId: string): number {
    const tag = this.activeTags.find((t) => t.id === tagId)
    if (!tag) return 0

    const definition = this.getTagDefinition(tag.definitionId)
    if (!definition || definition.effect.type !== 'economyScaling') return 0

    const value = definition.effect.value ?? 1
    const condition = definition.effect.scalingCondition

    switch (condition) {
      case 'handsPlayed':
        return value * this.handsPlayedThisRun
      case 'unusedDiscards':
        return value * this.unusedDiscardsThisRun
      case 'roundsSkipped':
        // Speed Omen: 5 Gold per skip, minimum 5
        return Math.max(5, value * this.roundsSkippedThisRun)
      default:
        return 0
    }
  }

  /**
   * Check if any pending shop tags make items free
   */
  hasFreeCoupon(): boolean {
    return this.pendingShopTags.some((tag) => {
      const def = this.getTagDefinition(tag.definitionId)
      return def?.id === 'coupon_omen'
    })
  }

  /**
   * Check if any pending shop tags give free rerolls
   */
  hasFreeRerolls(): boolean {
    return this.pendingShopTags.some((tag) => {
      const def = this.getTagDefinition(tag.definitionId)
      return def?.id === 'd6_omen'
    })
  }

  /**
   * Get free decree info from pending shop tags
   */
  getFreeDecreeInfo(): { rarity: DecreeRarity; edition?: TileEdition }[] {
    const result: { rarity: DecreeRarity; edition?: TileEdition }[] = []

    for (const tag of this.pendingShopTags) {
      const def = this.getTagDefinition(tag.definitionId)
      if (!def) continue

      if (def.effect.type === 'freeDecree' && def.effect.rarity) {
        result.push({ rarity: def.effect.rarity })
      } else if (def.effect.type === 'freeEdition' && def.effect.edition) {
        result.push({ rarity: 'LocalEdict', edition: def.effect.edition })
      }
    }

    return result
  }

  /**
   * Get pending boss tag investment gold total
   */
  getPendingBossGold(): number {
    let total = 0

    for (const tag of this.pendingBossTags) {
      const def = this.getTagDefinition(tag.definitionId)
      if (!def) continue

      if (def.effect.type === 'goldBonus' && def.id === 'investment_omen') {
        total += def.effect.value ?? 25
      }
    }

    return total
  }

  /**
   * Check if boss mandate should be rerolled
   */
  hasBossReroll(): boolean {
    return this.pendingBossTags.some((tag) => {
      const def = this.getTagDefinition(tag.definitionId)
      return def?.id === 'boss_omen'
    })
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  /**
   * Get a tag definition by ID
   */
  getTagDefinition(definitionId: string): OmenTagDefinition | undefined {
    return ALL_OMEN_TAGS.find((t) => t.id === definitionId)
  }

  /**
   * Get all active (unconsumed) tags
   */
  getActiveTags(): ActiveOmenTag[] {
    return [...this.activeTags.filter((t) => !t.isConsumed)]
  }

  /**
   * Get all pending shop tags
   */
  getPendingShopTags(): ActiveOmenTag[] {
    return [...this.pendingShopTags]
  }

  /**
   * Get all pending boss tags
   */
  getPendingBossTags(): ActiveOmenTag[] {
    return [...this.pendingBossTags]
  }

  /**
   * Get instant tags from active tags
   */
  getInstantTags(): ActiveOmenTag[] {
    return this.activeTags.filter((tag) => {
      const def = this.getTagDefinition(tag.definitionId)
      return def?.triggerCondition === 'instant' && !tag.isConsumed
    })
  }

  /**
   * Get total rounds skipped this run
   */
  getRoundsSkippedThisRun(): number {
    return this.roundsSkippedThisRun
  }

  /**
   * Get all consumed tags (for history)
   */
  getConsumedTags(): ActiveOmenTag[] {
    return [...this.consumedTags]
  }

  /**
   * Get unlocked tag IDs
   */
  getUnlockedTagIds(): string[] {
    return Array.from(this.unlockedTagIds)
  }

  /**
   * Check if Double Omen is active
   */
  isDoubleOmenActive(): boolean {
    return this.hasDoubleOmenActive
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Serialize omen tag system state
   */
  toState(): {
    activeTags: ActiveOmenTag[]
    consumedTags: ActiveOmenTag[]
    pendingShopTags: ActiveOmenTag[]
    pendingBossTags: ActiveOmenTag[]
    roundsSkippedThisRun: number
    handsPlayedThisRun: number
    unusedDiscardsThisRun: number
    hasDoubleOmenActive: boolean
    unlockedTagIds: string[]
    currentAct: number
    currentRound: number
  } {
    return {
      activeTags: [...this.activeTags],
      consumedTags: [...this.consumedTags],
      pendingShopTags: [...this.pendingShopTags],
      pendingBossTags: [...this.pendingBossTags],
      roundsSkippedThisRun: this.roundsSkippedThisRun,
      handsPlayedThisRun: this.handsPlayedThisRun,
      unusedDiscardsThisRun: this.unusedDiscardsThisRun,
      hasDoubleOmenActive: this.hasDoubleOmenActive,
      unlockedTagIds: Array.from(this.unlockedTagIds),
      currentAct: this.currentAct,
      currentRound: this.currentRound,
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    activeTags: ActiveOmenTag[]
    consumedTags: ActiveOmenTag[]
    pendingShopTags: ActiveOmenTag[]
    pendingBossTags: ActiveOmenTag[]
    roundsSkippedThisRun: number
    handsPlayedThisRun: number
    unusedDiscardsThisRun: number
    hasDoubleOmenActive: boolean
    unlockedTagIds: string[]
    currentAct: number
    currentRound: number
  }): OmenTagSystem {
    const system = new OmenTagSystem()
    system.activeTags = [...state.activeTags]
    system.consumedTags = [...state.consumedTags]
    system.pendingShopTags = [...state.pendingShopTags]
    system.pendingBossTags = [...state.pendingBossTags]
    system.roundsSkippedThisRun = state.roundsSkippedThisRun
    system.handsPlayedThisRun = state.handsPlayedThisRun
    system.unusedDiscardsThisRun = state.unusedDiscardsThisRun
    system.hasDoubleOmenActive = state.hasDoubleOmenActive
    system.unlockedTagIds = new Set(state.unlockedTagIds)
    system.currentAct = state.currentAct
    system.currentRound = state.currentRound
    return system
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get omen tag Japanese name
 */
export function getOmenTagJapaneseName(tagId: string): string {
  const tag = ALL_OMEN_TAGS.find((t) => t.id === tagId)
  return tag?.japaneseName ?? tagId
}

/**
 * Get omen tag display name
 */
export function getOmenTagDisplayName(tagId: string): string {
  const tag = ALL_OMEN_TAGS.find((t) => t.id === tagId)
  return tag?.name ?? tagId
}

/**
 * Get omen tag effect description
 */
export function getOmenTagDescription(tagId: string): string {
  const tag = ALL_OMEN_TAGS.find((t) => t.id === tagId)
  return tag?.effect.description ?? ''
}

/**
 * Get tags by effect type
 */
export function getTagsByEffectType(effectType: OmenEffectType): OmenTagDefinition[] {
  return ALL_OMEN_TAGS.filter((t) => t.effect.type === effectType)
}

/**
 * Get random weighted omen tag (common tags more likely)
 */
export function getRandomWeightedOmenTag(excludeIds: string[] = []): OmenTagDefinition | null {
  // Weight tags by power level (more common effects are more likely)
  const weights: Record<string, number> = {
    uncommon_omen: 15,
    rare_omen: 5,
    negative_omen: 3,
    foil_omen: 10,
    holographic_omen: 7,
    prismatic_omen: 4,
    investment_omen: 12,
    charter_omen: 8,
    boss_omen: 6,
    standard_omen: 12,
    charm_omen: 10,
    meteor_omen: 10,
    buffoon_omen: 8,
    handy_omen: 10,
    garbage_omen: 10,
    ethereal_omen: 5,
    coupon_omen: 4,
    double_omen: 3,
    juggle_omen: 10,
    d6_omen: 8,
    topup_omen: 12,
    speed_omen: 6,
    orbital_omen: 4,
    economy_omen: 6,
  }

  const available = ALL_OMEN_TAGS.filter((t) => !excludeIds.includes(t.id))
  if (available.length === 0) return null

  const totalWeight = available.reduce((sum, t) => sum + (weights[t.id] ?? 10), 0)
  let random = Math.random() * totalWeight

  for (const tag of available) {
    random -= weights[tag.id] ?? 10
    if (random <= 0) {
      return tag
    }
  }

  return available[0]
}
