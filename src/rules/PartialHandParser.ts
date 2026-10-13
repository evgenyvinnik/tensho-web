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
import {
  sequenceOffsets,
  overlappingSequencePairs,
  type SequenceRules,
} from './sequenceShapes'
import {
  getMeldStructurePoints,
  getTilePoints,
  structurePointsFor,
  UNGROUPED_TILE_SHARE,
} from './ScoringEngine'
import { classifyPlay, DRAGON_GROUP_MULT } from './PlayPattern'

export type PartialHandRules = Omit<SequenceRules, 'suitsMatchForSequences'>

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
 * are concatenated. A face-count memo is shared across overlap candidates so
 * enlarged racks do not repeat the same suit search for interchangeable copies.
 */
export function parsePartialHand(
  tiles: Tile[],
  rules: PartialHandRules = {}
): PartialParse {
  return parseWithMemo(tiles, rules, new Map())
}

function parseWithMemo(
  tiles: Tile[],
  rules: PartialHandRules,
  memoBySuit: Map<TileSuit, Map<string, SuitSolution>>
): PartialParse {
  const scoringTiles = tiles.filter((tile) => !tile.isBonus)

  if (rules.allowSequenceOverlap) {
    const ordinary = { ...rules, allowSequenceOverlap: false }
    let best = parseWithMemo(tiles, ordinary, memoBySuit)
    const seen = new Set<string>()
    for (const pair of overlappingSequencePairs(scoringTiles, rules)) {
      const sharedIds = new Set(
        pair.flatMap((group) => group.tiles.map((tile) => tile.id))
      )
      // Structure points depend on consumed face counts, not which equivalent
      // physical copy bridged the two groups. Preserve the first canonical plan.
      const key = scoringTiles
        .filter((tile) => sharedIds.has(tile.id))
        .map((tile) => tile.typeKey)
        .sort()
        .join('|')
      if (seen.has(key)) continue
      seen.add(key)
      const rest = parseWithMemo(
        scoringTiles.filter((tile) => !sharedIds.has(tile.id)),
        ordinary,
        memoBySuit
      )
      const candidate = partialResult([...pair, ...rest.groups], scoringTiles)
      if (candidate.structurePoints > best.structurePoints) best = candidate
    }
    return best
  }

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
    const memo = memoBySuit.get(suit) ?? new Map<string, SuitSolution>()
    memoBySuit.set(suit, memo)
    plans.push(...solveSuit(counts, suit, memo, rules).plan)
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

  return partialResult(groups, scoringTiles)
}

function partialResult(groups: Meld[], tiles: Tile[]): PartialParse {
  const used = new Set(
    groups.flatMap((group) => group.tiles.map((tile) => tile.id))
  )
  const leftovers = tiles.filter((tile) => !used.has(tile.id))

  // Designate the highest-value pair so the parse matches ParsedHand semantics.
  const pairIndex = groups.findIndex((group) => group.type === MeldType.Pair)
  const pair = pairIndex === -1 ? null : groups[pairIndex]
  const melds =
    pairIndex === -1 ? [...groups] : groups.filter((_, i) => i !== pairIndex)

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
export function toPartialParsedHand(
  parse: PartialParse,
  tiles: Tile[]
): ParsedHand {
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
  return (
    suit === TileSuit.Manzu ||
    suit === TileSuit.Pinzu ||
    suit === TileSuit.Souzu
  )
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
  memo: Map<string, SuitSolution>,
  rules: PartialHandRules
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
    const rest = solveSuit(counts, suit, memo, rules)
    for (const r of ranks) counts[r] += 1

    const total = structurePointsFor(type, ranks.length) + rest.points
    if (total > best.points) {
      best = { points: total, plan: [{ type, suit, ranks }, ...rest.plan] }
    }
  }

  if (counts[rank] >= 4) consider(MeldType.Quad, [rank, rank, rank, rank])
  if (counts[rank] >= 3) consider(MeldType.Triplet, [rank, rank, rank])
  if (counts[rank] >= 2) consider(MeldType.Pair, [rank, rank])
  if (isSuitedSuit(suit)) {
    for (const [a, b] of sequenceOffsets(rank, rules))
      if (counts[rank + a] > 0 && counts[rank + b] > 0)
        consider(MeldType.Sequence, [rank, rank + a, rank + b])
    // Straights are always consecutive; no Season or Flower widens them.
    for (const length of [4, 5]) {
      const ranks = Array.from({ length }, (_, i) => rank + i)
      if (ranks.every((r) => r <= MAX_RANK && counts[r] > 0))
        consider(MeldType.Straight, ranks)
    }
  }

  // Leave this tile ungrouped.
  counts[rank] -= 1
  const skipped = solveSuit(counts, suit, memo, rules)
  counts[rank] += 1
  if (skipped.points > best.points) {
    best = { points: skipped.points, plan: [...skipped.plan] }
  }

  memo.set(key, best)
  return best
}

/**
 * The scorer's reading of a tactical play: of every way to split the chosen
 * tiles into groups, the one that pays most before items apply, judged as
 * (tile points + structure) × (1 + pattern Mult + Dragon Mult).
 *
 * Plays are small (a handful of tiles), so every split is tried; ties keep the
 * first split found in a fixed tile order, which makes the reading
 * deterministic. The forecast and the payment both use this one answer.
 */
export function parsePlay(
  tiles: Tile[],
  rules: PartialHandRules = {}
): PartialParse {
  const scoringTiles = tiles.filter((tile) => !tile.isBonus)
  // Larger selections are complete-hand candidates or rack views, where the
  // structure search is the established reading.
  if (scoringTiles.length > MAX_ENUMERATED_PLAY)
    return parsePartialHand(tiles, rules)
  const ordered = [...scoringTiles].sort(Tile.compare)
  let best: PartialParse | null = null
  let bestValue = -1
  const visit = (groups: Meld[]) => {
    const candidate = partialResult(groups, scoringTiles)
    const value = playValue(candidate)
    if (value > bestValue) {
      best = candidate
      bestValue = value
    }
  }
  enumerateSplits(ordered, [], rules, visit)
  // Plum's shared-tile reading is not a disjoint split; compare it as well.
  if (rules.allowSequenceOverlap) visit(parsePartialHand(tiles, rules).groups)
  return best ?? partialResult([], scoringTiles)
}

/** Selections up to this size are split exhaustively. */
const MAX_ENUMERATED_PLAY = 8

function playValue(parse: PartialParse): number {
  // Plum may share one tile between two sequences: count each tile once.
  const grouped = new Map<string, Tile>()
  for (const group of parse.groups)
    for (const tile of group.tiles) grouped.set(tile.id, tile)
  const tilePoints =
    [...grouped.values()].reduce((sum, tile) => sum + getTilePoints(tile), 0) +
    parse.leftovers.reduce(
      (sum, tile) =>
        sum + Math.floor(getTilePoints(tile) * UNGROUPED_TILE_SHARE),
      0
    )
  const dragons = [...grouped.values()].filter(
    (tile) => tile.suit === TileSuit.Dragon
  ).length
  const mult = 1 + classifyPlay(parse.groups).mult + dragons * DRAGON_GROUP_MULT
  // Grouped tiles break exact ties toward the reading that explains more.
  return (tilePoints + parse.structurePoints) * mult * 64 + grouped.size
}

/** Every split of `tiles` into disjoint groups and loose tiles. */
function enumerateSplits(
  tiles: Tile[],
  groups: Meld[],
  rules: PartialHandRules,
  visit: (groups: Meld[]) => void
): void {
  if (tiles.length === 0) {
    visit(groups)
    return
  }
  const [first, ...rest] = tiles
  // Leave the first tile loose.
  enumerateSplits(rest, groups, rules, visit)
  const same = rest.filter((tile) => tile.matches(first))
  for (const [type, size] of [
    [MeldType.Pair, 2],
    [MeldType.Triplet, 3],
    [MeldType.Quad, 4],
  ] as const) {
    if (same.length < size - 1) continue
    const members = [first, ...same.slice(0, size - 1)]
    enumerateSplits(
      without(rest, members),
      [...groups, new Meld(type, members, true)],
      rules,
      visit
    )
  }
  if (!isSuitedSuit(first.suit)) return
  const at = (rank: number) =>
    rest.find((tile) => tile.suit === first.suit && tile.rank === rank)
  for (const [a, b] of sequenceOffsets(first.rank, rules)) {
    const second = at(first.rank + a)
    const third = at(first.rank + b)
    if (!second || !third) continue
    const members = [first, second, third]
    enumerateSplits(
      without(rest, members),
      [...groups, new Meld(MeldType.Sequence, members, true)],
      rules,
      visit
    )
  }
  for (const length of [4, 5]) {
    const members = [first]
    for (let i = 1; i < length; i++) {
      const next = at(first.rank + i)
      if (!next) break
      members.push(next)
    }
    if (members.length !== length) continue
    enumerateSplits(
      without(rest, members),
      [...groups, new Meld(MeldType.Straight, members, true)],
      rules,
      visit
    )
  }
}

function without(tiles: Tile[], removed: Tile[]): Tile[] {
  const ids = new Set(removed.map((tile) => tile.id))
  return tiles.filter((tile) => !ids.has(tile.id))
}
