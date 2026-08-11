/**
 * Partial Hand Parser for Tensho Mahjong Roguelike
 *
 * Riichi Mahjong only scores a complete 14-tile hand. Tensho is a roguelike:
 * the player plays *any* selection of tiles and is paid for whatever structure
 * that selection contains. This module finds the highest-scoring decomposition
 * of an arbitrary tile selection into quads, triplets, sequences, and pairs.
 *
 * Tiles that belong to no group are still scored for their tile points; they
 * simply contribute no structure points.
 */

import { Tile, TileSuit } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { ParsedHand, WaitType } from '../core/Hand'
import { getMeldStructurePoints } from './ScoringEngine'

/**
 * A decomposition of a tile selection into scoring groups.
 */
export interface PartialParse {
  /** Every group found, including the pair. Drives structure points. */
  groups: Meld[]
  /** Groups excluding the designated pair, matching ParsedHand.melds semantics. */
  melds: Meld[]
  /** The highest-value pair, if the selection contains one. */
  pair: Meld | null
  /** Tiles that belong to no group. */
  leftovers: Tile[]
  /** Total structure points contributed by `groups`. */
  structurePoints: number
}

/** A group chosen by the search, described by suit and ranks. */
interface GroupPlan {
  type: MeldType
  suit: TileSuit
  ranks: number[]
}

const MAX_RANK = 9

/**
 * Find the decomposition of `tiles` that maximises structure points.
 *
 * Melds never span suits, so each suit is solved independently and the results
 * are concatenated. Within a suit an exhaustive memoized search is cheap: a
 * selection is at most 14 tiles.
 */
export function parsePartialHand(tiles: Tile[]): PartialParse {
  const scoringTiles = tiles.filter((tile) => !tile.isBonus)

  // Pool real tiles by suit and rank so chosen groups can reference them.
  const pools = new Map<string, Tile[]>()
  const suits = new Set<TileSuit>()
  for (const tile of scoringTiles) {
    suits.add(tile.suit)
    const key = poolKey(tile.suit, tile.rank)
    const pool = pools.get(key)
    if (pool) pool.push(tile)
    else pools.set(key, [tile])
  }

  const plans: GroupPlan[] = []
  for (const suit of suits) {
    const counts = new Array<number>(MAX_RANK + 1).fill(0)
    for (const tile of scoringTiles) {
      if (tile.suit === suit) counts[tile.rank] += 1
    }
    plans.push(...solveSuit(counts, suit, new Map()).plan)
  }

  // Materialise the plans into melds backed by the actual tile instances.
  const used = new Set<string>()
  const groups: Meld[] = []
  for (const plan of plans) {
    const meldTiles: Tile[] = []
    for (const rank of plan.ranks) {
      const pool = pools.get(poolKey(plan.suit, rank))
      const tile = pool?.find((candidate) => !used.has(candidate.id))
      if (!tile) break
      used.add(tile.id)
      meldTiles.push(tile)
    }
    if (meldTiles.length === plan.ranks.length) {
      groups.push(new Meld(plan.type, meldTiles, true))
    }
  }

  const leftovers = scoringTiles.filter((tile) => !used.has(tile.id))

  // Designate the highest-value pair so the parse matches ParsedHand semantics.
  const pairIndex = groups.findIndex((group) => group.type === MeldType.Pair)
  const pair = pairIndex === -1 ? null : groups[pairIndex]
  const melds = pairIndex === -1 ? [...groups] : groups.filter((_, i) => i !== pairIndex)

  const structurePoints = groups.reduce(
    (sum, group) => sum + getMeldStructurePoints(group),
    0
  )

  return { groups, melds, pair, leftovers, structurePoints }
}

/**
 * Build a ParsedHand view of a partial selection.
 *
 * Scoring skips `pair` and yaku detection for partial plays, so the placeholder
 * used when a selection contains no pair is never read for points. It exists so
 * Decrees can inspect a uniformly shaped hand.
 */
export function toPartialParsedHand(parse: PartialParse, tiles: Tile[]): ParsedHand {
  const fallbackTile = tiles[tiles.length - 1]
  return {
    melds: parse.melds,
    pair: parse.pair ?? new Meld(MeldType.Pair, [], true),
    waitType: WaitType.Tanki,
    winningTile: fallbackTile,
    isConcealed: true,
  }
}

function poolKey(suit: TileSuit, rank: number): string {
  return `${suit}:${rank}`
}

function isSuitedSuit(suit: TileSuit): boolean {
  return suit === TileSuit.Manzu || suit === TileSuit.Pinzu || suit === TileSuit.Souzu
}

interface SuitSolution {
  points: number
  plan: GroupPlan[]
}

/**
 * Exhaustive memoized search for the best grouping of one suit.
 *
 * Always branches from the lowest remaining rank: every group that could use
 * that tile is tried, plus leaving it ungrouped. That covers the whole space
 * without revisiting permutations of the same choice set.
 */
function solveSuit(
  counts: number[],
  suit: TileSuit,
  memo: Map<string, SuitSolution>
): SuitSolution {
  const key = counts.join(',')
  const cached = memo.get(key)
  if (cached) return cached

  let rank = 1
  while (rank <= MAX_RANK && counts[rank] === 0) rank += 1
  if (rank > MAX_RANK) {
    const empty: SuitSolution = { points: 0, plan: [] }
    memo.set(key, empty)
    return empty
  }

  let best: SuitSolution = { points: 0, plan: [] }

  const consider = (type: MeldType, ranks: number[]) => {
    for (const r of ranks) counts[r] -= 1
    const rest = solveSuit(counts, suit, memo)
    for (const r of ranks) counts[r] += 1

    const total = STRUCTURE_POINTS_BY_TYPE[type] + rest.points
    if (total > best.points) {
      best = { points: total, plan: [{ type, suit, ranks }, ...rest.plan] }
    }
  }

  if (counts[rank] >= 4) consider(MeldType.Quad, [rank, rank, rank, rank])
  if (counts[rank] >= 3) consider(MeldType.Triplet, [rank, rank, rank])
  if (counts[rank] >= 2) consider(MeldType.Pair, [rank, rank])
  if (
    isSuitedSuit(suit) &&
    rank + 2 <= MAX_RANK &&
    counts[rank + 1] > 0 &&
    counts[rank + 2] > 0
  ) {
    consider(MeldType.Sequence, [rank, rank + 1, rank + 2])
  }

  // Leave this tile ungrouped.
  counts[rank] -= 1
  const skipped = solveSuit(counts, suit, memo)
  counts[rank] += 1
  if (skipped.points > best.points) {
    best = { points: skipped.points, plan: [...skipped.plan] }
  }

  memo.set(key, best)
  return best
}

/**
 * Structure points per group type, mirroring getMeldStructurePoints. The search
 * runs before any Meld exists, so it scores plans by type alone.
 */
const STRUCTURE_POINTS_BY_TYPE: Record<MeldType, number> = {
  [MeldType.Pair]: 10,
  [MeldType.Sequence]: 20,
  [MeldType.Triplet]: 30,
  [MeldType.Quad]: 50,
}
