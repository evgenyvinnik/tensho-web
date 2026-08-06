/**
 * WallDisplay Component for Tensho Mahjong Roguelike
 *
 * Shows a visual representation of tiles remaining in the wall.
 * Displays tiles grouped by suit with counts.
 *
 * @module components/gameplay/WallDisplay
 */

import { useState, useMemo } from 'react'
import { Tile, TileSuit } from '../../core/Tile'
import { getTileImagePath } from '../../utils/assets'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface WallDisplayProps {
  /** Tiles remaining in the wall */
  wallTiles: Tile[]
  /** Compact mode - just show count */
  compact?: boolean
}

interface TileCount {
  suit: TileSuit
  rank: number | null
  count: number
  tile: Tile
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get display order for suits
 */
function getSuitOrder(suit: TileSuit): number {
  switch (suit) {
    case TileSuit.Manzu:
      return 0
    case TileSuit.Pinzu:
      return 1
    case TileSuit.Souzu:
      return 2
    case 'wind':
      return 3
    case 'dragon':
      return 4
    case 'flower':
      return 5
    case 'season':
      return 6
    default:
      return 7
  }
}

/**
 * Get suit display name
 */
function getSuitName(suit: TileSuit): string {
  switch (suit) {
    case TileSuit.Manzu:
      return 'Characters'
    case TileSuit.Pinzu:
      return 'Circles'
    case TileSuit.Souzu:
      return 'Bamboo'
    case 'wind':
      return 'Winds'
    case 'dragon':
      return 'Dragons'
    case 'flower':
      return 'Flowers'
    case 'season':
      return 'Seasons'
    default:
      return String(suit)
  }
}

/**
 * Get suit color class
 */
function getSuitColorClass(suit: TileSuit): string {
  switch (suit) {
    case TileSuit.Manzu:
      return 'text-red-400'
    case TileSuit.Pinzu:
      return 'text-blue-400'
    case TileSuit.Souzu:
      return 'text-green-400'
    case 'wind':
      return 'text-gray-300'
    case 'dragon':
      return 'text-purple-400'
    case 'flower':
      return 'text-pink-400'
    case 'season':
      return 'text-amber-400'
    default:
      return 'text-gray-400'
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Displays tiles remaining in the wall.
 *
 * Features:
 * - Groups tiles by suit
 * - Shows count for each tile type
 * - Expandable to show full detail
 * - Visual tile thumbnails
 */
export function WallDisplay({ wallTiles, compact = false }: WallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Group tiles by suit and rank
  const tileGroups = useMemo(() => {
    const groups = new Map<string, TileCount>()

    for (const tile of wallTiles) {
      const key = `${tile.suit}-${tile.rank ?? 'bonus'}`
      const existing = groups.get(key)
      if (existing) {
        existing.count++
      } else {
        groups.set(key, {
          suit: tile.suit,
          rank: tile.rank,
          count: 1,
          tile,
        })
      }
    }

    // Sort by suit order then by rank
    return Array.from(groups.values()).sort((a, b) => {
      const suitDiff = getSuitOrder(a.suit) - getSuitOrder(b.suit)
      if (suitDiff !== 0) return suitDiff
      return (a.rank ?? 0) - (b.rank ?? 0)
    })
  }, [wallTiles])

  // Group by suit for summary view
  const suitSummary = useMemo(() => {
    const summary = new Map<TileSuit, number>()
    for (const tile of wallTiles) {
      const suit = tile.suit
      summary.set(suit, (summary.get(suit) || 0) + 1)
    }
    return Array.from(summary.entries())
      .map(([suit, count]) => ({ suit, count }))
      .sort((a, b) => getSuitOrder(a.suit) - getSuitOrder(b.suit))
  }, [wallTiles])

  if (compact) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--color-dark-forest)] rounded-lg border border-[var(--color-metallic-gold)] border-opacity-40 hover:border-opacity-70 transition-colors"
      >
        <span className="text-gray-400 text-sm">Wall:</span>
        <span className="text-[var(--color-golden-yellow)] font-bold">{wallTiles.length}</span>
      </button>
    )
  }

  return (
    <div className="bg-[var(--color-dark-forest)] bg-opacity-90 rounded-lg border border-[var(--color-metallic-gold)] border-opacity-40 shadow-lg">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-[var(--color-forest-green)] hover:bg-opacity-30 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-metallic-gold)] text-sm font-semibold uppercase tracking-wider">
            Wall
          </span>
          <span className="text-[var(--color-golden-yellow)] font-bold text-lg">{wallTiles.length}</span>
          <span className="text-[var(--color-beige-white)] opacity-40 text-xs">tiles remaining</span>
        </div>
        <span className={`text-[var(--color-metallic-gold)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Suit summary bar */}
      <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-[var(--color-metallic-gold)] border-opacity-20">
        {suitSummary.map(({ suit, count }) => (
          <div
            key={suit}
            className={`flex items-center gap-1 text-xs ${getSuitColorClass(suit)}`}
            title={getSuitName(suit)}
          >
            <span className="opacity-60">{getSuitName(suit).charAt(0)}:</span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
      </div>

      {/* Expanded tile grid */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-[var(--color-metallic-gold)] border-opacity-20 max-h-[300px] overflow-y-auto">
          <div className="grid grid-cols-9 gap-1">
            {tileGroups.map(({ tile, count }) => (
              <div
                key={`${tile.suit}-${tile.rank}`}
                className="relative group"
                title={`${tile.displayName} (${count} remaining)`}
              >
                <img
                  src={getTileImagePath(tile.suit, tile.rank)}
                  alt={tile.displayName}
                  className={`w-full h-auto rounded ${count === 0 ? 'opacity-30 grayscale' : ''}`}
                />
                {/* Count badge */}
                <div
                  className={`
                    absolute -top-1 -right-1 min-w-[18px] h-[18px]
                    flex items-center justify-center
                    text-xs font-bold rounded-full
                    ${
                      count === 0
                        ? 'bg-gray-600 text-gray-400'
                        : count === 1
                          ? 'bg-red-600 text-white'
                          : count === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-green-600 text-white'
                    }
                  `}
                >
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default WallDisplay
