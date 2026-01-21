/**
 * SparkleTrail Component
 *
 * Sparkle effect that follows a path.
 */

import React, { useState } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useSettingsStore } from '../../../stores/settingsStore'
import { DURATIONS, ANIMATION_COLORS, ANIMATION_Z_INDEX } from '../../../animations/constants'
import type { SparkleTrailProps } from './types'

export type { SparkleTrailProps }

/**
 * SparkleTrail component
 * Sparkle effect that follows a path
 */
export const SparkleTrail: React.FC<SparkleTrailProps> = ({
  path = [
    { x: 20, y: 80 },
    { x: 50, y: 50 },
    { x: 80, y: 80 },
  ],
  duration = DURATIONS.slow,
  color = ANIMATION_COLORS.gold,
  isActive = true,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const [currentIndex, setCurrentIndex] = useState(0)

  const spring = useSpring({
    from: { x: path[0]?.x ?? 50, y: path[0]?.y ?? 50, opacity: 1 },
    to: path[currentIndex] ?? path[0],
    config: { duration: duration / path.length },
    onRest: () => {
      if (currentIndex < path.length - 1) {
        setCurrentIndex((i) => i + 1)
      } else {
        onComplete?.()
      }
    },
    immediate: reducedMotion,
  })

  if (!isActive || reducedMotion) return null

  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: ANIMATION_Z_INDEX.effects,
      }}
    >
      <animated.div
        style={{
          position: 'absolute',
          left: spring.x.to((x) => `${x}%`),
          top: spring.y.to((y) => `${y}%`),
          transform: 'translate(-50%, -50%)',
        }}
      >
        <svg width={16} height={16} viewBox="0 0 20 20">
          <path
            d="M10 0 L11 8 L20 10 L11 12 L10 20 L9 12 L0 10 L9 8 Z"
            fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
      </animated.div>
    </div>
  )
}

export default SparkleTrail
