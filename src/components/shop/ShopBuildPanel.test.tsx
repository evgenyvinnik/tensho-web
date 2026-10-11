import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ShopBuildPanel } from './ShopBuildPanel'
import { ALL_DECREES, DecreeSystem } from '../../systems/DecreeSystem'
import { changeLanguage } from '../../i18n'

const stone = ALL_DECREES.find((d) => d.id === 'decree-polished-stone')!
afterEach(async () => {
  await act(async () => {
    await changeLanguage('en')
  })
})

it('offers a read-only phone disclosure and keeps capacity information outside it', () => {
  const system = new DecreeSystem()
  system.acquireDecree(stone)
  const sell = vi.fn()
  const { container, rerender } = render(
    <ShopBuildPanel
      compact
      decrees={system.getOwnedDecrees()}
      maxSlots={0}
      onSell={sell}
    />
  )
  const toggle = screen.getByRole('button', { name: 'Your build' })
  const content = container.querySelector('[data-shop-build-content]')!
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(toggle).toHaveAttribute('aria-controls', content.id)
  expect(content).toHaveClass('hidden', 'sm:block')
  expect(content.querySelector('[data-decree-capacity-notice]')).toBeNull()
  expect(
    container.querySelector('[data-decree-capacity-notice]')
  ).toBeInTheDocument()
  fireEvent.click(toggle)
  expect(content).not.toHaveClass('hidden')
  rerender(
    <ShopBuildPanel
      compact
      decrees={system.getOwnedDecrees()}
      maxSlots={5}
      onSell={sell}
    />
  )
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(sell).not.toHaveBeenCalled()
  fireEvent.click(toggle)
  expect(content).toHaveClass('hidden', 'sm:block')
})

it('shows an empty build without fabricated cards or recommendations', () => {
  render(<ShopBuildPanel decrees={[]} maxSlots={5} onSell={vi.fn()} />)
  expect(screen.getByText('0 / 5 Decree slots')).toBeVisible()
  expect(screen.getByText(/No Decrees yet/)).toBeVisible()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('confirms the exact physical copy and returns focus to the surviving heading', () => {
  const system = new DecreeSystem()
  system.acquireDecree(stone)
  const second = system.acquireDecree(stone)!
  const onSell = vi.fn(() => ({ success: true }))
  render(
    <ShopBuildPanel
      decrees={system.getOwnedDecrees()}
      maxSlots={5}
      onSell={onSell}
    />
  )
  fireEvent.click(screen.getAllByRole('button', { name: 'Polished Stone' })[1])
  fireEvent.click(screen.getByRole('button', { name: 'Sell Polished Stone' }))
  expect(
    screen.getByRole('dialog', { name: 'Sell Polished Stone' })
  ).toHaveTextContent('3 gold')
  expect(onSell).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(onSell).not.toHaveBeenCalled()
  expect(screen.getByRole('heading', { name: 'Your build' })).toHaveFocus()
  fireEvent.click(screen.getAllByRole('button', { name: 'Polished Stone' })[1])
  fireEvent.click(screen.getByRole('button', { name: 'Sell Polished Stone' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  expect(onSell).toHaveBeenCalledExactlyOnceWith(second.instanceId)
  expect(screen.getByRole('status')).toHaveTextContent('Sold Polished Stone.')
})

it('keeps Eternal sales disabled and uses the supplied capacity after Negative removal', () => {
  const system = new DecreeSystem(1)
  system.acquireDecree({ ...stone, stickers: [{ type: 'Eternal' }] })
  const onSell = vi.fn()
  const view = render(
    <ShopBuildPanel
      decrees={system.getOwnedDecrees()}
      maxSlots={2}
      onSell={onSell}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Polished Stone' }))
  expect(
    screen.getByRole('button', {
      name: 'Polished Stone is Eternal and cannot be sold',
    })
  ).toBeDisabled()
  expect(onSell).not.toHaveBeenCalled()
  view.rerender(
    <ShopBuildPanel
      decrees={system.getOwnedDecrees()}
      maxSlots={1}
      onSell={onSell}
    />
  )
  expect(screen.getByText('1 / 1 Decree slots')).toBeVisible()
})

it('reports a rejected sale without announcing success', () => {
  const system = new DecreeSystem()
  system.acquireDecree(stone)
  render(
    <ShopBuildPanel
      decrees={system.getOwnedDecrees()}
      maxSlots={5}
      onSell={() => ({ success: false })}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Polished Stone' }))
  fireEvent.click(screen.getByRole('button', { name: 'Sell Polished Stone' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  expect(screen.getByRole('status')).toHaveTextContent('could not be sold')
  expect(screen.getByRole('button', { name: 'Polished Stone' })).toBeVisible()
})
