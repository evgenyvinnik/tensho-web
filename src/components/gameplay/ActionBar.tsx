/**
 * ActionBar Component for Tensho Mahjong Roguelike
 *
 * Bottom action bar with gameplay buttons (Skip, Play Hand)
 * and wall remaining indicator.
 *
 * @module components/gameplay/ActionBar
 */

import { TFunction } from 'i18next'
import { Button } from '../ui/Button'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for ActionBar
 */
export interface ActionBarProps {
  /** Number of tiles remaining in wall */
  wallRemaining: number
  /** Number of hands remaining this round */
  handsRemaining: number
  /** Number of discards remaining this round */
  discardsRemaining: number
  /** Number of redraw actions remaining */
  redrawsRemaining: number
  /** Number of tiles currently staged/selected */
  selectedTileCount: number
  /** Current round number (1-3) */
  currentRound: number
  /** Handler for skip action */
  onSkip: () => void
  /** Handler for replacing the selected tiles */
  onRedraw: () => void
  /** Handler for play hand action */
  onPlayHand: () => void
  /** Forecast for the exact tiles that will be played */
  projectedScore?: number
  /** Whether the forecast reaches the remaining round target */
  willClear?: boolean
  /** Whether Dead Wall Writ can replace the selected tile */
  canUseDeadWallWrit?: boolean
  /** Handler for the once-per-round Dead Wall draw */
  onDeadWallDraw?: () => void
  /** Translation function for i18n */
  t: TFunction
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Bottom action bar for gameplay controls.
 *
 * Features:
 * - Wall remaining indicator
 * - Hands/Discards remaining indicators
 * - Skip button (disabled for boss rounds)
 * - Play Hand button (disabled when no hands remaining)
 * - 44px minimum touch targets for accessibility
 */
export function ActionBar({
  wallRemaining,
  handsRemaining,
  discardsRemaining,
  redrawsRemaining,
  selectedTileCount,
  currentRound,
  onSkip,
  onRedraw,
  onPlayHand,
  projectedScore,
  willClear = false,
  canUseDeadWallWrit = false,
  onDeadWallDraw,
  t: _t,
}: ActionBarProps) {
  // With no staged selection, Play Hand submits the full Mahjong hand.
  const canPlay =
    handsRemaining > 0 && (selectedTileCount === 0 || selectedTileCount >= 2)
  const canRedraw =
    redrawsRemaining > 0 && selectedTileCount > 0 && selectedTileCount <= 3
  const canSkip = currentRound !== 3 // Can't skip boss rounds

  return (
    <div className="z-20 flex flex-shrink-0 items-center justify-center gap-1.5 border-t border-white/5 bg-[var(--color-dark-forest)] px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] safe-area-bottom sm:gap-3 sm:px-4">
      {/* Resource indicators */}
      <div className="hidden items-center gap-3 text-sm md:flex">
        {/* Wall remaining */}
        <div
          className="flex items-center gap-1 text-[var(--color-beige-white)]"
          title="Tiles in wall"
        >
          <span className="text-gray-400">📦</span>
          <span>{wallRemaining}</span>
        </div>

        {/* Hands remaining */}
        <div
          className="flex items-center gap-1 text-[var(--color-beige-white)]"
          title="Hands remaining"
        >
          <span className="text-blue-400">✋</span>
          <span>{handsRemaining}</span>
        </div>

        {/* Discards remaining */}
        <div
          className="flex items-center gap-1 text-[var(--color-beige-white)]"
          title="Discards remaining"
        >
          <span className="text-red-400">🗑️</span>
          <span>{discardsRemaining}</span>
        </div>

        <div
          className="flex items-center gap-1 text-[var(--color-beige-white)]"
          title="Redraws remaining"
        >
          <span className="text-purple-300">↻</span>
          <span>{redrawsRemaining}</span>
        </div>
      </div>

      {/* Skip button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onSkip}
        disabled={!canSkip}
        className="min-w-[52px] px-2 sm:min-w-[80px] sm:px-4"
      >
        SKIP
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onRedraw}
        disabled={!canRedraw}
        className="min-w-[64px] px-2 sm:min-w-[80px] sm:px-4"
      >
        REDRAW
      </Button>

      {onDeadWallDraw && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onDeadWallDraw}
          disabled={!canUseDeadWallWrit}
          aria-label="DEAD WALL DRAW"
          className="min-w-[52px] px-2 sm:min-w-[92px] sm:px-3"
        >
          <span className="sm:hidden">WALL</span>
          <span className="hidden sm:inline">DEAD DRAW</span>
        </Button>
      )}

      {/* Play Hand button */}
      <Button
        variant="primary"
        size="sm"
        onClick={onPlayHand}
        disabled={!canPlay}
        aria-label="PLAY HAND"
        className={`min-w-[82px] flex-1 px-2 sm:max-w-[220px] sm:px-4 ${willClear ? 'shadow-[0_0_22px_rgba(74,222,128,0.45)]' : ''}`}
      >
        <span className="whitespace-nowrap">
          {willClear ? 'CLEAR' : 'PLAY HAND'}
        </span>
        {projectedScore !== undefined && (
          <span className="ml-1.5 text-xs opacity-75">
            +{projectedScore.toLocaleString()}
          </span>
        )}
      </Button>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ActionBar
