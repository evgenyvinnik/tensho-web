/**
 * Tile Modifier System for Tensho Mahjong Roguelike
 *
 * Scores the Editions of played tiles (`EnhancementType` in code). This is the
 * Tensho equivalent of Balatro's card enhancements.
 *
 * Handles:
 * - Edition Points, Mult, ×Mult (Lucky) and Gold
 * - the Fate Seal a Glass tile makes and the Orb a Steel tile makes
 * - the 1 in 4 roll that shatters Glass or rusts Steel after a play
 */

import { Tile } from '../core/Tile'
import {
  calculateModifierEffects,
  type CreatedConsumable,
  type EditionRound,
  type TileBreak,
} from '../core/TileModifier'

/** A tile its Edition broke during a play. */
export interface BrokenTile {
  tileId: string
  breaks: TileBreak
}

/** Something a played tile's Edition made. */
export interface MadeConsumable {
  type: Exclude<CreatedConsumable, 'none'>
  tileId: string
}

/**
 * TileModifierSystem scores played tiles' Editions
 */
export class TileModifierSystem {
  /**
   * Score multiple played tiles with their Editions.
   * Returns total chips, mult, multiplier and Gold from all tiles, plus what
   * they made and which of them broke.
   *
   * `preview` scores without touching state: no tile breaks, so the same call
   * can drive the pre-play score preview.
   */
  scoreTilesWithModifiers(
    tiles: Tile[],
    options: EditionRound & {
      preview?: boolean
      extraRetriggers?: ReadonlyMap<string, number>
      retriggerStrength?: number
    } = {}
  ): {
    totalChips: number
    totalMult: number
    totalMultiplier: number
    totalGold: number
    brokenTiles: BrokenTile[]
    consumables: MadeConsumable[]
  } {
    const preview = options.preview ?? false
    let totalChips = 0
    let totalMult = 0
    let totalMultiplier = 1
    let totalGold = 0
    const brokenTiles: BrokenTile[] = []
    const consumables: MadeConsumable[] = []
    let nativeChips = 0,
      nativeMult = 0,
      nativeMultiplier = 1,
      nativeGold = 0

    for (const tile of tiles) {
      const result = calculateModifierEffects(tile.modifiers, tile.id, {
        act: options.act,
        luckyRolls: options.luckyRolls,
        deterministic: preview,
      })

      const repeats =
        1 + Math.max(0, options.extraRetriggers?.get(tile.id) ?? 0)
      // Resolve chance/lifecycle once per physical tile. Repeats reuse that
      // reward; Glass cannot disappear halfway through its own paid score.
      nativeChips += result.chipBonus
      nativeMult += result.multBonus
      nativeGold += result.goldBonus
      nativeMultiplier *= result.multMultiplier

      for (let i = 0; i < repeats; i++) {
        totalChips += result.chipBonus
        totalMult += result.multBonus
        totalMultiplier *= result.multMultiplier
        totalGold += result.goldBonus
      }

      // A tile makes its Seal or Orb once per play, however often it scores.
      if (result.createdConsumable !== 'none')
        consumables.push({ type: result.createdConsumable, tileId: tile.id })

      if (result.broke)
        brokenTiles.push({ tileId: tile.id, breaks: result.broke })
    }

    const strength = options.retriggerStrength ?? 1
    const retain = (native: number, full: number) =>
      strength === 1 ? full : native + (full - native) * strength
    return {
      totalChips: retain(nativeChips, totalChips),
      totalMult: retain(nativeMult, totalMult),
      totalMultiplier: retain(nativeMultiplier, totalMultiplier),
      totalGold: retain(nativeGold, totalGold),
      brokenTiles,
      consumables,
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global tile modifier system instance
 */
export const tileModifierSystem = new TileModifierSystem()
