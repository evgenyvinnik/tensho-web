/**
 * TablePattern Component
 *
 * Traditional Japanese Seigaiha (青海波) wave pattern background with corner ornaments.
 * Used as the gameplay table background with configurable colors.
 */

import React, { useMemo } from 'react'
import { colors as themeColors } from '../../styles/theme'

export interface TablePatternColors {
  /** Dark green for background */
  greenDark: string
  /** Mid green for background */
  greenMid: string
  /** Light green for gradient center */
  greenLight: string
  /** Gold color for ornaments and accents */
  gold: string
  /** Bright gold for highlights */
  goldBright: string
  /** Wave pattern color */
  waveColor: string
}

export interface TablePatternProps {
  /** Custom color configuration (defaults to theme colors) */
  colors?: Partial<TablePatternColors>
  /** Whether to animate the wave pattern */
  animated?: boolean
  /** Show corner ornaments */
  showOrnaments?: boolean
  /** Pattern scale multiplier */
  patternScale?: number
  /** Children to render on top of the pattern */
  children?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/** Default colors based on theme */
const defaultColors: TablePatternColors = {
  gold: themeColors.metallicGold,
  goldBright: themeColors.goldenYellow,
  greenDark: '#1F3A1F',
  greenMid: themeColors.forestGreen,
  greenLight: '#4A6B4A',
  waveColor: 'rgba(90, 120, 80, 0.4)',
}

/**
 * Generates an SVG data URI for the Seigaiha wave pattern using circles
 */
function generateSeigaihaPattern(waveColor: string, scale: number = 1): string {
  const size = Math.round(56 * scale)
  const halfSize = size / 2

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${halfSize}" viewBox="0 0 ${size} ${halfSize}">
      <!-- Left wave cluster -->
      <circle cx="0" cy="${halfSize}" r="26" fill="none" stroke="${waveColor}" stroke-width="1.5"/>
      <circle cx="0" cy="${halfSize}" r="19" fill="none" stroke="${waveColor}" stroke-width="1.5"/>
      <circle cx="0" cy="${halfSize}" r="12" fill="none" stroke="${waveColor}" stroke-width="1.5"/>

      <!-- Center wave cluster -->
      <circle cx="${halfSize}" cy="${halfSize}" r="26" fill="none" stroke="${waveColor}" stroke-width="1.5"/>
      <circle cx="${halfSize}" cy="${halfSize}" r="19" fill="none" stroke="${waveColor}" stroke-width="1.5"/>
      <circle cx="${halfSize}" cy="${halfSize}" r="12" fill="none" stroke="${waveColor}" stroke-width="1.5"/>

      <!-- Right wave cluster -->
      <circle cx="${size}" cy="${halfSize}" r="26" fill="none" stroke="${waveColor}" stroke-width="1.5"/>
      <circle cx="${size}" cy="${halfSize}" r="19" fill="none" stroke="${waveColor}" stroke-width="1.5"/>
      <circle cx="${size}" cy="${halfSize}" r="12" fill="none" stroke="${waveColor}" stroke-width="1.5"/>
    </svg>
  `

  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`
}

/**
 * Corner Ornament Component - L-bracket style with decorative elements
 */
interface CornerOrnamentProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color: string
  size?: number
}

const CornerOrnament: React.FC<CornerOrnamentProps> = ({
  position,
  color,
  size = 40,
}) => {
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: -3, left: -3, transform: 'none' },
    'top-right': { top: -3, right: -3, transform: 'scaleX(-1)' },
    'bottom-left': { bottom: -3, left: -3, transform: 'scaleY(-1)' },
    'bottom-right': { bottom: -3, right: -3, transform: 'scale(-1, -1)' },
  }

  return (
    <svg
      data-table-ornament={position}
      className="table-pattern-ornament"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        ...positionStyles[position],
      }}
    >
      {/* Outer L-bracket */}
      <path d="M 0 0 L 40 0 L 40 6 L 6 6 L 6 40 L 0 40 Z" fill={color} />
      {/* Inner decorative square */}
      <rect
        x="12"
        y="12"
        width="12"
        height="12"
        fill="none"
        stroke={color}
        strokeWidth="3"
      />
      {/* Horizontal connecting line */}
      <rect x="6" y="16.5" width="6" height="3" fill={color} />
      {/* Vertical connecting line */}
      <rect x="16.5" y="6" width="3" height="6" fill={color} />
    </svg>
  )
}

/**
 * TablePattern - Seigaiha wave pattern background with ornaments
 */
export const TablePattern: React.FC<TablePatternProps> = ({
  colors: customColors,
  animated = false,
  showOrnaments = true,
  patternScale = 1,
  children,
  className = '',
}) => {
  // Merge custom colors with defaults
  const colors = useMemo(
    () => ({
      ...defaultColors,
      ...customColors,
    }),
    [customColors]
  )

  // Generate the SVG pattern
  const patternUrl = useMemo(
    () => generateSeigaihaPattern(colors.waveColor, patternScale),
    [colors.waveColor, patternScale]
  )

  const patternSize = Math.round(56 * patternScale)
  const patternHalfSize = Math.round(28 * patternScale)

  return (
    <div
      className={`table-pattern relative h-full w-full overflow-hidden ${className}`}
      style={{
        backgroundColor: colors.greenMid,
      }}
    >
      {/* Radial gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse 80% 60% at 50% 30%,
            ${colors.greenLight} 0%,
            #3D5C3D 30%,
            ${colors.greenMid} 60%,
            ${colors.greenDark} 100%
          )`,
        }}
      />

      {/* Seigaiha wave pattern overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${patternUrl}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: `${patternSize}px ${patternHalfSize}px`,
          animation: animated ? 'waveShift 15s ease-in-out infinite' : 'none',
        }}
      />

      {/* Vignette overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(
            ellipse 70% 50% at 50% 40%,
            transparent 0%,
            transparent 40%,
            rgba(20, 40, 20, 0.5) 100%
          )`,
        }}
      />

      {/* Gold border frame */}
      {showOrnaments && (
        <div
          data-table-frame
          className="table-pattern-frame absolute pointer-events-none"
          style={{
            border: `3px solid ${colors.gold}`,
          }}
        >
          <CornerOrnament position="top-left" color={colors.gold} />
          <CornerOrnament position="top-right" color={colors.gold} />
          <CornerOrnament position="bottom-left" color={colors.gold} />
          <CornerOrnament position="bottom-right" color={colors.gold} />
        </div>
      )}

      {/* Content layer */}
      {children && (
        <div
          data-table-content
          className={`table-pattern-content relative z-10 h-full w-full ${
            showOrnaments ? 'table-pattern-content-framed' : ''
          }`}
        >
          {children}
        </div>
      )}

      {/* Keyframe animation for wave pattern */}
      {animated && (
        <style>{`
          @keyframes waveShift {
            0%, 100% {
              background-position: 0 0;
            }
            50% {
              background-position: ${patternHalfSize}px ${patternHalfSize / 2}px;
            }
          }
        `}</style>
      )}
    </div>
  )
}

export default TablePattern
