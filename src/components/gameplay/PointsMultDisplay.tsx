/**
 * PointsMultDisplay Component for Tensho Mahjong Roguelike
 *
 * Balatro-style "Points × Mult = Total" scoring visualization.
 * Features animated counters and glow effects.
 *
 * @module components/gameplay/PointsMultDisplay
 */

import { useSpring, animated } from '@react-spring/web'
import { GlowEffect } from '../effects/GlowEffect'

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
export function PointsMultDisplay({ points, mult, isAnimating = false }: PointsMultDisplayProps) {
  // Animated spring for points counter
  const pointsSpring = useSpring({
    value: points,
    from: { value: 0 },
    config: { tension: 120, friction: 14 },
  })

  // Animated spring for mult counter
  const multSpring = useSpring({
    value: mult,
    from: { value: 1 },
    config: { tension: 120, friction: 14 },
  })

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {/* Points section */}
      <GlowEffect variant="blue" intensity={isAnimating ? 0.8 : 0.3} pulsing={isAnimating}>
        <div className="flex items-center gap-1 rounded-lg border border-blue-500 bg-blue-900/60 px-2 py-0.5 sm:px-3 sm:py-1">
          <span className="hidden text-xs font-medium text-blue-300 sm:inline">POINTS</span>
          <animated.span className="font-mono text-base font-bold text-blue-400 sm:text-lg">
            {pointsSpring.value.to((v) => Math.floor(v).toLocaleString())}
          </animated.span>
        </div>
      </GlowEffect>

      {/* Multiplication symbol */}
      <span className="text-lg font-bold text-[var(--color-golden-yellow)] sm:text-2xl">×</span>

      {/* Mult section */}
      <GlowEffect variant="red" intensity={isAnimating ? 0.8 : 0.3} pulsing={isAnimating}>
        <div className="flex items-center gap-1 rounded-lg border border-red-500 bg-red-900/60 px-2 py-0.5 sm:px-3 sm:py-1">
          <span className="hidden text-xs font-medium text-red-300 sm:inline">MULT</span>
          <animated.span className="font-mono text-base font-bold text-red-400 sm:text-lg">
            {multSpring.value.to((v) => v.toFixed(2))}
          </animated.span>
        </div>
      </GlowEffect>

      {/* Equals symbol */}
      <span className="text-lg font-bold text-[var(--color-golden-yellow)] sm:text-2xl">=</span>

      {/* Result section */}
      <GlowEffect variant="gold" intensity={isAnimating ? 1 : 0.4} pulsing={isAnimating}>
        <animated.span className="font-mono text-lg font-bold text-[var(--color-golden-yellow)] sm:text-xl">
          {pointsSpring.value.to((p) => {
            const result = Math.floor(p * mult)
            return result.toLocaleString()
          })}
        </animated.span>
      </GlowEffect>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PointsMultDisplay
