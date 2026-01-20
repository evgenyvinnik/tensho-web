/**
 * Core module exports for Tensho Mahjong Roguelike
 */

// Core types
export {
  // Suit types
  Suit,
  ExtendedSuit,
  // Honor types
  WindType as HonorWindType,
  DragonType as HonorDragonType,
  // Bonus types
  FlowerType as BonusFlowerType,
  SeasonType as BonusSeasonType,
  // Type guards
  isNumberedSuit,
  isHonorSuit,
  isBonusSuit,
  isTerminalRank,
  isSimpleRank,
  // Constants
  STANDARD_TILE_COUNT,
  BONUS_TILE_COUNT,
  FULL_TILE_COUNT,
  COPIES_PER_TILE,
  DEAD_WALL_SIZE,
  STARTING_HAND_SIZE,
  FULL_HAND_SIZE,
  // Display names
  WIND_NAMES,
  WIND_KANJI,
  DRAGON_NAMES,
  DRAGON_KANJI,
  FLOWER_NAMES,
  FLOWER_KANJI,
  SEASON_NAMES,
  SEASON_KANJI,
} from './types'
export type {
  TileId,
  SuitedRank,
  TerminalRank,
  SimpleRank,
  HonorType,
  TileType,
  SuitedTileType,
  WindTileType,
  DragonTileType,
  FlowerTileType,
  SeasonTileType,
} from './types'

// Tile system
export {
  Tile,
  TileSuit,
  WindType,
  DragonType,
  FlowerType,
  SeasonType,
  generateTileId,
  resetTileIdCounter,
  createStandardTileSet,
  createBonusTileSet,
  createFullTileSet,
  countTilesByType,
  groupTilesBySuit,
} from './Tile'
export type { TileData } from './Tile'

// Meld system
export {
  Meld,
  MeldType,
  findPossibleSequences,
  findPossibleTriplets,
  findPossiblePairs,
} from './Meld'
export type { MeldData } from './Meld'

// Hand system
export { Hand, WaitType } from './Hand'
export type { HandState, ParsedHand } from './Hand'

// Wall system
export {
  Wall,
  SeededRandom,
  getDoraFromIndicator,
  isDora,
  countDora,
} from './Wall'
export type { WallState } from './Wall'

// DeadPool system
export { DeadPool } from './DeadPool'
export type { DeadPoolState } from './DeadPool'
