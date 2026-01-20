/**
 * Tile Modifier Types
 *
 * Type definitions for tile modifier components.
 */

import { EnhancementType, SealType, EditionType } from '../../../core/TileModifier'
import { Tile } from '../../../core/Tile'

/**
 * Props for ModifierBadge component
 */
export interface ModifierBadgeProps {
  enhancement?: EnhancementType
  seal?: SealType
  edition?: EditionType
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  className?: string
}

/**
 * Props for ModifierOverlay component
 */
export interface ModifierOverlayProps {
  tile: Tile
  className?: string
}

/**
 * Props for ModifierTooltip component
 */
export interface ModifierTooltipProps {
  tile: Tile
  className?: string
}

/**
 * Props for ModifierRow helper component
 */
export interface ModifierRowProps {
  type: 'enhancement' | 'seal' | 'edition'
  name: string
  japaneseName: string
  description: string
  colors: { bg: string; border: string; text: string }
}

/**
 * Props for ModifierSelector component
 */
export interface ModifierSelectorProps {
  currentEnhancement: EnhancementType
  currentSeal: SealType
  currentEdition: EditionType
  onEnhancementChange?: (enhancement: EnhancementType) => void
  onSealChange?: (seal: SealType) => void
  onEditionChange?: (edition: EditionType) => void
  className?: string
}
