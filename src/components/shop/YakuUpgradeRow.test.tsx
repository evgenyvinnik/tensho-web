import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { YakuUpgradeRow } from './YakuUpgradeRow'
import { changeLanguage } from '../../i18n'
import type { YakuUpgrade } from '../gameplay/YakuUpgradeToken'

const pairs = (level: number): YakuUpgrade => ({
  yaku: 'SevenPairs',
  level,
  chips: 35 * (level - 1),
  mult: 3 * (level - 1),
  timesScored: 1,
})

beforeEach(() => vi.useFakeTimers())
afterEach(async () => {
  vi.useRealTimers()
  await act(async () => {
    await changeLanguage('en')
  })
})

it('renders nothing until a family has been upgraded', () => {
  const { container } = render(<YakuUpgradeRow upgrades={[]} />)
  expect(container).toBeEmptyDOMElement()
})

it('shows each upgrade inline with its level and opens its details on tap', () => {
  const { container } = render(<YakuUpgradeRow upgrades={[pairs(2)]} />)
  expect(screen.getByRole('group', { name: 'Yaku upgrades' })).toBeVisible()
  const token = screen.getByRole('button', {
    name: 'Seven Pairs upgrade, level 2',
  })
  expect(token).toHaveAttribute('data-yaku-upgrade', 'SevenPairs')
  expect(container.querySelector('[data-yaku-upgrade-flash]')).toBeNull()
  fireEvent.click(token, { detail: 1 })
  const panel = screen.getByRole('dialog', {
    name: 'Seven Pairs upgrade, level 2',
  })
  expect(panel).toHaveTextContent('Level 2 / 10')
  expect(panel).toHaveTextContent('+35 base points · +3 Mult')
  expect(panel).toHaveTextContent('Times scored: 1')
  expect(panel).toHaveTextContent('Upgraded by Seven Pairs Orb')
})

it('flashes a family that rises while the shop is open, never one already there', () => {
  const { container, rerender } = render(
    <YakuUpgradeRow upgrades={[pairs(3)]} />
  )
  expect(container.querySelector('[data-yaku-upgrade-flash]')).toBeNull()
  rerender(<YakuUpgradeRow upgrades={[pairs(4)]} />)
  const flashed = container.querySelector('[data-yaku-upgrade-flash]')!
  expect(
    flashed.querySelector('[data-yaku-upgrade="SevenPairs"]')
  ).not.toBeNull()
  expect(
    screen.getByRole('button', { name: 'Seven Pairs upgrade, level 4' })
  ).toBeVisible()
  act(() => vi.advanceTimersByTime(1000))
  expect(container.querySelector('[data-yaku-upgrade-flash]')).toBeNull()
})
