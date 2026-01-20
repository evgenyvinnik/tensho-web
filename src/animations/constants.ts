/**
 * Animation Constants for Tensho Mahjong Roguelike
 *
 * Subtle, non-distracting animations that enhance without overwhelming.
 * Uses React Spring physics-based spring configurations.
 */

/**
 * Duration presets in milliseconds - kept subtle
 */
export const DURATIONS = {
  /** Instant feedback (80ms) */
  instant: 80,
  /** Fast transitions (150ms) */
  fast: 150,
  /** Normal animations (250ms) */
  normal: 250,
  /** Slow, deliberate animations (400ms) */
  slow: 400,
  /** Dramatic reveals (600ms) */
  dramatic: 600,
  /** Extended animations (900ms) */
  extended: 900,
} as const;

/**
 * React Spring configuration presets - tuned for subtlety
 * Lower tension = slower, higher friction = less bouncy
 */
export const SPRINGS = {
  /** Snappy but not jarring */
  snappy: { tension: 200, friction: 22 },
  /** Gentle bounce for positive feedback */
  bouncy: { tension: 150, friction: 14 },
  /** Smooth, almost imperceptible */
  gentle: { tension: 100, friction: 18 },
  /** Precise positioning */
  stiff: { tension: 280, friction: 26 },
  /** Very subtle wobble */
  wobbly: { tension: 140, friction: 12 },
  /** Slow and smooth */
  molasses: { tension: 60, friction: 20 },
} as const;

/**
 * Easing functions for non-spring animations
 */
export const EASINGS = {
  /** Smooth ease out */
  easeOut: 'cubic-bezier(0.33, 1, 0.68, 1)',
  /** Gentle ease in */
  easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
  /** Balanced ease in-out */
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  /** Subtle overshoot */
  backOut: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
  /** Very gentle elastic */
  elastic: 'cubic-bezier(0.68, -0.2, 0.32, 1.2)',
} as const;

/**
 * Stagger delays - subtle timing between items
 */
export const STAGGER = {
  /** Quick stagger (20ms) */
  fast: 20,
  /** Normal stagger (35ms) */
  normal: 35,
  /** Slow stagger (60ms) */
  slow: 60,
  /** Sequential reveals (100ms) */
  dramatic: 100,
} as const;

/**
 * Scale values - kept minimal for subtlety
 */
export const SCALES = {
  /** Slight press */
  pressed: 0.97,
  /** Normal */
  normal: 1,
  /** Tiny pop */
  pop: 1.02,
  /** Gentle emphasis */
  emphasis: 1.04,
  /** Reveal */
  reveal: 1.06,
  /** Shrunk */
  shrink: 0.92,
  /** Small */
  tiny: 0.7,
} as const;

/**
 * Opacity values
 */
export const OPACITY = {
  hidden: 0,
  faint: 0.15,
  subtle: 0.3,
  medium: 0.5,
  visible: 0.75,
  full: 1,
} as const;

/**
 * Y-offset values - reduced for subtlety
 */
export const OFFSETS = {
  /** Small lift (selection) */
  lift: -4,
  /** Gentle float (popups) */
  float: -12,
  /** Rise (reveals) */
  rise: -24,
  /** Slide in */
  slideIn: 30,
  /** Slide out */
  slideOut: -20,
  /** Drop from above */
  drop: -60,
} as const;

/**
 * Rotation values - minimal
 */
export const ROTATIONS = {
  /** Tiny wobble */
  wobble: 1.5,
  /** Subtle tilt */
  tilt: 3,
  /** Light turn */
  turn: 8,
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
  background: -1,
  normal: 0,
  elevated: 10,
  floating: 50,
  overlay: 100,
  effects: 200,
  screenEffect: 500,
} as const;

/**
 * Color values for animation effects (Tensho theme)
 */
export const ANIMATION_COLORS = {
  gold: '#FFD54F',
  orange: '#FF5722',
  green: '#4CAF50',
  red: '#F44336',
  white: '#F5F5DC',
  purple: '#9C27B0',
  blue: '#2196F3',
} as const;

export type SpringConfig = (typeof SPRINGS)[keyof typeof SPRINGS];
export type Duration = (typeof DURATIONS)[keyof typeof DURATIONS];
