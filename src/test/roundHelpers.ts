/**
 * Test helpers for moving a run between rounds.
 *
 * Rounds can no longer be skipped: they end when a play reaches the target.
 * These helpers reach that same ending directly, so a test can get to the
 * round it is about without scripting the plays that would clear the others.
 */

import type { Effect } from '../game/ActionProcessor'
import type {
  GameOrchestrator,
  OrchestratorState,
} from '../game/GameOrchestrator'

/**
 * Clear the current round as if the last play just reached its target.
 *
 * `spareTurns` is the Turns left when the round ends. It defaults to none —
 * cleared on the last Turn — so no Omen is earned; a Small or Large round
 * cleared with two or more to spare earns its Omen (a swift clear).
 */
export function clearRound(
  game: GameOrchestrator,
  { spareTurns = 0 }: { spareTurns?: number } = {}
): Effect[] {
  const state = game.getState() as OrchestratorState
  state.handsRemaining = spareTurns
  state.score = Math.max(state.score, state.targetScore)
  const effects: Effect[] = []
  ;(
    game as unknown as { checkRoundCompletion(effects: Effect[]): void }
  ).checkRoundCompletion(effects)
  return effects
}

/** Clear the current round and leave the Tea House for the next one. */
export function advanceRound(
  game: GameOrchestrator,
  options: { spareTurns?: number } = {}
): void {
  clearRound(game, options)
  game.exitShop()
}

/** Advance until the current round is the given one of the current Act. */
export function advanceToRound(
  game: GameOrchestrator,
  roundType: 'Small' | 'Large' | 'Boss',
  options: { spareTurns?: number } = {}
): void {
  for (let guard = 0; guard < 3; guard++) {
    const current = game.getState().roundManager.getCurrentRound()
    if (current?.roundType === roundType) return
    advanceRound(game, options)
  }
  throw new Error(`Could not reach the ${roundType} round`)
}
