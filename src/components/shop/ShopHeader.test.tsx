import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ShopHeader } from './ShopHeader'
import { changeLanguage } from '../../i18n'
import { useSettingsStore } from '../../stores/settingsStore'

afterEach(async () => {
  await act(async () => {
    useSettingsStore.setState({ reducedMotion: false })
    await changeLanguage('en')
  })
})

it('localizes the current balance and reroll cost without count-up or hover scaling under reduced motion', async () => {
  await changeLanguage('es')
  useSettingsStore.setState({ reducedMotion: true })
  render(
    <ShopHeader
      gold={1234567}
      rerollCost={5}
      rerollCount={2}
      canAffordReroll
      onReroll={vi.fn()}
      onSettings={vi.fn()}
    />
  )
  expect(screen.getByLabelText('1.234.567 de oro')).toHaveTextContent(
    '1.234.567'
  )
  expect(screen.getByRole('heading', { level: 1 })).not.toHaveClass('truncate')
  const reroll = screen.getByRole('button', { name: 'Renovar' })
  expect(reroll).toHaveAccessibleDescription('Renovar (5O)')
  expect(reroll).not.toHaveClass('hover:scale-105')
  expect(screen.getByLabelText('Renovaciones usadas: 2')).toBeVisible()
})
