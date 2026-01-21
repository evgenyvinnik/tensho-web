/**
 * ItemDetailModal Component for Collection Screen
 *
 * Displays full details of an archive item including:
 * - Full-size item display
 * - Name (English + Japanese)
 * - Description/effect
 * - Stats: times used, times won with
 * - Discovery date
 * - Rarity indicator
 */

import { useSpring, animated } from '@react-spring/web'
import { createPortal } from 'react-dom'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'
import { formatDiscoveryDate } from '../../systems/ArchiveSystem'
import type { ArchiveCategory, ArchiveCategoryDefinition } from '../../config/archiveDefinitions'
import type { ItemDisplayInfo } from './ItemCard'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'

const AnimatedDiv = animated('div')

export interface ItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  entry: ArchiveEntry | null
  displayInfo: ItemDisplayInfo | null
  categoryInfo: ArchiveCategoryDefinition | null
}

/**
 * Get rarity display info
 */
function getRarityInfo(rarity?: string): { label: string; color: string; bgColor: string } {
  switch (rarity) {
    case 'HeavenlyOrdinance':
      return { label: 'Legendary', color: 'text-purple-300', bgColor: 'bg-purple-500/20' }
    case 'ImperialDecree':
      return { label: 'Rare', color: 'text-blue-300', bgColor: 'bg-blue-500/20' }
    case 'RegionalMandate':
      return { label: 'Uncommon', color: 'text-green-300', bgColor: 'bg-green-500/20' }
    case 'LocalEdict':
      return { label: 'Common', color: 'text-gray-300', bgColor: 'bg-gray-500/20' }
    default:
      return { label: 'Standard', color: 'text-[var(--color-beige-white)]', bgColor: 'bg-[var(--color-dark-forest)]' }
  }
}

/**
 * Get rarity icon color for decree icons
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
 * ItemDetailModal - Full detail view of an archive item
 */
export function ItemDetailModal({
  isOpen,
  onClose,
  entry,
  displayInfo,
  categoryInfo,
}: ItemDetailModalProps) {
  const spring = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.9,
    config: { tension: 300, friction: 20 },
  })

  if (!isOpen || !entry || !displayInfo) return null

  const isDiscovered = entry.discoveredAt !== null
  const rarityInfo = getRarityInfo(displayInfo.rarity)

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <AnimatedDiv
        className="relative max-w-md w-full mx-4 rounded-xl bg-[var(--color-dark-forest)] border-2 border-[var(--color-saddle-brown)] shadow-2xl overflow-hidden"
        style={{
          opacity: spring.opacity,
          transform: spring.scale.to((s) => `scale(${s})`),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with rarity gradient */}
        <div className={`p-4 ${rarityInfo.bgColor} border-b border-[var(--color-saddle-brown)]`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 flex items-start gap-3">
              {/* Decree icon for decree category items */}
              {displayInfo.category === 'decrees' && (
                <div className="flex-shrink-0 p-2 rounded-lg bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)]">
                  <DecreeUniqueIcon
                    decreeId={displayInfo.id}
                    size={40}
                    color={getRarityIconColor(displayInfo.rarity)}
                  />
                </div>
              )}

              <div className="flex-1">
                {/* Category badge */}
                {categoryInfo && (
                  <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--color-forest-green)] text-[var(--color-metallic-gold)] mb-2">
                    {categoryInfo.name}
                  </span>
                )}

                {/* Name */}
                <h2 className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative">
                  {displayInfo.name}
                </h2>

                {/* Japanese name */}
                {displayInfo.japaneseName && (
                  <p className="text-sm text-[var(--color-metallic-gold)] font-tile mt-1">
                    {displayInfo.japaneseName}
                  </p>
                )}

                {/* Rarity */}
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-bold rounded ${rarityInfo.color} ${rarityInfo.bgColor}`}>
                  {rarityInfo.label}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[var(--color-forest-green)] hover:bg-[var(--color-vibrant-orange)]
                         border-2 border-[var(--color-metallic-gold)] hover:border-[var(--color-golden-yellow)]
                         text-[var(--color-beige-white)] hover:text-white
                         transition-all hover:scale-110 active:scale-95
                         min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-golden-yellow)] mb-1">Effect</h3>
            <p className="text-sm text-[var(--color-beige-white)]">
              {displayInfo.description}
            </p>
          </div>

          {/* Stats section */}
          {isDiscovered && (
            <div className="grid grid-cols-2 gap-3">
              {/* Times Used */}
              <div className="p-3 rounded-lg bg-[var(--color-forest-green)] border border-[var(--color-metallic-gold)]">
                <p className="text-xs text-[var(--color-metallic-gold)]">Times Used</p>
                <p className="text-xl font-bold text-[var(--color-golden-yellow)]">
                  {entry.timesUsed.toLocaleString()}
                </p>
              </div>

              {/* Times Won With */}
              <div className="p-3 rounded-lg bg-[var(--color-forest-green)] border border-[var(--color-metallic-gold)]">
                <p className="text-xs text-[var(--color-metallic-gold)]">Runs Won</p>
                <p className="text-xl font-bold text-green-400">
                  {entry.timesWonWith.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Discovery date */}
          {isDiscovered && (
            <div className="pt-3 border-t border-[var(--color-forest-green)]">
              <p className="text-xs text-[var(--color-metallic-gold)]">
                Discovered: <span className="text-[var(--color-beige-white)]">{formatDiscoveryDate(entry.discoveredAt)}</span>
              </p>
            </div>
          )}

          {/* Unlock condition for locked items */}
          {!entry.isUnlocked && entry.unlockCondition && (
            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm text-gray-400">
                  <span className="font-bold">Unlock: </span>
                  {entry.unlockCondition}
                </p>
              </div>
            </div>
          )}
        </div>
      </AnimatedDiv>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default ItemDetailModal
