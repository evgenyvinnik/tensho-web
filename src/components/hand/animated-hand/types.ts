/**
 * Animated Hand Types
 *
 * Type definitions for animated hand components.
 */

import { Tile } from '../../../core/Tile'
import { TileSize } from '../../tiles/TileImage'

/**
 * Props for AnimatedHand component
 */
export interface AnimatedHandProps {
  /** Array of tiles in the hand */
  tiles: Tile[]
  /** Size of tiles to display */
  size?: TileSize
  /** Set of selected tile IDs */
  selectedIds?: Set<string>
  /** Set of highlighted tile IDs */
  highlightedIds?: Set<string>
  /** Set of glowing tile IDs (winning tiles) */
  glowingIds?: Set<string>
  /** Handler for tile click */
  onTileClick?: (tile: Tile) => void
  /** Handler for tile drag start */
  onDragStart?: (tile: Tile) => void
  /** Handler for tile drag end */
  onDragEnd?: (tile: Tile, position: { x: number; y: number }) => void
  /** Handler for tile discard (drag-to-discard) */
  onTileDiscard?: (tile: Tile) => void
  /** Whether to allow tile dragging */
  draggable?: boolean
  /** Whether to fan tiles out (false = straight line) */
  fanned?: boolean
  /** Maximum fan angle in degrees */
  maxFanAngle?: number
  /** Whether to overlap tiles */
  overlap?: boolean
  /** Whether the hand is disabled */
  disabled?: boolean
  /** Additional CSS class */
  className?: string
  /** Layout direction */
  layout?: 'horizontal' | 'vertical'
}

/**
 * Props for HandWithDiscardZone component
 */
export interface HandWithDiscardZoneProps extends Omit<AnimatedHandProps, 'onDragStart' | 'onDragEnd'> {
  /** Label for the discard zone */
  discardZoneLabel?: string
}

/**
 * Props for CompactHand component
 */
export interface CompactHandProps {
  /** Number of tiles (for face-down display) or actual tiles */
  tiles: Tile[] | number
  /** Size of tiles */
  size?: TileSize
  /** Whether tiles are face down */
  faceDown?: boolean
  /** Additional CSS class */
  className?: string
}

/**
 * Position data for a tile in the hand layout
 */
export interface TilePosition {
  x: number
  rotation: number
  zIndex: number
}
