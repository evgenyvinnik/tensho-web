/**
 * TileImage Component for Tensho Mahjong Roguelike
 * Displays tile images with support for different sizes and states
 */

import React from 'react';
import { Tile, TileSuit } from '../../core/Tile';
import { getTileImagePath, getTileBackPath } from '../../utils/assets';
import { tileSizes } from '../../styles/theme';

export type TileSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface TileImageProps {
  /** The tile to display, or null/undefined for face-down */
  tile?: Tile | null;
  /** Size of the tile */
  size?: TileSize;
  /** Whether the tile is selected */
  selected?: boolean;
  /** Whether the tile is highlighted (e.g., for hints) */
  highlighted?: boolean;
  /** Whether the tile is disabled (not interactive) */
  disabled?: boolean;
  /** Whether to show the tile face-down */
  faceDown?: boolean;
  /** Click handler */
  onClick?: (tile: Tile) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get the image path for a tile
 */
function getTileSrc(tile: Tile | null | undefined, faceDown: boolean): string {
  if (faceDown || !tile) {
    return getTileBackPath();
  }
  return getTileImagePath(tile.suit, tile.rank);
}

/**
 * Get the alt text for a tile
 */
function getTileAlt(tile: Tile | null | undefined, faceDown: boolean): string {
  if (faceDown || !tile) {
    return 'Face-down tile';
  }

  const suitNames: Record<TileSuit, string> = {
    [TileSuit.Manzu]: 'Characters',
    [TileSuit.Pinzu]: 'Circles',
    [TileSuit.Souzu]: 'Bamboo',
    [TileSuit.Wind]: 'Wind',
    [TileSuit.Dragon]: 'Dragon',
    [TileSuit.Flower]: 'Flower',
    [TileSuit.Season]: 'Season',
  };

  const suitName = suitNames[tile.suit];

  // For suited tiles, show rank
  if (tile.isSuited) {
    const redPrefix = tile.isRed ? 'Red ' : '';
    return `${redPrefix}${tile.rank} of ${suitName}`;
  }

  // For honor tiles, show specific name
  if (tile.suit === TileSuit.Wind) {
    const windNames = ['', 'East', 'South', 'West', 'North'];
    return `${windNames[tile.rank]} Wind`;
  }

  if (tile.suit === TileSuit.Dragon) {
    const dragonNames = ['', 'White', 'Green', 'Red'];
    return `${dragonNames[tile.rank]} Dragon`;
  }

  if (tile.suit === TileSuit.Flower) {
    const flowerNames = ['', 'Plum', 'Orchid', 'Chrysanthemum', 'Bamboo'];
    return `${flowerNames[tile.rank]} Flower`;
  }

  if (tile.suit === TileSuit.Season) {
    const seasonNames = ['', 'Spring', 'Summer', 'Autumn', 'Winter'];
    return `${seasonNames[tile.rank]} Season`;
  }

  return tile.toString();
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
  className = '',
}) => {
  const dimensions = tileSizes[size];
  const src = getTileSrc(tile, faceDown);
  const alt = getTileAlt(tile, faceDown);

  const handleClick = () => {
    if (!disabled && tile && onClick) {
      onClick(tile);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && tile && onClick) {
      e.preventDefault();
      onClick(tile);
    }
  };

  // Build dynamic classes
  const containerClasses = [
    'relative inline-block',
    'transition-all duration-150 ease-out',
    // Selection state
    selected && 'ring-2 ring-golden-yellow ring-offset-2 ring-offset-dark-forest -translate-y-2',
    // Highlighted state
    highlighted && !selected && 'ring-2 ring-vibrant-orange ring-offset-1',
    // Disabled state
    disabled && 'opacity-50 grayscale',
    // Interactive state
    !disabled && onClick && 'cursor-pointer hover:-translate-y-1 hover:shadow-lg',
    // Red dora indicator
    tile?.isRed && !faceDown && 'after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-red-500 after:rounded-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isInteractive = !disabled && !!onClick;

  return (
    <div
      className={containerClasses}
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={isInteractive ? selected : undefined}
      aria-disabled={disabled}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain select-none pointer-events-none"
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
    </div>
  );
};

/**
 * Props for TileRow component
 */
export interface TileRowProps {
  tiles: Tile[];
  size?: TileSize;
  selectedIds?: Set<string>;
  highlightedIds?: Set<string>;
  onTileClick?: (tile: Tile) => void;
  /** Overlap tiles when there are many (for hand display) */
  overlap?: boolean;
  className?: string;
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
  const dimensions = tileSizes[size];
  // Calculate overlap amount (negative margin)
  const overlapAmount = overlap ? Math.floor(dimensions.width * 0.3) : 0;

  return (
    <div
      className={`flex items-end ${className}`}
      role="group"
      aria-label="Tile row"
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
  );
};

export default TileImage;
