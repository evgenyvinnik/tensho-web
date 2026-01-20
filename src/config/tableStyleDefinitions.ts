/**
 * Table Style Definitions for Tensho Mahjong Roguelike
 *
 * Table Styles are unlockable visual themes that also provide unique starting
 * conditions or passive modifiers for runs. Analogous to Balatro's deck backs ("shirts").
 *
 * Based on ARCHITECTURE.MD Section "Table Styles System (P3)".
 *
 * Design Philosophy:
 * - Each table represents a different "house" or "parlor" with its own customs
 * - Visual distinction: table cloth color/pattern, tile back designs, UI accents
 * - Mechanical distinction: starting bonuses, modified rules, or trade-offs
 */

// =============================================================================
// TABLE STYLE TYPES
// =============================================================================

/**
 * Types of starting modifiers that a table style can provide
 */
export type TableModifierType =
  | 'none'
  | 'decree_slot'
  | 'flower_rate'
  | 'regional_mandate'
  | 'shop_discount'
  | 'no_flowers'
  | 'base_score'
  | 'corrupted_seasons'
  | 'yakuman_multiplier'
  | 'score_target'

/**
 * Starting modifier configuration for a table style
 */
export interface TableModifier {
  /** Type of modifier */
  type: TableModifierType
  /** Numeric value for the modifier (positive or negative) */
  value?: number
  /** Description of the modifier effect */
  description: string
  /** Whether this is a beneficial or detrimental modifier */
  isBenefit: boolean
}

/**
 * Unlock requirement types
 */
export type UnlockRequirementType =
  | 'default'
  | 'complete_act'
  | 'collect_all_flowers'
  | 'win_with_decrees'
  | 'purchase_decrees'
  | 'win_without_flowers'
  | 'survive_corrupted_seasons'
  | 'score_yakuman'

/**
 * Unlock requirement for a table style
 */
export interface UnlockRequirement {
  /** Type of unlock requirement */
  type: UnlockRequirementType
  /** Numeric threshold (if applicable) */
  threshold?: number
  /** Human-readable description */
  description: string
}

/**
 * Complete table style definition
 */
export interface TableStyleDefinition {
  /** Unique identifier */
  id: string
  /** Display name in English */
  displayName: string
  /** Japanese name with kanji */
  japaneseName: string
  /** Description of the table's theme and atmosphere */
  description: string
  /** Theme category */
  theme: string
  /** Primary theme color (hex) */
  themeColor: string
  /** Secondary accent color (hex) */
  accentColor: string
  /** Starting modifiers applied when using this table */
  startingModifiers: TableModifier[]
  /** Unlock requirement */
  unlockCondition: UnlockRequirement
  /** Whether this table is available by default */
  isDefault: boolean
}

// =============================================================================
// TABLE STYLE DEFINITIONS
// =============================================================================

/**
 * Green Felt - The classic, default table style
 */
export const GREEN_FELT: TableStyleDefinition = {
  id: 'green_felt',
  displayName: 'Green Felt',
  japaneseName: '默认',
  description:
    'The classic mahjong table. A traditional green felt surface, worn smooth by countless hands. No special modifiers - just pure skill.',
  theme: 'Classic',
  themeColor: '#2D5F4A',
  accentColor: '#1C3A2E',
  startingModifiers: [
    {
      type: 'none',
      description: 'No special modifiers',
      isBenefit: true,
    },
  ],
  unlockCondition: {
    type: 'default',
    description: 'Available from the start',
  },
  isDefault: true,
}

/**
 * Red Lacquer - Auspicious theme with extra decree capacity
 */
export const RED_LACQUER: TableStyleDefinition = {
  id: 'red_lacquer',
  displayName: 'Red Lacquer',
  japaneseName: '朱漆',
  description:
    'A luxurious table finished in brilliant vermillion lacquer, symbolizing good fortune and prosperity. The auspicious color attracts additional decrees.',
  theme: 'Auspicious',
  themeColor: '#C62828',
  accentColor: '#8E0000',
  startingModifiers: [
    {
      type: 'decree_slot',
      value: 1,
      description: '+1 starting Decree slot',
      isBenefit: true,
    },
  ],
  unlockCondition: {
    type: 'complete_act',
    threshold: 3,
    description: 'Complete Act 3',
  },
  isDefault: false,
}

/**
 * Bamboo Mat - Natural theme with enhanced flower appearance
 */
export const BAMBOO_MAT: TableStyleDefinition = {
  id: 'bamboo_mat',
  displayName: 'Bamboo Mat',
  japaneseName: '竹席',
  description:
    'A simple woven bamboo mat spread over a low table in a garden pavilion. The natural setting attracts more flowers to bloom.',
  theme: 'Natural',
  themeColor: '#8BC34A',
  accentColor: '#558B2F',
  startingModifiers: [
    {
      type: 'flower_rate',
      value: 25,
      description: 'Flowers appear 25% more often',
      isBenefit: true,
    },
  ],
  unlockCondition: {
    type: 'collect_all_flowers',
    threshold: 4,
    description: 'Collect all 4 Flowers in a single run',
  },
  isDefault: false,
}

/**
 * Imperial Gold - Royal theme with regional mandate
 */
export const IMPERIAL_GOLD: TableStyleDefinition = {
  id: 'imperial_gold',
  displayName: 'Imperial Gold',
  japaneseName: '金殿',
  description:
    'A magnificent table from the imperial palace, inlaid with gold leaf and jade. Those who play here receive royal favor.',
  theme: 'Royal',
  themeColor: '#FFD700',
  accentColor: '#B8860B',
  startingModifiers: [
    {
      type: 'regional_mandate',
      value: 1,
      description: 'Start with 1 random Regional Mandate',
      isBenefit: true,
    },
  ],
  unlockCondition: {
    type: 'win_with_decrees',
    threshold: 5,
    description: 'Win a run with 5+ Decrees',
  },
  isDefault: false,
}

/**
 * Night Market - Street theme with discount but fewer slots
 */
export const NIGHT_MARKET: TableStyleDefinition = {
  id: 'night_market',
  displayName: 'Night Market',
  japaneseName: '夜市',
  description:
    'A makeshift table in the bustling night market, lit by paper lanterns. Vendors offer discounts, but space is limited.',
  theme: 'Street',
  themeColor: '#FF8F00',
  accentColor: '#E65100',
  startingModifiers: [
    {
      type: 'shop_discount',
      value: 20,
      description: 'Shop prices -20%',
      isBenefit: true,
    },
    {
      type: 'decree_slot',
      value: -1,
      description: '-1 Decree slot',
      isBenefit: false,
    },
  ],
  unlockCondition: {
    type: 'purchase_decrees',
    threshold: 20,
    description: 'Purchase 20 Decrees across all runs',
  },
  isDefault: false,
}

/**
 * Temple Stone - Austere theme with no flowers but base score bonus
 */
export const TEMPLE_STONE: TableStyleDefinition = {
  id: 'temple_stone',
  displayName: 'Temple Stone',
  japaneseName: '石庙',
  description:
    'A cold stone table in an ascetic mountain temple. No flowers grow in this austere place, but the purity of focus enhances your base scoring.',
  theme: 'Austere',
  themeColor: '#607D8B',
  accentColor: '#37474F',
  startingModifiers: [
    {
      type: 'no_flowers',
      description: 'No Flowers will appear',
      isBenefit: false,
    },
    {
      type: 'base_score',
      value: 50,
      description: '+50% base score',
      isBenefit: true,
    },
  ],
  unlockCondition: {
    type: 'win_without_flowers',
    description: 'Win a run without collecting any Flowers',
  },
  isDefault: false,
}

/**
 * Ghost Parlor - Haunted theme with early corrupted seasons
 */
export const GHOST_PARLOR: TableStyleDefinition = {
  id: 'ghost_parlor',
  displayName: 'Ghost Parlor',
  japaneseName: '幽亭',
  description:
    'An abandoned mahjong hall where spirits still play. The veil between worlds is thin here, allowing corrupted seasons to manifest from the very beginning.',
  theme: 'Haunted',
  themeColor: '#7B1FA2',
  accentColor: '#4A0072',
  startingModifiers: [
    {
      type: 'corrupted_seasons',
      description: 'Corrupted Seasons can appear from Act I',
      isBenefit: false,
    },
  ],
  unlockCondition: {
    type: 'survive_corrupted_seasons',
    threshold: 3,
    description: 'Survive 3 Corrupted Seasons in one run',
  },
  isDefault: false,
}

/**
 * Dragon's Den - Mythic theme with yakuman bonus but higher targets
 */
export const DRAGONS_DEN: TableStyleDefinition = {
  id: 'dragons_den',
  displayName: "Dragon's Den",
  japaneseName: '龙窟',
  description:
    'A legendary table carved from dragon bone, hidden in a mountain cavern. Yakuman hands are amplified here, but the dragon demands greater tribute.',
  theme: 'Mythic',
  themeColor: '#D32F2F',
  accentColor: '#B71C1C',
  startingModifiers: [
    {
      type: 'yakuman_multiplier',
      value: 1.0,
      description: 'Yakuman multipliers +1.0x',
      isBenefit: true,
    },
    {
      type: 'score_target',
      value: 25,
      description: '+25% score targets',
      isBenefit: false,
    },
  ],
  unlockCondition: {
    type: 'score_yakuman',
    description: 'Score a Yakuman',
  },
  isDefault: false,
}

// =============================================================================
// TABLE STYLE COLLECTIONS
// =============================================================================

/**
 * All table style definitions
 */
export const TABLE_STYLE_DEFINITIONS: TableStyleDefinition[] = [
  GREEN_FELT,
  RED_LACQUER,
  BAMBOO_MAT,
  IMPERIAL_GOLD,
  NIGHT_MARKET,
  TEMPLE_STONE,
  GHOST_PARLOR,
  DRAGONS_DEN,
]

/**
 * Default table styles (available from start)
 */
export const DEFAULT_TABLE_STYLES: TableStyleDefinition[] = TABLE_STYLE_DEFINITIONS.filter(
  (style) => style.isDefault
)

/**
 * Unlockable table styles
 */
export const UNLOCKABLE_TABLE_STYLES: TableStyleDefinition[] = TABLE_STYLE_DEFINITIONS.filter(
  (style) => !style.isDefault
)

// =============================================================================
// LOOKUP UTILITIES
// =============================================================================

/**
 * Get a table style by ID
 */
export function getTableStyleById(id: string): TableStyleDefinition | undefined {
  return TABLE_STYLE_DEFINITIONS.find((style) => style.id === id)
}

/**
 * Get a table style by display name (case-insensitive)
 */
export function getTableStyleByName(name: string): TableStyleDefinition | undefined {
  return TABLE_STYLE_DEFINITIONS.find(
    (style) => style.displayName.toLowerCase() === name.toLowerCase()
  )
}

/**
 * Get all table styles for a specific theme
 */
export function getTableStylesByTheme(theme: string): TableStyleDefinition[] {
  return TABLE_STYLE_DEFINITIONS.filter(
    (style) => style.theme.toLowerCase() === theme.toLowerCase()
  )
}

/**
 * Get the default table style
 */
export function getDefaultTableStyle(): TableStyleDefinition {
  return GREEN_FELT
}

// =============================================================================
// MODIFIER UTILITIES
// =============================================================================

/**
 * Get all starting modifiers for a table style as a flat array
 */
export function getTableModifiers(styleId: string): TableModifier[] {
  const style = getTableStyleById(styleId)
  return style?.startingModifiers ?? []
}

/**
 * Check if a table style has a specific modifier type
 */
export function hasModifierType(styleId: string, type: TableModifierType): boolean {
  const modifiers = getTableModifiers(styleId)
  return modifiers.some((mod) => mod.type === type)
}

/**
 * Get the value of a specific modifier type for a table style
 * Returns 0 if the modifier is not present
 */
export function getModifierValue(styleId: string, type: TableModifierType): number {
  const modifiers = getTableModifiers(styleId)
  const modifier = modifiers.find((mod) => mod.type === type)
  return modifier?.value ?? 0
}

/**
 * Get decree slot modifier for a table style
 */
export function getDecreeSlotModifier(styleId: string): number {
  return getModifierValue(styleId, 'decree_slot')
}

/**
 * Get flower rate modifier for a table style (as percentage)
 */
export function getFlowerRateModifier(styleId: string): number {
  return getModifierValue(styleId, 'flower_rate')
}

/**
 * Get shop discount modifier for a table style (as percentage)
 */
export function getShopDiscountModifier(styleId: string): number {
  return getModifierValue(styleId, 'shop_discount')
}

/**
 * Get base score modifier for a table style (as percentage)
 */
export function getBaseScoreModifier(styleId: string): number {
  return getModifierValue(styleId, 'base_score')
}

/**
 * Get yakuman multiplier modifier for a table style
 */
export function getYakumanMultiplierModifier(styleId: string): number {
  return getModifierValue(styleId, 'yakuman_multiplier')
}

/**
 * Get score target modifier for a table style (as percentage increase)
 */
export function getScoreTargetModifier(styleId: string): number {
  return getModifierValue(styleId, 'score_target')
}

/**
 * Check if flowers are disabled for a table style
 */
export function areFlowersDisabled(styleId: string): boolean {
  return hasModifierType(styleId, 'no_flowers')
}

/**
 * Check if corrupted seasons can appear from Act I
 */
export function hasEarlyCorruptedSeasons(styleId: string): boolean {
  return hasModifierType(styleId, 'corrupted_seasons')
}

/**
 * Check if table style grants a regional mandate at start
 */
export function grantsRegionalMandate(styleId: string): boolean {
  return hasModifierType(styleId, 'regional_mandate')
}

// =============================================================================
// UNLOCK UTILITIES
// =============================================================================

/**
 * Check if unlock conditions are met based on player statistics
 */
export interface PlayerUnlockStats {
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
 * Check if a table style's unlock condition is met
 */
export function isUnlockConditionMet(
  style: TableStyleDefinition,
  stats: PlayerUnlockStats
): boolean {
  const condition = style.unlockCondition

  switch (condition.type) {
    case 'default':
      return true

    case 'complete_act':
      return stats.highestActCompleted >= (condition.threshold ?? 0)

    case 'collect_all_flowers':
      return stats.maxFlowersInRun >= (condition.threshold ?? 4)

    case 'win_with_decrees':
      return stats.maxDecreesInWin >= (condition.threshold ?? 0)

    case 'purchase_decrees':
      return stats.totalDecreesPurchased >= (condition.threshold ?? 0)

    case 'win_without_flowers':
      return stats.hasWonWithoutFlowers

    case 'survive_corrupted_seasons':
      return stats.maxCorruptedSeasonsSurvived >= (condition.threshold ?? 0)

    case 'score_yakuman':
      return stats.hasScoredYakuman

    default:
      return false
  }
}

/**
 * Get all unlocked table styles based on player statistics
 */
export function getUnlockedTableStyles(stats: PlayerUnlockStats): TableStyleDefinition[] {
  return TABLE_STYLE_DEFINITIONS.filter((style) => isUnlockConditionMet(style, stats))
}

/**
 * Get all locked table styles based on player statistics
 */
export function getLockedTableStyles(stats: PlayerUnlockStats): TableStyleDefinition[] {
  return TABLE_STYLE_DEFINITIONS.filter((style) => !isUnlockConditionMet(style, stats))
}

/**
 * Get unlock progress for a table style
 * Returns a value between 0 and 1 representing progress toward unlock
 */
export function getUnlockProgress(
  style: TableStyleDefinition,
  stats: PlayerUnlockStats
): number {
  const condition = style.unlockCondition
  const threshold = condition.threshold ?? 1

  switch (condition.type) {
    case 'default':
      return 1

    case 'complete_act':
      return Math.min(1, stats.highestActCompleted / threshold)

    case 'collect_all_flowers':
      return Math.min(1, stats.maxFlowersInRun / threshold)

    case 'win_with_decrees':
      return Math.min(1, stats.maxDecreesInWin / threshold)

    case 'purchase_decrees':
      return Math.min(1, stats.totalDecreesPurchased / threshold)

    case 'win_without_flowers':
      return stats.hasWonWithoutFlowers ? 1 : 0

    case 'survive_corrupted_seasons':
      return Math.min(1, stats.maxCorruptedSeasonsSurvived / threshold)

    case 'score_yakuman':
      return stats.hasScoredYakuman ? 1 : 0

    default:
      return 0
  }
}

// =============================================================================
// DISPLAY UTILITIES
// =============================================================================

/**
 * Format modifier descriptions for display
 */
export function formatModifierDescriptions(styleId: string): string[] {
  const modifiers = getTableModifiers(styleId)
  return modifiers.map((mod) => mod.description)
}

/**
 * Get benefit modifiers only
 */
export function getBenefitModifiers(styleId: string): TableModifier[] {
  const modifiers = getTableModifiers(styleId)
  return modifiers.filter((mod) => mod.isBenefit)
}

/**
 * Get detriment modifiers only
 */
export function getDetrimentModifiers(styleId: string): TableModifier[] {
  const modifiers = getTableModifiers(styleId)
  return modifiers.filter((mod) => !mod.isBenefit)
}

/**
 * Check if a table style has trade-offs (both benefits and detriments)
 */
export function hasTradeOffs(styleId: string): boolean {
  const benefits = getBenefitModifiers(styleId)
  const detriments = getDetrimentModifiers(styleId)
  return benefits.length > 0 && detriments.length > 0
}

/**
 * Get theme display info
 */
export function getThemeInfo(styleId: string): {
  theme: string
  themeColor: string
  accentColor: string
} | null {
  const style = getTableStyleById(styleId)
  if (!style) return null

  return {
    theme: style.theme,
    themeColor: style.themeColor,
    accentColor: style.accentColor,
  }
}
