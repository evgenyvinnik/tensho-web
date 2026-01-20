/**
 * Tile Modifier UI Components
 *
 * Visual components for displaying tile modifiers:
 * - ModifierBadge: Small indicator for enhancement/seal/edition
 * - ModifierOverlay: Overlay effects for modified tiles
 * - ModifierTooltip: Detailed modifier information
 * - ModifierSelector: UI for selecting modifiers
 */

// Re-export all tile modifier components and types from the module
export {
  ModifierBadge,
  ModifierOverlay,
  ModifierTooltip,
  ModifierRow,
  ModifierSelector,
} from './tile-modifier/ModifierComponents'

export type {
  ModifierBadgeProps,
  ModifierOverlayProps,
  ModifierTooltipProps,
  ModifierRowProps,
  ModifierSelectorProps,
} from './tile-modifier/ModifierComponents'

export {
  ENHANCEMENT_COLORS,
  SEAL_COLORS,
  EDITION_EFFECTS,
  getEnhancementIcon,
  getSealIcon,
  getEditionIcon,
} from './tile-modifier/constants'

// Default export for backwards compatibility
import {
  ModifierBadge,
  ModifierOverlay,
  ModifierTooltip,
  ModifierSelector,
} from './tile-modifier/ModifierComponents'

export default {
  ModifierBadge,
  ModifierOverlay,
  ModifierTooltip,
  ModifierSelector,
}
