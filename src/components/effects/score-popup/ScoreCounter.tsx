/**
 * ScoreCounter Component
 *
 * Animated score display that counts up/down when value changes.
 */

import React, { useState, useRef } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useSettingsStore } from '../../../stores/settingsStore'
import { DURATIONS, ANIMATION_COLORS } from '../../../animations/constants'
import { colors } from '../../../styles/theme'

export interface ScoreCounterProps {
  /** Current score value */
  value: number
  /** Whether to animate changes */
  animate?: boolean
  /** Duration of count animation in ms */
  duration?: number
  /** Label to display */
  label?: string
  /** Color of the score */
  color?: string
  /** Font size */
  fontSize?: number
  /** Additional CSS class name */
  className?: string
}

/**
 * ScoreCounter component
 * Animated score display that counts up/down when value changes
 */
export const ScoreCounter: React.FC<ScoreCounterProps> = ({
  value,
  animate = true,
  duration = DURATIONS.slow,
  label,
  color = ANIMATION_COLORS.gold,
  fontSize = 32,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const previousValueRef = useRef(value)
  const [displayValue, setDisplayValue] = useState(value)
  const [isPulsing, setIsPulsing] = useState(false)

  // Count up animation
  useSpring({
    from: { value: previousValueRef.current },
    to: { value },
    config: {
      duration: reducedMotion || !animate ? 0 : duration,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    },
    onChange: ({ value: springValue }) => {
      setDisplayValue(Math.floor(springValue.value))
    },
    onStart: () => {
      if (value !== previousValueRef.current && !reducedMotion) {
        setIsPulsing(true)
      }
    },
    onRest: () => {
      previousValueRef.current = value
      setIsPulsing(false)
    },
  })

  // Pulse animation on change
  const pulseSpring = useSpring({
    scale: isPulsing ? 1.1 : 1,
    config: { tension: 400, friction: 10 },
    immediate: reducedMotion,
  })

  return (
    <animated.div
      className={`text-center ${className}`}
      style={{
        transform: pulseSpring.scale.to((s) => `scale(${s})`),
      }}
    >
      {label && (
        <div
          style={{
            color: colors.beigeWhite,
            opacity: 0.7,
            fontSize: `${fontSize * 0.5}px`,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          color,
          fontSize: `${fontSize}px`,
          fontWeight: 'bold',
          textShadow: `0 0 10px ${color}`,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        {displayValue.toLocaleString()}
      </div>
    </animated.div>
  )
}

export default ScoreCounter
