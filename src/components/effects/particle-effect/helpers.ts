/**
 * Particle effect helper functions
 */

import { ANIMATION_COLORS } from '../../../animations/constants'
import type { ParticleType, Particle, ParticleShape, Position } from './types'

/**
 * Get default color for particle type
 */
export function getDefaultColor(type: ParticleType): string {
  switch (type) {
    case 'gold':
      return ANIMATION_COLORS.gold
    case 'flower':
      return '#FFB7C5' // Sakura pink
    case 'sparkle':
      return ANIMATION_COLORS.white
    case 'confetti':
      return ANIMATION_COLORS.orange
    case 'star':
      return ANIMATION_COLORS.gold
  }
}

/**
 * Get default colors for particle type
 */
export function getDefaultColors(type: ParticleType): string[] {
  switch (type) {
    case 'confetti':
      return [
        ANIMATION_COLORS.gold,
        ANIMATION_COLORS.orange,
        ANIMATION_COLORS.red,
        ANIMATION_COLORS.purple,
        ANIMATION_COLORS.blue,
        ANIMATION_COLORS.green,
      ]
    case 'star':
      return [ANIMATION_COLORS.gold, ANIMATION_COLORS.white, ANIMATION_COLORS.orange]
    default:
      return [getDefaultColor(type)]
  }
}

/**
 * Get particle shape for type
 */
export function getParticleShape(type: ParticleType): ParticleShape {
  switch (type) {
    case 'gold':
      return 'circle'
    case 'flower':
      return 'petal'
    case 'sparkle':
      return 'diamond'
    case 'confetti':
      return Math.random() > 0.5 ? 'square' : 'diamond'
    case 'star':
      return 'star'
  }
}

/**
 * Generate particle data
 */
export function generateParticles(
  count: number,
  spread: number,
  origin: Position,
  type: ParticleType,
  customColors?: string[]
): Particle[] {
  const colors = customColors || getDefaultColors(type)

  return Array.from({ length: count }, (_, i) => {
    // Random angle for burst direction
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 4

    return {
      id: i,
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed * (spread / 50),
      vy: Math.sin(angle) * speed * (spread / 50) - 2, // Initial upward bias
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      size: type === 'sparkle' ? 4 + Math.random() * 4 : 8 + Math.random() * 8,
      delay: i * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: getParticleShape(type),
    }
  })
}

/**
 * Adjust color brightness
 */
export function adjustColor(color: string, amount: number): string {
  // Simple hex color adjustment
  if (color.startsWith('#') && color.length === 7) {
    const r = Math.max(0, Math.min(255, parseInt(color.slice(1, 3), 16) + amount))
    const g = Math.max(0, Math.min(255, parseInt(color.slice(3, 5), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(color.slice(5, 7), 16) + amount))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
  return color
}
