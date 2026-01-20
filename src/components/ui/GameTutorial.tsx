/**
 * In-Game Tutorial System for Tensho Mahjong Roguelike
 *
 * Interactive tutorial overlay that highlights game elements
 * and guides players through actual gameplay with arrows and tooltips.
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

// Import from extracted modules
import {
  GameTutorialProps,
  TutorialTooltip,
  HighlightOverlay,
} from './game-tutorial/TutorialComponents'

// Re-export types and components for external use
export type {
  ArrowDirection,
  GameTutorialStep,
  GameTutorialProps,
} from './game-tutorial/TutorialComponents'
export { Arrow, TutorialTooltip, HighlightOverlay } from './game-tutorial/TutorialComponents'
export { useGameTutorial } from './game-tutorial/useGameTutorial'

/**
 * Main GameTutorial component
 */
export function GameTutorial({
  isActive,
  currentStep,
  steps,
  onStepComplete,
  onSkip,
  onComplete,
}: GameTutorialProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  // Find and track target element position
  useEffect(() => {
    if (!isActive || !step?.targetSelector) {
      setTargetRect(null)
      return
    }

    const updatePosition = () => {
      const element = document.querySelector(step.targetSelector!)
      if (element) {
        setTargetRect(element.getBoundingClientRect())
      } else {
        setTargetRect(null)
      }
    }

    updatePosition()

    // Update on resize/scroll
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    // Poll for element (in case it appears later)
    const pollInterval = setInterval(updatePosition, 500)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      clearInterval(pollInterval)
    }
  }, [isActive, step?.targetSelector])

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete()
    } else {
      onStepComplete()
    }
  }, [isLastStep, onComplete, onStepComplete])

  if (!isActive || !step) return null

  return createPortal(
    <>
      {/* Highlight overlay */}
      <HighlightOverlay
        targetRect={targetRect}
        padding={step.highlightPadding ?? 8}
      />

      {/* Click blocker (except for highlighted area if waiting for action) */}
      {!step.waitForAction && (
        <div className="fixed inset-0 z-[1000]" onClick={(e) => e.stopPropagation()} />
      )}

      {/* Tooltip */}
      <TutorialTooltip
        step={step}
        targetRect={targetRect}
        onNext={handleNext}
        onSkip={onSkip}
        isLastStep={isLastStep}
      />
    </>,
    document.body
  )
}

export default GameTutorial
