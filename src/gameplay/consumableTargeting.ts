/** Authoritative target-count metadata shared by the engine and its picker. */
export interface ConsumableTargetRule {
  requiresSelection?: boolean
  selectionCount?: number
  minimumSelectionCount?: number
}

export function consumableTargetRange(effect: ConsumableTargetRule) {
  if (!effect.requiresSelection) return { min: 0, max: 0 }
  const max = effect.selectionCount ?? 1
  return { min: effect.minimumSelectionCount ?? max, max }
}

export function validateConsumableTargetCount(
  effect: ConsumableTargetRule,
  count: number
): string | null {
  const { min, max } = consumableTargetRange(effect)
  if (count >= min && count <= max) return null
  if (max === 0) return 'This consumable does not take tile targets'
  return min === max
    ? `Select exactly ${max} tile${max === 1 ? '' : 's'}`
    : `Select ${min}–${max} tiles`
}
