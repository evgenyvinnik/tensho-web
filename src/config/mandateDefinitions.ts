/**
 * Mandate Definitions for Tensho Mahjong Roguelike
 *
 * Based on ARCHITECTURE.MD Section 21 (Mandates)
 * Mandates are Boss Round restrictions that add challenge and strategic complexity.
 *
 * Round Structure per Act:
 * | Round | Type | Score Multiplier | Special Effect |
 * |-------|------|------------------|----------------|
 * | Small Round | 1.0x | Can be skipped for Omen |
 * | Large Round | 1.5x | Can be skipped for Omen |
 * | Boss Round | 2.0x | Cannot skip, has Boss Mandate |
 */

import { createSeededRandom, runRandom } from '../game/RunRandom'
import { NORMAL_RUN_ACTS, isShowdownAct } from './runProgression'

// =============================================================================
// MANDATE EFFECT TYPES
// =============================================================================

/**
 * Types of mandate effects
 */
export type MandateEffectType =
  // Standard Mandates
  | 'discard_after_draw' // The Hook: Random tiles discarded after draw
  | 'score_multiplier' // The Wall/Violet Vessel: Increased score requirement
  | 'no_repeat_pattern' // The Eye: Each hand type only scores once
  | 'single_play_pattern' // The Mouth: Only the first play's hand type scores
  | 'halve_score' // The Flint: Every play scores half
  | 'single_hand' // The Needle: Must complete in 1 hand
  | 'debuff_used_tiles' // The Pillar: Previously used tiles debuffed
  | 'no_discards' // The Water: 0 redraws this round
  | 'decrease_play_level' // The Arm: Each play lowers its hand type's level
  | 'fixed_hand_size' // The Psychic: Must play exactly N tiles
  | 'debuff_suit' // The Club/Goad/Window: Specific suit debuffed
  | 'debuff_tile_type' // The Head/Plant: Specific tile type debuffed
  | 'hand_size_reduction' // The Manacle: Reduce hand size by N
  | 'gold_per_tile' // The Tooth: Lose gold per tile played
  | 'most_played_pattern_zeroes_gold' // The Ox: Playing the most-played hand type sets gold to 0
  | 'first_hand_face_down' // The House: First hand drawn face-down
  | 'tiles_face_down_ratio' // The Wheel: 1 in N tiles drawn face-down
  | 'tiles_face_down_after_play' // The Fish: Tiles face-down after each hand
  | 'fixed_draw_count' // The Serpent: Always draw N tiles after play/discard
  | 'honor_tiles_face_down' // The Veil: All honor tiles drawn face-down
  // Showdown Mandates (campaign finale and periodic Endless bosses)
  | 'hide_half_decrees' // Amber Acorn: Half the Decrees face-down and disabled
  | 'debuff_until_sell' // Verdant Leaf: All tiles debuffed until decree sold
  | 'disable_random_decree' // Crimson Heart: Random decree disabled per hand
  | 'lock_random_tile' // Cerulean Bell: Force-lock tile every draw

/**
 * Categories of mandates
 */
export type MandateCategory = 'Standard' | 'Showdown'

/**
 * Difficulty tier of mandate
 */
export type MandateDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Extreme'

/**
 * Full mandate definition
 */
export interface MandateDefinition {
  id: string
  name: string
  japaneseName: string
  description: string
  category: MandateCategory
  difficulty: MandateDifficulty
  effect: {
    type: MandateEffectType
    value?: number | string
    target?: string
  }
  minAct: number // Minimum act where this mandate can appear
}

// =============================================================================
// STANDARD BOSS MANDATES
// =============================================================================

/**
 * The Hook - 2 random tiles discarded from hand after each draw
 */
export const THE_HOOK: MandateDefinition = {
  id: 'the_hook',
  name: 'The Hook',
  japaneseName: '鉤',
  description: 'After each draw, 2 random tiles go from your rack to the river',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'discard_after_draw', value: 2 },
  minAct: 1,
}

/**
 * The Wall - Extra large score requirement (4x instead of 2x)
 */
export const THE_WALL: MandateDefinition = {
  id: 'the_wall',
  name: 'The Wall',
  japaneseName: '壁',
  description: 'Score target ×4 instead of the usual Boss ×2',
  category: 'Standard',
  difficulty: 'Hard',
  effect: { type: 'score_multiplier', value: 4 },
  minAct: 2,
}

/**
 * The Eye - Each hand type scores only once this round
 */
export const THE_EYE: MandateDefinition = {
  id: 'the_eye',
  name: 'The Eye',
  japaneseName: '目',
  description: 'Each hand type scores only once this round. A repeat scores 0',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'no_repeat_pattern' },
  minAct: 3,
}

/**
 * The Mouth - The first play fixes the round's hand type
 */
export const THE_MOUTH: MandateDefinition = {
  id: 'the_mouth',
  name: 'The Mouth',
  japaneseName: '口',
  description:
    'Your first play sets this round’s hand type. Any other hand scores 0',
  category: 'Standard',
  difficulty: 'Hard',
  effect: { type: 'single_play_pattern' },
  minAct: 2,
}

/**
 * The Flint - Every play scores half
 */
export const THE_FLINT: MandateDefinition = {
  id: 'the_flint',
  name: 'The Flint',
  japaneseName: '火打石',
  description: 'Every play this round scores half',
  category: 'Standard',
  difficulty: 'Hard',
  effect: { type: 'halve_score', value: 0.5 },
  minAct: 2,
}

/**
 * The Needle - Must complete hand in exactly 1 draw cycle
 */
export const THE_NEEDLE: MandateDefinition = {
  id: 'the_needle',
  name: 'The Needle',
  japaneseName: '針',
  description: 'Only one Play this round (REDRAW is still allowed)',
  category: 'Standard',
  difficulty: 'Extreme',
  effect: { type: 'single_hand' },
  minAct: 2,
}

/**
 * The Pillar - Tiles used in previous rounds are debuffed
 */
export const THE_PILLAR: MandateDefinition = {
  id: 'the_pillar',
  name: 'The Pillar',
  japaneseName: '柱',
  description: 'Tiles played in earlier rounds of this Act score nothing',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'debuff_used_tiles' },
  minAct: 1,
}

/**
 * The Water - Start with 0 redraws this round
 */
export const THE_WATER: MandateDefinition = {
  id: 'the_water',
  name: 'The Water',
  japaneseName: '水',
  description: 'No REDRAW this round',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'no_discards' },
  minAct: 2,
}

/**
 * The Arm - Each play lowers its hand type's level by 1
 */
export const THE_ARM: MandateDefinition = {
  id: 'the_arm',
  name: 'The Arm',
  japaneseName: '腕',
  description: 'Every play lowers its hand type’s level by 1 before it scores',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'decrease_play_level', value: 1 },
  minAct: 2,
}

/**
 * The Psychic - Must play exactly 5 tiles per hand
 */
export const THE_PSYCHIC: MandateDefinition = {
  id: 'the_psychic',
  name: 'The Psychic',
  japaneseName: '霊能者',
  description: 'Every play must use exactly 5 tiles',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'fixed_hand_size', value: 5 },
  minAct: 1,
}

/**
 * The Club - All Bamboo tiles are debuffed
 */
export const THE_CLUB: MandateDefinition = {
  id: 'the_club',
  name: 'The Club',
  japaneseName: '棍',
  description: 'Bamboo tiles score nothing',
  category: 'Standard',
  difficulty: 'Easy',
  effect: { type: 'debuff_suit', target: 'souzu' },
  minAct: 1,
}

/**
 * The Goad - All Circles are debuffed
 */
export const THE_GOAD: MandateDefinition = {
  id: 'the_goad',
  name: 'The Goad',
  japaneseName: '突棒',
  description: 'Circles tiles score nothing',
  category: 'Standard',
  difficulty: 'Easy',
  effect: { type: 'debuff_suit', target: 'pinzu' },
  minAct: 1,
}

/**
 * The Window - All Characters are debuffed
 */
export const THE_WINDOW: MandateDefinition = {
  id: 'the_window',
  name: 'The Window',
  japaneseName: '窓',
  description: 'Characters tiles score nothing',
  category: 'Standard',
  difficulty: 'Easy',
  effect: { type: 'debuff_suit', target: 'manzu' },
  minAct: 1,
}

/**
 * The Head - All Dragon tiles are debuffed
 */
export const THE_HEAD: MandateDefinition = {
  id: 'the_head',
  name: 'The Head',
  japaneseName: '頭',
  description: 'Dragons score nothing',
  category: 'Standard',
  difficulty: 'Easy',
  effect: { type: 'debuff_tile_type', target: 'dragon' },
  minAct: 1,
}

/**
 * The Plant - All Honor tiles are debuffed
 */
export const THE_PLANT: MandateDefinition = {
  id: 'the_plant',
  name: 'The Plant',
  japaneseName: '草',
  description: 'Winds and Dragons score nothing',
  category: 'Standard',
  difficulty: 'Hard',
  effect: { type: 'debuff_tile_type', target: 'honor' },
  minAct: 4,
}

/**
 * The Ox - Playing the most-played hand type sets gold to 0
 */
export const THE_OX: MandateDefinition = {
  id: 'the_ox',
  name: 'The Ox',
  japaneseName: '牛',
  description: 'Playing your most-played hand type sets your Gold to 0',
  category: 'Standard',
  difficulty: 'Hard',
  effect: { type: 'most_played_pattern_zeroes_gold' },
  minAct: 6,
}

/**
 * The House - First hand drawn face-down
 */
export const THE_HOUSE: MandateDefinition = {
  id: 'the_house',
  name: 'The House',
  japaneseName: '家',
  description: 'Your starting rack is dealt face-down',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'first_hand_face_down' },
  minAct: 2,
}

/**
 * The Wheel - 1 in 7 tiles drawn face-down
 */
export const THE_WHEEL: MandateDefinition = {
  id: 'the_wheel',
  name: 'The Wheel',
  japaneseName: '輪',
  description: '1 in 7 tiles drawn face-down',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'tiles_face_down_ratio', value: 7 },
  minAct: 2,
}

/**
 * The Fish - Tiles drawn face-down after each hand
 */
export const THE_FISH: MandateDefinition = {
  id: 'the_fish',
  name: 'The Fish',
  japaneseName: '魚',
  description: 'Tiles drawn after each play arrive face-down',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'tiles_face_down_after_play' },
  minAct: 2,
}

/**
 * The Serpent - After play/discard, always draw 3 tiles
 */
export const THE_SERPENT: MandateDefinition = {
  id: 'the_serpent',
  name: 'The Serpent',
  japaneseName: '蛇',
  description: 'After a Play or REDRAW, always draw exactly 3 tiles',
  category: 'Standard',
  difficulty: 'Hard',
  effect: { type: 'fixed_draw_count', value: 3 },
  minAct: 5,
}

/**
 * The Tooth - Lose 1 gold per tile played
 */
export const THE_TOOTH: MandateDefinition = {
  id: 'the_tooth',
  name: 'The Tooth',
  japaneseName: '歯',
  description: 'Lose 1 gold per tile played',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'gold_per_tile', value: 1 },
  minAct: 3,
}

/**
 * The Veil - All Honor tiles drawn face-down
 */
export const THE_MARK: MandateDefinition = {
  id: 'the_mark',
  name: 'The Veil',
  japaneseName: '帳',
  description: 'Winds and Dragons are drawn face-down',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'honor_tiles_face_down' },
  minAct: 2,
}

/**
 * The Manacle - Reduce hand size by 1
 */
export const THE_MANACLE: MandateDefinition = {
  id: 'the_manacle',
  name: 'The Manacle',
  japaneseName: '枷',
  description: 'Your rack holds 1 fewer tile',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'hand_size_reduction', value: 1 },
  minAct: 1,
}

// =============================================================================
// SHOWDOWN MANDATES (campaign finale and periodic Endless bosses)
// =============================================================================

/**
 * Amber Acorn - A random half of the Decrees (rounded up) turn face-down and
 * lose their powers until the Showdown is won
 */
export const AMBER_ACORN: MandateDefinition = {
  id: 'amber_acorn',
  name: 'Amber Acorn',
  japaneseName: '琥珀の実',
  description: 'Half your Decrees, chosen at random, are hidden and disabled',
  category: 'Showdown',
  difficulty: 'Hard',
  effect: { type: 'hide_half_decrees' },
  minAct: NORMAL_RUN_ACTS,
}

/**
 * Verdant Leaf - All tiles debuffed until 1 Decree sold
 */
export const VERDANT_LEAF: MandateDefinition = {
  id: 'verdant_leaf',
  name: 'Verdant Leaf',
  japaneseName: '翠緑の葉',
  description: 'Every tile scores nothing until you sell a Decree',
  category: 'Showdown',
  difficulty: 'Extreme',
  effect: { type: 'debuff_until_sell' },
  minAct: NORMAL_RUN_ACTS,
}

/**
 * Violet Vessel - Extra-extra large target (6x instead of 2x)
 */
export const VIOLET_VESSEL: MandateDefinition = {
  id: 'violet_vessel',
  name: 'Violet Vessel',
  japaneseName: '紫水瓶',
  description: 'Score target ×6 instead of the usual Boss ×2',
  category: 'Showdown',
  difficulty: 'Extreme',
  effect: { type: 'score_multiplier', value: 6 },
  minAct: NORMAL_RUN_ACTS,
}

/**
 * Crimson Heart - One random Decree disabled every hand cycle
 */
export const CRIMSON_HEART: MandateDefinition = {
  id: 'crimson_heart',
  name: 'Crimson Heart',
  japaneseName: '深紅の心',
  description: 'A random Decree is switched off for each play',
  category: 'Showdown',
  difficulty: 'Hard',
  effect: { type: 'disable_random_decree' },
  minAct: NORMAL_RUN_ACTS,
}

/**
 * Cerulean Bell - One tile force-locked every draw
 */
export const CERULEAN_BELL: MandateDefinition = {
  id: 'cerulean_bell',
  name: 'Cerulean Bell',
  japaneseName: '青藍の鈴',
  description:
    'After each draw, one random rack tile is locked and must be in your next play. The previous lock is released.',
  category: 'Showdown',
  difficulty: 'Hard',
  effect: { type: 'lock_random_tile' },
  minAct: NORMAL_RUN_ACTS,
}

// =============================================================================
// MANDATE COLLECTIONS
// =============================================================================

/**
 * All standard boss mandates (23 total per ITEM_LIBRARIES.md A8)
 */
export const STANDARD_MANDATES: MandateDefinition[] = [
  THE_HOOK,
  THE_WALL,
  THE_EYE,
  THE_MOUTH,
  THE_FLINT,
  THE_NEEDLE,
  THE_PILLAR,
  THE_WATER,
  THE_ARM,
  THE_PSYCHIC,
  THE_CLUB,
  THE_GOAD,
  THE_WINDOW,
  THE_HEAD,
  THE_PLANT,
  THE_OX,
  THE_HOUSE,
  THE_WHEEL,
  THE_FISH,
  THE_SERPENT,
  THE_TOOTH,
  THE_MARK,
  THE_MANACLE,
]

/**
 * All showdown mandates (campaign finale and periodic Endless bosses)
 */
export const SHOWDOWN_MANDATE_DEFINITIONS: MandateDefinition[] = [
  AMBER_ACORN,
  VERDANT_LEAF,
  VIOLET_VESSEL,
  CRIMSON_HEART,
  CERULEAN_BELL,
]

/**
 * All mandates combined
 */
export const ALL_MANDATES: MandateDefinition[] = [
  ...STANDARD_MANDATES,
  ...SHOWDOWN_MANDATE_DEFINITIONS,
]

// =============================================================================
// ROUND TYPE DEFINITIONS
// =============================================================================

/**
 * Round types within an act
 */
export type RoundTypeConfig = 'Small' | 'Large' | 'Boss'

/**
 * Round configuration with multipliers and properties
 */
export interface RoundTypeDefinition {
  type: RoundTypeConfig
  japaneseName: string
  scoreMultiplier: number
  canSkip: boolean
  hasMandate: boolean
}

/**
 * Round type configurations
 */
export const ROUND_TYPE_DEFINITIONS: Record<
  RoundTypeConfig,
  RoundTypeDefinition
> = {
  Small: {
    type: 'Small',
    japaneseName: '小局',
    scoreMultiplier: 1.0,
    canSkip: true,
    hasMandate: false,
  },
  Large: {
    type: 'Large',
    japaneseName: '大局',
    scoreMultiplier: 1.5,
    canSkip: true,
    hasMandate: false,
  },
  Boss: {
    type: 'Boss',
    japaneseName: '親局',
    scoreMultiplier: 2.0,
    canSkip: false,
    hasMandate: true,
  },
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get mandate definition by ID
 */
export function getMandateById(id: string): MandateDefinition | undefined {
  return ALL_MANDATES.find((m) => m.id === id)
}

/**
 * Get mandates available for a specific act
 */
export function getMandatesForAct(actNumber: number): MandateDefinition[] {
  if (isShowdownAct(actNumber)) {
    return SHOWDOWN_MANDATE_DEFINITIONS
  }

  // Standard mandates filter by minAct
  return STANDARD_MANDATES.filter((m) => m.minAct <= actNumber)
}

/**
 * Get a random mandate for a specific act
 */
export function selectRandomMandate(
  actNumber: number,
  excludeIds: string[] = [],
  seed?: number
): MandateDefinition {
  const available = getMandatesForAct(actNumber).filter(
    (m) => !excludeIds.includes(m.id)
  )

  if (available.length === 0) {
    // Fallback to early game mandates
    const fallback = STANDARD_MANDATES.filter((m) => m.minAct === 1)
    const index =
      seed !== undefined
        ? Math.floor(createSeededRandom(seed)() * fallback.length)
        : Math.floor(runRandom.next('mandates') * fallback.length)
    return fallback[index]
  }

  const index =
    seed !== undefined
      ? Math.floor(createSeededRandom(seed)() * available.length)
      : Math.floor(runRandom.next('mandates') * available.length)

  return available[index]
}

/**
 * Get mandates by difficulty
 */
export function getMandatesByDifficulty(
  difficulty: MandateDifficulty
): MandateDefinition[] {
  return ALL_MANDATES.filter((m) => m.difficulty === difficulty)
}

/**
 * Get mandates by category
 */
export function getMandatesByCategory(
  category: MandateCategory
): MandateDefinition[] {
  return ALL_MANDATES.filter((m) => m.category === category)
}

/**
 * Check if a mandate affects scoring
 */
export function isScoringMandate(mandate: MandateDefinition): boolean {
  return [
    'score_multiplier',
    'halve_score',
    'no_repeat_pattern',
    'single_play_pattern',
    'decrease_play_level',
  ].includes(mandate.effect.type)
}

/**
 * Check if a mandate affects tile state
 */
export function isTileMandate(mandate: MandateDefinition): boolean {
  return [
    'debuff_suit',
    'debuff_tile_type',
    'debuff_used_tiles',
    'debuff_until_sell',
    'lock_random_tile',
  ].includes(mandate.effect.type)
}

/**
 * Check if a mandate affects gameplay resources
 */
export function isResourceMandate(mandate: MandateDefinition): boolean {
  return [
    'discard_after_draw',
    'no_discards',
    'single_hand',
    'fixed_hand_size',
  ].includes(mandate.effect.type)
}

/**
 * Check if a mandate affects decrees
 */
export function isDecreeMandate(mandate: MandateDefinition): boolean {
  return ['hide_half_decrees', 'disable_random_decree'].includes(
    mandate.effect.type
  )
}
