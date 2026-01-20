/**
 * Rules module exports for Tensho Mahjong Roguelike
 */

// Hand Validator
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

// Shanten Calculator
export {
  calculateShanten,
  calculateStandardShanten,
  calculateSevenPairsShanten,
  calculateKokushiShanten,
  isTenpai,
  isComplete,
  getEffectiveTiles,
} from './ShantenCalculator'
export type { ShantenResult } from './ShantenCalculator'

// Yaku Definitions
export {
  YakuTier,
  YAKU_DEFINITIONS,
  getYakuById,
  getYakuByTier,
} from './YakuDefinition'
export type { YakuDefinition, DetectedYaku, YakuContext } from './YakuDefinition'

// Yaku Detector
export { detectYaku, calculateYakuMultiplier } from './YakuDetector'

// Scoring Engine
export {
  calculateScore,
  calculateTilePoints,
  calculateStructurePoints,
  calculateDoraBonus,
  calculateDecreeBonus,
  calculateFlowerBonus,
  calculateSeasonMultiplier,
  createDefaultScoringContext,
  quickScore,
  formatScoreBreakdown,
} from './ScoringEngine'
export type {
  ScoringContext,
  ScoreBreakdown,
  DecreeModifier,
  FlowerBonus,
  SeasonEffect,
} from './ScoringEngine'
