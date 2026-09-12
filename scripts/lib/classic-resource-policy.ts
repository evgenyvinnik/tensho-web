/**
 * Read-only policy for balance experiments, not an in-game hint or optimal solver.
 * It receives visible tiles only: no wall order, dead wall, seed, or hidden faces.
 */
import type { Tile } from '../../src/core/Tile'
import type { PlayerAction } from '../../src/game/ActionProcessor'
import type { CoachAdvice } from '../../src/gameplay/beginnerCoach'
import { findOneAwayCompletion } from '../../src/rules/HandValidator'
import { getTilePoints } from '../../src/rules/ScoringEngine'

type CycleAction = Extract<PlayerAction, { type: 'redraw' | 'discard' }>

export interface ResourcePolicyContext {
  visibleTiles: readonly Tile[]
  handTileCount: number
  lockedTileIds: readonly string[]
  requiredPlaySize: number | null
  advice: CoachAdvice | null
  remainingToTarget: number
  chaseCompleteHands: boolean
  canPerform: (action: CycleAction) => boolean
}

export interface ResourceDecision {
  action: CycleAction
  reason: 'behind-pace' | 'one-away'
  /** A structural possibility, not a forecast or a claim the wall contains it. */
  completion?: { suit: string; rank: number }
}

/** A rough retention value; actual plays still use the authoritative scorer. */
function connectivity(tile: Tile, tiles: readonly Tile[]): number {
  return tiles.reduce((total, other) => {
    if (other.id === tile.id || other.suit !== tile.suit) return total
    const distance = Math.abs(other.rank - tile.rank)
    if (distance === 0) return total + 6
    if (!tile.isSuited) return total
    return total + (distance === 1 ? 3 : distance === 2 ? 1 : 0)
  }, 0)
}

function singleCycle(
  tileId: string,
  canPerform: ResourcePolicyContext['canPerform']
): CycleAction | null {
  // A real discard removes the unwanted tile from future circulation.
  const discard: CycleAction = { type: 'discard', tileId }
  if (canPerform(discard)) return discard
  const redraw: CycleAction = { type: 'redraw', tileIds: [tileId] }
  return canPerform(redraw) ? redraw : null
}

export function chooseClassicResourceAction(
  context: ResourcePolicyContext
): ResourceDecision | null {
  const { advice, canPerform } = context
  // Do not use an unpriced concealed selection as if it had a known score.
  // Also never exchange instead of taking a known round clear.
  if (!advice || advice.best.score >= context.remainingToTarget) return null

  const visible = context.visibleTiles.filter((tile) => !tile.isBonus)
  const unlocked = visible.filter(
    (tile) => !context.lockedTileIds.includes(tile.id)
  )
  if (unlocked.length === 0) return null

  // A deliberately narrow full-hand experiment: standard 14-tile grammar,
  // including Seven Pairs/Orphans, with one replacement needed. No hypothetical
  // score previews, assumed wall counts, or multi-step Yaku search.
  if (
    context.chaseCompleteHands &&
    visible.length === 14 &&
    context.handTileCount === 14 &&
    (context.requiredPlaySize === null || context.requiredPlaySize === 14) &&
    advice.best.tileIds.length < 14
  ) {
    const candidates = [...unlocked].sort(
      (a, b) =>
        connectivity(a, visible) - connectivity(b, visible) ||
        getTilePoints(a) - getTilePoints(b)
    )
    for (const tile of candidates) {
      const action = singleCycle(tile.id, canPerform)
      if (!action) continue
      const completion = findOneAwayCompletion(
        visible.filter((t) => t.id !== tile.id)
      )
      if (completion) {
        return {
          action,
          reason: 'one-away',
          completion: {
            suit: completion.completionTile.suit,
            rank: completion.completionTile.rank,
          },
        }
      }
    }
  }

  if (advice.keepsPace) return null

  // First preserve the current scoring option; exchange low-connectivity spare
  // tiles. If no spares exist, explicitly risk a tile in that option instead.
  const spares = unlocked.filter(
    (tile) => !advice.best.tileIds.includes(tile.id)
  )
  const ranked = [...(spares.length ? spares : unlocked)].sort(
    (a, b) =>
      connectivity(a, visible) - connectivity(b, visible) ||
      getTilePoints(a) - getTilePoints(b)
  )
  for (let count = Math.min(3, ranked.length); count >= 2; count--) {
    const action: CycleAction = {
      type: 'redraw',
      tileIds: ranked.slice(0, count).map((t) => t.id),
    }
    if (canPerform(action)) return { action, reason: 'behind-pace' }
  }
  for (const tile of ranked) {
    const action = singleCycle(tile.id, canPerform)
    if (action) return { action, reason: 'behind-pace' }
  }
  return null
}
