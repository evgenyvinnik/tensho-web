import { useTranslation } from 'react-i18next'
import { NORMAL_RUN_ACTS } from '../../config/runProgression'

interface Props {
  act: number
  round: number
  nextAct: number
  hasWonRun: boolean
}

/** Campaign position, not a count of rounds played (Charters can repeat Acts). */
export function RunJourney({ act, round, nextAct, hasWonRun }: Props) {
  const { t, i18n } = useTranslation()
  const number = (value: number) => value.toLocaleString(i18n.resolvedLanguage)
  // A legacy run already beyond the new finish line still clears its Boss.
  const totalActs = Math.max(NORMAL_RUN_ACTS, act)
  const position = hasWonRun
    ? t('runJourney.complete', { total: number(NORMAL_RUN_ACTS) })
    : t('runJourney.position', {
        act: number(act),
        round: number(round),
        total: number(totalActs),
      })
  return (
    <section
      data-run-journey
      aria-label={position}
      className="mx-3 mt-3 rounded-xl border border-[var(--color-metallic-gold)]/30 bg-[var(--color-dark-forest)]/85 px-3 py-2 sm:mx-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs leading-relaxed">
        <p className="font-semibold text-[var(--color-golden-yellow)]">
          {position}
        </p>
        <p className="text-[var(--color-beige-white)]/80">
          {t('runJourney.next', {
            act: number(round === 3 ? nextAct : act),
            round: number(round === 3 ? 1 : round + 1),
          })}
        </p>
      </div>
      {!hasWonRun && (
        <progress
          aria-label={position}
          value={Math.min(totalActs * 3, Math.max(0, (act - 1) * 3 + round))}
          max={totalActs * 3}
          className="mt-1 block h-1.5 w-full accent-[var(--color-golden-yellow)]"
        />
      )}
    </section>
  )
}
