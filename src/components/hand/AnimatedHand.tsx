/**
 * AnimatedHand Component for Tensho Mahjong Roguelike
 *
 * Animated hand display with:
 * - Tiles fanning out from center
 * - New tiles sliding in from right
 * - Discarded tiles animating out
 * - Selection state animations
 * - Sorting animation (tiles rearrange smoothly)
 */

// Re-export all types
export type {
  AnimatedHandProps,
  HandWithDiscardZoneProps,
  CompactHandProps,
} from './animated-hand/HandComponents'

// Re-export TilePosition from positionUtils
export type { TilePosition } from './animated-hand/positionUtils'

// Re-export position utilities
export {
  calculateFannedPositions,
  calculateStraightPositions,
} from './animated-hand/positionUtils'

// Re-export all components
export {
  AnimatedHand,
  HandWithDiscardZone,
  CompactHand,
} from './animated-hand/HandComponents'

// Default export for backwards compatibility
import { AnimatedHand } from './animated-hand/HandComponents'
export default AnimatedHand
