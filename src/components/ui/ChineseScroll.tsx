/**
 * ChineseScroll Component
 *
 * A pure CSS/React replication of the traditional Chinese scroll UI.
 * Replicates the popup/BG.png asset without using the image.
 */

import React from 'react'

export interface ChineseScrollProps {
  /** Content to display inside the scroll */
  children?: React.ReactNode
  /** Width of the parchment area */
  width?: number
  /** Height of the parchment area */
  height?: number
  /** Additional CSS class name */
  className?: string
  /** Whether to show the meander border */
  showBorder?: boolean
}

/**
 * Greek Key / Meander Border Pattern as SVG
 */
function MeanderBorder({ width, height }: { width: number; height: number }) {
  const borderWidth = 16
  const cornerSize = 16
  const innerWidth = width - borderWidth * 2
  const innerHeight = height - borderWidth * 2

  return (
    <svg
      className="absolute pointer-events-none"
      style={{ left: 24, top: 24, width: width - 48, height: height - 48 }}
      viewBox={`0 0 ${width - 48} ${height - 48}`}
    >
      <defs>
        {/* Horizontal meander pattern */}
        <pattern
          id="meanderH"
          patternUnits="userSpaceOnUse"
          width="24"
          height="12"
        >
          <path
            d="M0,0 L0,8 L4,8 L4,4 L8,4 L8,12 L12,12 L12,0 L24,0 L24,8 L20,8 L20,4 L16,4 L16,12 L12,12"
            fill="none"
            stroke="#c08010"
            strokeWidth="3"
          />
        </pattern>
        {/* Vertical meander pattern */}
        <pattern
          id="meanderV"
          patternUnits="userSpaceOnUse"
          width="12"
          height="24"
        >
          <path
            d="M0,0 L8,0 L8,4 L4,4 L4,8 L12,8 L12,12 L0,12 L0,24 L8,24 L8,20 L4,20 L4,16 L12,16 L12,12"
            fill="none"
            stroke="#c08010"
            strokeWidth="3"
          />
        </pattern>
      </defs>

      {/* Top border */}
      <rect
        x={cornerSize}
        y={0}
        width={innerWidth - cornerSize * 2 + borderWidth * 2}
        height={borderWidth}
        fill="url(#meanderH)"
      />
      {/* Bottom border */}
      <rect
        x={cornerSize}
        y={innerHeight + borderWidth}
        width={innerWidth - cornerSize * 2 + borderWidth * 2}
        height={borderWidth}
        fill="url(#meanderH)"
      />
      {/* Left border */}
      <rect
        x={0}
        y={cornerSize}
        width={borderWidth}
        height={innerHeight - cornerSize * 2 + borderWidth * 2}
        fill="url(#meanderV)"
      />
      {/* Right border */}
      <rect
        x={innerWidth + borderWidth}
        y={cornerSize}
        width={borderWidth}
        height={innerHeight - cornerSize * 2 + borderWidth * 2}
        fill="url(#meanderV)"
      />

      {/* Corner squares */}
      <rect x={0} y={0} width={cornerSize} height={cornerSize} fill="#c08010" />
      <rect
        x={innerWidth + borderWidth * 2 - cornerSize}
        y={0}
        width={cornerSize}
        height={cornerSize}
        fill="#c08010"
      />
      <rect
        x={0}
        y={innerHeight + borderWidth * 2 - cornerSize}
        width={cornerSize}
        height={cornerSize}
        fill="#c08010"
      />
      <rect
        x={innerWidth + borderWidth * 2 - cornerSize}
        y={innerHeight + borderWidth * 2 - cornerSize}
        width={cornerSize}
        height={cornerSize}
        fill="#c08010"
      />
    </svg>
  )
}

/**
 * Wooden End Cap Component
 * Replicates the brown wooden knobs at the ends of scroll rollers
 */
function WoodenEndCap({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className="flex-shrink-0 relative"
      style={{
        width: 24,
        height: 48,
        zIndex: 30,
      }}
    >
      {/* Main wooden cap - oval shape */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse 60% 40% at 50% 35%, #9a6030 0%, #785020 40%, #5a3818 70%, #3d2510 100%)',
          boxShadow:
            side === 'left'
              ? 'inset 2px 0 3px rgba(255,255,255,0.15), inset -1px 0 2px rgba(0,0,0,0.3), 3px 0 6px rgba(0,0,0,0.4)'
              : 'inset -2px 0 3px rgba(255,255,255,0.15), inset 1px 0 2px rgba(0,0,0,0.3), -3px 0 6px rgba(0,0,0,0.4)',
        }}
      />
      {/* Highlight ring for 3D effect */}
      <div
        className="absolute"
        style={{
          top: '15%',
          left: '20%',
          right: '20%',
          height: '20%',
          borderRadius: '50%',
          background:
            'linear-gradient(180deg, rgba(180,120,60,0.6) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}

/**
 * Roller Bar Component (yellow metallic bar)
 * Replicates the golden cylindrical roller
 */
function RollerBar({ isTop }: { isTop: boolean }) {
  return (
    <div className="flex-1 relative" style={{ marginLeft: -8, marginRight: -8 }}>
      {/* Main yellow metallic bar with smooth gradient */}
      <div
        style={{
          height: 40,
          background: isTop
            ? `linear-gradient(180deg,
                #c9a008 0%,
                #d4b010 8%,
                #e0c020 16%,
                #ecd030 28%,
                #f4dc40 40%,
                #f8e450 52%,
                #fae858 64%,
                #f8e450 76%,
                #f4dc40 88%,
                #ecd030 100%)`
            : `linear-gradient(180deg,
                #ecd030 0%,
                #f4dc40 12%,
                #f8e450 24%,
                #fae858 36%,
                #f8e450 48%,
                #f4dc40 60%,
                #ecd030 72%,
                #e0c020 84%,
                #d4b010 92%,
                #c9a008 100%)`,
          borderRadius: '2px',
        }}
      />
      {/* Subtle shine highlight */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          height: 8,
          top: isTop ? 6 : undefined,
          bottom: isTop ? undefined : 6,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
          transform: isTop ? undefined : 'rotate(180deg)',
        }}
      />
      {/* Red/orange edge where parchment overlaps */}
      <div
        className="absolute left-0 right-0"
        style={{
          height: 5,
          background: 'linear-gradient(180deg, #a83820 0%, #c04828 50%, #b84020 100%)',
          ...(isTop ? { bottom: -2 } : { top: -2 }),
        }}
      />
    </div>
  )
}

/**
 * Side Edge Component (rolled paper visible from side)
 */
function SideEdge({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className="absolute top-0 bottom-0 z-10"
      style={{
        width: 14,
        ...(side === 'left' ? { left: 0 } : { right: 0 }),
        background:
          side === 'left'
            ? 'linear-gradient(90deg, #686868 0%, #888888 25%, #a0a0a0 45%, #b0b0b0 55%, #a09088 75%, #907868 100%)'
            : 'linear-gradient(-90deg, #686868 0%, #888888 25%, #a0a0a0 45%, #b0b0b0 55%, #a09088 75%, #907868 100%)',
        boxShadow:
          side === 'left'
            ? 'inset -2px 0 4px rgba(0,0,0,0.2)'
            : 'inset 2px 0 4px rgba(0,0,0,0.2)',
      }}
    />
  )
}

/**
 * Main ChineseScroll Component
 */
export function ChineseScroll({
  children,
  width = 400,
  height = 500,
  className = '',
  showBorder = true,
}: ChineseScrollProps) {
  const endCapWidth = 24
  const sideEdgeWidth = 14

  return (
    <div
      className={`inline-flex flex-col items-center ${className}`}
      style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))' }}
    >
      {/* Top Roller Assembly */}
      <div
        className="flex items-center relative z-20"
        style={{ width: width + sideEdgeWidth * 2 + endCapWidth * 2 + 16 }}
      >
        <WoodenEndCap side="left" />
        <RollerBar isTop={true} />
        <WoodenEndCap side="right" />
      </div>

      {/* Main Scroll Body */}
      <div
        className="relative"
        style={{
          width: width + sideEdgeWidth * 2,
          marginTop: -4,
        }}
      >
        {/* Side edges */}
        <SideEdge side="left" />
        <SideEdge side="right" />

        {/* Main parchment */}
        <div
          className="relative overflow-hidden"
          style={{
            width: width,
            height: height,
            marginLeft: sideEdgeWidth,
            marginRight: sideEdgeWidth,
            background: '#943020',
          }}
        >
          {/* Subtle vignette effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(160,60,40,0.1) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.15) 100%)',
            }}
          />

          {/* Very subtle wave pattern at top only */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: 120,
              opacity: 0.06,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='50' viewBox='0 0 100 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 25 Q25 5 50 25 Q75 45 100 25' fill='none' stroke='%23000' stroke-width='1.5'/%3E%3C/svg%3E")`,
              backgroundSize: '100px 50px',
              WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 100%)',
              maskImage: 'linear-gradient(180deg, black 0%, transparent 100%)',
            }}
          />

          {/* Meander border */}
          {showBorder && <MeanderBorder width={width} height={height} />}

          {/* Content area */}
          <div className="absolute inset-0 flex items-center justify-center p-16">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Roller Assembly */}
      <div
        className="flex items-center relative z-20"
        style={{
          width: width + sideEdgeWidth * 2 + endCapWidth * 2 + 16,
          marginTop: -4,
        }}
      >
        <WoodenEndCap side="left" />
        <RollerBar isTop={false} />
        <WoodenEndCap side="right" />
      </div>
    </div>
  )
}

export default ChineseScroll
