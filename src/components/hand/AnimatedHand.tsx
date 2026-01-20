/**
 * AnimatedHand Component for Tensho Mahjong Roguelike
 *
 * Animated hand display with:
 * - Tiles fanning out from center
 * - New tiles sliding in from right
 * - Discarded tiles animating out
 * - Selection state animations
 * - Sorting animation (tiles rearrange smoothly)
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { animated, useTransition, useSprings, useSpring, config } from '@react-spring/web';
import { Tile } from '../../core/Tile';
import { TileSize } from '../tiles/TileImage';
import { AnimatedTile } from '../tiles/AnimatedTile';
import { tileSizes } from '../../styles/theme';
import { useSettingsStore, selectAnimationMultiplier } from '../../stores/settingsStore';
import { SPRINGS, STAGGER, ANIMATION_Z_INDEX } from '../../animations/constants';

export interface AnimatedHandProps {
  /** Array of tiles in the hand */
  tiles: Tile[];
  /** Size of tiles to display */
  size?: TileSize;
  /** Set of selected tile IDs */
  selectedIds?: Set<string>;
  /** Set of highlighted tile IDs */
  highlightedIds?: Set<string>;
  /** Set of glowing tile IDs (winning tiles) */
  glowingIds?: Set<string>;
  /** Handler for tile click */
  onTileClick?: (tile: Tile) => void;
  /** Handler for tile drag start */
  onDragStart?: (tile: Tile) => void;
  /** Handler for tile drag end */
  onDragEnd?: (tile: Tile, position: { x: number; y: number }) => void;
  /** Handler for tile discard (drag-to-discard) */
  onTileDiscard?: (tile: Tile) => void;
  /** Whether to allow tile dragging */
  draggable?: boolean;
  /** Whether to fan tiles out (false = straight line) */
  fanned?: boolean;
  /** Maximum fan angle in degrees */
  maxFanAngle?: number;
  /** Whether to overlap tiles */
  overlap?: boolean;
  /** Whether the hand is disabled */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
}

/**
 * Calculate tile positions for fanned layout
 */
function calculateFannedPositions(
  count: number,
  tileWidth: number,
  maxAngle: number,
  overlap: boolean
): Array<{ x: number; rotation: number; zIndex: number }> {
  if (count === 0) return [];

  const positions: Array<{ x: number; rotation: number; zIndex: number }> = [];
  const midIndex = (count - 1) / 2;
  const angleStep = maxAngle / Math.max(count - 1, 1);
  const overlapFactor = overlap ? 0.7 : 1;
  const baseSpacing = tileWidth * overlapFactor;

  for (let i = 0; i < count; i++) {
    const offset = i - midIndex;
    positions.push({
      x: offset * baseSpacing,
      rotation: offset * angleStep,
      zIndex: count - Math.abs(offset), // Center tiles on top when fanned
    });
  }

  return positions;
}

/**
 * Calculate tile positions for straight layout
 */
function calculateStraightPositions(
  count: number,
  tileWidth: number,
  overlap: boolean
): Array<{ x: number; rotation: number; zIndex: number }> {
  if (count === 0) return [];

  const positions: Array<{ x: number; rotation: number; zIndex: number }> = [];
  const overlapFactor = overlap ? 0.7 : 1;
  const baseSpacing = tileWidth * overlapFactor;
  const totalWidth = (count - 1) * baseSpacing;
  const startX = -totalWidth / 2;

  for (let i = 0; i < count; i++) {
    positions.push({
      x: startX + i * baseSpacing,
      rotation: 0,
      zIndex: i,
    });
  }

  return positions;
}

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
  layout = 'horizontal',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const animationMultiplier = useSettingsStore(selectAnimationMultiplier);
  const dimensions = tileSizes[size];

  // Track previous tiles for animation
  const previousTilesRef = useRef<Tile[]>([]);

  // Calculate positions based on layout type
  const positions = useMemo(() => {
    if (fanned) {
      return calculateFannedPositions(tiles.length, dimensions.width, maxFanAngle, overlap);
    }
    return calculateStraightPositions(tiles.length, dimensions.width, overlap);
  }, [tiles.length, dimensions.width, maxFanAngle, overlap, fanned]);

  // Springs for smooth position transitions when sorting
  const [springs, api] = useSprings(
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
  );

  // Transition for adding/removing tiles
  const transitions = useTransition(tiles, {
    keys: (tile) => tile.id,
    from: (tile) => {
      // Check if this is a new tile (not in previous list)
      const isNew = !previousTilesRef.current.some((t) => t.id === tile.id);
      return {
        opacity: 0,
        x: isNew ? 100 : 0, // Slide in from right if new
        scale: 0.8,
      };
    },
    enter: (tile, index) => ({
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
  });

  // Update previous tiles reference
  React.useEffect(() => {
    previousTilesRef.current = tiles;
  }, [tiles]);

  // Handle tile click
  const handleTileClick = useCallback(
    (tile: Tile) => {
      if (!disabled && onTileClick) {
        onTileClick(tile);
      }
    },
    [disabled, onTileClick]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (tile: Tile) => {
      onDragStart?.(tile);
    },
    [onDragStart]
  );

  // Handle drag end (check if in discard zone)
  const handleDragEnd = useCallback(
    (tile: Tile, position: { x: number; y: number }) => {
      // Call the onDragEnd callback if provided
      onDragEnd?.(tile, position);

      // Check if the tile was dragged high enough to discard
      // This could be more sophisticated with an actual discard zone detection
      const viewportHeight = window.innerHeight;
      if (position.y < viewportHeight * 0.4 && onTileDiscard) {
        onTileDiscard(tile);
      }
    },
    [onDragEnd, onTileDiscard]
  );

  // Calculate container dimensions
  const containerWidth = useMemo(() => {
    if (tiles.length === 0) return 0;
    const overlapFactor = overlap ? 0.7 : 1;
    const totalWidth = (tiles.length - 1) * dimensions.width * overlapFactor + dimensions.width;
    return totalWidth;
  }, [tiles.length, dimensions.width, overlap]);

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
        {transitions((style, tile, _, index) => {
          const position = positions[index] || { x: 0, rotation: 0, zIndex: index };

          return (
            <animated.div
              key={tile.id}
              className="absolute"
              style={{
                left: '50%',
                bottom: 0,
                opacity: style.opacity,
                transform: style.x.to(
                  (x) =>
                    `translateX(calc(-50% + ${x}px)) rotate(${position.rotation}deg) scale(${style.scale.get()})`
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
          );
        })}
      </div>
    </div>
  );
};

/**
 * HandWithDiscardZone component
 * Combines AnimatedHand with a visual discard zone
 */
export interface HandWithDiscardZoneProps extends Omit<AnimatedHandProps, 'onDragStart' | 'onDragEnd'> {
  /** Label for the discard zone */
  discardZoneLabel?: string;
}

export const HandWithDiscardZone: React.FC<HandWithDiscardZoneProps> = ({
  discardZoneLabel = 'Drag here to discard',
  ...handProps
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag start - show discard zone
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle drag end - hide discard zone
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Animate discard zone visibility
  const discardZoneSpring = useSpring({
    opacity: isDragging ? 1 : 0,
    y: isDragging ? 0 : -20,
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  });

  return (
    <div className="relative w-full">
      {/* Discard zone (appears when dragging) */}
      <animated.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center py-8"
        style={{
          opacity: discardZoneSpring.opacity,
          transform: discardZoneSpring.y.to((y) => `translateY(${y}px)`),
          pointerEvents: isDragging ? 'auto' : 'none',
          zIndex: 100,
        }}
      >
        <div
          className="px-8 py-4 rounded-xl border-2 border-dashed"
          style={{
            borderColor: '#FF5722',
            backgroundColor: 'rgba(255, 87, 34, 0.1)',
            color: '#FF5722',
          }}
        >
          {discardZoneLabel}
        </div>
      </animated.div>

      {/* Hand */}
      <AnimatedHand
        {...handProps}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
};

/**
 * CompactHand component
 * Smaller hand display for opponent or UI previews
 */
export interface CompactHandProps {
  /** Number of tiles (for face-down display) or actual tiles */
  tiles: Tile[] | number;
  /** Size of tiles */
  size?: TileSize;
  /** Whether tiles are face down */
  faceDown?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const CompactHand: React.FC<CompactHandProps> = ({
  tiles,
  size = 'small',
  faceDown = false,
  className = '',
}) => {
  const dimensions = tileSizes[size];
  const tileCount = typeof tiles === 'number' ? tiles : tiles.length;
  const actualTiles = typeof tiles === 'number' ? null : tiles;

  const overlapFactor = 0.5; // More overlap for compact display
  const visibleWidth = dimensions.width * overlapFactor;

  return (
    <div
      className={`flex ${className}`}
      role="group"
      aria-label={faceDown ? `${tileCount} hidden tiles` : 'Tile hand'}
    >
      {Array.from({ length: tileCount }).map((_, index) => {
        const tile = actualTiles?.[index];

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
        );
      })}
    </div>
  );
};

export default AnimatedHand;
