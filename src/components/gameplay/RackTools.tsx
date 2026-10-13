import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { illustrationAssets } from '../../utils/assets'

/** One disclosure, not another modal: nested tools keep their own focus return. */
export function RackTools({
  children,
  onOpenBeginnerGuide,
  onOpenHandBuilder,
  riichiControl,
}: {
  children: ReactNode
  onOpenBeginnerGuide?: () => void
  onOpenHandBuilder?: () => void
  riichiControl?: ReactNode
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  const hasTools = Boolean(onOpenHandBuilder || riichiControl)
  return (
    <div
      data-rack-header
      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-1.5 [overflow-anchor:none] sm:flex sm:flex-wrap sm:items-center sm:gap-x-3"
    >
      <div className="contents sm:flex sm:min-w-0 sm:flex-wrap sm:items-center sm:gap-2">
        {children}
      </div>
      <div className="col-start-2 row-start-1 flex shrink-0 gap-1">
        {onOpenBeginnerGuide && (
          <button
            type="button"
            data-open-beginner-guide
            onClick={onOpenBeginnerGuide}
            aria-label={t('gameplay.learnPatterns')}
            title={t('gameplay.learnPatterns')}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-metallic-gold)]/45 bg-black/20 px-2 text-xs font-semibold text-[var(--color-metallic-gold)] transition-colors hover:border-[var(--color-golden-yellow)] hover:text-[var(--color-golden-yellow)]"
          >
            <img
              src={illustrationAssets.beginnerGuidebook}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
            />
            <span aria-hidden="true" className="hidden md:inline">
              {t('gameplay.learnPatterns')}
            </span>
          </button>
        )}
        {hasTools && (
          <button
            type="button"
            data-open-rack-tools
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={t('gameplay.moreTools')}
            title={t('gameplay.moreTools')}
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-amber-200/35 text-amber-200 transition-colors hover:bg-white/10 aria-expanded:bg-white/10 sm:hidden"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 items-center justify-center text-2xl leading-none"
            >
              ⋯
            </span>
          </button>
        )}
      </div>
      {hasTools && (
        <div
          id={panelId}
          data-rack-tools
          // Remember desktop use too: rotating to a narrow viewport while a
          // tool is open must leave its return-focus target visible.
          onFocusCapture={() => setExpanded(true)}
          onClickCapture={() => setExpanded(true)}
          className={`${expanded ? 'flex' : 'hidden'} col-span-2 min-w-0 items-center gap-2 rounded-lg border border-amber-200/20 bg-black/15 p-2 sm:flex sm:border-0 sm:bg-transparent sm:p-0`}
        >
          <img
            src={illustrationAssets.tableTools}
            alt=""
            width={64}
            height={64}
            loading="lazy"
            className="h-16 w-16 shrink-0 object-contain sm:hidden"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 [&>button]:whitespace-normal [&>button]:[overflow-wrap:anywhere] sm:flex-row sm:flex-wrap">
            {onOpenHandBuilder && (
              <button
                type="button"
                data-open-hand-builder
                onClick={onOpenHandBuilder}
                className="min-h-11 rounded-lg border border-amber-200/35 px-2 py-1 text-left text-sm text-amber-200"
              >
                {t('handBuilder.title')}
              </button>
            )}
            {riichiControl}
          </div>
        </div>
      )}
    </div>
  )
}
