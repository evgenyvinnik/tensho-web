/**
 * Stake Definitions for Tensho Mahjong Roguelike
 *
 * Defines 8 ascending difficulty tiers that stack cumulatively.
 * Based on ARCHITECTURE.MD Section 25 - Table Stakes (場代).
 *
 * Each stake adds ALL modifiers from previous stakes, creating exponential challenge.
 */

import { StickerType } from '../systems/types'

// =============================================================================
// STAKE TYPES
// =============================================================================

/**
 * Stake modifier that affects gameplay at a specific tier
 */
export interface StakeModifier {
  /** No reward Gold from Small Rounds */
  noSmallRoundReward?: boolean
  /** Score requirement scaling multiplier */
  scoreScaling?: number
  /** Chance for Eternal sticker on shop Decrees (0-1) */
  eternalChance?: number
  /** Reduction in redraws per round */
  redrawPenalty?: number
  /** Chance for Perishable sticker on shop Decrees (0-1) */
  perishableChance?: number
  /** Chance for Rental sticker on shop Decrees (0-1) */
  rentalChance?: number
}

/**
 * Table stake tier definition
 */
export interface StakeDefinition {
  /** Tier number (1-8) */
  tier: number
  /** Display name in English */
  name: string
  /** Japanese name with kanji */
  japaneseName: string
  /** Color hex code for UI */
  color: string
  /** Description of the new modifier */
  description: string
  /** New modifier introduced at this stake */
  modifier: StakeModifier
  /** Wall variant unlocked at this stake */
  unlocksWall?: string
}

/**
 * Combined modifiers from all active stakes
 */
export interface CombinedStakeModifiers {
  noSmallRoundReward: boolean
  scoreScaling: number
  eternalChance: number
  redrawPenalty: number
  perishableChance: number
  rentalChance: number
}

/**
 * Sticker application result
 */
export interface StickerRollResult {
  stickers: StickerType[]
  hasMultiple: boolean
}

// =============================================================================
// STAKE DEFINITIONS
// =============================================================================

/**
 * All 8 table stakes as defined in ARCHITECTURE.MD
 *
 * | Tier | Name | Japanese | New Modifier | Unlocks |
 * |------|------|----------|--------------|---------|
 * | 1 | White Stake | 白場 | Base difficulty | Starting tier |
 * | 2 | Red Stake | 赤場 | Small Round gives no reward Gold | Crimson Wall |
 * | 3 | Green Stake | 緑場 | Required score scales faster | Jade Wall |
 * | 4 | Black Stake | 黒場 | 30% Eternal stickers on shop Decrees | Obsidian Wall |
 * | 5 | Blue Stake | 青場 | -1 Redraw per round | Azure Wall |
 * | 6 | Purple Stake | 紫場 | Score scales even faster | - |
 * | 7 | Orange Stake | 橙場 | 30% Perishable stickers | Sunset Wall |
 * | 8 | Gold Stake | 金場 | 30% Rental stickers | - |
 */
export const STAKE_DEFINITIONS: StakeDefinition[] = [
  {
    tier: 1,
    name: 'White Stake',
    japaneseName: '白場',
    color: '#E0E0E0',
    description: 'Base difficulty (no modifiers)',
    modifier: {},
    unlocksWall: undefined,
  },
  {
    tier: 2,
    name: 'Red Stake',
    japaneseName: '赤場',
    color: '#E53935',
    description: 'Small Round gives no reward Gold',
    modifier: { noSmallRoundReward: true },
    unlocksWall: 'crimson_wall',
  },
  {
    tier: 3,
    name: 'Green Stake',
    japaneseName: '緑場',
    color: '#43A047',
    description: 'Required score scales 30% faster per Act',
    modifier: { scoreScaling: 1.3 },
    unlocksWall: 'jade_wall',
  },
  {
    tier: 4,
    name: 'Black Stake',
    japaneseName: '黒場',
    color: '#212121',
    description: '30% chance for shop Decrees to have Eternal sticker',
    modifier: { eternalChance: 0.3 },
    unlocksWall: 'obsidian_wall',
  },
  {
    tier: 5,
    name: 'Blue Stake',
    japaneseName: '青場',
    color: '#1E88E5',
    description: '-1 Redraw per round',
    modifier: { redrawPenalty: 1 },
    unlocksWall: 'azure_wall',
  },
  {
    tier: 6,
    name: 'Purple Stake',
    japaneseName: '紫場',
    color: '#8E24AA',
    description: 'Required score scales even faster per Act',
    modifier: { scoreScaling: 1.5 },
    unlocksWall: undefined,
  },
  {
    tier: 7,
    name: 'Orange Stake',
    japaneseName: '橙場',
    color: '#FB8C00',
    description: '30% chance for shop Decrees to have Perishable sticker',
    modifier: { perishableChance: 0.3 },
    unlocksWall: 'sunset_wall',
  },
  {
    tier: 8,
    name: 'Gold Stake',
    japaneseName: '金場',
    color: '#FFD700',
    description: '30% chance for shop Decrees to have Rental sticker',
    modifier: { rentalChance: 0.3 },
    unlocksWall: undefined,
  },
]

// =============================================================================
// STICKER DEFINITIONS
// =============================================================================

/**
 * Sticker configuration for higher stakes
 */
export interface StickerConfig {
  type: StickerType
  name: string
  japaneseName: string
  description: string
  /** Minimum stake tier where this sticker appears */
  minTier: number
  /** For Perishable: rounds before debuff */
  roundsToDebuff?: number
  /** For Rental: gold cost per round */
  goldPerRound?: number
  /** For Rental: purchase cost */
  purchaseCost?: number
}

/**
 * Sticker definitions
 */
export const STICKER_DEFINITIONS: Record<StickerType, StickerConfig> = {
  Eternal: {
    type: 'Eternal',
    name: 'Eternal',
    japaneseName: '永劫貼',
    description: 'Decree cannot be sold or destroyed',
    minTier: 4,
  },
  Perishable: {
    type: 'Perishable',
    name: 'Perishable',
    japaneseName: '腐朽貼',
    description: 'Decree becomes debuffed after 5 rounds',
    minTier: 7,
    roundsToDebuff: 5,
  },
  Rental: {
    type: 'Rental',
    name: 'Rental',
    japaneseName: '租借貼',
    description: 'Costs 1 Gold to purchase, deducts 3 Gold at end of every round',
    minTier: 8,
    purchaseCost: 1,
    goldPerRound: 3,
  },
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default combined modifiers (White Stake)
 */
export const DEFAULT_STAKE_MODIFIERS: CombinedStakeModifiers = {
  noSmallRoundReward: false,
  scoreScaling: 1.0,
  eternalChance: 0,
  redrawPenalty: 0,
  perishableChance: 0,
  rentalChance: 0,
}

/**
 * Wall variants that can be unlocked through stake progression
 */
export const STAKE_WALL_UNLOCKS: Record<string, number> = {
  crimson_wall: 2,
  jade_wall: 3,
  obsidian_wall: 4,
  azure_wall: 5,
  sunset_wall: 7,
}

// =============================================================================
// CALCULATION UTILITIES
// =============================================================================

/**
 * Calculate combined modifiers for a given stake tier
 * Stakes stack cumulatively - all previous modifiers apply
 */
export function calculateCombinedModifiers(stakeTier: number): CombinedStakeModifiers {
  const combined: CombinedStakeModifiers = { ...DEFAULT_STAKE_MODIFIERS }

  for (let tier = 1; tier <= Math.min(stakeTier, 8); tier++) {
    const stake = STAKE_DEFINITIONS[tier - 1]
    if (!stake) continue

    const mod = stake.modifier

    // Boolean modifiers - once true, always true
    if (mod.noSmallRoundReward) {
      combined.noSmallRoundReward = true
    }

    // Score scaling - multiplicative stacking
    if (mod.scoreScaling) {
      combined.scoreScaling *= mod.scoreScaling
    }

    // Sticker chances - additive (each tier adds independently)
    if (mod.eternalChance) {
      combined.eternalChance = Math.min(1, combined.eternalChance + mod.eternalChance)
    }
    if (mod.perishableChance) {
      combined.perishableChance = Math.min(1, combined.perishableChance + mod.perishableChance)
    }
    if (mod.rentalChance) {
      combined.rentalChance = Math.min(1, combined.rentalChance + mod.rentalChance)
    }

    // Redraw penalty - additive
    if (mod.redrawPenalty) {
      combined.redrawPenalty += mod.redrawPenalty
    }
  }

  return combined
}

/**
 * Roll for stickers on a shop decree based on current stake
 *
 * At Gold Stake (Tier 8), combined probabilities:
 * - 28% no stickers
 * - 21.6% each for Eternal, Perishable, Rental
 * - 7.2% multiple stickers
 *
 * Rules:
 * - Eternal and Perishable cannot both apply (Eternal wins)
 * - Rental can combine with either Eternal or Perishable
 */
export function rollForStickers(stakeTier: number): StickerRollResult {
  const modifiers = calculateCombinedModifiers(stakeTier)

  const stickers: StickerType[] = []

  // Roll for each sticker type independently
  const hasEternal = Math.random() < modifiers.eternalChance
  const hasPerishable = Math.random() < modifiers.perishableChance
  const hasRental = Math.random() < modifiers.rentalChance

  // Apply Eternal (Eternal wins over Perishable)
  if (hasEternal) {
    stickers.push('Eternal')
  } else if (hasPerishable) {
    // Only apply Perishable if no Eternal
    stickers.push('Perishable')
  }

  // Rental can combine with either
  if (hasRental) {
    stickers.push('Rental')
  }

  return {
    stickers,
    hasMultiple: stickers.length > 1,
  }
}

/**
 * Get the primary sticker for a decree (for simpler implementations)
 * Priority: Eternal > Rental > Perishable
 */
export function getPrimarySticker(stakeTier: number): StickerType | null {
  const result = rollForStickers(stakeTier)
  if (result.stickers.length === 0) return null

  // Priority order
  if (result.stickers.includes('Eternal')) return 'Eternal'
  if (result.stickers.includes('Rental')) return 'Rental'
  if (result.stickers.includes('Perishable')) return 'Perishable'

  return result.stickers[0] ?? null
}

/**
 * Calculate sticker probabilities for display
 *
 * At Gold Stake (Tier 8):
 * - P(no sticker) = (1 - 0.3) * (1 - 0.3) * (1 - 0.3) = 0.343 = ~34%
 * - But since Eternal blocks Perishable:
 * - P(Eternal only) = 0.3 * (1 - 0.3) * (1 - 0.3) = 0.147
 * - P(Perishable only) = (1 - 0.3) * 0.3 * (1 - 0.3) = 0.147
 * - P(Rental only) = (1 - 0.3) * (1 - 0.3) * 0.3 = 0.147
 * - P(Eternal + Rental) = 0.3 * (1 - 0.3) * 0.3 = 0.063
 * - P(Perishable + Rental) = (1 - 0.3) * 0.3 * 0.3 = 0.063
 * - P(Eternal blocks Perishable, no Rental) = 0.3 * 0.3 * (1 - 0.3) = 0.063
 * - P(Eternal blocks Perishable, with Rental) = 0.3 * 0.3 * 0.3 = 0.027
 */
export function getStickerProbabilities(stakeTier: number): Record<string, number> {
  const modifiers = calculateCombinedModifiers(stakeTier)

  const e = modifiers.eternalChance
  const p = modifiers.perishableChance
  const r = modifiers.rentalChance

  return {
    none: (1 - e) * (1 - p) * (1 - r),
    eternalOnly: e * (1 - p) * (1 - r) + e * p * (1 - r), // Eternal blocks Perishable
    perishableOnly: (1 - e) * p * (1 - r),
    rentalOnly: (1 - e) * (1 - p) * r,
    eternalAndRental: e * (1 - p) * r + e * p * r, // Eternal blocks Perishable, has Rental
    perishableAndRental: (1 - e) * p * r,
  }
}

/**
 * Format sticker probabilities for UI display
 */
export function formatStickerProbabilities(stakeTier: number): string {
  const probs = getStickerProbabilities(stakeTier)

  const parts: string[] = []

  if (probs.none > 0.01) {
    parts.push(`${Math.round(probs.none * 100)}% None`)
  }
  if (probs.eternalOnly > 0.01) {
    parts.push(`${Math.round(probs.eternalOnly * 100)}% Eternal`)
  }
  if (probs.perishableOnly > 0.01) {
    parts.push(`${Math.round(probs.perishableOnly * 100)}% Perishable`)
  }
  if (probs.rentalOnly > 0.01) {
    parts.push(`${Math.round(probs.rentalOnly * 100)}% Rental`)
  }

  const multiple = probs.eternalAndRental + probs.perishableAndRental
  if (multiple > 0.01) {
    parts.push(`${Math.round(multiple * 100)}% Multiple`)
  }

  return parts.join(', ')
}

// =============================================================================
// LOOKUP UTILITIES
// =============================================================================

/**
 * Get stake definition by tier
 */
export function getStakeByTier(tier: number): StakeDefinition | undefined {
  return STAKE_DEFINITIONS.find((s) => s.tier === tier)
}

/**
 * Get stake tier from name (case-insensitive)
 */
export function getStakeTierByName(name: string): number | undefined {
  const stake = STAKE_DEFINITIONS.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  )
  return stake?.tier
}

/**
 * Get stake color for UI display
 */
export function getStakeColor(tier: number): string {
  return STAKE_DEFINITIONS[tier - 1]?.color ?? '#E0E0E0'
}

/**
 * Get stake Japanese name
 */
export function getStakeJapaneseName(tier: number): string {
  return STAKE_DEFINITIONS[tier - 1]?.japaneseName ?? '不明'
}

/**
 * Get wall unlock requirement tier
 */
export function getWallUnlockTier(wallId: string): number | undefined {
  return STAKE_WALL_UNLOCKS[wallId]
}

/**
 * Check if a wall is unlocked based on highest completed stake across all walls
 */
export function isWallUnlocked(wallId: string, highestCompletedStake: number): boolean {
  const requiredTier = STAKE_WALL_UNLOCKS[wallId]
  if (requiredTier === undefined) {
    // Wall doesn't require stake unlock
    return true
  }
  return highestCompletedStake >= requiredTier
}

/**
 * Get all modifier descriptions for a stake tier
 */
export function getStakeModifierDescriptions(tier: number): string[] {
  const stake = STAKE_DEFINITIONS[tier - 1]
  if (!stake) return []

  const descriptions: string[] = []
  const mod = stake.modifier

  if (mod.noSmallRoundReward) {
    descriptions.push('Small Rounds give no reward Gold')
  }
  if (mod.scoreScaling) {
    const percent = Math.round((mod.scoreScaling - 1) * 100)
    descriptions.push(`Score requirements +${percent}% scaling`)
  }
  if (mod.eternalChance) {
    descriptions.push(`${Math.round(mod.eternalChance * 100)}% Eternal stickers on shop Decrees`)
  }
  if (mod.redrawPenalty) {
    descriptions.push(`-${mod.redrawPenalty} Redraw per round`)
  }
  if (mod.perishableChance) {
    descriptions.push(`${Math.round(mod.perishableChance * 100)}% Perishable stickers on shop Decrees`)
  }
  if (mod.rentalChance) {
    descriptions.push(`${Math.round(mod.rentalChance * 100)}% Rental stickers on shop Decrees`)
  }

  return descriptions
}

/**
 * Get cumulative modifier descriptions up to a stake tier
 */
export function getCumulativeModifierDescriptions(stakeTier: number): string[] {
  const allDescriptions: string[] = []

  for (let tier = 2; tier <= Math.min(stakeTier, 8); tier++) {
    const descriptions = getStakeModifierDescriptions(tier)
    allDescriptions.push(...descriptions)
  }

  return allDescriptions
}
