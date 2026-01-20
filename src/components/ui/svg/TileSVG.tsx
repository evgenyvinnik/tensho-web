/**
 * Tile SVG Components
 *
 * Procedural SVG graphics for Mahjong tiles.
 * Provides an alternative to image-based tiles.
 */

import React from 'react'

/**
 * Tile color palette
 */
const TILE_COLORS = {
  background: '#F5F5DC', // Beige white
  border: '#1C3A2E', // Dark forest
  manzu: '#4169E1', // Royal blue
  pinzu: '#228B22', // Forest green
  souzu: '#006400', // Dark green
  wind: '#4B0082', // Indigo
  dragon: {
    white: '#F5F5F5',
    green: '#228B22',
    red: '#DC143C',
  },
  flower: '#DB7093', // Pale violet red
  season: '#87CEEB', // Sky blue
  redDora: '#FF0000',
} as const

export interface TileSVGProps {
  /** Tile suit identifier */
  suit: 'manzu' | 'pinzu' | 'souzu' | 'wind' | 'dragon' | 'flower' | 'season'
  /** Tile rank (1-9 for suited, 1-4 for winds, 1-3 for dragons, 1-4 for flowers/seasons) */
  rank: number
  /** Size of the tile */
  size?: number
  /** Whether this is a red dora */
  isRed?: boolean
  /** Whether the tile is selected */
  selected?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Render Chinese numeral for characters (Manzu)
 */
function renderManzu(rank: number, isRed: boolean) {
  const color = isRed ? TILE_COLORS.redDora : TILE_COLORS.manzu

  const numerals: Record<number, React.ReactNode> = {
    1: (
      <text x="35" y="45" fontSize="28" fontWeight="bold" fill={color} textAnchor="middle">
        一
      </text>
    ),
    2: (
      <text x="35" y="45" fontSize="28" fontWeight="bold" fill={color} textAnchor="middle">
        二
      </text>
    ),
    3: (
      <text x="35" y="45" fontSize="28" fontWeight="bold" fill={color} textAnchor="middle">
        三
      </text>
    ),
    4: (
      <text x="35" y="45" fontSize="28" fontWeight="bold" fill={color} textAnchor="middle">
        四
      </text>
    ),
    5: (
      <text x="35" y="45" fontSize="28" fontWeight="bold" fill={color} textAnchor="middle">
        五
      </text>
    ),
    6: (
      <text x="35" y="45" fontSize="28" fontWeight="bold" fill={color} textAnchor="middle">
        六
      </text>
    ),
    7: (
      <text x="35" y="45" fontSize="28" fontWeight="bold" fill={color} textAnchor="middle">
        七
      </text>
    ),
    8: (
      <text x="35" y="45" fontSize="28" fontWeight="bold" fill={color} textAnchor="middle">
        八
      </text>
    ),
    9: (
      <text x="35" y="45" fontSize="28" fontWeight="bold" fill={color} textAnchor="middle">
        九
      </text>
    ),
  }

  return (
    <g>
      {numerals[rank]}
      <text x="35" y="75" fontSize="16" fill={color} textAnchor="middle">
        萬
      </text>
    </g>
  )
}

/**
 * Render circles for Pinzu
 */
function renderPinzu(rank: number, isRed: boolean) {
  const color = isRed ? TILE_COLORS.redDora : TILE_COLORS.pinzu
  const circles: React.ReactNode[] = []

  // Standard positions for circles
  const positions: [number, number][][] = [
    [], // 0
    [[35, 49]], // 1
    [[35, 30], [35, 68]], // 2
    [[35, 25], [35, 49], [35, 73]], // 3
    [[25, 30], [45, 30], [25, 68], [45, 68]], // 4
    [[25, 25], [45, 25], [35, 49], [25, 73], [45, 73]], // 5
    [[25, 25], [45, 25], [25, 49], [45, 49], [25, 73], [45, 73]], // 6
    [[25, 22], [45, 22], [25, 44], [45, 44], [35, 66], [25, 78], [45, 78]], // 7
    [[25, 20], [45, 20], [25, 40], [45, 40], [25, 60], [45, 60], [25, 78], [45, 78]], // 8
    [[25, 18], [45, 18], [35, 32], [25, 49], [45, 49], [35, 66], [25, 78], [45, 78], [35, 6]], // 9
  ]

  const pos = positions[rank] || [[35, 49]]
  pos.forEach(([x, y], i) => {
    circles.push(
      <circle
        key={i}
        cx={x}
        cy={y}
        r="8"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    )
    circles.push(
      <circle
        key={`inner-${i}`}
        cx={x}
        cy={y}
        r="4"
        fill={color}
      />
    )
  })

  return <g>{circles}</g>
}

/**
 * Render bamboo sticks for Souzu
 */
function renderSouzu(rank: number, isRed: boolean) {
  const color = isRed ? TILE_COLORS.redDora : TILE_COLORS.souzu

  if (rank === 1) {
    // Bird for 1 sou
    return (
      <g>
        <ellipse cx="35" cy="40" rx="12" ry="18" fill={color} />
        <ellipse cx="35" cy="28" rx="8" ry="8" fill={color} />
        <circle cx="32" cy="26" r="2" fill="white" />
        <path d="M35 32 L42 34 L35 36" fill="orange" />
        <path d="M25 50 Q20 55 18 60" fill="none" stroke={color} strokeWidth="2" />
        <path d="M45 50 Q50 55 52 60" fill="none" stroke={color} strokeWidth="2" />
      </g>
    )
  }

  // Bamboo sticks for other ranks
  const sticks: React.ReactNode[] = []
  const positions: [number, number, number][][] = [
    [], // 0
    [], // 1 - bird
    [[27, 25, 50], [43, 25, 50]], // 2
    [[27, 18, 35], [35, 36, 35], [43, 18, 35]], // 3
    [[24, 15, 35], [46, 15, 35], [24, 52, 35], [46, 52, 35]], // 4
    [[24, 15, 30], [46, 15, 30], [35, 38, 30], [24, 58, 30], [46, 58, 30]], // 5
    [[24, 15, 25], [35, 15, 25], [46, 15, 25], [24, 58, 25], [35, 58, 25], [46, 58, 25]], // 6
    [[24, 10, 22], [35, 10, 22], [46, 10, 22], [35, 42, 22], [24, 65, 22], [35, 65, 22], [46, 65, 22]], // 7
    [[24, 10, 20], [35, 10, 20], [46, 10, 20], [24, 40, 20], [46, 40, 20], [24, 68, 20], [35, 68, 20], [46, 68, 20]], // 8
    [[24, 8, 18], [35, 8, 18], [46, 8, 18], [24, 34, 18], [35, 34, 18], [46, 34, 18], [24, 60, 18], [35, 60, 18], [46, 60, 18]], // 9
  ]

  const pos = positions[rank] || []
  pos.forEach(([x, y, h], i) => {
    sticks.push(
      <g key={i}>
        <rect x={x - 5} y={y} width="10" height={h} rx="2" fill={color} />
        {/* Bamboo segments */}
        <line x1={x - 5} y1={y + h * 0.33} x2={x + 5} y2={y + h * 0.33} stroke={TILE_COLORS.border} strokeWidth="1" />
        <line x1={x - 5} y1={y + h * 0.66} x2={x + 5} y2={y + h * 0.66} stroke={TILE_COLORS.border} strokeWidth="1" />
      </g>
    )
  })

  return <g>{sticks}</g>
}

/**
 * Render wind character
 */
function renderWind(rank: number) {
  const winds = ['', '東', '南', '西', '北']
  const color = TILE_COLORS.wind

  return (
    <text x="35" y="60" fontSize="40" fontWeight="bold" fill={color} textAnchor="middle">
      {winds[rank]}
    </text>
  )
}

/**
 * Render dragon
 */
function renderDragon(rank: number) {
  if (rank === 1) {
    // White dragon - empty frame
    return (
      <rect
        x="15"
        y="20"
        width="40"
        height="58"
        fill="none"
        stroke={TILE_COLORS.border}
        strokeWidth="2"
        rx="4"
      />
    )
  }

  if (rank === 2) {
    // Green dragon
    return (
      <text x="35" y="60" fontSize="40" fontWeight="bold" fill={TILE_COLORS.dragon.green} textAnchor="middle">
        發
      </text>
    )
  }

  if (rank === 3) {
    // Red dragon
    return (
      <text x="35" y="60" fontSize="40" fontWeight="bold" fill={TILE_COLORS.dragon.red} textAnchor="middle">
        中
      </text>
    )
  }

  return null
}

/**
 * TileSVG - Procedural mahjong tile
 */
export function TileSVG({
  suit,
  rank,
  size = 70,
  isRed = false,
  selected = false,
  className = '',
}: TileSVGProps) {
  const width = size
  const height = size * 1.4

  const renderContent = () => {
    switch (suit) {
      case 'manzu':
        return renderManzu(rank, isRed)
      case 'pinzu':
        return renderPinzu(rank, isRed)
      case 'souzu':
        return renderSouzu(rank, isRed)
      case 'wind':
        return renderWind(rank)
      case 'dragon':
        return renderDragon(rank)
      case 'flower':
        return (
          <text x="35" y="55" fontSize="24" fill={TILE_COLORS.flower} textAnchor="middle">
            花{rank}
          </text>
        )
      case 'season':
        return (
          <text x="35" y="55" fontSize="24" fill={TILE_COLORS.season} textAnchor="middle">
            季{rank}
          </text>
        )
      default:
        return null
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 70 98"
      className={className}
    >
      <defs>
        <linearGradient id="tile-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFEF0" />
          <stop offset="100%" stopColor="#F5F5DC" />
        </linearGradient>
        <filter id="tile-shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Tile background */}
      <rect
        x="2"
        y="2"
        width="66"
        height="94"
        rx="6"
        fill="url(#tile-bg)"
        stroke={selected ? '#FFD54F' : TILE_COLORS.border}
        strokeWidth={selected ? 3 : 2}
        filter="url(#tile-shadow)"
      />

      {/* Content */}
      {renderContent()}

      {/* Red dora indicator */}
      {isRed && (
        <circle cx="60" cy="88" r="4" fill={TILE_COLORS.redDora} />
      )}

      {/* Selection overlay */}
      {selected && (
        <rect
          x="2"
          y="2"
          width="66"
          height="94"
          rx="6"
          fill="#FFD54F"
          opacity="0.2"
        />
      )}
    </svg>
  )
}

export interface TileBackSVGProps {
  size?: number
  className?: string
}

/**
 * TileBackSVG - Back of a mahjong tile
 */
export function TileBackSVG({
  size = 70,
  className = '',
}: TileBackSVGProps) {
  const width = size
  const height = size * 1.4

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 70 98"
      className={className}
    >
      <defs>
        <linearGradient id="tile-back-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2D5F4A" />
          <stop offset="100%" stopColor="#1C3A2E" />
        </linearGradient>
        <pattern id="tile-back-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
          <rect width="20" height="20" fill="transparent" />
          <path d="M0 10h20M10 0v20" stroke="#3D7F6A" strokeWidth="0.5" opacity="0.3" />
        </pattern>
        <filter id="tile-back-shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Tile background */}
      <rect
        x="2"
        y="2"
        width="66"
        height="94"
        rx="6"
        fill="url(#tile-back-bg)"
        stroke="#1C3A2E"
        strokeWidth="2"
        filter="url(#tile-back-shadow)"
      />

      {/* Pattern overlay */}
      <rect
        x="6"
        y="6"
        width="58"
        height="86"
        rx="4"
        fill="url(#tile-back-pattern)"
      />

      {/* Center decoration */}
      <circle cx="35" cy="49" r="15" fill="none" stroke="#4D8F6A" strokeWidth="2" opacity="0.5" />
      <circle cx="35" cy="49" r="8" fill="#4D8F6A" opacity="0.3" />
    </svg>
  )
}

export default { TileSVG, TileBackSVG }
