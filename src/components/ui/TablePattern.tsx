/**
 * TablePattern Component
 *
 * Traditional Japanese Seigaiha (青海波) wave pattern background with corner ornaments.
 * Used as the gameplay table background with configurable colors.
 */

import React, { useMemo } from 'react'
import { colors as themeColors } from '../../styles/theme'

export interface TablePatternColors {
  /** Background gradient start color */
  backgroundStart: string
  /** Background gradient end color */
  backgroundEnd: string
  /** Primary wave arc color */
  waveStroke: string
  /** Secondary/inner wave arc color */
  waveStrokeSecondary: string
  /** Corner ornament color */
  ornamentColor: string
  /** Vignette color for edge darkening */
  vignetteColor: string
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
  backgroundStart: themeColors.forestGreen,
  backgroundEnd: themeColors.darkForest,
  waveStroke: themeColors.metallicGold,
  waveStrokeSecondary: `${themeColors.metallicGold}40`, // 25% opacity
  ornamentColor: themeColors.metallicGold,
  vignetteColor: 'rgba(0, 0, 0, 0.6)',
}

/**
 * Generates an SVG data URI for the Seigaiha wave pattern
 */
function generateSeigaihaPattern(
  strokeColor: string,
  strokeColorSecondary: string,
  scale: number = 1
): string {
  const size = Math.round(60 * scale)
  const halfSize = size / 2
  const arcRadius1 = size * 0.5
  const arcRadius2 = size * 0.35
  const arcRadius3 = size * 0.2

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${halfSize}" viewBox="0 0 ${size} ${halfSize}">
      <defs>
        <pattern id="wave" x="0" y="0" width="${size}" height="${halfSize}" patternUnits="userSpaceOnUse">
          <!-- Row 1 - Main arcs -->
          <g transform="translate(${halfSize}, ${halfSize})">
            <path d="M ${-arcRadius1} 0 A ${arcRadius1} ${arcRadius1} 0 0 1 ${arcRadius1} 0"
                  fill="none" stroke="${strokeColor}" stroke-width="1" opacity="0.3"/>
            <path d="M ${-arcRadius2} 0 A ${arcRadius2} ${arcRadius2} 0 0 1 ${arcRadius2} 0"
                  fill="none" stroke="${strokeColorSecondary}" stroke-width="0.75"/>
            <path d="M ${-arcRadius3} 0 A ${arcRadius3} ${arcRadius3} 0 0 1 ${arcRadius3} 0"
                  fill="none" stroke="${strokeColor}" stroke-width="0.5" opacity="0.2"/>
          </g>
          <!-- Left partial arc -->
          <g transform="translate(0, ${halfSize})">
            <path d="M ${-arcRadius1} 0 A ${arcRadius1} ${arcRadius1} 0 0 1 ${arcRadius1} 0"
                  fill="none" stroke="${strokeColor}" stroke-width="1" opacity="0.3"/>
            <path d="M ${-arcRadius2} 0 A ${arcRadius2} ${arcRadius2} 0 0 1 ${arcRadius2} 0"
                  fill="none" stroke="${strokeColorSecondary}" stroke-width="0.75"/>
          </g>
          <!-- Right partial arc -->
          <g transform="translate(${size}, ${halfSize})">
            <path d="M ${-arcRadius1} 0 A ${arcRadius1} ${arcRadius1} 0 0 1 ${arcRadius1} 0"
                  fill="none" stroke="${strokeColor}" stroke-width="1" opacity="0.3"/>
            <path d="M ${-arcRadius2} 0 A ${arcRadius2} ${arcRadius2} 0 0 1 ${arcRadius2} 0"
                  fill="none" stroke="${strokeColorSecondary}" stroke-width="0.75"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wave)"/>
    </svg>
  `
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`
}

/**
 * Corner Ornament Component
 */
interface CornerOrnamentProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color: string
  size?: number
}

const CornerOrnament: React.FC<CornerOrnamentProps> = ({
  position,
  color,
  size = 40
}) => {
  const positionClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  const rotationClasses: Record<string, string> = {
    'top-left': 'rotate-0',
    'top-right': 'rotate-90',
    'bottom-left': '-rotate-90',
    'bottom-right': 'rotate-180',
  }

  return (
    <div
      className={`absolute ${positionClasses[position]} ${rotationClasses[position]} pointer-events-none`}
      style={{ width: size, height: size }}
    >
      {/* L-bracket ornament */}
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full"
        style={{ opacity: 0.6 }}
      >
        {/* Outer L-bracket */}
        <path
          d="M 0 40 L 0 0 L 40 0"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="square"
        />
        {/* Inner decorative line */}
        <path
          d="M 4 32 L 4 4 L 32 4"
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeLinecap="square"
          opacity="0.5"
        />
        {/* Corner decorative square */}
        <rect
          x="8"
          y="8"
          width="6"
          height="6"
          fill={color}
          opacity="0.3"
        />
        {/* Small accent dots */}
        <circle cx="20" cy="4" r="1.5" fill={color} opacity="0.4" />
        <circle cx="4" cy="20" r="1.5" fill={color} opacity="0.4" />
      </svg>
    </div>
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
  const colors = useMemo(() => ({
    ...defaultColors,
    ...customColors,
  }), [customColors])

  // Generate the SVG pattern
  const patternUrl = useMemo(
    () => generateSeigaihaPattern(colors.waveStroke, colors.waveStrokeSecondary, patternScale),
    [colors.waveStroke, colors.waveStrokeSecondary, patternScale]
  )

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${colors.backgroundStart} 0%, ${colors.backgroundEnd} 100%)`,
        }}
      />

      {/* Seigaiha wave pattern overlay */}
      <div
        className={`absolute inset-0 ${animated ? 'animate-wave-drift' : ''}`}
        style={{
          backgroundImage: `url("${patternUrl}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: `${60 * patternScale}px ${30 * patternScale}px`,
          opacity: 0.8,
        }}
      />

      {/* Vignette overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, ${colors.vignetteColor} 100%)`,
        }}
      />

      {/* Corner ornaments */}
      {showOrnaments && (
        <>
          <CornerOrnament position="top-left" color={colors.ornamentColor} />
          <CornerOrnament position="top-right" color={colors.ornamentColor} />
          <CornerOrnament position="bottom-left" color={colors.ornamentColor} />
          <CornerOrnament position="bottom-right" color={colors.ornamentColor} />
        </>
      )}

      {/* Content layer */}
      {children && (
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      )}
    </div>
  )
}

export default TablePattern
