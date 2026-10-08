import { render } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CharterArtwork } from './CharterArtwork'
import { ItemCard } from '../collection/ItemCard'
import { ItemDetailModal } from '../collection/ItemDetailModal'
import { ArchiveSystem } from '../../systems/ArchiveSystem'
import { ARCHIVE_CATEGORIES } from '../../config/archiveDefinitions'

it('uses the Money Tree portrait while preserving category artwork for other Charters', () => {
  const { container, rerender } = render(
    <CharterArtwork charterId="money_tree" />
  )
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    expect.stringMatching(/charters\/money-tree\.webp$/)
  )
  expect(container.querySelector('img')).toHaveAttribute('aria-hidden', 'true')
  expect(container.querySelector('img')).toHaveAttribute('alt', '')
  rerender(<CharterArtwork charterId="plentiful_stock" />)
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    expect.stringMatching(/charters\/plentiful-stock\.webp$/)
  )
  rerender(<CharterArtwork charterId="abundant_stock" />)
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    expect.stringMatching(/charters\/abundant-stock\.webp$/)
  )
  rerender(<CharterArtwork charterId="seed_pouch" alt="Imperial Charter" />)
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    expect.stringMatching(/imperial-charter\.webp$/)
  )
  expect(container.querySelector('img')).not.toHaveAttribute('aria-hidden')
  rerender(<CharterArtwork charterId="constructor" />)
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    expect.stringMatching(/imperial-charter\.webp$/)
  )
})

it.each([
  ['observatory', 'observatory.webp', false],
  ['observatory', 'observatory.webp', true],
  ['swift_hand', 'swift-hand.webp', false],
  ['swift_hand', 'swift-hand.webp', true],
  ['full_palette', 'full-palette.webp', false],
  ['full_palette', 'full-palette.webp', true],
  ['star_chart', 'star-chart.webp', false],
  ['star_chart', 'star-chart.webp', true],
  ['money_tree', 'money-tree.webp', false],
  ['money_tree', 'money-tree.webp', true],
  ['plentiful_stock', 'plentiful-stock.webp', false],
  ['plentiful_stock', 'plentiful-stock.webp', true],
  ['abundant_stock', 'abundant-stock.webp', false],
  ['abundant_stock', 'abundant-stock.webp', true],
] as const)(
  'only reveals %s portrait (%s) after discovery (discovered=%s)',
  (id, filename, discovered) => {
    const base = new ArchiveSystem().getEntry('charters', id)!
    const entry = {
      ...base,
      isUnlocked: true,
      discoveredAt: discovered ? 123 : null,
    }
    const info = {
      id,
      name: id,
      description: 'Charter effect',
      category: 'charters' as const,
    }
    const view = render(<ItemCard entry={entry} displayInfo={info} />)
    expect(
      view.container.querySelectorAll(`img[src$="${filename}"]`)
    ).toHaveLength(discovered ? 1 : 0)
    view.unmount()
    render(
      <ItemDetailModal
        isOpen
        onClose={vi.fn()}
        entry={entry}
        displayInfo={info}
        categoryInfo={ARCHIVE_CATEGORIES.charters}
      />
    )
    expect(document.querySelectorAll(`img[src$="${filename}"]`)).toHaveLength(
      discovered ? 1 : 0
    )
  }
)
