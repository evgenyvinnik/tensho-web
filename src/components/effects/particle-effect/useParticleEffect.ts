/**
 * useParticleEffect Hook
 *
 * Hook for managing particle effects with VFX system integration.
 */

import React, { useState, useCallback, useEffect } from 'react'
import { DURATIONS } from '../../../animations/constants'
import { vfxSystem } from '../../../systems/VFXSystem'
import { ParticleEffect } from './ParticleEffect'
import type { ParticleEffectProps, Position, UseParticleEffectReturn } from './types'

/**
 * Hook for managing particle effects
 */
export function useParticleEffect(): UseParticleEffectReturn {
  const [effects, setEffects] = useState<Array<ParticleEffectProps & { id: string }>>([])

  const emit = useCallback((props: Omit<ParticleEffectProps, 'onComplete'>) => {
    const id = `particle-${Date.now()}-${Math.random()}`
    setEffects((prev) => [...prev, { ...props, id, isActive: true }])
  }, [])

  // Subscribe to VFX system
  useEffect(() => {
    const unsubscribe = vfxSystem.onParticles((config) => {
      emit({
        type: config.type,
        count: config.count,
        origin: config.origin,
        spread: config.spread,
        colors: config.colors,
        duration: config.duration,
        gravity: config.gravity,
      })
    })
    return unsubscribe
  }, [emit])

  const handleComplete = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const ParticleContainer: React.FC = useCallback(
    () =>
      React.createElement(
        React.Fragment,
        null,
        effects.map((effect) =>
          React.createElement(ParticleEffect, {
            key: effect.id,
            ...effect,
            onComplete: () => handleComplete(effect.id),
          })
        )
      ),
    [effects, handleComplete]
  )

  // Preset emitters
  const emitConfetti = useCallback(
    (origin?: Position) => {
      emit({
        type: 'confetti',
        count: 50,
        origin: origin ?? { x: 50, y: 50 },
        spread: 200,
        gravity: 0.8,
        duration: DURATIONS.extended,
      })
    },
    [emit]
  )

  const emitStars = useCallback(
    (origin?: Position) => {
      emit({
        type: 'star',
        count: 30,
        origin: origin ?? { x: 50, y: 50 },
        spread: 150,
        gravity: 0.3,
        duration: DURATIONS.extended,
      })
    },
    [emit]
  )

  const emitGold = useCallback(
    (origin?: Position) => {
      emit({
        type: 'gold',
        count: 20,
        origin: origin ?? { x: 50, y: 30 },
        spread: 100,
        gravity: 0.8,
        duration: DURATIONS.dramatic,
      })
    },
    [emit]
  )

  const emitFlowers = useCallback(
    (origin?: Position) => {
      emit({
        type: 'flower',
        count: 15,
        origin: origin ?? { x: 50, y: 50 },
        spread: 80,
        gravity: 0.3,
        duration: DURATIONS.slow,
      })
    },
    [emit]
  )

  const emitSparkles = useCallback(
    (origin?: Position) => {
      emit({
        type: 'sparkle',
        count: 25,
        origin: origin ?? { x: 50, y: 50 },
        spread: 120,
        gravity: 0.4,
        duration: DURATIONS.normal,
      })
    },
    [emit]
  )

  return {
    emit,
    emitConfetti,
    emitStars,
    emitGold,
    emitFlowers,
    emitSparkles,
    ParticleContainer,
    activeCount: effects.length,
  }
}

export default useParticleEffect
