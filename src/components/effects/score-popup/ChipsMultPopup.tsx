/**
 * ChipsMultPopup Component
 *
 * Shows points x mult scoring display with animated calculation.
 */

import React, { useState, useEffect } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useSettingsStore } from '../../../stores/settingsStore'
import { SPRINGS, DURATIONS, ANIMATION_COLORS, ANIMATION_Z_INDEX } from '../../../animations/constants'
import { colors } from '../../../styles/theme'
import type { ChipsMultPopupProps } from './types'

export type { ChipsMultPopupProps }

/**
 * ChipsMultPopup component
 * Shows points x mult scoring display
 */
export const ChipsMultPopup: React.FC<ChipsMultPopupProps> = ({
  chips,
  mult,
  position = { x: 50, y: 50 },
  animateCalc = true,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const [phase, setPhase] = useState<'chips' | 'mult' | 'result'>('chips')
  const [displayChips, setDisplayChips] = useState(0)
  const [displayMult, setDisplayMult] = useState(0)

  // Animate chips counting up
  const chipsSpring = useSpring({
    from: { value: 0, scale: 0.5, opacity: 0 },
    to: { value: chips, scale: 1, opacity: 1 },
    config: { duration: reducedMotion ? 0 : DURATIONS.normal },
    onChange: ({ value }) => {
      setDisplayChips(Math.floor(value.value))
    },
    onRest: () => {
      if (!reducedMotion) {
        setTimeout(() => setPhase('mult'), DURATIONS.fast)
      }
    },
  })

  // Animate mult appearing
  const multSpring = useSpring({
    from: { scale: 0, opacity: 0, x: -20 },
    to: {
      scale: phase === 'mult' || phase === 'result' ? 1 : 0,
      opacity: phase === 'mult' || phase === 'result' ? 1 : 0,
      x: phase === 'mult' || phase === 'result' ? 0 : -20,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
    onChange: ({ value }) => {
      if (phase === 'mult') {
        setDisplayMult(Math.floor(value.scale * mult))
      }
    },
    onRest: () => {
      if (phase === 'mult' && !reducedMotion) {
        setTimeout(() => setPhase('result'), DURATIONS.normal)
      }
    },
  })

  // Animate result
  const resultSpring = useSpring({
    from: { scale: 0, opacity: 0, y: 20 },
    to: {
      scale: phase === 'result' ? 1.2 : 0,
      opacity: phase === 'result' ? 1 : 0,
      y: phase === 'result' ? 0 : 20,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
    onRest: () => {
      if (phase === 'result') {
        setTimeout(() => onComplete?.(), DURATIONS.slow)
      }
    },
  })

  // Skip animation if reduced motion
  useEffect(() => {
    if (reducedMotion || !animateCalc) {
      setPhase('result')
      setDisplayChips(chips)
      setDisplayMult(mult)
    }
  }, [reducedMotion, animateCalc, chips, mult])

  const finalScore = chips * mult

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: ANIMATION_Z_INDEX.effects,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* Points x Mult row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Points */}
        <animated.div
          style={{
            transform: chipsSpring.scale.to((s) => `scale(${s})`),
            opacity: chipsSpring.opacity,
            color: ANIMATION_COLORS.blue,
            fontSize: '28px',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${ANIMATION_COLORS.blue}`,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {displayChips.toLocaleString()}
        </animated.div>

        {/* X symbol */}
        <animated.div
          style={{
            transform: multSpring.scale.to((s) => `scale(${s})`),
            opacity: multSpring.opacity,
            color: colors.beigeWhite,
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          x
        </animated.div>

        {/* Mult */}
        <animated.div
          style={{
            transform: multSpring.scale.to((s) => `scale(${s})`),
            opacity: multSpring.opacity,
            color: ANIMATION_COLORS.red,
            fontSize: '28px',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${ANIMATION_COLORS.red}`,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {displayMult.toFixed(1)}
        </animated.div>
      </div>

      {/* Result */}
      <animated.div
        style={{
          transform: resultSpring.scale.to((s) => `scale(${s}) translateY(${resultSpring.y.get()}px)`),
          opacity: resultSpring.opacity,
          color: ANIMATION_COLORS.gold,
          fontSize: '36px',
          fontWeight: 'bold',
          textShadow: `0 0 15px ${ANIMATION_COLORS.gold}, 0 0 30px ${ANIMATION_COLORS.gold}`,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        {finalScore.toLocaleString()}
      </animated.div>
    </div>
  )
}

export default ChipsMultPopup
