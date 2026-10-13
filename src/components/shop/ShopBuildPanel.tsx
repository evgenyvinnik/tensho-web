import { ControlIcon } from '../ui/ControlIcon'
import { useId, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { OwnedDecree } from '../../systems/types'
import { decreeKey } from '../../systems/decreeIdentity'
import { useItemText } from '../../i18n/useItemText'
import { DecreeCardCompact } from '../gameplay/DecreeBar'
import { DecreeCapacityNotice } from '../gameplay/DecreeCapacityNotice'
import { ConfirmPopup } from '../ui/Popup'
import type { YakuRepetitionHistory } from '../ui/YakuRepetitionDetails'

interface Props {
  yakuHistory?: YakuRepetitionHistory
  completeConcealedHandsPlayed?: number
  decrees: OwnedDecree[]
  maxSlots: number
  onSell: (instanceId: string) => { success: boolean }
  /** Compact run trackers shown at the end of the heading row. */
  aside?: ReactNode
  /** Keep the build one compact disclosure on phones; desktop stays expanded. */
  compact?: boolean
}

/** The player's actual ordered build, not a predicted shopping recommendation. */
export function ShopBuildPanel({
  decrees,
  maxSlots,
  onSell,
  yakuHistory,
  completeConcealedHandsPlayed,
  aside,
  compact = false,
}: Props) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const titleId = useId()
  const detailsId = useId()
  const [expanded, setExpanded] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    name: string
    failed: boolean
  } | null>(null)
  const pending = decrees.find((d) => decreeKey(d) === pendingId)
  const number = (value: number) => value.toLocaleString(i18n.resolvedLanguage)

  return (
    <section
      data-shop-build
      aria-labelledby={titleId}
      className="mx-3 mt-2 min-w-0 rounded-xl border border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)]/85 p-3 sm:mx-5"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="min-w-0 flex-1 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3">
          <h2
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            className="break-words text-base font-bold text-[var(--color-golden-yellow)] focus-visible:outline focus-visible:outline-2 sm:text-lg"
          >
            {t('shop.build.title')}
          </h2>
          <span
            data-build-slots
            className="block text-xs text-[var(--color-beige-white)]/75 sm:text-sm"
          >
            {t('shop.build.slots', {
              used: number(decrees.length),
              max: number(maxSlots),
            })}
          </span>
        </div>
        {aside && <div className="ml-auto shrink-0">{aside}</div>}
        {compact && (
          <button
            type="button"
            data-build-toggle
            aria-label={t('shop.build.title')}
            aria-controls={detailsId}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--color-metallic-gold)]/40 text-[var(--color-metallic-gold)] sm:hidden"
          >
            <ControlIcon
              name="next"
              size={20}
              className={expanded ? '-rotate-90' : 'rotate-90'}
            />
          </button>
        )}
      </div>
      <DecreeCapacityNotice owned={decrees.length} slots={maxSlots} />
      <div
        id={detailsId}
        data-shop-build-content
        // A desktop card/popover remains reachable if the viewport narrows
        // while it owns focus. Opening it never selects or sells a Decree.
        onFocusCapture={() => setExpanded(true)}
        onClickCapture={() => setExpanded(true)}
        className={compact && !expanded ? 'hidden sm:block' : ''}
      >
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-beige-white)]/75">
          {t('shop.build.help')}
        </p>
        {decrees.length ? (
          <div
            data-tutorial="decrees"
            className="mt-2 flex flex-wrap gap-3 p-1"
          >
            {decrees.map((decree) => (
              <DecreeCardCompact
                key={decreeKey(decree)}
                decree={decree}
                ownedDecrees={decrees}
                yakuHistory={yakuHistory}
                completeConcealedHandsPlayed={completeConcealedHandsPlayed}
                onSell={() => {
                  // A stable focus return target survives removal of the sold card
                  // and the transient detail popover that launched confirmation.
                  titleRef.current?.focus({ preventScroll: true })
                  setFeedback(null)
                  setPendingId(decreeKey(decree))
                }}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-beige-white)]/60">
            {t('shop.build.empty')}
          </p>
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        className="text-sm text-[var(--color-beige-white)]"
      >
        {feedback
          ? t(feedback.failed ? 'shop.build.saleFailed' : 'shop.build.sold', {
              name: feedback.name,
            })
          : ''}
      </p>
      {pending && (
        <ConfirmPopup
          isOpen
          onClose={() => setPendingId(null)}
          title={t('gameplay.sellNamed', {
            name: itemText.name('decrees', pending),
          })}
          message={t('shop.build.sellPrompt', {
            name: itemText.name('decrees', pending),
            gold: number(pending.sellValue ?? Math.floor(pending.cost / 2)),
          })}
          confirmText={t('common.confirm')}
          onConfirm={() => {
            const result = onSell(decreeKey(pending))
            setFeedback({
              name: itemText.name('decrees', pending),
              failed: !result.success,
            })
          }}
        />
      )}
    </section>
  )
}
