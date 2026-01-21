/**
 * StackingScorePopup Component
 *
 * Shows staggered score items with trail animation.
 */

import React from 'react'
import { useTrail, animated } from '@react-spring/web'
import { useSettingsStore } from '../../../stores/settingsStore'
import { SPRINGS, ANIMATION_COLORS, ANIMATION_Z_INDEX } from '../../../animations/constants'
import { colors } from '../../../styles/theme'
import type { StackingScorePopupProps } from './types'

export type { StackingScorePopupProps }

/**
 * StackingScorePopup component
 * Shows staggered score items with trail animation
 */
export const StackingScorePopup: React.FC<StackingScorePopupProps> = ({
  items,
  position = { x: 50, y: 50 },
  staggerDelay = 200,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)

  // Trail animation for staggered entry
  const trail = useTrail(items.length, {
    from: {
      opacity: 0,
      y: 20,
      scale: 0.5,
    },
    to: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
    delay: (index: number) => index * staggerDelay,
    onRest: (_result, _spring, itemIndex) => {
      if (itemIndex === items.length - 1) {
        onComplete?.()
      }
    },
  })

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: ANIMATION_Z_INDEX.effects,
      }}
    >
      {trail.map((style, index) => {
        const item = items[index]
        return (
          <animated.div
            key={index}
            className="text-center mb-2"
            style={{
              opacity: style.opacity,
              transform: style.y.to(
                (y) => `translateY(${y}px) scale(${style.scale.get()})`
              ),
            }}
          >
            <div
              className="text-sm font-medium"
              style={{ color: colors.beigeWhite, opacity: 0.8 }}
            >
              {item.label}
            </div>
            <div
              className="text-xl font-bold"
              style={{
                color: ANIMATION_COLORS.gold,
                textShadow: `0 0 8px ${ANIMATION_COLORS.gold}`,
              }}
            >
              +{item.points.toLocaleString()}
              {item.multiplier && item.multiplier > 1 && (
                <span
                  className="text-sm ml-1"
                  style={{ color: ANIMATION_COLORS.orange }}
                >
                  x{item.multiplier.toFixed(1)}
                </span>
              )}
            </div>
          </animated.div>
        )
      })}
    </div>
  )
}

export default StackingScorePopup
