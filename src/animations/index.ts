/**
 * Animation Utilities Index for Tensho Mahjong Roguelike
 *
 * Central export point for all animation-related utilities.
 */

// Constants
export {
  DURATIONS,
  SPRINGS,
  EASINGS,
  STAGGER,
  SCALES,
  OPACITY,
  OFFSETS,
  ROTATIONS,
  ANIMATION_Z_INDEX,
  ANIMATION_COLORS,
  type SpringConfig,
  type Duration,
} from './constants';

// Tile Animations
export {
  useTileDrawAnimation,
  useTileDiscardAnimation,
  useTileSelectAnimation,
  useTileShakeAnimation,
  useTileGlowAnimation,
  useTileHoverAnimation,
  useTilePressAnimation,
  useTileInteractionAnimation,
  useTileDragAnimation,
} from './useTileAnimation';

// Score Animations
export {
  useScoreCountUp,
  useScoreIncrement,
  useScorePopAnimation,
  useMultiplierAnimation,
  useComboAnimation,
  useCascadingScoreAnimation,
  useTotalScoreReveal,
  useScoreBreakdownAnimation,
  usePulsingScore,
} from './useScoreAnimation';

// Screen Transitions
export {
  useFadeTransition,
  useSlideTransition,
  useZoomTransition,
  usePageTransition,
  useModalTransition,
  useCurtainTransition,
  useStaggeredReveal,
  useScreenShake,
  type SlideDirection,
} from './useScreenTransition';
