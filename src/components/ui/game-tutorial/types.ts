/**
 * Game Tutorial Types
 *
 * Type definitions for in-game tutorial components.
 */

/**
 * Arrow direction for tooltip positioning
 */
export type ArrowDirection = 'top' | 'bottom' | 'left' | 'right'

/**
 * Tutorial step definition for in-game tutorial
 */
export interface GameTutorialStep {
  id: string
  /** CSS selector for the target element to highlight */
  targetSelector?: string
  /** Static position if no target selector (x, y as percentages) */
  position?: { x: number; y: number }
  /** Direction the arrow points */
  arrowDirection: ArrowDirection
  /** Title of the tooltip */
  title: string
  /** Content/instruction text */
  content: string
  /** Whether to wait for user action or just show a "Got it" button */
  waitForAction?: boolean
  /** Action description if waiting for user action */
  actionHint?: string
  /** Highlight padding around the target element */
  highlightPadding?: number
}

/**
 * Props for GameTutorial component
 */
export interface GameTutorialProps {
  /** Whether the tutorial is active */
  isActive: boolean
  /** Current step index */
  currentStep: number
  /** Tutorial steps */
  steps: GameTutorialStep[]
  /** Callback when step is completed */
  onStepComplete: () => void
  /** Callback when tutorial is skipped */
  onSkip: () => void
  /** Callback when tutorial is completed */
  onComplete: () => void
}

/**
 * Props for TutorialTooltip component
 */
export interface TutorialTooltipProps {
  step: GameTutorialStep
  targetRect: DOMRect | null
  onNext: () => void
  onSkip: () => void
  isLastStep: boolean
}

/**
 * Props for HighlightOverlay component
 */
export interface HighlightOverlayProps {
  targetRect: DOMRect | null
  padding?: number
}

/**
 * Props for Arrow component
 */
export interface ArrowProps {
  direction: ArrowDirection
  className?: string
}
