/** A settled play, not the round's running score. Never reconstructed from Yaku events. */
export interface ScoreEquation {
  readonly points: number
  readonly multiplier: number
  /** Net post-multiplication effects, including penalties, rounding and Omens. */
  readonly adjustment: number
  readonly total: number
}

export function settleScoreEquation(
  points: number,
  multiplier: number,
  total: number
): ScoreEquation {
  return Object.freeze({
    points,
    multiplier,
    adjustment: total - Math.floor(points * multiplier),
    total,
  })
}

export const EMPTY_SCORE_EQUATION = settleScoreEquation(0, 1, 0)
