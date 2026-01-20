/**
 * Yaku Reveal Types
 *
 * Type definitions for yaku reveal components.
 */

import { YakuDefinition } from '../../../rules/YakuDefinition'

/**
 * Props for YakuReveal component
 */
export interface YakuRevealProps {
  /** Yaku to reveal */
  yaku: YakuDefinition
  /** Multiplier value for this yaku */
  multiplier: number
  /** Whether the reveal is active */
  isVisible?: boolean
  /** Delay before showing (for chaining) */
  delay?: number
  /** Callback when animation completes */
  onComplete?: () => void
  /** Additional CSS class name */
  className?: string
}

/**
 * Props for YakuRevealSequence component
 */
export interface YakuRevealSequenceProps {
  /** Array of yaku to reveal */
  yakuList: Array<{
    definition: YakuDefinition
    multiplier: number
  }>
  /** Whether the sequence is active */
  isVisible?: boolean
  /** Delay between each yaku reveal */
  staggerDelay?: number
  /** Callback when all reveals complete */
  onComplete?: () => void
  /** Additional CSS class name */
  className?: string
}

/**
 * Props for YakuBanner component
 */
export interface YakuBannerProps {
  /** Yaku to display */
  yaku: YakuDefinition
  /** Multiplier value */
  multiplier: number
  /** Position from top */
  position?: 'top' | 'center' | 'bottom'
  /** Whether visible */
  isVisible?: boolean
  /** Callback on complete */
  onComplete?: () => void
  /** Additional CSS class */
  className?: string
}

/**
 * Style configuration for a yaku tier
 */
export interface TierStyles {
  backgroundColor: string
  borderColor: string
  glowColor: string
  textColor: string
  accentColor: string
  intensity: number
  scale: number
}
