/**
 * Core Type Definitions for Tensho Mahjong Roguelike
 *
 * This file contains foundational type definitions used across
 * the entire game system.
 */

// ============================================================================
// Tile Identification
// ============================================================================

/**
 * Unique identifier for a specific tile instance
 */
export type TileId = string

// ============================================================================
// Suit Types
// ============================================================================

/**
 * The four main suit categories in Mahjong
 * - Manzu: Characters (numbered 1-9)
 * - Pinzu: Circles/Dots (numbered 1-9)
 * - Souzu: Bamboo (numbered 1-9)
 * - Honor: Wind and Dragon tiles
 */
export enum Suit {
  Manzu = 'manzu', // Characters (萬子)
  Pinzu = 'pinzu', // Circles (筒子)
  Souzu = 'souzu', // Bamboo (索子)
  Honor = 'honor', // Honor tiles (字牌)
  // Legacy aliases used by the wall display.
  Characters = 'manzu',
  Circles = 'pinzu',
  Bamboo = 'souzu',
}

/**
 * Extended suit types including bonus tiles
 */
export enum ExtendedSuit {
  Manzu = 'manzu',
  Pinzu = 'pinzu',
  Souzu = 'souzu',
  Wind = 'wind',
  Dragon = 'dragon',
  Flower = 'flower',
  Season = 'season',
}

// ============================================================================
// Rank Types
// ============================================================================

/**
 * Rank for suited tiles (1-9)
 */
export type SuitedRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * Terminal ranks (1 and 9)
 */
export type TerminalRank = 1 | 9

/**
 * Simple ranks (2-8)
 */
export type SimpleRank = 2 | 3 | 4 | 5 | 6 | 7 | 8

// ============================================================================
// Honor Types
// ============================================================================

/**
 * Wind types for honor tiles
 */
export enum WindType {
  East = 1, // 東
  South = 2, // 南
  West = 3, // 西
  North = 4, // 北
}

/**
 * Dragon types for honor tiles
 */
export enum DragonType {
  White = 1, // 白 (Haku)
  Green = 2, // 發 (Hatsu)
  Red = 3, // 中 (Chun)
}

/**
 * Combined honor type (winds and dragons)
 */
export type HonorType = WindType | DragonType

// ============================================================================
// Bonus Tile Types
// ============================================================================

/**
 * Flower types for bonus tiles
 */
export enum FlowerType {
  Plum = 1, // 梅
  Orchid = 2, // 兰
  Chrysanthemum = 3, // 菊
  Bamboo = 4, // 竹
}

/**
 * Season types for bonus tiles
 */
export enum SeasonType {
  Spring = 1, // 春
  Summer = 2, // 夏
  Autumn = 3, // 秋
  Winter = 4, // 冬
}

// ============================================================================
// Tile Type Interface
// ============================================================================

/**
 * Core tile type definition
 */
export interface TileType {
  /** The suit category of the tile */
  suit: ExtendedSuit
  /** The rank within the suit (1-9 for suited, 1-4 for winds, 1-3 for dragons, 1-4 for bonus) */
  rank: number
  /** Whether this is a red dora tile (red five) */
  isRed: boolean
  /** Unique identifier for this tile instance */
  id: TileId
}

/**
 * Suited tile type (Manzu, Pinzu, Souzu)
 */
export interface SuitedTileType extends TileType {
  suit: ExtendedSuit.Manzu | ExtendedSuit.Pinzu | ExtendedSuit.Souzu
  rank: SuitedRank
}

/**
 * Wind tile type
 */
export interface WindTileType extends TileType {
  suit: ExtendedSuit.Wind
  rank: WindType
  isRed: false
}

/**
 * Dragon tile type
 */
export interface DragonTileType extends TileType {
  suit: ExtendedSuit.Dragon
  rank: DragonType
  isRed: false
}

/**
 * Flower bonus tile type
 */
export interface FlowerTileType extends TileType {
  suit: ExtendedSuit.Flower
  rank: FlowerType
  isRed: false
}

/**
 * Season bonus tile type
 */
export interface SeasonTileType extends TileType {
  suit: ExtendedSuit.Season
  rank: SeasonType
  isRed: false
}

// ============================================================================
// Tile Classification Helpers
// ============================================================================

/**
 * Check if a suit is a numbered suit (Manzu, Pinzu, Souzu)
 */
export function isNumberedSuit(
  suit: ExtendedSuit
): suit is ExtendedSuit.Manzu | ExtendedSuit.Pinzu | ExtendedSuit.Souzu {
  return (
    suit === ExtendedSuit.Manzu ||
    suit === ExtendedSuit.Pinzu ||
    suit === ExtendedSuit.Souzu
  )
}

/**
 * Check if a suit is an honor suit (Wind or Dragon)
 */
export function isHonorSuit(
  suit: ExtendedSuit
): suit is ExtendedSuit.Wind | ExtendedSuit.Dragon {
  return suit === ExtendedSuit.Wind || suit === ExtendedSuit.Dragon
}

/**
 * Check if a suit is a bonus suit (Flower or Season)
 */
export function isBonusSuit(
  suit: ExtendedSuit
): suit is ExtendedSuit.Flower | ExtendedSuit.Season {
  return suit === ExtendedSuit.Flower || suit === ExtendedSuit.Season
}

/**
 * Check if a rank is a terminal rank (1 or 9)
 */
export function isTerminalRank(rank: number): rank is TerminalRank {
  return rank === 1 || rank === 9
}

/**
 * Check if a rank is a simple rank (2-8)
 */
export function isSimpleRank(rank: number): rank is SimpleRank {
  return rank >= 2 && rank <= 8
}

// ============================================================================
// Tile Set Constants
// ============================================================================

/**
 * Total count of standard tiles (no bonus)
 */
export const STANDARD_TILE_COUNT = 136

/**
 * Total count of bonus tiles
 */
export const BONUS_TILE_COUNT = 8

/**
 * Total count of all tiles
 */
export const FULL_TILE_COUNT = STANDARD_TILE_COUNT + BONUS_TILE_COUNT // 144

/**
 * Number of tiles per unique tile type
 */
export const COPIES_PER_TILE = 4

/**
 * Dead wall size
 */
export const DEAD_WALL_SIZE = 14

/**
 * Starting hand size
 */
export const STARTING_HAND_SIZE = 13

/**
 * Full hand size (with drawn tile)
 */
export const FULL_HAND_SIZE = 14

// ============================================================================
// Wind Names (for display)
// ============================================================================

export const WIND_NAMES: Record<WindType, string> = {
  [WindType.East]: 'East',
  [WindType.South]: 'South',
  [WindType.West]: 'West',
  [WindType.North]: 'North',
}

export const WIND_KANJI: Record<WindType, string> = {
  [WindType.East]: '東',
  [WindType.South]: '南',
  [WindType.West]: '西',
  [WindType.North]: '北',
}

// ============================================================================
// Dragon Names (for display)
// ============================================================================

export const DRAGON_NAMES: Record<DragonType, string> = {
  [DragonType.White]: 'White',
  [DragonType.Green]: 'Green',
  [DragonType.Red]: 'Red',
}

export const DRAGON_KANJI: Record<DragonType, string> = {
  [DragonType.White]: '白',
  [DragonType.Green]: '發',
  [DragonType.Red]: '中',
}

// ============================================================================
// Flower Names (for display)
// ============================================================================

export const FLOWER_NAMES: Record<FlowerType, string> = {
  [FlowerType.Plum]: 'Plum',
  [FlowerType.Orchid]: 'Orchid',
  [FlowerType.Chrysanthemum]: 'Chrysanthemum',
  [FlowerType.Bamboo]: 'Bamboo',
}

export const FLOWER_KANJI: Record<FlowerType, string> = {
  [FlowerType.Plum]: '梅',
  [FlowerType.Orchid]: '兰',
  [FlowerType.Chrysanthemum]: '菊',
  [FlowerType.Bamboo]: '竹',
}

// ============================================================================
// Season Names (for display)
// ============================================================================

export const SEASON_NAMES: Record<SeasonType, string> = {
  [SeasonType.Spring]: 'Spring',
  [SeasonType.Summer]: 'Summer',
  [SeasonType.Autumn]: 'Autumn',
  [SeasonType.Winter]: 'Winter',
}

export const SEASON_KANJI: Record<SeasonType, string> = {
  [SeasonType.Spring]: '春',
  [SeasonType.Summer]: '夏',
  [SeasonType.Autumn]: '秋',
  [SeasonType.Winter]: '冬',
}
