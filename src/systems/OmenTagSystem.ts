/**
 * Omen Tag System for Tensho Mahjong Roguelike
 *
 * Manages the Omen Tags system:
 * - Award Omen Tags when skipping Small/Large Rounds
 * - One-time destiny modifiers that trigger once then vanish
 * - Can lock next Season type as trade-off
 *
 * Based on ARCHITECTURE.MD Section 7 (Omen Tags) and Section 20 (Skipping Rounds).
 *
 * Skip Mechanics:
 * - Small Round and Large Round can be skipped before Boss Round
 * - Skipping grants an Omen Tag
 * - Skipping forfeits: shop access, scoring opportunity, scaling triggers, interest accrual
 *
 * When to Skip (strategy considerations):
 * - Perishable Decrees need preservation
 * - Specific Omen Tags are valuable
 * - Build doesn't need additional scaling
 * - Wall composition is unfavorable
 *
 * Anti-Synergies:
 * - High Stakes runs where economy is critical
 * - Scaling Decrees that need more rounds
 */

import type { RoundType, SeasonVariant } from './types'
import {
  type OmenDefinition,
  type OmenCategory,
  type OmenRarity,
  type OmenEffectType,
  getRandomOmenForRound,
  SMALL_ROUND_OMENS,
  LARGE_ROUND_OMENS,
} from '../config/omenDefinitions'
import {
  useOmenStore,
  type ActiveOmenTag,
  selectShopDiscountFromOmens,
  selectFreeRerollsFromOmens,
  selectGuaranteedShopItems,
  selectNextDecreeEdition,
  selectNextRoundDrawBonus,
  selectNextRoundDiscardBonus,
  selectNextRoundHandSizeBonus,
  selectGoldBonusFromOmens,
} from '../stores/omenStore'

// Re-export types that may be needed
export type OmenTrigger = 'OnNextShop' | 'OnNextRound' | 'OnNextHand' | 'OnNextVoidScript' | 'OnAcquire' | 'Passive' | 'OnRoundSkip'

// Type alias for backward compatibility
export type ActiveOmen = ActiveOmenTag & { definition: OmenDefinition }

export interface OmenHistoryEntry {
  id: string
  definitionId: string
  name: string
  japaneseName: string
  acquiredAct: number
  acquiredRound: number
  consumedAct: number
  consumedRound: number
  triggerCondition: string
  effectDescription: string
}

// =============================================================================
// OMEN TAG SYSTEM CLASS
// =============================================================================

/**
 * Manages omen tag acquisition, triggering, and effects
 */
export class OmenTagSystem {
  private currentAct: number = 1
  private currentRound: number = 0
  private skippedRoundsThisAct: number = 0
  private totalSkippedRounds: number = 0
  private lockedSeasonType: SeasonVariant | null = null
  private pendingOmens: OmenDefinition[] = []
  private triggeredOmensThisRound: string[] = []

  constructor() {
    this.reset()
  }

  /**
   * Reset the system for a new run
   */
  reset(): void {
    this.currentAct = 1
    this.currentRound = 0
    this.skippedRoundsThisAct = 0
    this.totalSkippedRounds = 0
    this.lockedSeasonType = null
    this.pendingOmens = []
    this.triggeredOmensThisRound = []
    useOmenStore.getState().clearForNewRun()
  }

  /**
   * Set the current act and round
   */
  setRoundInfo(act: number, round: number): void {
    this.currentAct = act
    this.currentRound = round

    // Update store
    const store = useOmenStore.getState()
    store.setRoundInfo(round, act)
  }

  /**
   * Handle round skip - awards an omen tag
   * @param roundType The type of round being skipped
   * @param excludeOmenIds Omen IDs to exclude from selection
   * @returns The awarded omen definition, or null if skip failed
   */
  handleRoundSkip(
    roundType: RoundType,
    excludeOmenIds: string[] = []
  ): {
    omen: OmenDefinition | null
    immediateGold: number
    lockedSeason: SeasonVariant | null
  } {
    // Boss rounds cannot be skipped
    if (roundType === 'Boss') {
      return { omen: null, immediateGold: 0, lockedSeason: null }
    }

    // Increment skip counters
    this.skippedRoundsThisAct++
    this.totalSkippedRounds++

    // Update store
    const store = useOmenStore.getState()
    store.incrementSkippedRounds()

    // Select a random omen based on round type
    const selectedOmen = getRandomOmenForRound(roundType, excludeOmenIds)

    if (!selectedOmen) {
      return { omen: null, immediateGold: 0, lockedSeason: null }
    }

    // Add the omen to the store
    store.addOmen(selectedOmen)

    // Calculate immediate gold from omen
    let immediateGold = 0
    if (
      selectedOmen.trigger === 'OnAcquire' &&
      selectedOmen.effect.type === 'gold_bonus'
    ) {
      immediateGold = selectedOmen.effect.value as number
    } else if (
      selectedOmen.trigger === 'OnAcquire' &&
      selectedOmen.effect.type === 'gold_per_skip'
    ) {
      immediateGold =
        (selectedOmen.effect.value as number) * this.totalSkippedRounds
    }

    // Handle season lock trade-off
    let lockedSeason: SeasonVariant | null = null
    if (
      selectedOmen.tradeoff.type === 'lock_season' &&
      selectedOmen.tradeoff.value
    ) {
      lockedSeason = selectedOmen.tradeoff.value as SeasonVariant
      this.lockedSeasonType = lockedSeason
    }

    // Add to pending omens for display
    this.pendingOmens.push(selectedOmen)

    return {
      omen: selectedOmen,
      immediateGold,
      lockedSeason,
    }
  }

  /**
   * Get the locked season type (if any)
   */
  getLockedSeason(): SeasonVariant | null {
    const store = useOmenStore.getState()
    const state = store
    if (state.lockedSeason && !state.lockedSeason.isApplied) {
      return state.lockedSeason.seasonType
    }
    return this.lockedSeasonType
  }

  /**
   * Apply and consume the locked season
   */
  applyLockedSeason(): SeasonVariant | null {
    const store = useOmenStore.getState()
    const result = store.applyLockedSeason()
    this.lockedSeasonType = null
    return result
  }

  /**
   * Check if a round can be skipped
   */
  canSkipRound(roundType: RoundType): boolean {
    return roundType === 'Small' || roundType === 'Large'
  }

  /**
   * Get the potential omen preview for skipping a round
   * (For UI display purposes - shows possible omens without actually awarding)
   */
  getSkipOmenPreview(roundType: RoundType): {
    possibleOmens: OmenDefinition[]
    rarityChances: Record<OmenRarity, number>
  } {
    if (roundType === 'Boss') {
      return { possibleOmens: [], rarityChances: {} as Record<OmenRarity, number> }
    }

    const availableOmens =
      roundType === 'Small' ? SMALL_ROUND_OMENS : LARGE_ROUND_OMENS

    const rarityChances: Record<OmenRarity, number> =
      roundType === 'Large'
        ? {
            Common: 0.35,
            Uncommon: 0.35,
            Rare: 0.2,
            Legendary: 0.1,
          }
        : {
            Common: 0.5,
            Uncommon: 0.3,
            Rare: 0.15,
            Legendary: 0.05,
          }

    return {
      possibleOmens: availableOmens,
      rarityChances,
    }
  }

  /**
   * Get what is forfeited when skipping a round
   */
  getSkipForfeits(roundType: RoundType): {
    shopAccess: boolean
    scoringOpportunity: boolean
    scalingTriggers: boolean
    interestAccrual: boolean
    goldReward: number
  } {
    // Base gold rewards per round type
    const goldRewards: Record<RoundType, number> = {
      Small: 3,
      Large: 5,
      Boss: 8, // Not skippable, but for reference
    }

    return {
      shopAccess: true,
      scoringOpportunity: true,
      scalingTriggers: true,
      interestAccrual: true,
      goldReward: goldRewards[roundType],
    }
  }

  /**
   * Trigger omens for entering shop
   */
  triggerShopOmens(): {
    discount: number
    freeRerolls: number
    guaranteedItems: { itemType: string; omenId: string }[]
    decreeEdition: { editionType: string; omenId: string } | null
    consumedOmenIds: string[]
  } {
    const store = useOmenStore.getState()
    const state = store

    // Get effects from active omens
    const discount = selectShopDiscountFromOmens(state)
    const freeRerolls = selectFreeRerollsFromOmens(state)
    const guaranteedItems = selectGuaranteedShopItems(state)
    const decreeEdition = selectNextDecreeEdition(state)

    // Consume the triggered omens
    const consumedOmenIds: string[] = []
    const shopOmens = store.getActiveOmensByTrigger('OnNextShop')

    for (const omen of shopOmens) {
      store.triggerOmen(omen.id)
      store.consumeOmen(omen.id)
      consumedOmenIds.push(omen.id)
    }

    return {
      discount,
      freeRerolls,
      guaranteedItems,
      decreeEdition,
      consumedOmenIds,
    }
  }

  /**
   * Trigger omens for starting a new round
   */
  triggerRoundStartOmens(): {
    drawBonus: number
    discardBonus: number
    handSizeBonus: number
    consumedOmenIds: string[]
  } {
    const store = useOmenStore.getState()
    const state = store

    // Get effects from active omens
    const drawBonus = selectNextRoundDrawBonus(state)
    const discardBonus = selectNextRoundDiscardBonus(state)
    const handSizeBonus = selectNextRoundHandSizeBonus(state)

    // Consume the triggered omens
    const consumedOmenIds: string[] = []
    const roundOmens = store.getActiveOmensByTrigger('OnNextRound')

    for (const omen of roundOmens) {
      store.triggerOmen(omen.id)
      store.consumeOmen(omen.id)
      consumedOmenIds.push(omen.id)
    }

    // Decrement no-interest rounds
    store.decrementNoInterestRounds()

    return {
      drawBonus,
      discardBonus,
      handSizeBonus,
      consumedOmenIds,
    }
  }

  /**
   * Trigger omens for scoring a hand
   */
  triggerHandScoredOmens(): {
    scoreBonus: number
    multBonus: number
    consumedOmenIds: string[]
  } {
    const store = useOmenStore.getState()

    let scoreBonus = 0
    let multBonus = 0
    const consumedOmenIds: string[] = []

    // Get hand omens
    const handOmens = store.getActiveOmensByTrigger('OnNextHand')

    for (const omen of handOmens) {
      const effect = omen.definition.effect

      if (effect.type === 'score_bonus') {
        scoreBonus += effect.value as number
      } else if (effect.type === 'mult_bonus') {
        multBonus += effect.value as number
      }

      store.triggerOmen(omen.id)
      store.consumeOmen(omen.id)
      consumedOmenIds.push(omen.id)
    }

    return {
      scoreBonus,
      multBonus,
      consumedOmenIds,
    }
  }

  /**
   * Trigger omen for using a Void Script
   */
  triggerVoidScriptOmens(): {
    negateDownside: boolean
    consumedOmenId: string | null
  } {
    const store = useOmenStore.getState()

    const voidOmens = store.getActiveOmensByTrigger('OnNextVoidScript')

    if (voidOmens.length === 0) {
      return { negateDownside: false, consumedOmenId: null }
    }

    // Use the first void script omen
    const omen = voidOmens[0]
    const negateDownside = omen.definition.effect.type === 'consumable_upgrade'

    store.triggerOmen(omen.id)
    store.consumeOmen(omen.id)

    return {
      negateDownside,
      consumedOmenId: omen.id,
    }
  }

  /**
   * Get passive multiplier bonus from scaling omens
   */
  getPassiveMultBonus(): number {
    const store = useOmenStore.getState()
    return store.getPassiveMultBonus()
  }

  /**
   * Get gold bonus from omens (Speed Omen etc.)
   */
  getGoldBonus(): number {
    const store = useOmenStore.getState()
    return selectGoldBonusFromOmens(store)
  }

  /**
   * Check if interest is blocked by omen trade-offs
   */
  isInterestBlocked(): boolean {
    const store = useOmenStore.getState()
    return store.noInterestRounds > 0
  }

  /**
   * Get all currently active omens
   */
  getActiveOmens(): ActiveOmen[] {
    const store = useOmenStore.getState()
    return store.getActiveTags()
      .map((tag) => ({
        ...tag,
        definition: store.getTagDefinition(tag.definitionId),
      }))
      .filter((omen): omen is ActiveOmen => Boolean(omen.definition))
  }

  /**
   * Get omen history for the current run
   */
  getOmenHistory(): OmenHistoryEntry[] {
    const store = useOmenStore.getState()
    return store.getOmenHistoryForRun()
  }

  /**
   * Get total rounds skipped this run
   */
  getTotalSkippedRounds(): number {
    const store = useOmenStore.getState()
    return store.getTotalSkippedRounds()
  }

  /**
   * Get skipped rounds this act
   */
  getSkippedRoundsThisAct(): number {
    return this.skippedRoundsThisAct
  }

  /**
   * Reset act-specific counters (called when advancing to new act)
   */
  onActStart(): void {
    this.skippedRoundsThisAct = 0
    this.triggeredOmensThisRound = []
  }

  /**
   * Get pending omens to display
   */
  getPendingOmens(): OmenDefinition[] {
    return [...this.pendingOmens]
  }

  /**
   * Clear pending omens after display
   */
  clearPendingOmens(): void {
    this.pendingOmens = []
  }

  /**
   * Check if an omen with a specific effect type is active
   */
  hasActiveOmenWithEffect(effectType: OmenEffectType): boolean {
    const store = useOmenStore.getState()
    return store.hasActiveOmenWithEffect(effectType)
  }

  /**
   * Get a summary of active omen effects for UI display
   */
  getActiveEffectsSummary(): {
    name: string
    description: string
    category: OmenCategory
    rarity: OmenRarity
  }[] {
    const activeOmens = this.getActiveOmens()

    return activeOmens.map((omen) => ({
      name: omen.definition.name,
      description: omen.definition.description,
      category: omen.definition.category,
      rarity: omen.definition.rarity,
    }))
  }

  /**
   * Serialize system state
   */
  toState(): {
    currentAct: number
    currentRound: number
    skippedRoundsThisAct: number
    totalSkippedRounds: number
    lockedSeasonType: SeasonVariant | null
    pendingOmens: OmenDefinition[]
  } {
    return {
      currentAct: this.currentAct,
      currentRound: this.currentRound,
      skippedRoundsThisAct: this.skippedRoundsThisAct,
      totalSkippedRounds: this.totalSkippedRounds,
      lockedSeasonType: this.lockedSeasonType,
      pendingOmens: [...this.pendingOmens],
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    currentAct: number
    currentRound: number
    skippedRoundsThisAct: number
    totalSkippedRounds: number
    lockedSeasonType: SeasonVariant | null
    pendingOmens: OmenDefinition[]
  }): OmenTagSystem {
    const system = new OmenTagSystem()
    system.currentAct = state.currentAct
    system.currentRound = state.currentRound
    system.skippedRoundsThisAct = state.skippedRoundsThisAct
    system.totalSkippedRounds = state.totalSkippedRounds
    system.lockedSeasonType = state.lockedSeasonType
    system.pendingOmens = [...state.pendingOmens]
    return system
  }
}

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Calculate the value of skipping vs playing a round
 * Returns a heuristic score (higher = better to skip)
 */
export function calculateSkipValue(
  roundType: RoundType,
  context: {
    currentGold: number
    hasPerishableDecrees: boolean
    perishableRoundsRemaining: number
    scalingDecreeCount: number
    totalSkippedRounds: number
    isHighStakes: boolean
    wallQuality: number // 0-1 scale, higher = better wall
  }
): {
  skipValue: number
  playValue: number
  recommendation: 'skip' | 'play' | 'neutral'
  reasons: string[]
} {
  if (roundType === 'Boss') {
    return {
      skipValue: -Infinity,
      playValue: Infinity,
      recommendation: 'play',
      reasons: ['Boss rounds cannot be skipped'],
    }
  }

  let skipValue = 0
  let playValue = 0
  const reasons: string[] = []

  // Base omen value
  const omenValue = roundType === 'Large' ? 25 : 15
  skipValue += omenValue
  reasons.push(`Potential omen tag value: +${omenValue}`)

  // Perishable decrees benefit from skipping
  if (context.hasPerishableDecrees) {
    const perishableBonus = context.perishableRoundsRemaining <= 3 ? 30 : 15
    skipValue += perishableBonus
    reasons.push(`Perishable decree preservation: +${perishableBonus}`)
  }

  // Scaling decrees prefer more rounds
  if (context.scalingDecreeCount > 0) {
    const scalingPenalty = context.scalingDecreeCount * 10
    skipValue -= scalingPenalty
    playValue += scalingPenalty
    reasons.push(`Scaling decrees want more rounds: -${scalingPenalty} skip value`)
  }

  // High stakes need economy
  if (context.isHighStakes) {
    const economyPenalty = 20
    skipValue -= economyPenalty
    playValue += economyPenalty
    reasons.push(`High stakes economy needs: -${economyPenalty} skip value`)
  }

  // Wall quality affects play value
  const wallMultiplier = context.wallQuality
  playValue += wallMultiplier * 20
  if (wallMultiplier < 0.5) {
    skipValue += 15
    reasons.push('Unfavorable wall composition: +15 skip value')
  }

  // Interest value (roughly 1 gold per 5 held, capped at 5)
  const interestValue = Math.min(Math.floor(context.currentGold / 5), 5)
  playValue += interestValue * 2
  skipValue -= interestValue
  reasons.push(`Interest value: ${interestValue} gold`)

  // Shop access value
  const shopValue = 15
  playValue += shopValue
  skipValue -= shopValue / 2
  reasons.push(`Shop access value: ${shopValue}`)

  // Scaling omens become more valuable with more skips
  if (context.totalSkippedRounds > 0) {
    const scalingOmenBonus = context.totalSkippedRounds * 3
    skipValue += scalingOmenBonus
    reasons.push(`Scaling omen synergy: +${scalingOmenBonus}`)
  }

  // Determine recommendation
  let recommendation: 'skip' | 'play' | 'neutral'
  if (skipValue > playValue + 10) {
    recommendation = 'skip'
  } else if (playValue > skipValue + 10) {
    recommendation = 'play'
  } else {
    recommendation = 'neutral'
  }

  return {
    skipValue,
    playValue,
    recommendation,
    reasons,
  }
}

/**
 * Get Japanese name for omen rarity
 */
export function getOmenRarityJapaneseName(rarity: OmenRarity): string {
  switch (rarity) {
    case 'Common':
      return '普通'
    case 'Uncommon':
      return '希少'
    case 'Rare':
      return '珍品'
    case 'Legendary':
      return '伝説'
  }
}

/**
 * Get Japanese name for omen category
 */
export function getOmenCategoryJapaneseName(category: OmenCategory): string {
  switch (category) {
    case 'Economy':
      return '経済'
    case 'Shop':
      return '茶寮'
    case 'Scoring':
      return '得点'
    case 'Hand':
      return '手牌'
    case 'Consumable':
      return '消耗品'
    case 'Scaling':
      return '成長'
  }
}
