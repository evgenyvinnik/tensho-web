import { useTranslation } from 'react-i18next'
import type { OrchestratorState } from '../../game/GameOrchestrator'

type ResultState = Pick<
  OrchestratorState,
  | 'score'
  | 'targetScore'
  | 'gold'
  | 'currentAct'
  | 'currentRound'
  | 'lastRoundSummary'
>

/** Explain the last round without confusing it with the cumulative run score. */
export function ResultRoundDetails({
  state,
  defeated,
}: {
  state: ResultState
  defeated: boolean
}) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.resolvedLanguage).format
  const { score, targetScore, gold, lastRoundSummary: summary } = state
  // Old saves can contain the previous shop's cash-out, not this final round.
  const rentalCost =
    summary?.actNumber === state.currentAct &&
    summary.roundNumber === state.currentRound &&
    summary.score === score &&
    summary.target === targetScore
      ? summary.rentalCost
      : 0
  const rows = [
    ['roundScore', score],
    ['roundTarget', targetScore],
    ...(defeated
      ? [['shortfall', Math.max(0, targetScore - score)] as const]
      : []),
    ['remainingGold', gold],
    ...(rentalCost > 0 ? [['rentalPaid', -rentalCost] as const] : []),
  ] as const

  return (
    <section
      className="mb-5 rounded-xl border border-[var(--color-metallic-gold)]/20 bg-black/15 p-3 text-left sm:mb-7 sm:p-4"
      aria-label={t('results.roundDetails')}
    >
      <dl className="space-y-2 text-sm text-[var(--color-beige-white)]/85">
        {rows.map(([key, value]) => (
          <div key={key} className="grid grid-cols-2 items-start gap-3">
            <dt className="min-w-0 break-words">{t(`results.${key}`)}</dt>
            <dd
              className={`min-w-0 break-all text-right font-semibold tabular-nums ${number(value).length > 12 ? 'text-xs sm:text-sm' : ''}`}
              data-result-detail={key}
            >
              {number(value)}
            </dd>
          </div>
        ))}
      </dl>
      {defeated && (
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-beige-white)]/65">
          {t('results.defeatIncome')}
        </p>
      )}
    </section>
  )
}
