/**
 * GoldRain Component
 *
 * Gold coin rain particle effect.
 */

import React from 'react'
import { DURATIONS } from '../../../animations/constants'
import { ParticleEffect } from './ParticleEffect'
import type { GoldRainProps } from './types'

export type { GoldRainProps }

/**
 * GoldRain component
 * Gold coin rain particle effect
 */
export const GoldRain: React.FC<GoldRainProps> = ({
  count = 20,
  duration = DURATIONS.dramatic,
  isActive = true,
  onComplete,
  className = '',
}) => {
  return (
    <ParticleEffect
      type="gold"
      count={count}
      origin={{ x: 50, y: 0 }}
      duration={duration}
      spread={300}
      gravity={1.2}
      isActive={isActive}
      onComplete={onComplete}
      className={className}
    />
  )
}

export default GoldRain
