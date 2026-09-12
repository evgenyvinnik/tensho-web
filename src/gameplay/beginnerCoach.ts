/**
 * Beginner coach.
 *
 * Two jobs, deliberately separated:
 *
 *  - `findBeginnerSuggestion` teaches one recognizable shape. It answers
 *    "which tiles form a group?" and drives the first-play highlighting.
 *  - `buildCoachAdvice` answers "what is actually worth doing this turn?" It
 *    scores candidate selections with the authoritative preview and compares
 *    them against the round's real pressure.
 *
 * Section 1.4 of `docs/GAMEPLAY_EXPERIMENTS.md` records why the split matters:
 * ranking one group's structure points and calling it the best move taught a
 * weak habit, because a recognizable shape and a good move are not the same
 * claim. The coach now makes both statements and says which is which.
 */

import { MeldType } from '../core/Meld'
import { Tile } from '../core/Tile'
import { STRUCTURE_POINTS_BY_TYPE, getTilePoints } from '../rules/ScoringEngine'
import { parsePartialHand } from '../rules/PartialHandParser'
import {
  MAX_TACTICAL_PLAY_TILES,
  MIN_TACTICAL_PLAY_TILES,
} from '../game/playRules'

export type BeginnerPatternKind = MeldType | 'redraw'

export interface BeginnerSuggestion {
  kind: BeginnerPatternKind
  tileIds: string[]
  structurePoints: number
}

const TEACHING_PRIORITY: Record<MeldType, number> = {
  [MeldType.Sequence]: 4,
  [MeldType.Triplet]: 3,
  [MeldType.Pair]: 2,
  [MeldType.Quad]: 1,
}

/**
 * Find one immediately useful decision in the real hand.
 *
 * The coach deliberately teaches a single visible shape instead of attempting
 * to solve the whole hand for the player. When no finished shape exists, it
 * suggests three isolated tiles to redraw so the first decision still has a
 * clear purpose.
 */
export function findBeginnerSuggestion(
  tiles: Tile[],
  concealedIds: ReadonlySet<string> = new Set()
): BeginnerSuggestion | null {
  const visibleTiles = tiles.filter(
    (tile) => !tile.isBonus && !concealedIds.has(tile.id)
  )
  if (visibleTiles.length < 2) return null

  const parsed = parsePartialHand(visibleTiles)
  const group = [...parsed.groups].sort((left, right) => {
    const pointDifference =
      STRUCTURE_POINTS_BY_TYPE[right.type] - STRUCTURE_POINTS_BY_TYPE[left.type]
    return pointDifference !== 0
      ? pointDifference
      : TEACHING_PRIORITY[right.type] - TEACHING_PRIORITY[left.type]
  })[0]

  if (group) {
    return {
      kind: group.type,
      tileIds: group.tiles.map((tile) => tile.id),
      structurePoints: STRUCTURE_POINTS_BY_TYPE[group.type],
    }
  }

  return {
    kind: 'redraw',
    tileIds: parsed.leftovers.slice(-3).map((tile) => tile.id),
    structurePoints: 0,
  }
}

export function selectionMatchesSuggestion(
  suggestion: BeginnerSuggestion,
  activeTileIds: readonly string[]
): boolean {
  return (
    activeTileIds.length === suggestion.tileIds.length &&
    suggestion.tileIds.every((tileId) => activeTileIds.includes(tileId))
  )
}

// =============================================================================
// SCORE-AWARE ADVICE
// =============================================================================

/** One selection the coach is prepared to recommend. */
export interface CoachOption {
  /** Tiles to play, in hand order. */
  tileIds: string[]
  /** Score from the authoritative preview. */
  score: number
  /** The named shape, when the selection is exactly one group. */
  pattern: MeldType | null
  /** Structure points the selection contains. */
  structurePoints: number
}

export interface CoachAdvice {
  /** The highest-scoring legal selection the coach found. */
  best: CoachOption
  /**
   * A recognizable shape worth learning, present only when it is a different
   * selection from `best`. This is the "build toward this" half of the advice.
   */
  shape: CoachOption | null
  /** Points the round still needs, divided by the hands left to find them. */
  requiredPerHand: number
  /** Whether `best` alone keeps pace with the round's target. */
  keepsPace: boolean
  /** What `best` costs in structure compared with `shape`. */
  structureGivenUp: number
}

export interface CoachContext {
  tiles: Tile[]
  /** Visible forced tiles must be part of every recommendation. */
  requiredTileIds?: readonly string[]
  /** Tiles the player cannot see; never suggested and never scored. */
  concealedIds?: ReadonlySet<string>
  /**
   * The game's own preview. The coach never scores anything itself, so its
   * advice cannot drift from what the play will actually pay.
   */
  scoreSelection: (tileIds: string[]) => number | null
  /** Points still needed to clear the round. */
  remainingToTarget: number
  /** Hands left to find them. */
  handsRemaining: number
}

/**
 * Every distinct group the hand contains, as tile lists.
 *
 * Deduplicated by group identity so four copies of one tile do not produce
 * four indistinguishable triplets.
 */
function enumerateGroups(tiles: Tile[]): Tile[][] {
  const byIdentity = new Map<string, Tile[]>()
  const remember = (group: Tile[]) => {
    const key = group
      .map((tile) => tile.typeKey)
      .sort()
      .join('|')
    if (!byIdentity.has(key)) byIdentity.set(key, group)
  }

  const buckets = new Map<string, Tile[]>()
  for (const tile of tiles) {
    const bucket = buckets.get(tile.typeKey)
    if (bucket) bucket.push(tile)
    else buckets.set(tile.typeKey, [tile])
  }
  for (const bucket of buckets.values()) {
    for (const size of [2, 3, 4]) {
      if (bucket.length >= size) remember(bucket.slice(0, size))
    }
  }

  const suited = tiles.filter((tile) => tile.isSuited)
  for (const anchor of suited) {
    const run: Tile[] = [anchor]
    for (let offset = 1; offset <= 2; offset += 1) {
      const next = suited.find(
        (tile) =>
          tile.suit === anchor.suit &&
          tile.rank === anchor.rank + offset &&
          !run.includes(tile)
      )
      if (!next) break
      run.push(next)
    }
    if (run.length === 3) remember(run)
  }

  return [...byIdentity.values()]
}

/**
 * Candidate selections worth pricing.
 *
 * Enumerating every subset of a fourteen-tile hand is thousands of previews per
 * keystroke. Instead the coach prices the selections a player would plausibly
 * make: each group, pairs of groups that fit the play size, each group padded
 * with the most valuable spare tiles, and the plain "play the biggest tiles"
 * selection that the diagnosis in section 1.4 found the old coach losing to.
 */
function candidateSelections(
  tiles: Tile[],
  requiredIds: readonly string[]
): string[][] {
  const required = tiles.filter((tile) => requiredIds.includes(tile.id))
  const groups = enumerateGroups(tiles)
  const byPoints = [...tiles].sort(
    (left, right) =>
      Number(requiredIds.includes(right.id)) -
        Number(requiredIds.includes(left.id)) ||
      getTilePoints(right) - getTilePoints(left)
  )
  const seen = new Set<string>()
  const candidates: string[][] = []

  const offer = (selection: Tile[]) => {
    // Preserve physical uniqueness; overlapping groups are not legal candidates.
    if (new Set(selection.map((tile) => tile.id)).size !== selection.length)
      return
    selection = [
      ...selection,
      ...required.filter((tile) => !selection.includes(tile)),
    ]
    if (
      selection.length < MIN_TACTICAL_PLAY_TILES ||
      selection.length > MAX_TACTICAL_PLAY_TILES
    ) {
      return
    }
    const uniqueIds = [...new Set(selection.map((tile) => tile.id))]
    if (uniqueIds.length !== selection.length) return
    const key = [...uniqueIds].sort().join('|')
    if (seen.has(key)) return
    seen.add(key)
    candidates.push(uniqueIds)
  }

  for (const group of groups) {
    offer(group)

    // Pad the group up to the play limit with the best spare tiles.
    const used = new Set(group.map((tile) => tile.id))
    const padded = [...group]
    for (const tile of byPoints) {
      if (padded.length >= MAX_TACTICAL_PLAY_TILES) break
      if (used.has(tile.id)) continue
      padded.push(tile)
      used.add(tile.id)
      offer([...padded])
    }
  }

  // Two groups together, when they fit inside one play.
  for (let i = 0; i < groups.length; i += 1) {
    for (let j = i + 1; j < groups.length; j += 1) {
      const combined = [...groups[i], ...groups[j]]
      if (combined.length > MAX_TACTICAL_PLAY_TILES) continue
      offer(combined)
    }
  }

  // The pure tile-value plays, which no group-first coach would ever find.
  for (
    let size = MIN_TACTICAL_PLAY_TILES;
    size <= MAX_TACTICAL_PLAY_TILES;
    size += 1
  ) {
    offer(byPoints.slice(0, size))
  }

  // The real validator decides whether the entire visible rack is Mahjong.
  // Never infer a complete hand by consulting concealed tile identities.
  if (tiles.length > MAX_TACTICAL_PLAY_TILES)
    candidates.push(tiles.map((tile) => tile.id))

  return candidates
}

function describeSelection(
  tiles: Tile[],
  selection: string[]
): {
  pattern: MeldType | null
  structurePoints: number
} {
  const chosen = tiles.filter((tile) => selection.includes(tile.id))
  const parse = parsePartialHand(chosen)
  const isSingleGroup =
    parse.groups.length === 1 && parse.groups[0].tiles.length === chosen.length
  return {
    pattern: isSingleGroup ? parse.groups[0].type : null,
    structurePoints: parse.structurePoints,
  }
}

/**
 * Compare what the hand can score now with what it can teach.
 *
 * Returns null when no visible candidate is legal. This is not proof that no
 * legal blind play or unsearched combination exists.
 */
export function buildCoachAdvice(context: CoachContext): CoachAdvice | null {
  const concealed = context.concealedIds ?? new Set<string>()
  const visible = context.tiles.filter(
    (tile) => !tile.isBonus && !concealed.has(tile.id)
  )
  if (visible.length < MIN_TACTICAL_PLAY_TILES) return null
  const required = context.requiredTileIds ?? []
  if (required.some((id) => !visible.some((tile) => tile.id === id)))
    return null

  const priced: CoachOption[] = []
  for (const selection of candidateSelections(visible, required)) {
    const score = context.scoreSelection(selection)
    if (score === null) continue
    const described = describeSelection(visible, selection)
    priced.push({
      tileIds: selection,
      score,
      pattern: described.pattern,
      structurePoints: described.structurePoints,
    })
  }
  if (priced.length === 0) return null

  const best = priced.reduce((leader, option) =>
    option.score > leader.score ? option : leader
  )

  // The most instructive named shape, which may well score less than `best`.
  const namedShapes = priced.filter((option) => option.pattern !== null)
  const shapeCandidate = namedShapes.length
    ? namedShapes.reduce((leader, option) => {
        const difference = option.structurePoints - leader.structurePoints
        if (difference !== 0) return difference > 0 ? option : leader
        return option.score > leader.score ? option : leader
      })
    : null

  const sameSelection =
    shapeCandidate !== null &&
    shapeCandidate.tileIds.length === best.tileIds.length &&
    shapeCandidate.tileIds.every((id) => best.tileIds.includes(id))

  const requiredPerHand = Math.ceil(
    Math.max(0, context.remainingToTarget) / Math.max(1, context.handsRemaining)
  )

  return {
    best,
    shape: sameSelection ? null : shapeCandidate,
    requiredPerHand,
    keepsPace: best.score >= requiredPerHand,
    structureGivenUp: shapeCandidate
      ? Math.max(0, shapeCandidate.structurePoints - best.structurePoints)
      : 0,
  }
}
