import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { YakuUpgradeRow } from './YakuUpgradeRow'
import { changeLanguage } from '../../i18n'
import type { YakuUpgrade } from '../gameplay/YakuUpgradeToken'
import { CELESTIAL_ORBS } from '../../systems/CelestialOrbSystem'

const family = (yaku: YakuUpgrade['yaku'], level: number): YakuUpgrade => ({
  yaku,
  level,
  chips: 0,
  mult: 0,
  timesScored: 0,
})

const { chipsPerLevel, multPerLevel } = CELESTIAL_ORBS.planet_x_orb.effect

const threePairs = (level: number): YakuUpgrade => ({
  yaku: 'ThreePairs',
  level,
  chips: chipsPerLevel * (level - 1),
  mult: multPerLevel * (level - 1),
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
  const { container } = render(<YakuUpgradeRow upgrades={[threePairs(2)]} />)
  expect(screen.getByRole('group', { name: 'Yaku upgrades' })).toBeVisible()
  // One Orb used: the family's first upgrade, counted from 0.
  const token = screen.getByRole('button', {
    name: 'Three Pairs upgrade, level 1',
  })
  expect(token).toHaveAttribute('data-yaku-upgrade', 'ThreePairs')
  expect(token).toHaveAttribute('data-yaku-upgrade-level', '1')
  expect(token).not.toHaveClass('grayscale')
  expect(container.querySelector('[data-yaku-upgrade-flash]')).toBeNull()
  fireEvent.click(token, { detail: 1 })
  const panel = screen.getByRole('dialog', {
    name: 'Three Pairs upgrade, level 1',
  })
  expect(panel).toHaveTextContent('Level 1 / 9')
  expect(panel).toHaveTextContent(
    `+${chipsPerLevel} base points · +${multPerLevel} Mult`
  )
  expect(panel).toHaveTextContent('Times scored: 1')
  expect(panel).toHaveTextContent('Upgraded by Planet X Orb')
})

it('flashes a family that rises while the shop is open, never one already there', () => {
  const { container, rerender } = render(
    <YakuUpgradeRow upgrades={[threePairs(3)]} />
  )
  expect(container.querySelector('[data-yaku-upgrade-flash]')).toBeNull()
  rerender(<YakuUpgradeRow upgrades={[threePairs(4)]} />)
  const flashed = container.querySelector('[data-yaku-upgrade-flash]')!
  expect(
    flashed.querySelector('[data-yaku-upgrade="ThreePairs"]')
  ).not.toBeNull()
  expect(
    screen.getByRole('button', { name: 'Three Pairs upgrade, level 3' })
  ).toBeVisible()
  act(() => vi.advanceTimersByTime(1000))
  expect(container.querySelector('[data-yaku-upgrade-flash]')).toBeNull()
})

it('shows a family no Orb has reached at level 0, dimmed, beside upgraded ones', () => {
  const { container } = render(
    <YakuUpgradeRow upgrades={[family('Pairs', 1), threePairs(2)]} />
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

it('gives Loose Tiles its bonus per loose tile, with no Mult', () => {
  const chips = CELESTIAL_ORBS.ceres_orb.effect.chipsPerLevel
  render(
    <YakuUpgradeRow
      upgrades={[{ ...family('Loose', 2), chips, timesScored: 3 }]}
    />
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Loose Tiles upgrade, level 1' }),
    { detail: 1 }
  )
  const panel = screen.getByRole('dialog', {
    name: 'Loose Tiles upgrade, level 1',
  })
  expect(panel).toHaveTextContent(`+${chips} base points per loose tile`)
  expect(panel).not.toHaveTextContent('Mult')
  expect(panel).toHaveTextContent('Upgraded by Ceres Orb')
})
