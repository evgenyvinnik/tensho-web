/**
 * Score Popup Components
 *
 * Animated score display components for the game.
 */

// Types
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
} from './types'

// Components
export { ScorePopup, default } from './ScorePopup'
export { ChipsMultPopup } from './ChipsMultPopup'
export { ScoreCounter } from './ScoreCounter'
export { ComboDisplay } from './ComboDisplay'
export { StackingScorePopup } from './StackingScorePopup'
export { TotalScoreReveal } from './TotalScoreReveal'
export { RetriggerPopup } from './RetriggerPopup'

// Hooks
export { useScorePopups } from './useScorePopups'
export type { UseScorePopupsReturn } from './useScorePopups'
