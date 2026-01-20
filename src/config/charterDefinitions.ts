/**
 * Imperial Charter Definitions for Tensho Mahjong Roguelike
 *
 * Imperial Charters are permanent upgrades purchased after defeating Boss Mandates.
 * Each charter has a base version and an upgraded version.
 * The upgraded version can only appear after the base version has been purchased.
 *
 * Based on ARCHITECTURE.MD Section 28 (Imperial Charters).
 */

// =============================================================================
// CHARTER TYPES
// =============================================================================

/**
 * Effect types that charters can have
 */
export type CharterEffectType =
  | 'shop_slots' // +X shop item slots
  | 'discount' // X% off all shop items
  | 'edition_frequency' // Editions appear X times more often
  | 'reroll_discount' // Rerolls cost X Gold less
  | 'consumable_slots' // +X consumable slots
  | 'void_in_arcana' // Void Scripts may appear in Arcana Packs
  | 'celestial_favor' // Celestial Packs favor most-used yaku
  | 'orb_mult' // Held Celestial Orbs give xMult
  | 'hands' // +X hands per round
  | 'redraws' // +X redraws per round
  | 'seal_frequency' // Fate Seals appear X times more often
  | 'orb_frequency' // Celestial Orbs appear X times more often
  | 'interest_cap' // Interest cap raised to X Gold
  | 'decree_slots' // +X Decree slots
  | 'tile_shop' // Tiles can be purchased from shop
  | 'tile_editions' // Shop tiles may have editions
  | 'skip_act' // -X Act(s)
  | 'hands_penalty' // -X hands per round (negative)
  | 'redraws_penalty' // -X redraws per round (negative)
  | 'mandate_reroll' // Reroll Boss Mandate (limited or unlimited)
  | 'hand_size' // +X hand size
  | 'no_effect' // Does nothing (Empty Scroll)

/**
 * Charter effect configuration
 */
export interface CharterEffect {
  type: CharterEffectType
  value: number | string | boolean
  description: string
}

/**
 * Unlock condition for upgraded charters
 */
export interface CharterUnlockCondition {
  type:
    | 'gold_spent'
    | 'charters_redeemed'
    | 'edition_decrees'
    | 'rerolls_total'
    | 'fate_seals_from_packs'
    | 'celestial_orbs_from_packs'
    | 'tiles_played'
    | 'tiles_discarded'
    | 'fate_seals_bought'
    | 'celestial_orbs_bought'
    | 'max_interest_rounds'
    | 'empty_scroll_redeems'
    | 'tiles_bought'
    | 'act_reached'
    | 'mandates_discovered'
    | 'hand_size_reduced'
  value: number
  description: string
}

/**
 * Full charter definition
 */
export interface CharterDefinition {
  id: string
  name: string
  japaneseName: string
  description: string
  cost: number
  effects: CharterEffect[]
  upgradeId?: string // ID of the upgraded version (for base charters)
  baseId?: string // ID of the base version (for upgraded charters)
  isUpgraded: boolean
  unlockCondition?: CharterUnlockCondition
}

// =============================================================================
// BASE CHARTERS
// =============================================================================

export const CHARTER_COST = 10

/**
 * Abundant Stock - +1 shop slot (to 3)
 */
export const ABUNDANT_STOCK: CharterDefinition = {
  id: 'abundant_stock',
  name: 'Abundant Stock',
  japaneseName: '豊庫',
  description: '+1 shop slot (to 3)',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'shop_slots',
      value: 1,
      description: 'Adds 1 item slot to the shop',
    },
  ],
  upgradeId: 'plentiful_stock',
  isUpgraded: false,
}

/**
 * Discount Sale - 25% off all shop items
 */
export const DISCOUNT_SALE: CharterDefinition = {
  id: 'discount_sale',
  name: 'Discount Sale',
  japaneseName: '割引',
  description: '25% off all shop items',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'discount',
      value: 25,
      description: 'All shop items cost 25% less',
    },
  ],
  upgradeId: 'liquidation_sale',
  isUpgraded: false,
}

/**
 * Sharp Edge - Editions appear 2x more often
 */
export const SHARP_EDGE: CharterDefinition = {
  id: 'sharp_edge',
  name: 'Sharp Edge',
  japaneseName: '鋭刃',
  description: 'Editions appear 2x more often',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'edition_frequency',
      value: 2,
      description: 'Editions appear twice as often',
    },
  ],
  upgradeId: 'radiant_edge',
  isUpgraded: false,
}

/**
 * Reroll Surplus - Rerolls cost 2 Gold less
 */
export const REROLL_SURPLUS: CharterDefinition = {
  id: 'reroll_surplus',
  name: 'Reroll Surplus',
  japaneseName: '転余',
  description: 'Rerolls cost 2 Gold less',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'reroll_discount',
      value: 2,
      description: 'Rerolls cost 2 Gold less',
    },
  ],
  upgradeId: 'reroll_abundance',
  isUpgraded: false,
}

/**
 * Crystal Lens - +1 consumable slot
 */
export const CRYSTAL_LENS: CharterDefinition = {
  id: 'crystal_lens',
  name: 'Crystal Lens',
  japaneseName: '水晶',
  description: '+1 consumable slot',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'consumable_slots',
      value: 1,
      description: 'Adds 1 consumable slot',
    },
  ],
  upgradeId: 'omen_lens',
  isUpgraded: false,
}

/**
 * Star Chart - Celestial Packs favor most-used yaku
 */
export const STAR_CHART: CharterDefinition = {
  id: 'star_chart',
  name: 'Star Chart',
  japaneseName: '星図',
  description: 'Celestial Packs contain orb for most-used yaku',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'celestial_favor',
      value: true,
      description: 'Celestial Packs prioritize your most-used yaku',
    },
  ],
  upgradeId: 'observatory',
  isUpgraded: false,
}

/**
 * Steady Hand - +1 hand per round
 */
export const STEADY_HAND: CharterDefinition = {
  id: 'steady_hand',
  name: 'Steady Hand',
  japaneseName: '定手',
  description: '+1 hand per round',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'hands',
      value: 1,
      description: 'Gain 1 additional hand each round',
    },
  ],
  upgradeId: 'swift_hand',
  isUpgraded: false,
}

/**
 * Frugal Discard - +1 redraw per round
 */
export const FRUGAL_DISCARD: CharterDefinition = {
  id: 'frugal_discard',
  name: 'Frugal Discard',
  japaneseName: '倹捨',
  description: '+1 redraw per round',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'redraws',
      value: 1,
      description: 'Gain 1 additional redraw each round',
    },
  ],
  upgradeId: 'wasteful_plenty',
  isUpgraded: false,
}

/**
 * Seal Merchant - Fate Seals appear 2x more often
 */
export const SEAL_MERCHANT: CharterDefinition = {
  id: 'seal_merchant',
  name: 'Seal Merchant',
  japaneseName: '符商',
  description: 'Fate Seals appear 2x more often',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'seal_frequency',
      value: 2,
      description: 'Fate Seals appear twice as often in the shop',
    },
  ],
  upgradeId: 'seal_tycoon',
  isUpgraded: false,
}

/**
 * Orb Merchant - Celestial Orbs appear 2x more often
 */
export const ORB_MERCHANT: CharterDefinition = {
  id: 'orb_merchant',
  name: 'Orb Merchant',
  japaneseName: '球商',
  description: 'Celestial Orbs appear 2x more often',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'orb_frequency',
      value: 2,
      description: 'Celestial Orbs appear twice as often in the shop',
    },
  ],
  upgradeId: 'orb_tycoon',
  isUpgraded: false,
}

/**
 * Seed Pouch - Interest cap raised to 10 Gold
 */
export const SEED_POUCH: CharterDefinition = {
  id: 'seed_pouch',
  name: 'Seed Pouch',
  japaneseName: '種袋',
  description: 'Interest cap raised to 10 Gold',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'interest_cap',
      value: 10,
      description: 'Maximum interest per round is now 10 Gold',
    },
  ],
  upgradeId: 'money_tree',
  isUpgraded: false,
}

/**
 * Empty Scroll - Does nothing
 */
export const EMPTY_SCROLL: CharterDefinition = {
  id: 'empty_scroll',
  name: 'Empty Scroll',
  japaneseName: '空巻',
  description: 'Does nothing',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'no_effect',
      value: 0,
      description: 'This charter has no effect',
    },
  ],
  upgradeId: 'void_matter',
  isUpgraded: false,
}

/**
 * Tile Trading - Tiles can be purchased from shop
 */
export const TILE_TRADING: CharterDefinition = {
  id: 'tile_trading',
  name: 'Tile Trading',
  japaneseName: '牌商',
  description: 'Tiles can be purchased from shop',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'tile_shop',
      value: true,
      description: 'Tiles may appear for purchase in the shop',
    },
  ],
  upgradeId: 'illusion_tiles',
  isUpgraded: false,
}

/**
 * Ancient Script - -1 Act, -1 hand per round
 */
export const ANCIENT_SCRIPT: CharterDefinition = {
  id: 'ancient_script',
  name: 'Ancient Script',
  japaneseName: '古文',
  description: '-1 Act, -1 hand per round',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'skip_act',
      value: 1,
      description: 'Skip 1 Act of progression',
    },
    {
      type: 'hands_penalty',
      value: -1,
      description: 'Lose 1 hand per round',
    },
  ],
  upgradeId: 'stone_script',
  isUpgraded: false,
}

/**
 * Director's Take - Reroll Boss Mandate 1x per Act (10 Gold)
 */
export const DIRECTORS_TAKE: CharterDefinition = {
  id: 'directors_take',
  name: "Director's Take",
  japaneseName: '監督権',
  description: 'Reroll Boss Mandate 1x per Act (10 Gold)',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'mandate_reroll',
      value: 1,
      description: 'Can reroll Boss Mandate once per Act for 10 Gold',
    },
  ],
  upgradeId: 'final_cut',
  isUpgraded: false,
}

/**
 * Brush Stroke - +1 hand size
 */
export const BRUSH_STROKE: CharterDefinition = {
  id: 'brush_stroke',
  name: 'Brush Stroke',
  japaneseName: '筆運',
  description: '+1 hand size',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'hand_size',
      value: 1,
      description: 'Increases maximum hand size by 1',
    },
  ],
  upgradeId: 'full_palette',
  isUpgraded: false,
}

// =============================================================================
// UPGRADED CHARTERS
// =============================================================================

/**
 * Plentiful Stock - +1 shop slot (to 4)
 */
export const PLENTIFUL_STOCK: CharterDefinition = {
  id: 'plentiful_stock',
  name: 'Plentiful Stock',
  japaneseName: '満庫',
  description: '+1 shop slot (to 4)',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'shop_slots',
      value: 1,
      description: 'Adds 1 additional item slot to the shop',
    },
  ],
  baseId: 'abundant_stock',
  isUpgraded: true,
  unlockCondition: {
    type: 'gold_spent',
    value: 2500,
    description: 'Spend 2500 Gold total',
  },
}

/**
 * Liquidation Sale - 50% off all shop items (additional 25%)
 */
export const LIQUIDATION_SALE: CharterDefinition = {
  id: 'liquidation_sale',
  name: 'Liquidation Sale',
  japaneseName: '清算',
  description: '50% off all shop items',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'discount',
      value: 25, // Additional 25% on top of Discount Sale
      description: 'All shop items cost an additional 25% less',
    },
  ],
  baseId: 'discount_sale',
  isUpgraded: true,
  unlockCondition: {
    type: 'charters_redeemed',
    value: 10,
    description: 'Redeem 10 Charters in one run',
  },
}

/**
 * Radiant Edge - Editions appear 4x more often
 */
export const RADIANT_EDGE: CharterDefinition = {
  id: 'radiant_edge',
  name: 'Radiant Edge',
  japaneseName: '輝刃',
  description: 'Editions appear 4x more often',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'edition_frequency',
      value: 2, // Additional 2x (total 4x with base)
      description: 'Editions appear twice as often again',
    },
  ],
  baseId: 'sharp_edge',
  isUpgraded: true,
  unlockCondition: {
    type: 'edition_decrees',
    value: 5,
    description: 'Have 5+ edition Decrees',
  },
}

/**
 * Reroll Abundance - Rerolls cost 4 Gold less (additional 2)
 */
export const REROLL_ABUNDANCE: CharterDefinition = {
  id: 'reroll_abundance',
  name: 'Reroll Abundance',
  japaneseName: '転豊',
  description: 'Rerolls cost 4 Gold less',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'reroll_discount',
      value: 2, // Additional 2 Gold discount
      description: 'Rerolls cost an additional 2 Gold less',
    },
  ],
  baseId: 'reroll_surplus',
  isUpgraded: true,
  unlockCondition: {
    type: 'rerolls_total',
    value: 100,
    description: 'Reroll 100 times total',
  },
}

/**
 * Omen Lens - Void Scripts may appear in Arcana Packs
 */
export const OMEN_LENS: CharterDefinition = {
  id: 'omen_lens',
  name: 'Omen Lens',
  japaneseName: '兆鏡',
  description: 'Void Scripts may appear in Arcana Packs',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'void_in_arcana',
      value: true,
      description: 'Arcana Packs may now contain Void Scripts',
    },
  ],
  baseId: 'crystal_lens',
  isUpgraded: true,
  unlockCondition: {
    type: 'fate_seals_from_packs',
    value: 25,
    description: 'Use 25 Fate Seals from packs',
  },
}

/**
 * Observatory - Held Celestial Orbs give x1.5 Mult
 */
export const OBSERVATORY: CharterDefinition = {
  id: 'observatory',
  name: 'Observatory',
  japaneseName: '天文台',
  description: 'Held Celestial Orbs give x1.5 Mult',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'orb_mult',
      value: 1.5,
      description: 'Each held Celestial Orb provides x1.5 Mult',
    },
  ],
  baseId: 'star_chart',
  isUpgraded: true,
  unlockCondition: {
    type: 'celestial_orbs_from_packs',
    value: 25,
    description: 'Use 25 Celestial Orbs from packs',
  },
}

/**
 * Swift Hand - +1 additional hand per round
 */
export const SWIFT_HAND: CharterDefinition = {
  id: 'swift_hand',
  name: 'Swift Hand',
  japaneseName: '迅手',
  description: '+1 additional hand per round',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'hands',
      value: 1,
      description: 'Gain 1 more additional hand each round',
    },
  ],
  baseId: 'steady_hand',
  isUpgraded: true,
  unlockCondition: {
    type: 'tiles_played',
    value: 2500,
    description: 'Play 2500 tiles',
  },
}

/**
 * Wasteful Plenty - +1 additional redraw per round
 */
export const WASTEFUL_PLENTY: CharterDefinition = {
  id: 'wasteful_plenty',
  name: 'Wasteful Plenty',
  japaneseName: '惜捨',
  description: '+1 additional redraw per round',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'redraws',
      value: 1,
      description: 'Gain 1 more additional redraw each round',
    },
  ],
  baseId: 'frugal_discard',
  isUpgraded: true,
  unlockCondition: {
    type: 'tiles_discarded',
    value: 2500,
    description: 'Discard 2500 tiles',
  },
}

/**
 * Seal Tycoon - Fate Seals appear 4x more often
 */
export const SEAL_TYCOON: CharterDefinition = {
  id: 'seal_tycoon',
  name: 'Seal Tycoon',
  japaneseName: '符王',
  description: 'Fate Seals appear 4x more often',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'seal_frequency',
      value: 2, // Additional 2x (total 4x with base)
      description: 'Fate Seals appear twice as often again',
    },
  ],
  baseId: 'seal_merchant',
  isUpgraded: true,
  unlockCondition: {
    type: 'fate_seals_bought',
    value: 50,
    description: 'Buy 50 Fate Seals from shop',
  },
}

/**
 * Orb Tycoon - Celestial Orbs appear 4x more often
 */
export const ORB_TYCOON: CharterDefinition = {
  id: 'orb_tycoon',
  name: 'Orb Tycoon',
  japaneseName: '球王',
  description: 'Celestial Orbs appear 4x more often',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'orb_frequency',
      value: 2, // Additional 2x (total 4x with base)
      description: 'Celestial Orbs appear twice as often again',
    },
  ],
  baseId: 'orb_merchant',
  isUpgraded: true,
  unlockCondition: {
    type: 'celestial_orbs_bought',
    value: 50,
    description: 'Buy 50 Celestial Orbs from shop',
  },
}

/**
 * Money Tree - Interest cap raised to 20 Gold
 */
export const MONEY_TREE: CharterDefinition = {
  id: 'money_tree',
  name: 'Money Tree',
  japaneseName: '金樹',
  description: 'Interest cap raised to 20 Gold',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'interest_cap',
      value: 20,
      description: 'Maximum interest per round is now 20 Gold',
    },
  ],
  baseId: 'seed_pouch',
  isUpgraded: true,
  unlockCondition: {
    type: 'max_interest_rounds',
    value: 10,
    description: 'Max interest for 10 consecutive rounds',
  },
}

/**
 * Void Matter - +1 Decree slot
 */
export const VOID_MATTER: CharterDefinition = {
  id: 'void_matter',
  name: 'Void Matter',
  japaneseName: '虚質',
  description: '+1 Decree slot',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'decree_slots',
      value: 1,
      description: 'Adds 1 Decree slot',
    },
  ],
  baseId: 'empty_scroll',
  isUpgraded: true,
  unlockCondition: {
    type: 'empty_scroll_redeems',
    value: 10,
    description: 'Redeem Empty Scroll 10 times total',
  },
}

/**
 * Illusion Tiles - Shop tiles may have editions
 */
export const ILLUSION_TILES: CharterDefinition = {
  id: 'illusion_tiles',
  name: 'Illusion Tiles',
  japaneseName: '幻牌',
  description: 'Shop tiles may have editions',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'tile_editions',
      value: true,
      description: 'Tiles in the shop may have editions or marks',
    },
  ],
  baseId: 'tile_trading',
  isUpgraded: true,
  unlockCondition: {
    type: 'tiles_bought',
    value: 20,
    description: 'Buy 20 tiles from shop',
  },
}

/**
 * Stone Script - -1 Act again, -1 redraw per round
 */
export const STONE_SCRIPT: CharterDefinition = {
  id: 'stone_script',
  name: 'Stone Script',
  japaneseName: '石文',
  description: '-1 Act again, -1 redraw per round',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'skip_act',
      value: 1,
      description: 'Skip 1 additional Act of progression',
    },
    {
      type: 'redraws_penalty',
      value: -1,
      description: 'Lose 1 redraw per round',
    },
  ],
  baseId: 'ancient_script',
  isUpgraded: true,
  unlockCondition: {
    type: 'act_reached',
    value: 12,
    description: 'Reach Act 12',
  },
}

/**
 * Final Cut - Reroll Boss Mandate unlimited times (10 Gold each)
 */
export const FINAL_CUT: CharterDefinition = {
  id: 'final_cut',
  name: 'Final Cut',
  japaneseName: '最終権',
  description: 'Reroll Boss Mandate unlimited times (10 Gold each)',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'mandate_reroll',
      value: -1, // -1 means unlimited
      description: 'Can reroll Boss Mandate unlimited times for 10 Gold each',
    },
  ],
  baseId: 'directors_take',
  isUpgraded: true,
  unlockCondition: {
    type: 'mandates_discovered',
    value: 25,
    description: 'Discover 25 Mandates',
  },
}

/**
 * Full Palette - +1 hand size again
 */
export const FULL_PALETTE: CharterDefinition = {
  id: 'full_palette',
  name: 'Full Palette',
  japaneseName: '全彩',
  description: '+1 hand size again',
  cost: CHARTER_COST,
  effects: [
    {
      type: 'hand_size',
      value: 1,
      description: 'Increases maximum hand size by 1 more',
    },
  ],
  baseId: 'brush_stroke',
  isUpgraded: true,
  unlockCondition: {
    type: 'hand_size_reduced',
    value: 5,
    description: 'Reduce hand size to 5 tiles',
  },
}

// =============================================================================
// CHARTER COLLECTIONS
// =============================================================================

/**
 * All base charters
 */
export const BASE_CHARTERS: CharterDefinition[] = [
  ABUNDANT_STOCK,
  DISCOUNT_SALE,
  SHARP_EDGE,
  REROLL_SURPLUS,
  CRYSTAL_LENS,
  STAR_CHART,
  STEADY_HAND,
  FRUGAL_DISCARD,
  SEAL_MERCHANT,
  ORB_MERCHANT,
  SEED_POUCH,
  EMPTY_SCROLL,
  TILE_TRADING,
  ANCIENT_SCRIPT,
  DIRECTORS_TAKE,
  BRUSH_STROKE,
]

/**
 * All upgraded charters
 */
export const UPGRADED_CHARTERS: CharterDefinition[] = [
  PLENTIFUL_STOCK,
  LIQUIDATION_SALE,
  RADIANT_EDGE,
  REROLL_ABUNDANCE,
  OMEN_LENS,
  OBSERVATORY,
  SWIFT_HAND,
  WASTEFUL_PLENTY,
  SEAL_TYCOON,
  ORB_TYCOON,
  MONEY_TREE,
  VOID_MATTER,
  ILLUSION_TILES,
  STONE_SCRIPT,
  FINAL_CUT,
  FULL_PALETTE,
]

/**
 * All charters (base + upgraded)
 */
export const ALL_CHARTERS: CharterDefinition[] = [...BASE_CHARTERS, ...UPGRADED_CHARTERS]

/**
 * Charter pairs for lookup
 */
export const CHARTER_PAIRS: Map<string, string> = new Map([
  ['abundant_stock', 'plentiful_stock'],
  ['discount_sale', 'liquidation_sale'],
  ['sharp_edge', 'radiant_edge'],
  ['reroll_surplus', 'reroll_abundance'],
  ['crystal_lens', 'omen_lens'],
  ['star_chart', 'observatory'],
  ['steady_hand', 'swift_hand'],
  ['frugal_discard', 'wasteful_plenty'],
  ['seal_merchant', 'seal_tycoon'],
  ['orb_merchant', 'orb_tycoon'],
  ['seed_pouch', 'money_tree'],
  ['empty_scroll', 'void_matter'],
  ['tile_trading', 'illusion_tiles'],
  ['ancient_script', 'stone_script'],
  ['directors_take', 'final_cut'],
  ['brush_stroke', 'full_palette'],
])

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a charter by ID
 */
export function getCharterById(id: string): CharterDefinition | undefined {
  return ALL_CHARTERS.find((c) => c.id === id)
}

/**
 * Get the base charter for an upgraded charter
 */
export function getBaseCharter(upgradedId: string): CharterDefinition | undefined {
  const upgraded = UPGRADED_CHARTERS.find((c) => c.id === upgradedId)
  if (!upgraded?.baseId) return undefined
  return BASE_CHARTERS.find((c) => c.id === upgraded.baseId)
}

/**
 * Get the upgraded charter for a base charter
 */
export function getUpgradedCharter(baseId: string): CharterDefinition | undefined {
  const base = BASE_CHARTERS.find((c) => c.id === baseId)
  if (!base?.upgradeId) return undefined
  return UPGRADED_CHARTERS.find((c) => c.id === base.upgradeId)
}

/**
 * Check if a charter is available for purchase
 * (base charter not yet purchased, or base purchased and looking at upgrade)
 */
export function isCharterAvailable(
  charterId: string,
  purchasedIds: Set<string>
): boolean {
  const charter = getCharterById(charterId)
  if (!charter) return false

  // Already purchased
  if (purchasedIds.has(charterId)) return false

  if (charter.isUpgraded) {
    // Upgraded charter requires base to be purchased
    return charter.baseId ? purchasedIds.has(charter.baseId) : false
  } else {
    // Base charter is available if not purchased
    return true
  }
}

/**
 * Get all available charters for purchase
 */
export function getAvailableCharters(purchasedIds: Set<string>): CharterDefinition[] {
  return ALL_CHARTERS.filter((c) => isCharterAvailable(c.id, purchasedIds))
}
