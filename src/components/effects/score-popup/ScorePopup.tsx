/**
 * ScorePopup Component
 *
 * Animated score popup that floats up and fades out.
 * Shows points earned with multipliers applied.
 */

import React, { useEffect, useRef, useState } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import {
  SPRINGS,
  DURATIONS,
  ANIMATION_COLORS,
  ANIMATION_Z_INDEX,
} from '../../../animations/constants'
import { colors } from '../../../styles/theme'
import type { ScorePopupProps } from './types'
import { useTranslation } from 'react-i18next'
import { scoreNumber } from '../../../utils/scoreNumber'

export type { ScorePopupProps }

/**
 * ScorePopup component
 * Shows animated score popup that floats and fades
 */
export const ScorePopup: React.FC<ScorePopupProps> = ({
  points,
  multiplier,
  position = { x: 50, y: 50 },
  displayDuration = DURATIONS.slow,
  onComplete,
  variant = 'default',
  className = '',
}) => {
  const reducedMotion = useReducedMotion()
  const { i18n } = useTranslation()
  const [isVisible, setIsVisible] = useState(true)
  const completionRef = useRef(onComplete)
  useEffect(() => {
    completionRef.current = onComplete
  }, [onComplete])
  useEffect(() => {
    if (!reducedMotion) return
    const timer = setTimeout(() => {
      setIsVisible(false)
      completionRef.current?.()
    }, displayDuration)
    return () => clearTimeout(timer)
  }, [reducedMotion, displayDuration])

  // Get color based on variant
  const getColor = () => {
    switch (variant) {
      case 'bonus':
        return ANIMATION_COLORS.gold
      case 'critical':
        return ANIMATION_COLORS.orange
      case 'chips':
        return ANIMATION_COLORS.blue
      case 'mult':
        return ANIMATION_COLORS.red
      default:
        return colors.beigeWhite
    }
  }

  // Main animation spring
  const spring = useSpring({
    from: {
      opacity: 1,
      y: 0,
      scale: reducedMotion ? 1 : 0.5,
    },
    to: reducedMotion
      ? { opacity: 1, y: 0, scale: 1 }
      : async (next) => {
          // Initial pop-in
          await next({ scale: 1.2, y: -10 })
          await next({ scale: 1, y: -20 })
          // Wait for display duration
          await new Promise((resolve) => setTimeout(resolve, displayDuration))
          // Fade out
          await next({ opacity: 0, y: -60, scale: 0.8 })
        },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
    onRest: () => {
      if (reducedMotion) return
      setIsVisible(false)
      onComplete?.()
    },
  })

  if (!isVisible) {
    return null
  }

  const displayText =
    multiplier && multiplier > 1
      ? `+${scoreNumber(points, i18n.language).display} x${multiplier.toFixed(1)}`
      : `+${scoreNumber(points, i18n.language).display}`

  return (
    <animated.div
      data-score-popup
      aria-label={
        multiplier && multiplier > 1
          ? `+${scoreNumber(points, i18n.language).exact} ×${multiplier}`
          : `+${scoreNumber(points, i18n.language).exact}`
      }
      className={`absolute pointer-events-none w-max max-w-[70%] text-center font-bold text-xl [overflow-wrap:anywhere] ${className}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: spring.y.to(
          (y) => `translate(-50%, ${y}px) scale(${spring.scale.get()})`
        ),
        opacity: spring.opacity,
        color: getColor(),
        textShadow: `0 0 10px ${getColor()}, 0 2px 4px rgba(0,0,0,0.5)`,
        zIndex: ANIMATION_Z_INDEX.effects,
        fontFamily: "'Noto Sans JP', sans-serif",
      }}
    >
      {displayText}
    </animated.div>
  )
}

export default ScorePopup
