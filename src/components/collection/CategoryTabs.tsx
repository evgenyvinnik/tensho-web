/**
 * CategoryTabs Component for Collection Screen
 *
 * Horizontal scrollable tabs for navigating between archive categories.
 * Shows completion count for each category.
 */

import { useTranslation } from 'react-i18next'
import type {
  ArchiveCategory,
  ArchiveCategoryDefinition,
} from '../../config/archiveDefinitions'
import { useItemText } from '../../i18n/useItemText'
import { ControlIcon } from '../ui/ControlIcon'

export interface CategoryTabsProps {
  categories: ArchiveCategoryDefinition[]
  activeCategory: ArchiveCategory
  onCategoryChange: (category: ArchiveCategory) => void
  categoryCounts: Record<ArchiveCategory, { discovered: number; total: number }>
}

/**
 * CategoryTabs - Horizontal scrollable category navigation
 */
export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  categoryCounts,
}: CategoryTabsProps) {
  const itemText = useItemText()
  useTranslation()

  return (
    <div className="scroll-rail overflow-x-auto pb-1 lg:overflow-visible">
      <div className="flex min-w-max gap-2 px-1 lg:min-w-0 lg:flex-wrap lg:px-0">
        {categories.map((category) => {
          const isActive = activeCategory === category.id
          const counts = categoryCounts[category.id] || {
            discovered: 0,
            total: 0,
          }
          const isComplete =
            counts.discovered === counts.total && counts.total > 0

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              aria-pressed={isActive}
              className={`
                flex-shrink-0 px-3 py-2 rounded-lg font-bold text-sm
                border-2 transition-all duration-200
                min-h-[44px] min-w-[44px]
                flex items-center gap-2
                ${
                  isActive
                    ? 'bg-[var(--color-vibrant-orange)] border-[var(--color-golden-yellow)] text-[var(--color-beige-white)]'
                    : isComplete
                      ? 'bg-green-900/30 border-green-500 text-green-300 hover:bg-green-900/50'
                      : 'bg-[var(--color-dark-forest)] border-[var(--color-metallic-gold)] text-[var(--color-metallic-gold)] hover:bg-[var(--color-forest-green)]'
                }
              `}
            >
              {/* Categories without matching generated art use their live label. */}
              {category.icon === 'challenge' && (
                <ControlIcon name="challenge" size={16} />
              )}

              {/* Keep categories understandable in the selected language at
                  every width; the horizontal rail handles longer labels. */}
              <span>{itemText.name('archiveCategories', category)}</span>

              {/* Count badge */}
              <span
                className={`
                text-xs px-1.5 py-0.5 rounded
                ${isActive ? 'bg-[var(--color-golden-yellow)]/20' : 'bg-[var(--color-dark-forest)]'}
              `}
              >
                {counts.discovered}/{counts.total}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryTabs
