/** Ordinary-grammar, public-information experiment; not live player advice. */
import type { Tile } from '../../src/core/Tile'
import {
  calculateShanten,
  getEffectiveTiles,
} from '../../src/rules/ShantenCalculator'
import { getTilePoints } from '../../src/rules/ScoringEngine'
import type {
  ResourcePolicyContext,
  ResourceDecision,
} from './classic-resource-policy'

export interface HandPlanDecision extends Omit<ResourceDecision, 'reason'> {
  reason: 'hand-plan'
  /** Distance of the retained thirteen tiles; zero means one draw can finish. */
  shanten: number
  /** Distinct improving types, NOT remaining copies, odds or predicted draws. */
  improvingTypes: string[]
}

/**
 * Keep the thirteen-tile shape nearest completion; break ties by how many
 * distinct types improve it, then by the discarded tile's base points.
 * Replan after each actual draw. No hypothetical effect execution, wall, seed,
 * unseen tile identity or run RNG is supplied. Costs/locks are checked by the
 * real action validator. One discard is preferred to a one-tile redraw.
 */
export function chooseClassicHandAction(
  context: ResourcePolicyContext
): HandPlanDecision | null {
  const { advice, visibleTiles, canPerform } = context
  if (
    !advice ||
    advice.best.score >= context.remainingToTarget ||
    advice.best.tileIds.length > 5
  )
    return null
  if (
    context.handTileCount !== 14 ||
    visibleTiles.length !== 14 ||
    visibleTiles.some((t) => t.isBonus) ||
    new Set(visibleTiles.map((t) => t.id)).size !== 14 ||
    (context.requiredPlaySize !== null && context.requiredPlaySize !== 14)
  )
    return null
  if (calculateShanten([...visibleTiles]).shanten < 0) return null

  const shapes = new Map<
    string,
    { shanten: number; improvingTypes: string[] }
  >()
  let best: { decision: HandPlanDecision; tile: Tile } | null = null
  for (const tile of visibleTiles) {
    if (context.lockedTileIds.includes(tile.id)) continue
    const discard = { type: 'discard' as const, tileId: tile.id }
    const redraw = { type: 'redraw' as const, tileIds: [tile.id] }
    const action = canPerform(discard)
      ? discard
      : canPerform(redraw)
        ? redraw
        : null
    if (!action) continue
    const retained = visibleTiles.filter((t) => t.id !== tile.id)
    const key = retained
      .map((t) => t.typeKey)
      .sort()
      .join('|')
    let shape = shapes.get(key)
    if (!shape) {
      shape = {
        shanten: calculateShanten(retained).shanten,
        improvingTypes: [],
      }
      shapes.set(key, shape)
    }
    if (best && shape.shanten > best.decision.shanten) continue
    if (shape.improvingTypes.length === 0)
      shape.improvingTypes = getEffectiveTiles(retained).map((t) => t.typeKey)
    if (shape.improvingTypes.length === 0) continue
    const decision: HandPlanDecision = { action, reason: 'hand-plan', ...shape }
    if (
      !best ||
      decision.shanten < best.decision.shanten ||
      (decision.shanten === best.decision.shanten &&
        (decision.improvingTypes.length > best.decision.improvingTypes.length ||
          (decision.improvingTypes.length ===
            best.decision.improvingTypes.length &&
            getTilePoints(tile) < getTilePoints(best.tile))))
    )
      best = { decision, tile }
  }
  return best?.decision ?? null
}
