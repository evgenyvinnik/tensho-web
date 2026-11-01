/**
 * Candidate groups through one tile.
 *
 * The play and complete-hand searches both branch on one tile and ask which
 * groups could hold it. A Wild tile counts as every suit, so a run may borrow
 * it at any rank and a same-face group may borrow it for any suit, but the
 * group as a whole must still read in one suit: a Wild 5 joins 4·6 of Dots or
 * 4·6 of Bamboo, never a 4 of Dots with a 6 of Bamboo.
 *
 * Interchangeable copies (same printed face, both natural; or two Wild tiles
 * of one rank) are tried once each, so with no Wild tile in play these return
 * exactly the groups a plain suit-and-rank lookup would.
 */

import { Tile, TileSuit } from '../core/Tile'
import { sequenceOffsets, type SequenceRules } from './sequenceShapes'

/** Tiles split into structure classes, each class in input order. */
function classesOf(tiles: readonly Tile[]): Tile[][] {
  const byClass = new Map<string, Tile[]>()
  for (const tile of tiles) {
    const key = tile.structureKey
    const pool = byClass.get(key)
    if (pool) pool.push(tile)
    else byClass.set(key, [tile])
  }
  return [...byClass.values()]
}

/**
 * Every way to join `first` with `size - 1` tiles of `rest` into one face
 * (Pair, Triplet or Quad). Earlier classes are preferred, so the first result
 * uses the first matching copies.
 */
export function sameFaceGroups(
  first: Tile,
  rest: readonly Tile[],
  size: number
): Tile[][] {
  // Pairwise `matches` already lets a Wild tile cross suits at its rank.
  const matching = rest.filter((tile) => first.matches(tile))
  if (matching.length < size - 1) return []
  // Without a Wild tile every match is the same face: take the first copies.
  if (!first.isWild && !matching.some((tile) => tile.isWild))
    return [[first, ...matching.slice(0, size - 1)]]
  const classes = classesOf(matching)
  const results: Tile[][] = []
  const pick = (index: number, chosen: Tile[]) => {
    if (chosen.length === size - 1) {
      const members = [first, ...chosen]
      if (Tile.shareFace(members)) results.push(members)
      return
    }
    if (index >= classes.length) return
    const pool = classes[index]
    const most = Math.min(pool.length, size - 1 - chosen.length)
    for (let take = most; take >= 0; take--)
      pick(index + 1, [...chosen, ...pool.slice(0, take)])
  }
  pick(0, [])
  return results
}

const sequenceWindowCache = new Map<string, number[][]>()

/** Rank windows of a sequence that hold `rank`, starting at `rank` first. */
function sequenceWindows(rank: number, rules: SequenceRules): number[][] {
  const key = `${rank}:${!!rules.allowSequenceSkip}:${!!rules.allowTerminalAnchor}`
  const cached = sequenceWindowCache.get(key)
  if (cached) return cached
  const windows: number[][] = []
  for (let start = rank; start >= 1; start--)
    for (const [a, b] of sequenceOffsets(start, rules)) {
      const ranks = [start, start + a, start + b]
      if (ranks.includes(rank)) windows.push(ranks)
    }
  sequenceWindowCache.set(key, windows)
  return windows
}

const straightWindowCache = new Map<string, number[][]>()

/** Rank windows of a Straight of `length` that hold `rank`. */
function straightWindows(rank: number, length: number): number[][] {
  const key = `${rank}:${length}`
  const cached = straightWindowCache.get(key)
  if (cached) return cached
  const windows: number[][] = []
  for (let start = rank; start > rank - length && start >= 1; start--)
    if (start + length - 1 <= 9)
      windows.push(Array.from({ length }, (_, i) => start + i))
  straightWindowCache.set(key, windows)
  return windows
}

function runsThrough(
  first: Tile,
  rest: readonly Tile[],
  windows: number[][],
  anySuit: boolean
): Tile[][] {
  if (!first.isSuited || first.isStone) return []
  // One tile per structure class at each rank that could share a run with
  // `first`; a natural tile of another suit can only meet `first` if `first`
  // is Wild (or Harmonizer lifts the suit check). This runs at every node of
  // the hand searches, so it avoids building keys.
  const byRank: (Tile[] | undefined)[] = []
  let found = false
  for (const tile of rest) {
    if (!tile.isSuited || tile.isStone || tile.rank === first.rank) continue
    const wild = tile.isWild
    if (!anySuit && !first.isWild && !wild && tile.suit !== first.suit) continue
    const atRank = byRank[tile.rank]
    if (!atRank) byRank[tile.rank] = [tile]
    else if (
      !atRank.some((seen) =>
        wild ? seen.isWild : !seen.isWild && seen.suit === tile.suit
      )
    )
      atRank.push(tile)
    found = true
  }
  if (!found) return []

  const results: Tile[][] = []
  const firstSuit = first.isWild ? undefined : first.suit
  for (const ranks of windows) {
    const slots: Tile[][] = []
    for (const rank of ranks) {
      if (rank === first.rank) continue
      const atRank = byRank[rank]
      if (!atRank) break
      slots.push(atRank)
    }
    if (slots.length !== ranks.length - 1) continue
    // `suit` is the one suit the run reads in so far; undefined while only
    // Wild tiles have been placed.
    const fill = (
      index: number,
      members: Tile[],
      suit: TileSuit | undefined
    ) => {
      if (index === slots.length) {
        results.push(members)
        return
      }
      for (const tile of slots[index]) {
        if (anySuit || tile.isWild) fill(index + 1, [...members, tile], suit)
        else if (suit === undefined || tile.suit === suit)
          fill(index + 1, [...members, tile], tile.suit)
      }
    }
    fill(0, [first], firstSuit)
  }
  return results
}

/**
 * Every Sequence that holds `first`, filled from `rest`. Rule shapes (skips,
 * Bamboo's anchor) apply; `suitsMatchForSequences` lifts the suit check.
 */
export function sequencesThrough(
  first: Tile,
  rest: readonly Tile[],
  rules: SequenceRules
): Tile[][] {
  return runsThrough(
    first,
    rest,
    sequenceWindows(first.rank, rules),
    !!rules.suitsMatchForSequences
  )
}

/** Every Straight of `length` consecutive ranks that holds `first`. */
export function straightsThrough(
  first: Tile,
  rest: readonly Tile[],
  length: number
): Tile[][] {
  return runsThrough(first, rest, straightWindows(first.rank, length), false)
}

/**
 * Every distinct Pair in `tiles`, at most one per pairing of classes, using
 * the first copies of each class.
 */
export function distinctPairs(tiles: readonly Tile[]): Tile[][] {
  const classes = classesOf(tiles)
  const pairs: Tile[][] = []
  for (let i = 0; i < classes.length; i++) {
    const [a, b] = classes[i]
    if (b && a.matches(b)) pairs.push([a, b])
    for (let j = i + 1; j < classes.length; j++) {
      const other = classes[j][0]
      if (other.rank === a.rank && a.matches(other)) pairs.push([a, other])
    }
  }
  return pairs
}
