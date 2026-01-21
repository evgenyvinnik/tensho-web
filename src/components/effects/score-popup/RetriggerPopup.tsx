/**
 * RetriggerPopup Component
 *
 * Shows retrigger effect with pulse animation.
 */

import React, { useState, useEffect } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useSettingsStore } from '../../../stores/settingsStore'
import { DURATIONS, ANIMATION_COLORS, ANIMATION_Z_INDEX } from '../../../animations/constants'
import type { RetriggerPopupProps } from './types'

export type { RetriggerPopupProps }

/**
 * RetriggerPopup component
 * Shows retrigger effect with pulse animation
 */
export const RetriggerPopup: React.FC<RetriggerPopupProps> = ({
  count,
  position = { x: 50, y: 50 },
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const [pulseCount, setPulseCount] = useState(0)

  // Pulse animation for each retrigger
  const spring = useSpring({
    loop: pulseCount < count,
    from: { scale: 1, opacity: 1 },
    to: async (next) => {
      await next({ scale: 1.3, opacity: 0.8 })
      await next({ scale: 1, opacity: 1 })
      setPulseCount((p) => p + 1)
    },
    config: { tension: 300, friction: 10 },
    immediate: reducedMotion,
    onRest: () => {
      if (pulseCount >= count) {
        setTimeout(() => onComplete?.(), DURATIONS.fast)
      }
    },
  })

  useEffect(() => {
    if (reducedMotion) {
      setPulseCount(count)
      onComplete?.()
    }
  }, [reducedMotion, count, onComplete])

  return (
    <animated.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: spring.scale.to((s) => `translate(-50%, -50%) scale(${s})`),
        opacity: spring.opacity,
        zIndex: ANIMATION_Z_INDEX.effects,
      }}
    >
      <div
        style={{
          color: ANIMATION_COLORS.purple,
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: `0 0 15px ${ANIMATION_COLORS.purple}`,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        Retrigger x{count}
      </div>
    </animated.div>
  )
}

export default RetriggerPopup
