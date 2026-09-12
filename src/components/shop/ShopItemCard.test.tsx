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

afterEach(async () => {
  await act(async () => {
    useSettingsStore.setState({ reducedMotion: false })
    await changeLanguage('en')
  })
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
