/**
 * CollectionScreen - Archive of Hands (手牌録)
 *
 * Displays all discovered/undiscovered items across categories.
 * Based on ARCHITECTURE.MD Section 29 - Archive of Hands.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'
import { useAppNavigation, ROUTES } from '../../router'
import { useArchiveStore } from '../../stores/archiveStore'
import { BackButton } from '../ui/BackButton'
import {
  getAllArchiveCategories,
  getArchiveCategory,
  type ArchiveCategory,
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
import { useItemText, type ItemText } from '../../i18n/useItemText'

const AnimatedDiv = animated('div')

/**
 * Build display info map for a category
 */
function buildDisplayInfoMap(
  category: ArchiveCategory,
  itemText: ItemText
): Map<string, ItemDisplayInfo> {
  const map = new Map<string, ItemDisplayInfo>()

  switch (category) {
    case 'decrees':
      for (const decree of ALL_DECREES) {
        map.set(decree.id, {
          id: decree.id,
          name: itemText.name('decrees', decree),
          description: itemText.description('decrees', decree),
          rarity: decree.rarity,
          category: 'decrees',
        })
      }
      break

    case 'walls':
      for (const wall of WALL_DEFINITIONS) {
        map.set(wall.id, {
          id: wall.id,
          name: itemText.name('walls', wall),
          japaneseName: wall.japaneseName,
          description: itemText.description('walls', wall),
          category: 'walls',
        })
      }
      break

    case 'charters':
      for (const charter of ALL_CHARTERS) {
        map.set(charter.id, {
          id: charter.id,
          name: itemText.name('charters', charter),
          japaneseName: charter.japaneseName,
          description: itemText.description('charters', charter),
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
          name: itemText.name('seals', seal),
          japaneseName: seal.japaneseName,
          description: itemText.description('seals', seal),
          category: 'consumables',
        })
      }
      // Celestial Orbs
      for (const orb of getAllCelestialOrbs()) {
        map.set(orb.id, {
          id: orb.id,
          name: itemText.name('orbs', orb),
          japaneseName: orb.japaneseName,
          description: itemText.description('orbs', orb),
          category: 'consumables',
        })
      }
      // Void Scripts
      for (const script of getAllVoidScripts()) {
        map.set(script.id, {
          id: script.id,
          name: itemText.name('scripts', script),
          japaneseName: script.japaneseName,
          description: itemText.description('scripts', script),
          rarity: script.rarity,
          category: 'consumables',
        })
      }
      break

    case 'tileMarks':
      for (const mark of TILE_MARK_DEFINITIONS) {
        map.set(mark.id, {
          id: mark.id,
          name: itemText.name('tileMarks', mark),
          japaneseName: mark.japaneseName,
          description: itemText.description('tileMarks', mark),
          category: 'tileMarks',
        })
      }
      break

    case 'seals':
      for (const seal of SEAL_DEFINITIONS_ARCHIVE) {
        map.set(seal.id, {
          id: seal.id,
          name: itemText.name('archiveSeals', seal),
          japaneseName: seal.japaneseName,
          description: itemText.description('archiveSeals', seal),
          category: 'seals',
        })
      }
      break

    case 'editions':
      for (const edition of EDITION_DEFINITIONS_ARCHIVE) {
        map.set(edition.id, {
          id: edition.id,
          name: itemText.name('editions', edition),
          japaneseName: edition.japaneseName,
          description: itemText.description('editions', edition),
          category: 'editions',
        })
      }
      break

    case 'packs':
      for (const pack of PACK_VARIANT_DEFINITIONS) {
        map.set(pack.id, {
          id: pack.id,
          name: itemText.name('packs', pack),
          japaneseName: pack.japaneseName,
          description: itemText.description('packs', pack),
          category: 'packs',
        })
      }
      break

    case 'omens':
      for (const omen of ALL_OMENS) {
        map.set(omen.id, {
          id: omen.id,
          name: itemText.name('omens', omen),
          japaneseName: omen.japaneseName,
          description: itemText.description('omens', omen),
          category: 'omens',
        })
      }
      break

    case 'mandates':
      for (const mandate of ALL_MANDATES) {
        map.set(mandate.id, {
          id: mandate.id,
          name: itemText.name('mandates', mandate),
          japaneseName: mandate.japaneseName,
          description: itemText.description('mandates', mandate),
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
  const itemText = useItemText()
  const { navigateTo } = useAppNavigation()

  // Archive store
  // Subscribe so derived store helpers refresh as discoveries change.
  useArchiveStore((state) => state.entries)
  const getEntriesByCategory = useArchiveStore(
    (state) => state.getEntriesByCategory
  )
  const getStats = useArchiveStore((state) => state.getStats)
  const getRecentDiscoveries = useArchiveStore(
    (state) => state.getRecentDiscoveries
  )

  // Local state
  const [activeCategory, setActiveCategory] =
    useState<ArchiveCategory>('decrees')
  const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null)
  const [selectedDisplayInfo, setSelectedDisplayInfo] =
    useState<ItemDisplayInfo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get all categories
  const categories = useMemo(() => getAllArchiveCategories(), [])

  // Get stats
  const stats = getStats()

  // Get recent discoveries
  const recentDiscoveries = getRecentDiscoveries(5)

  // Get entries for active category
  const categoryEntries = getEntriesByCategory(activeCategory)

  // Build display info map for active category
  const displayInfoMap = useMemo(
    () => buildDisplayInfoMap(activeCategory, itemText),
    [activeCategory, itemText]
  )

  // Category counts
  const categoryCounts = (() => {
    const counts: Record<
      ArchiveCategory,
      { discovered: number; total: number }
    > = {} as Record<ArchiveCategory, { discovered: number; total: number }>
    for (const cat of categories) {
      const catEntries = getEntriesByCategory(cat.id)
      counts[cat.id] = {
        discovered: catEntries.filter((e) => e.discoveredAt !== null).length,
        total: catEntries.length,
      }
    }
    return counts
  })()

  // Active category info
  const activeCategoryInfo = useMemo(
    () => getArchiveCategory(activeCategory),
    [activeCategory]
  )

  // Header animation
  const headerSpring = useSpring({
    opacity: 1,
    y: 0,
    config: { tension: 200, friction: 20 },
  })

  // Progress bar animation
  const progressSpring = useSpring({
    width: `${stats.completionPercentage}%`,
    config: { tension: 100, friction: 20 },
  })

  // Handle item click
  const handleItemClick = (
    entry: ArchiveEntry,
    displayInfo: ItemDisplayInfo | null
  ) => {
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
        className="flex-shrink-0 border-b-2 border-[var(--color-saddle-brown)] bg-[var(--color-forest-green)]"
      >
        <div className="screen-canvas grid gap-3 px-3 py-3 sm:px-5 md:grid-cols-[minmax(260px,0.7fr)_minmax(380px,1.3fr)] md:items-center md:gap-6 md:py-4">
          <div className="flex items-center justify-between">
            <BackButton
              onClick={handleBack}
              ariaLabel={t('common.back', 'Back')}
            />

            <div className="text-center">
              <h1 className="text-base font-bold text-[var(--color-golden-yellow)] font-decorative sm:text-xl">
                <span className="sm:hidden">
                  {t('menu.collection', 'Collection')}
                </span>
                <span className="hidden sm:inline">
                  {t('collection.title', 'Archive of Hands')}
                </span>
              </h1>
              <p className="text-xs text-[var(--color-metallic-gold)] font-tile">
                手牌録
              </p>
            </div>

            <div className="w-[44px]" />
          </div>

          <div className="rounded-lg bg-[var(--color-dark-forest)] px-3 py-2.5">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-[var(--color-beige-white)]">
                {t('collection.progress', 'Collection Progress')}
              </span>
              <span className="text-[var(--color-golden-yellow)]">
                {stats.totalDiscovered} / {stats.totalItems}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-forest-green)]">
              <AnimatedDiv
                className="h-full bg-gradient-to-r from-[var(--color-vibrant-orange)] to-[var(--color-golden-yellow)]"
                style={progressSpring}
              />
            </div>
            <div className="mt-1 hidden justify-between text-xs text-[var(--color-metallic-gold)] sm:flex">
              <span>{stats.completionPercentage.toFixed(1)}% Complete</span>
              <span>{stats.totalItems - stats.totalDiscovered} remaining</span>
            </div>
          </div>
        </div>
      </AnimatedDiv>

      {/* Category tabs */}
      <div className="flex-shrink-0 border-b border-[var(--color-forest-green)]">
        <div className="screen-canvas px-2 py-2.5 sm:px-5 lg:py-3">
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            categoryCounts={categoryCounts}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="screen-canvas">
          {activeCategoryInfo && (
            <div className="border-b border-white/5 bg-[var(--color-forest-green)]/30 px-3 py-2.5 sm:px-5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-bold text-[var(--color-golden-yellow)]">
                  {itemText.name('archiveCategories', activeCategoryInfo)}
                </span>
                <span className="text-xs text-[var(--color-metallic-gold)] font-tile">
                  {activeCategoryInfo.japaneseName}
                </span>
                <p className="w-full text-xs text-[var(--color-beige-white)]/70 sm:w-auto sm:flex-1">
                  {itemText.description('archiveCategories', activeCategoryInfo)}
                </p>
              </div>
            </div>
          )}

          <div className="px-3 py-3 sm:px-5 sm:py-5">
            <ItemGrid
              entries={categoryEntries}
              displayInfoMap={displayInfoMap}
              onItemClick={handleItemClick}
            />

            {recentDiscoveries.length > 0 && (
              <aside className="mt-5 rounded-xl border border-[var(--color-saddle-brown)]/70 bg-[var(--color-forest-green)]/60 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-metallic-gold)]">
                  {t('collection.recentDiscoveries', 'Recent Discoveries')}
                </p>
                <div className="scroll-rail flex gap-2 overflow-x-auto pb-1">
                  {recentDiscoveries.slice(0, 5).map((event, index) => {
                    const [category, itemId] = event.key.split(':') as [
                      ArchiveCategory,
                      string,
                    ]
                    const infoMap = buildDisplayInfoMap(
                      category as ArchiveCategory,
                      itemText
                    )
                    const info = infoMap.get(itemId)

                    return (
                      <div
                        key={index}
                        className="flex-shrink-0 rounded border border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)] px-3 py-1 text-xs"
                      >
                        <span className="text-[var(--color-golden-yellow)]">
                          {info?.name || itemId}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

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
