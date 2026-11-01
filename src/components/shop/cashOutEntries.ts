/**
 * What one round's settlement pays, source by source: the toasts the Tea
 * House shows arriving. Derived from the engine's summary; nothing here
 * awards money. A swift clear's Omen itself is revealed centre stage before
 * these (see OmenReveal); only Gold it paid at once arrives as a toast.
 *
 * @module components/shop/cashOutEntries
 */

import type { TFunction } from 'i18next'
import { STAKE_DEFINITIONS } from '../../config/stakeDefinitions'
import type { RoundCashOutSummary } from '../../game/GameOrchestrator'
import { STAKE_NAME_KEYS } from '../../i18n/stakeRules'

export interface CashOutEntry {
  id:
    | 'clear'
    | 'interest'
    | 'decrees'
    | 'goldTiles'
    | 'bonus'
    | 'rentals'
    | 'omenGold'
  label: string
  /** Gold this toast carries. */
  amount: number
  /** Why the amount is not what the player expects, e.g. a Stake rule. */
  note?: string
  /** The Omen that paid this Gold, for its artwork. */
  omenId?: string
}

/** The Stake whose rule withholds the clear reward: the tier introducing it. */
const WITHHOLDING_STAKE_TIER =
  STAKE_DEFINITIONS.find((stake) => stake.modifier.noSmallRoundReward)?.tier ??
  2

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
    {
      id: 'clear',
      label: t('shop.roundCleared'),
      amount: summary.baseReward,
      ...(summary.stakeWithheldReward
        ? {
            note: t('shop.payout.stakeWithheld', {
              stake: t(`stakes.${STAKE_NAME_KEYS[WITHHOLDING_STAKE_TIER - 1]}`),
              amount: summary.stakeWithheldReward,
            }),
          }
        : {}),
    },
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
      label: summary.omenId
        ? t('shop.payout.omenEarned', {
            name: t(`omens.items.${summary.omenId}.name`),
          })
        : t('shop.payout.omen'),
      amount: summary.omenGold ?? 0,
      omenId: summary.omenId ?? undefined,
    },
  ]
  return sources.filter((entry) => entry.id === 'clear' || entry.amount !== 0)
}
