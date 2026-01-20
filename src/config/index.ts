/**
 * Config Index for Tensho Mahjong Roguelike
 *
 * This module exports all configuration definitions for easy importing.
 */

// =============================================================================
// STAKE DEFINITIONS
// =============================================================================

export {
  // Types
  type StakeModifier,
  type StakeDefinition,
  type CombinedStakeModifiers,
  type StickerConfig,
  type StickerRollResult,
  // Constants
  STAKE_DEFINITIONS,
  STICKER_DEFINITIONS,
  DEFAULT_STAKE_MODIFIERS,
  STAKE_WALL_UNLOCKS,
  // Calculation utilities
  calculateCombinedModifiers,
  rollForStickers,
  getPrimarySticker,
  getStickerProbabilities,
  formatStickerProbabilities,
  // Lookup utilities
  getStakeByTier,
  getStakeTierByName,
  getStakeColor,
  getStakeJapaneseName,
  getWallUnlockTier,
  isWallUnlocked,
  getStakeModifierDescriptions,
  getCumulativeModifierDescriptions,
} from './stakeDefinitions'

// =============================================================================
// CHARTER DEFINITIONS
// =============================================================================

export {
  // Types
  type CharterDefinition,
  type CharterEffect,
  type CharterEffectType,
  // Constants
  BASE_CHARTERS,
  UPGRADED_CHARTERS,
  ALL_CHARTERS,
  CHARTER_COST,
  // Utilities
  getCharterById,
  getUpgradedCharter,
  isCharterAvailable,
} from './charterDefinitions'

// =============================================================================
// MANDATE DEFINITIONS
// =============================================================================

export {
  // Types
  type MandateEffectType,
  type MandateCategory,
  type MandateDifficulty,
  type MandateDefinition,
  type RoundTypeConfig,
  type RoundTypeDefinition,
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
} from './mandateDefinitions'

// =============================================================================
// PACK DEFINITIONS
// =============================================================================

export {
  // Types
  type PackTypeInfo,
  type PackSizeConfig,
  type PackTypeDefinition,
  // Constants
  PACK_TYPES,
  PACK_SIZES,
  PACK_TYPE_WEIGHTS,
  PACK_SIZE_WEIGHTS,
  // Utilities
  getPackTypeInfo,
  getPackSizeConfig,
  getPackCost,
  getPackChoiceCount,
  getPackSelectCount,
} from './packDefinitions'

// =============================================================================
// OMEN DEFINITIONS
// =============================================================================

export {
  // Types
  type OmenCategory,
  type OmenDefinition,
  // Constants
  OMEN_DEFINITIONS,
  ALL_OMENS,
  // Utilities
  getOmenById,
  getOmensByCategory,
  getRandomOmen,
  getRandomOmenForRoundType,
} from './omenDefinitions'

// =============================================================================
// TUTORIAL DEFINITIONS
// =============================================================================

export {
  gameplayTutorialSteps,
  type TutorialStep,
} from './gameplayTutorialSteps'

// =============================================================================
// TABLE STYLE DEFINITIONS
// =============================================================================

export {
  // Types
  type TableModifierType,
  type TableModifier,
  type UnlockRequirementType,
  type UnlockRequirement,
  type TableStyleDefinition,
  type PlayerUnlockStats,
  // Style Constants
  GREEN_FELT,
  RED_LACQUER,
  BAMBOO_MAT,
  IMPERIAL_GOLD,
  NIGHT_MARKET,
  TEMPLE_STONE,
  GHOST_PARLOR,
  DRAGONS_DEN,
  // Collections
  TABLE_STYLE_DEFINITIONS,
  DEFAULT_TABLE_STYLES,
  UNLOCKABLE_TABLE_STYLES,
  // Lookup utilities
  getTableStyleById,
  getTableStyleByName,
  getTableStylesByTheme,
  getDefaultTableStyle,
  // Modifier utilities
  getTableModifiers,
  hasModifierType,
  getModifierValue,
  getDecreeSlotModifier,
  getFlowerRateModifier,
  getShopDiscountModifier,
  getBaseScoreModifier,
  getYakumanMultiplierModifier,
  getScoreTargetModifier,
  areFlowersDisabled,
  hasEarlyCorruptedSeasons,
  grantsRegionalMandate,
  // Unlock utilities
  isUnlockConditionMet,
  getUnlockedTableStyles,
  getLockedTableStyles,
  getUnlockProgress,
  // Display utilities
  formatModifierDescriptions,
  getBenefitModifiers,
  getDetrimentModifiers,
  hasTradeOffs,
  getThemeInfo,
} from './tableStyleDefinitions'

// =============================================================================
// ARCHIVE DEFINITIONS
// =============================================================================

export {
  // Types
  type ArchiveCategory,
  type ConsumableSubCategory,
  type ArchiveCategoryDefinition,
  type PreDiscoveredSet,
  type WallDefinition,
  type TileMarkDefinition,
  type SealDefinition,
  type EditionDefinition,
  type PackVariantDefinition,
  // Constants
  ARCHIVE_CATEGORIES,
  PRE_DISCOVERED_ITEMS,
  WALL_DEFINITIONS,
  TILE_MARK_DEFINITIONS,
  SEAL_DEFINITIONS_ARCHIVE,
  EDITION_DEFINITIONS_ARCHIVE,
  PACK_VARIANT_DEFINITIONS,
  // Utilities
  getTotalExpectedItems,
  getPreDiscoveredItemIds,
  getArchiveCategory,
  getAllArchiveCategories,
  createArchiveKey,
  parseArchiveKey,
  isPreDiscovered,
} from './archiveDefinitions'

// =============================================================================
// UNLOCK DEFINITIONS
// =============================================================================

export {
  // Types
  type UnlockCategory,
  type UnlockConditionType,
  type UnlockCondition,
  type UnlockDefinition,
  // Constants
  DECREE_UNLOCKS,
  TABLE_STYLE_UNLOCKS,
  CHARTER_UNLOCKS,
  STAKE_UNLOCKS,
  ALL_UNLOCKS,
  STAKE_NAME_TO_TIER,
  // Utilities
  getUnlockById,
  getUnlocksForItem,
  getUnlocksByCategory,
  getDefaultUnlocks,
  getStakeTierFromName,
  getStakeNameFromTier,
} from './unlockDefinitions'
