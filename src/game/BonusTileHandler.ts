/**
 * Bonus Tile Handler for Tensho Mahjong Roguelike
 *
 * Handles the special mechanics for Flower and Season tiles:
 * - Immediate reveal when drawn
 * - Add to Flora Track (not hand)
 * - Draw replacement from dead wall
 * - Apply immediate effects
 */

import { Tile, TileSuit, FlowerType, SeasonType } from '../core/Tile'
import {
  FlowerTile,
  SeasonTile,
  SeasonEffect,
  createFlowerTile,
  createSeasonTile,
} from '../stores/floraStore'

// =============================================================================
// RESULT TYPES
// =============================================================================

/**
 * Result of handling a bonus tile draw
 */
export interface BonusDrawResult {
  wasBonus: boolean
  bonusType?: 'flower' | 'season'
  tile?: FlowerTile | SeasonTile
  replacementTile?: Tile | null
  immediateEffect?: ImmediateEffect
}

/**
 * Immediate effect from bonus tile
 */
export interface ImmediateEffect {
  type: 'gold' | 'score_bonus' | 'draw_bonus' | 'none'
  value?: number
  description: string
}

// =============================================================================
// FLOWER EFFECTS
// =============================================================================

/**
 * Get the effect description for a flower type
 */
function getFlowerEffectDescription(type: FlowerType): string {
  switch (type) {
    case FlowerType.Plum:
      return '+5% score per completed sequence'
    case FlowerType.Orchid:
      return '+5% score per honor tile used'
    case FlowerType.Chrysanthemum:
      return '+5% score per concealed meld'
    case FlowerType.Bamboo:
      return '+5% score per terminal used'
    default:
      return 'Unknown flower effect'
  }
}

// =============================================================================
// SEASON EFFECTS
// =============================================================================

/**
 * Get the base effect for a season type
 */
function getSeasonEffect(type: SeasonType): SeasonEffect {
  switch (type) {
    case SeasonType.Spring:
      return {
        type: 'score_multiplier',
        value: 2,
        description: '+2 draws per hand',
      }
    case SeasonType.Summer:
      return {
        type: 'score_multiplier',
        value: 1.3,
        description: 'Base score +30%, wall size -20%',
      }
    case SeasonType.Autumn:
      return {
        type: 'yaku_mutation',
        value: 1.2,
        description: 'Yaku multipliers +20%',
      }
    case SeasonType.Winter:
      return {
        type: 'score_multiplier',
        value: 0.75,
        description: 'Hand legality loosened, but score -25%',
      }
    default:
      return {
        type: 'score_multiplier',
        value: 1,
        description: 'Unknown season effect',
      }
  }
}

// =============================================================================
// BONUS TILE HANDLER CLASS
// =============================================================================

/**
 * Handles bonus tile (Flower/Season) mechanics
 */
export class BonusTileHandler {
  /**
   * Check if a tile is a bonus tile
   */
  isBonusTile(tile: Tile): boolean {
    return tile.suit === TileSuit.Flower || tile.suit === TileSuit.Season
  }

  /**
   * Check if a tile is a flower
   */
  isFlower(tile: Tile): boolean {
    return tile.suit === TileSuit.Flower
  }

  /**
   * Check if a tile is a season
   */
  isSeason(tile: Tile): boolean {
    return tile.suit === TileSuit.Season
  }

  /**
   * Handle a drawn tile, checking if it's a bonus tile
   */
  handleDraw(
    tile: Tile,
    drawReplacement: () => Tile | null
  ): BonusDrawResult {
    if (!this.isBonusTile(tile)) {
      return { wasBonus: false }
    }

    if (this.isFlower(tile)) {
      return this.handleFlowerDraw(tile, drawReplacement)
    } else {
      return this.handleSeasonDraw(tile, drawReplacement)
    }
  }

  /**
   * Handle a flower tile draw
   */
  private handleFlowerDraw(
    tile: Tile,
    drawReplacement: () => Tile | null
  ): BonusDrawResult {
    const flowerType = tile.rank as FlowerType
    const flowerTile = this.createFlowerFromTile(tile, flowerType)

    // Draw replacement from dead wall
    const replacementTile = drawReplacement()

    return {
      wasBonus: true,
      bonusType: 'flower',
      tile: flowerTile,
      replacementTile,
      immediateEffect: {
        type: 'none',
        description: getFlowerEffectDescription(flowerType),
      },
    }
  }

  /**
   * Handle a season tile draw
   */
  private handleSeasonDraw(
    tile: Tile,
    drawReplacement: () => Tile | null
  ): BonusDrawResult {
    const seasonType = tile.rank as SeasonType
    const seasonTile = this.createSeasonFromTile(tile, seasonType)

    // Draw replacement from dead wall
    const replacementTile = drawReplacement()

    return {
      wasBonus: true,
      bonusType: 'season',
      tile: seasonTile,
      replacementTile,
      immediateEffect: {
        type: 'none',
        description: getSeasonEffect(seasonType).description,
      },
    }
  }

  /**
   * Create a FlowerTile from a raw Tile
   */
  private createFlowerFromTile(_tile: Tile, type: FlowerType): FlowerTile {
    return createFlowerTile(type)
  }

  /**
   * Create a SeasonTile from a raw Tile
   */
  private createSeasonFromTile(_tile: Tile, type: SeasonType): SeasonTile {
    const effect = getSeasonEffect(type)
    return createSeasonTile(type, effect)
  }

  /**
   * Add a flower to the flora track
   */
  addFlower(
    tile: FlowerTile,
    addToStore: (flower: FlowerTile) => void
  ): void {
    addToStore(tile)
  }

  /**
   * Add a season to the flora track
   */
  addSeason(
    tile: SeasonTile,
    addToStore: (season: SeasonTile) => void
  ): void {
    addToStore(tile)
  }

  /**
   * Apply immediate effect of a bonus tile (if any)
   */
  applyImmediateEffect(
    effect: ImmediateEffect,
    context: {
      addGold?: (amount: number) => void
      addScore?: (points: number) => void
      addDraws?: (count: number) => void
    }
  ): void {
    switch (effect.type) {
      case 'gold':
        if (context.addGold && effect.value) {
          context.addGold(effect.value)
        }
        break
      case 'score_bonus':
        if (context.addScore && effect.value) {
          context.addScore(effect.value)
        }
        break
      case 'draw_bonus':
        if (context.addDraws && effect.value) {
          context.addDraws(effect.value)
        }
        break
      case 'none':
      default:
        // No immediate effect
        break
    }
  }

  /**
   * Get the flower type from a flower tile
   */
  getFlowerType(tile: Tile): FlowerType | null {
    if (tile.suit !== TileSuit.Flower) {
      return null
    }
    return tile.rank as FlowerType
  }

  /**
   * Get the season type from a season tile
   */
  getSeasonType(tile: Tile): SeasonType | null {
    if (tile.suit !== TileSuit.Season) {
      return null
    }
    return tile.rank as SeasonType
  }
}

/**
 * Create a default bonus tile handler
 */
export function createBonusTileHandler(): BonusTileHandler {
  return new BonusTileHandler()
}
