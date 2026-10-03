import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ShopItemCard } from './ShopItemCard'
import { FateSealSystem, FATE_SEALS } from '../../systems/FateSealSystem'
import {
  CelestialOrbSystem,
  CELESTIAL_ORBS,
} from '../../systems/CelestialOrbSystem'
import type { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import { changeLanguage } from '../../i18n'
import es from '../../i18n/locales/es.json'
import { useSettingsStore } from '../../stores/settingsStore'
import { ALL_DECREES } from '../../systems/DecreeSystem'

it('pairs Wealth Engine art with unambiguous localized gold and ownership rules', async () => {
  await changeLanguage('es')
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
  const { container } = render(
    <ShopItemCard offering={offering} canAfford onPurchase={vi.fn()} />
  )
  expect(screen.getByRole('heading')).toHaveTextContent('Motor de Riqueza')
  expect(screen.getByRole('button')).toHaveAccessibleDescription(
    '+1G por cada Decreto que posees al final de la ronda'
  )
  expect(
    container.querySelector('img[src$="wealth-engine.png"]')
  ).not.toBeNull()
})

afterEach(async () => {
  await act(async () => {
    useSettingsStore.setState({ reducedMotion: false })
    await changeLanguage('en')
  })
})

it('keeps blocked details readable and blocks both card and button purchase paths', () => {
  const item = ALL_DECREES[0]
  const offering: TeaHouseOffering = {
    id: 'blocked',
    slotIndex: 0,
    itemType: 'Decree',
    item,
    baseCost: 4,
    finalCost: 4,
    editionCost: 0,
    sellValue: 2,
    isPurchased: false,
    isLocked: false,
  }
  const buy = vi.fn()
  const select = vi.fn()
  const props = { offering, canAfford: true, onPurchase: buy, onSelect: select }
  const view = render(
    <ShopItemCard {...props} unavailableReason="Make room in your build." />
  )
  const card = view.container.querySelector('[data-shop-item]')!
  fireEvent.click(card)
  expect(select).toHaveBeenCalledOnce()
  view.rerender(
    <ShopItemCard
      {...props}
      isSelected
      unavailableReason="Make room in your build."
    />
  )
  const button = screen.getByRole('button')
  expect(button).toBeDisabled()
  expect(button).toHaveAccessibleDescription(
    expect.stringContaining('Make room in your build.')
  )
  expect(screen.queryByText('Tap to Buy')).not.toBeInTheDocument()
  fireEvent.click(card)
  fireEvent.click(button)
  expect(buy).not.toHaveBeenCalled()
  view.rerender(<ShopItemCard {...props} isSelected />)
  expect(screen.getByRole('button')).toBeEnabled()
  fireEvent.click(screen.getByRole('button'))
  expect(buy).toHaveBeenCalledOnce()
})

it('includes localized edition and zero-cost Rental rules in purchase details', async () => {
  await changeLanguage('es')
  const item = {
    ...ALL_DECREES[0],
    edition: 'Negative' as const,
    sticker: { type: 'Rental' as const, goldPerRound: 0 },
  }
  const offering: TeaHouseOffering = {
    id: 'rental-fixture',
    slotIndex: 0,
    itemType: 'Decree',
    item,
    baseCost: 1,
    editionCost: 5,
    finalCost: 6,
    sellValue: 3,
    isPurchased: false,
    isLocked: false,
    edition: 'Negative',
  }
  render(<ShopItemCard offering={offering} canAfford onPurchase={vi.fn()} />)
  expect(screen.getByRole('button')).toHaveAccessibleDescription(
    expect.stringContaining('Cuesta 0 de oro al final de cada ronda.')
  )
  expect(screen.getByRole('button')).toHaveAccessibleDescription(
    expect.stringContaining(es.editions.items.negative.description)
  )
  expect(screen.getByText(es.decreeModifiers.rentalName)).toBeVisible()
  expect(screen.queryByText(/-3G\/R|Neg$/)).not.toBeInTheDocument()
})

it.each(['seal', 'orb'] as const)(
  'shows the actual %s for sale, including its localized rule and rarity',
  async (kind) => {
    await changeLanguage('es')
    useSettingsStore.setState({ reducedMotion: true })
    const item =
      kind === 'seal'
        ? FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_the_sage)
        : CelestialOrbSystem.createCelestialOrbInstance(
            CELESTIAL_ORBS.mercury_orb
          )
    const text =
      kind === 'seal'
        ? es.seals.items.seal_of_the_sage
        : es.orbs.items.mercury_orb
    const offering: TeaHouseOffering = {
      id: 'item-fixture',
      slotIndex: 0,
      itemType: kind === 'seal' ? 'FateSeal' : 'CelestialOrb',
      item,
      baseCost: 3,
      editionCost: 0,
      finalCost: 3,
      sellValue: 1,
      isPurchased: false,
      isLocked: false,
      edition: 'Polychrome',
    }
    const onPurchase = vi.fn()
    const { container, rerender } = render(
      <ShopItemCard offering={offering} canAfford onPurchase={onPurchase} />
    )
    expect(screen.getByRole('heading')).toHaveTextContent(text.name)
    expect(screen.getByText(text.description)).not.toHaveClass('line-clamp-2')
    expect(screen.getByText('Común')).toBeVisible()
    expect(
      screen.queryByText(/A mystical seal|Permanently upgrades a yaku family/)
    ).not.toBeInTheDocument()
    const buy = screen.getByRole('button', { name: `${text.name} 3G` })
    expect(buy).toHaveAccessibleDescription(text.description)
    expect(buy).not.toHaveClass('active:scale-95')
    const card = container.querySelector('[data-shop-item]')!
    fireEvent.mouseEnter(card)
    fireEvent.mouseDown(card)
    expect(card).toHaveStyle({ transform: 'scale(1)', animation: 'none' })
    fireEvent.click(buy)
    expect(onPurchase).toHaveBeenCalledTimes(1)
    rerender(
      <ShopItemCard
        offering={offering}
        canAfford={false}
        onPurchase={onPurchase}
      />
    )
    expect(buy).toBeDisabled()
    fireEvent.click(card)
    fireEvent.click(buy)
    expect(onPurchase).toHaveBeenCalledTimes(1)
  }
)
