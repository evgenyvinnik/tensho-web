/**
 * Blessing Pack Definitions for Tensho Mahjong Roguelike
 *
 * Blessing Packs (祝福袋) are booster packs containing mixed upgrades.
 * Pack content weights adapt to current authority layer and player's dominant yaku style.
 *
 * Pack Types:
 * - Arcana Pack (秘術袋): Fate Seals (Tarot-style) - Immediate use
 * - Celestial Pack (天球袋): Celestial Orbs (yaku upgrades) - Immediate use
 * - Tile Pack (牌袋): Tiles with modifiers - Added to Wall
 * - Decree Pack (法令袋): Decree cards - Added to slots
 * - Void Pack (虚空袋): Void Scripts - Immediate use
 *
 * Pack Sizes:
 * - Normal: 4 Gold, 3 options, choose 1
 * - Jumbo: 6 Gold, 5 options, choose 1
 * - Mega: 8 Gold, 5 options, choose up to 2
 */

import { PackType, PackSize } from '../systems/types'

// =============================================================================
// PACK TYPE DEFINITIONS
// =============================================================================

/**
 * Pack type metadata with Japanese names and descriptions
 */
export interface PackTypeDefinition {
  type: PackType
  name: string
  japaneseName: string
  description: string
  contentType: 'immediate' | 'added_to_wall' | 'added_to_slots'
  iconColor: string
}

export const PACK_TYPE_DEFINITIONS: Record<PackType, PackTypeDefinition> = {
  Arcana: {
    type: 'Arcana',
    name: 'Arcana Pack',
    japaneseName: '秘術袋',
    description: 'Contains Fate Seals for immediate hand manipulation effects.',
    contentType: 'immediate',
    iconColor: '#9C27B0', // Purple for mystical
  },
  Celestial: {
    type: 'Celestial',
    name: 'Celestial Pack',
    japaneseName: '天球袋',
    description: 'Contains Celestial Orbs that permanently upgrade yaku families.',
    contentType: 'immediate',
    iconColor: '#2196F3', // Blue for celestial
  },
  Tile: {
    type: 'Tile',
    name: 'Tile Pack',
    japaneseName: '牌袋',
    description: 'Contains tiles with special modifiers that are added to the Wall.',
    contentType: 'added_to_wall',
    iconColor: '#F5F5DC', // Beige for tiles
  },
  Decree: {
    type: 'Decree',
    name: 'Decree Pack',
    japaneseName: '法令袋',
    description: 'Contains Decree cards that provide persistent rule-modifying effects.',
    contentType: 'added_to_slots',
    iconColor: '#FFD700', // Gold for decree
  },
  Void: {
    type: 'Void',
    name: 'Void Pack',
    japaneseName: '虚空袋',
    description: 'Contains powerful Void Scripts with significant effects and downsides.',
    contentType: 'immediate',
    iconColor: '#1C3A2E', // Dark for void
  },
}

// =============================================================================
// PACK SIZE DEFINITIONS
// =============================================================================

/**
 * Pack size metadata with costs and selection rules
 */
export interface PackSizeDefinition {
  size: PackSize
  name: string
  cost: number
  choiceCount: number
  selectCount: number
  description: string
}

export const PACK_SIZE_DEFINITIONS: Record<PackSize, PackSizeDefinition> = {
  Normal: {
    size: 'Normal',
    name: 'Normal',
    cost: 4,
    choiceCount: 3,
    selectCount: 1,
    description: 'Choose 1 from 3 options',
  },
  Jumbo: {
    size: 'Jumbo',
    name: 'Jumbo',
    cost: 6,
    choiceCount: 5,
    selectCount: 1,
    description: 'Choose 1 from 5 options',
  },
  Mega: {
    size: 'Mega',
    name: 'Mega',
    cost: 8,
    choiceCount: 5,
    selectCount: 2,
    description: 'Choose up to 2 from 5 options',
  },
}

// =============================================================================
// PACK APPEARANCE RATES
// =============================================================================

/**
 * Pack appearance rates by type and size
 * Total for each size column = ~60% (Normal), ~30% (Jumbo), ~8% (Mega)
 */
export interface PackAppearanceRate {
  type: PackType
  normalRate: number
  jumboRate: number
  megaRate: number
}

export const PACK_APPEARANCE_RATES: PackAppearanceRate[] = [
  { type: 'Tile', normalRate: 17.84, jumboRate: 8.92, megaRate: 2.23 },
  { type: 'Arcana', normalRate: 17.84, jumboRate: 8.92, megaRate: 2.23 },
  { type: 'Celestial', normalRate: 17.84, jumboRate: 8.92, megaRate: 2.23 },
  { type: 'Decree', normalRate: 5.35, jumboRate: 2.68, megaRate: 0.67 },
  { type: 'Void', normalRate: 2.68, jumboRate: 1.34, megaRate: 0.31 },
]

/**
 * Calculated weights for random selection
 * Normalized to make selection easier
 */
export const PACK_TYPE_WEIGHT_BY_SIZE: Record<PackSize, Record<PackType, number>> = {
  Normal: {
    Tile: 17.84,
    Arcana: 17.84,
    Celestial: 17.84,
    Decree: 5.35,
    Void: 2.68,
  },
  Jumbo: {
    Tile: 8.92,
    Arcana: 8.92,
    Celestial: 8.92,
    Decree: 2.68,
    Void: 1.34,
  },
  Mega: {
    Tile: 2.23,
    Arcana: 2.23,
    Celestial: 2.23,
    Decree: 0.67,
    Void: 0.31,
  },
}

/**
 * Overall pack size weights for determining size first
 */
export const PACK_SIZE_WEIGHTS: Record<PackSize, number> = {
  Normal: 60,
  Jumbo: 30,
  Mega: 10,
}

// =============================================================================
// PACK CONTENT GENERATION WEIGHTS
// =============================================================================

/**
 * Content rarity weights within packs
 * Used to determine the rarity of items within a pack
 */
export interface ContentRarityWeights {
  common: number
  uncommon: number
  rare: number
  legendary: number
}

export const DEFAULT_CONTENT_RARITY_WEIGHTS: ContentRarityWeights = {
  common: 60,
  uncommon: 30,
  rare: 9,
  legendary: 1,
}

/**
 * Enhanced rarity weights for Mega packs
 */
export const MEGA_CONTENT_RARITY_WEIGHTS: ContentRarityWeights = {
  common: 40,
  uncommon: 40,
  rare: 15,
  legendary: 5,
}

// =============================================================================
// YAKU STYLE AFFINITY
// =============================================================================

/**
 * Yaku style types that influence pack content generation
 */
export type YakuStyle = 'sequence' | 'triplet' | 'honor' | 'terminal' | 'mixed'

/**
 * Pack content bias based on player's dominant yaku style
 * Higher values mean more likely to generate related content
 */
export const YAKU_STYLE_PACK_BIAS: Record<YakuStyle, Partial<Record<PackType, number>>> = {
  sequence: {
    Tile: 1.2,
    Celestial: 1.3, // Sequence Star orbs
  },
  triplet: {
    Decree: 1.2, // More decree-focused builds
    Tile: 1.1,
  },
  honor: {
    Arcana: 1.3, // Fate seals interact well with honors
    Celestial: 1.2, // Dragon/Wind stars
  },
  terminal: {
    Tile: 1.3, // Terminal tiles
    Decree: 1.1,
  },
  mixed: {
    // No specific bias for mixed style
  },
}

// =============================================================================
// SKIP BONUSES
// =============================================================================

/**
 * Decrees that synergize with skipping pack selections
 */
export interface SkipSynergyDecree {
  decreeId: string
  bonusType: 'mult' | 'gold' | 'scaling'
  bonusValue: number
  description: string
}

export const SKIP_SYNERGY_DECREES: SkipSynergyDecree[] = [
  {
    decreeId: 'patient_observer',
    bonusType: 'mult',
    bonusValue: 0.15, // +0.15x Mult per skip
    description: 'Gains +0.15x Mult each time you skip a pack selection',
  },
  {
    decreeId: 'frugal_master',
    bonusType: 'gold',
    bonusValue: 2,
    description: 'Gains +2 Gold each time you skip a pack selection',
  },
  {
    decreeId: 'void_walker',
    bonusType: 'scaling',
    bonusValue: 0.05,
    description: 'Void Scripts cost 5% less for each skipped pack this run',
  },
]

// =============================================================================
// PACK GENERATION HELPERS
// =============================================================================

/**
 * Generate pack type weights adjusted for yaku style
 */
export function getAdjustedPackTypeWeights(
  baseWeights: Record<PackType, number>,
  yakuStyle: YakuStyle
): Record<PackType, number> {
  const biases = YAKU_STYLE_PACK_BIAS[yakuStyle]
  const adjusted: Record<PackType, number> = { ...baseWeights }

  for (const [packType, bias] of Object.entries(biases)) {
    if (adjusted[packType as PackType] !== undefined) {
      adjusted[packType as PackType] *= bias
    }
  }

  return adjusted
}

/**
 * Get the display name for a pack
 */
export function getPackDisplayName(type: PackType, size: PackSize): string {
  const typeInfo = PACK_TYPE_DEFINITIONS[type]
  const sizeInfo = PACK_SIZE_DEFINITIONS[size]
  return `${sizeInfo.name} ${typeInfo.name}`
}

/**
 * Get the Japanese name for a pack
 */
export function getPackJapaneseName(type: PackType, size: PackSize): string {
  const typeInfo = PACK_TYPE_DEFINITIONS[type]
  const sizePrefix = size === 'Normal' ? '' : size === 'Jumbo' ? '大' : '特大'
  return `${sizePrefix}${typeInfo.japaneseName}`
}

/**
 * Calculate total pack appearance weight for a given size
 */
export function getTotalPackTypeWeight(size: PackSize): number {
  const weights = PACK_TYPE_WEIGHT_BY_SIZE[size]
  return Object.values(weights).reduce((sum, weight) => sum + weight, 0)
}

/**
 * Calculate normalized probability for a pack type at a given size
 */
export function getPackTypeProbability(type: PackType, size: PackSize): number {
  const weight = PACK_TYPE_WEIGHT_BY_SIZE[size][type]
  const total = getTotalPackTypeWeight(size)
  return (weight / total) * 100
}
