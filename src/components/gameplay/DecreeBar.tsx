/**
 * DecreeBar Components for Tensho Mahjong Roguelike
 *
 * Displays owned decrees in a horizontal scrollable bar.
 * Includes compact decree cards with tooltips and empty slot indicators.
 *
 * @module components/gameplay/DecreeBar
 *
 * @example
 * ```tsx
 * <DecreeBar
 *   decrees={ownedDecrees}
 *   maxSlots={5}
 *   onDecreeTap={(decree) => console.log('Tapped', decree.name)}
 * />
 * ```
 */

import { useState, useCallback } from 'react'
import { OwnedDecree } from '../../systems/types'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'
import { DECREE_RARITY_COLORS, DECREE_ICON_COLORS } from './gameplayTypes'

// =============================================================================
// DECREE CARD COMPACT
// =============================================================================

/**
 * Props for DecreeCardCompact
 */
export interface DecreeCardCompactProps {
  /** The decree to display */
  decree: OwnedDecree
  /** Optional tap handler for mobile interaction */
  onTap?: () => void
}

/**
 * Compact decree card for the decree bar.
 *
 * Shows the decree's unique icon with rarity-based border color.
 * Displays tooltip on hover/tap with full name and description.
 * Visual indicators for stickers and debuffed state.
 */
export function DecreeCardCompact({ decree, onTap }: DecreeCardCompactProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleClick = useCallback(() => {
    setShowTooltip((prev) => !prev)
    onTap?.()
  }, [onTap])

  return (
    <div
      className={`
        relative flex-shrink-0 w-16 h-20
        bg-[var(--color-dark-forest)] rounded-lg
        border-2 ${DECREE_RARITY_COLORS[decree.rarity]}
        ${decree.isDebuffed ? 'opacity-50 grayscale' : ''}
        cursor-pointer transition-all duration-200
        hover:scale-105 hover:shadow-lg
        min-w-[44px] min-h-[44px]
      `}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Unique decree icon */}
      <div className="flex items-center justify-center h-full">
        <DecreeUniqueIcon decreeId={decree.id} size={36} color={DECREE_ICON_COLORS[decree.rarity]} />
      </div>

      {/* Sticker indicator */}
      {decree.sticker && (
        <div className="absolute top-0.5 right-0.5">
          <span className="text-xs">
            {decree.sticker.type === 'Eternal' && '🔒'}
            {decree.sticker.type === 'Perishable' && '⏳'}
            {decree.sticker.type === 'Rental' && '💰'}
          </span>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)] rounded-lg shadow-xl">
          <p className="text-sm font-bold text-[var(--color-beige-white)]">{decree.name}</p>
          <p className="text-xs text-[var(--color-beige-white)] opacity-70 mt-1">{decree.description}</p>
        </div>
      )}

      {/* Debuff overlay */}
      {decree.isDebuffed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
          <span className="text-xl">🚫</span>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// DECREE SLOT EMPTY
// =============================================================================

/**
 * Props for DecreeSlotEmpty
 */
export interface DecreeSlotEmptyProps {
  /** Whether this slot is locked (requires unlock) */
  isLocked?: boolean
}

/**
 * Empty decree slot indicator.
 *
 * Shows a dashed border with either a + sign (available)
 * or lock icon (requires unlock).
 */
export function DecreeSlotEmpty({ isLocked = false }: DecreeSlotEmptyProps) {
  return (
    <div
      className={`
        flex-shrink-0 w-16 h-20
        bg-[var(--color-dark-forest)] rounded-lg
        border-2 border-dashed
        ${isLocked ? 'border-gray-600 opacity-40' : 'border-[var(--color-metallic-gold)] opacity-60'}
        flex items-center justify-center
        min-w-[44px] min-h-[44px]
      `}
    >
      {isLocked ? (
        <span className="text-xl text-gray-500">🔒</span>
      ) : (
        <span className="text-2xl text-[var(--color-metallic-gold)]">+</span>
      )}
    </div>
  )
}

// =============================================================================
// DECREE BAR
// =============================================================================

/**
 * Props for DecreeBar
 */
export interface DecreeBarProps {
  /** Array of owned decrees */
  decrees: OwnedDecree[]
  /** Maximum number of decree slots */
  maxSlots: number
  /** Handler when a decree is tapped */
  onDecreeTap?: (decree: OwnedDecree) => void
}

/**
 * Horizontal bar displaying all owned decrees and empty slots.
 *
 * Features:
 * - Scrollable on overflow
 * - Compact decree cards with tooltips
 * - Empty slot indicators for available slots
 * - Locked indicators for slots requiring unlock
 */
export function DecreeBar({ decrees, maxSlots, onDecreeTap }: DecreeBarProps) {
  const emptySlotCount = Math.max(0, maxSlots - decrees.length)

  return (
    <div data-tutorial="decrees" className="flex gap-2 px-4 py-2 overflow-x-auto">
      {/* Render owned decrees */}
      {decrees.map((decree) => (
        <DecreeCardCompact key={decree.id} decree={decree} onTap={() => onDecreeTap?.(decree)} />
      ))}

      {/* Render empty slots */}
      {Array.from({ length: emptySlotCount }).map((_, i) => (
        <DecreeSlotEmpty key={`empty-${i}`} isLocked={false} />
      ))}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default DecreeBar
