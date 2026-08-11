/**
 * ItemCard Component for Collection Screen
 *
 * Displays a single archive item in the collection grid.
 * Shows discovered items with full details, undiscovered as silhouettes.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated, to } from '@react-spring/web'
import { useSettingsStore } from '../../stores/settingsStore'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import type { ArchiveCategory } from '../../config/archiveDefinitions'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'
import { VOID_SCRIPTS } from '../../systems/VoidScriptSystem'
import { VoidScriptArtwork } from '../ui/VoidScriptArtwork'

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
  onClick?: () => void
}

/**
 * Get rarity icon color
 */
function getRarityIconColor(rarity?: string): string {
  switch (rarity) {
    case 'HeavenlyOrdinance':
    case 'mythic':
      return '#A855F7' // purple-500
    case 'ImperialDecree':
    case 'rare':
      return '#3B82F6' // blue-500
    case 'RegionalMandate':
    case 'uncommon':
      return '#22C55E' // green-500
    case 'legendary':
      return '#A855F7' // purple-500
    default:
      return '#9CA3AF' // gray-400
  }
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
 * ItemCard - Single item display in collection grid
 */
export function ItemCard({ entry, displayInfo, onClick }: ItemCardProps) {
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)

  const isDiscovered = entry.discoveredAt !== null
  const isLocked = !entry.isUnlocked

  const spring = useSpring({
    opacity: 1,
    scale: isHovered ? 1.04 : 1,
    y: 0,
    config: { tension: 200, friction: 20 },
    immediate: reducedMotion,
  })

  const rarityClass = isDiscovered
    ? getRarityColor(displayInfo?.rarity)
    : 'border-gray-600 bg-gray-800/50'
  const voidScript = displayInfo ? VOID_SCRIPTS[displayInfo.id] : undefined

  return (
    <AnimatedDiv
      className={`
        relative min-w-0 rounded-lg border-2 p-2.5 cursor-pointer sm:p-3
        transition-all duration-200 min-h-[128px]
        ${rarityClass}
        ${isLocked ? 'opacity-50' : ''}
        hover:shadow-lg
      `}
      style={{
        opacity: spring.opacity,
        transform: to(
          [spring.scale, spring.y],
          (scale, y) => `scale(${scale}) translateY(${y}px)`
        ),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          onClick()
        }
      }}
    >
      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg z-10">
          <div className="text-center">
            <svg
              className="w-8 h-8 text-gray-400 mx-auto mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-xs text-gray-400">{t('collection.locked', 'Locked')}</span>
          </div>
        </div>
      )}

      {isDiscovered && displayInfo ? (
        <>
          {/* Decree icon for decree category items */}
          {displayInfo.category === 'decrees' && (
            <div className="absolute top-2 right-2">
              <DecreeUniqueIcon
                decreeId={displayInfo.id}
                size={24}
                color={getRarityIconColor(displayInfo.rarity)}
              />
            </div>
          )}

          {voidScript && (
            <VoidScriptArtwork
              script={voidScript}
              name={displayInfo.name}
              description={displayInfo.description}
              focusable={false}
              className="absolute right-1 top-1 h-16 w-16 sm:right-2 sm:top-2"
            />
          )}

          {/* Item Name */}
          <h3
            className={`mb-1 line-clamp-2 text-sm font-bold text-[var(--color-beige-white)] ${voidScript ? 'pr-14 sm:pr-16' : ''}`}
          >
            {displayInfo.name}
          </h3>

          {/* Japanese Name */}
          {displayInfo.japaneseName && (
            <p className="text-xs text-[var(--color-metallic-gold)] font-tile mb-2">
              {displayInfo.japaneseName}
            </p>
          )}

          {/* Description (truncated) */}
          <p
            className={`line-clamp-2 text-xs text-[var(--color-beige-white)] opacity-70 ${voidScript ? 'pr-12 sm:pr-14' : ''}`}
          >
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
