import type { Tile } from '../core/Tile'
import {
  hasModifiers,
  type EditionType,
  type EnhancementType,
  type SealType,
} from '../core/TileModifier'

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

/** What an item lays on its tile targets, if anything. */
export interface ConsumableModifierRule extends ConsumableTargetRule {
  type: string
  enhancement?: EnhancementType
  sealType?: SealType
  editionType?: EditionType
}

/**
 * A tile holds one Mark, Seal or Edition, so laying a different one on it
 * replaces what it carries. A random Edition replaces anything.
 */
export function replacesTileModifier(
  effect: ConsumableModifierRule,
  tile: Tile
): boolean {
  if (!effect.requiresSelection || !hasModifiers(tile.modifiers)) return false
  if (effect.enhancement) return tile.enhancement !== effect.enhancement
  if (effect.sealType) return tile.seal !== effect.sealType
  if (effect.type !== 'apply_edition') return false
  return !effect.editionType || tile.edition !== effect.editionType
}
