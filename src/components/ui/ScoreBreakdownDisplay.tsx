/**
 * ScoreBreakdownDisplay Component
 *
 * Displays a detailed breakdown of the score calculation.
 * Shows base points, multipliers, bonuses, and final score with animations.
 */

import React, { useState, useEffect } from 'react'
import { useSpring, animated, useTrail } from '@react-spring/web'
import { ScoreBreakdown } from '../../systems/types'

export interface ScoreBreakdownDisplayProps {
  breakdown: ScoreBreakdown
  isAnimated?: boolean
  variant?: 'full' | 'compact' | 'inline'
  showGold?: boolean
  className?: string
}

/**
 * ScoreBreakdownDisplay - Animated score breakdown visualization
 */
export function ScoreBreakdownDisplay({
  breakdown,
  isAnimated = true,
  variant = 'full',
  showGold = true,
  className = '',
}: ScoreBreakdownDisplayProps) {
  const [displayScore, setDisplayScore] = useState(0)

  // Animate the final score counter
  const scoreSpring = useSpring({
    score: breakdown.finalScore,
    from: { score: 0 },
    config: { tension: 50, friction: 20 },
    onFrame: ({ score }: { score: number }) => {
      if (isAnimated) {
        setDisplayScore(Math.floor(score))
      }
    },
  })

  useEffect(() => {
    if (!isAnimated) {
      setDisplayScore(breakdown.finalScore)
    }
  }, [breakdown.finalScore, isAnimated])

  if (variant === 'inline') {
    return <InlineBreakdown breakdown={breakdown} className={className} />
  }

  if (variant === 'compact') {
    return (
      <CompactBreakdown
        breakdown={breakdown}
        displayScore={displayScore}
        className={className}
      />
    )
  }

  return (
    <FullBreakdown
      breakdown={breakdown}
      displayScore={displayScore}
      isAnimated={isAnimated}
      showGold={showGold}
      className={className}
    />
  )
}

/**
 * Full score breakdown with all details
 */
interface FullBreakdownProps {
  breakdown: ScoreBreakdown
  displayScore: number
  isAnimated: boolean
  showGold: boolean
  className: string
}

function FullBreakdown({
  breakdown,
  displayScore,
  isAnimated,
  showGold,
  className,
}: FullBreakdownProps) {
  const rows = [
    { label: 'Tile Points', value: breakdown.tilePoints, icon: '🀄' },
    { label: 'Structure Points', value: breakdown.structurePoints, icon: '🏗️' },
    { label: 'Additive Bonus', value: breakdown.additiveBonus, icon: '➕', show: breakdown.additiveBonus > 0 },
  ]

  const multipliers = [
    { label: 'Yaku', value: breakdown.yakuMultiplier, icon: '📜', show: breakdown.yakuMultiplier !== 1 },
    { label: 'Decree', value: breakdown.decreeMultiplier, icon: '⚖️', show: breakdown.decreeMultiplier !== 1 },
    { label: 'Flower', value: breakdown.flowerMultiplier, icon: '🌸', show: breakdown.flowerMultiplier !== 1 },
    { label: 'Season', value: breakdown.seasonMultiplier, icon: '🍂', show: breakdown.seasonMultiplier !== 1 },
  ]

  const visibleRows = rows.filter((r) => r.show !== false)
  const visibleMultipliers = multipliers.filter((m) => m.show !== false)

  const trail = useTrail(visibleRows.length + visibleMultipliers.length + 1, {
    opacity: isAnimated ? 1 : 1,
    x: isAnimated ? 0 : 0,
    from: { opacity: 0, x: -20 },
    config: { tension: 200, friction: 20 },
  })

  let trailIndex = 0

  return (
    <div className={`bg-[var(--color-dark-forest)] rounded-lg p-4 ${className}`}>
      {/* Base Points Section */}
      <div className="border-b border-[var(--color-forest-green)] pb-3 mb-3">
        <h3 className="text-sm font-bold text-[var(--color-golden-yellow)] mb-2">
          Base Points
        </h3>
        <div className="space-y-1">
          {visibleRows.map((row) => (
            <animated.div
              key={row.label}
              style={trail[trailIndex++]}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-[var(--color-beige-white)] opacity-80">
                {row.icon} {row.label}
              </span>
              <span className="text-[var(--color-beige-white)] font-mono">
                +{row.value.toLocaleString()}
              </span>
            </animated.div>
          ))}
        </div>
        <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-[var(--color-forest-green)]">
          <span className="text-[var(--color-beige-white)] font-bold">Subtotal</span>
          <span className="text-[var(--color-golden-yellow)] font-mono font-bold">
            {breakdown.basePoints.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Multipliers Section */}
      {visibleMultipliers.length > 0 && (
        <div className="border-b border-[var(--color-forest-green)] pb-3 mb-3">
          <h3 className="text-sm font-bold text-[var(--color-golden-yellow)] mb-2">
            Multipliers
          </h3>
          <div className="space-y-1">
            {visibleMultipliers.map((mult) => (
              <animated.div
                key={mult.label}
                style={trail[trailIndex++]}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-[var(--color-beige-white)] opacity-80">
                  {mult.icon} {mult.label}
                </span>
                <span
                  className={`font-mono font-bold ${
                    mult.value > 1
                      ? 'text-green-400'
                      : mult.value < 1
                        ? 'text-red-400'
                        : 'text-[var(--color-beige-white)]'
                  }`}
                >
                  ×{mult.value.toFixed(2)}
                </span>
              </animated.div>
            ))}
          </div>
          <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-[var(--color-forest-green)]">
            <span className="text-[var(--color-beige-white)] font-bold">Total Multiplier</span>
            <span className="text-[var(--color-golden-yellow)] font-mono font-bold">
              ×{(
                breakdown.yakuMultiplier *
                breakdown.decreeMultiplier *
                breakdown.flowerMultiplier *
                breakdown.seasonMultiplier
              ).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Final Score */}
      <animated.div
        style={trail[trailIndex]}
        className="flex justify-between items-center"
      >
        <span className="text-lg font-bold text-[var(--color-beige-white)]">
          Final Score
        </span>
        <span className="text-2xl font-bold text-[var(--color-golden-yellow)] font-mono animate-pulse-glow">
          {displayScore.toLocaleString()}
        </span>
      </animated.div>

      {/* Gold bonus */}
      {showGold && breakdown.bonusGold > 0 && (
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--color-forest-green)]">
          <span className="text-sm text-[var(--color-beige-white)] opacity-80">
            💰 Gold Earned
          </span>
          <span className="text-sm text-[var(--color-golden-yellow)] font-mono">
            +¥{breakdown.bonusGold}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Compact score breakdown
 */
interface CompactBreakdownProps {
  breakdown: ScoreBreakdown
  displayScore: number
  className: string
}

function CompactBreakdown({ breakdown, displayScore, className }: CompactBreakdownProps) {
  const totalMult =
    breakdown.yakuMultiplier *
    breakdown.decreeMultiplier *
    breakdown.flowerMultiplier *
    breakdown.seasonMultiplier

  return (
    <div
      className={`flex items-center gap-4 bg-[var(--color-dark-forest)] rounded-lg px-4 py-2 ${className}`}
    >
      {/* Base */}
      <div className="text-center">
        <p className="text-xs text-[var(--color-beige-white)] opacity-60">BASE</p>
        <p className="text-sm text-[var(--color-beige-white)] font-mono">
          {breakdown.basePoints.toLocaleString()}
        </p>
      </div>

      {/* Multiply sign */}
      <span className="text-[var(--color-golden-yellow)] text-lg">×</span>

      {/* Multiplier */}
      <div className="text-center">
        <p className="text-xs text-[var(--color-beige-white)] opacity-60">MULT</p>
        <p className="text-sm text-green-400 font-mono font-bold">
          {totalMult.toFixed(2)}
        </p>
      </div>

      {/* Equals sign */}
      <span className="text-[var(--color-golden-yellow)] text-lg">=</span>

      {/* Final */}
      <div className="text-center">
        <p className="text-xs text-[var(--color-beige-white)] opacity-60">SCORE</p>
        <p className="text-lg text-[var(--color-golden-yellow)] font-mono font-bold">
          {displayScore.toLocaleString()}
        </p>
      </div>
    </div>
  )
}

/**
 * Inline score breakdown (single line)
 */
interface InlineBreakdownProps {
  breakdown: ScoreBreakdown
  className: string
}

function InlineBreakdown({ breakdown, className }: InlineBreakdownProps) {
  const totalMult =
    breakdown.yakuMultiplier *
    breakdown.decreeMultiplier *
    breakdown.flowerMultiplier *
    breakdown.seasonMultiplier

  return (
    <span className={`font-mono text-sm ${className}`}>
      <span className="text-[var(--color-beige-white)]">
        {breakdown.basePoints.toLocaleString()}
      </span>
      <span className="text-[var(--color-golden-yellow)] mx-1">×</span>
      <span className="text-green-400">{totalMult.toFixed(2)}</span>
      <span className="text-[var(--color-golden-yellow)] mx-1">=</span>
      <span className="text-[var(--color-golden-yellow)] font-bold">
        {breakdown.finalScore.toLocaleString()}
      </span>
    </span>
  )
}

/**
 * ScoreCounter - Animated score counter
 */
export interface ScoreCounterProps {
  score: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'gold' | 'target'
  animate?: boolean
  className?: string
}

export function ScoreCounter({
  score,
  size = 'md',
  variant = 'default',
  animate = true,
  className = '',
}: ScoreCounterProps) {
  const [displayValue, setDisplayValue] = useState(score)

  const spring = useSpring({
    value: score,
    config: { tension: 80, friction: 20 },
    onChange: ({ value }: { value: { value: number } }) => {
      if (animate) {
        setDisplayValue(Math.floor(value.value))
      }
    },
  })

  useEffect(() => {
    if (!animate) {
      setDisplayValue(score)
    }
  }, [score, animate])

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  }

  const variantClasses = {
    default: 'text-[var(--color-beige-white)]',
    gold: 'text-[var(--color-golden-yellow)]',
    target: 'text-[var(--color-vibrant-orange)]',
  }

  return (
    <animated.span
      className={`font-mono font-bold ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {displayValue.toLocaleString()}
    </animated.span>
  )
}

/**
 * ScoreComparison - Compare current score vs target
 */
export interface ScoreComparisonProps {
  currentScore: number
  targetScore: number
  variant?: 'horizontal' | 'vertical'
  className?: string
}

export function ScoreComparison({
  currentScore,
  targetScore,
  variant = 'horizontal',
  className = '',
}: ScoreComparisonProps) {
  const progress = Math.min((currentScore / targetScore) * 100, 100)
  const isComplete = currentScore >= targetScore

  const progressSpring = useSpring({
    width: `${progress}%`,
    config: { tension: 100, friction: 20 },
  })

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="text-sm text-[var(--color-beige-white)] opacity-60">TARGET</div>
        <ScoreCounter score={targetScore} size="lg" variant="target" />
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <animated.div
            className={`h-full rounded-full ${
              isComplete ? 'bg-green-500' : 'bg-[var(--color-vibrant-orange)]'
            }`}
            style={progressSpring}
          />
        </div>
        <div className="text-sm text-[var(--color-beige-white)] opacity-60">CURRENT</div>
        <ScoreCounter score={currentScore} size="lg" variant={isComplete ? 'gold' : 'default'} />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="text-center">
        <div className="text-xs text-[var(--color-beige-white)] opacity-60">SCORE</div>
        <ScoreCounter score={currentScore} size="md" variant={isComplete ? 'gold' : 'default'} />
      </div>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <animated.div
          className={`h-full rounded-full ${
            isComplete ? 'bg-green-500' : 'bg-[var(--color-vibrant-orange)]'
          }`}
          style={progressSpring}
        />
      </div>
      <div className="text-center">
        <div className="text-xs text-[var(--color-beige-white)] opacity-60">TARGET</div>
        <ScoreCounter score={targetScore} size="md" variant="target" />
      </div>
    </div>
  )
}

export default ScoreBreakdownDisplay
