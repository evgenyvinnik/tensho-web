/**
 * ParticleEffect Component for Tensho Mahjong Roguelike
 *
 * Renders particle effects for various game events:
 * - Gold coins for earning gold
 * - Flower petals for flower collection
 * - Sparkles for yaku completion
 * - Confetti for round wins
 * - Stars for yakuman
 *
 * Enhanced with:
 * - Gravity simulation
 * - Configurable burst patterns
 * - Integration with VFX system
 *
 * This file re-exports from the particle-effect folder for backwards compatibility.
 */

// Re-export everything from the modular structure
export {
  ParticleEffect,
  ParticleShapeComponent,
  ConfettiBurst,
  StarBurst,
  SparkleTrail,
  GoldRain,
  useParticleEffect,
  getDefaultColor,
  getDefaultColors,
  getParticleShape,
  generateParticles,
  adjustColor,
  default,
} from './particle-effect'

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
} from './particle-effect'
