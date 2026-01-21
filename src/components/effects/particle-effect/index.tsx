/**
 * Particle Effect Components
 *
 * Renders particle effects for various game events.
 */

// Types
export type {
  ParticleType,
  Position,
  ParticleEffectProps,
  Particle,
  ParticleShape,
  ConfettiBurstProps,
  StarBurstProps,
  SparkleTrailProps,
  GoldRainProps,
  UseParticleEffectReturn,
} from './types'

// Helpers
export {
  getDefaultColor,
  getDefaultColors,
  getParticleShape,
  generateParticles,
  adjustColor,
} from './helpers'

// Components
export { ParticleEffect, default } from './ParticleEffect'
export { ParticleShape as ParticleShapeComponent } from './ParticleShape'
export { ConfettiBurst } from './ConfettiBurst'
export { StarBurst } from './StarBurst'
export { SparkleTrail } from './SparkleTrail'
export { GoldRain } from './GoldRain'

// Hooks
export { useParticleEffect } from './useParticleEffect'
