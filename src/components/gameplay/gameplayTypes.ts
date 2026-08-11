/**
 * Gameplay Component Types and Constants
 *
 * Shared type definitions and configuration for gameplay UI components.
 *
 * @module components/gameplay/gameplayTypes
 */

import { DecreeRarity, FlowerVariant, SeasonVariant } from '../../systems/types'
import { getCurrentLanguage } from '../../i18n'

// =============================================================================
// ROUND TYPE CONFIGURATION
// =============================================================================

/**
 * Round types in Tensho
 * - Small: First round of each act (1.0x multiplier)
 * - Large: Second round (1.5x multiplier)
 * - Boss: Final round with mandate (2.0x multiplier)
 */
export type RoundType = 'Small' | 'Large' | 'Boss'

/**
 * Visual configuration for each round type
 */
export interface RoundTypeConfig {
  /** Japanese name (小局/大局/親局) */
  japaneseName: string
  /** Text color class */
  color: string
  /** Background color class */
  bgColor: string
  /** Border color class */
  borderColor: string
}

/**
 * Round type visual configurations
 */
export const ROUND_TYPE_CONFIG: Record<RoundType, RoundTypeConfig> = {
  Small: {
    japaneseName: '小局',
    color: 'text-green-400',
    bgColor: 'bg-green-900/40',
    borderColor: 'border-green-500',
  },
  Large: {
    japaneseName: '大局',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/40',
    borderColor: 'border-blue-500',
  },
  Boss: {
    japaneseName: '親局',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/40',
    borderColor: 'border-purple-500',
  },
}

// =============================================================================
// DECREE STYLING
// =============================================================================

/**
 * Border colors for decree rarities
 */
export const DECREE_RARITY_COLORS: Record<DecreeRarity, string> = {
  LocalEdict: 'border-gray-400',
  RegionalMandate: 'border-green-500',
  ImperialDecree: 'border-blue-500',
  HeavenlyOrdinance: 'border-purple-500',
}

/**
 * Icon colors for decree unique icons
 */
export const DECREE_ICON_COLORS: Record<DecreeRarity, string> = {
  LocalEdict: '#9CA3AF', // gray-400
  RegionalMandate: '#22C55E', // green-500
  ImperialDecree: '#3B82F6', // blue-500
  HeavenlyOrdinance: '#A855F7', // purple-500
}

// =============================================================================
// FLOWER DATA
// =============================================================================

/**
 * Display data for each flower type
 */
export interface FlowerDisplayData {
  /** Tile rank (1-4) */
  rank: number
  /** Effect description */
  effect: string
  /** Gradient color classes */
  color: string
}

/**
 * Flower display configurations
 */
export const FLOWER_DATA: Record<FlowerVariant, FlowerDisplayData> = {
  Plum: {
    rank: 1,
    effect: '+5% per sequence',
    color: 'from-pink-400 to-pink-600',
  },
  Orchid: {
    rank: 2,
    effect: '+5% per honor',
    color: 'from-purple-400 to-purple-600',
  },
  Chrysanthemum: {
    rank: 3,
    effect: '+5% per concealed',
    color: 'from-yellow-400 to-yellow-600',
  },
  Bamboo: {
    rank: 4,
    effect: '+5% per terminal',
    color: 'from-green-400 to-green-600',
  },
}

// =============================================================================
// SEASON DATA
// =============================================================================

/**
 * Display data for each season
 */
export interface SeasonDisplayData {
  /** Rank in the native Mahjong season-tile set */
  rank: number
  /** Japanese name */
  japanese: string
  /** Text color class */
  color: string
}

/**
 * Season display configurations
 */
export const SEASON_DATA: Record<SeasonVariant, SeasonDisplayData> = {
  Spring: {
    rank: 1,
    japanese: '春',
    color: 'text-green-400',
  },
  Summer: {
    rank: 2,
    japanese: '夏',
    color: 'text-yellow-400',
  },
  Autumn: {
    rank: 3,
    japanese: '秋',
    color: 'text-orange-400',
  },
  Winter: {
    rank: 4,
    japanese: '冬',
    color: 'text-blue-400',
  },
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

/**
 * State for score popup animations
 */
export interface ScorePopupState {
  /** Unique identifier */
  id: number
  /** Score value to display */
  score: number
  /** Optional multiplier */
  multiplier?: number
  /** Visual variant */
  variant: 'default' | 'bonus' | 'critical'
}

/**
 * State for yaku reveal animations
 */
export interface YakuRevealState {
  /** Yaku ID */
  id: string
  /** Japanese name for display */
  japaneseName: string
  /** Multiplier value */
  multiplier: number
  /** Tier (1-4) for styling */
  tier: 1 | 2 | 3 | 4
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if current language uses CJK characters
 * Used to determine whether to show Japanese text in UI
 */
export function isCJKLanguage(): boolean {
  const lang = getCurrentLanguage()
  return (
    lang === 'ja' || lang === 'ko' || lang === 'zh-Hant' || lang === 'zh-Hans'
  )
}
