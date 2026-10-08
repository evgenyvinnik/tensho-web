import { useId, useRef, useState } from 'react'
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
  decrees: OwnedDecree[]
  maxSlots: number
  onSell: (instanceId: string) => { success: boolean }
}

/** The player's actual ordered build, not a predicted shopping recommendation. */
export function ShopBuildPanel({
  decrees,
  maxSlots,
  onSell,
  yakuHistory,
}: Props) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const titleId = useId()
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
      className="mx-3 mt-4 min-w-0 rounded-xl border border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)]/85 p-3 sm:mx-5 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id={titleId}
          ref={titleRef}
          tabIndex={-1}
          className="text-lg font-bold text-[var(--color-golden-yellow)] focus-visible:outline focus-visible:outline-2"
        >
          {t('shop.build.title')}
        </h2>
        <span
          data-build-slots
          className="text-sm text-[var(--color-beige-white)]/75"
        >
          {t('shop.build.slots', {
            used: number(decrees.length),
            max: number(maxSlots),
          })}
        </span>
      </div>
      <DecreeCapacityNotice owned={decrees.length} slots={maxSlots} />
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-beige-white)]/75">
        {t('shop.build.help')}
      </p>
      {decrees.length ? (
        <div data-tutorial="decrees" className="mt-3 flex flex-wrap gap-3 p-1">
          {decrees.map((decree) => (
            <DecreeCardCompact
              key={decreeKey(decree)}
              decree={decree}
              ownedDecrees={decrees}
              yakuHistory={yakuHistory}
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
        <p className="mt-3 text-sm text-[var(--color-beige-white)]/60">
          {t('shop.build.empty')}
        </p>
      )}
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
