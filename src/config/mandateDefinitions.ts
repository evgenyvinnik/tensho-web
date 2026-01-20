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
  | 'no_repeat_yaku' // The Eye: Each yaku only scores once
  | 'single_yaku_type' // The Mouth: Only one yaku type per round
  | 'halve_score' // The Flint: Base points and mult halved
  | 'single_hand' // The Needle: Must complete in 1 hand
  | 'debuff_used_tiles' // The Pillar: Previously used tiles debuffed
  | 'no_discards' // The Water: 0 redraws this round
  | 'decrease_yaku_tier' // The Arm: Yaku tier decreased by 1
  | 'fixed_hand_size' // The Psychic: Must play exactly N tiles
  | 'debuff_suit' // The Club/Goad/Window: Specific suit debuffed
  | 'debuff_tile_type' // The Head/Plant: Specific tile type debuffed
  | 'hand_size_reduction' // The Manacle: Reduce hand size by N
  | 'gold_per_tile' // The Tooth: Lose gold per tile played
  | 'most_played_yaku_zeroes_gold' // The Ox: Playing most-played yaku sets gold to 0
  | 'first_hand_face_down' // The House: First hand drawn face-down
  | 'tiles_face_down_ratio' // The Wheel: 1 in N tiles drawn face-down
  | 'tiles_face_down_after_play' // The Fish: Tiles face-down after each hand
  | 'fixed_draw_count' // The Serpent: Always draw N tiles after play/discard
  | 'honor_tiles_face_down' // The Mark: All honor tiles drawn face-down
  // Showdown Mandates (Act 8+)
  | 'shuffle_decrees' // Amber Acorn: Decrees shuffled and face-down
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
  description: '2 random tiles discarded from hand after each draw',
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
  description: 'Extra large score requirement (4x instead of 2x)',
  category: 'Standard',
  difficulty: 'Hard',
  effect: { type: 'score_multiplier', value: 4 },
  minAct: 2,
}

/**
 * The Eye - No repeat yaku this round
 */
export const THE_EYE: MandateDefinition = {
  id: 'the_eye',
  name: 'The Eye',
  japaneseName: '目',
  description: 'No repeat yaku this round (each yaku only scores once)',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'no_repeat_yaku' },
  minAct: 3,
}

/**
 * The Mouth - Only one yaku type can be scored
 */
export const THE_MOUTH: MandateDefinition = {
  id: 'the_mouth',
  name: 'The Mouth',
  japaneseName: '口',
  description: 'Only one yaku type can be scored this round',
  category: 'Standard',
  difficulty: 'Hard',
  effect: { type: 'single_yaku_type' },
  minAct: 2,
}

/**
 * The Flint - Base points and Mult halved
 */
export const THE_FLINT: MandateDefinition = {
  id: 'the_flint',
  name: 'The Flint',
  japaneseName: '火打石',
  description: 'Base points and Mult halved for entire round',
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
  description: 'Must complete hand in exactly 1 hand (no retries)',
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
  description: 'Tiles used in previous rounds this Act are debuffed',
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
  description: 'Start with 0 redraws this round',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'no_discards' },
  minAct: 2,
}

/**
 * The Arm - Yaku tier decreased by 1 for scoring
 */
export const THE_ARM: MandateDefinition = {
  id: 'the_arm',
  name: 'The Arm',
  japaneseName: '腕',
  description: 'Yaku tier decreased by 1 for scoring',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'decrease_yaku_tier', value: 1 },
  minAct: 2,
}

/**
 * The Psychic - Must play exactly 5 tiles per hand
 */
export const THE_PSYCHIC: MandateDefinition = {
  id: 'the_psychic',
  name: 'The Psychic',
  japaneseName: '霊能者',
  description: 'Must play exactly 5 tiles per hand',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'fixed_hand_size', value: 5 },
  minAct: 1,
}

/**
 * The Club - All Souzu tiles are debuffed
 */
export const THE_CLUB: MandateDefinition = {
  id: 'the_club',
  name: 'The Club',
  japaneseName: '棍',
  description: 'All Souzu tiles are debuffed',
  category: 'Standard',
  difficulty: 'Easy',
  effect: { type: 'debuff_suit', target: 'souzu' },
  minAct: 1,
}

/**
 * The Goad - All Pinzu tiles are debuffed
 */
export const THE_GOAD: MandateDefinition = {
  id: 'the_goad',
  name: 'The Goad',
  japaneseName: '突棒',
  description: 'All Pinzu tiles are debuffed',
  category: 'Standard',
  difficulty: 'Easy',
  effect: { type: 'debuff_suit', target: 'pinzu' },
  minAct: 1,
}

/**
 * The Window - All Manzu tiles are debuffed
 */
export const THE_WINDOW: MandateDefinition = {
  id: 'the_window',
  name: 'The Window',
  japaneseName: '窓',
  description: 'All Manzu tiles are debuffed',
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
  description: 'All Dragon tiles are debuffed',
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
  description: 'All Honor tiles are debuffed',
  category: 'Standard',
  difficulty: 'Hard',
  effect: { type: 'debuff_tile_type', target: 'honor' },
  minAct: 4,
}

/**
 * The Ox - Playing most-played Yaku sets gold to 0
 */
export const THE_OX: MandateDefinition = {
  id: 'the_ox',
  name: 'The Ox',
  japaneseName: '牛',
  description: 'Playing most-played Yaku sets gold to 0',
  category: 'Standard',
  difficulty: 'Hard',
  effect: { type: 'most_played_yaku_zeroes_gold' },
  minAct: 6,
}

/**
 * The House - First hand drawn face-down
 */
export const THE_HOUSE: MandateDefinition = {
  id: 'the_house',
  name: 'The House',
  japaneseName: '家',
  description: 'First hand drawn face-down',
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
  description: 'Tiles drawn face-down after each hand',
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
  description: 'After play/discard, always draw 3 tiles',
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
 * The Mark - All Honor tiles drawn face-down
 */
export const THE_MARK: MandateDefinition = {
  id: 'the_mark',
  name: 'The Mark',
  japaneseName: '印',
  description: 'All Honor tiles drawn face-down',
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
  description: '-1 Hand Size',
  category: 'Standard',
  difficulty: 'Medium',
  effect: { type: 'hand_size_reduction', value: 1 },
  minAct: 1,
}

// =============================================================================
// SHOWDOWN MANDATES (Act 8+)
// =============================================================================

/**
 * Amber Acorn - All Decrees shuffled and face-down
 */
export const AMBER_ACORN: MandateDefinition = {
  id: 'amber_acorn',
  name: 'Amber Acorn',
  japaneseName: '琥珀の実',
  description: 'All Decrees are shuffled and face-down',
  category: 'Showdown',
  difficulty: 'Hard',
  effect: { type: 'shuffle_decrees' },
  minAct: 8,
}

/**
 * Verdant Leaf - All tiles debuffed until 1 Decree sold
 */
export const VERDANT_LEAF: MandateDefinition = {
  id: 'verdant_leaf',
  name: 'Verdant Leaf',
  japaneseName: '翠緑の葉',
  description: 'All tiles debuffed until 1 Decree is sold',
  category: 'Showdown',
  difficulty: 'Extreme',
  effect: { type: 'debuff_until_sell' },
  minAct: 8,
}

/**
 * Violet Vessel - Extra-extra large target (6x instead of 2x)
 */
export const VIOLET_VESSEL: MandateDefinition = {
  id: 'violet_vessel',
  name: 'Violet Vessel',
  japaneseName: '紫水瓶',
  description: 'Extra-extra large target (6x instead of 2x)',
  category: 'Showdown',
  difficulty: 'Extreme',
  effect: { type: 'score_multiplier', value: 6 },
  minAct: 8,
}

/**
 * Crimson Heart - One random Decree disabled every hand cycle
 */
export const CRIMSON_HEART: MandateDefinition = {
  id: 'crimson_heart',
  name: 'Crimson Heart',
  japaneseName: '深紅の心',
  description: 'One random Decree disabled every hand cycle',
  category: 'Showdown',
  difficulty: 'Hard',
  effect: { type: 'disable_random_decree' },
  minAct: 8,
}

/**
 * Cerulean Bell - One tile force-locked every draw
 */
export const CERULEAN_BELL: MandateDefinition = {
  id: 'cerulean_bell',
  name: 'Cerulean Bell',
  japaneseName: '青藍の鈴',
  description: 'One tile is force-locked every draw',
  category: 'Showdown',
  difficulty: 'Hard',
  effect: { type: 'lock_random_tile' },
  minAct: 8,
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
 * All showdown mandates (Act 8+)
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
export const ROUND_TYPE_DEFINITIONS: Record<RoundTypeConfig, RoundTypeDefinition> = {
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
  // Showdown mandates only appear at Act 8 and every 8 acts thereafter
  if (actNumber >= 8 && actNumber % 8 === 0) {
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
    const index = seed !== undefined
      ? Math.floor(mulberry32(seed)() * fallback.length)
      : Math.floor(Math.random() * fallback.length)
    return fallback[index]
  }

  const index = seed !== undefined
    ? Math.floor(mulberry32(seed)() * available.length)
    : Math.floor(Math.random() * available.length)

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
    'no_repeat_yaku',
    'single_yaku_type',
    'decrease_yaku_tier',
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
  return [
    'shuffle_decrees',
    'disable_random_decree',
  ].includes(mandate.effect.type)
}

/**
 * Simple seeded random number generator (mulberry32)
 */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
