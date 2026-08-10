/**
 * Progressive Hint Component
 *
 * A lightweight, non-intrusive hint overlay that shows tutorial tips
 * contextually during gameplay. Designed to be less blocking than
 * the full tutorial overlay.
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSpring, animated } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import { ProgressiveHint } from '../../config/progressiveTutorialHints'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const AnimatedDiv = animated('div')

/**
 * Props for ProgressiveHintOverlay component
 */
interface ProgressiveHintOverlayProps {
  /** Current hint to display */
  hint: ProgressiveHint | null
  /** Callback when hint is dismissed */
  onDismiss: () => void
  /** Callback when user wants to disable all hints */
  onDisableHints: () => void
  /** Number of remaining hints in queue */
  queueCount: number
}

/**
 * Arrow component for hint tooltips
 */
function HintArrow({ direction }: { direction: ProgressiveHint['arrowDirection'] }) {
  const rotations: Record<typeof direction, string> = {
    top: 'rotate-0',
    bottom: 'rotate-180',
    left: '-rotate-90',
    right: 'rotate-90',
  }

  return (
    <svg
      className={`w-6 h-6 text-[var(--color-vibrant-orange)] ${rotations[direction]}`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L4 14h6v8h4v-8h6L12 2z" />
    </svg>
  )
}

/**
 * Progress indicator showing current hint position
 */
function HintProgress({
  current,
  total,
}: {
  current: number
  total: number
}) {
  if (total <= 1) return null

  return (
    <div className="flex items-center gap-1 opacity-60">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            i === current
              ? 'bg-[var(--color-vibrant-orange)]'
              : 'bg-[var(--color-beige-white)]'
          }`}
        />
      ))}
    </div>
  )
}

/**
 * ProgressiveHintOverlay - Main hint display component
 *
 * Renders a floating tooltip that highlights game elements and shows
 * tutorial tips. Less intrusive than the full tutorial - auto-dismisses
 * and allows continued gameplay.
 */
export function ProgressiveHintOverlay({
  hint,
  onDismiss,
  onDisableHints,
  queueCount,
}: ProgressiveHintOverlayProps) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // Animation spring
  const spring = useSpring({
    from: { opacity: 0, scale: 0.9, y: 10 },
    to: { opacity: hint ? 1 : 0, scale: hint ? 1 : 0.9, y: hint ? 0 : 10 },
    config: { tension: 300, friction: 22 },
    immediate: reduceMotion,
  })

  useEffect(() => {
    if (!hint) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hint, onDismiss])

  // Find and track target element position
  useEffect(() => {
    if (!hint?.targetSelector) {
      setTargetRect(null)
      return
    }

    const updatePosition = () => {
      const element = document.querySelector(hint.targetSelector!)
      if (element) {
        setTargetRect(element.getBoundingClientRect())
      } else {
        setTargetRect(null)
      }
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    const pollInterval = setInterval(updatePosition, 500)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      clearInterval(pollInterval)
    }
  }, [hint?.targetSelector])

  // Calculate tooltip position
  useEffect(() => {
    if (!hint) return

    const padding = 16
    const arrowOffset = 32
    let x: number, y: number

    if (hint.position) {
      x = (window.innerWidth * hint.position.x) / 100
      y = (window.innerHeight * hint.position.y) / 100
    } else if (targetRect) {
      const centerX = targetRect.left + targetRect.width / 2
      const centerY = targetRect.top + targetRect.height / 2

      switch (hint.arrowDirection) {
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
    const tooltipWidth = tooltipRef.current?.offsetWidth || 280
    const tooltipHeight = tooltipRef.current?.offsetHeight || 150

    x = Math.max(
      padding + tooltipWidth / 2,
      Math.min(window.innerWidth - padding - tooltipWidth / 2, x)
    )
    y = Math.max(
      padding + tooltipHeight / 2,
      Math.min(window.innerHeight - padding - tooltipHeight / 2, y)
    )

    setTooltipPosition({ x, y })
  }, [hint, targetRect])

  // Arrow position relative to tooltip
  const getArrowStyle = (): React.CSSProperties => {
    if (!hint) return {}
    const base: React.CSSProperties = { position: 'absolute' }
    switch (hint.arrowDirection) {
      case 'top':
        return { ...base, top: -22, left: '50%', transform: 'translateX(-50%)' }
      case 'bottom':
        return { ...base, bottom: -22, left: '50%', transform: 'translateX(-50%)' }
      case 'left':
        return { ...base, left: -22, top: '50%', transform: 'translateY(-50%)' }
      case 'right':
        return { ...base, right: -22, top: '50%', transform: 'translateY(-50%)' }
    }
  }

  if (!hint) return null

  const currentIndex = queueCount > 0 ? 0 : 0
  const totalHints = queueCount

  return createPortal(
    <>
      {/* Highlight overlay for target element */}
      {targetRect && (
        <AnimatedDiv
          className="fixed z-[1000] pointer-events-none border-2 border-[var(--color-vibrant-orange)] rounded-lg"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            opacity: spring.opacity,
            boxShadow:
              '0 0 20px var(--color-vibrant-orange), 0 0 40px rgba(255,87,34,0.4)',
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatedDiv
        ref={tooltipRef}
        className="pointer-events-none fixed z-[1001] w-[calc(100vw-24px)] max-w-[320px]"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: spring.scale.to(
            (s) => `translate(-50%, -50%) scale(${s}) translateY(${spring.y.get()}px)`
          ),
          opacity: spring.opacity,
        }}
      >
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="pointer-events-auto relative rounded-2xl border border-[var(--color-vibrant-orange)] bg-[var(--color-dark-forest)]/95 p-4 shadow-2xl backdrop-blur-md"
        >
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-2 top-2 flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full text-[var(--color-beige-white)]/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t('common.close', 'Close tip')}
          >
            ×
          </button>
          {/* Arrow */}
          {targetRect && (
            <div style={getArrowStyle()}>
              <HintArrow direction={hint.arrowDirection} />
            </div>
          )}

          {/* Content */}
          <h3 className="mb-1.5 pr-8 text-base font-bold text-[var(--color-vibrant-orange)]">
            {hint.title}
          </h3>
          <p className="text-sm text-[var(--color-beige-white)] mb-3 leading-relaxed">
            {hint.content}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onDisableHints}
              className="text-xs text-[var(--color-metallic-gold)] hover:text-[var(--color-golden-yellow)] transition-colors opacity-60 hover:opacity-100"
            >
              {t('progressiveHints.dontShow', "Don't show tips")}
            </button>

            <div className="flex items-center gap-3">
              <HintProgress current={currentIndex} total={totalHints} />
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                           text-[var(--color-beige-white)] text-sm font-bold rounded-lg
                           transition-all hover:scale-105 active:scale-95
                           min-h-[36px] min-w-[60px]"
              >
                {t('progressiveHints.gotIt', 'Got it')}
              </button>
            </div>
          </div>
        </div>
      </AnimatedDiv>
    </>,
    document.body
  )
}

export default ProgressiveHintOverlay
