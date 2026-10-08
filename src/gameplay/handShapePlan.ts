/** Bounded ordinary-grammar shape search. No unseen wall, seed or execution. */
import type { Tile } from '../core/Tile'
import type { PlayerAction } from '../game/ActionProcessor'
import { calculateShanten, getEffectiveTiles } from '../rules/ShantenCalculator'
import { getTilePoints } from '../rules/ScoringEngine'

type CycleAction = Extract<PlayerAction, { type: 'redraw' | 'discard' }>
export interface HandShapeContext {
  visibleTiles: readonly Tile[]
  handTileCount: number
  lockedTileIds: readonly string[]
  requiredPlaySize: number | null
  advice: { best: { score: number; tileIds: string[] } } | null
  remainingToTarget: number
  canPerform: (action: CycleAction) => boolean
}

export interface HandPlanDecision {
  action: CycleAction
  reason: 'hand-plan'
  /** Distance of retained tiles; zero means one draw can finish. */
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
export function chooseHandShapeAction(
  context: HandShapeContext,
  options: { batchRedraws?: boolean; fullHandPledge?: boolean } = {}
): HandPlanDecision | null {
  const { advice, visibleTiles, canPerform } = context
  if (
    (!advice && !options.fullHandPledge) ||
    (advice &&
      (advice.best.score >= context.remainingToTarget ||
        advice.best.tileIds.length > 5))
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
  if (!best || !options.batchRedraws || best.decision.action.type !== 'redraw')
    return best?.decision ?? null

  // A redraw spends one charge for up to three tiles. Preserve the best
  // single-exchange distance while replacing more unneeded tiles. This is a
  // structural heuristic, not an expected-value calculation or wall forecast.
  const targetDistance = best.decision.shanten
  const unlocked = visibleTiles.filter(
    (t) => !context.lockedTileIds.includes(t.id)
  )
  for (let size = Math.min(3, targetDistance + 1); size >= 2; size--) {
    let batch: { decision: HandPlanDecision; points: number } | null = null
    const visit = (chosen: Tile[], start: number): void => {
      if (chosen.length < size) {
        for (let i = start; i <= unlocked.length - (size - chosen.length); i++)
          visit([...chosen, unlocked[i]], i + 1)
        return
      }
      const action = {
        type: 'redraw' as const,
        tileIds: chosen.map((t) => t.id),
      }
      if (!canPerform(action)) return
      const ids = new Set(action.tileIds)
      const retained = visibleTiles.filter((t) => !ids.has(t.id))
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
      if (shape.shanten !== targetDistance) return
      if (!shape.improvingTypes.length)
        shape.improvingTypes = getEffectiveTiles(retained).map((t) => t.typeKey)
      if (!shape.improvingTypes.length) return
      const points = chosen.reduce((sum, t) => sum + getTilePoints(t), 0)
      if (
        !batch ||
        shape.improvingTypes.length > batch.decision.improvingTypes.length ||
        (shape.improvingTypes.length === batch.decision.improvingTypes.length &&
          points < batch.points)
      )
        batch = { decision: { action, reason: 'hand-plan', ...shape }, points }
    }
    visit([], 0)
    if (batch) return (batch as { decision: HandPlanDecision }).decision
  }
  return best.decision
}
