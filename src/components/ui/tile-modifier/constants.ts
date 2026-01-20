/**
 * Tile Modifier Constants
 *
 * Color schemes and effect definitions for tile modifiers.
 */

import { EnhancementType, SealType, EditionType } from '../../../core/TileModifier'

/**
 * Color scheme for enhancement types
 */
export const ENHANCEMENT_COLORS: Record<EnhancementType, { bg: string; border: string; text: string }> = {
  [EnhancementType.None]: { bg: 'transparent', border: 'transparent', text: '#888' },
  [EnhancementType.Bonus]: { bg: '#3B82F6', border: '#2563EB', text: '#FFF' },
  [EnhancementType.Mult]: { bg: '#EF4444', border: '#DC2626', text: '#FFF' },
  [EnhancementType.Wild]: { bg: '#8B5CF6', border: '#7C3AED', text: '#FFF' },
  [EnhancementType.Glass]: { bg: '#06B6D4', border: '#0891B2', text: '#FFF' },
  [EnhancementType.Steel]: { bg: '#6B7280', border: '#4B5563', text: '#FFF' },
  [EnhancementType.Stone]: { bg: '#78716C', border: '#57534E', text: '#FFF' },
  [EnhancementType.Gold]: { bg: '#F59E0B', border: '#D97706', text: '#000' },
  [EnhancementType.Lucky]: { bg: '#10B981', border: '#059669', text: '#FFF' },
}

/**
 * Color scheme for seal types
 */
export const SEAL_COLORS: Record<SealType, { bg: string; border: string }> = {
  [SealType.None]: { bg: 'transparent', border: 'transparent' },
  [SealType.Gold]: { bg: '#FFD700', border: '#B8860B' },
  [SealType.Red]: { bg: '#DC2626', border: '#991B1B' },
  [SealType.Blue]: { bg: '#3B82F6', border: '#1D4ED8' },
  [SealType.Purple]: { bg: '#9333EA', border: '#7E22CE' },
}

/**
 * Visual effects for edition types
 */
export const EDITION_EFFECTS: Record<EditionType, { className: string; overlay: string }> = {
  [EditionType.Base]: { className: '', overlay: '' },
  [EditionType.Foil]: { className: 'edition-foil', overlay: 'bg-gradient-to-br from-gray-100/30 to-gray-400/30' },
  [EditionType.Holographic]: { className: 'edition-holo', overlay: 'bg-gradient-to-br from-pink-300/30 via-blue-300/30 to-green-300/30' },
  [EditionType.Polychrome]: { className: 'edition-poly', overlay: 'bg-gradient-to-br from-red-300/30 via-yellow-300/30 via-green-300/30 via-blue-300/30 to-purple-300/30' },
  [EditionType.Negative]: { className: 'edition-negative', overlay: 'bg-gradient-to-br from-gray-900/50 to-gray-700/50 invert' },
}

/**
 * Get icon for enhancement type
 */
export function getEnhancementIcon(enhancement: EnhancementType): string {
  switch (enhancement) {
    case EnhancementType.Bonus: return '+'
    case EnhancementType.Mult: return '×'
    case EnhancementType.Wild: return '★'
    case EnhancementType.Glass: return '◇'
    case EnhancementType.Steel: return '■'
    case EnhancementType.Stone: return '●'
    case EnhancementType.Gold: return '¥'
    case EnhancementType.Lucky: return '♣'
    default: return ''
  }
}

/**
 * Get icon for seal type
 */
export function getSealIcon(seal: SealType): string {
  switch (seal) {
    case SealType.Gold: return '¥'
    case SealType.Red: return '↻'
    case SealType.Blue: return '☆'
    case SealType.Purple: return '♦'
    default: return ''
  }
}

/**
 * Get icon for edition type
 */
export function getEditionIcon(edition: EditionType): string {
  switch (edition) {
    case EditionType.Foil: return '◈'
    case EditionType.Holographic: return '◎'
    case EditionType.Polychrome: return '◉'
    case EditionType.Negative: return '◐'
    default: return ''
  }
}
