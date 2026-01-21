/**
 * RoundTypeIndicator Component for Tensho Mahjong Roguelike
 *
 * Displays the current round type (Small/Large/Boss) with Japanese name
 * and optional boss mandate information.
 *
 * @module components/gameplay/RoundTypeIndicator
 */

import React from 'react'
import { RoundType, ROUND_TYPE_CONFIG, isCJKLanguage } from './gameplayTypes'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for RoundTypeIndicator
 */
export interface RoundTypeIndicatorProps {
  /** Current round type */
  roundType: RoundType
  /** Boss mandate name (only shown for Boss rounds) */
  mandateName?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Round type indicator with Japanese text and mandate display.
 *
 * Shows the round type in a colored pill/badge format:
 * - Small (小局): Green
 * - Large (大局): Blue
 * - Boss (親局): Purple with mandate name
 *
 * Japanese names are shown when the UI language is CJK.
 */
export function RoundTypeIndicator({ roundType, mandateName }: RoundTypeIndicatorProps) {
  const config = ROUND_TYPE_CONFIG[roundType]
  const showCJK = isCJKLanguage()

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1
        ${config.bgColor} ${config.borderColor}
        border rounded-full
      `}
    >
      {/* Japanese name (shown for CJK languages) */}
      {showCJK && <span className={`font-bold ${config.color}`}>{config.japaneseName}</span>}

      {/* English round type */}
      <span className="text-[var(--color-beige-white)] text-sm">{roundType}</span>

      {/* Mandate name for boss rounds */}
      {mandateName && <span className="text-xs text-red-400 font-medium">| {mandateName}</span>}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default RoundTypeIndicator
