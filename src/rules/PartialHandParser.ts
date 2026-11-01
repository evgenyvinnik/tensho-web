/**
 * Partial Hand Parser for Tensho Mahjong Roguelike
 *
 * Riichi Mahjong only scores a complete 14-tile hand. Tensho is a roguelike:
 * the player plays *any* selection of tiles and is paid for whatever structure
 * that selection contains. This module finds the highest-scoring decomposition
 * of an arbitrary tile selection into quads, triplets, sequences, and pairs.
 *
 * Tiles that belong to no group are still scored for their tile points; they
 * simply contribute no structure points. Bonus tiles and Stone tiles (no rank
 * or suit) never enter the search.
 */

import { Tile, TileSuit } from '../core/Tile'
import { honorSetRanks, Meld, MeldType } from '../core/Meld'
import { ParsedHand, WaitType } from '../core/Hand'
import {
  sequenceOffsets,
  overlappingSequencePairs,
  type SequenceRules,
} from './sequenceShapes'
import {
  dragonMultFor,
  getMeldStructurePoints,
  playedTilePoints,
  structurePointsFor,
} from './ScoringEngine'
import {
  sameFaceGroups,
  sequencesThrough,
  straightsThrough,
} from './groupCandidates'
import {
  classifyPlay,
  GROUP_MULT,
  groupKind,
  groupKindFor,
} from './PlayPattern'

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

/** Only a tile with a face can join a group. */
function hasStructureFace(tile: Tile): boolean {
  return !tile.isBonus && !tile.isStone
}

/**
 * Find the decomposition of `tiles` that maximises structure points.
 *
 * Equal totals go to the groups that add more Mult by themselves: 2·3·4·5 + 5
 * reads as a Straight and a loose 5, not a Sequence and a Pair, and 1–6 as a
 * five-tile Straight, not two Sequences. A Pair adds nothing alone, so it is
 * never chosen over a stronger group that pays the same structure.
 *
 * Melds never span suits, so each suit is solved independently and the results
 * are concatenated. A face-count memo is shared across overlap candidates so
 * enlarged racks do not repeat the same suit search for interchangeable copies.
 *
 * It never reads the secret Honors group: only `parsePlay` does, so rack
 * groups and the coach never point a player at a secret hand.
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
  const scoringTiles = tiles.filter(hasStructureFace)

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
        .map((tile) => tile.structureKey)
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
      if (
        outranks(
          { points: candidate.structurePoints, bonus: groupBonus(candidate) },
          { points: best.structurePoints, bonus: groupBonus(best) }
        )
      )
        best = candidate
    }
    return best
  }

  // Pool real tiles by the suit they are read in and their rank so chosen
  // groups can reference them. A Wild tile is read in the suit that pays most.
  const placement = placeWildTiles(scoringTiles, rules, memoBySuit)
  const suitOf = (tile: Tile) => placement.get(tile.id) ?? tile.suit
  const pools = new Map<string, Tile[]>()
  const suits = new Set<TileSuit>()
  for (const tile of scoringTiles) {
    suits.add(suitOf(tile))
    const key = poolKey(suitOf(tile), tile.rank)
    const pool = pools.get(key)
    if (pool) pool.push(tile)
    else pools.set(key, [tile])
  }

  const plans: GroupPlan[] = []
  for (const suit of suits) {
    const counts = new Array<number>(MAX_RANK + 1).fill(0)
    for (const tile of scoringTiles) {
      if (suitOf(tile) === suit) counts[tile.rank] += 1
    }
    plans.push(...solveSuitWithMemo(counts, suit, memoBySuit, rules).plan)
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

function solveSuitWithMemo(
  counts: number[],
  suit: TileSuit,
  memoBySuit: Map<TileSuit, Map<string, SuitSolution>>,
  rules: PartialHandRules
): SuitSolution {
  const memo = memoBySuit.get(suit) ?? new Map<string, SuitSolution>()
  memoBySuit.set(suit, memo)
  return solveSuit(counts, suit, memo, rules)
}

/** Beyond this many ways to seat the Wild tiles, keep the simple seating. */
const MAX_WILD_PLACEMENTS = 1024

/**
 * Choose the suit each suited Wild tile is read in (by tile id).
 *
 * A Wild tile counts as every suit, so it may join a group of any suit. Only
 * suits that hold a natural tile are worth trying: a group of Wild tiles alone
 * fits in any of them, and adding tiles to a suit never lowers its best
 * grouping. Wild tiles of one rank are interchangeable, so only how many go to
 * each suit is searched. A rack with too many seatings keeps each Wild tile in
 * its printed suit where that suit is present.
 */
function placeWildTiles(
  tiles: readonly Tile[],
  rules: PartialHandRules,
  memoBySuit: Map<TileSuit, Map<string, SuitSolution>>
): Map<string, TileSuit> {
  const wilds = tiles.filter((tile) => tile.isWild && tile.isSuited)
  const placement = new Map<string, TileSuit>()
  if (wilds.length === 0) return placement
  const naturals = tiles.filter((tile) => tile.isSuited && !tile.isWild)
  const suits = [...new Set(naturals.map((tile) => tile.suit))]
  if (suits.length === 0) suits.push(wilds[0].suit)

  const byRank = new Map<number, Tile[]>()
  for (const tile of wilds) {
    const same = byRank.get(tile.rank)
    if (same) same.push(tile)
    else byRank.set(tile.rank, [tile])
  }
  const ranks = [...byRank.keys()]
  // Every way to split `count` tiles across the suits, in suit order.
  const splits = (count: number, slots: number): number[][] =>
    slots === 1
      ? [[count]]
      : Array.from({ length: count + 1 }, (_, first) =>
          splits(count - first, slots - 1).map((rest) => [first, ...rest])
        ).flat()
  const options = ranks.map((rank) =>
    splits(byRank.get(rank)!.length, suits.length)
  )
  const total = options.reduce((product, list) => product * list.length, 1)

  const seat = (choice: number[][]) => {
    ranks.forEach((rank, r) => {
      let next = 0
      choice[r].forEach((count, s) => {
        for (const tile of byRank.get(rank)!.slice(next, next + count))
          placement.set(tile.id, suits[s])
        next += count
      })
    })
  }

  if (total > MAX_WILD_PLACEMENTS) {
    for (const tile of wilds)
      placement.set(tile.id, suits.includes(tile.suit) ? tile.suit : suits[0])
    return placement
  }

  const naturalCounts = suits.map((suit) => {
    const counts = new Array<number>(MAX_RANK + 1).fill(0)
    for (const tile of naturals) if (tile.suit === suit) counts[tile.rank] += 1
    return counts
  })
  let best: { points: number; bonus: number; choice: number[][] } | null = null
  const choice: number[][] = []
  const visit = (r: number) => {
    if (r === ranks.length) {
      let points = 0
      let bonus = 0
      suits.forEach((suit, s) => {
        const counts = [...naturalCounts[s]]
        ranks.forEach((rank, i) => (counts[rank] += choice[i][s]))
        const solved = solveSuitWithMemo(counts, suit, memoBySuit, rules)
        points += solved.points
        bonus += solved.bonus
      })
      if (!best || outranks({ points, bonus }, best))
        best = { points, bonus, choice: choice.map((split) => [...split]) }
      return
    }
    for (const split of options[r]) {
      choice[r] = split
      visit(r + 1)
    }
  }
  visit(0)
  seat(best!.choice)
  return placement
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
  /** Mult the groups add by themselves; breaks ties in `points`. */
  bonus: number
  plan: GroupPlan[]
}

/** More structure wins; equal structure goes to the stronger groups. */
function outranks(
  candidate: Pick<SuitSolution, 'points' | 'bonus'>,
  best: Pick<SuitSolution, 'points' | 'bonus'>
): boolean {
  return (
    candidate.points > best.points ||
    (candidate.points === best.points && candidate.bonus > best.bonus)
  )
}

function groupBonus(parse: PartialParse): number {
  return parse.groups.reduce(
    (sum, group) => sum + GROUP_MULT[groupKind(group)],
    0
  )
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
    const empty: SuitSolution = { points: 0, bonus: 0, plan: [] }
    memo.set(key, empty)
    return empty
  }

  let best: SuitSolution = { points: 0, bonus: 0, plan: [] }

  const consider = (type: MeldType, ranks: number[]) => {
    for (const r of ranks) counts[r] -= 1
    const rest = solveSuit(counts, suit, memo, rules)
    for (const r of ranks) counts[r] += 1

    const candidate: SuitSolution = {
      points: structurePointsFor(type, ranks.length) + rest.points,
      bonus: GROUP_MULT[groupKindFor(type, ranks.length)] + rest.bonus,
      plan: [{ type, suit, ranks }, ...rest.plan],
    }
    if (outranks(candidate, best)) best = candidate
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
  if (outranks(skipped, best)) best = { ...skipped, plan: [...skipped.plan] }

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
  const scoringTiles = tiles.filter(hasStructureFace)
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
  const scored = [
    ...[...grouped.values()].map((tile) => [tile, true] as const),
    ...parse.leftovers.map((tile) => [tile, false] as const),
  ]
  const tilePoints = scored.reduce(
    (sum, [tile, isGrouped]) => sum + playedTilePoints(tile, isGrouped),
    0
  )
  const dragonMult = scored.reduce(
    (sum, [tile, isGrouped]) => sum + dragonMultFor(tile, isGrouped),
    0
  )
  const mult = 1 + classifyPlay(parse.groups).mult + dragonMult
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
  // Wild tiles count as every suit: they may join a face or a run of any suit.
  const matching = rest.filter((tile) => first.matches(tile))
  for (const [type, size] of [
    [MeldType.Pair, 2],
    [MeldType.Triplet, 3],
    [MeldType.Quad, 4],
  ] as const) {
    if (matching.length < size - 1) break
    for (const members of sameFaceGroups(first, matching, size))
      enumerateSplits(
        without(rest, members),
        [...groups, new Meld(type, members, true)],
        rules,
        visit
      )
  }
  // A secret hand: one of every Dragon, or one of every Wind.
  const honors = honorSetRanks(first.suit).map((rank) =>
    rank === first.rank
      ? first
      : rest.find((tile) => tile.suit === first.suit && tile.rank === rank)
  )
  if (honors.length > 0 && honors.every((tile) => tile !== undefined)) {
    enumerateSplits(
      without(rest, honors),
      [...groups, new Meld(MeldType.Honors, honors, true)],
      rules,
      visit
    )
  }
  if (!isSuitedSuit(first.suit)) return
  for (const members of sequencesThrough(first, rest, rules))
    enumerateSplits(
      without(rest, members),
      [...groups, new Meld(MeldType.Sequence, members, true)],
      rules,
      visit
    )
  for (const length of [4, 5])
    for (const members of straightsThrough(first, rest, length))
      enumerateSplits(
        without(rest, members),
        [...groups, new Meld(MeldType.Straight, members, true)],
        rules,
        visit
      )
}

function without(tiles: Tile[], removed: Tile[]): Tile[] {
  const ids = new Set(removed.map((tile) => tile.id))
  return tiles.filter((tile) => !ids.has(tile.id))
}
