/**
 * Rules module exports for Tensho Mahjong Roguelike
 *
 * This module provides the complete rules engine for the game:
 * - Hand validation and completion checking
 * - Shanten (tiles to tenpai) calculation
 * - Yaku (scoring patterns) detection
 * - Score calculation
 */

// =============================================================================
// Hand Validator
// =============================================================================

export {
  isSevenPairs,
  isKokushi,
  isCompleteHand,
  validateHand,
  parseStandardForm,
  getWaitingTiles,
  KOKUSHI_TILES,
} from './HandValidator'

export type { ValidationResult } from './HandValidator'

// =============================================================================
// Shanten Calculator
// =============================================================================

export {
  calculateShanten,
  calculateStandardShanten,
  calculateSevenPairsShanten,
  calculateKokushiShanten,
  isTenpai,
  isComplete,
  getEffectiveTiles,
  getWaitingTiles as getShantenWaitingTiles,
} from './ShantenCalculator'

export type { ShantenResult } from './ShantenCalculator'

// =============================================================================
// Yaku Detector
// =============================================================================

export {
  // Yaku definitions
  RIICHI,
  TANYAO,
  PINFU,
  YAKUHAI,
  MENZEN_TSUMO,
  IIPEIKOU,
  SANSHOKU_DOUJUN,
  ITTSU,
  TOITOI,
  CHANTA,
  HONROUTOU,
  HONITSU,
  CHINITSU,
  RYANPEIKOU,
  JUNCHAN,
  SEVEN_PAIRS,
  KOKUSHI,
  SUU_ANKOU,
  DAI_SANGEN,
  CHINROUTOU,
  CHUUREN_POUTOU,
  ALL_YAKU,
  // Detection functions
  detectYaku,
  calculateYakuMultiplier,
  getYakuById,
  getYakuByTier,
  // Individual check functions
  checkTanyao,
  checkPinfu,
  checkYakuhai,
  checkIipeikou,
  checkRyanpeikou,
  checkSanshokuDoujun,
  checkIttsu,
  checkToitoi,
  checkChanta,
  checkJunchan,
  checkHonroutou,
  checkHonitsu,
  checkChinitsu,
  checkSuuAnkou,
  checkDaiSangen,
  checkChinroutou,
  checkChuurenPoutou,
} from './YakuDetector'

export type {
  YakuDefinition,
  DetectedYaku,
  YakuContext,
} from './YakuDetector'

// =============================================================================
// Scoring Engine
// =============================================================================

export {
  calculateScore,
  calculateTilePoints,
  calculateStructurePoints,
  calculateBasePoints,
  createScoringContext,
  quickScore,
  formatScoreBreakdown,
  calculateSimpleScore,
  estimateScoreRange,
  getTilePoints,
  getMeldStructurePoints,
} from './ScoringEngine'

export type {
  ScoringContext,
  ScoreBreakdown,
} from './ScoringEngine'
