/**
 * CategoryTabs Component for Collection Screen
 *
 * Horizontal scrollable tabs for navigating between archive categories.
 * Shows completion count for each category.
 */

import { useTranslation } from 'react-i18next'
import type { ArchiveCategory, ArchiveCategoryDefinition } from '../../config/archiveDefinitions'

export interface CategoryTabsProps {
  categories: ArchiveCategoryDefinition[]
  activeCategory: ArchiveCategory
  onCategoryChange: (category: ArchiveCategory) => void
  categoryCounts: Record<ArchiveCategory, { discovered: number; total: number }>
}

/**
 * Get category icon as SVG or emoji
 */
function getCategoryIconElement(iconName: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    scroll: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    wall: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    certificate: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    potion: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    sparkle: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    seal: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
      </svg>
    ),
    shine: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    package: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    tag: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    challenge: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  }

  return iconMap[iconName] || <span className="text-sm">{iconName}</span>
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
  useTranslation()

  return (
    <div className="overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex gap-2 min-w-max">
        {categories.map((category) => {
          const isActive = activeCategory === category.id
          const counts = categoryCounts[category.id] || { discovered: 0, total: 0 }
          const isComplete = counts.discovered === counts.total && counts.total > 0

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
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
              {/* Icon */}
              <span className="flex-shrink-0">
                {getCategoryIconElement(category.icon)}
              </span>

              {/* Name (hidden on mobile for space) */}
              <span className="hidden sm:inline">
                {category.name}
              </span>

              {/* Japanese name on mobile */}
              <span className="sm:hidden">
                {category.japaneseName}
              </span>

              {/* Count badge */}
              <span className={`
                text-xs px-1.5 py-0.5 rounded
                ${isActive ? 'bg-[var(--color-golden-yellow)]/20' : 'bg-[var(--color-dark-forest)]'}
              `}>
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
