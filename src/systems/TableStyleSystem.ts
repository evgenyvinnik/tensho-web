/**
 * Table Style System for Tensho Mahjong Roguelike
 *
 * Manages table style selection, unlocks, and active modifiers for runs.
 * Table Styles are analogous to Balatro's deck backs ("shirts").
 *
 * Based on ARCHITECTURE.MD Section "Table Styles System (P3)".
 */

import {
  TABLE_STYLE_DEFINITIONS,
  getTableStyleById,
  getDefaultTableStyle,
  getUnlockedTableStyles,
  getLockedTableStyles,
  getUnlockProgress,
  isUnlockConditionMet,
  getTableModifiers,
  getDecreeSlotModifier,
  getFlowerRateModifier,
  getShopDiscountModifier,
  getBaseScoreModifier,
  getYakumanMultiplierModifier,
  getScoreTargetModifier,
  areFlowersDisabled,
  hasEarlyCorruptedSeasons,
  grantsRegionalMandate,
  hasModifierType,
  formatModifierDescriptions,
  getBenefitModifiers,
  getDetrimentModifiers,
  hasTradeOffs,
  getThemeInfo,
  type TableStyleDefinition,
  type TableModifier,
  type TableModifierType,
  type UnlockRequirement,
  type PlayerUnlockStats,
} from '../config/tableStyleDefinitions'

// =============================================================================
// RE-EXPORTS FROM CONFIG
// =============================================================================

export {
  TABLE_STYLE_DEFINITIONS,
  getTableStyleById,
  getDefaultTableStyle,
  getUnlockedTableStyles,
  getLockedTableStyles,
  getUnlockProgress,
  isUnlockConditionMet,
  getTableModifiers,
  getDecreeSlotModifier,
  getFlowerRateModifier,
  getShopDiscountModifier,
  getBaseScoreModifier,
  getYakumanMultiplierModifier,
  getScoreTargetModifier,
  areFlowersDisabled,
  hasEarlyCorruptedSeasons,
  grantsRegionalMandate,
  hasModifierType,
  formatModifierDescriptions,
  getBenefitModifiers,
  getDetrimentModifiers,
  hasTradeOffs,
  getThemeInfo,
}

export type {
  TableStyleDefinition,
  TableModifier,
  TableModifierType,
  UnlockRequirement,
  PlayerUnlockStats,
}

// =============================================================================
// COMBINED TABLE STYLE MODIFIERS
// =============================================================================

/**
 * Combined modifiers from the active table style
 * Used during gameplay to apply table effects
 */
export interface ActiveTableModifiers {
  /** Modifier to decree slots (can be positive or negative) */
  decreeSlotModifier: number
  /** Flower appearance rate multiplier (1.0 = normal, 1.25 = 25% more) */
  flowerRateMultiplier: number
  /** Shop discount percentage (0-100) */
  shopDiscountPercent: number
  /** Base score multiplier (1.0 = normal, 1.5 = +50%) */
  baseScoreMultiplier: number
  /** Yakuman multiplier bonus */
  yakumanMultiplierBonus: number
  /** Score target multiplier (1.0 = normal, 1.25 = +25%) */
  scoreTargetMultiplier: number
  /** Whether flowers are disabled */
  flowersDisabled: boolean
  /** Whether corrupted seasons can appear from Act I */
  earlyCorruptedSeasons: boolean
  /** Whether a regional mandate is granted at start */
  grantRegionalMandate: boolean
}

/**
 * Default modifiers (no modifications)
 */
export const DEFAULT_TABLE_MODIFIERS: ActiveTableModifiers = {
  decreeSlotModifier: 0,
  flowerRateMultiplier: 1.0,
  shopDiscountPercent: 0,
  baseScoreMultiplier: 1.0,
  yakumanMultiplierBonus: 0,
  scoreTargetMultiplier: 1.0,
  flowersDisabled: false,
  earlyCorruptedSeasons: false,
  grantRegionalMandate: false,
}

// =============================================================================
// TABLE STYLE SYSTEM CLASS
// =============================================================================

/**
 * Manages table style selection and active modifiers
 */
export class TableStyleSystem {
  /** Currently selected table style ID */
  private currentStyleId: string

  /** Set of unlocked table style IDs */
  private unlockedStyles: Set<string>

  constructor(
    initialStyleId?: string,
    initialUnlockedStyles?: string[]
  ) {
    this.currentStyleId = initialStyleId ?? getDefaultTableStyle().id
    this.unlockedStyles = new Set(
      initialUnlockedStyles ?? [getDefaultTableStyle().id]
    )
  }

  // ===========================================================================
  // STYLE ACCESS
  // ===========================================================================

  /**
   * Get the currently selected table style
   */
  getCurrentStyle(): TableStyleDefinition {
    return getTableStyleById(this.currentStyleId) ?? getDefaultTableStyle()
  }

  /**
   * Get the current table style ID
   */
  getCurrentStyleId(): string {
    return this.currentStyleId
  }

  /**
   * Get a table style by ID
   */
  getStyle(styleId: string): TableStyleDefinition | undefined {
    return getTableStyleById(styleId)
  }

  /**
   * Get all table style definitions
   */
  getAllStyles(): TableStyleDefinition[] {
    return [...TABLE_STYLE_DEFINITIONS]
  }

  /**
   * Get all unlocked table styles
   */
  getUnlockedStyles(): TableStyleDefinition[] {
    return TABLE_STYLE_DEFINITIONS.filter((style) =>
      this.unlockedStyles.has(style.id)
    )
  }

  /**
   * Get all locked table styles
   */
  getLockedStyles(): TableStyleDefinition[] {
    return TABLE_STYLE_DEFINITIONS.filter(
      (style) => !this.unlockedStyles.has(style.id)
    )
  }

  /**
   * Check if a table style is unlocked
   */
  isUnlocked(styleId: string): boolean {
    return this.unlockedStyles.has(styleId)
  }

  // ===========================================================================
  // STYLE SELECTION
  // ===========================================================================

  /**
   * Select a table style for the current run
   * Returns false if the style is not unlocked
   */
  selectStyle(styleId: string): boolean {
    const style = getTableStyleById(styleId)
    if (!style) return false

    if (!this.unlockedStyles.has(styleId)) {
      return false
    }

    this.currentStyleId = styleId
    return true
  }

  /**
   * Reset to the default table style
   */
  resetToDefault(): void {
    this.currentStyleId = getDefaultTableStyle().id
  }

  // ===========================================================================
  // UNLOCK MANAGEMENT
  // ===========================================================================

  /**
   * Unlock a table style
   */
  unlockStyle(styleId: string): boolean {
    const style = getTableStyleById(styleId)
    if (!style) return false

    this.unlockedStyles.add(styleId)
    return true
  }

  /**
   * Update unlocks based on player statistics
   * Returns the list of newly unlocked style IDs
   */
  updateUnlocks(stats: PlayerUnlockStats): string[] {
    const newlyUnlocked: string[] = []

    for (const style of TABLE_STYLE_DEFINITIONS) {
      if (!this.unlockedStyles.has(style.id)) {
        if (isUnlockConditionMet(style, stats)) {
          this.unlockedStyles.add(style.id)
          newlyUnlocked.push(style.id)
        }
      }
    }

    return newlyUnlocked
  }

  /**
   * Get unlock progress for a style
   */
  getUnlockProgress(styleId: string, stats: PlayerUnlockStats): number {
    const style = getTableStyleById(styleId)
    if (!style) return 0

    if (this.unlockedStyles.has(styleId)) return 1

    return getUnlockProgress(style, stats)
  }

  // ===========================================================================
  // MODIFIER CALCULATION
  // ===========================================================================

  /**
   * Calculate active modifiers for the current table style
   */
  getActiveModifiers(): ActiveTableModifiers {
    return this.calculateModifiers(this.currentStyleId)
  }

  /**
   * Calculate modifiers for a specific table style
   */
  calculateModifiers(styleId: string): ActiveTableModifiers {
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

  // ===========================================================================
  // MODIFIER QUERIES
  // ===========================================================================

  /**
   * Get decree slot modifier for current style
   */
  getDecreeSlotModifier(): number {
    return getDecreeSlotModifier(this.currentStyleId)
  }

  /**
   * Get flower rate multiplier for current style
   */
  getFlowerRateMultiplier(): number {
    return 1.0 + getFlowerRateModifier(this.currentStyleId) / 100
  }

  /**
   * Get shop discount percentage for current style
   */
  getShopDiscountPercent(): number {
    return getShopDiscountModifier(this.currentStyleId)
  }

  /**
   * Get base score multiplier for current style
   */
  getBaseScoreMultiplier(): number {
    return 1.0 + getBaseScoreModifier(this.currentStyleId) / 100
  }

  /**
   * Get yakuman multiplier bonus for current style
   */
  getYakumanMultiplierBonus(): number {
    return getYakumanMultiplierModifier(this.currentStyleId)
  }

  /**
   * Get score target multiplier for current style
   */
  getScoreTargetMultiplier(): number {
    return 1.0 + getScoreTargetModifier(this.currentStyleId) / 100
  }

  /**
   * Check if flowers are disabled for current style
   */
  areFlowersDisabled(): boolean {
    return areFlowersDisabled(this.currentStyleId)
  }

  /**
   * Check if corrupted seasons can appear early
   */
  hasEarlyCorruptedSeasons(): boolean {
    return hasEarlyCorruptedSeasons(this.currentStyleId)
  }

  /**
   * Check if regional mandate is granted at start
   */
  grantsRegionalMandate(): boolean {
    return grantsRegionalMandate(this.currentStyleId)
  }

  // ===========================================================================
  // SCORING MODIFIERS
  // ===========================================================================

  /**
   * Apply base score modifier to a score
   */
  applyBaseScoreModifier(baseScore: number): number {
    return Math.floor(baseScore * this.getBaseScoreMultiplier())
  }

  /**
   * Apply yakuman multiplier bonus
   */
  applyYakumanMultiplier(baseMultiplier: number): number {
    return baseMultiplier + this.getYakumanMultiplierBonus()
  }

  /**
   * Apply score target modifier
   */
  applyScoreTargetModifier(baseTarget: number): number {
    return Math.floor(baseTarget * this.getScoreTargetMultiplier())
  }

  /**
   * Apply shop discount to a price
   */
  applyShopDiscount(basePrice: number): number {
    const discount = this.getShopDiscountPercent() / 100
    return Math.max(1, Math.floor(basePrice * (1 - discount)))
  }

  // ===========================================================================
  // DISPLAY HELPERS
  // ===========================================================================

  /**
   * Get display name of current style
   */
  getCurrentStyleName(): string {
    return this.getCurrentStyle().displayName
  }

  /**
   * Get Japanese name of current style
   */
  getCurrentStyleJapaneseName(): string {
    return this.getCurrentStyle().japaneseName
  }

  /**
   * Get theme color of current style
   */
  getCurrentThemeColor(): string {
    return this.getCurrentStyle().themeColor
  }

  /**
   * Get accent color of current style
   */
  getCurrentAccentColor(): string {
    return this.getCurrentStyle().accentColor
  }

  /**
   * Get modifier descriptions for current style
   */
  getModifierDescriptions(): string[] {
    return formatModifierDescriptions(this.currentStyleId)
  }

  /**
   * Check if current style has trade-offs
   */
  hasTradeOffs(): boolean {
    return hasTradeOffs(this.currentStyleId)
  }

  /**
   * Get theme info for current style
   */
  getThemeInfo(): {
    theme: string
    themeColor: string
    accentColor: string
  } | null {
    return getThemeInfo(this.currentStyleId)
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Serialize system state for persistence
   */
  toState(): {
    currentStyleId: string
    unlockedStyles: string[]
  } {
    return {
      currentStyleId: this.currentStyleId,
      unlockedStyles: Array.from(this.unlockedStyles),
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    currentStyleId: string
    unlockedStyles: string[]
  }): TableStyleSystem {
    return new TableStyleSystem(state.currentStyleId, state.unlockedStyles)
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get table style by display name (case-insensitive)
 */
export function getTableStyleByName(name: string): TableStyleDefinition | undefined {
  return TABLE_STYLE_DEFINITIONS.find(
    (style) => style.displayName.toLowerCase() === name.toLowerCase()
  )
}

/**
 * Get table style by Japanese name
 */
export function getTableStyleByJapaneseName(
  japaneseName: string
): TableStyleDefinition | undefined {
  return TABLE_STYLE_DEFINITIONS.find((style) => style.japaneseName === japaneseName)
}

/**
 * Get table style theme color by ID
 */
export function getTableStyleColor(styleId: string): string {
  return getTableStyleById(styleId)?.themeColor ?? '#2D5F4A'
}

/**
 * Get table style theme by ID
 */
export function getTableStyleTheme(styleId: string): string {
  return getTableStyleById(styleId)?.theme ?? 'Classic'
}

/**
 * Format table style for display with name and Japanese name
 */
export function formatTableStyleName(styleId: string): string {
  const style = getTableStyleById(styleId)
  if (!style) return 'Unknown'
  return `${style.displayName} (${style.japaneseName})`
}

/**
 * Get a summary of all modifiers for a style
 */
export function getModifierSummary(styleId: string): {
  benefits: string[]
  detriments: string[]
} {
  return {
    benefits: getBenefitModifiers(styleId).map((m) => m.description),
    detriments: getDetrimentModifiers(styleId).map((m) => m.description),
  }
}

/**
 * Check if a style is purely beneficial (no detriments)
 */
export function isPurelyBeneficial(styleId: string): boolean {
  return getDetrimentModifiers(styleId).length === 0
}

/**
 * Get the count of unlocked styles
 */
export function getUnlockedStyleCount(unlockedStyles: Set<string>): number {
  return unlockedStyles.size
}

/**
 * Calculate unlock completion percentage
 */
export function getUnlockCompletionPercent(unlockedStyles: Set<string>): number {
  return (unlockedStyles.size / TABLE_STYLE_DEFINITIONS.length) * 100
}
