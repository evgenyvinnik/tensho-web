import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { YakuUpgradeRow } from './YakuUpgradeRow'
import { changeLanguage } from '../../i18n'
import type { YakuUpgrade } from '../gameplay/YakuUpgradeToken'

const family = (yaku: YakuUpgrade['yaku'], level: number): YakuUpgrade => ({
  yaku,
  level,
  chips: 0,
  mult: 0,
  timesScored: 0,
})

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

it('renders nothing for an empty list', () => {
  const { container } = render(<YakuUpgradeRow upgrades={[]} />)
  expect(container).toBeEmptyDOMElement()
})

it('shows each upgrade inline with its level and opens its details on tap', () => {
  const { container } = render(<YakuUpgradeRow upgrades={[pairs(2)]} />)
  expect(screen.getByRole('group', { name: 'Yaku upgrades' })).toBeVisible()
  // One Orb used: the family's first upgrade, counted from 0.
  const token = screen.getByRole('button', {
    name: 'Seven Pairs upgrade, level 1',
  })
  expect(token).toHaveAttribute('data-yaku-upgrade', 'SevenPairs')
  expect(token).toHaveAttribute('data-yaku-upgrade-level', '1')
  expect(token).not.toHaveClass('grayscale')
  expect(container.querySelector('[data-yaku-upgrade-flash]')).toBeNull()
  fireEvent.click(token, { detail: 1 })
  const panel = screen.getByRole('dialog', {
    name: 'Seven Pairs upgrade, level 1',
  })
  expect(panel).toHaveTextContent('Level 1 / 9')
  expect(panel).toHaveTextContent('+35 base points · +3 Mult')
  expect(panel).toHaveTextContent('Times scored: 1')
  expect(panel).toHaveTextContent('Upgraded by Planet X Orb')
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
    screen.getByRole('button', { name: 'Seven Pairs upgrade, level 3' })
  ).toBeVisible()
  act(() => vi.advanceTimersByTime(1000))
  expect(container.querySelector('[data-yaku-upgrade-flash]')).toBeNull()
})

it('shows a family no Orb has reached at level 0, dimmed, beside upgraded ones', () => {
  const { container } = render(
    <YakuUpgradeRow upgrades={[family('Pairs', 1), pairs(2)]} />
  )
  const grid = container.querySelector('[data-yaku-upgrade-grid]')!
  expect(grid.querySelectorAll('[data-yaku-upgrade]')).toHaveLength(2)
  const fresh = screen.getByRole('button', { name: 'Pairs upgrade, level 0' })
  expect(fresh).toHaveAttribute('data-yaku-upgrade-level', '0')
  expect(fresh).toHaveClass('grayscale')
  expect(fresh).toHaveTextContent('0')
  fireEvent.click(fresh, { detail: 1 })
  const panel = screen.getByRole('dialog', { name: 'Pairs upgrade, level 0' })
  expect(panel).toHaveTextContent('Level 0 / 9')
  expect(panel).toHaveTextContent('+0 base points · +0 Mult')
  expect(panel).toHaveTextContent('Upgraded by Pluto Orb')
})
