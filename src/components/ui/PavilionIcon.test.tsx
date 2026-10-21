import { readFileSync } from 'node:fs'
import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PavilionIcon } from './PavilionIcon'
import { SettingsScreen } from '../screens/SettingsScreen'
import { ItemCard } from '../collection/ItemCard'
import { CategoryTabs } from '../collection/CategoryTabs'
import { ARCHIVE_CATEGORIES } from '../../config/archiveDefinitions'

vi.mock('../../router', () => ({
  useAppNavigation: () => ({ goBack: vi.fn(), changeLanguage: vi.fn() }),
}))
afterEach(cleanup)

it.each([
  'archive',
  'target',
  'puzzle',
  'coin',
  'flower',
  'chart',
  'scales',
  'dice',
  'mask',
  'challenge',
  'tiles',
  'hand',
  'score',
  'collection',
  'trophy',
] as const)('uses painted game artwork for the %s reference symbol', (name) => {
  const { container } = render(<PavilionIcon name={name} size={28} />)
  const image = container.querySelector('img')!
  const src = image.getAttribute('src')!
  expect(src).not.toContain('/generated/controls/')
  expect(readFileSync(`public${src}`).length).toBeGreaterThan(0)
  expect(image).toHaveAttribute('alt', '')
  expect(image).toHaveAttribute('aria-hidden', 'true')
  expect(image).toHaveStyle({ width: '28px', height: '28px' })
})

it('gives the Settings language section its dedicated calligraphy icon', () => {
  const { getByRole } = render(<SettingsScreen />)
  expect(
    getByRole('heading', { name: 'Language' }).querySelector('img')
  ).toHaveAttribute('src', '/assets/illustrations/controls-jade/language.webp')
  expect(getByRole('button', { name: 'Select Language' })).toBeEnabled()
})

it('keeps undiscovered and locked Collection entries distinct without exposing items', () => {
  const entry = {
    key: 'decrees:river_tax',
    category: 'decrees' as const,
    itemId: 'river_tax',
    discoveredAt: null,
    isUnlocked: true,
    timesUsed: 0,
    timesWonWith: 0,
  }
  const info = {
    id: 'river_tax',
    name: 'River Tax',
    description: 'Secret rule',
    category: 'decrees' as const,
  }
  const { container, rerender, getByRole } = render(
    <ItemCard entry={entry} displayInfo={info} />
  )
  expect(getByRole('button', { name: 'Undiscovered' })).toBeEnabled()
  expect(container).not.toHaveTextContent('River Tax')
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    '/assets/illustrations/controls-jade/archive.webp'
  )
  rerender(
    <ItemCard entry={{ ...entry, isUnlocked: false }} displayInfo={info} />
  )
  expect(getByRole('button', { name: 'Locked' })).toBeEnabled()
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    '/assets/illustrations/controls-jade/lock.webp'
  )
})

it('uses the actual Mandate bell instead of a gamepad in Collection tabs', () => {
  const { getByRole } = render(
    <CategoryTabs
      categories={[ARCHIVE_CATEGORIES.mandates]}
      activeCategory="mandates"
      onCategoryChange={vi.fn()}
      categoryCounts={
        {} as Parameters<typeof CategoryTabs>[0]['categoryCounts']
      }
    />
  )
  expect(
    getByRole('button', { name: /Mandates/ }).querySelector('img')
  ).toHaveAttribute('src', '/assets/illustrations/cerulean-bell.webp')
})
