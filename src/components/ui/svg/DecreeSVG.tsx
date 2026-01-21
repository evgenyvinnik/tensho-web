/**
 * Decree SVG Components
 *
 * Procedural SVG graphics for Decree cards.
 * Generates unique visuals based on rarity and category.
 */

import React from 'react'
import { DecreeRarity, DecreeCategory } from '../../../systems/types'
import { RARITY_PALETTES, CATEGORY_PALETTES } from './Patterns'
import { DecreeUniqueIcon } from './DecreeIcons'

/**
 * Get pattern ID based on category
 */
function getCategoryPattern(category: DecreeCategory): string {
  switch (category) {
    case 'Structural':
      return 'pattern-lattice'
    case 'TileIdentity':
      return 'pattern-hexagon'
    case 'YakuDoctrine':
      return 'pattern-wave'
    case 'Entropy':
      return 'pattern-cloud'
    case 'Scaling':
      return 'pattern-diamond'
    default:
      return 'pattern-lattice'
  }
}

/**
 * Get glow gradient based on rarity
 */
function getRarityGlow(rarity: DecreeRarity): string {
  switch (rarity) {
    case 'LocalEdict':
      return 'glow-common'
    case 'RegionalMandate':
      return 'glow-uncommon'
    case 'ImperialDecree':
      return 'glow-rare'
    case 'HeavenlyOrdinance':
      return 'glow-mythic'
    default:
      return 'glow-common'
  }
}

export interface DecreeBackgroundProps {
  rarity: DecreeRarity
  category: DecreeCategory
  width?: number
  height?: number
  animated?: boolean
  className?: string
}

/**
 * DecreeBackground - Procedural card background
 */
export function DecreeBackground({
  rarity,
  category,
  width = 144,
  height = 192,
  animated = false,
  className = '',
}: DecreeBackgroundProps) {
  const palette = RARITY_PALETTES[rarity]
  const categoryPalette = CATEGORY_PALETTES[category]
  const patternId = getCategoryPattern(category)
  const glowId = getRarityGlow(rarity)

  const cornerRadius = 12
  const borderWidth = 3

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <defs>
        {/* Card background gradient */}
        <linearGradient id={`bg-${rarity}-${category}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1C3A2E" />
          <stop offset="50%" stopColor="#0F2419" />
          <stop offset="100%" stopColor="#1C3A2E" />
        </linearGradient>

        {/* Border gradient based on rarity */}
        <linearGradient id={`border-${rarity}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.secondary} />
          <stop offset="50%" stopColor={palette.primary} />
          <stop offset="100%" stopColor={palette.secondary} />
        </linearGradient>

        {/* Animated shimmer for mythic */}
        {rarity === 'HeavenlyOrdinance' && animated && (
          <linearGradient id="shimmer-mythic" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent">
              <animate
                attributeName="offset"
                values="-1;2"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="rgba(255,255,255,0.3)">
              <animate
                attributeName="offset"
                values="-0.5;2.5"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="transparent">
              <animate
                attributeName="offset"
                values="0;3"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        )}
      </defs>

      {/* Outer glow for rare+ */}
      {(rarity === 'ImperialDecree' || rarity === 'HeavenlyOrdinance') && (
        <rect
          x={-10}
          y={-10}
          width={width + 20}
          height={height + 20}
          rx={cornerRadius + 5}
          fill={`url(#${glowId})`}
        />
      )}

      {/* Main card background */}
      <rect
        x={borderWidth / 2}
        y={borderWidth / 2}
        width={width - borderWidth}
        height={height - borderWidth}
        rx={cornerRadius}
        fill={`url(#bg-${rarity}-${category})`}
        stroke={`url(#border-${rarity})`}
        strokeWidth={borderWidth}
      />

      {/* Pattern overlay */}
      <rect
        x={borderWidth}
        y={borderWidth}
        width={width - borderWidth * 2}
        height={height - borderWidth * 2}
        rx={cornerRadius - 2}
        fill={`url(#${patternId})`}
        style={{ color: categoryPalette.pattern }}
      />

      {/* Top accent line */}
      <rect
        x={20}
        y={borderWidth + 4}
        width={width - 40}
        height={2}
        rx={1}
        fill={palette.accent}
        opacity={0.5}
      />

      {/* Bottom accent line */}
      <rect
        x={20}
        y={height - borderWidth - 6}
        width={width - 40}
        height={2}
        rx={1}
        fill={palette.accent}
        opacity={0.5}
      />

      {/* Corner decorations */}
      <CornerDecoration x={8} y={8} size={16} color={palette.secondary} />
      <CornerDecoration x={width - 24} y={8} size={16} color={palette.secondary} flip />
      <CornerDecoration x={8} y={height - 24} size={16} color={palette.secondary} flipY />
      <CornerDecoration x={width - 24} y={height - 24} size={16} color={palette.secondary} flip flipY />

      {/* Shimmer overlay for mythic */}
      {rarity === 'HeavenlyOrdinance' && animated && (
        <rect
          x={borderWidth}
          y={borderWidth}
          width={width - borderWidth * 2}
          height={height - borderWidth * 2}
          rx={cornerRadius - 2}
          fill="url(#shimmer-mythic)"
        />
      )}

      {/* Card sheen */}
      <rect
        x={borderWidth}
        y={borderWidth}
        width={width - borderWidth * 2}
        height={height - borderWidth * 2}
        rx={cornerRadius - 2}
        fill="url(#card-sheen)"
      />
    </svg>
  )
}

/**
 * Corner decoration element
 */
function CornerDecoration({
  x,
  y,
  size,
  color,
  flip = false,
  flipY = false,
}: {
  x: number
  y: number
  size: number
  color: string
  flip?: boolean
  flipY?: boolean
}) {
  const scaleX = flip ? -1 : 1
  const scaleY = flipY ? -1 : 1
  const translateX = flip ? x + size : x
  const translateY = flipY ? y + size : y

  return (
    <g transform={`translate(${translateX}, ${translateY}) scale(${scaleX}, ${scaleY})`}>
      <path
        d={`M0 0 L${size} 0 L${size} ${size * 0.3} L${size * 0.3} ${size * 0.3} L${size * 0.3} ${size} L0 ${size} Z`}
        fill="none"
        stroke={color}
        strokeWidth={1}
        opacity={0.6}
      />
    </g>
  )
}

export interface DecreeIconProps {
  category: DecreeCategory
  size?: number
  color?: string
  className?: string
}

/**
 * DecreeIcon - Category-specific icon
 */
export function DecreeIcon({
  category,
  size = 32,
  color,
  className = '',
}: DecreeIconProps) {
  const iconColor = color || CATEGORY_PALETTES[category].icon

  const icons: Record<DecreeCategory, React.ReactNode> = {
    Structural: (
      // Temple/Building icon
      <g>
        <path d="M16 4l12 8H4l12-8z" fill={iconColor} />
        <rect x="6" y="12" width="4" height="14" fill={iconColor} />
        <rect x="14" y="12" width="4" height="14" fill={iconColor} />
        <rect x="22" y="12" width="4" height="14" fill={iconColor} />
        <rect x="4" y="26" width="24" height="2" fill={iconColor} />
      </g>
    ),
    TileIdentity: (
      // Mask/Face icon
      <g>
        <ellipse cx="16" cy="16" rx="10" ry="12" fill={iconColor} />
        <ellipse cx="11" cy="13" rx="2" ry="3" fill="#1C3A2E" />
        <ellipse cx="21" cy="13" rx="2" ry="3" fill="#1C3A2E" />
        <path d="M12 22 Q16 26 20 22" fill="none" stroke="#1C3A2E" strokeWidth="2" />
      </g>
    ),
    YakuDoctrine: (
      // Scroll/Book icon
      <g>
        <rect x="8" y="6" width="16" height="20" rx="1" fill={iconColor} />
        <path d="M8 8 Q6 8 6 10 L6 22 Q6 24 8 24" fill={iconColor} />
        <path d="M24 8 Q26 8 26 10 L26 22 Q26 24 24 24" fill={iconColor} />
        <line x1="11" y1="11" x2="21" y2="11" stroke="#1C3A2E" strokeWidth="1.5" />
        <line x1="11" y1="15" x2="21" y2="15" stroke="#1C3A2E" strokeWidth="1.5" />
        <line x1="11" y1="19" x2="18" y2="19" stroke="#1C3A2E" strokeWidth="1.5" />
      </g>
    ),
    Entropy: (
      // Dice/Chaos icon
      <g>
        <rect x="6" y="6" width="20" height="20" rx="3" fill={iconColor} transform="rotate(15 16 16)" />
        <circle cx="12" cy="12" r="2" fill="#1C3A2E" />
        <circle cx="16" cy="16" r="2" fill="#1C3A2E" />
        <circle cx="20" cy="20" r="2" fill="#1C3A2E" />
        <circle cx="12" cy="20" r="2" fill="#1C3A2E" />
        <circle cx="20" cy="12" r="2" fill="#1C3A2E" />
      </g>
    ),
    Scaling: (
      // Rising graph/Arrow icon
      <g>
        <path d="M6 26 L12 18 L18 22 L26 8" fill="none" stroke={iconColor} strokeWidth="3" strokeLinecap="round" />
        <polygon points="26,8 20,10 24,14" fill={iconColor} />
        <line x1="6" y1="28" x2="26" y2="28" stroke={iconColor} strokeWidth="2" />
      </g>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
    >
      {icons[category]}
    </svg>
  )
}

export interface DecreeSVGProps {
  id?: string // Decree ID for unique icon
  rarity: DecreeRarity
  category: DecreeCategory
  name: string
  width?: number
  height?: number
  animated?: boolean
  className?: string
}

/**
 * Rarity icon color mapping for DecreeSVG
 */
const RARITY_ICON_COLORS: Record<DecreeRarity, string> = {
  LocalEdict: '#9CA3AF', // gray-400
  RegionalMandate: '#22C55E', // green-500
  ImperialDecree: '#3B82F6', // blue-500
  HeavenlyOrdinance: '#A855F7', // purple-500
}

/**
 * DecreeSVG - Complete decree card with background and icon
 */
export function DecreeSVG({
  id,
  rarity,
  category,
  name,
  width = 144,
  height = 192,
  animated = false,
  className = '',
}: DecreeSVGProps) {
  const palette = RARITY_PALETTES[rarity]

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Background */}
      <DecreeBackground
        rarity={rarity}
        category={category}
        width={width}
        height={height}
        animated={animated}
        className="absolute inset-0"
      />

      {/* Icon - Use unique icon if ID provided, otherwise category icon */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        {id ? (
          <DecreeUniqueIcon
            decreeId={id}
            size={48}
            color={RARITY_ICON_COLORS[rarity]}
          />
        ) : (
          <DecreeIcon category={category} size={48} />
        )}
      </div>

      {/* Name */}
      <div
        className="absolute bottom-12 left-2 right-2 text-center"
        style={{ color: palette.accent }}
      >
        <p className="text-xs font-bold truncate">{name}</p>
      </div>

      {/* Rarity indicator dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
        {Array.from({ length: getRarityDots(rarity) }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: palette.secondary }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Get number of indicator dots based on rarity
 */
function getRarityDots(rarity: DecreeRarity): number {
  switch (rarity) {
    case 'LocalEdict':
      return 1
    case 'RegionalMandate':
      return 2
    case 'ImperialDecree':
      return 3
    case 'HeavenlyOrdinance':
      return 4
    default:
      return 1
  }
}

export default DecreeSVG
