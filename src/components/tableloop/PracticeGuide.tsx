/**
 * PracticeGuide
 *
 * The first-session sequence from section 7 of
 * `docs/GAMEPLAY_EXPERIMENTS.md`, in that order: two moves offered for
 * inspection with the slot each one needs, the chosen group left visible, an
 * opportunity for the next group to answer it, the interaction named only
 * *after* the player has seen it happen, then one upgrade whose relevance to
 * that experience is obvious, then ordinary seeded play.
 *
 * Every step is derived from the run state, so the guide cannot claim progress
 * the table does not show.
 *
 * @module components/tableloop/PracticeGuide
 */

import { useTranslation } from 'react-i18next'
import { MeldType } from '../../core/Meld'
import { getTableDecree } from '../../tableloop/content'
import {
  PRACTICE_DECREE,
  practiceOpeningMoves,
  type PracticeStep,
} from '../../tableloop/practice'
import type { TableLoopState } from '../../tableloop/types'

export interface PracticeGuideProps {
  state: TableLoopState
  step: PracticeStep
  /** Select a set of rack tiles, so the player can inspect a move. */
  onInspect: (tileIds: string[]) => void
  /** Take the practice deal's one upgrade. */
  onTakeDecree: () => void
  /** Leave practice for an ordinary seeded run. */
  onStartRealRun: () => void
}

export function PracticeGuide({
  state,
  step,
  onInspect,
  onTakeDecree,
  onStartRealRun,
}: PracticeGuideProps) {
  const { t } = useTranslation()
  const moves = practiceOpeningMoves(state)
  const decree = getTableDecree(PRACTICE_DECREE)

  return (
    <section
      data-testid="practice-guide"
      data-practice-step={step.id}
      role="region"
      aria-label={t('tableLoop.practice.label', 'Practice deal')}
      className="mx-3 mb-1 rounded-lg border border-sky-400/40 bg-sky-950/30 px-2.5 py-2"
    >
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300/80">
        {t('tableLoop.practice.label', 'Practice deal')}
      </p>

      <h2 className="text-xs font-bold text-[var(--color-beige-white)]">
        {t(`tableLoop.practice.${step.id}.title`, step.title)}
      </h2>
      <p
        role="status"
        aria-live="polite"
        className="mt-0.5 text-[11px] leading-snug text-[var(--color-beige-white)]/70"
      >
        {t(`tableLoop.practice.${step.id}.body`, step.body)}
      </p>

      {step.id === 'choose' && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {moves.run.length > 0 && (
            <button
              type="button"
              data-testid="practice-inspect-run"
              onClick={() => onInspect(moves.run)}
              className="rounded-md border border-sky-400/50 px-2 py-1 text-[10px] text-sky-100 hover:border-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
            >
              {t('tableLoop.practice.inspectRun', 'Show me the run · {{slot}}', {
                slot: t(`melds.${MeldType.Sequence}`, 'Sequence'),
              })}
            </button>
          )}
          {moves.pair.length > 0 && (
            <button
              type="button"
              data-testid="practice-inspect-pair"
              onClick={() => onInspect(moves.pair)}
              className="rounded-md border border-sky-400/50 px-2 py-1 text-[10px] text-sky-100 hover:border-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
            >
              {t('tableLoop.practice.inspectPair', 'Show me the pair · {{slot}}', {
                slot: t(`melds.${MeldType.Pair}`, 'Pair'),
              })}
            </button>
          )}
        </div>
      )}

      {step.id === 'upgrade' && (
        <button
          type="button"
          data-testid="practice-take-decree"
          onClick={onTakeDecree}
          className="mt-1.5 rounded-md border-2 border-[var(--color-golden-yellow)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-golden-yellow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
        >
          {t('tableLoop.practice.takeDecree', 'Take {{name}}', {
            name: t(`tableLoop.decrees.${PRACTICE_DECREE}.name`, decree.name),
          })}
        </button>
      )}

      {step.id === 'ready' && (
        <button
          type="button"
          data-testid="practice-start-real"
          onClick={onStartRealRun}
          className="mt-1.5 rounded-md border-2 border-[var(--color-golden-yellow)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-golden-yellow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
        >
          {t('tableLoop.practice.startReal', 'Start a real run')}
        </button>
      )}
    </section>
  )
}

export default PracticeGuide
