/**
 * Animated Hand Components
 *
 * Components for displaying and animating tile hands.
 */

import React, { useCallback, useMemo, useRef, useState, useLayoutEffect } from 'react'
import { animated, useTransition, useSprings, useSpring, to } from '@react-spring/web'
import { Tile } from '../../../core/Tile'
import { AnimatedTile } from '../../tiles/AnimatedTile'
import { TileSize, tileSizes } from '../../../styles/theme'
import { useSettingsStore } from '../../../stores/settingsStore'
import { SPRINGS, STAGGER } from '../../../animations/constants'
import { calculateFannedPositions, calculateStraightPositions } from './positionUtils'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for AnimatedHand component
 */
export interface AnimatedHandProps {
  /** Array of tiles in the hand */
  tiles: Tile[]
  /** Size of tiles to display */
  size?: TileSize
  /** Set of selected tile IDs */
  selectedIds?: Set<string>
  /** Set of highlighted tile IDs */
  highlightedIds?: Set<string>
  /** Set of glowing tile IDs (winning tiles) */
  glowingIds?: Set<string>
  /** Handler for tile click */
  onTileClick?: (tile: Tile) => void
  /** Handler for tile drag start */
  onDragStart?: (tile: Tile) => void
  /** Handler for tile drag end */
  onDragEnd?: (tile: Tile, position: { x: number; y: number }) => void
  /** Handler for tile discard (drag-to-discard) */
  onTileDiscard?: (tile: Tile) => void
  /** Whether to allow tile dragging */
  draggable?: boolean
  /** Whether to fan tiles out (false = straight line) */
  fanned?: boolean
  /** Maximum fan angle in degrees */
  maxFanAngle?: number
  /** Whether to overlap tiles */
  overlap?: boolean
  /** Whether the hand is disabled */
  disabled?: boolean
  /** Additional CSS class */
  className?: string
  /** Layout direction */
  layout?: 'horizontal' | 'vertical'
}

/**
 * Props for HandWithDiscardZone component
 */
export interface HandWithDiscardZoneProps extends Omit<AnimatedHandProps, 'onDragStart' | 'onDragEnd'> {
  /** Label for the discard zone */
  discardZoneLabel?: string
}

/**
 * Props for CompactHand component
 */
export interface CompactHandProps {
  /** Number of tiles (for face-down display) or actual tiles */
  tiles: Tile[] | number
  /** Size of tiles */
  size?: TileSize
  /** Whether tiles are face down */
  faceDown?: boolean
  /** Additional CSS class */
  className?: string
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * AnimatedHand component
 */
export const AnimatedHand: React.FC<AnimatedHandProps> = ({
  tiles,
  size = 'medium',
  selectedIds = new Set(),
  highlightedIds = new Set(),
  glowingIds = new Set(),
  onTileClick,
  onDragStart,
  onDragEnd,
  onTileDiscard,
  draggable = false,
  fanned = false,
  maxFanAngle = 15,
  overlap = true,
  disabled = false,
  className = '',
  layout: _layout = 'horizontal',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const dimensions = tileSizes[size]

  // Track previous tiles for animation
  const previousTilesRef = useRef<Tile[]>([])

  // Calculate positions based on layout type
  const positions = useMemo(() => {
    if (fanned) {
      return calculateFannedPositions(tiles.length, dimensions.width, maxFanAngle, overlap)
    }
    return calculateStraightPositions(tiles.length, dimensions.width, overlap)
  }, [tiles.length, dimensions.width, maxFanAngle, overlap, fanned])

  // Springs for smooth position transitions when sorting
  const [_springs, _api] = useSprings(
    tiles.length,
    (index) => ({
      x: positions[index]?.x ?? 0,
      rotation: positions[index]?.rotation ?? 0,
      scale: 1,
      opacity: 1,
      config: SPRINGS.snappy,
      immediate: reducedMotion,
    }),
    [positions, reducedMotion]
  )

  // Transition for adding/removing tiles
  const transitions = useTransition(tiles, {
    keys: (tile) => tile.id,
    from: (tile) => {
      // Check if this is a new tile (not in previous list)
      const isNew = !previousTilesRef.current.some((t) => t.id === tile.id)
      return {
        opacity: 0,
        x: isNew ? 100 : 0, // Slide in from right if new
        scale: 0.8,
      }
    },
    enter: (_tile, index) => ({
      opacity: 1,
      x: positions[index]?.x ?? 0,
      scale: 1,
    }),
    update: (tile, index) => ({
      x: positions[index]?.x ?? 0,
      scale: selectedIds.has(tile.id) ? 1.05 : 1,
    }),
    leave: {
      opacity: 0,
      x: -50, // Slide out to left
      scale: 0.6,
    },
    config: SPRINGS.snappy,
    immediate: reducedMotion,
    trail: reducedMotion ? 0 : STAGGER.fast,
    // Re-run transitions when positions change (e.g., due to size change)
    deps: [positions, selectedIds],
    // Cleanup callback when animation completes
    onRest: (_result, _ctrl, _item) => {
      // Animation completed - item will be removed from DOM if it was leaving
      // This helps ensure proper cleanup of exited items
    },
    // Ensure exiting items are fully removed
    expires: true,
  })

  // Update previous tiles reference BEFORE paint using useLayoutEffect
  // This prevents race condition where transition sees stale previousTilesRef
  useLayoutEffect(() => {
    previousTilesRef.current = tiles
  }, [tiles])

  // Handle tile click
  const handleTileClick = useCallback(
    (tile: Tile) => {
      if (!disabled && onTileClick) {
        onTileClick(tile)
      }
    },
    [disabled, onTileClick]
  )

  // Handle drag start
  const handleDragStart = useCallback(
    (tile: Tile) => {
      onDragStart?.(tile)
    },
    [onDragStart]
  )

  // Handle drag end (check if in discard zone)
  const handleDragEnd = useCallback(
    (tile: Tile, position: { x: number; y: number }) => {
      // Call the onDragEnd callback if provided
      onDragEnd?.(tile, position)

      // Check if the tile was dragged high enough to discard
      // This could be more sophisticated with an actual discard zone detection
      const viewportHeight = window.innerHeight
      if (position.y < viewportHeight * 0.4 && onTileDiscard) {
        onTileDiscard(tile)
      }
    },
    [onDragEnd, onTileDiscard]
  )

  // Calculate container dimensions
  const containerWidth = useMemo(() => {
    if (tiles.length === 0) return 0
    const overlapFactor = overlap ? 0.7 : 1
    const totalWidth = (tiles.length - 1) * dimensions.width * overlapFactor + dimensions.width
    return totalWidth
  }, [tiles.length, dimensions.width, overlap])

  return (
    <div
      className={`relative flex justify-center items-end ${className}`}
      style={{
        minHeight: dimensions.height + 20, // Extra space for lift animation
        width: '100%',
      }}
      role="group"
      aria-label="Player hand"
    >
      {/* Container for centered positioning */}
      <div
        className="relative"
        style={{
          width: containerWidth,
          height: dimensions.height,
        }}
      >
        {transitions((style: any, tile, _, index) => {
          const position = positions[index] || { x: 0, rotation: 0, zIndex: index }

          return (
            <animated.div
              key={tile.id}
              className="absolute"
              style={{
                left: '50%',
                bottom: 0,
                opacity: style.opacity,
                transform: to(
                  [style.x, style.scale],
                  (x, scale) =>
                    `translateX(calc(-50% + ${x}px)) rotate(${position.rotation}deg) scale(${scale})`
                ),
                zIndex: position.zIndex,
              }}
            >
              <AnimatedTile
                tile={tile}
                size={size}
                selected={selectedIds.has(tile.id)}
                highlighted={highlightedIds.has(tile.id)}
                glowing={glowingIds.has(tile.id)}
                disabled={disabled}
                draggable={draggable && !disabled}
                onClick={handleTileClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            </animated.div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * HandWithDiscardZone component
 * Combines AnimatedHand with a visual discard zone
 */
export const HandWithDiscardZone: React.FC<HandWithDiscardZoneProps> = ({
  discardZoneLabel = 'Drag here to discard',
  ...handProps
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const [isDragging, setIsDragging] = useState(false)
  const [isNearZone, setIsNearZone] = useState(false)

  // Handle drag start - show discard zone
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  // Handle drag end - hide discard zone
  const handleDragEnd = useCallback((_tile: Tile, position: { x: number; y: number }) => {
    setIsDragging(false)
    setIsNearZone(false)
    // Check if near discard zone for visual feedback
    const viewportHeight = window.innerHeight
    if (position.y < viewportHeight * 0.4) {
      // Will be discarded - flash effect handled by parent
    }
  }, [])

  // Track mouse/touch position to show "near zone" effect
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const viewportHeight = window.innerHeight
    setIsNearZone(clientY < viewportHeight * 0.45)
  }, [isDragging])

  // Add global move listener when dragging
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('touchmove', handleDragMove, { passive: true })
      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('touchmove', handleDragMove)
      }
    }
  }, [isDragging, handleDragMove])

  // Animate discard zone visibility with enhanced effects
  const discardZoneSpring = useSpring({
    opacity: isDragging ? 1 : 0,
    y: isDragging ? 0 : -30,
    scale: isNearZone ? 1.1 : 1,
    glowIntensity: isNearZone ? 1 : 0,
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  })

  return (
    <div className="relative w-full">
      {/* Discard zone (only render when dragging to avoid z-index conflicts) */}
      {isDragging && (
        <animated.div
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-6"
          style={{
            opacity: discardZoneSpring.opacity,
            transform: to(
              [discardZoneSpring.y, discardZoneSpring.scale],
              (y, scale) => `translateY(${y}px) scale(${scale})`
            ),
            pointerEvents: 'auto',
            zIndex: 100,
          }}
        >
          <animated.div
            className="px-10 py-5 rounded-xl border-3 border-dashed font-bold text-lg"
            style={{
              borderColor: isNearZone ? '#FF5722' : '#FF8A65',
              backgroundColor: isNearZone ? 'rgba(255, 87, 34, 0.25)' : 'rgba(255, 87, 34, 0.1)',
              color: isNearZone ? '#FF5722' : '#FF8A65',
              boxShadow: discardZoneSpring.glowIntensity.to(
                (i) => `0 0 ${i * 30}px rgba(255, 87, 34, ${i * 0.5}), inset 0 0 ${i * 20}px rgba(255, 87, 34, ${i * 0.2})`
              ),
              transition: 'border-color 0.15s, background-color 0.15s, color 0.15s',
            }}
          >
            {isNearZone ? '🗑️ Release to Discard!' : discardZoneLabel}
          </animated.div>
        </animated.div>
      )}

      {/* Hand */}
      <AnimatedHand
        {...handProps}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </div>
  )
}

/**
 * CompactHand component
 * Smaller hand display for opponent or UI previews
 */
export const CompactHand: React.FC<CompactHandProps> = ({
  tiles,
  size = 'small',
  faceDown = false,
  className = '',
}) => {
  const dimensions = tileSizes[size]
  const tileCount = typeof tiles === 'number' ? tiles : tiles.length
  const actualTiles = typeof tiles === 'number' ? null : tiles

  const overlapFactor = 0.5 // More overlap for compact display
  const visibleWidth = dimensions.width * overlapFactor

  return (
    <div
      className={`flex ${className}`}
      role="group"
      aria-label={faceDown ? `${tileCount} hidden tiles` : 'Tile hand'}
    >
      {Array.from({ length: tileCount }).map((_, index) => {
        const tile = actualTiles?.[index]

        return (
          <div
            key={tile?.id ?? index}
            style={{
              marginLeft: index > 0 ? -visibleWidth : 0,
              zIndex: index,
            }}
          >
            {tile && !faceDown ? (
              <AnimatedTile
                tile={tile}
                size={size}
                disabled
              />
            ) : (
              <div
                style={{
                  width: dimensions.width,
                  height: dimensions.height,
                  backgroundColor: '#4A5568',
                  borderRadius: 4,
                  border: '1px solid #2D3748',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
