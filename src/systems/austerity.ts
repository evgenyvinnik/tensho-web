/** Base Decree factor, before other systems; only actual complete plays grow it. */
export function austerityMultiplier(priorCompleteHands: number): number {
  return Math.min(4, 1.5 * 1.2 ** priorCompleteHands)
}
import type { DecreeEffect } from './types'

export const LEGACY_AUSTERITY_EFFECT: DecreeEffect = {
  type: 'conditional',
  trigger: 'Independent',
  description: 'x1.5 for concealed hands',
  condition: {
    type: 'hand_state',
    target: 'isConcealed',
    operator: 'eq',
    value: true,
  },
  effect: {
    type: 'multiplicative_score',
    trigger: 'Independent',
    description: 'x1.5 Mult for concealed',
    multiplier: 1.5,
  },
}
export const AUSTERITY_EFFECT: DecreeEffect = {
  type: 'scaling',
  trigger: 'Independent',
  description: 'Complete concealed hand mastery',
  baseValue: 0.5,
  scalingFactor: 0.2,
  scalingCondition: 'complete_concealed_hands',
  maxValue: 3,
}
