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
  /** The run's Yaku upgrades, on the Decrees' line at its right end. */
  upgrades?: ReactNode
}

/**
 * The player's actual ordered build, not a predicted shopping
 * recommendation: owned Decrees on the left and, on the same line, the
 * run's Yaku upgrades on the right. Each side wraps within its own column,
 * so a phone shows the whole build without opening anything.
 */
export function ShopBuildPanel({
  decrees,
  maxSlots,
  onSell,
  yakuHistory,
  completeConcealedHandsPlayed,
  aside,
  upgrades,
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
      className="mx-3 mt-2 min-w-0 rounded-xl border border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)]/85 p-3 sm:mx-5"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <h2
          id={titleId}
          ref={titleRef}
          tabIndex={-1}
          className="min-w-0 flex-1 break-words text-base font-bold text-[var(--color-golden-yellow)] focus-visible:outline focus-visible:outline-2 sm:text-lg"
        >
          {t('shop.build.title')}
        </h2>
        {aside && <div className="ml-auto shrink-0">{aside}</div>}
      </div>
      <DecreeCapacityNotice owned={decrees.length} slots={maxSlots} />
      <div data-shop-build-row className="mt-1 flex items-start gap-3">
        <div data-shop-build-content className="min-w-0 flex-[1_1_auto]">
          <p
            data-build-slots
            className="text-xs font-semibold uppercase tracking-wider text-[var(--color-beige-white)]/60"
          >
            {t('shop.build.slots', {
              used: number(decrees.length),
              max: number(maxSlots),
            })}
          </p>
          {decrees.length ? (
            <div
              data-tutorial="decrees"
              className="mt-1 flex flex-wrap gap-1.5 p-0.5 sm:gap-2"
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
            <p className="mt-1 text-sm text-[var(--color-beige-white)]/60">
              {t('shop.build.empty')}
            </p>
          )}
        </div>
        {upgrades && (
          <div className="min-w-0 flex-[0_1_auto] border-l border-[var(--color-metallic-gold)]/25 pl-3">
            {upgrades}
          </div>
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
