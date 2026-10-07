import { Tile, TileSuit } from '../core/Tile'
import type { FlowerCollection } from './types'

/** Honor-count effects share one interpretation; never duplicate physical
 * tiles, retriggers, gold effects, or the members needed to form a Yaku.
 */
export function countScoringHonors(context: {
  tiles: readonly Tile[]
  flowers: FlowerCollection
  flowersSuppressed?: boolean
}): number {
  const doubleDragons =
    !context.flowersSuppressed &&
    context.flowers.flowers.some(
      (flower) =>
        flower.type === 'Orchid' &&
        flower.mutation?.mutationId === 'orchid_double_dragons' &&
        flower.mutation.isUnlocked
    )
  return context.tiles.reduce(
    (count, tile) =>
      count +
      (tile.isHonor
        ? doubleDragons && tile.suit === TileSuit.Dragon
          ? 2
          : 1
        : 0),
    0
  )
}
