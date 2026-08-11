/**
 * Unlock Definitions for Tensho Mahjong Roguelike
 *
 * Defines all meta-progression unlock conditions across the game.
 * Based on ARCHITECTURE.MD - Table Styles, Decree Unlocks, Charter Upgrades, Stakes.
 */

// =============================================================================
// UNLOCK TYPES
// =============================================================================

/**
 * Categories of unlockable content
 */
export type UnlockCategory =
  | 'decree' // New decrees unlocked
  | 'table_style' // Deck/wall variants
  | 'charter' // Upgraded charters
  | 'stake' // Higher difficulty tiers
  | 'consumable' // Special consumables
  | 'cosmetic' // Visual unlocks

/**
 * Types of conditions that can unlock content
 */
export type UnlockConditionType =
  // Progression-based
  | 'reach_act' // Reach a specific Act number
  | 'complete_act' // Complete a specific Act
  | 'win_run' // Win any run
  | 'win_stake' // Win at a specific stake level
  | 'win_stake_with_wall' // Win at stake level with specific wall

  // Score-based
  | 'single_hand_score' // Score X points in one hand
  | 'round_score' // Score X points in one round
  | 'run_score' // Total score in one run

  // Collection-based
  | 'collect_all_flowers' // Collect all 4 flowers in one run
  | 'collect_all_seasons' // Collect all 4 seasons in one round
  | 'collect_items' // Collect X of a specific item type

  // Gameplay-based
  | 'decrees_owned' // Win with X+ decrees active
  | 'yaku_scored' // Score a specific yaku type
  | 'yakuman_scored' // Score any yakuman
  | 'survive_corrupted_seasons' // Survive X corrupted seasons in one run
  | 'skip_rounds' // Skip X rounds total
  | 'rounds_completed' // Complete X rounds in one run
  | 'win_without_flowers' // Win without collecting flowers

  // Cumulative stats
  | 'total_gold_spent' // Spend X gold lifetime
  | 'total_tiles_played' // Play X tiles lifetime
  | 'total_tiles_discarded' // Discard X tiles lifetime
  | 'total_decrees_purchased' // Purchase X decrees lifetime
  | 'total_rerolls' // Reroll shop X times lifetime
  | 'total_fate_seals_used' // Use X fate seals lifetime
  | 'total_celestial_orbs_used' // Use X celestial orbs lifetime
  | 'total_packs_opened' // Open X packs lifetime
  | 'total_runs' // Start X runs lifetime
  | 'total_wins' // Win X runs lifetime
  | 'max_interest_rounds' // Max interest for X consecutive rounds
  | 'empty_scroll_redeemed' // Redeem Empty Scroll X times
  | 'tiles_bought' // Buy X tiles from shop

  // Specific achievements
  | 'charter_purchased' // Purchase a specific base charter
  | 'discovery' // Discover a specific item
  | 'charters_in_run' // Purchase X charters in one run

/**
 * Single unlock condition definition
 */
export interface UnlockCondition {
  /** Condition type */
  type: UnlockConditionType
  /** Target value for numeric conditions */
  target?: number
  /** Specific value for typed conditions (e.g., stake level, yaku id, wall id) */
  value?: string
  /** Human-readable description */
  description: string
}

/**
 * Full unlock definition
 */
export interface UnlockDefinition {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Japanese name */
  japaneseName: string
  /** Description of the unlock */
  description: string
  /** Category of content being unlocked */
  category: UnlockCategory
  /** Conditions required (all must be met if multiple) */
  conditions: UnlockCondition[]
  /** ID of what gets unlocked */
  unlocksId: string
  /** Whether this is unlocked by default */
  unlockedByDefault?: boolean
  /** Icon for display */
  icon?: string
}

// =============================================================================
// DECREE UNLOCK DEFINITIONS
// =============================================================================

/**
 * Decrees unlocked through progression
 * Based on ARCHITECTURE.MD achievements that unlock decrees
 */
export const DECREE_UNLOCKS: UnlockDefinition[] = [
  // Progression-based decree unlocks
  {
    id: 'unlock_stage_master',
    name: 'Stage Master',
    japaneseName: '舞台師',
    description: 'Unlocked by reaching Act 4',
    category: 'decree',
    conditions: [
      { type: 'reach_act', target: 4, description: 'Reach Act 4' },
    ],
    unlocksId: 'stage_master',
    icon: '🎭',
  },
  {
    id: 'unlock_flower_pot',
    name: 'Flower Pot',
    japaneseName: '花瓶',
    description: 'Unlocked by reaching Act 8',
    category: 'decree',
    conditions: [
      { type: 'reach_act', target: 8, description: 'Reach Act 8' },
    ],
    unlocksId: 'flower_pot',
    icon: '🌸',
  },
  {
    id: 'unlock_blueprint',
    name: 'Blueprint',
    japaneseName: '設計図',
    description: 'Unlocked by winning a run',
    category: 'decree',
    conditions: [
      { type: 'win_run', description: 'Win a run' },
    ],
    unlocksId: 'blueprint',
    icon: '📐',
  },

  // Score-based decree unlocks
  {
    id: 'unlock_lucky_sixes',
    name: 'Lucky Sixes',
    japaneseName: '六福',
    description: 'Score 10,000 points in one hand',
    category: 'decree',
    conditions: [
      { type: 'single_hand_score', target: 10000, description: 'Score 10,000 points in one hand' },
    ],
    unlocksId: 'lucky_sixes',
    icon: '🎲',
  },
  {
    id: 'unlock_the_idol',
    name: 'The Idol',
    japaneseName: '偶像',
    description: 'Score 1,000,000 points in one hand',
    category: 'decree',
    conditions: [
      { type: 'single_hand_score', target: 1000000, description: 'Score 1,000,000 points in one hand' },
    ],
    unlocksId: 'the_idol',
    icon: '🗿',
  },
  {
    id: 'unlock_stuntman',
    name: 'Stuntman',
    japaneseName: '替え玉',
    description: 'Score 100,000,000 points in one hand',
    category: 'decree',
    conditions: [
      { type: 'single_hand_score', target: 100000000, description: 'Score 100,000,000 points in one hand' },
    ],
    unlocksId: 'stuntman',
    icon: '🎬',
  },

  // Collection-based decree unlocks
  {
    id: 'unlock_cartomancer',
    name: 'Cartomancer',
    japaneseName: '符術師',
    description: 'Discover every Fate Seal',
    category: 'decree',
    conditions: [
      { type: 'discovery', value: 'all_fate_seals', description: 'Discover every Fate Seal' },
    ],
    unlocksId: 'cartomancer',
    icon: '🔮',
  },
  {
    id: 'unlock_astronomer',
    name: 'Astronomer',
    japaneseName: '天文家',
    description: 'Discover every Celestial Orb',
    category: 'decree',
    conditions: [
      { type: 'discovery', value: 'all_celestial_orbs', description: 'Discover every Celestial Orb' },
    ],
    unlocksId: 'astronomer',
    icon: '🔭',
  },

  // Skill-based decree unlocks
  {
    id: 'unlock_swift_andy',
    name: 'Swift Andy',
    japaneseName: '迅速',
    description: 'Win in 12 or fewer rounds',
    category: 'decree',
    conditions: [
      { type: 'rounds_completed', target: 12, description: 'Win in 12 or fewer rounds' },
    ],
    unlocksId: 'swift_andy',
    icon: '⚡',
  },
  {
    id: 'unlock_satellite',
    name: 'Satellite',
    japaneseName: '衛星',
    description: 'Have 400+ gold in one run',
    category: 'decree',
    conditions: [
      { type: 'collect_items', target: 400, value: 'gold', description: 'Have 400+ gold in one run' },
    ],
    unlocksId: 'satellite',
    icon: '🛰️',
  },

  // Act progression-based
  {
    id: 'unlock_act6_decrees',
    name: 'Imperial Secrets',
    japaneseName: '帝秘',
    description: 'Reach Act 6 to unlock advanced decrees',
    category: 'decree',
    conditions: [
      { type: 'reach_act', target: 6, description: 'Reach Act 6' },
    ],
    unlocksId: 'imperial_decree_pool',
    icon: '👑',
  },
]

// =============================================================================
// TABLE STYLE UNLOCK DEFINITIONS
// =============================================================================

/**
 * Table style (wall variant) unlocks
 * Based on ARCHITECTURE.MD Table Styles section
 */
export const TABLE_STYLE_UNLOCKS: UnlockDefinition[] = [
  // Default - unlocked from start
  {
    id: 'unlock_green_felt',
    name: 'Green Felt',
    japaneseName: '青畳',
    description: 'Classic table style - always available',
    category: 'table_style',
    conditions: [],
    unlocksId: 'green_felt',
    unlockedByDefault: true,
    icon: '🟢',
  },

  // Progression-based unlocks
  {
    id: 'unlock_red_lacquer',
    name: 'Red Lacquer',
    japaneseName: '朱漆',
    description: 'Complete Act 3 to unlock',
    category: 'table_style',
    conditions: [
      { type: 'complete_act', target: 3, description: 'Complete Act 3' },
    ],
    unlocksId: 'red_lacquer',
    icon: '🔴',
  },

  // Collection-based unlocks
  {
    id: 'unlock_bamboo_mat',
    name: 'Bamboo Mat',
    japaneseName: '竹席',
    description: 'Collect all 4 flowers in a single run',
    category: 'table_style',
    conditions: [
      { type: 'collect_all_flowers', description: 'Collect all 4 flowers in a single run' },
    ],
    unlocksId: 'bamboo_mat',
    icon: '🎋',
  },

  // Gameplay-based unlocks
  {
    id: 'unlock_imperial_gold',
    name: 'Imperial Gold',
    japaneseName: '金殿',
    description: 'Win a run with 5+ decrees',
    category: 'table_style',
    conditions: [
      { type: 'decrees_owned', target: 5, description: 'Win with 5+ decrees' },
      { type: 'win_run', description: 'Win a run' },
    ],
    unlocksId: 'imperial_gold',
    icon: '✨',
  },
  {
    id: 'unlock_night_market',
    name: 'Night Market',
    japaneseName: '夜市',
    description: 'Purchase 20 decrees across all runs',
    category: 'table_style',
    conditions: [
      { type: 'total_decrees_purchased', target: 20, description: 'Purchase 20 decrees total' },
    ],
    unlocksId: 'night_market',
    icon: '🌙',
  },
  {
    id: 'unlock_temple_stone',
    name: 'Temple Stone',
    japaneseName: '石庙',
    description: 'Win without collecting any flowers',
    category: 'table_style',
    conditions: [
      { type: 'win_without_flowers', description: 'Win without collecting any flowers' },
    ],
    unlocksId: 'temple_stone',
    icon: '🏛️',
  },
  {
    id: 'unlock_ghost_parlor',
    name: 'Ghost Parlor',
    japaneseName: '幽亭',
    description: 'Survive 3 corrupted seasons in one run',
    category: 'table_style',
    conditions: [
      { type: 'survive_corrupted_seasons', target: 3, description: 'Survive 3 corrupted seasons' },
    ],
    unlocksId: 'ghost_parlor',
    icon: '👻',
  },
  {
    id: 'unlock_dragons_den',
    name: "Dragon's Den",
    japaneseName: '龙窟',
    description: 'Score a yakuman',
    category: 'table_style',
    conditions: [
      { type: 'yakuman_scored', description: 'Score a yakuman' },
    ],
    unlocksId: 'dragons_den',
    icon: '🐉',
  },

  // Stake-based wall unlocks (from stakeDefinitions)
  {
    id: 'unlock_crimson_wall',
    name: 'Crimson Wall',
    japaneseName: '朱壁',
    description: 'Win on Red Stake or higher',
    category: 'table_style',
    conditions: [
      { type: 'win_stake', value: 'red', description: 'Win on Red Stake or higher' },
    ],
    unlocksId: 'crimson_wall',
    icon: '🟥',
  },
  {
    id: 'unlock_jade_wall',
    name: 'Jade Wall',
    japaneseName: '翠壁',
    description: 'Win on Green Stake or higher',
    category: 'table_style',
    conditions: [
      { type: 'win_stake', value: 'green', description: 'Win on Green Stake or higher' },
    ],
    unlocksId: 'jade_wall',
    icon: '🟩',
  },
  {
    id: 'unlock_obsidian_wall',
    name: 'Obsidian Wall',
    japaneseName: '黒壁',
    description: 'Win on Black Stake or higher',
    category: 'table_style',
    conditions: [
      { type: 'win_stake', value: 'black', description: 'Win on Black Stake or higher' },
    ],
    unlocksId: 'obsidian_wall',
    icon: '⬛',
  },
  {
    id: 'unlock_azure_wall',
    name: 'Azure Wall',
    japaneseName: '蒼壁',
    description: 'Win on Blue Stake or higher',
    category: 'table_style',
    conditions: [
      { type: 'win_stake', value: 'blue', description: 'Win on Blue Stake or higher' },
    ],
    unlocksId: 'azure_wall',
    icon: '🟦',
  },
  {
    id: 'unlock_sunset_wall',
    name: 'Sunset Wall',
    japaneseName: '夕壁',
    description: 'Win on Orange Stake or higher',
    category: 'table_style',
    conditions: [
      { type: 'win_stake', value: 'orange', description: 'Win on Orange Stake or higher' },
    ],
    unlocksId: 'sunset_wall',
    icon: '🟧',
  },
]

// =============================================================================
// CHARTER UPGRADE UNLOCK DEFINITIONS
// =============================================================================

/**
 * Upgraded charter unlock conditions
 * Based on charterDefinitions.ts unlock conditions
 */
export const CHARTER_UNLOCKS: UnlockDefinition[] = [
  {
    id: 'unlock_plentiful_stock',
    name: 'Plentiful Stock',
    japaneseName: '満庫',
    description: 'Spend 2500 Gold total',
    category: 'charter',
    conditions: [
      { type: 'total_gold_spent', target: 2500, description: 'Spend 2500 Gold total' },
      { type: 'charter_purchased', value: 'abundant_stock', description: 'Purchase Abundant Stock' },
    ],
    unlocksId: 'plentiful_stock',
    icon: '📦',
  },
  {
    id: 'unlock_liquidation_sale',
    name: 'Liquidation Sale',
    japaneseName: '清算',
    description: 'Redeem 10 Charters in one run',
    category: 'charter',
    conditions: [
      { type: 'charters_in_run', target: 10, description: 'Redeem 10 Charters in one run' },
      { type: 'charter_purchased', value: 'discount_sale', description: 'Purchase Discount Sale' },
    ],
    unlocksId: 'liquidation_sale',
    icon: '💸',
  },
  {
    id: 'unlock_radiant_edge',
    name: 'Radiant Edge',
    japaneseName: '輝刃',
    description: 'Have 5+ edition Decrees',
    category: 'charter',
    conditions: [
      { type: 'collect_items', target: 5, value: 'edition_decrees', description: 'Have 5+ edition Decrees' },
      { type: 'charter_purchased', value: 'sharp_edge', description: 'Purchase Sharp Edge' },
    ],
    unlocksId: 'radiant_edge',
    icon: '✨',
  },
  {
    id: 'unlock_reroll_abundance',
    name: 'Reroll Abundance',
    japaneseName: '転豊',
    description: 'Reroll 100 times total',
    category: 'charter',
    conditions: [
      { type: 'total_rerolls', target: 100, description: 'Reroll 100 times total' },
      { type: 'charter_purchased', value: 'reroll_surplus', description: 'Purchase Reroll Surplus' },
    ],
    unlocksId: 'reroll_abundance',
    icon: '🔄',
  },
  {
    id: 'unlock_omen_lens',
    name: 'Omen Lens',
    japaneseName: '兆鏡',
    description: 'Use 25 Fate Seals from packs',
    category: 'charter',
    conditions: [
      { type: 'total_fate_seals_used', target: 25, description: 'Use 25 Fate Seals from packs' },
      { type: 'charter_purchased', value: 'crystal_lens', description: 'Purchase Crystal Lens' },
    ],
    unlocksId: 'omen_lens',
    icon: '🔮',
  },
  {
    id: 'unlock_observatory',
    name: 'Observatory',
    japaneseName: '天文台',
    description: 'Use 25 Celestial Orbs from packs',
    category: 'charter',
    conditions: [
      { type: 'total_celestial_orbs_used', target: 25, description: 'Use 25 Celestial Orbs from packs' },
      { type: 'charter_purchased', value: 'star_chart', description: 'Purchase Star Chart' },
    ],
    unlocksId: 'observatory',
    icon: '🔭',
  },
  {
    id: 'unlock_swift_hand',
    name: 'Swift Hand',
    japaneseName: '迅手',
    description: 'Play 2500 tiles',
    category: 'charter',
    conditions: [
      { type: 'total_tiles_played', target: 2500, description: 'Play 2500 tiles' },
      { type: 'charter_purchased', value: 'steady_hand', description: 'Purchase Steady Hand' },
    ],
    unlocksId: 'swift_hand',
    icon: '🖐️',
  },
  {
    id: 'unlock_wasteful_plenty',
    name: 'Wasteful Plenty',
    japaneseName: '惜捨',
    description: 'Discard 2500 tiles',
    category: 'charter',
    conditions: [
      { type: 'total_tiles_discarded', target: 2500, description: 'Discard 2500 tiles' },
      { type: 'charter_purchased', value: 'frugal_discard', description: 'Purchase Frugal Discard' },
    ],
    unlocksId: 'wasteful_plenty',
    icon: '🗑️',
  },
  {
    id: 'unlock_seal_tycoon',
    name: 'Seal Tycoon',
    japaneseName: '符王',
    description: 'Buy 50 Fate Seals from shop',
    category: 'charter',
    conditions: [
      { type: 'collect_items', target: 50, value: 'fate_seals_bought', description: 'Buy 50 Fate Seals from shop' },
      { type: 'charter_purchased', value: 'seal_merchant', description: 'Purchase Seal Merchant' },
    ],
    unlocksId: 'seal_tycoon',
    icon: '🎴',
  },
  {
    id: 'unlock_orb_tycoon',
    name: 'Orb Tycoon',
    japaneseName: '球王',
    description: 'Buy 50 Celestial Orbs from shop',
    category: 'charter',
    conditions: [
      { type: 'collect_items', target: 50, value: 'celestial_orbs_bought', description: 'Buy 50 Celestial Orbs from shop' },
      { type: 'charter_purchased', value: 'orb_merchant', description: 'Purchase Orb Merchant' },
    ],
    unlocksId: 'orb_tycoon',
    icon: '🔵',
  },
  {
    id: 'unlock_money_tree',
    name: 'Money Tree',
    japaneseName: '金樹',
    description: 'Max interest for 10 consecutive rounds',
    category: 'charter',
    conditions: [
      { type: 'max_interest_rounds', target: 10, description: 'Max interest for 10 consecutive rounds' },
      { type: 'charter_purchased', value: 'seed_pouch', description: 'Purchase Seed Pouch' },
    ],
    unlocksId: 'money_tree',
    icon: '🌳',
  },
  {
    id: 'unlock_void_matter',
    name: 'Void Matter',
    japaneseName: '虚質',
    description: 'Redeem Empty Scroll 10 times total',
    category: 'charter',
    conditions: [
      { type: 'empty_scroll_redeemed', target: 10, description: 'Redeem Empty Scroll 10 times total' },
      { type: 'charter_purchased', value: 'empty_scroll', description: 'Purchase Empty Scroll' },
    ],
    unlocksId: 'void_matter',
    icon: '🕳️',
  },
  {
    id: 'unlock_illusion_tiles',
    name: 'Illusion Tiles',
    japaneseName: '幻牌',
    description: 'Buy 20 tiles from shop',
    category: 'charter',
    conditions: [
      { type: 'tiles_bought', target: 20, description: 'Buy 20 tiles from shop' },
      { type: 'charter_purchased', value: 'tile_trading', description: 'Purchase Tile Trading' },
    ],
    unlocksId: 'illusion_tiles',
    icon: '🀄',
  },
  {
    id: 'unlock_stone_script',
    name: 'Stone Script',
    japaneseName: '石文',
    description: 'Reach Act 12',
    category: 'charter',
    conditions: [
      { type: 'reach_act', target: 12, description: 'Reach Act 12' },
      { type: 'charter_purchased', value: 'ancient_script', description: 'Purchase Ancient Script' },
    ],
    unlocksId: 'stone_script',
    icon: '🗿',
  },
  {
    id: 'unlock_final_cut',
    name: 'Final Cut',
    japaneseName: '最終権',
    description: 'Discover 25 Mandates',
    category: 'charter',
    conditions: [
      { type: 'discovery', value: 'mandates', target: 25, description: 'Discover 25 Mandates' },
      { type: 'charter_purchased', value: 'directors_take', description: "Purchase Director's Take" },
    ],
    unlocksId: 'final_cut',
    icon: '🎬',
  },
  {
    id: 'unlock_full_palette',
    name: 'Full Palette',
    japaneseName: '全彩',
    description: 'Reduce hand size to 5 tiles',
    category: 'charter',
    conditions: [
      { type: 'collect_items', target: 5, value: 'min_hand_size', description: 'Reduce hand size to 5 tiles' },
      { type: 'charter_purchased', value: 'brush_stroke', description: 'Purchase Brush Stroke' },
    ],
    unlocksId: 'full_palette',
    icon: '🎨',
  },
]

// =============================================================================
// STAKE UNLOCK DEFINITIONS
// =============================================================================

/**
 * Stake tier unlock definitions
 * Stakes are unlocked per-wall by completing the previous stake level
 */
export const STAKE_UNLOCKS: UnlockDefinition[] = [
  {
    id: 'unlock_red_stake',
    name: 'Red Stake',
    japaneseName: '赤場',
    description: 'Win on White Stake',
    category: 'stake',
    conditions: [
      { type: 'win_stake', value: 'white', description: 'Win on White Stake' },
    ],
    unlocksId: 'red_stake',
    icon: '🔴',
  },
  {
    id: 'unlock_green_stake',
    name: 'Green Stake',
    japaneseName: '緑場',
    description: 'Win on Red Stake',
    category: 'stake',
    conditions: [
      { type: 'win_stake', value: 'red', description: 'Win on Red Stake' },
    ],
    unlocksId: 'green_stake',
    icon: '🟢',
  },
  {
    id: 'unlock_black_stake',
    name: 'Black Stake',
    japaneseName: '黒場',
    description: 'Win on Green Stake',
    category: 'stake',
    conditions: [
      { type: 'win_stake', value: 'green', description: 'Win on Green Stake' },
    ],
    unlocksId: 'black_stake',
    icon: '⚫',
  },
  {
    id: 'unlock_blue_stake',
    name: 'Blue Stake',
    japaneseName: '青場',
    description: 'Win on Black Stake',
    category: 'stake',
    conditions: [
      { type: 'win_stake', value: 'black', description: 'Win on Black Stake' },
    ],
    unlocksId: 'blue_stake',
    icon: '🔵',
  },
  {
    id: 'unlock_purple_stake',
    name: 'Purple Stake',
    japaneseName: '紫場',
    description: 'Win on Blue Stake',
    category: 'stake',
    conditions: [
      { type: 'win_stake', value: 'blue', description: 'Win on Blue Stake' },
    ],
    unlocksId: 'purple_stake',
    icon: '🟣',
  },
  {
    id: 'unlock_orange_stake',
    name: 'Orange Stake',
    japaneseName: '橙場',
    description: 'Win on Purple Stake',
    category: 'stake',
    conditions: [
      { type: 'win_stake', value: 'purple', description: 'Win on Purple Stake' },
    ],
    unlocksId: 'orange_stake',
    icon: '🟠',
  },
  {
    id: 'unlock_gold_stake',
    name: 'Gold Stake',
    japaneseName: '金場',
    description: 'Win on Orange Stake',
    category: 'stake',
    conditions: [
      { type: 'win_stake', value: 'orange', description: 'Win on Orange Stake' },
    ],
    unlocksId: 'gold_stake',
    icon: '🥇',
  },
]

// =============================================================================
// ALL UNLOCKS COLLECTION
// =============================================================================

/**
 * All unlock definitions combined
 */
export const ALL_UNLOCKS: UnlockDefinition[] = [
  ...DECREE_UNLOCKS,
  ...TABLE_STYLE_UNLOCKS,
  ...CHARTER_UNLOCKS,
  ...STAKE_UNLOCKS,
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get unlock definition by ID
 */
export function getUnlockById(id: string): UnlockDefinition | undefined {
  return ALL_UNLOCKS.find((u) => u.id === id)
}

/**
 * Get unlocks that unlock a specific item
 */
export function getUnlocksForItem(itemId: string): UnlockDefinition[] {
  return ALL_UNLOCKS.filter((u) => u.unlocksId === itemId)
}

/**
 * Get unlocks by category
 */
export function getUnlocksByCategory(category: UnlockCategory): UnlockDefinition[] {
  return ALL_UNLOCKS.filter((u) => u.category === category)
}

/**
 * Get default unlocked items
 */
export function getDefaultUnlocks(): UnlockDefinition[] {
  return ALL_UNLOCKS.filter((u) => u.unlockedByDefault)
}

/**
 * Get stake name to tier mapping
 */
export const STAKE_NAME_TO_TIER: Record<string, number> = {
  white: 1,
  red: 2,
  green: 3,
  black: 4,
  blue: 5,
  purple: 6,
  orange: 7,
  gold: 8,
}

/**
 * Get tier from stake name
 */
export function getStakeTierFromName(name: string): number {
  return STAKE_NAME_TO_TIER[name.toLowerCase()] ?? 1
}

/**
 * Get stake name from tier
 */
export function getStakeNameFromTier(tier: number): string {
  const names = ['white', 'red', 'green', 'black', 'blue', 'purple', 'orange', 'gold']
  return names[tier - 1] ?? 'white'
}
