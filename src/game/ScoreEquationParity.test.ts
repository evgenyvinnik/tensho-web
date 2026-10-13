import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { scoreRounding, type ScoreEquation } from '../rules/ScoreEquation'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

it.each([1, 0.975])(
  'forecasts the exact equation the play then settles (score factor %s)',
  (factor) => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState() as OrchestratorState
    state.targetScore = 1e9
    // A fractional factor makes the product non-integral, as Summer with
    // Winter does, so the rounding term is exercised rather than assumed.
    state.lossPreventionScorePenalty = factor
    const ids = state.handTiles.slice(0, 2).map((tile) => tile.id)

    const forecast = game.previewScore(ids)!
    expect(forecast).not.toBeNull()
    let paid: ScoreEquation | undefined
    eventBus.on('handPlayed', (data) => (paid = data.equation))
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )

    expect(paid).toEqual(forecast.equation)
    expect(forecast.equation.total).toBe(forecast.finalScore)
    // The parts on screen add up: floor(points × multiplier) + adjustment.
    const { rounded, roundedDown } = scoreRounding(
      forecast.equation.points,
      forecast.equation.multiplier
    )
    if (factor !== 1) expect(roundedDown).toBe(true)
    expect(rounded + forecast.equation.adjustment).toBe(forecast.equation.total)
  }
)
