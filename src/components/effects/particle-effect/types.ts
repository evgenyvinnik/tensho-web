/**
 * Particle effect types and interfaces
 */

export type ParticleType = 'gold' | 'flower' | 'sparkle' | 'confetti' | 'star'

export interface Position {
  x: number
  y: number
}

export interface ParticleEffectProps {
  /** Type of particle effect */
  type: ParticleType
  /** Number of particles to emit */
  count?: number
  /** Duration of the effect in milliseconds */
  duration?: number
  /** Spread radius in pixels */
  spread?: number
  /** Origin position (x, y) relative to container */
  origin?: Position
  /** Custom color (overrides type default) */
  color?: string
  /** Custom colors array (for confetti) */
  colors?: string[]
  /** Whether the effect is active */
  isActive?: boolean
  /** Gravity factor (0 = no gravity, 1 = normal) */
  gravity?: number
  /** Callback when animation completes */
  onComplete?: () => void
  /** Additional CSS class name */
  className?: string
}

export interface Particle {
  id: number
  x: number
  y: number
  vx: number // velocity x
  vy: number // velocity y
  rotation: number
  rotationSpeed: number
  size: number
  delay: number
  color: string
  shape: ParticleShape
}

export type ParticleShape = 'circle' | 'square' | 'diamond' | 'petal' | 'star'

export interface ConfettiBurstProps {
  /** Number of confetti pieces */
  count?: number
  /** Origin position (percentage) */
  origin?: Position
  /** Duration in ms */
  duration?: number
  /** Whether active */
  isActive?: boolean
  /** Colors to use */
  colors?: string[]
  /** Callback on complete */
  onComplete?: () => void
  /** Additional CSS class */
  className?: string
}

export interface StarBurstProps {
  /** Number of stars */
  count?: number
  /** Origin position (percentage) */
  origin?: Position
  /** Duration in ms */
  duration?: number
  /** Whether active */
  isActive?: boolean
  /** Callback on complete */
  onComplete?: () => void
  /** Additional CSS class */
  className?: string
}

export interface SparkleTrailProps {
  /** Path to follow (array of {x, y} percentages) */
  path?: Array<Position>
  /** Duration in ms */
  duration?: number
  /** Color */
  color?: string
  /** Whether active */
  isActive?: boolean
  /** Callback on complete */
  onComplete?: () => void
  /** Additional CSS class */
  className?: string
}

export interface GoldRainProps {
  /** Number of coins */
  count?: number
  /** Duration in ms */
  duration?: number
  /** Whether active */
  isActive?: boolean
  /** Callback on complete */
  onComplete?: () => void
  /** Additional CSS class */
  className?: string
}

export interface UseParticleEffectReturn {
  emit: (props: Omit<ParticleEffectProps, 'onComplete'>) => void
  emitConfetti: (origin?: Position) => void
  emitStars: (origin?: Position) => void
  emitGold: (origin?: Position) => void
  emitFlowers: (origin?: Position) => void
  emitSparkles: (origin?: Position) => void
  ParticleContainer: React.FC
  activeCount: number
}
