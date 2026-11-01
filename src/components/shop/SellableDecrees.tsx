import { useState, type ReactNode, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import type { OwnedDecree } from '../../systems/types'
import { decreeKey } from '../../systems/decreeIdentity'
import { useItemText } from '../../i18n/useItemText'
import { DecreeCardCompact } from '../gameplay/DecreeBar'
import { ConfirmPopup } from '../ui/Popup'
import type { YakuRepetitionHistory } from '../ui/YakuRepetitionDetails'

interface Props {
  decrees: OwnedDecree[]
  onSell: (instanceId: string) => { success: boolean }
  /**
   * Holds focus while a sale is confirmed: the sold card goes away, and so
   * does the details card that started the sale.
   */
  focusTarget: RefObject<HTMLElement | null>
  yakuHistory?: YakuRepetitionHistory
  completeConcealedHandsPlayed?: number
  /** Shown in place of the cards when there are none. */
  empty?: ReactNode
  /** The tutorial's name for the cards. */
  tutorialTarget?: string
  /** Lay the cards out three to a row on phones (the Tea House build). */
  grid?: boolean
}

/**
 * Owned Decree scrolls. Each one's details card can sell it, after a
 * confirmation naming the gold; the outcome is announced under the cards.
 */
export function SellableDecrees({
  decrees,
  onSell,
  focusTarget,
  yakuHistory,
  completeConcealedHandsPlayed,
  empty,
  tutorialTarget,
  grid = false,
}: Props) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    name: string
    failed: boolean
  } | null>(null)
  const pending = decrees.find((d) => decreeKey(d) === pendingId)

  return (
    <>
      {decrees.length ? (
        <div
          data-tutorial={tutorialTarget}
          className={
            grid
              ? 'shop-build-grid mt-1 sm:flex sm:flex-wrap sm:gap-2 sm:p-0.5'
              : 'mt-1 flex flex-wrap gap-1.5 p-0.5 sm:gap-2'
          }
        >
          {decrees.map((decree) => (
            <DecreeCardCompact
              key={decreeKey(decree)}
              decree={decree}
              ownedDecrees={decrees}
              yakuHistory={yakuHistory}
              completeConcealedHandsPlayed={completeConcealedHandsPlayed}
              onSell={() => {
                focusTarget.current?.focus({ preventScroll: true })
                setFeedback(null)
                setPendingId(decreeKey(decree))
              }}
            />
          ))}
        </div>
      ) : (
        empty
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
            gold: (
              pending.sellValue ?? Math.floor(pending.cost / 2)
            ).toLocaleString(i18n.resolvedLanguage),
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
    </>
  )
}
