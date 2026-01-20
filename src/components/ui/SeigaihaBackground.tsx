/**
 * Seigaiha Background Component for Tensho Mahjong Roguelike
 *
 * Traditional Japanese wave pattern (青海波 / Seigaiha) background
 * with gold border frame and corner ornaments.
 */

import React, { useMemo } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'

/**
 * Theme colors matching the game's palette
 */
const colors = {
  gold: '#D4A843',
  goldBright: '#E8C068',
  greenDark: '#1F3A1F',
  greenMid: '#2D4A2D',
  greenLight: '#4A6B4A',
  waveColor: 'rgba(90, 120, 80, 0.4)',
}

/**
 * Generate seigaiha pattern as inline SVG data URI
 */
function generateWavePattern(): string {
  const size = 56
  const halfSize = size / 2
  const color = colors.waveColor

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${halfSize}" viewBox="0 0 ${size} ${halfSize}">
      <!-- Left wave cluster -->
      <circle cx="0" cy="${halfSize}" r="26" fill="none" stroke="${color}" stroke-width="1.5"/>
      <circle cx="0" cy="${halfSize}" r="19" fill="none" stroke="${color}" stroke-width="1.5"/>
      <circle cx="0" cy="${halfSize}" r="12" fill="none" stroke="${color}" stroke-width="1.5"/>

      <!-- Center wave cluster -->
      <circle cx="${halfSize}" cy="${halfSize}" r="26" fill="none" stroke="${color}" stroke-width="1.5"/>
      <circle cx="${halfSize}" cy="${halfSize}" r="19" fill="none" stroke="${color}" stroke-width="1.5"/>
      <circle cx="${halfSize}" cy="${halfSize}" r="12" fill="none" stroke="${color}" stroke-width="1.5"/>

      <!-- Right wave cluster -->
      <circle cx="${size}" cy="${halfSize}" r="26" fill="none" stroke="${color}" stroke-width="1.5"/>
      <circle cx="${size}" cy="${halfSize}" r="19" fill="none" stroke="${color}" stroke-width="1.5"/>
      <circle cx="${size}" cy="${halfSize}" r="12" fill="none" stroke="${color}" stroke-width="1.5"/>
    </svg>
  `

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * Corner ornament component for the gold border frame
 */
interface CornerOrnamentProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

function CornerOrnament({ position }: CornerOrnamentProps) {
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: -3, left: -3, transform: 'none' },
    'top-right': { top: -3, right: -3, transform: 'scaleX(-1)' },
    'bottom-left': { bottom: -3, left: -3, transform: 'scaleY(-1)' },
    'bottom-right': { bottom: -3, right: -3, transform: 'scale(-1, -1)' },
  }

  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      style={{
        position: 'absolute',
        ...positionStyles[position],
      }}
    >
      {/* Outer L-bracket */}
      <path
        d="M 0 0 L 40 0 L 40 6 L 6 6 L 6 40 L 0 40 Z"
        fill={colors.gold}
      />
      {/* Inner decorative square */}
      <rect
        x="12"
        y="12"
        width="12"
        height="12"
        fill="none"
        stroke={colors.gold}
        strokeWidth="3"
      />
      {/* Horizontal connecting line */}
      <rect x="6" y="16.5" width="6" height="3" fill={colors.gold} />
      {/* Vertical connecting line */}
      <rect x="16.5" y="6" width="3" height="6" fill={colors.gold} />
    </svg>
  )
}

/**
 * Gold border frame with corner ornaments
 */
interface GoldBorderFrameProps {
  inset?: number
}

function GoldBorderFrame({ inset = 20 }: GoldBorderFrameProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: inset,
        left: inset,
        right: inset,
        bottom: inset,
        border: `3px solid ${colors.gold}`,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      <CornerOrnament position="top-left" />
      <CornerOrnament position="top-right" />
      <CornerOrnament position="bottom-left" />
      <CornerOrnament position="bottom-right" />
    </div>
  )
}

export interface SeigaihaBackgroundProps {
  /** Whether to show the gold border frame */
  showFrame?: boolean
  /** Inset for the gold border frame */
  frameInset?: number
  /** Whether to animate the wave pattern */
  animated?: boolean
  /** Whether to show the vignette overlay */
  showVignette?: boolean
  /** Additional class name */
  className?: string
  /** Children to render on top of the background */
  children?: React.ReactNode
}

/**
 * Seigaiha Background Component
 *
 * Renders a traditional Japanese wave pattern background with optional
 * gold border frame and corner ornaments.
 */
export function SeigaihaBackground({
  showFrame = true,
  frameInset = 20,
  animated = false,
  showVignette = true,
  className = '',
  children,
}: SeigaihaBackgroundProps) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const shouldAnimate = animated && !reducedMotion

  // Memoize the wave pattern URL
  const wavePatternUrl = useMemo(() => generateWavePattern(), [])

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        backgroundColor: colors.greenMid,
      }}
    >
      {/* Gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(
            ellipse 80% 60% at 50% 30%,
            ${colors.greenLight} 0%,
            #3D5C3D 30%,
            ${colors.greenMid} 60%,
            ${colors.greenDark} 100%
          )`,
        }}
      />

      {/* Seigaiha wave pattern */}
      <div
        className={shouldAnimate ? 'seigaiha-animated' : ''}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: wavePatternUrl,
          backgroundSize: '56px 28px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Vignette overlay */}
      {showVignette && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(
              ellipse 70% 50% at 50% 40%,
              transparent 0%,
              transparent 40%,
              rgba(20, 40, 20, 0.5) 100%
            )`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Gold border frame */}
      {showFrame && <GoldBorderFrame inset={frameInset} />}

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>

      {/* Animation keyframes */}
      {shouldAnimate && (
        <style>{`
          @keyframes waveShift {
            0%, 100% {
              background-position: 0 0;
            }
            50% {
              background-position: 28px 14px;
            }
          }
          .seigaiha-animated {
            animation: waveShift 15s ease-in-out infinite;
          }
        `}</style>
      )}
    </div>
  )
}

export default SeigaihaBackground
