/**
 * SVG Pattern Definitions
 *
 * Reusable pattern definitions for procedural graphics.
 * Includes traditional Chinese/Japanese-inspired geometric patterns.
 */

import React from 'react'

/**
 * Color palettes for different rarities
 */
export const RARITY_PALETTES = {
  LocalEdict: {
    primary: '#6B7280', // gray-500
    secondary: '#9CA3AF', // gray-400
    accent: '#D1D5DB', // gray-300
    glow: 'rgba(107, 114, 128, 0.3)',
  },
  RegionalMandate: {
    primary: '#059669', // emerald-600
    secondary: '#34D399', // emerald-400
    accent: '#A7F3D0', // emerald-200
    glow: 'rgba(5, 150, 105, 0.4)',
  },
  ImperialDecree: {
    primary: '#2563EB', // blue-600
    secondary: '#60A5FA', // blue-400
    accent: '#BFDBFE', // blue-200
    glow: 'rgba(37, 99, 235, 0.4)',
  },
  HeavenlyOrdinance: {
    primary: '#7C3AED', // violet-600
    secondary: '#A78BFA', // violet-400
    accent: '#DDD6FE', // violet-200
    glow: 'rgba(124, 58, 237, 0.5)',
  },
} as const

/**
 * Color palettes for decree categories
 */
export const CATEGORY_PALETTES = {
  Structural: {
    icon: '#8B4513', // saddle brown
    pattern: '#A0522D', // sienna
  },
  TileIdentity: {
    icon: '#4B0082', // indigo
    pattern: '#6A5ACD', // slate blue
  },
  YakuDoctrine: {
    icon: '#8B0000', // dark red
    pattern: '#B22222', // firebrick
  },
  Entropy: {
    icon: '#006400', // dark green
    pattern: '#228B22', // forest green
  },
  Scaling: {
    icon: '#FF8C00', // dark orange
    pattern: '#FFA500', // orange
  },
} as const

/**
 * SVG Pattern definitions component - include once in app
 */
export function PatternDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {/* Geometric lattice pattern (Chinese window) */}
        <pattern
          id="pattern-lattice"
          patternUnits="userSpaceOnUse"
          width="20"
          height="20"
        >
          <rect width="20" height="20" fill="transparent" />
          <path
            d="M0 10h20M10 0v20"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />
          <rect
            x="5"
            y="5"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.2"
          />
        </pattern>

        {/* Hexagonal pattern */}
        <pattern
          id="pattern-hexagon"
          patternUnits="userSpaceOnUse"
          width="28"
          height="49"
        >
          <rect width="28" height="49" fill="transparent" />
          <path
            d="M14 0l14 8.5v17L14 34 0 25.5v-17L14 0z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.2"
          />
        </pattern>

        {/* Wave pattern (traditional Japanese seigaiha) */}
        <pattern
          id="pattern-wave"
          patternUnits="userSpaceOnUse"
          width="40"
          height="20"
        >
          <rect width="40" height="20" fill="transparent" />
          <path
            d="M0 20c10 0 10-10 20-10s10 10 20 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.15"
          />
          <path
            d="M-20 20c10 0 10-10 20-10s10 10 20 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.15"
          />
        </pattern>

        {/* Cloud pattern (traditional Chinese) */}
        <pattern
          id="pattern-cloud"
          patternUnits="userSpaceOnUse"
          width="60"
          height="30"
        >
          <rect width="60" height="30" fill="transparent" />
          <circle cx="15" cy="15" r="8" fill="currentColor" opacity="0.1" />
          <circle cx="25" cy="12" r="6" fill="currentColor" opacity="0.08" />
          <circle cx="35" cy="15" r="8" fill="currentColor" opacity="0.1" />
        </pattern>

        {/* Diamond grid pattern */}
        <pattern
          id="pattern-diamond"
          patternUnits="userSpaceOnUse"
          width="20"
          height="20"
        >
          <rect width="20" height="20" fill="transparent" />
          <path
            d="M10 0l10 10-10 10L0 10z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.2"
          />
        </pattern>

        {/* Bamboo pattern */}
        <pattern
          id="pattern-bamboo"
          patternUnits="userSpaceOnUse"
          width="30"
          height="40"
        >
          <rect width="30" height="40" fill="transparent" />
          <line
            x1="15"
            y1="0"
            x2="15"
            y2="40"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.15"
          />
          <line
            x1="10"
            y1="10"
            x2="20"
            y2="10"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.1"
          />
          <line
            x1="10"
            y1="30"
            x2="20"
            y2="30"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.1"
          />
        </pattern>

        {/* Radial glow gradient */}
        <radialGradient id="glow-common" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#9CA3AF" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="glow-uncommon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="glow-rare" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="glow-mythic" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </radialGradient>

        {/* Metallic gold gradient */}
        <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>

        {/* Card sheen effect */}
        <linearGradient id="card-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.1" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/**
 * Mahjong-specific pattern components
 */
export const MahjongPatterns = {
  /**
   * Traditional Chinese border pattern
   */
  BorderPattern: ({ color = 'currentColor', size = 4 }: { color?: string; size?: number }) => (
    <svg width="100%" height={size} preserveAspectRatio="none">
      <pattern id="border-meander" patternUnits="userSpaceOnUse" width={size * 4} height={size}>
        <path
          d={`M0 0h${size}v${size}h${size}v-${size}h${size}v${size}h${size}v-${size}`}
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
      </pattern>
      <rect width="100%" height={size} fill="url(#border-meander)" />
    </svg>
  ),

  /**
   * Yin-Yang symbol
   */
  YinYang: ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="none" stroke={color} strokeWidth="1" />
      <path
        d="M12 1A11 11 0 0 0 12 23A5.5 5.5 0 0 0 12 12A5.5 5.5 0 0 1 12 1z"
        fill={color}
      />
      <circle cx="12" cy="6.5" r="2" fill="white" />
      <circle cx="12" cy="17.5" r="2" fill={color} />
    </svg>
  ),

  /**
   * Lucky coin (Chinese cash)
   */
  LuckyCoin: ({ size = 24, color = '#FFD700' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill={color} stroke="#B8860B" strokeWidth="1" />
      <rect x="9" y="9" width="6" height="6" fill="#1C3A2E" />
    </svg>
  ),

  /**
   * Dragon head silhouette
   */
  DragonHead: ({ size = 32, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path
        d="M4 16c0-2 2-4 4-4s4 0 6 2c2-4 6-6 10-6 2 0 4 2 4 4s-2 4-4 6c2 2 2 4 0 6-2-2-6-2-8 0-2-2-4-2-6 0-2-2-4-4-4-6 0-2 0-2-2-2z"
        fill={color}
      />
      <circle cx="22" cy="12" r="2" fill="white" />
      <circle cx="22" cy="12" r="1" fill="black" />
    </svg>
  ),
}

export default PatternDefs
