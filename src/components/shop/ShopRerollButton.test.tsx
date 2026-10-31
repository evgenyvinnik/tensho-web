import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ShopRerollButton } from './ShopRerollButton'
import { changeLanguage } from '../../i18n'

afterEach(async () => {
  await act(async () => {
    await changeLanguage('en')
  })
})

it('reads its word and localized price, in green, with no count of rerolls used', async () => {
  await changeLanguage('es')
  const onReroll = vi.fn()
  render(<ShopRerollButton cost={12500} canAfford onReroll={onReroll} />)
  const reroll = screen.getByRole('button', { name: 'Renovar' })
  expect(reroll).toHaveAccessibleDescription('Renovar (12.500G)')
  expect(reroll).toHaveTextContent('Renovar')
  expect(reroll.querySelector('[data-shop-reroll-price]')).toHaveTextContent(
    /^12\.500$/
  )
  expect(reroll).not.toHaveTextContent('(+')
  expect(reroll).toHaveClass('bg-emerald-600')
  fireEvent.click(reroll)
  expect(onReroll).toHaveBeenCalledTimes(1)
})

it('cannot be pressed when the purse falls short', () => {
  const onReroll = vi.fn()
  render(<ShopRerollButton cost={5} canAfford={false} onReroll={onReroll} />)
  const reroll = screen.getByRole('button', { name: 'Reroll' })
  expect(reroll).toBeDisabled()
  expect(reroll).not.toHaveClass('bg-emerald-600')
  fireEvent.click(reroll)
  expect(onReroll).not.toHaveBeenCalled()
})
