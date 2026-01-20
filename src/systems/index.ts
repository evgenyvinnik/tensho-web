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
// SHOP GENERATOR
// =============================================================================

export {
  // Configuration
  DEFAULT_GENERATOR_CONFIG,
  // Weights
  BASE_ITEM_WEIGHTS,
  RARITY_WEIGHTS,
  PACK_SIZE_WEIGHTS as GENERATOR_PACK_SIZE_WEIGHTS,
  PACK_TYPE_WEIGHTS as GENERATOR_PACK_TYPE_WEIGHTS,
  EDITION_PROBABILITIES,
  // Class
  ShopGenerator,
  // Singleton
  shopGenerator,
} from './ShopGenerator'

export type {
  // Configuration
  ShopGeneratorConfig,
  // Generated item types
  GeneratedShopItem,
  GeneratedDecree,
  GeneratedFateSeal,
  GeneratedCelestialOrb,
  GeneratedPack,
  GeneratedCharter,
  GeneratedItem,
  GeneratedShop,
} from './ShopGenerator'

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

// =============================================================================
// MANDATE EFFECT SYSTEM
// =============================================================================

export {
  // Class
  MandateEffectSystem,
  // Utilities
  getMandateDisplayInfo,
  isShowdownMandate,
  getMandateDifficultyColor,
  // Types
  type MandateState,
  type MandateApplicationResult,
  type MandateScoringContext,
} from './MandateEffectSystem'

// Re-export mandate definitions from config
export {
  // Standard Mandates
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
  // Showdown Mandates
  AMBER_ACORN,
  VERDANT_LEAF,
  VIOLET_VESSEL,
  CRIMSON_HEART,
  CERULEAN_BELL,
  // Collections
  STANDARD_MANDATES,
  SHOWDOWN_MANDATE_DEFINITIONS,
  ALL_MANDATES,
  // Round Type Definitions
  ROUND_TYPE_DEFINITIONS,
  // Utility Functions
  getMandateById,
  getMandatesForAct,
  selectRandomMandate,
  getMandatesByDifficulty,
  getMandatesByCategory,
  isScoringMandate,
  isTileMandate,
  isResourceMandate,
  isDecreeMandate,
  // Types
  type MandateEffectType,
  type MandateCategory,
  type MandateDifficulty,
  type MandateDefinition,
  type RoundTypeConfig,
  type RoundTypeDefinition,
} from '../config/mandateDefinitions'

// =============================================================================
// TABLE STAKE SYSTEM
// =============================================================================

export {
  // Types
  type StakeModifier,
  type TableStake,
  type CombinedStakeModifiers,
  // Constants
  TABLE_STAKES,
  // Class
  TableStakeSystem,
  // Utilities
  getStakeTierByName,
  getStakeColorByTier,
  formatStickerProbabilities,
} from './TableStakeSystem'

// =============================================================================
// STICKER SYSTEM
// =============================================================================

export {
  // Constants
  PERISHABLE_ROUNDS,
  RENTAL_GOLD_PER_ROUND,
  RENTAL_PURCHASE_COST,
  // Class
  StickerSystem,
  // State management
  type StickerRunState,
  createStickerRunState,
  processEndOfRoundStickers,
  processStartOfRoundStickers,
  // Re-exports from stakeDefinitions
  STICKER_DEFINITIONS,
  type StickerRollResult,
  type StickerConfig,
} from './StickerSystem'

// =============================================================================
// OMEN TAG SYSTEM
// =============================================================================

export {
  // Class
  OmenTagSystem,
  // Skip value calculator
  calculateSkipValue,
  // Utilities
  getOmenRarityJapaneseName,
  getOmenCategoryJapaneseName,
} from './OmenTagSystem'

// Re-export omen types from config
export type {
  OmenDefinition,
  OmenCategory,
  OmenRarity,
  OmenTrigger,
  OmenEffectType,
} from '../config/omenDefinitions'

export {
  // Omen Definitions
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
  // Collections
  ALL_OMENS,
  SMALL_ROUND_OMENS,
  LARGE_ROUND_OMENS,
  // Utilities
  getOmensByRarity,
  getOmensByCategory,
  getOmenById,
  getRandomOmen,
  getRandomOmenForRound,
  OMEN_RARITY_WEIGHTS,
} from '../config/omenDefinitions'

// =============================================================================
// CONSUMABLE SYSTEM
// =============================================================================

export {
  // Types
  type ConsumableType,
  type ConsumableRarity,
  type ConsumableEdition,
  type BaseConsumable,
  type ConsumableUseResult,
  type ConsumableEffectResult,
  type ConsumableInventory,
  // Constants
  DEFAULT_CONSUMABLE_SLOTS,
  MAX_CONSUMABLE_SLOTS,
  // Class
  ConsumableSystem,
  // Utilities
  generateConsumableInstanceId,
  resetConsumableInstanceCounter,
  calculateSellValue as calculateConsumableSellValue,
  getEditionCostModifier,
  getConsumableTypeName,
  getConsumableTypeJapaneseName,
} from './ConsumableSystem'

// =============================================================================
// FATE SEAL SYSTEM
// =============================================================================

export {
  // Types
  type FateSealEffectType,
  type FateSealEffect,
  type FateSeal,
  type FateSealContext,
  // Definitions
  FATE_SEALS,
  // Functions
  getAllFateSeals,
  getFateSealsByRarity,
  // Class
  FateSealSystem,
} from './FateSealSystem'

// =============================================================================
// CELESTIAL ORB SYSTEM
// =============================================================================

export {
  // Types
  type YakuCategory,
  type CelestialOrbEffect,
  type CelestialOrb,
  type OrbAttunement,
  // Constants
  DEFAULT_ORB_MAX_LEVEL,
  LEVEL_UP_THRESHOLDS,
  // Definitions
  CELESTIAL_ORBS,
  // Functions
  getAllCelestialOrbs,
  getCelestialOrbsByRarity,
  getCelestialOrbByYaku,
  mapYakuIdToCategory,
  getYakuCategoryJapaneseName,
  getYakuCategoryDisplayName,
  // Class
  CelestialOrbSystem,
} from './CelestialOrbSystem'

// =============================================================================
// VOID SCRIPT SYSTEM
// =============================================================================

export {
  // Types
  type VoidScriptEffectType,
  type VoidScriptPenaltyType,
  type VoidScriptEffect,
  type VoidScriptPenalty,
  type VoidScript,
  type VoidScriptContext,
  // Definitions
  VOID_SCRIPTS,
  // Functions
  getAllVoidScripts,
  getVoidScriptsByRarity,
  // Class
  VoidScriptSystem,
} from './VoidScriptSystem'

// =============================================================================
// RED FIVE SYSTEM (Aka-Dora)
// =============================================================================

export {
  // Constants
  RED_FIVE_CHIP_BONUS,
  RED_FIVE_RANK,
  RED_FIVE_SUITS,
  RED_FIVE_COUNT,
  // Types
  type RedFiveConfig,
  // Default configuration
  DEFAULT_RED_FIVE_CONFIG,
  // Functions
  isRedFive,
  canBeRedFive,
  calculateRedFiveBonus,
  countRedFives,
  getRedFives,
  // Class
  RedFiveSystem,
  // Singleton
  redFiveSystem,
} from './RedFiveSystem'

// =============================================================================
// TABLE STYLE SYSTEM
// =============================================================================

export {
  // Re-exports from config
  TABLE_STYLE_DEFINITIONS,
  getTableStyleById,
  getDefaultTableStyle,
  getUnlockedTableStyles,
  getLockedTableStyles,
  getUnlockProgress,
  isUnlockConditionMet,
  getTableModifiers,
  getDecreeSlotModifier,
  getFlowerRateModifier,
  getShopDiscountModifier,
  getBaseScoreModifier,
  getYakumanMultiplierModifier,
  getScoreTargetModifier,
  areFlowersDisabled,
  hasEarlyCorruptedSeasons,
  grantsRegionalMandate,
  hasModifierType,
  formatModifierDescriptions,
  getBenefitModifiers,
  getDetrimentModifiers,
  hasTradeOffs,
  getThemeInfo,
  // Types
  type TableStyleDefinition,
  type TableModifier,
  type TableModifierType,
  type UnlockRequirement,
  type PlayerUnlockStats,
  // System-specific exports
  type ActiveTableModifiers,
  DEFAULT_TABLE_MODIFIERS,
  // Class
  TableStyleSystem,
  // Utilities
  getTableStyleByName,
  getTableStyleByJapaneseName,
  getTableStyleColor,
  getTableStyleTheme,
  formatTableStyleName,
  getModifierSummary,
  isPurelyBeneficial,
  getUnlockedStyleCount,
  getUnlockCompletionPercent,
} from './TableStyleSystem'

// =============================================================================
// ARCHIVE SYSTEM
// =============================================================================

export {
  // Types
  type ArchiveEntry,
  type DiscoveryEvent,
  type DiscoveryTrigger,
  type ArchiveStats,
  // Class
  ArchiveSystem,
  // Utilities
  getDiscoveryTriggerName,
  getDiscoveryTriggerJapaneseName,
  formatDiscoveryDate,
  // Singleton
  getArchiveSystem,
  resetArchiveSystem,
} from './ArchiveSystem'

// =============================================================================
// META PROGRESSION SYSTEM
// =============================================================================

export {
  // Types
  type LifetimeStats,
  type SerializableLifetimeStats,
  type UnlockStatus,
  type UnlockCheckResult,
  type UnlockContext,
  type UnlockConditionProgress,
  type ProgressionEventType,
  type ProgressionEventPayload,
  // Constants
  DEFAULT_LIFETIME_STATS,
  // Class
  MetaProgressionSystem,
  // Singleton
  metaProgressionSystem,
  // Event processing
  processProgressionEvent,
} from './MetaProgressionSystem'
