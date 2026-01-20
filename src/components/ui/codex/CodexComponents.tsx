/**
 * Codex Components
 *
 * Reusable components for the Codex encyclopedia.
 */

import React from 'react'
import { getTileImagePath } from '../../../utils/assets'
import { TileSuit } from '../../../core/Tile'
import { CodexCategory } from './types'

/**
 * Tile display helper - shows a group of tiles
 */
export function TileGroup({
  tiles,
  size = 'md',
}: {
  tiles: Array<{ suit: TileSuit; rank: number }>
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'sm' ? 'w-10 h-14' : 'w-12 h-16'
  return (
    <div className="flex gap-1 justify-center my-3">
      {tiles.map((tile, i) => (
        <img
          key={i}
          src={getTileImagePath(tile.suit, tile.rank)}
          alt=""
          className={`${sizeClass} object-contain drop-shadow`}
          draggable={false}
        />
      ))}
    </div>
  )
}

/**
 * Info box component - callout boxes for tips, info, warnings
 */
export function InfoBox({
  title,
  children,
  variant = 'info',
}: {
  title?: string
  children: React.ReactNode
  variant?: 'info' | 'tip' | 'warning'
}) {
  const colors = {
    info: 'border-[var(--color-metallic-gold)] bg-[var(--color-forest-green)]',
    tip: 'border-[var(--color-golden-yellow)] bg-[var(--color-dark-forest)]',
    warning: 'border-[var(--color-vibrant-orange)] bg-[var(--color-dark-forest)]',
  }
  return (
    <div className={`border-l-4 ${colors[variant]} p-4 my-4 rounded-r`}>
      {title && <div className="font-bold text-[var(--color-golden-yellow)] mb-2">{title}</div>}
      <div className="text-sm">{children}</div>
    </div>
  )
}

/**
 * Data table component - renders tabular data
 */
export function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[var(--color-forest-green)]">
            {headers.map((h, i) => (
              <th
                key={i}
                className="border border-[var(--color-metallic-gold)] px-3 py-2 text-left text-[var(--color-golden-yellow)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? 'bg-[var(--color-dark-forest)]' : 'bg-[var(--color-forest-green)]/50'}
            >
              {row.map((cell, j) => (
                <td key={j} className="border border-[var(--color-metallic-gold)]/50 px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Sidebar navigation component
 */
export function CodexSidebar({
  categories,
  activeCategory,
  activeSection,
  onSelectSection,
}: {
  categories: CodexCategory[]
  activeCategory: string
  activeSection: string
  onSelectSection: (categoryId: string, sectionId: string) => void
}) {
  return (
    <nav className="w-64 flex-shrink-0 border-r border-[var(--color-metallic-gold)]/30 overflow-y-auto">
      {categories.map((category) => (
        <div key={category.id} className="mb-2">
          <div className="px-4 py-2 text-[var(--color-golden-yellow)] font-bold flex items-center gap-2">
            <span>{category.icon}</span>
            <span>{category.title}</span>
          </div>
          <ul>
            {category.sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => onSelectSection(category.id, section.id)}
                  className={`w-full text-left px-6 py-2 text-sm transition-colors ${
                    activeCategory === category.id && activeSection === section.id
                      ? 'bg-[var(--color-vibrant-orange)] text-white'
                      : 'text-[var(--color-beige-white)] hover:bg-[var(--color-forest-green)]'
                  }`}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
