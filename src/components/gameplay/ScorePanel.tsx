/**
 * ScorePanel Component for Tensho Mahjong Roguelike
 *
 * Displays target score, current score, points/mult breakdown,
 * and progress bar for the current round.
 *
 * @module components/gameplay/ScorePanel
 */

import React from 'react'
import { GlowEffect } from '../effects/GlowEffect'
import { ScorePopup } from '../effects/ScorePopup'
import { PointsMultDisplay } from './PointsMultDisplay'
import { ScorePopupState } from './gameplayTypes'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for ScorePanel
 */
export interface ScorePanelProps {
  /** Target score to reach */
  targetScore: number
  /** Current score */
  currentScore: number
  /** Base points for display */
  currentPoints: number
  /** Current multiplier */
  currentMult: number
  /** Whether the score is animating */
  isScoreAnimating: boolean
  /** Active score popups */
  scorePopups: ScorePopupState[]
  /** Handler for popup completion */
  onPopupComplete: (id: number) => void
  /** Translation function for i18n */
  t: (key: string) => string
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Score tracking panel for gameplay.
 *
 * Features:
 * - Target score display with glow effect
 * - Points × Mult = Total visualization
 * - Current score display
 * - Progress bar showing percentage toward target
 * - Floating score popups for score increases
 */
export function ScorePanel({
  targetScore,
  currentScore,
  currentPoints,
  currentMult,
  isScoreAnimating,
  scorePopups,
  onPopupComplete,
  t,
}: ScorePanelProps) {
  const hasReachedTarget = currentScore >= targetScore
  const progressPercentage = Math.min(100, (currentScore / targetScore) * 100)

  return (
    <div className="flex-shrink-0 mx-4 my-2 p-4 bg-[var(--color-dark-forest)] rounded-lg text-center relative">
      {/* Target label */}
      <p className="text-sm text-[var(--color-beige-white)] opacity-70 mb-1">
        {t('gameplay.target').toUpperCase()}
      </p>

      {/* Target score with glow */}
      <GlowEffect variant="gold" intensity={hasReachedTarget ? 0.8 : 0.4} pulsing={hasReachedTarget}>
        <p data-tutorial="score-target" className="text-3xl font-bold text-[var(--color-golden-yellow)]">
          {targetScore.toLocaleString()}
        </p>
      </GlowEffect>

      {/* Points x Mult display */}
      <div className="my-3">
        <PointsMultDisplay
          points={currentPoints || currentScore}
          mult={currentMult}
          isAnimating={isScoreAnimating}
        />
      </div>

      {/* Current score */}
      <p data-tutorial="current-score" className="text-lg text-[var(--color-beige-white)]">
        {t('gameplay.score').toUpperCase()}:{' '}
        <span className="font-bold text-[var(--color-golden-yellow)]">{currentScore.toLocaleString()}</span>
      </p>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            hasReachedTarget ? 'bg-green-500' : 'bg-[var(--color-vibrant-orange)]'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Score popups */}
      {scorePopups.map((popup) => (
        <ScorePopup
          key={popup.id}
          points={popup.score}
          variant={popup.variant}
          position={{ x: 50, y: 20 }}
          onComplete={() => onPopupComplete(popup.id)}
        />
      ))}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ScorePanel
