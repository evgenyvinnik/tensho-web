/**
 * TileImage Component for Tensho Mahjong Roguelike
 * Displays tile images with support for different sizes, states, and tooltips
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'
import { Tile, TileSuit, EnhancementType, SealType, EditionType } from '../../core/Tile';
import { getTileImagePath, getTileBackPath } from '../../utils/assets';
import { tileSizes } from '../../styles/theme';
import { ModifierOverlay } from '../ui/TileModifierDisplay';

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
  /** Whether to show tooltip on hover */
  showTooltip?: boolean;
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
 * Get detailed description for a tile (for tooltips)
 */
function getTileDescription(tile: Tile | null | undefined, faceDown: boolean): { name: string; description: string; points: string } {
  if (faceDown || !tile) {
    return { name: 'Face-down Tile', description: 'An unrevealed tile', points: '' };
  }

  // Suited tiles
  if (tile.isSuited) {
    const suitDescriptions: Record<string, { name: string; desc: string }> = {
      [TileSuit.Manzu]: { name: 'Characters', desc: 'One of the three numbered suits, showing Chinese characters.' },
      [TileSuit.Pinzu]: { name: 'Circles', desc: 'One of the three numbered suits, showing circular coins.' },
      [TileSuit.Souzu]: { name: 'Bamboo', desc: 'One of the three numbered suits, showing bamboo sticks.' },
    };

    const suit = suitDescriptions[tile.suit] || { name: 'Suited', desc: '' };
    const isTerminal = tile.rank === 1 || tile.rank === 9;
    const terminalNote = isTerminal ? ' This is a terminal tile (1 or 9), worth more points.' : '';
    const redNote = tile.isRed ? ' This is a red dora tile, providing bonus scoring.' : '';

    return {
      name: `${tile.rank} of ${suit.name}`,
      description: `${suit.desc}${terminalNote}${redNote}`,
      points: isTerminal ? '10 base points' : '5 base points',
    };
  }

  // Wind tiles
  if (tile.suit === TileSuit.Wind) {
    const winds: Record<number, { name: string; desc: string }> = {
      1: { name: 'East Wind', desc: 'The dealer wind. Valued in many yaku combinations.' },
      2: { name: 'South Wind', desc: 'Second wind in rotation. Part of wind-based yaku.' },
      3: { name: 'West Wind', desc: 'Third wind in rotation. Part of wind-based yaku.' },
      4: { name: 'North Wind', desc: 'Fourth wind in rotation. Part of wind-based yaku.' },
    };
    const wind = winds[tile.rank] || { name: 'Wind', desc: '' };
    return {
      name: wind.name,
      description: `${wind.desc} Matching your seat or round wind gives bonus multipliers.`,
      points: '15 base points',
    };
  }

  // Dragon tiles
  if (tile.suit === TileSuit.Dragon) {
    const dragons: Record<number, { name: string; desc: string }> = {
      1: { name: 'White Dragon (Haku)', desc: 'The blank white dragon, representing purity.' },
      2: { name: 'Green Dragon (Hatsu)', desc: 'The green dragon, representing fortune and prosperity.' },
      3: { name: 'Red Dragon (Chun)', desc: 'The red dragon, representing success and power.' },
    };
    const dragon = dragons[tile.rank] || { name: 'Dragon', desc: '' };
    return {
      name: dragon.name,
      description: `${dragon.desc} A triplet of any dragon scores the Yakuhai yaku.`,
      points: '15 base points',
    };
  }

  // Flower tiles
  if (tile.suit === TileSuit.Flower) {
    const flowers: Record<number, { name: string; desc: string }> = {
      1: { name: 'Plum Blossom', desc: 'Symbol of perseverance and hope. Blooms in late winter.' },
      2: { name: 'Orchid', desc: 'Symbol of refinement and nobility. A scholarly flower.' },
      3: { name: 'Chrysanthemum', desc: 'Symbol of vitality and longevity. Autumn\'s flower.' },
      4: { name: 'Bamboo', desc: 'Symbol of integrity and strength. Evergreen and resilient.' },
    };
    const flower = flowers[tile.rank] || { name: 'Flower', desc: '' };
    return {
      name: flower.name,
      description: `${flower.desc} Bonus tiles are auto-collected and provide run-wide scaling bonuses.`,
      points: 'Bonus tile (scales with collection)',
    };
  }

  // Season tiles
  if (tile.suit === TileSuit.Season) {
    const seasons: Record<number, { name: string; desc: string }> = {
      1: { name: 'Spring', desc: 'Season of new beginnings. Grants extra draws per round.' },
      2: { name: 'Summer', desc: 'Season of growth. Increases gold earned from rounds.' },
      3: { name: 'Autumn', desc: 'Season of harvest. Boosts score multipliers.' },
      4: { name: 'Winter', desc: 'Season of rest. Provides defensive bonuses.' },
    };
    const season = seasons[tile.rank] || { name: 'Season', desc: '' };
    return {
      name: season.name,
      description: `${season.desc} Season effects last for the current round only.`,
      points: 'Bonus tile (round effect)',
    };
  }

  return { name: tile.toString(), description: '', points: '' };
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
  className = '',
}) => {
  const { t } = useTranslation()
  const [isHovering, setIsHovering] = useState(false);
  const dimensions = tileSizes[size];
  const src = getTileSrc(tile, faceDown);
  const alt = getTileAlt(tile, faceDown);
  const tileInfo = getTileDescription(tile, faceDown);

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

  const handleMouseEnter = () => {
    if (showTooltip && tile && !faceDown) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Build dynamic classes
  const containerClasses = [
    'relative inline-block',
    'transition-all duration-150 ease-out',
    // Base tile styling - subtle border and shadow for visibility
    'rounded-md',
    'border border-amber-800/30',
    'shadow-sm shadow-black/20',
    // Selection state
    selected && 'ring-2 ring-golden-yellow ring-offset-2 ring-offset-dark-forest -translate-y-2 shadow-lg shadow-golden-yellow/30',
    // Highlighted state
    highlighted && !selected && 'ring-2 ring-vibrant-orange ring-offset-1',
    // Disabled state
    disabled && 'opacity-50 grayscale',
    // Interactive state
    !disabled && onClick && 'cursor-pointer hover:-translate-y-1 hover:shadow-md hover:shadow-black/30 hover:border-amber-700/50',
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={isInteractive ? selected : undefined}
      aria-disabled={disabled}
    >
      <img
        src={src}
        alt={alt}
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
      {isHovering && showTooltip && tile && !faceDown && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
          }}
        >
          <div
            className="bg-dark-forest border border-golden-yellow rounded-lg p-3 shadow-xl min-w-[200px] max-w-[280px]"
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
                <div className="text-golden-yellow text-xs font-medium mb-1">{t('tiles.modifiers', 'Modifiers:')}</div>
                {tile.enhancement !== EnhancementType.None && (
                  <div className="text-blue-400 text-xs">
                    {tile.enhancementDef.name}: {tile.enhancementDef.description}
                  </div>
                )}
                {tile.seal !== SealType.None && (
                  <div className="text-red-400 text-xs">
                    {tile.sealDef.name}: {tile.sealDef.description}
                  </div>
                )}
                {tile.edition !== EditionType.Base && (
                  <div className="text-purple-400 text-xs">
                    {tile.editionDef.name}: {tile.editionDef.description}
                  </div>
                )}
                {/* Stats summary */}
                <div className="mt-1 text-xs text-gray-300">
                  {tile.modifierChips > 0 && <span className="text-blue-300">+{tile.modifierChips} Chips </span>}
                  {tile.modifierMult > 0 && <span className="text-red-300">+{tile.modifierMult} Mult </span>}
                  {tile.modifierMultiplier !== 1 && <span className="text-purple-300">×{tile.modifierMultiplier.toFixed(1)} </span>}
                </div>
              </div>
            )}
            {/* Tooltip arrow */}
            <div
              className="absolute left-1/2 -translate-x-1/2 border-8 border-transparent"
              style={{
                bottom: '-16px',
                borderTopColor: 'rgba(28, 58, 46, 0.95)',
              }}
            />
          </div>
        </div>
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
  const { t } = useTranslation()
  const dimensions = tileSizes[size];
  // Calculate overlap amount (negative margin) - reduced for better visibility
  const overlapAmount = overlap ? Math.floor(dimensions.width * 0.2) : 0;
  // Gap between tiles when not overlapping
  const gapClass = overlap ? '' : 'gap-1';

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
  );
};

export default TileImage;
