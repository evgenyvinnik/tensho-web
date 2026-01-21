/**
 * Score popup types and shared utilities
 */

export interface Position {
  x: number
  y: number
}

export interface ScorePopupProps {
  /** Points to display */
  points: number
  /** Multiplier applied (optional) */
  multiplier?: number
  /** Position relative to parent (percentage) */
  position?: Position
  /** Duration before fade out in milliseconds */
  displayDuration?: number
  /** Callback when animation completes */
  onComplete?: () => void
  /** Color variant */
  variant?: 'default' | 'bonus' | 'critical' | 'chips' | 'mult'
  /** Additional CSS class name */
  className?: string
}

export type ScoreDisplayStyle = 'float' | 'pop' | 'slide' | 'cascade'

export interface ChipsMultPopupProps {
  /** Base points value */
  chips: number
  /** Multiplier value */
  mult: number
  /** Position relative to parent */
  position?: Position
  /** Whether to animate the calculation */
  animateCalc?: boolean
  /** Callback when animation completes */
  onComplete?: () => void
  /** Additional CSS class name */
  className?: string
}

export interface ScoreCounterProps {
  /** Current score value */
  value: number
  /** Whether to animate changes */
  animate?: boolean
  /** Duration of count animation in ms */
  duration?: number
  /** Label to display */
  label?: string
  /** Color of the score */
  color?: string
  /** Font size */
  fontSize?: number
  /** Additional CSS class name */
  className?: string
}

export interface ComboDisplayProps {
  /** Combo count */
  combo: number
  /** Maximum combo for scaling effects */
  maxCombo?: number
  /** Position */
  position?: Position
  /** Additional CSS class name */
  className?: string
}

export interface StackingScorePopupProps {
  /** Array of score items to display */
  items: Array<{
    label: string
    points: number
    multiplier?: number
  }>
  /** Position relative to parent */
  position?: Position
  /** Stagger delay between items */
  staggerDelay?: number
  /** Callback when animation completes */
  onComplete?: () => void
  /** Additional CSS class name */
  className?: string
}

export interface TotalScoreRevealProps {
  /** Base points before multipliers */
  basePoints: number
  /** Total multiplier */
  totalMultiplier: number
  /** Final calculated score */
  finalScore: number
  /** Whether to show the reveal */
  isVisible?: boolean
  /** Callback when animation completes */
  onComplete?: () => void
  /** Additional CSS class name */
  className?: string
}

export interface RetriggerPopupProps {
  /** Number of retriggers */
  count: number
  /** Position relative to parent */
  position?: Position
  /** Callback when animation completes */
  onComplete?: () => void
  /** Additional CSS class name */
  className?: string
}
