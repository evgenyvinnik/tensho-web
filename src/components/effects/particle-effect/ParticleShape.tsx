/**
 * ParticleShape Component
 *
 * Renders different particle shapes for the particle effect system.
 */

import React from 'react'
import { adjustColor } from './helpers'
import type { ParticleShape as ParticleShapeType } from './types'

export interface ParticleShapeProps {
  shape: ParticleShapeType
  color: string
  size: number
}

/**
 * ParticleShape component
 * Renders different shapes based on type
 */
export const ParticleShape: React.FC<ParticleShapeProps> = ({ shape, color, size }) => {
  switch (shape) {
    case 'circle':
      return (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${color}, ${adjustColor(color, -30)})`,
            boxShadow: `0 0 ${size / 2}px ${color}`,
          }}
        />
      )
    case 'square':
      return (
        <div
          style={{
            width: size,
            height: size / 2,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      )
    case 'diamond':
      return (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            transform: 'rotate(45deg)',
            boxShadow: `0 0 ${size / 2}px ${color}`,
          }}
        />
      )
    case 'petal':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path
            d="M10 0 C12 4, 16 4, 20 10 C16 16, 12 16, 10 20 C8 16, 4 16, 0 10 C4 4, 8 4, 10 0"
            fill={color}
            opacity={0.8}
          />
        </svg>
      )
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path
            d="M10 0 L11.5 7 L20 7.5 L13 12 L15 20 L10 15 L5 20 L7 12 L0 7.5 L8.5 7 Z"
            fill={color}
            style={{ filter: `drop-shadow(0 0 ${size / 4}px ${color})` }}
          />
        </svg>
      )
  }
}

export default ParticleShape
