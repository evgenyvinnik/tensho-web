/**
 * AnimatedTile Component for Tensho Mahjong Roguelike
 *
 * Wrapper component combining TileImage with animations.
 * Integrates tile animations with hover, press, select, and glow effects.
 */

import React, { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { animated, useSpring, to } from '@react-spring/web'
import { Tile } from '../../core/Tile'
import { TileImage, TileSize } from './TileImage'
import { tileSizes } from '../../styles/theme'
import { useSettingsStore } from '../../stores/settingsStore'
import {
  useTileInteractionAnimation,
  useTileShakeAnimation,
  useTileDragAnimation,
} from '../../animations/useTileAnimation'
import { SPRINGS, ANIMATION_COLORS } from '../../animations/constants'

// Minimum distance (px) before drag activates to distinguish from taps
const DRAG_THRESHOLD = 5

export interface AnimatedTileProps {
  /** The tile to display */
  tile: Tile
  /** Size of the tile */
  size?: TileSize
  /** Whether the tile is selected */
  selected?: boolean
  /** Whether the tile is highlighted (e.g., for hints) */
  highlighted?: boolean
  /** Whether the tile is glowing (e.g., winning tile) */
  glowing?: boolean
  /** Whether the tile is disabled */
  disabled?: boolean
  /** Whether to show face-down */
  faceDown?: boolean
  /** Whether the tile must be included in the next played hand. */
  locked?: boolean
  /** Whether the tile contributes no score while still forming structure. */
  debuffed?: boolean
  /** Whether dragging is enabled */
  draggable?: boolean
  /** Click handler */
  onClick?: (tile: Tile) => void
  /** Drag start handler */
  onDragStart?: (tile: Tile) => void
  /** Drag end handler */
  onDragEnd?: (tile: Tile, position: { x: number; y: number }) => void
  /** Invalid action handler (triggers shake) */
  onInvalidAction?: () => void
  /** Animation state for entering/exiting */
  animationState?: 'entering' | 'idle' | 'exiting'
  /** Delay for enter animation */
  enterDelay?: number
  /** Additional CSS class */
  className?: string
  /** Custom style */
  style?: React.CSSProperties
}

/**
 * AnimatedTile component
 * Wraps TileImage with comprehensive animations
 */
export const AnimatedTile: React.FC<AnimatedTileProps> = ({
  tile,
  size = 'medium',
  selected = false,
  highlighted = false,
  glowing = false,
  disabled = false,
  faceDown = false,
  locked = false,
  debuffed = false,
  draggable = false,
  onClick,
  onDragStart,
  onDragEnd,
  onInvalidAction,
  animationState = 'idle',
  enterDelay = 0,
  className = '',
  style,
}) => {
  const { t } = useTranslation()
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const dimensions = tileSizes[size]
  const elementRef = useRef<HTMLDivElement>(null)

  // Track drag start position for smooth offset calculation
  const dragStartRef = useRef<{
    x: number
    y: number
    hasDragged: boolean
  } | null>(null)
  // Track if we're in potential drag mode (pointer down but threshold not reached)
  const [isPotentialDrag, setIsPotentialDrag] = React.useState(false)

  // Interaction animations (hover, press, select, glow)
  const {
    style: interactionStyle,
    spring: interactionSpring,
    handlers: interactionHandlers,
  } = useTileInteractionAnimation({
    isSelected: selected,
    isGlowing: glowing,
    disabled,
  })

  // Shake animation for invalid actions
  const {
    style: _shakeStyle,
    spring: shakeSpring,
    trigger: triggerShake,
  } = useTileShakeAnimation()

  // Drag animation
  const {
    style: dragStyle,
    isDragging,
    startDrag,
    updateDrag,
    endDrag,
  } = useTileDragAnimation()

  // Enter/exit animation spring
  const enterExitSpring = useSpring({
    from: {
      // Idle tiles are core controls and must be visible on the first frame.
      // Only tiles explicitly marked as entering get the deal-in animation.
      opacity: animationState === 'entering' ? 0 : 1,
      x: animationState === 'entering' ? 100 : 0,
      scale: animationState === 'entering' ? 0.8 : 1,
    },
    to: {
      opacity: animationState === 'exiting' ? 0 : 1,
      x: animationState === 'exiting' ? -50 : 0,
      scale: animationState === 'exiting' ? 0.6 : 1,
    },
    delay: animationState === 'entering' && !reducedMotion ? enterDelay : 0,
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  })

  // Handle click - shake to signal the tap was rejected
  const handleClick = useCallback(() => {
    if (disabled) {
      triggerShake()
      onInvalidAction?.()
      return
    }
    onClick?.(tile)
  }, [disabled, onClick, tile, triggerShake, onInvalidAction])

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!draggable || disabled) return

      e.preventDefault()

      // Store initial pointer position
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      dragStartRef.current = { x: clientX, y: clientY, hasDragged: false }
      setIsPotentialDrag(true)

      // Don't start drag animation yet - wait for threshold
    },
    [draggable, disabled]
  )

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current) return

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      const deltaX = clientX - dragStartRef.current.x
      const deltaY = clientY - dragStartRef.current.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Check if we've exceeded the drag threshold
      if (!dragStartRef.current.hasDragged) {
        if (distance >= DRAG_THRESHOLD) {
          dragStartRef.current.hasDragged = true
          startDrag()
          onDragStart?.(tile)
        } else {
          return // Haven't dragged far enough yet
        }
      }

      // Prevent scrolling while dragging on touch devices
      if ('touches' in e) {
        e.preventDefault()
      }

      // Update drag position
      updateDrag(deltaX, deltaY)
    },
    [startDrag, updateDrag, onDragStart, tile]
  )

  const handleDragEnd = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current) return

      const wasDragging = dragStartRef.current.hasDragged
      const clientX =
        'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX
      const clientY =
        'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY

      dragStartRef.current = null
      setIsPotentialDrag(false)

      if (wasDragging) {
        endDrag()
        onDragEnd?.(tile, { x: clientX, y: clientY })
      }
    },
    [endDrag, onDragEnd, tile]
  )

  // Set up global drag listeners when in potential drag or active drag mode
  React.useEffect(() => {
    if (isPotentialDrag || isDragging) {
      const moveHandler = handleDragMove
      const endHandler = handleDragEnd

      window.addEventListener('mousemove', moveHandler)
      window.addEventListener('mouseup', endHandler)
      // Use passive: false for touch events to allow preventDefault
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
  }, [isPotentialDrag, isDragging, handleDragMove, handleDragEnd])

  // Combine all transforms - use drag transform directly when dragging
  // Otherwise combine enter/exit with interaction transforms reactively
  const combinedTransform = isDragging
    ? dragStyle.transform
    : to(
        [
          enterExitSpring.x,
          enterExitSpring.scale,
          interactionSpring.y,
          interactionSpring.scale,
          shakeSpring.x,
        ],
        (enterX, enterScale, interY, interScale, shakeX) => {
          // Calculate shake offset from shake spring
          const shakeOffset =
            shakeX === 0 ? 0 : Math.sin(shakeX * Math.PI * 8) * 5

          // If shaking, prioritize shake transform
          if (shakeOffset !== 0) {
            return `translateX(${shakeOffset}px)`
          }

          // Combine enter/exit transform with interaction transform
          const totalX = enterX
          const totalY = interY
          const totalScale = enterScale * interScale

          return `translate(${totalX}px, ${totalY}px) scale(${totalScale})`
        }
      )

  const combinedStyle = {
    ...style,
    width: dimensions.width,
    height: dimensions.height,
    transform: combinedTransform,
    opacity: isDragging ? dragStyle.opacity : enterExitSpring.opacity,
    boxShadow: isDragging ? dragStyle.boxShadow : interactionStyle.boxShadow,
    cursor: disabled
      ? 'not-allowed'
      : isDragging
        ? 'grabbing'
        : draggable
          ? 'grab'
          : onClick
            ? 'pointer'
            : 'default',
    // Prevent scroll interference while dragging
    touchAction: draggable ? 'none' : 'auto',
    // Ensure dragged tile appears above others
    zIndex: isDragging ? 1000 : undefined,
    // Smooth will-change hint for performance
    willChange: isDragging ? 'transform, opacity' : 'auto',
  }

  return (
    <animated.div
      ref={elementRef}
      className={`relative inline-block ${className}`}
      style={combinedStyle}
      onClick={handleClick}
      onMouseDown={draggable ? handleDragStart : undefined}
      onTouchStart={draggable ? handleDragStart : undefined}
      {...(!draggable ? interactionHandlers : {})}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-pressed={onClick ? selected : undefined}
      aria-disabled={disabled}
    >
      <TileImage
        tile={tile}
        size={size}
        selected={selected}
        highlighted={highlighted}
        disabled={disabled}
        faceDown={faceDown}
        className="w-full h-full"
      />

      {debuffed && (
        <div
          className="absolute inset-0 pointer-events-none rounded bg-slate-950/45 ring-2 ring-slate-400/70"
          title={t('tiles.debuffed', 'Debuffed tile')}
          aria-hidden="true"
        >
          <span className="absolute left-1 top-1 rounded bg-slate-950/90 px-1 text-xs text-slate-100">
            🚫
          </span>
        </div>
      )}

      {locked && (
        <div
          className="absolute inset-0 pointer-events-none rounded ring-2 ring-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.75)]"
          title={t('tiles.lockedMustPlay', 'Locked tile: must be played')}
          aria-hidden="true"
        >
          <span className="absolute right-0.5 top-0.5 rounded bg-cyan-950/90 px-1 text-xs text-cyan-100">
            🔒
          </span>
        </div>
      )}

      {/* Glow overlay */}
      {glowing && (
        <animated.div
          className="absolute inset-0 pointer-events-none rounded"
          style={{
            boxShadow: `0 0 20px 10px ${ANIMATION_COLORS.gold}`,
            opacity: 0.6,
          }}
        />
      )}

      {/* Drag indicator */}
      {isDragging && (
        <div
          className="absolute inset-0 pointer-events-none rounded"
          style={{
            border: `2px dashed ${ANIMATION_COLORS.orange}`,
            backgroundColor: `${ANIMATION_COLORS.orange}22`,
          }}
        />
      )}
    </animated.div>
  )
}

/**
 * AnimatedTileRow component
 * Row of animated tiles with staggered animations
 */
export interface AnimatedTileRowProps {
  tiles: Tile[]
  size?: TileSize
  selectedIds?: Set<string>
  highlightedIds?: Set<string>
  glowingIds?: Set<string>
  onTileClick?: (tile: Tile) => void
  overlap?: boolean
  staggerDelay?: number
  className?: string
}

export const AnimatedTileRow: React.FC<AnimatedTileRowProps> = ({
  tiles,
  size = 'medium',
  selectedIds = new Set(),
  highlightedIds = new Set(),
  glowingIds = new Set(),
  onTileClick,
  overlap = false,
  staggerDelay = 50,
  className = '',
}) => {
  const { t } = useTranslation()
  const dimensions = tileSizes[size]
  const overlapAmount = overlap ? Math.floor(dimensions.width * 0.3) : 0

  return (
    <div
      className={`flex items-end ${className}`}
      role="group"
      aria-label={t('tiles.tileRow', 'Tile row')}
    >
      {tiles.map((tile, index) => (
        <div
          key={tile.id}
          style={{
            marginLeft: index > 0 && overlap ? -overlapAmount : 0,
            zIndex: index,
          }}
        >
          <AnimatedTile
            tile={tile}
            size={size}
            selected={selectedIds.has(tile.id)}
            highlighted={highlightedIds.has(tile.id)}
            glowing={glowingIds.has(tile.id)}
            onClick={onTileClick}
            animationState="entering"
            enterDelay={index * staggerDelay}
          />
        </div>
      ))}
    </div>
  )
}

export default AnimatedTile
