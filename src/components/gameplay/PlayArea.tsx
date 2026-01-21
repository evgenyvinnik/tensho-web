/**
 * PlayArea Component for Tensho Mahjong Roguelike
 *
 * Central play area showing selected tile count and yaku reveals.
 *
 * @module components/gameplay/PlayArea
 */

import React from 'react'
import { YakuReveal } from '../effects/YakuReveal'
import { YakuRevealState } from './gameplayTypes'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for PlayArea
 */
export interface PlayAreaProps {
  /** Number of currently selected tiles */
  selectedTileCount: number
  /** Active yaku reveal animations */
  yakuReveals: YakuRevealState[]
  /** Handler for yaku reveal completion */
  onYakuComplete: (id: string) => void
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Central play area for gameplay.
 *
 * Features:
 * - Shows selected tile count and instructions
 * - Displays yaku reveal animations when hands are scored
 * - Dashed border to indicate drop zone
 */
export function PlayArea({ selectedTileCount, yakuReveals, onYakuComplete }: PlayAreaProps) {
  return (
    <div
      data-tutorial="yaku-display"
      className="flex-1 mx-4 mb-2 bg-[var(--color-dark-forest)] bg-opacity-50 rounded-lg border-2 border-dashed border-[var(--color-metallic-gold)] flex flex-col items-center justify-center p-4 min-h-[100px]"
    >
      {selectedTileCount > 0 ? (
        <div className="text-center">
          <p className="text-[var(--color-beige-white)] mb-2">{selectedTileCount} tiles selected</p>
          <p className="text-[var(--color-golden-yellow)] text-sm">Tap "Play Hand" to score</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-[var(--color-beige-white)] opacity-50 px-4">Tap tiles to select, or play all</p>
          <p className="text-[var(--color-golden-yellow)] opacity-70 text-sm mt-1">
            Press "Play Hand" to score your hand
          </p>
        </div>
      )}

      {/* Yaku reveals */}
      {yakuReveals.map((yaku) => (
        <YakuReveal
          key={yaku.id}
          japaneseName={yaku.japaneseName}
          multiplier={yaku.multiplier}
          tier={yaku.tier}
          onComplete={() => onYakuComplete(yaku.id)}
        />
      ))}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PlayArea
