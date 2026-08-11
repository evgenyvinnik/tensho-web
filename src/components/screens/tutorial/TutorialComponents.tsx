/**
 * Tutorial Components
 *
 * Reusable components for the tutorial system including:
 * - Content formatting helpers (Highlight, InfoBox, Formula, DataTable)
 * - Tile display components
 * - Navigation components (ProgressBar, CategoryItem, CategoryTabs)
 * - Step content container
 */

import React from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useSettingsStore } from '../../../stores/settingsStore'
import { getTileImagePath } from '../../../utils/assets'
import { TileSuit } from '../../../core/Tile'

const AnimatedDiv = animated('div')

// =============================================================================
// TYPES AND CONFIGURATION
// =============================================================================

/**
 * Tutorial step configuration
 * Defines the content and metadata for a single tutorial step
 */
export interface TutorialStep {
  /** Unique identifier for the step */
  id: string
  /** Display title shown in the header */
  title: string
  /** React content to render in the main area */
  content: React.ReactNode
  /** Optional image URL to display */
  image?: string
  /** Optional array of tiles to display as examples */
  showTiles?: Array<{ suit: TileSuit; rank: number }>
  /** Category grouping for navigation sidebar */
  category?: string
}

/**
 * Category visual configuration
 * Maps category names to their display icons and Tailwind color classes
 */
export interface CategoryConfig {
  /** Unique identifier for the category */
  id: string
  /** Emoji or icon character to display */
  icon: string
  /** Tailwind CSS color class for the icon */
  color: string
  /** Human-readable category label */
  label: string
}

/**
 * Predefined category configurations for tutorial sections
 * Each category has an icon and color theme for visual distinction
 */
export const CATEGORY_CONFIG: Record<
  string,
  Omit<CategoryConfig, 'id' | 'label'>
> = {
  Introduction: { icon: '🏯', color: 'text-amber-400' },
  Tiles: { icon: '🀄', color: 'text-blue-400' },
  'Hand Building': { icon: '🤲', color: 'text-green-400' },
  'How to Play': { icon: '🎮', color: 'text-purple-400' },
  Scoring: { icon: '📊', color: 'text-yellow-400' },
  Progression: { icon: '📈', color: 'text-orange-400' },
  Decrees: { icon: '📜', color: 'text-indigo-400' },
  Flora: { icon: '🌸', color: 'text-pink-400' },
  Economy: { icon: '💰', color: 'text-emerald-400' },
  Strategy: { icon: '🧠', color: 'text-cyan-400' },
  'Ready!': { icon: '🎯', color: 'text-red-400' },
}

// =============================================================================
// CONTENT FORMATTING COMPONENTS
// =============================================================================

/**
 * Highlight - Inline text styling component for emphasis
 * Used to draw attention to key terms and values in tutorial content
 *
 * @param children - Text content to highlight
 * @param color - Color theme: 'golden' (default), 'orange', or 'green'
 */
export function Highlight({
  children,
  color = 'golden',
}: {
  children: React.ReactNode
  color?: 'golden' | 'orange' | 'green'
}) {
  const colors = {
    golden: 'text-[var(--color-golden-yellow)]',
    orange: 'text-[var(--color-vibrant-orange)]',
    green: 'text-green-400',
  }
  return <span className={`font-bold ${colors[color]}`}>{children}</span>
}

/**
 * InfoBox - Callout box for tips, information, and warnings
 * Displays content with an icon and colored border based on type
 *
 * @param children - Content to display inside the box
 * @param type - Box variant: 'info' (blue), 'tip' (green), or 'warning' (orange)
 */
export function InfoBox({
  children,
  type = 'info',
}: {
  children: React.ReactNode
  type?: 'info' | 'tip' | 'warning'
}) {
  const styles = {
    info: 'bg-blue-900/30 border-blue-400/50',
    tip: 'bg-green-900/30 border-green-400/50',
    warning: 'bg-orange-900/30 border-orange-400/50',
  }
  const icons = { info: 'ℹ️', tip: '💡', warning: '⚠️' }
  return (
    <div className={`p-3 rounded-lg border ${styles[type]} mt-2`}>
      <span className="mr-2">{icons[type]}</span>
      {children}
    </div>
  )
}

/**
 * Formula - Styled container for displaying mathematical formulas
 * Renders content in a monospace font with a gold border
 *
 * @param children - Formula content to display
 */
export function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono bg-[var(--color-forest-green)] p-3 rounded text-center text-lg border border-[var(--color-metallic-gold)]">
      {children}
    </div>
  )
}

/**
 * DataTable - Renders a styled HTML table for data presentation
 * Used to display structured information like tile counts, scoring values, etc.
 *
 * @param headers - Array of column header strings
 * @param rows - 2D array of cell contents (strings or React nodes)
 */
export function DataTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: Array<Array<string | React.ReactNode>>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm mt-2 border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="border border-[var(--color-metallic-gold)]/30 p-2 bg-[var(--color-forest-green)] text-left"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border border-[var(--color-metallic-gold)]/30 p-2"
                >
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

/** Inline label backed by the project's existing Mahjong tile artwork. */
export function TileLabel({
  suit,
  rank,
  label,
  className = '',
}: {
  suit: TileSuit
  rank: number
  label: string
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={getTileImagePath(suit, rank)}
        alt=""
        aria-hidden="true"
        className="h-9 w-7 shrink-0 object-contain drop-shadow-sm"
        draggable={false}
      />
      <span>{label}</span>
    </span>
  )
}

// =============================================================================
// TILE DISPLAY COMPONENT
// =============================================================================

/**
 * TileDisplay - Animated display of mahjong tile examples
 * Shows tiles with a slide-up animation, respects reduced motion settings
 *
 * @param tiles - Array of tile definitions with suit and rank
 */
export function TileDisplay({
  tiles,
}: {
  tiles: Array<{ suit: TileSuit; rank: number }>
}) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const spring = useSpring({
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    config: { tension: 200, friction: 20 },
    delay: 200,
    immediate: reducedMotion,
  })

  return (
    <AnimatedDiv
      className="flex justify-center gap-2 py-4 flex-wrap"
      style={{
        opacity: spring.opacity,
        transform: spring.y.to((y) => `translateY(${y}px)`),
      }}
    >
      {tiles.map((tile, index) => (
        <img
          key={index}
          src={getTileImagePath(tile.suit, tile.rank)}
          alt=""
          className="w-12 h-16 md:w-14 md:h-20 object-contain drop-shadow-lg hover:scale-110 transition-transform"
          draggable={false}
        />
      ))}
    </AnimatedDiv>
  )
}

// =============================================================================
// NAVIGATION COMPONENTS
// =============================================================================

/**
 * ProgressBar - Visual progress indicator for tutorial completion
 * Shows current step position and overall percentage complete
 *
 * @param current - Current step index (0-based)
 * @param total - Total number of steps
 * @param categoryProgress - Optional category-specific progress text
 */
export function ProgressBar({
  current,
  total,
  categoryProgress,
}: {
  current: number
  total: number
  categoryProgress?: string
}) {
  const percentage = ((current + 1) / total) * 100

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-[var(--color-metallic-gold)] mb-1">
        <span>{categoryProgress || `Step ${current + 1} of ${total}`}</span>
        <span>{Math.round(percentage)}% complete</span>
      </div>
      <div className="w-full h-2 bg-[var(--color-dark-forest)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-vibrant-orange)] to-[var(--color-golden-yellow)] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

/**
 * CategoryItem - Sidebar navigation item for a tutorial category
 * Shows category icon, name, step count, and completion status
 *
 * @param category - Category name to display
 * @param isActive - Whether this category is currently selected
 * @param stepCount - Total number of steps in this category
 * @param completedCount - Number of steps the user has visited
 * @param onClick - Handler called when the item is clicked
 */
export function CategoryItem({
  category,
  isActive,
  stepCount,
  completedCount,
  onClick,
}: {
  category: string
  isActive: boolean
  stepCount: number
  completedCount: number
  onClick: () => void
}) {
  const config = CATEGORY_CONFIG[category] || {
    icon: '📖',
    color: 'text-gray-400',
  }
  const isComplete = completedCount >= stepCount

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left
        ${
          isActive
            ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)]'
            : 'bg-[var(--color-dark-forest)] hover:bg-[var(--color-forest-green)] text-[var(--color-beige-white)]'
        }`}
    >
      <span className={`text-xl ${!isActive ? config.color : ''}`}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{category}</p>
        <p className="text-xs opacity-70">
          {completedCount}/{stepCount} steps
        </p>
      </div>
      {isComplete && <span className="text-green-400">✓</span>}
    </button>
  )
}

/**
 * CategoryTabs - Horizontal scrollable category navigation for mobile
 * Displays all categories as compact pill buttons
 *
 * @param categories - Array of category names
 * @param currentCategory - Currently active category name
 * @param onCategoryClick - Handler called when a category is selected
 */
export function CategoryTabs({
  categories,
  currentCategory,
  onCategoryClick,
}: {
  categories: string[]
  currentCategory: string
  onCategoryClick: (category: string) => void
}) {
  return (
    <div className="scroll-rail overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2 px-1">
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat] || {
            icon: '📖',
            color: 'text-gray-400',
          }
          const isActive = cat === currentCategory

          return (
            <button
              key={cat}
              onClick={() => onCategoryClick(cat)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm
              ${
                isActive
                  ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)]'
                  : 'bg-[var(--color-dark-forest)] text-[var(--color-beige-white)] hover:bg-[var(--color-forest-green)]'
              }`}
            >
              <span className={!isActive ? config.color : ''}>
                {config.icon}
              </span>
              <span className="whitespace-nowrap">{cat}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// STEP CONTENT COMPONENT
// =============================================================================

/**
 * StepContent - Animated container for tutorial step content
 * Renders the step's text content, optional tiles, and images with slide-in animation
 *
 * @param step - The tutorial step data to render
 */
export function StepContent({ step }: { step: TutorialStep }) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const spring = useSpring({
    from: { opacity: 0, x: 20 },
    to: { opacity: 1, x: 0 },
    config: { tension: 200, friction: 20 },
    reset: true,
    immediate: reducedMotion,
  })

  return (
    <AnimatedDiv
      className="space-y-4"
      style={{
        opacity: spring.opacity,
        transform: spring.x.to((x) => `translateX(${x}px)`),
      }}
    >
      <div className="text-base leading-relaxed">{step.content}</div>

      {step.showTiles && step.showTiles.length > 0 && (
        <TileDisplay tiles={step.showTiles} />
      )}

      {step.image && (
        <div className="flex justify-center py-4">
          <img
            src={step.image}
            alt=""
            className="max-w-full max-h-48 object-contain rounded-lg"
            draggable={false}
          />
        </div>
      )}
    </AnimatedDiv>
  )
}
