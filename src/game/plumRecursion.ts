import { Meld, MeldType } from '../core/Meld'
import { Tile } from '../core/Tile'

/** Reserve existing river identities; never score, draw, or mutate a tile.
 * Use the paid parse, but require its faces to be physically present. Virtual
 * completions and temporary scoring transmutations cannot earn a recovery.
 */
export function planPlumRecursion(
  groups: readonly Meld[],
  played: readonly Tile[],
  river: readonly Tile[]
): string[] {
  const physical = new Map(played.map((tile) => [tile.id, tile]))
  const reserved = new Set<string>()
  for (const group of groups) {
    if (
      group.type !== MeldType.Sequence ||
      group.tiles.length !== 3 ||
      !group.tiles.every((tile) => {
        const actual = physical.get(tile.id)
        return (
          actual?.isSuited &&
          actual.suit === tile.suit &&
          actual.rank === tile.rank
        )
      })
    )
      continue

    // Latest matching discard wins. Each physical river tile pays at most once,
    // even when the complete hand contains identical sequences.
    for (let i = river.length - 1; i >= 0; i--) {
      const tile = river[i]
      if (
        !reserved.has(tile.id) &&
        !physical.has(tile.id) &&
        group.tiles.some(
          (face) => tile.suit === face.suit && tile.rank === face.rank
        )
      ) {
        reserved.add(tile.id)
        break
      }
    }
  }
  return [...reserved]
}
