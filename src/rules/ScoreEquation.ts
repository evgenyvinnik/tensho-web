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

/**
 * Where a play's whole-number rounding falls. A total is
 * `floor(points × multiplier) + adjustment`, so showing the dropped fraction is
 * what lets "50 × 0.975 → 48" add up on screen.
 */
export function scoreRounding(points: number, multiplier: number) {
  const product = points * multiplier
  const rounded = Math.floor(product)
  return {
    product,
    rounded,
    // Float noise such as 65.00000000000001 is not a rounding to explain.
    roundedDown: product - rounded >= 0.0005,
  }
}
