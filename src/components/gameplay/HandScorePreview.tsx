/**
 * HandScorePreview: what the selected tiles will score, in the middle of the
 * table. Pattern name, points × Mult, and the total — exactly the numbers the
 * engine pays for this selection, never an estimate.
 *
 * With nothing selected it shows the last hand played, dimmed and labelled as
 * such, so the forecast is never confused with the round's running score.
 *
 * @module components/gameplay/HandScorePreview
 */

import { useTranslation } from 'react-i18next'
import type { PlayPatternId } from '../../rules/PlayPattern'
import { scoreRounding } from '../../rules/ScoreEquation'
import { scoreNumber } from '../../utils/scoreNumber'
import { DoomFire } from '../effects/DoomFire'

export interface HandScoreValue {
  pattern: PlayPatternId
  points: number
  /** The true multiplier, never total ÷ points. */
  mult: number
  /** After-score effects such as Decay; zero when there are none. */
  adjustment?: number
  total: number
}

export interface HandScorePreviewProps {
  /** The current selection's authoritative preview. */
  preview: HandScoreValue | null
  /** Some selected tiles are face-down: the score cannot be shown. */
  hidden?: boolean
  /** The last committed play, shown when nothing is selected. */
  lastPlay: HandScoreValue | null
  /** A celebration: intensity 0–1 and a changing key. */
  fire?: { intensity: number; burst: number }
  reducedMotion?: boolean
}

export function HandScorePreview({
  preview,
  hidden = false,
  lastPlay,
  fire,
  reducedMotion = false,
}: HandScorePreviewProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const shown = preview ?? lastPlay
  const isLast = !preview && !!lastPlay
  // Up to three trimmed decimals: ×2.2, ×0.975 — enough to multiply out.
  const multText = (value: number) => scoreNumber(value, language).exact
  // The engine pays floor(points × Mult) + adjustment. When the product has a
  // fraction, an arrow and a note show where it went, so the numbers add up.
  const rounding =
    !hidden && shown ? scoreRounding(shown.points, shown.mult) : null
  const roundingNote = rounding?.roundedDown
    ? t('scoring.roundedDown', {
        product: scoreNumber(rounding.product, language).exact,
        rounded: scoreNumber(rounding.rounded, language).exact,
      })
    : undefined
  const adjustment = !hidden && shown ? (shown.adjustment ?? 0) : 0
  const label = hidden
    ? t('gameplay.handScore', 'Hand score')
    : isLast
      ? t('gameplay.lastHand', 'Last hand')
      : t('gameplay.handScore', 'Hand score')

  return (
    <section
      data-hand-score
      data-hand-score-state={
        hidden ? 'hidden' : preview ? 'preview' : isLast ? 'last' : 'empty'
      }
      aria-live="polite"
      aria-label={label}
      className="relative mx-auto flex w-full max-w-[20rem] flex-col items-center overflow-hidden rounded-xl border border-[var(--color-metallic-gold)]/35 bg-black/35 px-3 py-1.5 text-center shadow-inner"
    >
      {fire && (
        <DoomFire
          intensity={fire.intensity}
          burst={fire.burst}
          reducedMotion={reducedMotion}
          className="absolute inset-x-0 bottom-0 h-full w-full opacity-90"
        />
      )}
      <p className="relative text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-beige-white)]/55">
        {label}
      </p>
      <p
        data-hand-score-pattern
        className={`relative min-h-5 text-sm font-bold leading-5 [overflow-wrap:anywhere] ${
          isLast
            ? 'text-[var(--color-beige-white)]/60'
            : 'text-[var(--color-golden-yellow)]'
        }`}
      >
        {hidden
          ? t('gameplay.hiddenScore', 'Face-down tiles')
          : shown
            ? t(`patterns.${shown.pattern}.name`)
            : ' '}
      </p>
      <div
        className={`relative flex items-center gap-1.5 font-mono text-base font-black tabular-nums sm:text-lg ${
          isLast ? 'opacity-60' : ''
        }`}
      >
        <span
          data-hand-score-points
          className="min-w-[3.25rem] rounded-md bg-sky-700/85 px-2 py-0.5 text-white shadow"
        >
          {!hidden && shown ? scoreNumber(shown.points, language).display : '—'}
        </span>
        <span aria-hidden="true" className="text-[var(--color-beige-white)]/70">
          ×
        </span>
        <span
          data-hand-score-mult
          className="min-w-[2.5rem] rounded-md bg-red-700/85 px-2 py-0.5 text-white shadow"
        >
          {!hidden && shown ? multText(shown.mult) : '—'}
        </span>
        {adjustment !== 0 && (
          <span
            data-hand-score-adjustment
            title={t('scoring.adjustments')}
            className="text-sm text-amber-200"
          >
            {adjustment > 0 ? '+' : '−'}
            {scoreNumber(Math.abs(adjustment), language).display}
          </span>
        )}
        <span
          data-score-operator
          title={roundingNote}
          className="text-[var(--color-beige-white)]/70"
        >
          <span aria-hidden="true">{rounding?.roundedDown ? '→' : '='}</span>
          {roundingNote && <span className="sr-only">{roundingNote}</span>}
        </span>
        <span
          data-hand-score-total
          className="min-w-[3rem] text-left text-[var(--color-golden-yellow)] drop-shadow"
          title={
            !hidden && shown
              ? scoreNumber(shown.total, language).exact
              : undefined
          }
        >
          {!hidden && shown ? scoreNumber(shown.total, language).display : '—'}
        </span>
      </div>
    </section>
  )
}

export default HandScorePreview
