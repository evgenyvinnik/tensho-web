/**
 * ScorePanel Component for Tensho Mahjong Roguelike
 *
 * Displays target score, current score, points/mult breakdown,
 * and progress bar for the current round.
 *
 * @module components/gameplay/ScorePanel
 */

import { TFunction } from 'i18next'
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
  t: TFunction
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
  const remainingScore = Math.max(0, targetScore - currentScore)

  return (
    <div className="relative mx-3 my-1 flex-shrink-0 rounded-xl border border-white/5 bg-[var(--color-dark-forest)]/95 px-3 py-2 text-center shadow-lg">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2 text-left">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-beige-white)]/55">
            {t('gameplay.target')}
          </span>
          <GlowEffect variant="gold" intensity={hasReachedTarget ? 0.8 : 0.4} pulsing={hasReachedTarget}>
            <span data-tutorial="score-target" className="text-xl font-black tabular-nums text-[var(--color-golden-yellow)] sm:text-2xl">
              {targetScore.toLocaleString()}
            </span>
          </GlowEffect>
        </div>

        <div className="flex min-w-0 items-baseline gap-2 text-right">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-beige-white)]/55">
            {t('gameplay.score')}
          </span>
          <span data-tutorial="current-score" className="text-xl font-black tabular-nums text-[var(--color-golden-yellow)] sm:text-2xl">
            {currentScore.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-1">
        <PointsMultDisplay
          points={currentPoints || currentScore}
          mult={currentMult}
          isAnimating={isScoreAnimating}
        />
      </div>

      {/* Progress bar */}
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-800"
        role="progressbar"
        aria-label={`${currentScore} of ${targetScore} points`}
        aria-valuenow={currentScore}
        aria-valuemin={0}
        aria-valuemax={targetScore}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            hasReachedTarget ? 'bg-green-500' : 'bg-[var(--color-vibrant-orange)]'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <p className={`mt-1 text-right text-[10px] font-semibold tabular-nums ${
        hasReachedTarget ? 'text-emerald-300' : 'text-[var(--color-beige-white)]/45'
      }`}>
        {hasReachedTarget
          ? t('gameplay.targetCleared', 'Target cleared')
          : t('gameplay.pointsToClear', {
              count: remainingScore,
              defaultValue: '{{count}} to clear',
            })}
      </p>

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
