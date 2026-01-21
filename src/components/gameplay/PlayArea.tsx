/**
 * PlayArea Component for Tensho Mahjong Roguelike
 *
 * Central play area showing score preview with yaku detection and yaku reveals.
 *
 * @module components/gameplay/PlayArea
 */

import React, { useState } from 'react'
import { YakuReveal } from '../effects/YakuReveal'
import { GlowEffect } from '../effects/GlowEffect'
import { YakuRevealState } from './gameplayTypes'
import { YakuDefinition } from '../../rules/YakuDetector'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Score preview data with detected yaku
 */
export interface ScorePreviewData {
  points: number
  mult: number
  total: number
  yaku?: YakuDefinition[]
}

/**
 * Props for PlayArea
 */
export interface PlayAreaProps {
  /** Number of currently selected tiles */
  selectedTileCount: number
  /** Number of staged tiles */
  stagedTileCount: number
  /** Total tiles in hand */
  handTileCount: number
  /** Score preview with detected yaku */
  scorePreview: ScorePreviewData | null
  /** Active yaku reveal animations */
  yakuReveals: YakuRevealState[]
  /** Handler for yaku reveal completion */
  onYakuComplete: (id: string) => void
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get tier-based color for yaku badge
 */
function getYakuTierColor(tier: number): string {
  switch (tier) {
    case 1:
      return 'from-green-600 to-green-800 border-green-400'
    case 2:
      return 'from-blue-600 to-blue-800 border-blue-400'
    case 3:
      return 'from-purple-600 to-purple-800 border-purple-400'
    case 4:
      return 'from-amber-500 to-orange-700 border-amber-400'
    default:
      return 'from-gray-600 to-gray-800 border-gray-400'
  }
}

/**
 * Get tier label for yaku
 */
function getYakuTierLabel(tier: number): string {
  switch (tier) {
    case 1:
      return 'Common'
    case 2:
      return 'Uncommon'
    case 3:
      return 'Rare'
    case 4:
      return 'Legendary'
    default:
      return 'Basic'
  }
}

// =============================================================================
// YAKU BADGE COMPONENT
// =============================================================================

interface YakuBadgeProps {
  yaku: YakuDefinition
  isSelected: boolean
  onToggle: () => void
}

function YakuBadge({ yaku, isSelected, onToggle }: YakuBadgeProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`
          px-3 py-1.5 rounded-lg
          bg-gradient-to-br ${getYakuTierColor(yaku.tier)}
          border shadow-lg
          transform hover:scale-105 transition-transform
          cursor-pointer
          ${isSelected ? 'ring-2 ring-white ring-opacity-70' : ''}
        `}
      >
        <span className="text-white font-bold text-sm drop-shadow-sm">{yaku.name}</span>
        <span className="text-white/70 text-xs ml-2">×{yaku.multiplier}</span>
      </button>

      {/* Tooltip popup */}
      {isSelected && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-64">
          <div className="bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)] rounded-lg shadow-xl p-3 text-left">
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-[var(--color-metallic-gold)]" />

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--color-golden-yellow)] font-bold">{yaku.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded bg-gradient-to-r ${getYakuTierColor(yaku.tier)}`}>
                {getYakuTierLabel(yaku.tier)}
              </span>
            </div>

            {/* Japanese name */}
            <p className="text-[var(--color-beige-white)] text-xs opacity-60 mb-2">{yaku.japaneseName}</p>

            {/* Description */}
            <p className="text-[var(--color-beige-white)] text-sm leading-relaxed">{yaku.description}</p>

            {/* Multiplier */}
            <div className="mt-2 pt-2 border-t border-[var(--color-metallic-gold)] border-opacity-30">
              <span className="text-red-400 font-bold">×{yaku.multiplier}</span>
              <span className="text-[var(--color-beige-white)] text-xs opacity-60 ml-2">multiplier</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Central play area for gameplay.
 *
 * Features:
 * - Beautiful score preview panel with detected yaku
 * - Shows selected/staged tile count
 * - Displays yaku reveal animations when hands are scored
 * - Dashed border to indicate the play area
 */
export function PlayArea({
  selectedTileCount,
  stagedTileCount,
  handTileCount,
  scorePreview,
  yakuReveals,
  onYakuComplete,
}: PlayAreaProps) {
  const [selectedYakuId, setSelectedYakuId] = useState<string | null>(null)

  const handleYakuToggle = (yakuId: string) => {
    setSelectedYakuId((prev) => (prev === yakuId ? null : yakuId))
  }

  return (
    <div
      data-tutorial="yaku-display"
      className="flex-1 mx-4 mb-2 bg-[var(--color-dark-forest)] bg-opacity-50 rounded-lg border-2 border-dashed border-[var(--color-metallic-gold)] flex flex-col items-center justify-center p-4 min-h-[120px]"
      onClick={() => setSelectedYakuId(null)} // Close tooltip when clicking outside
    >
      {/* Score Preview Panel */}
      {scorePreview ? (
        <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
          {/* Yaku Badges Section */}
          {scorePreview.yaku && scorePreview.yaku.length > 0 ? (
            <div className="mb-4">
              <p className="text-xs text-[var(--color-metallic-gold)] text-center mb-2 uppercase tracking-widest font-semibold">
                Detected Patterns
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {scorePreview.yaku.map((yaku) => (
                  <YakuBadge
                    key={yaku.id}
                    yaku={yaku}
                    isSelected={selectedYakuId === yaku.id}
                    onToggle={() => handleYakuToggle(yaku.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-3 text-center">
              <p className="text-[var(--color-beige-white)] opacity-40 text-sm italic">
                No special patterns detected
              </p>
            </div>
          )}

          {/* Score Calculation Card */}
          <div className="bg-gradient-to-br from-[var(--color-dark-forest)] to-[#0D1F17] rounded-xl p-4 border border-[var(--color-metallic-gold)] border-opacity-40 shadow-xl">
            <div className="flex items-center justify-center gap-4">
              {/* Points */}
              <div className="text-center min-w-[60px]">
                <p className="text-[10px] text-[var(--color-beige-white)] opacity-50 uppercase tracking-wide mb-1">
                  Points
                </p>
                <p className="text-2xl font-bold text-blue-400 drop-shadow-glow-blue">
                  {scorePreview.points.toLocaleString()}
                </p>
              </div>

              {/* Multiply symbol */}
              <span className="text-3xl text-[var(--color-golden-yellow)] font-light">×</span>

              {/* Multiplier */}
              <div className="text-center min-w-[50px]">
                <p className="text-[10px] text-[var(--color-beige-white)] opacity-50 uppercase tracking-wide mb-1">
                  Mult
                </p>
                <p className="text-2xl font-bold text-red-400 drop-shadow-glow-red">
                  {scorePreview.mult.toFixed(1)}
                </p>
              </div>

              {/* Equals symbol */}
              <span className="text-3xl text-[var(--color-golden-yellow)] font-light">=</span>

              {/* Total */}
              <div className="text-center min-w-[80px]">
                <p className="text-[10px] text-[var(--color-beige-white)] opacity-50 uppercase tracking-wide mb-1">
                  Total
                </p>
                <GlowEffect variant="gold" intensity={0.6} pulsing={scorePreview.yaku && scorePreview.yaku.length > 0}>
                  <p className="text-3xl font-bold text-[var(--color-golden-yellow)]">
                    {scorePreview.total.toLocaleString()}
                  </p>
                </GlowEffect>
              </div>
            </div>

            {/* Tile count indicator */}
            <p className="text-center text-[var(--color-beige-white)] opacity-40 text-xs mt-3">
              {stagedTileCount > 0
                ? `${stagedTileCount} tiles staged for play`
                : selectedTileCount > 0
                  ? `${selectedTileCount} tiles selected`
                  : `${handTileCount} tiles in hand`}
            </p>
          </div>
        </div>
      ) : (
        /* Default state when no tiles */
        <div className="text-center">
          <p className="text-[var(--color-beige-white)] opacity-50 px-4">Tap tiles to select, or play all</p>
          <p className="text-[var(--color-golden-yellow)] opacity-70 text-sm mt-1">
            Press "Play Hand" to score your hand
          </p>
        </div>
      )}

      {/* Yaku Reveal Animations */}
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
