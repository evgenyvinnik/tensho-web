/**
 * CoachPanel
 *
 * Shows the two moves a beginner should be weighing: the play that scores most
 * right now, and the recognizable shape worth building toward. Both are priced
 * with the game's own preview, and the panel states the round pressure so the
 * larger number is never presented as automatically correct.
 *
 * Section 1.4 of `docs/GAMEPLAY_EXPERIMENTS.md` describes the habit this
 * replaces: a coach that ranked one group's structure points and called it the
 * best move.
 *
 * It renders as one line inside the score bar, where the forecast appears once
 * tiles are chosen. The gameplay screen has no spare vertical budget, and the
 * score bar is exactly where a player compares numbers.
 *
 * @module components/gameplay/CoachPanel
 */

import { useTranslation } from 'react-i18next'
import type { CoachAdvice, CoachOption } from '../../gameplay/beginnerCoach'
import { MeldType } from '../../core/Meld'

export interface CoachPanelProps {
  advice: CoachAdvice
  /** Apply an option's selection to the hand. */
  onChoose: (tileIds: string[]) => void
  /** Hide the coach for the rest of the session. */
  onDismiss?: () => void
}

export function CoachPanel({ advice, onChoose, onDismiss }: CoachPanelProps) {
  const { t } = useTranslation()

  const patternLabel = (pattern: MeldType | null) =>
    pattern ? t(`melds.${pattern}`, pattern) : null

  const options: {
    key: string
    title: string
    detail: string
    option: CoachOption
  }[] = [
    {
      key: 'now',
      title: t('gameplay.coach.pointsNow', 'Points now'),
      detail: advice.keepsPace
        ? t(
            'gameplay.coach.keepsPace',
            'Keeps pace: this hand needs {{required}}.',
            { required: advice.requiredPerHand }
          )
        : t(
            'gameplay.coach.behindPace',
            'Short of the {{required}} this hand needs.',
            { required: advice.requiredPerHand }
          ),
      option: advice.best,
    },
  ]

  if (advice.shape) {
    const name = patternLabel(advice.shape.pattern)
    options.push({
      key: 'build',
      title: name
        ? t('gameplay.coach.buildToward', 'Build toward a {{pattern}}', {
            pattern: name,
          })
        : t('gameplay.coach.buildTowardPlain', 'Build toward a shape'),
      detail: t(
        'gameplay.coach.shapeCost',
        'Scores {{difference}} less now, and keeps a pattern you can name.',
        { difference: Math.max(0, advice.best.score - advice.shape.score) }
      ),
      option: advice.shape,
    })
  }

  return (
    <div data-testid="coach-panel" className="flex w-full items-center gap-2">
      <div className="flex min-w-0 flex-1 gap-1.5">
        {options.map(({ key, title, detail, option }) => {
          return (
            <button
              key={key}
              title={detail}
              onClick={() => onChoose(option.tileIds)}
              className="min-h-9 min-w-0 flex-1 basis-0 rounded-md border border-[var(--color-metallic-gold)]/25 px-2 py-0.5 text-left transition-colors hover:border-[var(--color-metallic-gold)]/60"
            >
              {/* One line in the score bar; the reasoning is the tooltip. */}
              <span className="flex items-baseline justify-between gap-1.5">
                <span className="truncate text-xs font-semibold text-[var(--color-beige-white)]">
                  {title}
                </span>
                <span className="flex-shrink-0 text-sm font-black tabular-nums text-[var(--color-golden-yellow)]">
                  +{option.score.toLocaleString()}
                </span>
              </span>
              <span className="sr-only">{detail}</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={onDismiss}
        aria-label={t('gameplay.coach.title', 'Two ways to play this')}
        className="flex-shrink-0 self-stretch px-1 text-[10px] uppercase tracking-wider text-[var(--color-beige-white)]/45 hover:text-[var(--color-beige-white)]"
      >
        {t('gameplay.coach.dismiss', 'Hide')}
      </button>
    </div>
  )
}

export default CoachPanel
