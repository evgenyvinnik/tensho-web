/**
 * Game Tutorial Components
 *
 * Helper components for the in-game tutorial system.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'
import { TileSuit, Tile } from '../../../core/Tile'
import { TileImage } from '../../tiles/TileImage'

const AnimatedDiv = animated('div')

// =============================================================================
// TYPES
// =============================================================================

/**
 * Arrow direction for tooltip positioning
 */
export type ArrowDirection = 'top' | 'bottom' | 'left' | 'right'

/**
 * Tile example for displaying in tutorial
 */
export interface TileExample {
  suit: TileSuit
  rank: number
  label?: string
}

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
  /** Example tiles to display with optional labels */
  exampleTiles?: TileExample[][]
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

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Arrow SVG component for tutorial tooltips
 *
 * Renders a directional arrow that points toward the target element.
 * The arrow rotates based on the specified direction.
 *
 * @param direction - The direction the arrow should point
 * @param className - Additional CSS classes for styling
 */
export function Arrow({ direction, className }: ArrowProps) {
  const rotations: Record<typeof direction, string> = {
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
 * Tutorial tooltip component with arrow and content
 *
 * Displays a floating tooltip that positions itself relative to a target
 * element. Contains the tutorial step content, optional tile examples,
 * action hints, and navigation buttons.
 *
 * Features:
 * - Auto-positions based on target element and arrow direction
 * - Clamps to viewport boundaries
 * - Animated entrance with spring physics
 * - Displays optional example tiles with labels
 *
 * @param step - Current tutorial step configuration
 * @param targetRect - Bounding rectangle of the target element
 * @param onNext - Callback when user clicks next/finish
 * @param onSkip - Callback when user clicks skip
 * @param isLastStep - Whether this is the final tutorial step
 */
export function TutorialTooltip({
  step,
  targetRect,
  onNext,
  onSkip,
  isLastStep,
}: TutorialTooltipProps) {
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
      className="fixed z-[1001] max-w-[320px] md:max-w-[400px] pointer-events-none"
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: spring.scale.to((s) => `translate(-50%, -50%) scale(${s})`),
        opacity: spring.opacity,
      }}
    >
      {/* Tooltip card - this part IS interactive for buttons */}
      <div className="relative bg-[var(--color-dark-forest)] border-2 border-[var(--color-golden-yellow)] rounded-xl p-5 shadow-2xl pointer-events-auto">
        {/* Arrow - only show when pointing at a target element */}
        {targetRect && (
          <div style={getArrowStyle()}>
            <Arrow direction={step.arrowDirection} />
          </div>
        )}

        {/* Content */}
        <h3 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-2">
          {step.title}
        </h3>
        <p className="text-[var(--color-beige-white)] mb-4 leading-relaxed">
          {step.content}
        </p>

        {/* Example tiles */}
        {step.exampleTiles && step.exampleTiles.length > 0 && (
          <div className="mb-4 space-y-2">
            {step.exampleTiles.map((tileRow, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-2 flex-wrap">
                {tileRow.map((tileExample, tileIndex) => {
                  const tile = Tile.create(tileExample.suit, tileExample.rank)
                  return (
                    <div key={tileIndex} className="flex flex-col items-center gap-1">
                      <TileImage tile={tile} size="small" />
                      {tileExample.label && (
                        <span className="text-xs text-[var(--color-metallic-gold)]">
                          {tileExample.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

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
            className="min-h-[44px] px-3 py-2 text-[var(--color-metallic-gold)] text-sm hover:text-[var(--color-golden-yellow)] transition-colors"
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
 * Highlight overlay component for tutorial targets
 *
 * Creates a glowing golden border around the target element to draw
 * the user's attention. Uses spring animation for smooth fade-in/out.
 *
 * The overlay is non-blocking (pointer-events: none) so users can
 * still interact with the highlighted element.
 *
 * @param targetRect - Bounding rectangle of the element to highlight
 * @param padding - Extra padding around the highlight (default: 8px)
 */
export function HighlightOverlay({
  targetRect,
  padding = 8,
}: HighlightOverlayProps) {
  const highlightSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: targetRect ? 1 : 0 },
    config: { tension: 200, friction: 20 },
  })

  if (!targetRect) return null

  // Create a highlight effect around the target element
  const left = targetRect.left - padding
  const top = targetRect.top - padding
  const width = targetRect.width + padding * 2
  const height = targetRect.height + padding * 2

  return (
    <>
      {/* Highlight border with golden glow (no blackout) */}
      <AnimatedDiv
        className="fixed z-[1000] pointer-events-none border-2 border-[var(--color-golden-yellow)] rounded-lg"
        style={{
          left: left,
          top: top,
          width: width,
          height: height,
          opacity: highlightSpring.opacity,
          boxShadow: '0 0 30px var(--color-golden-yellow), 0 0 60px var(--color-golden-yellow), inset 0 0 20px rgba(255,213,79,0.3)',
        }}
      />
    </>
  )
}
