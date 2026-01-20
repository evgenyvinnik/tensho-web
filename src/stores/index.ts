/**
 * Stores Index - Central export for all Zustand stores
 *
 * This file provides a unified import point for all game state stores.
 */

// Game Store - Main game session state
export {
  useGameStore,
  type GameState,
  type GamePhase,
} from './gameStore'

// Hand Store - Current hand tiles and melds
export {
  useHandStore,
  selectSelectedTiles,
  selectUnselectedTiles,
  selectIsTileSelected,
  type HandState,
} from './handStore'

// Wall Store - Wall, dead wall, and discards
export {
  useWallStore,
  selectVisibleDiscards,
  selectIsWallExhausted,
  selectDrawnTiles,
  type WallState,
} from './wallStore'

// Decree Store - Decrees (Joker equivalents)
export {
  useDecreeStore,
  selectEffectiveMaxSlots,
  selectAvailableSlots,
  selectTotalSellValue,
  generateDecreeId,
  createDecree,
  type DecreeState,
  type Decree,
  type DecreeRarity,
  type DecreeEdition,
  type DecreeSticker,
  type DecreeEffect,
  type DecreeEffectType,
} from './decreeStore'

// Flora Store - Flowers and Seasons
export {
  useFloraStore,
  selectFlowerCounts,
  selectHasAllFlowers,
  selectHasAllSeasons,
  selectSeasonEffectsByType,
  generateFlowerId,
  generateSeasonId,
  createFlowerTile,
  createSeasonTile,
  type FloraState,
  type FlowerTile,
  type FlowerEffect,
  type SeasonTile,
  type SeasonEffect,
} from './floraStore'

// Settings Store - User preferences (persisted)
export {
  useSettingsStore,
  selectEffectiveMusicVolume,
  selectEffectiveSfxVolume,
  selectAnimationMultiplier,
  type SettingsState,
} from './settingsStore'

// Achievement Store - Heavenly Accolades (persisted)
export {
  useAchievementStore,
  getAchievementDefinition,
  getAchievementsByCategory,
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_CATEGORIES,
  type AchievementState,
  type AchievementDefinition,
  type AchievementProgress,
  type AchievementStats,
  type AchievementCategory,
} from './achievementStore'

// Tile Mark Store - Tile Modifiers (Enhancements, Seals, Editions)
export {
  useTileMarkStore,
  // Selectors
  selectTotalModifierChips,
  selectTotalModifierMult,
  selectTotalModifierMultiplier,
  selectTotalRetriggers,
  selectMarkedTileCount,
  selectEnhancementCount,
  selectSealCount,
  selectNegativeEditionCount,
  // Helper functions
  getModifierDisplayInfo,
  formatTileMarks,
  // Decay configurations
  ENHANCEMENT_DECAY_CONFIG,
  SEAL_DECAY_CONFIG,
  // Types
  type TileMarkState,
  type TileMarkData,
  type PendingConsumable,
  type MarkDecayConfig,
} from './tileMarkStore'

// Charter Store - Imperial Charters (Voucher equivalents)
export {
  useCharterStore,
  // Selectors
  selectDiscountPercentage,
  selectAdditionalShopSlots,
  selectAdditionalHands,
  selectAdditionalRedraws,
  selectInterestCap,
  selectAdditionalDecreeSlots,
  selectHandSizeBonus,
  selectCanBuyTiles,
  selectRerollDiscount,
  selectActsToSkip,
  // Helper functions
  generateCharterId,
  // Types
  type CharterState,
  type OwnedCharter,
  type CharterEffects,
  // Re-exports from config
  type CharterDefinition,
  type CharterEffect,
  type CharterEffectType,
  BASE_CHARTERS,
  UPGRADED_CHARTERS,
  ALL_CHARTERS,
  CHARTER_COST,
  getCharterById,
  getUpgradedCharter,
  isCharterAvailable,
} from './charterStore'

// Shop Store - Tea House (Shop) state management
export {
  useShopStore,
  // Selectors
  selectItemSlotCount,
  selectTotalPurchases,
  selectPurchasesByType,
  selectDecreePurchaseCount,
  selectHasCharter,
  selectAveragePurchaseCost,
  // Utilities
  calculateSellValue,
  // Types
  type ShopStoreState,
  type PurchaseRecord,
} from './shopStore'

// Pack Store - Blessing Pack state management
export {
  usePackStore,
  // Selectors
  selectAvailablePacks,
  selectIsPackOpening,
  selectSelectedIndices,
  selectCanConfirm,
  selectCanSelectMore,
  selectRemainingSelections,
  selectPackPhase,
  selectTotalSkips,
  // Helper functions
  createShopPack,
  getPackDisplayInfo,
  getPackJapaneseName,
  getPackIconColor,
  generatePackId,
  // Types
  type PackState,
  type PackOpeningPhase,
  type ShopPack,
  type OpeningPack,
} from './packStore'

// Stake Store - Table Stakes difficulty progression (persisted)
export {
  useStakeStore,
  // Selectors
  selectCurrentStake,
  selectCurrentStakeColor,
  selectCurrentStakeName,
  selectCurrentStakeJapaneseName,
  selectNoSmallRoundReward,
  selectScoreScaling,
  selectRedrawPenalty,
  selectTotalVictories,
  selectVictoriesAtStake,
  selectWallsWithStake,
  selectHasGoldStakeVictory,
  // Utilities
  getWallStakeProgressDisplay,
  calculateStakeCompletionPercentage,
  // Types
  type StakeState,
  type StakeVictory,
  type WallStakeProgress,
} from './stakeStore'

// Omen Store - Omen Tags (Tags equivalents)
export {
  useOmenStore,
  // Selectors
  selectActiveOmenCount,
  selectConsumedOmenCount,
  selectPendingShopTagCount,
  selectPendingBossTagCount,
  selectHasInstantTags,
  selectRoundsSkipped,
  selectIsInterestBlocked,
  selectLockedSeason,
  selectHasPendingTagType,
  selectTagsWithUnlockStatus,
  selectShopDiscountFromOmens,
  selectFreeRerollsFromOmens,
  selectNextRoundHandSizeBonus,
  selectGoldBonusFromOmens,
  selectGuaranteedShopItems,
  selectNextDecreeEdition,
  selectNextRoundDrawBonus,
  selectNextRoundDiscardBonus,
  // Utilities
  generateOmenId,
  getOmenTagDisplayName,
  getOmenTagJapaneseName,
  getOmenTagDescription,
  // Types
  type OmenState,
  type OmenStatus,
  type OmenHistoryEntry,
  type LockedSeason,
} from './omenStore'

// Consumable Store - Fate Seals, Celestial Orbs, Void Scripts
export {
  useConsumableStore,
  // Selectors
  selectAllConsumables,
  selectTotalConsumableCount,
  selectTotalSellValue as selectConsumableSellValue,
  selectYakuBonusSummary,
  selectHandSizePenalty,
  selectIsShantenScoringAllowed,
  selectIsMeldValidationBypassed,
  selectIsBaseScoreHalved,
  // Helper functions
  createFateSealForStore,
  createCelestialOrbForStore,
  createVoidScriptForStore,
  getRandomFateSealForShop,
  getRandomCelestialOrbForShop,
  getRandomVoidScriptForShop,
  // Types
  type ConsumableState,
} from './consumableStore'

// Table Style Store - Table Styles (Deck Backs equivalents)
export {
  useTableStyleStore,
  // Selectors
  selectCurrentStyle,
  selectCurrentStyleName,
  selectCurrentStyleJapaneseName,
  selectCurrentStyleThemeColor,
  selectCurrentStyleAccentColor,
  selectDecreeSlotModifier,
  selectFlowerRateMultiplier,
  selectShopDiscountPercent,
  selectBaseScoreMultiplier,
  selectYakumanMultiplierBonus,
  selectScoreTargetMultiplier,
  selectFlowersDisabled,
  selectEarlyCorruptedSeasons,
  selectGrantRegionalMandate,
  selectUnlockedStyleCount,
  selectTotalStyleCount,
  selectUnlockCompletionPercent,
  selectMostRecentUnlock,
  selectTotalDecreesPurchased,
  selectHighestActCompleted,
  selectHasScoredYakuman,
  // Utilities
  getStylesWithUnlockStatus,
  getStyleProgressDisplay,
  calculateStyleCollectionPercentage,
  getUnlockRequirementsSummary,
  // Types
  type TableStyleState,
  type TableStyleUnlock,
  type TableStyleStats,
} from './tableStyleStore'

// Archive Store - Archive of Hands collection system (persisted)
export {
  useArchiveStore,
  // Selectors
  useArchiveCompletion,
  useCategoryCompletions,
  useRecentDiscoveries,
  // Utilities
  initializeArchive,
  // Types
  type ArchiveState,
} from './archiveStore'

// Progression Store - Meta-Progression system (persisted)
export {
  useProgressionStore,
  // Selectors
  selectTotalUnlocks,
  selectCategoryUnlockCount,
  selectRecentUnlocksCount,
  selectHasPendingUnlockNotifications,
  selectHighestAct,
  selectTotalWins,
  selectTotalGoldSpent,
  selectHighestHandScore,
  selectTotalTilesPlayed,
  selectTotalDecreesPurchased as selectProgressionDecreesPurchased,
  selectYakumanCount,
  selectFastestWin,
  // Utilities
  getUnlockWithStatus,
  getAllUnlocksWithStatus,
  formatLifetimeStat,
  // Types
  type ProgressionState,
  type UnlockRecord,
} from './progressionStore'
