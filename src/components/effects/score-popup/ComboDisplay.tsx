/**
 * ComboDisplay Component
 *
 * Shows escalating combo counter with effects.
 */

import React, { useState, useEffect } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useSettingsStore } from '../../../stores/settingsStore'
import { SPRINGS, ANIMATION_COLORS } from '../../../animations/constants'
import { colors } from '../../../styles/theme'
import type { ComboDisplayProps } from './types'

export type { ComboDisplayProps }

/**
 * ComboDisplay component
 * Shows escalating combo counter with effects
 */
export const ComboDisplay: React.FC<ComboDisplayProps> = ({
  combo,
  maxCombo = 10,
  position = { x: 85, y: 20 },
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const [prevCombo, setPrevCombo] = useState(combo)

  // Scale and glow intensity based on combo
  const intensity = Math.min(combo / maxCombo, 1)
  const scale = 1 + intensity * 0.5
  const glowSize = 10 + intensity * 20

  // Get combo color
  const getComboColor = () => {
    if (combo >= 7) return ANIMATION_COLORS.orange
    if (combo >= 4) return ANIMATION_COLORS.gold
    return colors.beigeWhite
  }

  const spring = useSpring({
    scale: combo > prevCombo ? scale * 1.2 : scale,
    glowIntensity: intensity,
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
    onRest: () => setPrevCombo(combo),
  })

  // Reset to normal scale after pop
  useEffect(() => {
    if (combo > prevCombo && !reducedMotion) {
      const timeout = setTimeout(() => {
        setPrevCombo(combo)
      }, 200)
      return () => clearTimeout(timeout)
    }
  }, [combo, prevCombo, reducedMotion])

  if (combo <= 0) return null

  return (
    <animated.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        right: `${100 - position.x}%`,
        top: `${position.y}%`,
        transform: spring.scale.to((s) => `scale(${s})`),
        textAlign: 'right',
      }}
    >
      <animated.div
        style={{
          color: getComboColor(),
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: spring.glowIntensity.to(
            (i) => `0 0 ${glowSize * i}px ${getComboColor()}`
          ),
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        <div style={{ fontSize: '14px', opacity: 0.8 }}>COMBO</div>
        <div style={{ fontSize: '36px' }}>x{combo}</div>
      </animated.div>
    </animated.div>
  )
}

export default ComboDisplay
