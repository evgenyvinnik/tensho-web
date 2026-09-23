import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '../../i18n'
import { useSettingsStore } from '../../stores/settingsStore'
import { useProgressionStore } from '../../stores/progressionStore'
import { useStakeStore } from '../../stores/stakeStore'
import { useTableStyleStore } from '../../stores/tableStyleStore'
import { TableStyleModal } from './TableStyleModal'

beforeEach(async () => {
  await changeLanguage('en')
  useSettingsStore.setState({ reducedMotion: true })
  useProgressionStore.getState().resetProgression()
  useStakeStore.getState().resetAllProgress()
  useTableStyleStore.getState().resetAllProgress()
})
afterEach(async () => {
  cleanup()
  await changeLanguage('en')
  useSettingsStore.setState({ reducedMotion: false })
})

it('localizes locked tiers and earned progression without authored English', async () => {
  await changeLanguage('es')
  render(<TableStyleModal isOpen onClose={vi.fn()} />)
  const dialog = screen.getByRole('dialog', { name: 'Elegir mesa' })
  expect(
    within(dialog).getByRole('radio', { name: /^Nivel Blanco:/ })
  ).toBeChecked()
  const gold = within(dialog).getByRole('radio', { name: /^Nivel Oro:/ })
  expect(gold).toBeDisabled()
  expect(gold).toHaveAccessibleName(/Bloqueado/)
  expect(dialog).toHaveTextContent('La progresión se guarda por separado')
  expect(dialog).not.toHaveTextContent('Gold Stake')
  expect(dialog).not.toHaveTextContent('Defeat the previous stake')
  expect(dialog).not.toHaveTextContent('Unlock:')
  expect(within(dialog).getAllByRole('progressbar')[0]).toHaveAccessibleName(
    /^Progreso hacia/
  )
})

it('shows cumulative engine rules only in an optional disclosure', () => {
  useProgressionStore.getState().enableFullUnlock()
  render(<TableStyleModal isOpen onClose={vi.fn()} />)
  fireEvent.click(screen.getByRole('radio', { name: /^Gold Stake:/ }))
  const details = screen.getByText('Active rules').closest('details')!
  expect(details).not.toHaveAttribute('open')
  expect(
    within(details).getAllByRole('listitem', { hidden: true })
  ).toHaveLength(6)
  expect(details).toHaveTextContent('×1.95')
  expect(details).toHaveTextContent('30%')
  expect(details).toHaveTextContent('Redraws each round: −1')
  expect(details).toHaveTextContent('No reward gold from Small Rounds')
  expect(details).not.toHaveTextContent('per Act')
})

it('supports roving arrow keys without committing before confirmation', () => {
  useProgressionStore.getState().enableFullUnlock()
  const confirm = vi.fn()
  const close = vi.fn()
  render(<TableStyleModal isOpen onClose={close} onConfirm={confirm} />)
  const white = screen.getByRole('radio', { name: /^White Stake:/ })
  white.focus()
  fireEvent.keyDown(white, { key: 'ArrowRight' })
  const red = screen.getByRole('radio', { name: /^Red Stake:/ })
  expect(red).toBeChecked()
  expect(red).toHaveFocus()
  expect(red).toHaveAttribute('tabindex', '0')
  expect(white).toHaveAttribute('tabindex', '-1')
  expect(useStakeStore.getState().currentStakeTier).toBe(1)
  fireEvent.keyDown(red, { key: 'End' })
  expect(screen.getByRole('radio', { name: /^Gold Stake:/ })).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
  expect(useStakeStore.getState().currentStakeTier).toBe(8)
  expect(confirm).toHaveBeenCalledWith('green_felt')
  expect(close).toHaveBeenCalledOnce()
})

it('keeps navigation on the only unlocked tier and returns focus after dismissal', () => {
  const trigger = document.createElement('button')
  document.body.append(trigger)
  trigger.focus()
  const { unmount } = render(<TableStyleModal isOpen onClose={vi.fn()} />)
  expect(
    screen.getByRole('button', { name: 'Close' })
  ).toHaveFocus()
  const white = screen.getByRole('radio', { name: /^White Stake:/ })
  fireEvent.keyDown(white, { key: 'ArrowLeft' })
  expect(white).toBeChecked()
  expect(white).toHaveFocus()
  unmount()
  expect(trigger).toHaveFocus()
  trigger.remove()
})

it('guides an earned profile toward its next locked tier, not a tier already unlocked', () => {
  useStakeStore.getState().recordVictory(1000, 8, 'green_felt', 2)
  render(<TableStyleModal isOpen onClose={vi.fn()} />)
  expect(screen.getByRole('radio', { name: /^White Stake:/ })).toBeChecked()
  expect(screen.getByRole('dialog')).toHaveTextContent(
    'Win tier 3 to unlock tier 4 here.'
  )
})
