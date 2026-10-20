/**
 * Fate Seals used in the Tea House work on the run's wall, not a hand.
 *
 * Pure rules shared by the engine's check and the wall picker: which tiles a
 * Seal may take, and what each chosen tile becomes. The tile changes mirror
 * the engine's settlement exactly (same conversions, same ids), so the picker
 * can show the result before the player commits and a Mega pack can check a
 * second Seal against the wall the first one leaves.
 *
 * @module gameplay/wallSeals
 */

import { Tile } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import {
  convertSuitedTile,
  convertSuitedTileRank,
} from '../core/tileTransformations'
import type { FateSeal } from '../systems/FateSealSystem'
import { consumableTargetRange } from './consumableTargeting'

/** The tiles a Seal can be laid on: every wall tile but Flowers and Seasons. */
export function sealableWallTiles(wall: readonly Tile[]): Tile[] {
  return wall.filter((tile) => !tile.isBonus)
}

/** Whether a Seal that takes targets would change this tile. */
export function canSealTile(seal: FateSeal, tile: Tile): boolean {
  if (tile.isBonus) return false
  const { effect } = seal
  switch (effect.type) {
    case 'convert_suit':
      return tile.isSuited && tile.suit !== effect.targetSuit
    case 'rank_modification': {
      const rank = tile.rank + (effect.rankChange ?? 1)
      return tile.isSuited && rank >= 1 && rank <= 9
    }
    default:
      return true
  }
}

/** One chosen tile and what it becomes; `after` is null when destroyed. */
export interface SealedTile {
  before: Tile
  after: Tile | null
}

/**
 * What the Seal makes of the chosen tiles, in choice order. Seal of
 * Transmutation turns the first tile into a copy of the second, which itself
 * stays as it is.
 */
export function previewWallSeal(
  seal: FateSeal,
  wall: readonly Tile[],
  targetIds: readonly string[]
): SealedTile[] {
  const chosen = targetIds
    .map((id) => wall.find((tile) => tile.id === id))
    .filter((tile): tile is Tile => tile !== undefined)
  const { effect } = seal
  switch (effect.type) {
    case 'enhance_tiles':
      return chosen.map((tile) => ({
        before: tile,
        after: effect.enhancement
          ? tile.withEnhancement(effect.enhancement)
          : tile,
      }))
    case 'convert_to_wild':
      return chosen.map((tile) => ({
        before: tile,
        after: tile.withEnhancement(EnhancementType.Wild),
      }))
    case 'convert_suit':
      return chosen.map((tile) => ({
        before: tile,
        after: effect.targetSuit
          ? convertSuitedTile(tile, effect.targetSuit)
          : tile,
      }))
    case 'rank_modification':
      return chosen.map((tile) => ({
        before: tile,
        after: convertSuitedTileRank(
          tile,
          tile.rank + (effect.rankChange ?? 1)
        ),
      }))
    case 'destroy_tiles':
      return chosen.map((tile) => ({ before: tile, after: null }))
    case 'copy_tile': {
      const [target, source] = chosen
      if (!target || !source) return []
      return [
        {
          before: target,
          after: new Tile(
            source.suit,
            source.rank,
            target.id,
            source.isRed,
            source.modifiers
          ),
        },
      ]
    }
    default:
      return []
  }
}

/** The wall as it stands after the Seal, for checking a Seal that follows. */
export function wallAfterSeal(
  seal: FateSeal,
  wall: readonly Tile[],
  targetIds: readonly string[]
): Tile[] {
  const changes = new Map(
    previewWallSeal(seal, wall, targetIds).map(({ before, after }) => [
      before.id,
      after,
    ])
  )
  return wall.flatMap((tile) => {
    if (!changes.has(tile.id)) return [tile]
    const after = changes.get(tile.id)
    return after ? [after] : []
  })
}

/**
 * A fixed choice for scripted play (simulations and tests): the first tiles
 * in wall order the Seal would change, as many as it takes.
 */
export function firstSealTargets(
  seal: FateSeal,
  wall: readonly Tile[]
): string[] {
  const { max } = consumableTargetRange(seal.effect)
  return sealableWallTiles(wall)
    .filter((tile) => canSealTile(seal, tile))
    .slice(0, max)
    .map((tile) => tile.id)
}

/** `firstSealTargets` for each chosen Seal of a pack, by its index there. */
export function firstPackSealTargets(
  contents: readonly { type: string; data: unknown }[],
  indices: readonly number[],
  wall: readonly Tile[]
): Record<number, string[]> {
  return Object.fromEntries(
    indices
      .filter((i) => contents[i]?.type === 'FateSeal')
      .map((i) => [i, firstSealTargets(contents[i].data as FateSeal, wall)])
  )
}

/**
 * Why these targets cannot take the Seal, or null when they can. Every chosen
 * tile must be a distinct wall tile the Seal would change; with no targets
 * given, it only asks whether the wall holds enough such tiles at all.
 */
export function wallSealTargetError(
  seal: FateSeal,
  wall: readonly Tile[],
  targetIds?: readonly string[]
): string | null {
  const { min, max } = consumableTargetRange(seal.effect)
  if (max === 0) return null
  const eligible = sealableWallTiles(wall).filter((tile) =>
    canSealTile(seal, tile)
  )
  if (!targetIds)
    return eligible.length >= Math.max(min, 1)
      ? null
      : seal.effect.type === 'convert_suit'
        ? 'Choose a suited tile of a different suit'
        : seal.effect.type === 'rank_modification'
          ? 'Choose a suited tile whose new rank is between 1 and 9'
          : 'No tiles selected'
  if (new Set(targetIds).size !== targetIds.length)
    return 'Choose each tile once'
  if (targetIds.some((id) => !eligible.some((tile) => tile.id === id)))
    return seal.effect.type === 'convert_suit'
      ? 'Choose a suited tile of a different suit'
      : seal.effect.type === 'rank_modification'
        ? 'Choose a suited tile whose new rank is between 1 and 9'
        : 'Choose tiles from your wall'
  return null
}
