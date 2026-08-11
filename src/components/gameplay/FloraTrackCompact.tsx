/**
 * FloraTrackCompact Component for Tensho Mahjong Roguelike
 *
 * Compact display of collected flowers and active season.
 * Uses actual tile images for flower representation.
 *
 * @module components/gameplay/FloraTrackCompact
 */

import { useState } from 'react'
import { Tile, TileSuit } from '../../core/Tile'
import { TileImage } from '../tiles/TileImage'
import { FlowerVariant, SeasonVariant } from '../../systems/types'
import { SEASON_BASE_EFFECTS } from '../../systems/SeasonSystem'
import { FLOWER_DATA, SEASON_DATA } from './gameplayTypes'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for FloraTrackCompact
 */
export interface FloraTrackCompactProps {
  /** Array of collected flower types */
  flowers: FlowerVariant[]
  /** Currently active season (if any) */
  activeSeason?: SeasonVariant | null
  /** Whether the season is corrupted */
  isCorrupted?: boolean
  /** Handler for expanding to full flora view */
  onExpand?: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Compact flower and season tracking panel.
 *
 * Features:
 * - Displays all four flower types with collected/uncollected states
 * - Uses actual tile images for visual consistency
 * - Shows effect text for collected flowers
 * - Displays set bonus progress (2/3/4 flowers)
 * - Shows active season with corruption indicator
 * - Tooltips on hover for uncollected flowers
 */
export function FloraTrackCompact({
  flowers,
  activeSeason,
  isCorrupted,
  onExpand,
}: FloraTrackCompactProps) {
  const [showTooltip, setShowTooltip] = useState<FlowerVariant | null>(null)
  const collectedSet = new Set(flowers)
  const allFlowers: FlowerVariant[] = [
    'Plum',
    'Orchid',
    'Chrysanthemum',
    'Bamboo',
  ]

  return (
    <div
      className="flex flex-row items-center gap-1 rounded-lg bg-[var(--color-dark-forest)] p-1 shadow-lg md:flex-col md:items-stretch md:p-2"
      onClick={onExpand}
    >
      {/* Flowers using actual tile images */}
      <div className="flex flex-row gap-1 md:flex-col">
        {allFlowers.map((flower) => {
          const isCollected = collectedSet.has(flower)
          const data = FLOWER_DATA[flower]
          const flowerTile = Tile.create(TileSuit.Flower, data.rank)

          return (
            <div
              key={flower}
              className="relative flex items-center gap-2"
              onMouseEnter={() => setShowTooltip(flower)}
              onMouseLeave={() => setShowTooltip(null)}
            >
              {/* Tile image */}
              <div
                className={`
                  transition-all duration-300
                  ${!isCollected ? 'opacity-30 grayscale' : ''}
                `}
              >
                <TileImage
                  tile={flowerTile}
                  size="small"
                  disabled={!isCollected}
                  showTooltip={false}
                />
              </div>

              {/* Effect text (only show for collected flowers) */}
              {isCollected && (
                <span className="hidden whitespace-nowrap text-xs font-medium text-[var(--color-golden-yellow)] md:inline">
                  {data.effect}
                </span>
              )}

              {/* Tooltip for uncollected */}
              {showTooltip === flower && !isCollected && (
                <div className="absolute left-full ml-2 z-50 px-2 py-1 bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)] rounded text-xs text-[var(--color-beige-white)] whitespace-nowrap">
                  {flower}: {data.effect}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Set bonus indicator */}
      {flowers.length >= 2 && (
        <div className="hidden text-center text-xs text-green-400 md:mt-1 md:block">
          {flowers.length >= 4
            ? 'x2 All Effects!'
            : flowers.length >= 3
              ? 'Special Decrees'
              : '+1 Decree Slot'}
        </div>
      )}

      {/* Active Season */}
      {activeSeason && (
        <div className="hidden flex-col gap-0.5 border-t border-[var(--color-metallic-gold)]/30 md:mt-1 md:flex md:pt-1">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-[var(--color-beige-white)] opacity-60">
              Season:
            </span>
            <img
              src={SEASON_DATA[activeSeason].illustration}
              alt=""
              aria-hidden="true"
              className={`game-illustration h-6 w-6 object-contain ${isCorrupted ? 'grayscale' : ''}`}
            />
            <span
              className={`text-xs font-bold ${isCorrupted ? 'text-red-400' : SEASON_DATA[activeSeason].color}`}
            >
              {isCorrupted ? 'Corrupted' : activeSeason}
            </span>
          </div>
          <p
            className={`text-[10px] text-center ${isCorrupted ? 'text-red-300' : 'text-[var(--color-beige-white)]'} opacity-70`}
          >
            {SEASON_BASE_EFFECTS[activeSeason].description}
          </p>
        </div>
      )}

      {activeSeason && (
        <span
          className={`px-1 md:hidden ${
            isCorrupted ? 'text-red-400' : SEASON_DATA[activeSeason].color
          }`}
          title={`${isCorrupted ? 'Corrupted ' : ''}${activeSeason}: ${SEASON_BASE_EFFECTS[activeSeason].description}`}
          aria-label={`${isCorrupted ? 'Corrupted ' : ''}${activeSeason} season`}
        >
          <img
            src={SEASON_DATA[activeSeason].illustration}
            alt=""
            aria-hidden="true"
            className={`game-illustration h-7 w-7 object-contain ${isCorrupted ? 'grayscale' : ''}`}
          />
        </span>
      )}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default FloraTrackCompact
