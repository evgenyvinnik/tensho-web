/**
 * ItemCard Component for Collection Screen
 *
 * Displays a single archive item in the collection grid.
 * Shows discovered items with full details, undiscovered as silhouettes.
 */

import { useState } from 'react'
import { useSpring, animated } from '@react-spring/web'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import type { ArchiveCategory } from '../../config/archiveDefinitions'

const AnimatedDiv = animated('div')

/**
 * Item info for display (from definition files)
 */
export interface ItemDisplayInfo {
  id: string
  name: string
  japaneseName?: string
  description: string
  rarity?: string
  icon?: string
  category: ArchiveCategory
}

export interface ItemCardProps {
  entry: ArchiveEntry
  displayInfo: ItemDisplayInfo | null
  delay?: number
  onClick?: () => void
}

/**
 * Get rarity color class
 */
function getRarityColor(rarity?: string): string {
  switch (rarity) {
    case 'HeavenlyOrdinance':
    case 'Legendary':
      return 'border-purple-500 bg-purple-500/10'
    case 'ImperialDecree':
    case 'Rare':
      return 'border-blue-500 bg-blue-500/10'
    case 'RegionalMandate':
    case 'Uncommon':
      return 'border-green-500 bg-green-500/10'
    default:
      return 'border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)]'
  }
}

/**
 * Get category icon
 */
function getCategoryIcon(category: ArchiveCategory): string {
  const icons: Record<ArchiveCategory, string> = {
    decrees: 'scroll',
    walls: 'wall',
    charters: 'certificate',
    consumables: 'potion',
    tileMarks: 'sparkle',
    seals: 'seal',
    editions: 'shine',
    packs: 'package',
    omens: 'tag',
    mandates: 'challenge',
  }
  return icons[category] || 'item'
}

/**
 * ItemCard - Single item display in collection grid
 */
export function ItemCard({ entry, displayInfo, delay = 0, onClick }: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const isDiscovered = entry.discoveredAt !== null
  const isLocked = !entry.isUnlocked

  const spring = useSpring({
    from: { opacity: 0, scale: 0.8, y: 20 },
    to: { opacity: 1, scale: isHovered ? 1.05 : 1, y: 0 },
    delay,
    config: { tension: 200, friction: 20 },
  })

  const rarityClass = isDiscovered ? getRarityColor(displayInfo?.rarity) : 'border-gray-600 bg-gray-800/50'

  return (
    <AnimatedDiv
      className={`
        relative p-3 rounded-lg border-2 cursor-pointer
        transition-all duration-200 min-h-[120px]
        ${rarityClass}
        ${isLocked ? 'opacity-50' : ''}
        hover:shadow-lg
      `}
      style={{
        opacity: spring.opacity,
        transform: spring.scale.to(
          (s) => `scale(${s}) translateY(${spring.y.get()}px)`
        ),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          onClick()
        }
      }}
    >
      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg z-10">
          <div className="text-center">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-gray-400">Locked</span>
          </div>
        </div>
      )}

      {isDiscovered && displayInfo ? (
        <>
          {/* Item Name */}
          <h3 className="text-sm font-bold text-[var(--color-beige-white)] line-clamp-2 mb-1">
            {displayInfo.name}
          </h3>

          {/* Japanese Name */}
          {displayInfo.japaneseName && (
            <p className="text-xs text-[var(--color-metallic-gold)] font-tile mb-2">
              {displayInfo.japaneseName}
            </p>
          )}

          {/* Description (truncated) */}
          <p className="text-xs text-[var(--color-beige-white)] opacity-70 line-clamp-2">
            {displayInfo.description}
          </p>

          {/* Stats indicator */}
          {(entry.timesUsed > 0 || entry.timesWonWith > 0) && (
            <div className="mt-2 flex gap-2 text-xs">
              {entry.timesUsed > 0 && (
                <span className="text-[var(--color-golden-yellow)]">
                  Used: {entry.timesUsed}
                </span>
              )}
              {entry.timesWonWith > 0 && (
                <span className="text-green-400">
                  Wins: {entry.timesWonWith}
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        /* Undiscovered item - silhouette */
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center mb-2">
            <span className="text-2xl text-gray-500">?</span>
          </div>
          <span className="text-xs text-gray-500">
            {isLocked ? 'Locked' : 'Undiscovered'}
          </span>
        </div>
      )}
    </AnimatedDiv>
  )
}

export default ItemCard
