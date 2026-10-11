/**
 * Hand groups.
 *
 * Newcomers cannot see which tiles belong together, so the rack can be shown
 * as the groups the scorer would find: each Pair, Sequence, Triplet and Quad
 * side by side, then every tile that belongs to no group. The decomposition is
 * `parsePartialHand`, the same search that prices plays, so the rack never
 * claims a group the scorer would not pay for.
 *
 * Concealed and bonus tiles are never grouped: a face-down tile must not leak
 * its identity through where it is placed.
 */

import { MeldType } from '../core/Meld'
import { Tile } from '../core/Tile'
import {
  parsePartialHand,
  type PartialHandRules,
} from '../rules/PartialHandParser'
import { STRUCTURE_POINTS_BY_TYPE } from '../rules/ScoringEngine'

export type HandClusterKind = MeldType | 'loose'

export interface HandCluster {
  kind: HandClusterKind
  /** Tiles in their original rack order. */
  tiles: Tile[]
  /** Structure points the group earns when played together; 0 when loose. */
  structurePoints: number
  /** Scoring groups represented by this physical cluster (Plum can share a tile). */
  groupCount: number
}

/**
 * Split a rack into scoring groups followed by one cluster of loose tiles.
 *
 * Groups keep the rack's order (by their first tile), so suits stay where the
 * player expects them. The loose cluster is omitted when every tile is grouped.
 */
export function groupHand(
  tiles: readonly Tile[],
  concealedIds: ReadonlySet<string> = new Set(),
  rules: PartialHandRules = {}
): HandCluster[] {
  const position = new Map(tiles.map((tile, index) => [tile.id, index]))
  const visible = tiles.filter(
    (tile) => !tile.isBonus && !concealedIds.has(tile.id)
  )
  const parsed = parsePartialHand(visible, rules)
  const byRackOrder = (left: Tile, right: Tile) =>
    position.get(left.id)! - position.get(right.id)!

  let groups: HandCluster[] = []
  for (const group of parsed.groups) {
    const groupIds = new Set(group.tiles.map((tile) => tile.id))
    const overlapping = groups.filter((cluster) =>
      cluster.tiles.some((tile) => groupIds.has(tile.id))
    )
    // The authoritative parse may pay two sequences sharing one physical tile.
    // Keep both payments, but merge their rack positions so that the shared
    // tile has one button, one drag target and one empty slot when staged.
    const physicalTiles = new Map(
      [...overlapping.flatMap((cluster) => cluster.tiles), ...group.tiles].map(
        (tile) => [tile.id, tile]
      )
    )
    groups = groups.filter((cluster) => !overlapping.includes(cluster))
    groups.push({
      kind: group.type,
      tiles: [...physicalTiles.values()].sort(byRackOrder),
      structurePoints:
        STRUCTURE_POINTS_BY_TYPE[group.type] +
        overlapping.reduce((sum, cluster) => sum + cluster.structurePoints, 0),
      groupCount:
        1 + overlapping.reduce((sum, cluster) => sum + cluster.groupCount, 0),
    })
  }
  groups.sort((left, right) => byRackOrder(left.tiles[0], right.tiles[0]))

  const grouped = new Set(
    groups.flatMap((group) => group.tiles.map((tile) => tile.id))
  )
  const loose = tiles.filter((tile) => !grouped.has(tile.id))
  return loose.length > 0
    ? [
        ...groups,
        { kind: 'loose', tiles: loose, structurePoints: 0, groupCount: 0 },
      ]
    : groups
}
