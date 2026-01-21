/**
 * ConfettiBurst Component
 *
 * Specialized confetti particle effect.
 */

import React from 'react'
import { DURATIONS } from '../../../animations/constants'
import { ParticleEffect } from './ParticleEffect'
import type { ConfettiBurstProps } from './types'

export type { ConfettiBurstProps }

/**
 * ConfettiBurst component
 * Specialized confetti particle effect
 */
export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
  count = 50,
  origin = { x: 50, y: 50 },
  duration = DURATIONS.extended,
  isActive = true,
  colors,
  onComplete,
  className = '',
}) => {
  return (
    <ParticleEffect
      type="confetti"
      count={count}
      origin={origin}
      duration={duration}
      spread={200}
      gravity={0.8}
      colors={colors}
      isActive={isActive}
      onComplete={onComplete}
      className={className}
    />
  )
}

export default ConfettiBurst
