import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PackCard } from './PackCard'
import { useSettingsStore } from '../../stores/settingsStore'

afterEach(() => {
  act(() => useSettingsStore.setState({ reducedMotion: false }))
  vi.restoreAllMocks()
})

it.each(['app', 'system'] as const)(
  'respects %s reduced motion without losing pack purchase or affordability',
  (preference) => {
    useSettingsStore.setState({ reducedMotion: preference === 'app' })
    const matchMedia = window.matchMedia
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      ...matchMedia(query),
      matches:
        preference === 'system' && query === '(prefers-reduced-motion: reduce)',
    }))
    const pack = {
      id: 'motion-pack',
      type: 'Tile' as const,
      size: 'Mega' as const,
      cost: 8,
      choiceCount: 5,
      selectCount: 2,
    }
    const onPurchase = vi.fn()
    const { container, rerender } = render(
      <PackCard pack={pack} finalCost={8} canAfford onPurchase={onPurchase} />
    )
    const card = container.firstElementChild!
    const artwork = container.querySelector('img')!.parentElement!
    const buy = screen.getByRole('button')
    expect(card).toHaveStyle({ transform: 'none' })
    expect(artwork).toHaveStyle({ transform: 'scale(1.3)' })
    fireEvent.mouseEnter(card)
    fireEvent.mouseDown(card)
    expect(card).toHaveStyle({ transform: 'none' })
    expect(artwork).toHaveStyle({ transform: 'scale(1.3)' })
    expect(container.querySelector('[style*="shimmer"]')).toBeNull()
    expect(buy).not.toHaveClass('active:scale-95')
    fireEvent.click(buy)
    expect(onPurchase).toHaveBeenCalledTimes(1)
    rerender(
      <PackCard
        pack={pack}
        finalCost={8}
        canAfford={false}
        onPurchase={onPurchase}
      />
    )
    expect(buy).toBeDisabled()
    fireEvent.click(buy)
    fireEvent.click(card)
    expect(onPurchase).toHaveBeenCalledTimes(1)
  }
)
