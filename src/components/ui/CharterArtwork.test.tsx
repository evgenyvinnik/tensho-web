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
    expect.stringMatching(/charters\/money-tree\.png$/)
  )
  expect(container.querySelector('img')).toHaveAttribute('aria-hidden', 'true')
  expect(container.querySelector('img')).toHaveAttribute('alt', '')
  rerender(<CharterArtwork charterId="seed_pouch" alt="Imperial Charter" />)
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    expect.stringMatching(/imperial-charter\.png$/)
  )
  expect(container.querySelector('img')).not.toHaveAttribute('aria-hidden')
})

it.each([false, true])(
  'only reveals the Charter portrait after discovery (discovered=%s)',
  (discovered) => {
    const base = new ArchiveSystem().getEntry('charters', 'money_tree')!
    const entry = {
      ...base,
      isUnlocked: true,
      discoveredAt: discovered ? 123 : null,
    }
    const info = {
      id: 'money_tree',
      name: 'Money Tree',
      description: 'Interest cap raised to 20 Gold',
      category: 'charters' as const,
    }
    const view = render(<ItemCard entry={entry} displayInfo={info} />)
    expect(
      view.container.querySelectorAll('img[src$="money-tree.png"]')
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
    expect(
      document.querySelectorAll('img[src$="money-tree.png"]')
    ).toHaveLength(discovered ? 1 : 0)
  }
)
