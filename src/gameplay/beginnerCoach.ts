import { MeldType } from '../core/Meld'
import { Tile } from '../core/Tile'
import { parsePartialHand } from '../rules/PartialHandParser'

export type BeginnerPatternKind = MeldType | 'redraw'

export interface BeginnerSuggestion {
  kind: BeginnerPatternKind
  tileIds: string[]
  structurePoints: number
}

const STRUCTURE_POINTS: Record<MeldType, number> = {
  [MeldType.Pair]: 10,
  [MeldType.Sequence]: 20,
  [MeldType.Triplet]: 30,
  [MeldType.Quad]: 50,
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
      STRUCTURE_POINTS[right.type] - STRUCTURE_POINTS[left.type]
    return pointDifference !== 0
      ? pointDifference
      : TEACHING_PRIORITY[right.type] - TEACHING_PRIORITY[left.type]
  })[0]

  if (group) {
    return {
      kind: group.type,
      tileIds: group.tiles.map((tile) => tile.id),
      structurePoints: STRUCTURE_POINTS[group.type],
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
