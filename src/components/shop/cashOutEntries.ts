/**
 * What one round's settlement pays, source by source: the toasts the Tea
 * House shows arriving. Derived from the engine's summary; nothing here
 * awards money.
 *
 * @module components/shop/cashOutEntries
 */

import type { TFunction } from 'i18next'
import type { RoundCashOutSummary } from '../../game/GameOrchestrator'

export interface CashOutEntry {
  id:
    | 'clear'
    | 'interest'
    | 'decrees'
    | 'goldTiles'
    | 'bonus'
    | 'rentals'
    | 'omenGold'
    | 'omen'
  label: string
  /** Gold this toast carries; 0 for the Omen itself. */
  amount: number
  omenId?: string
}

/** The toasts one settlement produces, in the order they are paid. */
export function cashOutEntries(
  summary: RoundCashOutSummary,
  t: TFunction
): CashOutEntry[] {
  // The settled total already includes every multiplier. Explain the
  // difference without recomputing or awarding money from the presentation.
  const bonus =
    summary.netGoldChange +
    summary.rentalCost -
    summary.baseReward -
    summary.interest -
    summary.decreeGold -
    summary.heldGoldMarkReward -
    (summary.omenGold ?? 0)
  const sources: CashOutEntry[] = [
    { id: 'clear', label: t('shop.roundCleared'), amount: summary.baseReward },
    {
      id: 'interest',
      label: t('shop.payout.interest'),
      amount: summary.interest,
    },
    {
      id: 'decrees',
      label: t('shop.payout.decrees'),
      amount: summary.decreeGold,
    },
    {
      id: 'goldTiles',
      label: t('shop.payout.goldTiles'),
      amount: summary.heldGoldMarkReward,
    },
    { id: 'bonus', label: t('shop.payout.bonus'), amount: bonus },
    {
      id: 'rentals',
      label: t('shop.payout.rentals'),
      amount: -summary.rentalCost,
    },
    {
      id: 'omenGold',
      label: t('shop.payout.omen'),
      amount: summary.omenGold ?? 0,
    },
  ]
  const entries = sources.filter(
    (entry) => entry.id === 'clear' || entry.amount !== 0
  )
  if (summary.omenId)
    entries.push({
      id: 'omen',
      label: t('shop.payout.omenEarned', {
        name: t(`omens.items.${summary.omenId}.name`),
      }),
      amount: 0,
      omenId: summary.omenId,
    })
  return entries
}
