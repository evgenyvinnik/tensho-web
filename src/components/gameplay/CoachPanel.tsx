import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CoachAdvice, CoachOption } from '../../gameplay/beginnerCoach'
import type { Tile } from '../../core/Tile'
import { Popup } from '../ui/Popup'
import { TileImage } from '../tiles/TileImage'
import { scoreNumber } from '../../utils/scoreNumber'

export interface CoachPanelProps {
  advice: CoachAdvice
  /** Visible physical tiles only; never supply concealed identities. */
  visibleTiles?: Tile[]
  /** Select for a forecast, never commit a paid play. */
  onChoose: (tileIds: string[]) => void
  onDismiss?: () => void
}

/** Priced choices, not a promise about future draws or optimal strategy. */
export function CoachPanel({
  advice,
  visibleTiles = [],
  onChoose,
  onDismiss,
}: CoachPanelProps) {
  const { t, i18n } = useTranslation()
  const [explaining, setExplaining] = useState(false)
  const detailId = useId()
  const options: {
    key: string
    title: string
    shortTitle: string
    detail: string
    option: CoachOption
  }[] = [
    {
      key: 'now',
      title: t('gameplay.coach.pointsNow'),
      shortTitle: t('gameplay.coach.pointsShort'),
      detail: t(
        advice.keepsPace
          ? 'gameplay.coach.keepsPace'
          : 'gameplay.coach.behindPace',
        {
          required: scoreNumber(advice.requiredPerHand, i18n.language).exact,
        }
      ),
      option: advice.best,
    },
  ]
  if (advice.shape) {
    options.push({
      key: 'shape',
      title: advice.shape.pattern
        ? t(`melds.${advice.shape.pattern}`)
        : t('gameplay.coach.shapeShort'),
      shortTitle: advice.shape.pattern
        ? t(`gameplay.coach.patternShort.${advice.shape.pattern}`)
        : t('gameplay.coach.shapeShort'),
      detail: t('gameplay.coach.shapeCost', {
        difference: scoreNumber(
          Math.max(0, advice.best.score - advice.shape.score),
          i18n.language
        ).exact,
      }),
      option: advice.shape,
    })
  }
  const choose = (option: CoachOption) => {
    setExplaining(false)
    onChoose(option.tileIds)
  }
  return (
    <>
      <div
        data-testid="coach-panel"
        className="flex w-full min-w-0 items-center gap-1.5"
      >
        <div className="flex min-w-0 flex-1 gap-1.5">
          {options.map(({ key, title, shortTitle, detail, option }) => {
            const number = scoreNumber(option.score, i18n.language)
            return (
              <button
                key={key}
                type="button"
                data-coach-choice={key}
                data-coach-score={option.score}
                aria-label={`${title}: +${number.exact}`}
                aria-describedby={`${detailId}-${key}`}
                title={`${title}: +${number.exact}. ${detail}`}
                onClick={() => choose(option)}
                className="flex min-h-11 min-w-0 flex-1 basis-0 flex-col justify-center rounded-md border border-[var(--color-metallic-gold)]/25 px-1.5 py-1 text-left transition-colors hover:border-[var(--color-metallic-gold)]/60"
              >
                <span
                  data-coach-label
                  className="max-w-full text-xs font-semibold leading-tight text-[var(--color-beige-white)] [overflow-wrap:anywhere]"
                >
                  {shortTitle}
                </span>
                <span
                  aria-hidden="true"
                  className="max-w-full text-sm font-black leading-tight tabular-nums text-[var(--color-golden-yellow)] [overflow-wrap:anywhere]"
                >
                  +{number.display}
                </span>
                <span id={`${detailId}-${key}`} className="sr-only">
                  {detail}
                </span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          data-coach-explain
          onClick={() => setExplaining(true)}
          aria-haspopup="dialog"
          aria-label={t('gameplay.coach.explain')}
          title={t('gameplay.coach.explain')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--color-metallic-gold)] hover:bg-white/10"
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4" />
            <path d="M12 16v1" />
          </svg>
        </button>
      </div>
      <Popup
        isOpen={explaining}
        onClose={() => setExplaining(false)}
        title={t('gameplay.coach.explain')}
      >
        <div
          data-coach-comparison
          className="space-y-3 text-sm leading-relaxed [overflow-wrap:anywhere]"
        >
          <p>{t('gameplay.coach.tradeoff')}</p>
          {options.map(({ key, title, detail, option }) => (
            <section
              key={key}
              data-coach-option={key}
              data-coach-score={option.score}
              className="space-y-2 rounded-lg border border-[var(--color-metallic-gold)]/30 p-2"
            >
              <h3 className="text-sm font-semibold leading-relaxed text-[var(--color-golden-yellow)]">
                {title}
              </h3>
              <div className="flex flex-wrap gap-1">
                {option.tileIds.map((id) => {
                  const tile = visibleTiles.find((entry) => entry.id === id)
                  return tile ? (
                    <div key={id} data-coach-tile={id}>
                      <TileImage tile={tile} size="small" showTooltip={false} />
                    </div>
                  ) : null
                })}
              </div>
              <p data-coach-exact className="font-bold tabular-nums">
                +{scoreNumber(option.score, i18n.language).exact}
              </p>
              <p>{detail}</p>
              <button
                type="button"
                data-coach-select={key}
                onClick={() => choose(option)}
                className="min-h-11 w-full rounded-lg border border-amber-200/40 bg-emerald-950/50 px-2 py-1 font-semibold text-amber-100"
              >
                {t('gameplay.coach.previewChoice')}
              </button>
            </section>
          ))}
          {onDismiss && (
            <button
              type="button"
              data-coach-dismiss
              onClick={() => {
                setExplaining(false)
                onDismiss()
              }}
              className="min-h-11 w-full rounded-lg border border-white/20 px-2 py-1 text-sm [overflow-wrap:anywhere]"
            >
              {t('gameplay.coach.hideAdvice')}
            </button>
          )}
        </div>
      </Popup>
    </>
  )
}

export default CoachPanel
