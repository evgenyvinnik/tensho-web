/**
 * Hand groups.
 *
 * Newcomers cannot see which tiles belong together, so the rack can be shown
 * as the groups the scorer would find: each Pair, Sequence, Triplet and Quad
 * marked where it sits, with the tiles that belong to no group beside it. The
 * decomposition is `parsePartialHand`, the same search that prices plays, so
 * the rack never claims a group the scorer would not pay for. Where two
 * readings pay the same structure, the rack shows the stronger groups: a
 * Straight rather than a Sequence and a Pair.
 *
 * Suits stay together: melds never span suits, so each group sits among the
 * loose tiles of its own suit, in rack order, and the rack still reads as a
 * sorted hand.
 *
 * Concealed and bonus tiles are never grouped: a face-down tile must not leak
 * its identity through where it is placed, so concealed tiles follow every
 * suit in one cluster of their own.
 */

import { MeldType } from '../core/Meld'
import { Tile, TileSuit } from '../core/Tile'
import {
  parsePartialHand,
  type PartialHandRules,
} from '../rules/PartialHandParser'
import { getMeldStructurePoints } from '../rules/ScoringEngine'

export type HandClusterKind = MeldType | 'loose'

export interface HandCluster {
  kind: HandClusterKind
  /** Tiles in their original rack order. */
  tiles: Tile[]
  /** Structure points the group earns when played together; 0 when loose. */
  structurePoints: number
  /** Scoring groups represented by this physical cluster (Plum can share a tile). */
  groupCount: number
  /** Suit of every tile in the cluster; null for the concealed cluster. */
  suit: TileSuit | null
}

/**
 * Split a rack into clusters, suit by suit: within a suit, each scoring group
 * and each run of loose tiles keeps its rack position. Concealed tiles come
 * last. Suits appear in the order the rack first shows them.
 */
export function groupHand(
  tiles: readonly Tile[],
  concealedIds: ReadonlySet<string> = new Set(),
  rules: PartialHandRules = {}
): HandCluster[] {
  const position = new Map(tiles.map((tile, index) => [tile.id, index]))
  const visible = tiles.filter((tile) => !concealedIds.has(tile.id))
  const parsed = parsePartialHand(
    visible.filter((tile) => !tile.isBonus),
    rules
  )
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
        getMeldStructurePoints(group) +
        overlapping.reduce((sum, cluster) => sum + cluster.structurePoints, 0),
      groupCount:
        1 + overlapping.reduce((sum, cluster) => sum + cluster.groupCount, 0),
      suit: group.tiles[0].suit,
    })
  }

  const grouped = new Set(
    groups.flatMap((group) => group.tiles.map((tile) => tile.id))
  )
  const suitRank = new Map<TileSuit, number>()
  for (const tile of visible)
    if (!suitRank.has(tile.suit)) suitRank.set(tile.suit, suitRank.size)

  // Every group and every loose tile is placed by its suit, then by its first
  // rack position; neighbouring loose tiles of one suit share a cluster.
  const units: HandCluster[] = [
    ...groups,
    ...visible
      .filter((tile) => !grouped.has(tile.id))
      .map((tile) => ({
        kind: 'loose' as const,
        tiles: [tile],
        structurePoints: 0,
        groupCount: 0,
        suit: tile.suit,
      })),
  ].sort(
    (left, right) =>
      suitRank.get(left.suit!)! - suitRank.get(right.suit!)! ||
      byRackOrder(left.tiles[0], right.tiles[0])
  )

  const clusters: HandCluster[] = []
  for (const unit of units) {
    const previous = clusters.at(-1)
    if (
      unit.kind === 'loose' &&
      previous?.kind === 'loose' &&
      previous.suit === unit.suit
    )
      previous.tiles.push(...unit.tiles)
    else clusters.push(unit)
  }

  const concealed = tiles.filter((tile) => concealedIds.has(tile.id))
  if (concealed.length > 0)
    clusters.push({
      kind: 'loose',
      tiles: concealed,
      structurePoints: 0,
      groupCount: 0,
      suit: null,
    })
  return clusters
}
