import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ItemDetailModal } from './ItemDetailModal'
import { ARCHIVE_CATEGORIES } from '../../config/archiveDefinitions'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import type { ItemDisplayInfo } from './ItemCard'

const entry: ArchiveEntry = {
  key: 'decrees:river_tax',
  itemId: 'river_tax',
  category: 'decrees',
  discoveredAt: 0,
  timesUsed: 2,
  timesWonWith: 1,
  isUnlocked: true,
}
const displayInfo: ItemDisplayInfo = {
  id: 'river_tax',
  category: 'decrees',
  name: 'River Tax',
  description: '+1G per tile discarded.',
  rarity: 'LocalEdict',
}

it('names the Archive dialog, centers its title and restores its opener', () => {
  const opener = document.createElement('button')
  document.body.append(opener)
  opener.focus()
  const props = {
    onClose: vi.fn(),
    entry,
    displayInfo,
    categoryInfo: ARCHIVE_CATEGORIES.decrees,
  }
  const { rerender } = render(<ItemDetailModal {...props} isOpen />)
  const dialog = screen.getByRole('dialog', { name: 'River Tax' })
  expect(dialog).toHaveAttribute('open')
  expect(dialog).toHaveAttribute('aria-modal', 'true')
  expect(screen.getByRole('heading', { name: 'River Tax' })).toHaveClass(
    'text-center'
  )
  expect(dialog.querySelector('img[src$="river-tax.webp"]')).not.toBeNull()
  expect(dialog).toHaveTextContent(displayInfo.description)
  expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  rerender(<ItemDetailModal {...props} isOpen={false} />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(opener).toHaveFocus()
  opener.remove()
})

it('routes native Escape cancellation and the close control through onClose', () => {
  const onClose = vi.fn()
  render(
    <ItemDetailModal
      isOpen
      onClose={onClose}
      entry={entry}
      displayInfo={displayInfo}
      categoryInfo={null}
    />
  )
  const cancel = new Event('cancel', { cancelable: true })
  fireEvent(screen.getByRole('dialog'), cancel)
  expect(cancel.defaultPrevented).toBe(true)
  expect(onClose).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalledTimes(2)
})
