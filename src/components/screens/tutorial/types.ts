/**
 * Tutorial Types and Configuration
 *
 * Shared types and constants for the tutorial system.
 */

import { TileSuit } from '../../../core/Tile'

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
export const CATEGORY_CONFIG: Record<string, Omit<CategoryConfig, 'id' | 'label'>> = {
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
