/**
 * PointsMultDisplay Component for Tensho Mahjong Roguelike
 *
 * Balatro-style "Points × Mult = Total" scoring visualization.
 * Features animated counters and glow effects.
 *
 * @module components/gameplay/PointsMultDisplay
 */

import { useState } from 'react'
import { useSpring } from '@react-spring/web'
import { GlowEffect } from '../effects/GlowEffect'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useTranslation } from 'react-i18next'
import { scoreMultiplier, scoreNumber } from '../../utils/scoreNumber'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for PointsMultDisplay
 */
export interface PointsMultDisplayProps {
  /** Base points value */
  points: number
  /** Multiplier value */
  mult: number
  adjustment?: number
  /** Already settled by the engine; zero is a valid paid result. */
  total?: number
  /** Whether the score is currently animating */
  isAnimating?: boolean
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Points × Mult scoring visualization component.
 *
 * Displays the scoring formula in a visual format:
 * [POINTS: XXX] × [MULT: X.XX] = [TOTAL]
 *
 * Features:
 * - Animated number counters using react-spring
 * - Color-coded sections (blue for points, red for mult, gold for result)
 * - Glow effects that intensify during scoring animations
 * - Pulsing effect when isAnimating is true
 */
export function PointsMultDisplay({
  points,
  mult,
  adjustment = 0,
  total = Math.floor(points * mult) + adjustment,
  isAnimating = false,
}: PointsMultDisplayProps) {
  const reducedMotion = useReducedMotion()
  const { t, i18n } = useTranslation()
  const [display, setDisplay] = useState({ points: 0, mult: 1, total: 0 })
  // Animate numbers, then format them in React. Animated string interpolation
  // can strip decimal zeroes from a settled "1.00" or reinterpret locale text.
  useSpring({
    to: { points, mult, total },
    from: { points: 0, mult: 1, total: 0 },
    config: { tension: 120, friction: 14, clamp: true },
    immediate: reducedMotion,
    onChange: ({ value }) =>
      setDisplay({
        points: value.points,
        mult: value.mult,
        total: value.total,
      }),
  })
  const shown = reducedMotion ? { points, mult, total } : display

  return (
    <div
      data-score-equation
      className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 [overflow-wrap:anywhere] sm:gap-2"
    >
      {/* Points section */}
      <GlowEffect
        className="min-w-0 max-w-full"
        variant="blue"
        intensity={isAnimating ? 0.8 : 0.3}
        pulsing={isAnimating && !reducedMotion}
      >
        <div className="min-w-0 rounded-lg border border-blue-500 bg-blue-900/60 px-1 py-0.5 sm:px-3 sm:py-1">
          <span className="hidden text-xs font-medium text-blue-300 sm:block">
            {t('scoring.subtotal')}
          </span>
          <span
            data-score-points
            title={scoreNumber(points, i18n.language).exact}
            aria-label={scoreNumber(points, i18n.language).exact}
            className="block font-mono text-sm font-bold text-blue-400 sm:text-base"
          >
            {
              scoreNumber(
                reducedMotion || shown.points === points
                  ? points
                  : Math.floor(shown.points),
                i18n.language
              ).display
            }
          </span>
        </div>
      </GlowEffect>

      {/* Multiplication symbol */}
      <span className="text-lg font-bold text-[var(--color-golden-yellow)] sm:text-2xl">
        ×
      </span>

      {/* Mult section */}
      <GlowEffect
        className="min-w-0 max-w-full"
        variant="red"
        intensity={isAnimating ? 0.8 : 0.3}
        pulsing={isAnimating && !reducedMotion}
      >
        <div className="min-w-0 rounded-lg border border-red-500 bg-red-900/60 px-1 py-0.5 sm:px-3 sm:py-1">
          <span className="hidden text-xs font-medium text-red-300 sm:block">
            {t('scoring.totalMultiplier')}
          </span>
          <span
            data-score-mult
            title={scoreMultiplier(mult, i18n.language).exact}
            aria-label={scoreMultiplier(mult, i18n.language).exact}
            className="block font-mono text-sm font-bold text-red-400 sm:text-base"
          >
            {scoreMultiplier(shown.mult, i18n.language).display}
          </span>
        </div>
      </GlowEffect>

      {adjustment !== 0 && (
        <div
          data-score-adjustment
          className="col-span-3 min-w-0 text-center text-sm text-[var(--color-beige-white)]"
        >
          <span>
            {adjustment < 0 ? '−' : '+'}
            {scoreNumber(Math.abs(adjustment), i18n.language).display}
          </span>
          <span className="block text-[10px] opacity-65">
            {t('scoring.adjustments')}
          </span>
        </div>
      )}

      {/* Equals symbol */}
      <span className="text-lg font-bold text-[var(--color-golden-yellow)] sm:text-2xl">
        =
      </span>

      {/* Result section */}
      <GlowEffect
        className="min-w-0 max-w-full"
        variant="gold"
        intensity={isAnimating ? 1 : 0.4}
        pulsing={isAnimating && !reducedMotion}
      >
        <span
          data-score-result
          title={scoreNumber(total, i18n.language).exact}
          aria-label={scoreNumber(total, i18n.language).exact}
          className="block font-mono text-lg font-bold text-[var(--color-golden-yellow)] sm:text-xl"
        >
          {
            scoreNumber(
              reducedMotion ? total : Math.floor(shown.total),
              i18n.language
            ).display
          }
        </span>
      </GlowEffect>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PointsMultDisplay
