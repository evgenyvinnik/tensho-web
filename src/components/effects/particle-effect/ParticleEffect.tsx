/**
 * ParticleEffect Component
 *
 * Renders particle effects for various game events.
 */

import React, { useMemo } from 'react'
import { useTrail, animated } from '@react-spring/web'
import { useSettingsStore } from '../../../stores/settingsStore'
import { DURATIONS, ANIMATION_Z_INDEX } from '../../../animations/constants'
import { generateParticles } from './helpers'
import { ParticleShape } from './ParticleShape'
import type { ParticleEffectProps } from './types'

export type { ParticleEffectProps }

/**
 * ParticleEffect component
 * Renders particle effects for various game events
 */
export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  type,
  count = 20,
  duration = DURATIONS.dramatic,
  spread = 100,
  origin = { x: 50, y: 50 },
  color,
  colors,
  isActive = true,
  gravity = 0.5,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)

  // Generate particles
  const particles = useMemo(
    () => generateParticles(count, spread, origin, type, colors || (color ? [color] : undefined)),
    [count, spread, origin.x, origin.y, type, color, colors]
  )

  // Create trail animation for all particles
  const trail = useTrail(particles.length, {
    from: {
      opacity: 1,
      progress: 0,
    },
    to: isActive
      ? {
          opacity: 0,
          progress: 1,
        }
      : {
          opacity: 0,
          progress: 0,
        },
    config: {
      tension: 120,
      friction: 14,
      duration: reducedMotion ? 0 : duration,
    },
    immediate: reducedMotion,
    onRest: (_, __, index) => {
      if (index === particles.length - 1) {
        onComplete?.()
      }
    },
  })

  // Don't render if reduced motion or not active
  if (reducedMotion || !isActive) {
    return null
  }

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
      {trail.map((style, index) => {
        const particle = particles[index]
        return (
          <animated.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: style.opacity,
              transform: style.progress.to((p) => {
                // Calculate position with physics
                const time = p * (duration / 1000)
                const x = particle.vx * time * 50
                const y = particle.vy * time * 50 + 0.5 * gravity * 100 * time * time
                const rotation = particle.rotation + particle.rotationSpeed * time * 100
                const scale = 1 - p * 0.5
                return `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`
              }),
            }}
          >
            <ParticleShape
              shape={particle.shape}
              color={particle.color}
              size={particle.size}
            />
          </animated.div>
        )
      })}
    </div>
  )
}

export default ParticleEffect
