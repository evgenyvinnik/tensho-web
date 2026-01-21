/**
 * ScorePopup Component for Tensho Mahjong Roguelike
 *
 * Animated score popup that floats up and fades out.
 * Shows points earned with multipliers applied.
 *
 * Enhanced with:
 * - Chips/mult number popups
 * - Score counter animation (counting up)
 * - Combo multiplier display
 * - Retrigger pulse effect
 *
 * This file re-exports from the score-popup folder for backwards compatibility.
 */

// Re-export everything from the modular structure
export {
  ScorePopup,
  ChipsMultPopup,
  ScoreCounter,
  ComboDisplay,
  StackingScorePopup,
  TotalScoreReveal,
  RetriggerPopup,
  useScorePopups,
  default,
} from './score-popup'

export type {
  Position,
  ScorePopupProps,
  ScoreDisplayStyle,
  ChipsMultPopupProps,
  ScoreCounterProps,
  ComboDisplayProps,
  StackingScorePopupProps,
  TotalScoreRevealProps,
  RetriggerPopupProps,
  UseScorePopupsReturn,
} from './score-popup'

// Legacy alias for backwards compatibility
export { ChipsMultPopup as ChipsMullPopup } from './score-popup'
export type { ChipsMultPopupProps as ChipsMullPopupProps } from './score-popup'
