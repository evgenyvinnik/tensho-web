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

// =============================================================================
// CHARTER SYSTEM
// =============================================================================

export {
  // Types
  type OwnedCharter,
  type CharterEffects,
  // Constants
  DEFAULT_CHARTER_EFFECTS,
  CHARTER_COST as IMPERIAL_CHARTER_COST,
  // Class
  CharterSystem,
  // Charter definitions
  BASE_CHARTERS as CHARTER_BASE_DEFINITIONS,
  UPGRADED_CHARTERS as CHARTER_UPGRADED_DEFINITIONS,
  ALL_CHARTERS as CHARTER_ALL_DEFINITIONS,
  // Utilities
  getCharterById,
  getUpgradedCharter,
  getAvailableCharters,
  isCharterAvailable,
} from './CharterSystem'

export type {
  CharterDefinition,
  CharterEffect,
  CharterEffectType,
} from './CharterSystem'

// =============================================================================
// TEA HOUSE SYSTEM (Enhanced Shop)
// =============================================================================

export {
  // Constants
  TEA_HOUSE_BASE_ITEM_SLOTS,
  TEA_HOUSE_MAX_ITEM_SLOTS,
  TEA_HOUSE_PACK_SLOTS,
  TEA_HOUSE_BASE_REROLL_COST,
  TEA_HOUSE_REROLL_INCREMENT,
  ITEM_TYPE_WEIGHTS as TEA_HOUSE_ITEM_WEIGHTS,
  DECREE_RARITY_WEIGHTS as TEA_HOUSE_DECREE_RARITY_WEIGHTS,
  PACK_SIZE_WEIGHTS as TEA_HOUSE_PACK_SIZE_WEIGHTS,
  PACK_TYPE_WEIGHTS as TEA_HOUSE_PACK_TYPE_WEIGHTS,
  // Charters
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
  // Class
  TeaHouseSystem,
} from './TeaHouseSystem'

export type {
  TeaHouseOffering,
  TeaHouseState,
  FateSealPlaceholder,
  CelestialOrbPlaceholder,
} from './TeaHouseSystem'

// =============================================================================
// PRICING CALCULATOR
// =============================================================================

export {
  // Constants
  DECREE_BASE_COST_RANGES,
  EDITION_ADDITIONAL_COSTS,
  CONSUMABLE_COSTS,
  PACK_COSTS as PRICING_PACK_COSTS,
  CHARTER_BASE_COST,
  // Class
  PricingCalculator,
  // Utilities
  getRarityCostRangeDisplay,
  getEditionCostDisplay,
  getEditionsByCost,
} from './PricingCalculator'

export type { EditionType as PricingEditionType } from './PricingCalculator'

// =============================================================================
// TILE MODIFIER SYSTEM (Tile Marks / Card Modifiers)
// =============================================================================

export {
  // Class
  TileModifierSystem,
  // Singleton instance
  tileModifierSystem,
  // Store types
  type TileModifierStore,
  type MarkDecayConfig,
  // Factory functions
  createModifierStore,
  // Decay configurations
  ENHANCEMENT_DECAY_CONFIG,
  SEAL_DECAY_CONFIG,
  // Helper functions
  getModifierSummary,
  anyTileHasModifiers,
  countModifiedTiles,
  getExtraDecreeSlots,
} from './TileModifierSystem'

// Re-export core types for convenience
export {
  // Types
  type TileModifiers,
  EnhancementType,
  SealType,
  EditionType,
  // Default values
  DEFAULT_MODIFIERS,
  // Definitions
  ENHANCEMENT_DEFINITIONS,
  SEAL_DEFINITIONS,
  EDITION_DEFINITIONS,
  // Utility functions
  hasModifiers,
  calculateModifierChips,
  calculateModifierMult,
  calculateModifierMultiplier,
  getRetriggers,
  isWild,
  alwaysScores,
  canShatter,
  hasHeldEffect,
  isLucky,
  rollLuckyEffect,
  rollShatter,
  calculateModifierEffects,
  getAllEnhancements,
  getAllSeals,
  getSpecialEditions,
  getRandomEnhancement,
  getRandomSeal,
  getRandomEdition,
  formatModifiers,
} from '../core/TileModifier'

// =============================================================================
// BLESSING PACK SYSTEM
// =============================================================================

export {
  // Class
  BlessingPackSystem,
  // Types
  type PackContent,
  type PackOffering,
  type PackGenerationOptions,
  // Utilities
  getPackTypeInfo,
  getPackSizeInfo,
  canAffordPack,
  getPackEffectiveCost,
} from './BlessingPackSystem'
