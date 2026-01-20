/**
 * ItemGrid Component for Collection Screen
 *
 * Displays archive items in a responsive grid layout.
 * Handles loading states and empty states.
 */

import { useMemo } from 'react'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import { ItemCard, ItemDisplayInfo } from './ItemCard'

export interface ItemGridProps {
  entries: ArchiveEntry[]
  displayInfoMap: Map<string, ItemDisplayInfo>
  onItemClick: (entry: ArchiveEntry, displayInfo: ItemDisplayInfo | null) => void
  isLoading?: boolean
}

/**
 * ItemGrid - Responsive grid of archive items
 */
export function ItemGrid({
  entries,
  displayInfoMap,
  onItemClick,
  isLoading = false,
}: ItemGridProps) {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="h-[120px] rounded-lg bg-[var(--color-dark-forest)] border-2 border-[var(--color-metallic-gold)] animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-dark-forest)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-metallic-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-[var(--color-metallic-gold)]">No items in this category</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {sortedEntries.map((entry, index) => {
        const displayInfo = displayInfoMap.get(entry.itemId) || null

        return (
          <ItemCard
            key={entry.key}
            entry={entry}
            displayInfo={displayInfo}
            delay={Math.min(index * 30, 500)} // Cap animation delay
            onClick={() => onItemClick(entry, displayInfo)}
          />
        )
      })}
    </div>
  )
}

export default ItemGrid
