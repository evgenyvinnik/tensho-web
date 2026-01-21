/**
 * PlaySurface Component
 *
 * A redesigned, intuitive play surface for the Tensho Mahjong Roguelike.
 * Features:
 * - Always-visible discard zone at the top
 * - Central staging area where tiles can be freely arranged
 * - Hand area at the bottom with smooth drag-and-drop
 * - Clear visual hierarchy and feedback
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useSpring, animated, to, config } from '@react-spring/web'
import { Tile } from '../../core/Tile'
import { AnimatedTile } from '../tiles/AnimatedTile'
import { TileSize, tileSizes } from '../../styles/theme'
import { useSettingsStore } from '../../stores/settingsStore'

// =============================================================================
// TYPES
// =============================================================================

export interface PlaySurfaceProps {
  /** Tiles in hand */
  handTiles: Tile[]
  /** Size of tiles */
  tileSize?: TileSize
  /** Selected tile IDs */
  selectedIds?: Set<string>
  /** Glowing tile IDs (winning tiles) */
  glowingIds?: Set<string>
  /** Handler for tile selection */
  onTileSelect?: (tile: Tile) => void
  /** Handler for tile discard */
  onTileDiscard?: (tile: Tile) => void
  /** Handler when tiles are staged for play */
  onTilesStaged?: (tiles: Tile[]) => void
  /** Whether interactions are disabled */
  disabled?: boolean
  /** Shanten display text */
  shantenDisplay?: string
  /** Hands remaining */
  handsRemaining?: number
  /** Discards remaining */
  discardsRemaining?: number
  /** Translation function */
  t?: (key: string) => string
}

interface DragState {
  tile: Tile
  startX: number
  startY: number
  currentX: number
  currentY: number
  originZone: 'hand' | 'staging'
}

type DropZone = 'hand' | 'staging' | 'discard' | null

// =============================================================================
// CONSTANTS
// =============================================================================

const DISCARD_ZONE_HEIGHT = 80
const STAGING_ZONE_MIN_HEIGHT = 120
const HAND_ZONE_HEIGHT = 140

// =============================================================================
// PLAY SURFACE COMPONENT
// =============================================================================

export const PlaySurface: React.FC<PlaySurfaceProps> = ({
  handTiles,
  tileSize = 'medium',
  selectedIds = new Set(),
  glowingIds = new Set(),
  onTileSelect,
  onTileDiscard,
  onTilesStaged,
  disabled = false,
  shantenDisplay = '',
  handsRemaining = 0,
  discardsRemaining = 0,
  t = (key) => key,
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const dimensions = tileSizes[tileSize]

  // Refs for zone detection
  const containerRef = useRef<HTMLDivElement>(null)
  const discardZoneRef = useRef<HTMLDivElement>(null)
  const stagingZoneRef = useRef<HTMLDivElement>(null)
  const handZoneRef = useRef<HTMLDivElement>(null)

  // Drag state
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [currentDropZone, setCurrentDropZone] = useState<DropZone>(null)

  // Staged tiles (tiles moved to staging area)
  const [stagedTiles, setStagedTiles] = useState<Tile[]>([])

  // Tiles remaining in hand (excluding staged)
  const tilesInHand = useMemo(() => {
    const stagedIds = new Set(stagedTiles.map(t => t.id))
    return handTiles.filter(t => !stagedIds.has(t.id))
  }, [handTiles, stagedTiles])

  // Determine which zone a point is in
  const getDropZone = useCallback((x: number, y: number): DropZone => {
    if (!containerRef.current) return null

    const containerRect = containerRef.current.getBoundingClientRect()
    const relativeY = y - containerRect.top

    // Discard zone is at the top
    if (relativeY < DISCARD_ZONE_HEIGHT) {
      return 'discard'
    }

    // Hand zone is at the bottom
    const handZoneTop = containerRect.height - HAND_ZONE_HEIGHT
    if (relativeY > handZoneTop) {
      return 'hand'
    }

    // Everything else is staging
    return 'staging'
  }, [])

  // Handle drag start
  const handleDragStart = useCallback((tile: Tile, e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    // Determine origin zone
    const originZone = stagedTiles.some(t => t.id === tile.id) ? 'staging' : 'hand'

    setDragState({
      tile,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      originZone,
    })
  }, [disabled, stagedTiles])

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    setDragState(prev => prev ? {
      ...prev,
      currentX: clientX,
      currentY: clientY,
    } : null)

    // Update current drop zone for visual feedback
    const zone = getDropZone(clientX, clientY)
    setCurrentDropZone(zone)
  }, [dragState, getDropZone])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!dragState) return

    const dropZone = getDropZone(dragState.currentX, dragState.currentY)
    const { tile, originZone } = dragState

    if (dropZone === 'discard') {
      // Discard the tile
      onTileDiscard?.(tile)
      // Remove from staged if it was there
      setStagedTiles(prev => prev.filter(t => t.id !== tile.id))
    } else if (dropZone === 'staging' && originZone === 'hand') {
      // Move from hand to staging
      setStagedTiles(prev => [...prev, tile])
    } else if (dropZone === 'hand' && originZone === 'staging') {
      // Move from staging back to hand
      setStagedTiles(prev => prev.filter(t => t.id !== tile.id))
    }
    // If dropped in same zone, just reset

    setDragState(null)
    setCurrentDropZone(null)
  }, [dragState, getDropZone, onTileDiscard])

  // Global event listeners for drag
  useEffect(() => {
    if (dragState) {
      const moveHandler = (e: MouseEvent | TouchEvent) => {
        e.preventDefault()
        handleDragMove(e)
      }
      const endHandler = () => handleDragEnd()

      window.addEventListener('mousemove', moveHandler)
      window.addEventListener('mouseup', endHandler)
      window.addEventListener('touchmove', moveHandler, { passive: false })
      window.addEventListener('touchend', endHandler)
      window.addEventListener('touchcancel', endHandler)

      return () => {
        window.removeEventListener('mousemove', moveHandler)
        window.removeEventListener('mouseup', endHandler)
        window.removeEventListener('touchmove', moveHandler)
        window.removeEventListener('touchend', endHandler)
        window.removeEventListener('touchcancel', endHandler)
      }
    }
  }, [dragState, handleDragMove, handleDragEnd])

  // Notify parent when staged tiles change
  useEffect(() => {
    onTilesStaged?.(stagedTiles)
  }, [stagedTiles, onTilesStaged])

  // Clear staged tiles when hand changes significantly
  useEffect(() => {
    const handIds = new Set(handTiles.map(t => t.id))
    setStagedTiles(prev => prev.filter(t => handIds.has(t.id)))
  }, [handTiles])

  // Discard zone spring animation
  const discardZoneSpring = useSpring({
    scale: currentDropZone === 'discard' ? 1.05 : 1,
    glowIntensity: currentDropZone === 'discard' ? 1 : dragState ? 0.3 : 0,
    backgroundColor: currentDropZone === 'discard'
      ? 'rgba(239, 68, 68, 0.3)'
      : dragState
        ? 'rgba(239, 68, 68, 0.1)'
        : 'rgba(239, 68, 68, 0.05)',
    borderColor: currentDropZone === 'discard'
      ? '#EF4444'
      : dragState
        ? '#F87171'
        : '#7F1D1D',
    config: config.stiff,
    immediate: reducedMotion,
  })

  // Staging zone active state (moved before springs that use it)
  const stagingZoneActive = stagedTiles.length > 0 || dragState !== null

  // Staging zone spring animation
  const stagingZoneSpring = useSpring({
    scale: currentDropZone === 'staging' ? 1.01 : 1,
    borderOpacity: currentDropZone === 'staging' ? 1 : stagingZoneActive ? 0.6 : 0.3,
    glowIntensity: currentDropZone === 'staging' ? 0.5 : 0,
    config: config.stiff,
    immediate: reducedMotion,
  })

  // Hand zone spring animation
  const handZoneSpring = useSpring({
    brightness: currentDropZone === 'hand' ? 1.1 : 1,
    config: config.stiff,
    immediate: reducedMotion,
  })

  // Calculate hand tile positions
  const handPositions = useMemo(() => {
    const tiles = tilesInHand
    const overlapFactor = 0.7
    const spacing = dimensions.width * overlapFactor
    const totalWidth = Math.max(0, (tiles.length - 1)) * spacing + dimensions.width
    const startX = -totalWidth / 2 + dimensions.width / 2

    return tiles.map((_, index) => ({
      x: startX + index * spacing,
      zIndex: index,
    }))
  }, [tilesInHand, dimensions.width])

  // Calculate staged tile positions (spread evenly in staging area)
  const stagedPositions = useMemo(() => {
    const tiles = stagedTiles
    const spacing = dimensions.width * 0.8
    const totalWidth = Math.max(0, (tiles.length - 1)) * spacing + dimensions.width
    const startX = -totalWidth / 2 + dimensions.width / 2

    return tiles.map((_, index) => ({
      x: startX + index * spacing,
      zIndex: index,
    }))
  }, [stagedTiles, dimensions.width])

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col select-none"
      style={{
        height: DISCARD_ZONE_HEIGHT + STAGING_ZONE_MIN_HEIGHT + HAND_ZONE_HEIGHT,
        touchAction: 'none',
      }}
    >
      {/* ===== DISCARD ZONE ===== */}
      <animated.div
        ref={discardZoneRef}
        className="relative flex items-center justify-center border-2 border-dashed rounded-xl mx-2"
        style={{
          height: DISCARD_ZONE_HEIGHT,
          backgroundColor: discardZoneSpring.backgroundColor,
          borderColor: discardZoneSpring.borderColor,
          transform: discardZoneSpring.scale.to(s => `scale(${s})`),
          boxShadow: discardZoneSpring.glowIntensity.to(
            i => `0 0 ${i * 30}px rgba(239, 68, 68, ${i * 0.5}), inset 0 0 ${i * 20}px rgba(239, 68, 68, ${i * 0.2})`
          ),
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗑️</span>
          <span
            className="text-lg font-bold tracking-wide uppercase"
            style={{
              color: currentDropZone === 'discard' ? '#EF4444' : '#F87171',
              textShadow: currentDropZone === 'discard' ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
            }}
          >
            {currentDropZone === 'discard' ? 'Release to Discard!' : 'Discard Zone'}
          </span>
          {discardsRemaining > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-900/50 text-red-300 text-sm font-medium">
              {discardsRemaining} left
            </span>
          )}
        </div>
      </animated.div>

      {/* ===== STAGING/PLAY ZONE ===== */}
      <animated.div
        ref={stagingZoneRef}
        className="relative flex-1 flex flex-col items-center justify-center mx-2 my-2 rounded-xl border-2"
        style={{
          minHeight: STAGING_ZONE_MIN_HEIGHT,
          backgroundColor: 'rgba(45, 95, 74, 0.3)',
          borderColor: stagingZoneSpring.borderOpacity.to(o => `rgba(255, 213, 79, ${o * 0.5})`),
          borderStyle: stagedTiles.length > 0 ? 'solid' : 'dashed',
          transform: stagingZoneSpring.scale.to(s => `scale(${s})`),
          boxShadow: stagingZoneSpring.glowIntensity.to(
            i => `inset 0 0 ${i * 30}px rgba(255, 213, 79, ${i * 0.2})`
          ),
        }}
      >
        {stagedTiles.length > 0 ? (
          <>
            {/* Staged tiles */}
            <div
              className="relative flex items-center justify-center"
              style={{
                width: '100%',
                height: dimensions.height + 20,
              }}
            >
              {stagedTiles.map((tile, index) => {
                const position = stagedPositions[index]
                const isDraggingThis = dragState?.tile.id === tile.id

                return (
                  <div
                    key={tile.id}
                    className="absolute transition-transform"
                    style={{
                      left: '50%',
                      transform: `translateX(calc(-50% + ${position.x}px))`,
                      zIndex: isDraggingThis ? 1000 : position.zIndex,
                      opacity: isDraggingThis ? 0.5 : 1,
                    }}
                  >
                    <AnimatedTile
                      tile={tile}
                      size={tileSize}
                      selected={selectedIds.has(tile.id)}
                      glowing={glowingIds.has(tile.id)}
                      disabled={disabled}
                      draggable={!disabled}
                      onClick={() => onTileSelect?.(tile)}
                      onDragStart={(t) => handleDragStart(t, {} as React.MouseEvent)}
                    />
                  </div>
                )
              })}
            </div>

            {/* Shanten display when tiles staged */}
            <div className="mt-2 px-4 py-1.5 rounded-full bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)]">
              <span className="text-[var(--color-golden-yellow)] font-bold">{shantenDisplay}</span>
            </div>
          </>
        ) : (
          <div className="text-center px-6">
            <p className="text-[var(--color-beige-white)] text-lg font-medium opacity-70">
              Drag tiles here to stage
            </p>
            <p className="text-[var(--color-beige-white)] text-sm opacity-50 mt-1">
              Arrange your hand before playing
            </p>
          </div>
        )}
      </animated.div>

      {/* ===== HAND ZONE ===== */}
      <animated.div
        ref={handZoneRef}
        className="relative flex items-center justify-center px-2 rounded-t-xl"
        style={{
          height: HAND_ZONE_HEIGHT,
          backgroundColor: 'rgba(28, 58, 46, 0.8)',
          filter: handZoneSpring.brightness.to(b => `brightness(${b})`),
        }}
      >
        {/* Hand header */}
        <div className="absolute top-2 left-4 flex items-center gap-3">
          <span className="text-[var(--color-beige-white)] text-sm opacity-70">
            Hand ({tilesInHand.length})
          </span>
          <span className="text-blue-400 text-sm">
            🖐 {handsRemaining}
          </span>
        </div>

        {/* Hand tiles */}
        <div
          className="relative flex items-end justify-center"
          style={{
            width: '100%',
            height: dimensions.height + 30,
            marginTop: 20,
          }}
        >
          {tilesInHand.map((tile, index) => {
            const position = handPositions[index]
            const isDraggingThis = dragState?.tile.id === tile.id

            return (
              <div
                key={tile.id}
                className="absolute transition-transform"
                style={{
                  left: '50%',
                  bottom: 10,
                  transform: `translateX(calc(-50% + ${position.x}px))`,
                  zIndex: isDraggingThis ? 1000 : position.zIndex,
                  opacity: isDraggingThis ? 0.5 : 1,
                }}
                onMouseDown={(e) => handleDragStart(tile, e)}
                onTouchStart={(e) => handleDragStart(tile, e)}
              >
                <AnimatedTile
                  tile={tile}
                  size={tileSize}
                  selected={selectedIds.has(tile.id)}
                  glowing={glowingIds.has(tile.id)}
                  disabled={disabled}
                  onClick={() => onTileSelect?.(tile)}
                />
              </div>
            )
          })}
        </div>
      </animated.div>

      {/* ===== DRAGGING TILE OVERLAY ===== */}
      {dragState && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: dragState.currentX - dimensions.width / 2,
            top: dragState.currentY - dimensions.height / 2,
            zIndex: 9999,
            transform: 'scale(1.15)',
            filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4))',
          }}
        >
          <AnimatedTile
            tile={dragState.tile}
            size={tileSize}
            selected={selectedIds.has(dragState.tile.id)}
            glowing={glowingIds.has(dragState.tile.id)}
            disabled
          />
        </div>
      )}
    </div>
  )
}

export default PlaySurface
