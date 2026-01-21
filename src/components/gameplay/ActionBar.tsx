/**
 * ActionBar Component for Tensho Mahjong Roguelike
 *
 * Bottom action bar with gameplay buttons (Skip, Draw, Play Hand)
 * and wall remaining indicator.
 *
 * @module components/gameplay/ActionBar
 */

import React from 'react'
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
  /** Number of tiles in hand */
  handTileCount: number
  /** Number of hands remaining this round */
  handsRemaining: number
  /** Current round number (1-3) */
  currentRound: number
  /** Handler for skip action */
  onSkip: () => void
  /** Handler for draw action */
  onDraw: () => void
  /** Handler for play hand action */
  onPlayHand: () => void
  /** Translation function for i18n */
  t: (key: string) => string
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Bottom action bar for gameplay controls.
 *
 * Features:
 * - Wall remaining indicator
 * - Skip button (disabled for boss rounds)
 * - Draw button (disabled when hand is full)
 * - Play Hand button (disabled when no hands remaining)
 * - 44px minimum touch targets for accessibility
 */
export function ActionBar({
  wallRemaining,
  handTileCount,
  handsRemaining,
  currentRound,
  onSkip,
  onDraw,
  onPlayHand,
  t,
}: ActionBarProps) {
  const canDraw = handTileCount < 14
  const canPlay = handsRemaining > 0
  const canSkip = currentRound !== 3 // Can't skip boss rounds

  return (
    <div className="flex justify-center items-center gap-4 px-4 py-4 bg-[var(--color-dark-forest)]">
      {/* Wall remaining indicator */}
      <span data-tutorial="wall" className="flex items-center gap-1 text-[var(--color-beige-white)] text-sm">
        <span className="text-gray-400">📦</span> {wallRemaining}
      </span>

      {/* Skip button */}
      <Button variant="secondary" size="sm" onClick={onSkip} disabled={!canSkip}>
        SKIP
      </Button>

      {/* Draw button */}
      <div data-tutorial="draw-button">
        <Button variant="secondary" size="sm" onClick={onDraw} disabled={!canDraw}>
          {t('gameplay.draw').toUpperCase()}
        </Button>
      </div>

      {/* Play Hand button */}
      <Button variant="primary" size="sm" onClick={onPlayHand} disabled={!canPlay}>
        PLAY HAND
      </Button>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ActionBar
