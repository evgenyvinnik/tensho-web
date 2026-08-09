/**
 * Omen Tag Definitions for Tensho Mahjong Roguelike
 *
 * Omen Tags are one-time destiny modifiers awarded when skipping Small/Large Rounds.
 * They trigger once, then vanish. Some can lock the next Season type as a trade-off.
 *
 * Based on ARCHITECTURE.MD Section 7 (Omen Tags) and Section 20 (Skipping Rounds).
 */

import type { SeasonVariant, DecreeRarity, PackType } from '../systems/types'

type TileEdition = 'Foil' | 'Holographic' | 'Polychrome' | 'Negative'

// =============================================================================
// OMEN TYPES
// =============================================================================

/**
 * Categories of omen tags based on their effect type
 */
export type OmenCategory =
  | 'Economy' // Gold and resource bonuses
  | 'Shop' // Shop-related effects
  | 'Scoring' // Score multipliers and bonuses
  | 'Hand' // Hand manipulation effects
  | 'Consumable' // Affects consumables (Seals, Orbs, Scripts)
  | 'Scaling' // Effects that grow with conditions

/**
 * Rarity tiers for omen tags
 */
export type OmenRarity =
  | 'Common' // Frequently appears
  | 'Uncommon' // Standard appearance
  | 'Rare' // Less frequent, stronger effects
  | 'Legendary' // Very rare, powerful effects

/**
 * Effect trigger timing for omens
 */
export type OmenTrigger =
  | 'OnNextShop' // Triggers when entering the next shop
  | 'OnNextRound' // Triggers at the start of the next round
  | 'OnNextHand' // Triggers on the next hand played
  | 'OnNextVoidScript' // Triggers when using the next Void Script
  | 'OnAcquire' // Triggers immediately when acquired
  | 'Passive' // Provides passive bonus until consumed
  | 'OnRoundSkip' // Triggers for each round skipped

/**
 * Omen effect types
 */
export type OmenEffectType =
  | 'guaranteed_item' // Guarantees specific item type in shop
  | 'gold_bonus' // Flat gold bonus
  | 'gold_per_skip' // Gold per round skipped this run
  | 'mult_bonus' // Multiplier bonus
  | 'mult_per_skip' // Multiplier per round skipped
  | 'discard_refund' // Additional discards
  | 'draw_bonus' // Additional draws
  | 'consumable_upgrade' // Upgrades consumable effects
  | 'free_reroll' // Free shop rerolls
  | 'discount' // Shop discounts
  | 'decree_slot' // Extra decree slot
  | 'hand_size_bonus' // Temporary hand size increase
  | 'score_bonus' // Flat score bonus
  | 'edition_apply' // Apply edition to tiles/decrees
  | 'interest_boost' // Increased interest cap
  | 'season_lock' // Locks next season type
  // Legacy aliases retained for consumers written against the first Omen API.
  | 'goldBonus'
  | 'economyScaling'
  | 'freeDecree'
  | 'freeEdition'
  | 'freePack'
  | 'guaranteedItem'
  | 'decreeEdition'
  | 'drawBonus'
  | 'discardBonus'

/**
 * Omen effect data
 */
export interface OmenEffect {
  type: OmenEffectType
  value: number | string
  description: string
  /** For guaranteed_item: type of item guaranteed */
  itemType?: 'Decree' | 'FateSeal' | 'CelestialOrb' | 'VoidScript' | 'BlessingPack'
  /** For edition_apply: the edition type */
  editionType?: 'Foil' | 'Holographic' | 'Polychrome' | 'Negative'
  /** For mult_per_skip: whether it scales per skip */
  scalesWithSkips?: boolean
  /** Legacy effect fields used by older integrations. */
  maxValue?: number
  scalingCondition?: 'handsPlayed' | 'unusedDiscards' | 'roundsSkipped'
  rarity?: DecreeRarity
  edition?: TileEdition
  packType?: PackType
}

/**
 * Trade-off for acquiring an omen
 */
export interface OmenTradeoff {
  type: 'lock_season' | 'lose_gold' | 'reduce_hand_size' | 'no_interest' | 'none'
  value?: SeasonVariant | number
  description: string
}

/**
 * Full omen tag definition
 */
export interface OmenDefinition {
  id: string
  name: string
  japaneseName: string
  description: string
  category: OmenCategory
  rarity: OmenRarity
  trigger: OmenTrigger
  effect: OmenEffect
  tradeoff: OmenTradeoff
  /** Round types that can award this omen when skipped */
  awardedFromSkip: ('Small' | 'Large')[]
}

// =============================================================================
// OMEN DEFINITIONS
// =============================================================================

/**
 * Omen of Crescents - Next shop guarantees a Celestial Orb
 */
export const OMEN_OF_CRESCENTS: OmenDefinition = {
  id: 'omen_of_crescents',
  name: 'Omen of Crescents',
  japaneseName: '三日月の兆',
  description: 'Next shop guarantees a Celestial Orb in item slots.',
  category: 'Shop',
  rarity: 'Uncommon',
  trigger: 'OnNextShop',
  effect: {
    type: 'guaranteed_item',
    value: 1,
    description: 'Guarantees 1 Celestial Orb in shop',
    itemType: 'CelestialOrb',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Omen of Ash - Next Void Script has no downside
 */
export const OMEN_OF_ASH: OmenDefinition = {
  id: 'omen_of_ash',
  name: 'Omen of Ash',
  japaneseName: '灰燼の兆',
  description: 'Next Void Script used has no downside effect.',
  category: 'Consumable',
  rarity: 'Rare',
  trigger: 'OnNextVoidScript',
  effect: {
    type: 'consumable_upgrade',
    value: 1,
    description: 'Negates Void Script downside',
  },
  tradeoff: {
    type: 'lock_season',
    value: 'Winter',
    description: 'Next Season drawn is locked to Winter',
  },
  awardedFromSkip: ['Large'],
}

/**
 * Omen of Rivers - Next round starts with +1 discard refund
 */
export const OMEN_OF_RIVERS: OmenDefinition = {
  id: 'omen_of_rivers',
  name: 'Omen of Rivers',
  japaneseName: '河流の兆',
  description: 'Next round starts with +1 additional discard.',
  category: 'Hand',
  rarity: 'Common',
  trigger: 'OnNextRound',
  effect: {
    type: 'discard_refund',
    value: 1,
    description: '+1 discard in next round',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Speed Omen - Grants 5 Gold per round skipped this run
 */
export const SPEED_OMEN: OmenDefinition = {
  id: 'speed_omen',
  name: 'Speed Omen',
  japaneseName: '疾走の兆',
  description: 'Grants 5 Gold per round skipped this run.',
  category: 'Economy',
  rarity: 'Uncommon',
  trigger: 'OnAcquire',
  effect: {
    type: 'gold_per_skip',
    value: 5,
    description: '+5 Gold per skipped round',
    scalesWithSkips: true,
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Throwback Omen - Gains x0.25 Mult per skipped round
 */
export const THROWBACK_OMEN: OmenDefinition = {
  id: 'throwback_omen',
  name: 'Throwback Omen',
  japaneseName: '回帰の兆',
  description: 'Gains x0.25 Mult per skipped round for the rest of the run.',
  category: 'Scaling',
  rarity: 'Rare',
  trigger: 'Passive',
  effect: {
    type: 'mult_per_skip',
    value: 0.25,
    description: '+0.25x Mult per skip',
    scalesWithSkips: true,
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Large'],
}

/**
 * Fortune Omen - Gain 10 Gold immediately
 */
export const FORTUNE_OMEN: OmenDefinition = {
  id: 'fortune_omen',
  name: 'Fortune Omen',
  japaneseName: '富財の兆',
  description: 'Immediately gain 10 Gold.',
  category: 'Economy',
  rarity: 'Common',
  trigger: 'OnAcquire',
  effect: {
    type: 'gold_bonus',
    value: 10,
    description: '+10 Gold',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small'],
}

/**
 * Oracle's Omen - Next shop has 2 free rerolls
 */
export const ORACLES_OMEN: OmenDefinition = {
  id: 'oracles_omen',
  name: "Oracle's Omen",
  japaneseName: '神託の兆',
  description: 'Next shop has 2 free rerolls.',
  category: 'Shop',
  rarity: 'Common',
  trigger: 'OnNextShop',
  effect: {
    type: 'free_reroll',
    value: 2,
    description: '2 free shop rerolls',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Merchant's Omen - Next shop has 25% discount on all items
 */
export const MERCHANTS_OMEN: OmenDefinition = {
  id: 'merchants_omen',
  name: "Merchant's Omen",
  japaneseName: '商賈の兆',
  description: 'Next shop has 25% discount on all items.',
  category: 'Shop',
  rarity: 'Uncommon',
  trigger: 'OnNextShop',
  effect: {
    type: 'discount',
    value: 0.25,
    description: '25% shop discount',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Seal Omen - Next shop guarantees a Fate Seal
 */
export const SEAL_OMEN: OmenDefinition = {
  id: 'seal_omen',
  name: 'Seal Omen',
  japaneseName: '封印の兆',
  description: 'Next shop guarantees a Fate Seal in item slots.',
  category: 'Shop',
  rarity: 'Common',
  trigger: 'OnNextShop',
  effect: {
    type: 'guaranteed_item',
    value: 1,
    description: 'Guarantees 1 Fate Seal in shop',
    itemType: 'FateSeal',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small'],
}

/**
 * Decree Omen - Next shop guarantees a Rare Decree
 */
export const DECREE_OMEN: OmenDefinition = {
  id: 'decree_omen',
  name: 'Decree Omen',
  japaneseName: '法令の兆',
  description: 'Next shop guarantees a Rare or better Decree.',
  category: 'Shop',
  rarity: 'Rare',
  trigger: 'OnNextShop',
  effect: {
    type: 'guaranteed_item',
    value: 1,
    description: 'Guarantees Rare+ Decree in shop',
    itemType: 'Decree',
  },
  tradeoff: {
    type: 'lose_gold',
    value: 5,
    description: 'Lose 5 Gold on next shop entry',
  },
  awardedFromSkip: ['Large'],
}

/**
 * Void Omen - Next shop offers a Void Script
 */
export const VOID_OMEN: OmenDefinition = {
  id: 'void_omen',
  name: 'Void Omen',
  japaneseName: '虚空の兆',
  description: 'Next shop offers a Void Script in item slots.',
  category: 'Shop',
  rarity: 'Rare',
  trigger: 'OnNextShop',
  effect: {
    type: 'guaranteed_item',
    value: 1,
    description: 'Void Script appears in shop',
    itemType: 'VoidScript',
  },
  tradeoff: {
    type: 'lock_season',
    value: 'Autumn',
    description: 'Next Season drawn is locked to Autumn',
  },
  awardedFromSkip: ['Large'],
}

/**
 * Expansion Omen - Temporarily gain +1 decree slot for next round
 */
export const EXPANSION_OMEN: OmenDefinition = {
  id: 'expansion_omen',
  name: 'Expansion Omen',
  japaneseName: '拡張の兆',
  description: 'Gain +1 decree slot permanently.',
  category: 'Hand',
  rarity: 'Legendary',
  trigger: 'OnAcquire',
  effect: {
    type: 'decree_slot',
    value: 1,
    description: '+1 Decree slot',
  },
  tradeoff: {
    type: 'lock_season',
    value: 'Summer',
    description: 'Next Season drawn is locked to Summer',
  },
  awardedFromSkip: ['Large'],
}

/**
 * Precision Omen - Next hand gains +2 to hand size
 */
export const PRECISION_OMEN: OmenDefinition = {
  id: 'precision_omen',
  name: 'Precision Omen',
  japaneseName: '精密の兆',
  description: 'Next round: +2 hand size.',
  category: 'Hand',
  rarity: 'Uncommon',
  trigger: 'OnNextRound',
  effect: {
    type: 'hand_size_bonus',
    value: 2,
    description: '+2 hand size in next round',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Abundance Omen - Next round starts with +2 draws
 */
export const ABUNDANCE_OMEN: OmenDefinition = {
  id: 'abundance_omen',
  name: 'Abundance Omen',
  japaneseName: '豊穣の兆',
  description: 'Next round starts with +2 additional draws.',
  category: 'Hand',
  rarity: 'Common',
  trigger: 'OnNextRound',
  effect: {
    type: 'draw_bonus',
    value: 2,
    description: '+2 draws in next round',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small'],
}

/**
 * Polychrome Omen - Apply Polychrome edition to a random Decree
 */
export const POLYCHROME_OMEN: OmenDefinition = {
  id: 'polychrome_omen',
  name: 'Polychrome Omen',
  japaneseName: '極彩の兆',
  description: 'Apply Polychrome edition to a random owned Decree.',
  category: 'Consumable',
  rarity: 'Legendary',
  trigger: 'OnAcquire',
  effect: {
    type: 'edition_apply',
    value: 1,
    description: 'Apply Polychrome to Decree',
    editionType: 'Polychrome',
  },
  tradeoff: {
    type: 'lock_season',
    value: 'Spring',
    description: 'Next Season drawn is locked to Spring',
  },
  awardedFromSkip: ['Large'],
}

/**
 * Foil Omen - Apply Foil edition to next purchased Decree
 */
export const FOIL_OMEN: OmenDefinition = {
  id: 'foil_omen',
  name: 'Foil Omen',
  japaneseName: '箔押の兆',
  description: 'Next purchased Decree gains Foil edition.',
  category: 'Shop',
  rarity: 'Uncommon',
  trigger: 'OnNextShop',
  effect: {
    type: 'edition_apply',
    value: 1,
    description: 'Foil edition on next Decree',
    editionType: 'Foil',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Interest Omen - Interest cap +2 for 3 rounds
 */
export const INTEREST_OMEN: OmenDefinition = {
  id: 'interest_omen',
  name: 'Interest Omen',
  japaneseName: '利殖の兆',
  description: 'Interest cap increased by 2 for 3 rounds.',
  category: 'Economy',
  rarity: 'Uncommon',
  trigger: 'OnAcquire',
  effect: {
    type: 'interest_boost',
    value: 2,
    description: '+2 interest cap for 3 rounds',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Score Surge Omen - +100 base score on next hand
 */
export const SCORE_SURGE_OMEN: OmenDefinition = {
  id: 'score_surge_omen',
  name: 'Score Surge Omen',
  japaneseName: '得点の兆',
  description: 'Next scored hand gains +100 base points.',
  category: 'Scoring',
  rarity: 'Common',
  trigger: 'OnNextHand',
  effect: {
    type: 'score_bonus',
    value: 100,
    description: '+100 base points',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small'],
}

/**
 * Multiplication Omen - x1.5 Mult on next hand
 */
export const MULTIPLICATION_OMEN: OmenDefinition = {
  id: 'multiplication_omen',
  name: 'Multiplication Omen',
  japaneseName: '倍増の兆',
  description: 'Next scored hand gains x1.5 Mult.',
  category: 'Scoring',
  rarity: 'Uncommon',
  trigger: 'OnNextHand',
  effect: {
    type: 'mult_bonus',
    value: 1.5,
    description: 'x1.5 Mult',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Blessing Pack Omen - Next shop offers a free Blessing Pack
 */
export const BLESSING_PACK_OMEN: OmenDefinition = {
  id: 'blessing_pack_omen',
  name: 'Blessing Pack Omen',
  japaneseName: '祝福袋の兆',
  description: 'Next shop includes a free Blessing Pack.',
  category: 'Shop',
  rarity: 'Uncommon',
  trigger: 'OnNextShop',
  effect: {
    type: 'guaranteed_item',
    value: 1,
    description: 'Free Blessing Pack in shop',
    itemType: 'BlessingPack',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Negative Omen - Next purchased Decree gains Negative edition
 */
export const NEGATIVE_OMEN: OmenDefinition = {
  id: 'negative_omen',
  name: 'Negative Omen',
  japaneseName: '陰影の兆',
  description: 'Next purchased Decree gains Negative edition (+1 slot).',
  category: 'Shop',
  rarity: 'Legendary',
  trigger: 'OnNextShop',
  effect: {
    type: 'edition_apply',
    value: 1,
    description: 'Negative edition on next Decree',
    editionType: 'Negative',
  },
  tradeoff: {
    type: 'lock_season',
    value: 'Winter',
    description: 'Next Season drawn is locked to Winter',
  },
  awardedFromSkip: ['Large'],
}

/**
 * Austerity Omen - No interest this round but gain 15 Gold
 */
export const AUSTERITY_OMEN: OmenDefinition = {
  id: 'austerity_omen',
  name: 'Austerity Omen',
  japaneseName: '節制の兆',
  description: 'Immediately gain 15 Gold, but no interest next round.',
  category: 'Economy',
  rarity: 'Uncommon',
  trigger: 'OnAcquire',
  effect: {
    type: 'gold_bonus',
    value: 15,
    description: '+15 Gold immediately',
  },
  tradeoff: {
    type: 'no_interest',
    value: 1,
    description: 'No interest for 1 round',
  },
  awardedFromSkip: ['Small', 'Large'],
}

/**
 * Holographic Omen - Apply Holographic edition to next purchased Decree
 */
export const HOLOGRAPHIC_OMEN: OmenDefinition = {
  id: 'holographic_omen',
  name: 'Holographic Omen',
  japaneseName: '虹彩の兆',
  description: 'Next purchased Decree gains Holographic edition.',
  category: 'Shop',
  rarity: 'Rare',
  trigger: 'OnNextShop',
  effect: {
    type: 'edition_apply',
    value: 1,
    description: 'Holographic edition on next Decree',
    editionType: 'Holographic',
  },
  tradeoff: {
    type: 'none',
    description: 'No trade-off',
  },
  awardedFromSkip: ['Large'],
}

// =============================================================================
// OMEN COLLECTIONS
// =============================================================================

/**
 * All omen definitions
 */
export const ALL_OMENS: OmenDefinition[] = [
  OMEN_OF_CRESCENTS,
  OMEN_OF_ASH,
  OMEN_OF_RIVERS,
  SPEED_OMEN,
  THROWBACK_OMEN,
  FORTUNE_OMEN,
  ORACLES_OMEN,
  MERCHANTS_OMEN,
  SEAL_OMEN,
  DECREE_OMEN,
  VOID_OMEN,
  EXPANSION_OMEN,
  PRECISION_OMEN,
  ABUNDANCE_OMEN,
  POLYCHROME_OMEN,
  FOIL_OMEN,
  INTEREST_OMEN,
  SCORE_SURGE_OMEN,
  MULTIPLICATION_OMEN,
  BLESSING_PACK_OMEN,
  NEGATIVE_OMEN,
  AUSTERITY_OMEN,
  HOLOGRAPHIC_OMEN,
]

/**
 * Omens available when skipping Small Rounds
 */
export const SMALL_ROUND_OMENS: OmenDefinition[] = ALL_OMENS.filter((o) =>
  o.awardedFromSkip.includes('Small')
)

/**
 * Omens available when skipping Large Rounds
 */
export const LARGE_ROUND_OMENS: OmenDefinition[] = ALL_OMENS.filter((o) =>
  o.awardedFromSkip.includes('Large')
)

/**
 * Get omens by rarity
 */
export function getOmensByRarity(rarity: OmenRarity): OmenDefinition[] {
  return ALL_OMENS.filter((o) => o.rarity === rarity)
}

/**
 * Get omens by category
 */
export function getOmensByCategory(category: OmenCategory): OmenDefinition[] {
  return ALL_OMENS.filter((o) => o.category === category)
}

/**
 * Get omen by ID
 */
export function getOmenById(id: string): OmenDefinition | undefined {
  return ALL_OMENS.find((o) => o.id === id)
}

/**
 * Rarity weights for random selection
 */
export const OMEN_RARITY_WEIGHTS: Record<OmenRarity, number> = {
  Common: 50,
  Uncommon: 30,
  Rare: 15,
  Legendary: 5,
}

/**
 * Get a random omen based on rarity weights
 */
export function getRandomOmen(
  roundType: 'Small' | 'Large',
  excludeIds: string[] = [],
  random: () => number = Math.random
): OmenDefinition | null {
  const availableOmens =
    roundType === 'Small' ? SMALL_ROUND_OMENS : LARGE_ROUND_OMENS
  const filteredOmens = availableOmens.filter((o) => !excludeIds.includes(o.id))

  if (filteredOmens.length === 0) {
    return null
  }

  // Calculate total weight
  const totalWeight = filteredOmens.reduce(
    (sum, o) => sum + OMEN_RARITY_WEIGHTS[o.rarity],
    0
  )

  // Random selection based on weights
  let roll = random() * totalWeight
  for (const omen of filteredOmens) {
    roll -= OMEN_RARITY_WEIGHTS[omen.rarity]
    if (roll <= 0) {
      return omen
    }
  }

  // Fallback to last omen
  return filteredOmens[filteredOmens.length - 1]
}

/**
 * Get weighted random omen for specific round type
 * Large rounds have higher chance of rare omens
 */
export function getRandomOmenForRound(
  roundType: 'Small' | 'Large',
  excludeIds: string[] = [],
  random: () => number = Math.random
): OmenDefinition | null {
  // Large rounds have boosted rare/legendary rates
  const adjustedWeights: Record<OmenRarity, number> =
    roundType === 'Large'
      ? {
          Common: 35,
          Uncommon: 35,
          Rare: 20,
          Legendary: 10,
        }
      : OMEN_RARITY_WEIGHTS

  const availableOmens =
    roundType === 'Small' ? SMALL_ROUND_OMENS : LARGE_ROUND_OMENS
  const filteredOmens = availableOmens.filter((o) => !excludeIds.includes(o.id))

  if (filteredOmens.length === 0) {
    return null
  }

  // Calculate total weight
  const totalWeight = filteredOmens.reduce(
    (sum, o) => sum + adjustedWeights[o.rarity],
    0
  )

  // Random selection based on weights
  let roll = random() * totalWeight
  for (const omen of filteredOmens) {
    roll -= adjustedWeights[omen.rarity]
    if (roll <= 0) {
      return omen
    }
  }

  return filteredOmens[filteredOmens.length - 1]
}
