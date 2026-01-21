/**
 * CollectionScreen - Archive of Hands (手牌録)
 *
 * Displays all discovered/undiscovered items across categories.
 * Based on ARCHITECTURE.MD Section 29 - Archive of Hands.
 */

import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'
import { useAppNavigation, ROUTES } from '../../router'
import { useArchiveStore } from '../../stores/archiveStore'
import { BackButton } from '../ui/BackButton'
import {
  ARCHIVE_CATEGORIES,
  getAllArchiveCategories,
  getArchiveCategory,
  type ArchiveCategory,
  type ArchiveCategoryDefinition,
  WALL_DEFINITIONS,
  TILE_MARK_DEFINITIONS,
  SEAL_DEFINITIONS_ARCHIVE,
  EDITION_DEFINITIONS_ARCHIVE,
  PACK_VARIANT_DEFINITIONS,
} from '../../config/archiveDefinitions'
import { ALL_DECREES } from '../../systems/DecreeSystem'
import { ALL_CHARTERS } from '../../config/charterDefinitions'
import { ALL_OMENS } from '../../config/omenDefinitions'
import { ALL_MANDATES } from '../../config/mandateDefinitions'
import { getAllFateSeals } from '../../systems/FateSealSystem'
import { getAllCelestialOrbs } from '../../systems/CelestialOrbSystem'
import { getAllVoidScripts } from '../../systems/VoidScriptSystem'
import type { ArchiveEntry } from '../../systems/ArchiveSystem'

import { CategoryTabs } from '../collection/CategoryTabs'
import { ItemGrid } from '../collection/ItemGrid'
import { ItemDetailModal } from '../collection/ItemDetailModal'
import type { ItemDisplayInfo } from '../collection/ItemCard'

const AnimatedDiv = animated('div')

/**
 * Build display info map for a category
 */
function buildDisplayInfoMap(category: ArchiveCategory): Map<string, ItemDisplayInfo> {
  const map = new Map<string, ItemDisplayInfo>()

  switch (category) {
    case 'decrees':
      for (const decree of ALL_DECREES) {
        map.set(decree.id, {
          id: decree.id,
          name: decree.name,
          description: decree.description,
          rarity: decree.rarity,
          category: 'decrees',
        })
      }
      break

    case 'walls':
      for (const wall of WALL_DEFINITIONS) {
        map.set(wall.id, {
          id: wall.id,
          name: wall.name,
          japaneseName: wall.japaneseName,
          description: wall.description,
          category: 'walls',
        })
      }
      break

    case 'charters':
      for (const charter of ALL_CHARTERS) {
        map.set(charter.id, {
          id: charter.id,
          name: charter.name,
          japaneseName: charter.japaneseName,
          description: charter.description,
          rarity: charter.isUpgraded ? 'Rare' : 'Common',
          category: 'charters',
        })
      }
      break

    case 'consumables':
      // Fate Seals
      for (const seal of getAllFateSeals()) {
        map.set(seal.id, {
          id: seal.id,
          name: seal.name,
          japaneseName: seal.japaneseName,
          description: seal.description,
          category: 'consumables',
        })
      }
      // Celestial Orbs
      for (const orb of getAllCelestialOrbs()) {
        map.set(orb.id, {
          id: orb.id,
          name: orb.name,
          japaneseName: orb.japaneseName,
          description: orb.description,
          category: 'consumables',
        })
      }
      // Void Scripts
      for (const script of getAllVoidScripts()) {
        map.set(script.id, {
          id: script.id,
          name: script.name,
          japaneseName: script.japaneseName,
          description: script.description,
          category: 'consumables',
        })
      }
      break

    case 'tileMarks':
      for (const mark of TILE_MARK_DEFINITIONS) {
        map.set(mark.id, {
          id: mark.id,
          name: mark.name,
          japaneseName: mark.japaneseName,
          description: `${mark.description}. ${mark.effect}`,
          category: 'tileMarks',
        })
      }
      break

    case 'seals':
      for (const seal of SEAL_DEFINITIONS_ARCHIVE) {
        map.set(seal.id, {
          id: seal.id,
          name: seal.name,
          japaneseName: seal.japaneseName,
          description: `${seal.description}. ${seal.effect}`,
          category: 'seals',
        })
      }
      break

    case 'editions':
      for (const edition of EDITION_DEFINITIONS_ARCHIVE) {
        map.set(edition.id, {
          id: edition.id,
          name: edition.name,
          japaneseName: edition.japaneseName,
          description: `${edition.description}. ${edition.effect}`,
          category: 'editions',
        })
      }
      break

    case 'packs':
      for (const pack of PACK_VARIANT_DEFINITIONS) {
        map.set(pack.id, {
          id: pack.id,
          name: pack.name,
          japaneseName: pack.japaneseName,
          description: pack.description,
          category: 'packs',
        })
      }
      break

    case 'omens':
      for (const omen of ALL_OMENS) {
        map.set(omen.id, {
          id: omen.id,
          name: omen.name,
          japaneseName: omen.japaneseName,
          description: omen.description,
          category: 'omens',
        })
      }
      break

    case 'mandates':
      for (const mandate of ALL_MANDATES) {
        map.set(mandate.id, {
          id: mandate.id,
          name: mandate.name,
          japaneseName: mandate.japaneseName,
          description: mandate.description,
          rarity: mandate.difficulty,
          category: 'mandates',
        })
      }
      break
  }

  return map
}

/**
 * CollectionScreen Component
 */
export function CollectionScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()

  // Archive store
  const entries = useArchiveStore((state) => state.entries)
  const getEntriesByCategory = useArchiveStore((state) => state.getEntriesByCategory)
  const getStats = useArchiveStore((state) => state.getStats)
  const getRecentDiscoveries = useArchiveStore((state) => state.getRecentDiscoveries)

  // Local state
  const [activeCategory, setActiveCategory] = useState<ArchiveCategory>('decrees')
  const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null)
  const [selectedDisplayInfo, setSelectedDisplayInfo] = useState<ItemDisplayInfo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get all categories
  const categories = useMemo(() => getAllArchiveCategories(), [])

  // Get stats
  const stats = useMemo(() => getStats(), [entries])

  // Get recent discoveries
  const recentDiscoveries = useMemo(() => getRecentDiscoveries(5), [entries])

  // Get entries for active category
  const categoryEntries = useMemo(
    () => getEntriesByCategory(activeCategory),
    [activeCategory, entries]
  )

  // Build display info map for active category
  const displayInfoMap = useMemo(
    () => buildDisplayInfoMap(activeCategory),
    [activeCategory]
  )

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ArchiveCategory, { discovered: number; total: number }> = {} as Record<ArchiveCategory, { discovered: number; total: number }>
    for (const cat of categories) {
      const catEntries = getEntriesByCategory(cat.id)
      counts[cat.id] = {
        discovered: catEntries.filter((e) => e.discoveredAt !== null).length,
        total: catEntries.length,
      }
    }
    return counts
  }, [entries, categories])

  // Active category info
  const activeCategoryInfo = useMemo(
    () => getArchiveCategory(activeCategory),
    [activeCategory]
  )

  // Header animation
  const headerSpring = useSpring({
    from: { opacity: 0, y: -20 },
    to: { opacity: 1, y: 0 },
    config: { tension: 200, friction: 20 },
  })

  // Progress bar animation
  const progressSpring = useSpring({
    width: `${stats.completionPercentage}%`,
    config: { tension: 100, friction: 20 },
  })

  // Handle item click
  const handleItemClick = (entry: ArchiveEntry, displayInfo: ItemDisplayInfo | null) => {
    // Only open modal for discovered items or if we have display info
    if (entry.discoveredAt !== null || displayInfo) {
      setSelectedEntry(entry)
      setSelectedDisplayInfo(displayInfo)
      setIsModalOpen(true)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    navigateTo(ROUTES.MENU)
  }

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-dark-forest)]">
      {/* Header */}
      <AnimatedDiv
        style={headerSpring}
        className="flex-shrink-0 px-4 py-3 bg-[var(--color-forest-green)] border-b-2 border-[var(--color-saddle-brown)]"
      >
        <div className="flex items-center justify-between mb-3">
          {/* Back button */}
          <BackButton onClick={handleBack} ariaLabel={t('common.back', 'Back')} />

          {/* Title */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative">
              {t('collection.title', 'Archive of Hands')}
            </h1>
            <p className="text-xs text-[var(--color-metallic-gold)] font-tile">
              手牌録
            </p>
          </div>

          {/* Spacer */}
          <div className="w-[44px]" />
        </div>

        {/* Overall progress */}
        <div className="bg-[var(--color-dark-forest)] rounded-lg p-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--color-beige-white)]">
              {t('collection.progress', 'Collection Progress')}
            </span>
            <span className="text-[var(--color-golden-yellow)]">
              {stats.totalDiscovered} / {stats.totalItems}
            </span>
          </div>
          <div className="h-2 bg-[var(--color-forest-green)] rounded-full overflow-hidden">
            <AnimatedDiv
              className="h-full bg-gradient-to-r from-[var(--color-vibrant-orange)] to-[var(--color-golden-yellow)]"
              style={progressSpring}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 text-[var(--color-metallic-gold)]">
            <span>{stats.completionPercentage.toFixed(1)}% Complete</span>
            <span>{stats.totalItems - stats.totalDiscovered} remaining</span>
          </div>
        </div>
      </AnimatedDiv>

      {/* Category tabs */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--color-forest-green)]">
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Category description */}
      {activeCategoryInfo && (
        <div className="flex-shrink-0 px-4 py-2 bg-[var(--color-forest-green)]/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-golden-yellow)]">
              {activeCategoryInfo.name}
            </span>
            <span className="text-xs text-[var(--color-metallic-gold)] font-tile">
              ({activeCategoryInfo.japaneseName})
            </span>
          </div>
          <p className="text-xs text-[var(--color-beige-white)] opacity-70 mt-1">
            {activeCategoryInfo.description}
          </p>
        </div>
      )}

      {/* Item grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <ItemGrid
          entries={categoryEntries}
          displayInfoMap={displayInfoMap}
          onItemClick={handleItemClick}
        />
      </div>

      {/* Recent discoveries summary (fixed at bottom) */}
      {recentDiscoveries.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 bg-[var(--color-forest-green)] border-t border-[var(--color-saddle-brown)]">
          <p className="text-xs text-[var(--color-metallic-gold)] mb-2">
            {t('collection.recentDiscoveries', 'Recent Discoveries')}
          </p>
          <div className="flex gap-2 overflow-x-auto">
            {recentDiscoveries.slice(0, 5).map((event, index) => {
              const [category, itemId] = event.key.split(':') as [ArchiveCategory, string]
              const infoMap = buildDisplayInfoMap(category as ArchiveCategory)
              const info = infoMap.get(itemId)

              return (
                <div
                  key={index}
                  className="flex-shrink-0 px-3 py-1 rounded bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)] text-xs"
                >
                  <span className="text-[var(--color-golden-yellow)]">
                    {info?.name || itemId}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Item detail modal */}
      <ItemDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entry={selectedEntry}
        displayInfo={selectedDisplayInfo}
        categoryInfo={activeCategoryInfo}
      />
    </div>
  )
}

export default CollectionScreen
