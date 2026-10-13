/**
 * ScorePanel Component for Tensho Mahjong Roguelike
 *
 * Displays target score, current score, points/mult breakdown,
 * and progress bar for the current round.
 *
 * @module components/gameplay/ScorePanel
 */

import type { ReactNode } from 'react'
import { TFunction } from 'i18next'
import { GlowEffect } from '../effects/GlowEffect'
import { ScorePopup } from '../effects/ScorePopup'
import { PointsMultDisplay } from './PointsMultDisplay'
import { ScorePopupState } from './gameplayTypes'
import { useTranslation } from 'react-i18next'
import { scoreNumber } from '../../utils/scoreNumber'
import { ExactScoreDetails } from './ExactScoreDetails'
import { scoreRounding, type ScoreEquation } from '../../rules/ScoreEquation'

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
  /** Authoritative settled equation for the last play, separate from round score. */
  lastPlay: ScoreEquation
  /** Whether the score is animating */
  isScoreAnimating: boolean
  /** Active score popups */
  scorePopups: ScorePopupState[]
  /** Handler for popup completion */
  onPopupComplete: (id: number) => void
  /** Translation function for i18n */
  t: TFunction
  /**
   * Forecast and coaching strip for the current choice. It shares the
   * last-play slot, so the score bar stays one line: while it has content,
   * the settled equation steps aside.
   */
  forecast?: ReactNode
  forecastActive?: boolean
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
  lastPlay,
  isScoreAnimating,
  scorePopups,
  onPopupComplete,
  t,
  forecast,
  forecastActive = false,
}: ScorePanelProps) {
  const { i18n } = useTranslation()
  const hasReachedTarget = currentScore >= targetScore
  const progressPercentage = Math.min(100, (currentScore / targetScore) * 100)
  const remainingScore = Math.max(0, targetScore - currentScore)
  const remainingNumber = scoreNumber(remainingScore, i18n.language)
  const lastPlayRounding = scoreRounding(lastPlay.points, lastPlay.multiplier)
  const remainingExact = hasReachedTarget
    ? t('gameplay.targetCleared')
    : t('gameplay.pointsToClear', {
        count: remainingScore,
        formattedCount: remainingNumber.exact,
      })

  return (
    <div className="game-score-panel relative mx-2 my-1 flex-shrink-0 rounded-xl border border-white/5 bg-[var(--color-dark-forest)]/95 px-3 py-1.5 shadow-lg">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 [overflow-wrap:anywhere]">
        {/* Round progress: score, bar and target on one line. */}
        <div className="flex min-w-[min(100%,16rem)] flex-[1_1_18rem] items-center gap-3">
          <div className="min-w-0 shrink-0 text-left">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--color-beige-white)]/55">
              {t('gameplay.score')}
            </p>
            <span
              data-tutorial="current-score"
              title={scoreNumber(currentScore, i18n.language).exact}
              aria-label={scoreNumber(currentScore, i18n.language).exact}
              className="block text-lg font-black leading-tight tabular-nums text-[var(--color-golden-yellow)] sm:text-xl"
            >
              {scoreNumber(currentScore, i18n.language).display}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-gray-800"
              role="progressbar"
              aria-label={t('gameplay.score')}
              aria-valuetext={`${t('gameplay.score')}: ${scoreNumber(currentScore, i18n.language).exact}; ${t('gameplay.target')}: ${scoreNumber(targetScore, i18n.language).exact}`}
              aria-valuenow={Math.max(0, Math.min(currentScore, targetScore))}
              aria-valuemin={0}
              aria-valuemax={targetScore}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  hasReachedTarget
                    ? 'bg-green-500'
                    : 'bg-[var(--color-vibrant-orange)]'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p
              title={remainingExact}
              aria-label={remainingExact}
              className={`game-score-remaining mt-0.5 text-center text-[10px] font-semibold tabular-nums [overflow-wrap:anywhere] ${
                hasReachedTarget
                  ? 'text-emerald-300'
                  : 'text-[var(--color-beige-white)]/55'
              }`}
            >
              {hasReachedTarget
                ? t('gameplay.targetCleared', 'Target cleared')
                : t('gameplay.pointsToClear', {
                    count: remainingScore,
                    formattedCount: remainingNumber.display,
                    defaultValue: '{{formattedCount}} to clear',
                  })}
            </p>
          </div>

          <div className="min-w-0 shrink-0 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--color-beige-white)]/55">
              {t('gameplay.target')}
            </p>
            <GlowEffect
              className="min-w-0 max-w-full"
              variant="gold"
              intensity={hasReachedTarget ? 0.8 : 0.4}
              pulsing={hasReachedTarget}
            >
              <span
                data-tutorial="score-target"
                title={scoreNumber(targetScore, i18n.language).exact}
                aria-label={scoreNumber(targetScore, i18n.language).exact}
                className="block text-lg font-black leading-tight tabular-nums text-[var(--color-golden-yellow)] sm:text-xl"
              >
                {scoreNumber(targetScore, i18n.language).display}
              </span>
            </GlowEffect>
          </div>
        </div>

        {/* The current choice's forecast, or else the last play's equation. */}
        <div className="flex min-w-0 flex-[1_1_22rem] items-center gap-2">
          {forecast}
          <div
            data-last-play
            hidden={forecastActive}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            {/* Narrow phones give the equation the whole row. */}
            <p className="shrink-0 text-[9px] font-semibold uppercase leading-tight tracking-widest text-[var(--color-beige-white)]/55 max-[399px]:sr-only">
              {t('scoring.lastPlay')}
            </p>
            <div className="min-w-0 flex-1">
              <PointsMultDisplay
                compact
                points={lastPlay.points}
                mult={lastPlay.multiplier}
                adjustment={lastPlay.adjustment}
                total={lastPlay.total}
                isAnimating={isScoreAnimating}
              />
            </div>
            <ExactScoreDetails
              always={lastPlay.points !== 0 || lastPlay.adjustment !== 0}
              compact
              entries={[
                { label: t('gameplay.target'), value: targetScore },
                { label: t('gameplay.score'), value: currentScore },
                { label: t('scoring.subtotal'), value: lastPlay.points },
                {
                  label: t('scoring.totalMultiplier'),
                  value: lastPlay.multiplier,
                },
                ...(lastPlayRounding.roundedDown
                  ? [
                      {
                        label: t('scoring.beforeRounding'),
                        value: lastPlayRounding.product,
                      },
                    ]
                  : []),
                { label: t('scoring.adjustments'), value: lastPlay.adjustment },
                { label: t('scoring.lastPlay'), value: lastPlay.total },
              ]}
            />
          </div>
        </div>
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
