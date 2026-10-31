/**
 * ShopRerollButton: restocks the Tea House's item slots.
 *
 * Sits in the bottom action bar, right above Next Round: green, so it never
 * reads as the orange call to move on, and labelled with its word and price.
 *
 * @module components/shop/ShopRerollButton
 */

import { useTranslation } from 'react-i18next'
import { GoldIcon } from '../ui/GoldIcon'
import { ControlIcon } from '../ui/ControlIcon'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export interface ShopRerollButtonProps {
  /** What the next reroll costs. */
  cost: number
  /** Whether the purse holds that much. */
  canAfford: boolean
  onReroll: () => void
}

export function ShopRerollButton({
  cost,
  canAfford,
  onReroll,
}: ShopRerollButtonProps) {
  const { t, i18n } = useTranslation()
  const reduceMotion = useReducedMotion()
  const price = cost.toLocaleString(i18n.resolvedLanguage)

  return (
    <button
      type="button"
      data-shop-reroll
      onClick={() => {
        if (canAfford) onReroll()
      }}
      disabled={!canAfford}
      aria-label={t('shop.reroll')}
      aria-description={t('shop.rerollCost', { cost: price })}
      className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border-2 px-4 py-2 text-base font-bold transition-all duration-150 ${
        canAfford
          ? `border-emerald-300 bg-emerald-600 text-white shadow-button hover:bg-emerald-500 ${reduceMotion ? '' : 'active:scale-[0.98]'}`
          : 'cursor-not-allowed border-gray-500 bg-gray-600 text-gray-300 opacity-60'
      }`}
    >
      <ControlIcon name="redraw" size={20} />
      <span>{t('shop.reroll')}</span>
      <span
        data-shop-reroll-price
        className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 tabular-nums"
      >
        <GoldIcon className="h-4 w-4" />
        {price}
      </span>
    </button>
  )
}

export default ShopRerollButton
