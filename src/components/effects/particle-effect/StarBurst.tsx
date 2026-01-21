/**
 * StarBurst Component
 *
 * Specialized star particle effect.
 */

import React from 'react'
import { DURATIONS } from '../../../animations/constants'
import { ParticleEffect } from './ParticleEffect'
import type { StarBurstProps } from './types'

export type { StarBurstProps }

/**
 * StarBurst component
 * Specialized star particle effect
 */
export const StarBurst: React.FC<StarBurstProps> = ({
  count = 30,
  origin = { x: 50, y: 50 },
  duration = DURATIONS.extended,
  isActive = true,
  onComplete,
  className = '',
}) => {
  return (
    <ParticleEffect
      type="star"
      count={count}
      origin={origin}
      duration={duration}
      spread={150}
      gravity={0.3}
      isActive={isActive}
      onComplete={onComplete}
      className={className}
    />
  )
}

export default StarBurst
