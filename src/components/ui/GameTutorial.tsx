/**
 * In-Game Tutorial System for Tensho Mahjong Roguelike
 *
 * Interactive tutorial overlay that highlights game elements
 * and guides players through actual gameplay with arrows and tooltips.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'

const AnimatedDiv = animated('div')

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
 * Arrow SVG component
 */
function Arrow({ direction, className }: { direction: ArrowDirection; className?: string }) {
  const rotations: Record<ArrowDirection, string> = {
    top: 'rotate-0',
    bottom: 'rotate-180',
    left: '-rotate-90',
    right: 'rotate-90',
  }

  return (
    <svg
      className={`w-8 h-8 text-[var(--color-golden-yellow)] ${rotations[direction]} ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L4 14h6v8h4v-8h6L12 2z" />
    </svg>
  )
}

/**
 * Tooltip component with arrow
 */
function TutorialTooltip({
  step,
  targetRect,
  onNext,
  onSkip,
  isLastStep,
}: {
  step: GameTutorialStep
  targetRect: DOMRect | null
  onNext: () => void
  onSkip: () => void
  isLastStep: boolean
}) {
  const { t } = useTranslation()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const spring = useSpring({
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    config: { tension: 300, friction: 20 },
  })

  // Calculate tooltip position based on target and arrow direction
  useEffect(() => {
    if (!targetRect && !step.position) return

    const padding = 20
    const arrowOffset = 40
    let x: number, y: number

    if (step.position) {
      x = (window.innerWidth * step.position.x) / 100
      y = (window.innerHeight * step.position.y) / 100
    } else if (targetRect) {
      const centerX = targetRect.left + targetRect.width / 2
      const centerY = targetRect.top + targetRect.height / 2

      switch (step.arrowDirection) {
        case 'top':
          x = centerX
          y = targetRect.bottom + arrowOffset
          break
        case 'bottom':
          x = centerX
          y = targetRect.top - arrowOffset
          break
        case 'left':
          x = targetRect.right + arrowOffset
          y = centerY
          break
        case 'right':
          x = targetRect.left - arrowOffset
          y = centerY
          break
      }
    } else {
      x = window.innerWidth / 2
      y = window.innerHeight / 2
    }

    // Clamp to viewport
    const tooltipWidth = tooltipRef.current?.offsetWidth || 300
    const tooltipHeight = tooltipRef.current?.offsetHeight || 200

    x = Math.max(padding + tooltipWidth / 2, Math.min(window.innerWidth - padding - tooltipWidth / 2, x))
    y = Math.max(padding + tooltipHeight / 2, Math.min(window.innerHeight - padding - tooltipHeight / 2, y))

    setTooltipPosition({ x, y })
  }, [targetRect, step.position, step.arrowDirection])

  // Arrow position relative to tooltip
  const getArrowStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute' }
    switch (step.arrowDirection) {
      case 'top':
        return { ...base, top: -28, left: '50%', transform: 'translateX(-50%)' }
      case 'bottom':
        return { ...base, bottom: -28, left: '50%', transform: 'translateX(-50%)' }
      case 'left':
        return { ...base, left: -28, top: '50%', transform: 'translateY(-50%)' }
      case 'right':
        return { ...base, right: -28, top: '50%', transform: 'translateY(-50%)' }
    }
  }

  return (
    <AnimatedDiv
      ref={tooltipRef}
      className="fixed z-[1001] max-w-[320px] md:max-w-[400px]"
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: 'translate(-50%, -50%)',
        opacity: spring.opacity,
        scale: spring.scale,
      }}
    >
      {/* Tooltip card */}
      <div className="relative bg-[var(--color-dark-forest)] border-2 border-[var(--color-golden-yellow)] rounded-xl p-5 shadow-2xl">
        {/* Arrow */}
        <div style={getArrowStyle()}>
          <Arrow direction={step.arrowDirection} />
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-2">
          {step.title}
        </h3>
        <p className="text-[var(--color-beige-white)] mb-4 leading-relaxed">
          {step.content}
        </p>

        {/* Action hint */}
        {step.waitForAction && step.actionHint && (
          <p className="text-[var(--color-vibrant-orange)] text-sm mb-4 italic">
            {step.actionHint}
          </p>
        )}

        {/* Buttons */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={onSkip}
            className="text-[var(--color-metallic-gold)] text-sm hover:text-[var(--color-golden-yellow)] transition-colors"
          >
            {t('gameTutorial.skip', 'Skip Tutorial')}
          </button>

          {!step.waitForAction && (
            <button
              onClick={onNext}
              className="px-4 py-2 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                         text-[var(--color-beige-white)] font-bold rounded-lg
                         border-2 border-[var(--color-golden-yellow)]
                         transition-all hover:scale-105 active:scale-95 text-sm"
            >
              {isLastStep
                ? t('gameTutorial.finish', 'Got it!')
                : t('gameTutorial.next', 'Next →')}
            </button>
          )}
        </div>
      </div>
    </AnimatedDiv>
  )
}

/**
 * Highlight overlay component
 */
function HighlightOverlay({
  targetRect,
  padding = 8,
}: {
  targetRect: DOMRect | null
  padding?: number
}) {
  if (!targetRect) return null

  const highlightSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { tension: 200, friction: 20 },
  })

  // Create a "spotlight" effect using box-shadow
  const left = targetRect.left - padding
  const top = targetRect.top - padding
  const width = targetRect.width + padding * 2
  const height = targetRect.height + padding * 2

  return (
    <>
      {/* Dark overlay with cutout */}
      <AnimatedDiv
        className="fixed inset-0 z-[999] pointer-events-none"
        style={{
          opacity: highlightSpring.opacity,
          background: `
            linear-gradient(to right, rgba(0,0,0,0.75) ${left}px, transparent ${left}px, transparent ${left + width}px, rgba(0,0,0,0.75) ${left + width}px),
            linear-gradient(to bottom, rgba(0,0,0,0.75) ${top}px, transparent ${top}px, transparent ${top + height}px, rgba(0,0,0,0.75) ${top + height}px)
          `,
          backgroundBlendMode: 'multiply',
        }}
      />

      {/* Highlight border */}
      <AnimatedDiv
        className="fixed z-[1000] pointer-events-none border-2 border-[var(--color-golden-yellow)] rounded-lg"
        style={{
          left: left,
          top: top,
          width: width,
          height: height,
          opacity: highlightSpring.opacity,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.7), 0 0 20px var(--color-golden-yellow)',
        }}
      />
    </>
  )
}

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

/**
 * Hook to manage in-game tutorial state
 */
export function useGameTutorial(steps: GameTutorialStep[]) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompleted, setHasCompleted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tensho_game_tutorial_completed') === 'true'
    }
    return false
  })

  const start = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }, [steps.length])

  const skip = useCallback(() => {
    setIsActive(false)
    setCurrentStep(0)
  }, [])

  const complete = useCallback(() => {
    setIsActive(false)
    setHasCompleted(true)
    setCurrentStep(0)
    if (typeof window !== 'undefined') {
      localStorage.setItem('tensho_game_tutorial_completed', 'true')
    }
  }, [])

  const reset = useCallback(() => {
    setHasCompleted(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tensho_game_tutorial_completed')
    }
  }, [])

  // Trigger step complete from external action
  const completeCurrentStep = useCallback(() => {
    if (isActive && steps[currentStep]?.waitForAction) {
      if (currentStep === steps.length - 1) {
        complete()
      } else {
        nextStep()
      }
    }
  }, [isActive, currentStep, steps, complete, nextStep])

  return {
    isActive,
    currentStep,
    hasCompleted,
    start,
    nextStep,
    skip,
    complete,
    reset,
    completeCurrentStep,
  }
}

export default GameTutorial
