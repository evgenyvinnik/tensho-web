import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ShopOfferCard } from './ShopOfferCard'
import type { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import { ALL_DECREES } from '../../systems/DecreeSystem'

const item = ALL_DECREES.find((d) => d.id === 'decree-wealth-engine')!
const offering: TeaHouseOffering = {
  id: 'wealth',
  slotIndex: 0,
  itemType: 'Decree',
  item,
  baseCost: item.cost,
  editionCost: 0,
  finalCost: item.cost,
  sellValue: item.sellValue!,
  isPurchased: false,
  isLocked: false,
}

const card = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>('[data-shop-offer="wealth"]')!

it('fades a rerolled card in after the ones before it', () => {
  const { container } = render(
    <ShopOfferCard
      offering={offering}
      canAfford
      onBuy={vi.fn()}
      transition={{ phase: 'enter', index: 2 }}
    />
  )
  expect(card(container)).toHaveClass('shop-offer-enter')
  expect(card(container).style.animationDelay).toBe('120ms')
})

it('lets a card leaving on a reroll fade away untouched, its details closed', () => {
  const { container, rerender } = render(
    <ShopOfferCard offering={offering} canAfford onBuy={vi.fn()} />
  )
  fireEvent.click(card(container), { detail: 1 })
  expect(screen.getByRole('dialog')).toBeVisible()

  rerender(
    <ShopOfferCard
      offering={offering}
      canAfford
      onBuy={vi.fn()}
      transition={{ phase: 'leave', index: 0 }}
    />
  )
  expect(card(container)).toHaveClass('shop-offer-leave')
  expect(card(container)).toHaveAttribute('inert')
  expect(card(container)).toHaveAttribute('aria-hidden', 'true')
  expect(card(container)).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('dialog')).toBeNull()
})
