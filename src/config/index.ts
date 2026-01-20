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
