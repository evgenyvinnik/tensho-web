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

it('localizes the current balance without count-up under reduced motion, leaving the reroll to the action bar', async () => {
  await changeLanguage('es')
  useSettingsStore.setState({ reducedMotion: true })
  render(<ShopHeader gold={1234567} onSettings={vi.fn()} interestCap={5} />)
  expect(screen.getByLabelText('1.234.567 de oro')).toHaveTextContent(
    '1.234.567'
  )
  expect(screen.getByRole('heading', { level: 1 })).not.toHaveClass('truncate')
  expect(screen.queryByRole('button', { name: 'Renovar' })).toBeNull()
})
