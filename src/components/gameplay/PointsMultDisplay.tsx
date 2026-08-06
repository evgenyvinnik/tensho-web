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
    <div className="flex items-center justify-center gap-2">
      {/* Points section */}
      <GlowEffect variant="blue" intensity={isAnimating ? 0.8 : 0.3} pulsing={isAnimating}>
        <div className="flex items-center gap-1 px-3 py-1 bg-blue-900/60 rounded-lg border border-blue-500">
          <span className="text-xs text-blue-300 font-medium">POINTS</span>
          <animated.span className="text-lg font-bold text-blue-400 font-mono">
            {pointsSpring.value.to((v) => Math.floor(v).toLocaleString())}
          </animated.span>
        </div>
      </GlowEffect>

      {/* Multiplication symbol */}
      <span className="text-2xl font-bold text-[var(--color-golden-yellow)]">×</span>

      {/* Mult section */}
      <GlowEffect variant="red" intensity={isAnimating ? 0.8 : 0.3} pulsing={isAnimating}>
        <div className="flex items-center gap-1 px-3 py-1 bg-red-900/60 rounded-lg border border-red-500">
          <span className="text-xs text-red-300 font-medium">MULT</span>
          <animated.span className="text-lg font-bold text-red-400 font-mono">
            {multSpring.value.to((v) => v.toFixed(2))}
          </animated.span>
        </div>
      </GlowEffect>

      {/* Equals symbol */}
      <span className="text-2xl font-bold text-[var(--color-golden-yellow)]">=</span>

      {/* Result section */}
      <GlowEffect variant="gold" intensity={isAnimating ? 1 : 0.4} pulsing={isAnimating}>
        <animated.span className="text-xl font-bold text-[var(--color-golden-yellow)] font-mono">
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
