/**
 * CollectionScreen - Archive of Hands (手牌録)
 *
 * Displays all discovered/undiscovered items across categories.
 * Based on ARCHITECTURE.MD Section 29 - Archive of Hands.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { useArchiveStore } from '../../stores/archiveStore'
import { PavilionScreen } from '../ui/PavilionScreen'
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

import { CategoryTabs } from '../collection/CategoryTabs'
import { ItemGrid } from '../collection/ItemGrid'
import type { ItemDisplayInfo } from '../collection/ItemCard'
import { useItemText, type ItemText } from '../../i18n/useItemText'

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
          name: itemText.name('tableStyles', wall),
          japaneseName: wall.japaneseName,
          description: itemText.description('tableStyles', wall),
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

  // Handle back navigation
  const handleBack = () => {
    navigateTo(ROUTES.MENU)
  }

  return (
    <PavilionScreen
      page="collection"
      title={t('collection.title', 'Archive of Hands')}
      shortTitle={t('menu.collection', 'Collection')}
      onBack={handleBack}
      summary={
        <>
          <div className="pavilion-progress">
            <span>{t('collection.progress', 'Collection Progress')}</span>
            <span>
              {stats.totalDiscovered} / {stats.totalItems}
            </span>
          </div>
          <div className="pavilion-meter">
            <span style={{ width: `${stats.completionPercentage}%` }} />
          </div>
        </>
      }
    >
      {/* Category tabs */}
      <div className="mb-3">
        <div className="min-w-0">
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            categoryCounts={categoryCounts}
          />
        </div>
      </div>

      <div className="min-w-0">
        <div className="screen-canvas">
          {activeCategoryInfo && (
            <div className="pavilion-panel mb-4 px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-bold text-[var(--color-golden-yellow)]">
                  {itemText.name('archiveCategories', activeCategoryInfo)}
                </span>
                <span className="text-xs text-[var(--color-metallic-gold)] font-tile">
                  {activeCategoryInfo.japaneseName}
                </span>
                <p className="w-full text-xs text-[var(--color-beige-white)]/70 sm:w-auto sm:flex-1">
                  {itemText.description(
                    'archiveCategories',
                    activeCategoryInfo
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="pb-3">
            <ItemGrid
              entries={categoryEntries}
              displayInfoMap={displayInfoMap}
            />

            {recentDiscoveries.length > 0 && (
              <aside className="pavilion-panel mt-5 p-4">
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
    </PavilionScreen>
  )
}

export default CollectionScreen
