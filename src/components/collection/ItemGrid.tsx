/**
 * ItemGrid Component for Collection Screen
 *
 * Displays archive items in a responsive grid layout.
 * Handles loading states and empty states.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import { ItemCard, ItemDisplayInfo } from './ItemCard'
import { ControlIcon } from '../ui/ControlIcon'

export interface ItemGridProps {
  entries: ArchiveEntry[]
  displayInfoMap: Map<string, ItemDisplayInfo>
  isLoading?: boolean
}

/**
 * ItemGrid - Responsive grid of archive items
 */
export function ItemGrid({
  entries,
  displayInfoMap,
  isLoading = false,
}: ItemGridProps) {
  const { t } = useTranslation()
  // Sort entries: discovered first, then by name
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      // Discovered items first
      if (a.discoveredAt !== null && b.discoveredAt === null) return -1
      if (a.discoveredAt === null && b.discoveredAt !== null) return 1

      // Then by unlock status
      if (a.isUnlocked && !b.isUnlocked) return -1
      if (!a.isUnlocked && b.isUnlocked) return 1

      // Then alphabetically by item ID
      return a.itemId.localeCompare(b.itemId)
    })
  }, [entries])

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/5] rounded-lg bg-[var(--color-dark-forest)] border-2 border-[var(--color-metallic-gold)] animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-dark-forest)] flex items-center justify-center">
          <ControlIcon
            name="archive"
            size={32}
            className="text-[var(--color-metallic-gold)]"
          />
        </div>
        <p className="text-[var(--color-metallic-gold)]">
          {t('collection.empty', 'No items in this category')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">
      {sortedEntries.map((entry) => {
        const displayInfo = displayInfoMap.get(entry.itemId) || null

        return (
          <ItemCard
            key={entry.key}
            entry={entry}
            displayInfo={displayInfo}
          />
        )
      })}
    </div>
  )
}

export default ItemGrid
