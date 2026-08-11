/**
 * TotalScoreReveal Component
 *
 * Shows base points, multiplier, and final score with phased animation.
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'
import { useSettingsStore } from '../../../stores/settingsStore'
import { SPRINGS, DURATIONS, ANIMATION_COLORS } from '../../../animations/constants'
import { colors } from '../../../styles/theme'
import type { TotalScoreRevealProps } from './types'

export type { TotalScoreRevealProps }

/**
 * TotalScoreReveal component
 * Shows base points, multiplier, and final score with phased animation
 */
export const TotalScoreReveal: React.FC<TotalScoreRevealProps> = ({
  basePoints,
  totalMultiplier,
  finalScore,
  isVisible = true,
  onComplete,
  className = '',
}) => {
  const { t } = useTranslation()
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const [phase, setPhase] = useState<'base' | 'multiplier' | 'total'>('base')

  // Sequence through phases
  useEffect(() => {
    if (!isVisible || reducedMotion) {
      setPhase('total')
      return
    }

    const timers: NodeJS.Timeout[] = []

    timers.push(setTimeout(() => setPhase('multiplier'), DURATIONS.slow))
    timers.push(setTimeout(() => setPhase('total'), DURATIONS.slow * 2))
    timers.push(setTimeout(() => onComplete?.(), DURATIONS.slow * 3))

    return () => timers.forEach(clearTimeout)
  }, [isVisible, reducedMotion, onComplete])

  const baseSpring = useSpring({
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
  })

  const multiplierSpring = useSpring({
    from: { opacity: 0, x: -20 },
    to: {
      opacity: phase === 'multiplier' || phase === 'total' ? 1 : 0,
      x: phase === 'multiplier' || phase === 'total' ? 0 : -20,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
  })

  const totalSpring = useSpring({
    from: { opacity: 0, scale: 0.5 },
    to: {
      opacity: phase === 'total' ? 1 : 0,
      scale: phase === 'total' ? 1 : 0.5,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
  })

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`flex flex-col items-center gap-4 p-6 ${className}`}
      style={{
        background: `linear-gradient(to bottom, ${colors.darkForest}dd, ${colors.darkForest})`,
        borderRadius: '16px',
        border: `2px solid ${ANIMATION_COLORS.gold}`,
      }}
    >
      {/* Base points */}
      <animated.div
        className="text-center"
        style={{
          opacity: baseSpring.opacity,
          transform: baseSpring.scale.to((s) => `scale(${s})`),
        }}
      >
        <div
          className="text-sm"
          style={{ color: colors.beigeWhite, opacity: 0.7 }}
        >
          {t('scoring.basePoints', 'Base Points')}
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.beigeWhite }}>
          {basePoints.toLocaleString()}
        </div>
      </animated.div>

      {/* Multiplier */}
      <animated.div
        className="text-center"
        style={{
          opacity: multiplierSpring.opacity,
          transform: multiplierSpring.x.to((x) => `translateX(${x}px)`),
        }}
      >
        <div
          className="text-3xl font-bold"
          style={{ color: ANIMATION_COLORS.orange }}
        >
          x {totalMultiplier.toFixed(2)}
        </div>
      </animated.div>

      {/* Divider */}
      <div
        className="w-full h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${ANIMATION_COLORS.gold}, transparent)`,
        }}
      />

      {/* Final score */}
      <animated.div
        className="text-center"
        style={{
          opacity: totalSpring.opacity,
          transform: totalSpring.scale.to((s) => `scale(${s})`),
        }}
      >
        <div className="text-sm" style={{ color: ANIMATION_COLORS.gold }}>
          {t('scoring.totalScore', 'Total Score')}
        </div>
        <div
          className="text-4xl font-bold"
          style={{
            color: ANIMATION_COLORS.gold,
            textShadow: `0 0 20px ${ANIMATION_COLORS.gold}`,
          }}
        >
          {finalScore.toLocaleString()}
        </div>
      </animated.div>
    </div>
  )
}

export default TotalScoreReveal
