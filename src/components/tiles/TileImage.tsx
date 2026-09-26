/**
 * TileImage Component for Tensho Mahjong Roguelike
 * Displays tile images with support for different sizes, states, and tooltips
 */

import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useId,
  useCallback,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Tile } from '../../core/Tile'
import { tileDetails } from '../../i18n/tileText'
import { getTileImagePath, getTileBackPath } from '../../utils/assets'
import { tileSizes } from '../../styles/theme'
import { ModifierOverlay } from '../ui/TileModifierDisplay'

export type TileSize = 'small' | 'medium' | 'large' | 'xlarge'

export interface TileImageProps {
  /** The tile to display, or null/undefined for face-down */
  tile?: Tile | null
  /** Size of the tile */
  size?: TileSize
  /** Whether the tile is selected */
  selected?: boolean
  /** Whether the tile is highlighted (e.g., for hints) */
  highlighted?: boolean
  /** Whether the tile is disabled (not interactive) */
  disabled?: boolean
  /** Whether to show the tile face-down */
  faceDown?: boolean
  /** Click handler */
  onClick?: (tile: Tile) => void
  /** Whether to show tooltip on hover */
  showTooltip?: boolean
  /** A surrounding native tile button can expose details on keyboard focus. */
  detailsVisible?: boolean
  /** Connect a surrounding tile button's aria-describedby to these details. */
  tooltipId?: string
  /** A keyboard-focused sibling can take precedence over passive mouse hover. */
  allowHover?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Get the image path for a tile
 */
function getTileSrc(tile: Tile | null | undefined, faceDown: boolean): string {
  if (faceDown || !tile) {
    return getTileBackPath()
  }
  return getTileImagePath(tile.suit, tile.rank)
}

/**
 * TileImage component displays a single mahjong tile
 */
export const TileImage: React.FC<TileImageProps> = ({
  tile,
  size = 'medium',
  selected = false,
  highlighted = false,
  disabled = false,
  faceDown = false,
  onClick,
  showTooltip = true,
  detailsVisible = false,
  tooltipId: suppliedTooltipId,
  allowHover = true,
  className = '',
}) => {
  const { t, i18n } = useTranslation()
  const [isHovering, setIsHovering] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const generatedTooltipId = useId()
  const tooltipId = suppliedTooltipId ?? generatedTooltipId
  const tooltipOpen =
    showTooltip &&
    !!tile &&
    !faceDown &&
    !dismissed &&
    ((isHovering && allowHover) || isFocused || detailsVisible)
  const dimensions = tileSizes[size]
  const src = getTileSrc(tile, faceDown)
  const tileInfo = tileDetails(tile, t, i18n.language, faceDown)

  const handleClick = () => {
    if (!disabled && tile && onClick) {
      onClick(tile)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && tile && onClick) {
      e.preventDefault()
      onClick(tile)
    }
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    if (
      event.pointerType === 'mouse' &&
      window.matchMedia('(any-hover: hover)').matches &&
      showTooltip &&
      tile &&
      !faceDown
    ) {
      // A pointerenter can come from a layout shift beneath a stationary
      // cursor. Only actual pointer movement opens passive hover details.
      // Keyboard-owned details stay dismissed until the next focus session.
      if (!detailsVisible && !isFocused) setDismissed(false)
      setIsHovering(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const positionTooltip = useCallback(() => {
    const anchor = anchorRef.current?.getBoundingClientRect()
    const popup = tooltipRef.current
    if (!anchor || !popup) return
    const viewport = window.visualViewport
    const left = viewport?.offsetLeft ?? 0
    const top = viewport?.offsetTop ?? 0
    const width = viewport?.width ?? window.innerWidth
    const height = viewport?.height ?? window.innerHeight
    const popupWidth = Math.max(0, Math.min(260, width - 24))
    popup.style.width = `${popupWidth}px`
    popup.style.maxHeight = `${Math.max(0, height - 24)}px`
    const popupHeight = popup.getBoundingClientRect().height
    popup.style.left = `${Math.max(left + 12, Math.min(anchor.left + anchor.width / 2 - popupWidth / 2, left + width - popupWidth - 12))}px`
    const preferredTop =
      anchor.top - popupHeight - 8 >= top + 12
        ? anchor.top - popupHeight - 8
        : anchor.bottom + 8
    popup.style.top = `${Math.max(top + 12, Math.min(preferredTop, top + height - popupHeight - 12))}px`
  }, [])

  // Portal geometry cannot change a tile button's hit area while it is clicked.
  useLayoutEffect(() => {
    if (tooltipOpen) positionTooltip()
  })
  useEffect(() => {
    if (!tooltipOpen) return
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDismissed(true)
    }
    window.addEventListener('resize', positionTooltip)
    window.addEventListener('scroll', positionTooltip, true)
    window.visualViewport?.addEventListener('resize', positionTooltip)
    window.visualViewport?.addEventListener('scroll', positionTooltip)
    document.addEventListener('keydown', escape)
    return () => {
      window.removeEventListener('resize', positionTooltip)
      window.removeEventListener('scroll', positionTooltip, true)
      window.visualViewport?.removeEventListener('resize', positionTooltip)
      window.visualViewport?.removeEventListener('scroll', positionTooltip)
      document.removeEventListener('keydown', escape)
    }
  }, [tooltipOpen, positionTooltip])
  useEffect(() => {
    if (!detailsVisible && !isFocused && !isHovering) setDismissed(false)
  }, [detailsVisible, isFocused, isHovering])

  // Build dynamic classes
  const containerClasses = [
    'relative inline-block',
    'transition-all duration-150 ease-out',
    // Base tile styling - subtle border and shadow for visibility
    'rounded-md',
    'border border-amber-800/30',
    'shadow-sm shadow-black/20',
    // Selection state
    selected &&
      'ring-2 ring-golden-yellow ring-offset-2 ring-offset-dark-forest -translate-y-2 shadow-lg shadow-golden-yellow/30',
    // Highlighted state
    highlighted && !selected && 'ring-2 ring-vibrant-orange ring-offset-1',
    // Disabled state
    disabled && 'opacity-50 grayscale',
    // Interactive state
    !disabled &&
      onClick &&
      'cursor-pointer hover:-translate-y-1 hover:shadow-md hover:shadow-black/30 hover:border-amber-700/50',
    // Red dora indicator
    tile?.isRed &&
      !faceDown &&
      'after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-red-500 after:rounded-full',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const isInteractive = !disabled && !!onClick

  return (
    <div
      ref={anchorRef}
      className={containerClasses}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handleMouseLeave}
      onFocus={() => {
        setIsFocused(true)
        setDismissed(false)
      }}
      onBlur={() => setIsFocused(false)}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={isInteractive ? selected : undefined}
      aria-disabled={disabled}
      aria-describedby={tooltipOpen && isInteractive ? tooltipId : undefined}
    >
      <img
        src={src}
        alt={tileInfo.name}
        className="w-full h-full object-contain select-none pointer-events-none rounded-sm"
        draggable={false}
        loading="lazy"
      />
      {/* Selection indicator overlay */}
      {selected && (
        <div className="absolute inset-0 bg-golden-yellow opacity-20 rounded pointer-events-none" />
      )}
      {/* Highlight indicator overlay */}
      {highlighted && !selected && (
        <div className="absolute inset-0 bg-vibrant-orange opacity-10 rounded pointer-events-none animate-pulse" />
      )}
      {/* Modifier overlay (enhancement, seal, edition indicators) */}
      {tile && !faceDown && tile.hasModifiers && (
        <ModifierOverlay tile={tile} />
      )}
      {/* Tooltip popup */}
      {tooltipOpen &&
        tile &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            data-tile-tooltip
            className="fixed z-50 pointer-events-none overflow-y-auto text-left [overflow-wrap:anywhere]"
          >
            <div
              className="bg-dark-forest border border-golden-yellow rounded-lg p-3 shadow-xl"
              style={{
                backgroundColor: 'rgba(28, 58, 46, 0.95)',
              }}
            >
              {/* Tile name */}
              <div className="text-golden-yellow font-bold text-sm mb-1">
                {tileInfo.name}
              </div>
              {/* Points */}
              {tileInfo.points && (
                <div className="text-vibrant-orange text-xs mb-2">
                  {tileInfo.points}
                </div>
              )}
              {/* Description */}
              {tileInfo.description && (
                <div className="text-beige-white text-xs leading-relaxed">
                  {tileInfo.description}
                </div>
              )}
              {/* Modifier information */}
              {tile.hasModifiers && (
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <div className="text-golden-yellow text-xs font-medium mb-1">
                    {t('tiles.modifiers', 'Modifiers:')}
                  </div>
                  {tileInfo.modifiers.map((entry) => (
                    <div
                      key={entry.kind}
                      className="text-beige-white text-xs mt-1"
                    >
                      <span className="font-semibold">{entry.name}:</span>{' '}
                      {entry.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

/**
 * Props for TileRow component
 */
export interface TileRowProps {
  tiles: Tile[]
  size?: TileSize
  selectedIds?: Set<string>
  highlightedIds?: Set<string>
  onTileClick?: (tile: Tile) => void
  /** Overlap tiles when there are many (for hand display) */
  overlap?: boolean
  className?: string
}

/**
 * TileRow displays multiple tiles in a horizontal row
 */
export const TileRow: React.FC<TileRowProps> = ({
  tiles,
  size = 'medium',
  selectedIds = new Set(),
  highlightedIds = new Set(),
  onTileClick,
  overlap = false,
  className = '',
}) => {
  const { t } = useTranslation()
  const dimensions = tileSizes[size]
  // Calculate overlap amount (negative margin) - reduced for better visibility
  const overlapAmount = overlap ? Math.floor(dimensions.width * 0.2) : 0
  // Gap between tiles when not overlapping
  const gapClass = overlap ? '' : 'gap-1'

  return (
    <div
      className={`flex items-end ${gapClass} ${className}`}
      role="group"
      aria-label={t('tiles.tileRow', 'Tile row')}
    >
      {tiles.map((tile, index) => (
        <div
          key={tile.id}
          style={{
            marginLeft: index > 0 && overlap ? -overlapAmount : 0,
            zIndex: index, // Later tiles appear on top
          }}
        >
          <TileImage
            tile={tile}
            size={size}
            selected={selectedIds.has(tile.id)}
            highlighted={highlightedIds.has(tile.id)}
            onClick={onTileClick}
          />
        </div>
      ))}
    </div>
  )
}

export default TileImage
