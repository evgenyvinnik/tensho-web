/**
 * Systems Index for Tensho Mahjong Roguelike
 *
 * This module exports all game systems for easy importing.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Decree types
  DecreeCategory,
  DecreeRarity,
  EffectTrigger,
  BaseEffect,
  AdditiveScoreEffect,
  MultiplicativeScoreEffect,
  GoldEffect,
  DrawEffect,
  RuleModificationEffect,
  ScalingEffect,
  ConditionalEffect,
  DecreeCondition,
  DecreeEffect,
  StickerType,
  Sticker,
  Decree,
  OwnedDecree,
  // Flower types
  FlowerVariant,
  FlowerEffect,
  FlowerMutation,
  FlowerTile,
  FlowerSetBonus,
  FlowerCollection,
  // Season types
  SeasonVariant,
  CorruptedSeasonVariant,
  SeasonEffect,
  CorruptedSeasonEffect,
  SeasonTile,
  SeasonState,
  // Shop types
  ShopItemType,
  PackSize,
  PackType,
  BlessingPack,
  ShopItem,
  ImperialCharter,
  ShopState,
  // Round types
  RoundType,
  BossMandate,
  RoundState,
  ActState,
  ScoreRequirements,
  // Scoring types
  ScoringContext,
  ScoreBreakdown,
  // Game state types
  RunState,
} from './types'

export { ROUND_MULTIPLIERS } from './types'

// =============================================================================
// DECREE SYSTEM
// =============================================================================

export {
  // Starter Decrees
  RIVER_TAX,
  EXTENDED_HAND_GRANT,
  TANYAO_DISPENSATION,
  MOONLIT_SEAL,
  PURE_SUIT_ASCETICISM,
  // Additional Decrees
  BROKEN_STAIR_EDICT,
  FALSE_EYE_MANDATE,
  HONOR_TRANSMUTATION,
  CELESTIAL_WILDCARD,
  DEAD_WALL_WRIT,
  SHANTEN_CLEMENCY,
  CLOSED_HAND_AUSTERITY,
  TERMINAL_DEVOTION,
  YAKU_REPETITION_CHARTER,
  // Collections
  STARTER_DECREES,
  ALL_DECREES,
  // Class
  DecreeSystem,
} from './DecreeSystem'

// =============================================================================
// FLOWER SYSTEM
// =============================================================================

export {
  // Definitions
  FLOWER_BASE_EFFECTS,
  FLOWER_MUTATIONS,
  FLOWER_SET_BONUSES,
  // Class
  FlowerSystem,
  // Utilities
  createFlowerTile,
} from './FlowerSystem'

// =============================================================================
// SEASON SYSTEM
// =============================================================================

export {
  // Definitions
  SEASON_BASE_EFFECTS,
  CORRUPTED_SEASON_EFFECTS,
  CORRUPTED_TO_BASE_SEASON,
  // Class
  SeasonSystem,
  // Utilities
  createSeasonTile,
  getSeasonJapaneseName,
  getCorruptedSeasonJapaneseName,
} from './SeasonSystem'

// =============================================================================
// SHOP SYSTEM
// =============================================================================

export {
  // Constants
  BASE_ITEM_SLOTS,
  BASE_PACK_SLOTS,
  BASE_REROLL_COST,
  REROLL_COST_INCREMENT,
  ITEM_TYPE_WEIGHTS,
  DECREE_RARITY_WEIGHTS,
  DECREE_COST_RANGES,
  ITEM_COSTS,
  PACK_COSTS,
  CHARTER_COST,
  PACK_SIZE_WEIGHTS,
  PACK_TYPE_WEIGHTS,
  // Charters
  BASE_CHARTERS,
  UPGRADED_CHARTERS,
  // Class
  ShopSystem,
} from './ShopSystem'

// =============================================================================
// ROUND MANAGER
// =============================================================================

export {
  // Constants
  BASE_SCORE_TARGETS,
  STAKE_SCORE_MULTIPLIERS,
  DEFAULT_HANDS_PER_ROUND,
  DEFAULT_DISCARDS_PER_ROUND,
  // Mandates
  BOSS_MANDATES,
  SHOWDOWN_MANDATES,
  // Class
  RoundManager,
  // Utilities
  formatScoreTarget,
  getRoundTypeDisplayName,
} from './RoundManager'
