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
  /** Hide the Decree identity for Amber Acorn. */
  faceDown?: boolean
  /** Suppress this Decree for the current hand (Crimson Heart). */
  disabledByMandate?: boolean
  /** Sell handler; when supplied the tooltip exposes the run action. */
  onSell?: () => void
}

/**
 * Compact decree card for the decree bar.
 *
 * Shows the decree's unique icon with rarity-based border color.
 * Displays tooltip on hover/tap with full name and description.
 * Visual indicators for stickers and debuffed state.
 */
export function DecreeCardCompact({
  decree,
  onTap,
  faceDown = false,
  disabledByMandate = false,
  onSell,
}: DecreeCardCompactProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isSuppressed = decree.isDebuffed || disabledByMandate
  const canSell = decree.sticker?.type !== 'Eternal'
  const sellValue = decree.sellValue ?? Math.floor(decree.cost / 2)

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
        ${isSuppressed ? 'opacity-50 grayscale' : ''}
        cursor-pointer transition-all duration-200
        hover:scale-105 hover:shadow-lg
        min-w-[44px] min-h-[44px]
      `}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      aria-label={faceDown ? 'Face-down Decree' : decree.name}
    >
      {/* Unique decree icon */}
      <div className="flex items-center justify-center h-full">
        {faceDown ? (
          <div className="flex h-12 w-10 items-center justify-center rounded border border-amber-300/70 bg-gradient-to-br from-amber-950 to-emerald-950 text-2xl font-black text-amber-200">
            ?
          </div>
        ) : (
          <DecreeUniqueIcon decreeId={decree.id} size={36} color={DECREE_ICON_COLORS[decree.rarity]} />
        )}
      </div>

      {/* Sticker indicator */}
      {decree.sticker && !faceDown && (
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
          <p className="text-sm font-bold text-[var(--color-beige-white)]">
            {faceDown ? 'Hidden Decree' : decree.name}
          </p>
          <p className="text-xs text-[var(--color-beige-white)] opacity-70 mt-1">
            {faceDown
              ? 'Amber Acorn conceals this Decree until the Showdown ends.'
              : decree.description}
          </p>
          {disabledByMandate && !faceDown && (
            <p className="mt-2 text-xs font-semibold text-red-300">
              Disabled by Crimson Heart this hand
            </p>
          )}
          {onSell && (
            <button
              type="button"
              disabled={!canSell}
              onClick={(event) => {
                event.stopPropagation()
                onSell()
                setShowTooltip(false)
              }}
              className="mt-2 w-full rounded border border-amber-400/60 bg-amber-900/70 px-2 py-1 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {canSell
                ? faceDown
                  ? 'Sell hidden Decree'
                  : `Sell for ¥${sellValue}`
                : 'Eternal · Cannot sell'}
            </button>
          )}
        </div>
      )}

      {onSell && (
        <button
          type="button"
          disabled={!canSell}
          aria-label={
            canSell
              ? `Sell ${faceDown ? 'hidden Decree' : decree.name}`
              : `${decree.name} is Eternal and cannot be sold`
          }
          onClick={(event) => {
            event.stopPropagation()
            onSell()
          }}
          className="absolute -bottom-1 left-1/2 z-20 -translate-x-1/2 rounded border border-amber-300/70 bg-amber-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-100 shadow hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sell
        </button>
      )}

      {/* Debuff overlay */}
      {isSuppressed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
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
