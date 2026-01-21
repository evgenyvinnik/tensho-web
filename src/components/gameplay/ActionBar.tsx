/**
 * ActionBar Component for Tensho Mahjong Roguelike
 *
 * Bottom action bar with gameplay buttons (Skip, Play Hand)
 * and wall remaining indicator.
 *
 * @module components/gameplay/ActionBar
 */

import React from 'react'
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
  /** Current round number (1-3) */
  currentRound: number
  /** Handler for skip action */
  onSkip: () => void
  /** Handler for play hand action */
  onPlayHand: () => void
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
  currentRound,
  onSkip,
  onPlayHand,
  t: _t,
}: ActionBarProps) {
  const canPlay = handsRemaining > 0
  const canSkip = currentRound !== 3 // Can't skip boss rounds

  return (
    <div className="flex justify-center items-center gap-4 px-4 py-4 bg-[var(--color-dark-forest)]">
      {/* Resource indicators */}
      <div className="flex items-center gap-3 text-sm">
        {/* Wall remaining */}
        <div className="flex items-center gap-1 text-[var(--color-beige-white)]" title="Tiles in wall">
          <span className="text-gray-400">📦</span>
          <span>{wallRemaining}</span>
        </div>

        {/* Hands remaining */}
        <div className="flex items-center gap-1 text-[var(--color-beige-white)]" title="Hands remaining">
          <span className="text-blue-400">✋</span>
          <span>{handsRemaining}</span>
        </div>

        {/* Discards remaining */}
        <div className="flex items-center gap-1 text-[var(--color-beige-white)]" title="Discards remaining">
          <span className="text-red-400">🗑️</span>
          <span>{discardsRemaining}</span>
        </div>
      </div>

      {/* Skip button */}
      <Button variant="secondary" size="sm" onClick={onSkip} disabled={!canSkip}>
        SKIP
      </Button>

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
