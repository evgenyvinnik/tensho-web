/**
 * Animation Constants for Tensho Mahjong Roguelike
 *
 * Centralized timing and easing configurations for consistent animations
 * throughout the game. Uses React Spring physics-based spring configurations.
 */

/**
 * Duration presets in milliseconds
 * Use these for CSS transitions or as reference for spring timing
 */
export const DURATIONS = {
  /** Instant feedback (100ms) */
  instant: 100,
  /** Fast transitions (200ms) */
  fast: 200,
  /** Normal animations (300ms) */
  normal: 300,
  /** Slow, deliberate animations (500ms) */
  slow: 500,
  /** Dramatic reveals and effects (800ms) */
  dramatic: 800,
  /** Extended animations (1200ms) */
  extended: 1200,
} as const;

/**
 * React Spring configuration presets
 * These define the physics of spring animations
 * - tension: Spring stiffness (higher = faster, snappier)
 * - friction: Resistance to motion (higher = less bouncy)
 */
export const SPRINGS = {
  /** Snappy, responsive feel for UI interactions */
  snappy: { tension: 300, friction: 20 },
  /** Bouncy, playful feel for positive feedback */
  bouncy: { tension: 180, friction: 12 },
  /** Gentle, smooth feel for subtle transitions */
  gentle: { tension: 120, friction: 14 },
  /** Stiff, precise feel for accurate positioning */
  stiff: { tension: 400, friction: 30 },
  /** Very bouncy for celebratory effects */
  wobbly: { tension: 180, friction: 8 },
  /** Slow and dramatic for reveals */
  molasses: { tension: 80, friction: 20 },
} as const;

/**
 * Easing functions for non-spring animations
 * These are CSS timing function values
 */
export const EASINGS = {
  /** Standard ease out for most animations */
  easeOut: 'cubic-bezier(0.33, 1, 0.68, 1)',
  /** Ease in for exits */
  easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
  /** Ease in-out for symmetrical animations */
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  /** Back ease out with slight overshoot */
  backOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Elastic feel */
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
} as const;

/**
 * Animation delay presets for staggered animations
 */
export const STAGGER = {
  /** Fast stagger for lists (30ms between items) */
  fast: 30,
  /** Normal stagger (50ms between items) */
  normal: 50,
  /** Slow stagger for dramatic reveals (100ms between items) */
  slow: 100,
  /** Very slow for sequential reveals (200ms between items) */
  dramatic: 200,
} as const;

/**
 * Scale values for various animation states
 */
export const SCALES = {
  /** Slightly pressed down */
  pressed: 0.95,
  /** Normal size */
  normal: 1,
  /** Slight pop effect */
  pop: 1.05,
  /** Medium emphasis */
  emphasis: 1.1,
  /** Large emphasis for reveals */
  reveal: 1.2,
  /** Shrunk for exit animations */
  shrink: 0.8,
  /** Very small for hide */
  tiny: 0.5,
} as const;

/**
 * Common opacity values
 */
export const OPACITY = {
  hidden: 0,
  faint: 0.2,
  subtle: 0.4,
  medium: 0.6,
  visible: 0.8,
  full: 1,
} as const;

/**
 * Y-offset values for vertical animations (in pixels)
 */
export const OFFSETS = {
  /** Small lift (tile selection) */
  lift: -8,
  /** Medium float (score popup) */
  float: -20,
  /** Large rise (yaku reveal) */
  rise: -40,
  /** Slide in from below */
  slideIn: 50,
  /** Slide out above */
  slideOut: -30,
  /** Drop from above */
  drop: -100,
} as const;

/**
 * Rotation values in degrees
 */
export const ROTATIONS = {
  /** Subtle wobble */
  wobble: 3,
  /** Light tilt */
  tilt: 5,
  /** Medium rotation */
  turn: 15,
  /** Quarter turn */
  quarter: 90,
  /** Half turn */
  half: 180,
  /** Full rotation */
  full: 360,
} as const;

/**
 * Z-index values for animated elements
 */
export const ANIMATION_Z_INDEX = {
  /** Below normal content */
  background: -1,
  /** Normal level */
  normal: 0,
  /** Slightly elevated */
  elevated: 10,
  /** Floating elements */
  floating: 50,
  /** Overlay effects */
  overlay: 100,
  /** Top-level effects */
  effects: 200,
  /** Screen flash and full-screen effects */
  screenEffect: 500,
} as const;

/**
 * Color values for various animation effects
 * Uses Tensho theme colors
 */
export const ANIMATION_COLORS = {
  /** Gold for scores and rewards */
  gold: '#FFD54F',
  /** Orange for actions and highlights */
  orange: '#FF5722',
  /** Green for success */
  green: '#4CAF50',
  /** Red for warnings and yakuman */
  red: '#F44336',
  /** White for general effects */
  white: '#F5F5DC',
  /** Purple for special effects */
  purple: '#9C27B0',
  /** Blue for info */
  blue: '#2196F3',
} as const;

export type SpringConfig = (typeof SPRINGS)[keyof typeof SPRINGS];
export type Duration = (typeof DURATIONS)[keyof typeof DURATIONS];
