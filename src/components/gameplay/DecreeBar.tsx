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

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { animated, useSpring } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import { OwnedDecree } from '../../systems/types'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'
import { DECREE_RARITY_COLORS, DECREE_ICON_COLORS } from './gameplayTypes'
import { useItemText } from '../../i18n/useItemText'
import { getDecreeScrollIllustration } from '../../utils/assets'

// =============================================================================
// DECREE CARD COMPACT
// =============================================================================

interface PopoverPosition {
  left: number
  top: number
  width: number
}

const POPOVER_MARGIN = 12
const POPOVER_GAP = 10
const POPOVER_MAX_WIDTH = 320
const ESTIMATED_POPOVER_HEIGHT = 250

const RARITY_TRANSLATION_KEYS = {
  LocalEdict: 'common',
  RegionalMandate: 'uncommon',
  ImperialDecree: 'rare',
  HeavenlyOrdinance: 'mythic',
} as const

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
 * Shows an illustrated scroll with the Decree's unique icon layered over it.
 * Displays a viewport-aware detail popover on hover, focus, or tap.
 * Visual indicators for stickers and debuffed state.
 */
export function DecreeCardCompact({
  decree,
  onTap,
  faceDown = false,
  disabledByMandate = false,
  onSell,
}: DecreeCardCompactProps) {
  const { t } = useTranslation()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPinnedRef = useRef(false)
  const popoverId = useId()
  const [showPopover, setShowPopover] = useState(false)
  const [position, setPosition] = useState<PopoverPosition | null>(null)
  const itemText = useItemText()
  const decreeName = itemText.name('decrees', decree)
  const decreeDescription = itemText.description('decrees', decree)
  const isSuppressed = decree.isDebuffed || disabledByMandate
  const canSell = decree.sticker?.type !== 'Eternal'
  const sellValue = decree.sellValue ?? Math.floor(decree.cost / 2)
  const displayName = faceDown
    ? t('gameplay.hiddenDecreeTitle', 'Hidden Decree')
    : decreeName
  const rarityLabel = t(
    `decrees.rarity.${RARITY_TRANSLATION_KEYS[decree.rarity]}`,
    decree.rarity
  )

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const openPopover = useCallback(() => {
    cancelClose()
    setShowPopover(true)
  }, [cancelClose])

  const scheduleClose = useCallback(() => {
    if (isPinnedRef.current) return
    cancelClose()
    closeTimerRef.current = setTimeout(() => setShowPopover(false), 120)
  }, [cancelClose])

  const closePopover = useCallback(() => {
    isPinnedRef.current = false
    cancelClose()
    setShowPopover(false)
  }, [cancelClose])

  const updatePosition = useCallback((height = ESTIMATED_POPOVER_HEIGHT) => {
    const anchor = anchorRef.current
    if (!anchor || typeof window === 'undefined') return

    const rect = anchor.getBoundingClientRect()
    const width = Math.min(
      POPOVER_MAX_WIDTH,
      window.innerWidth - POPOVER_MARGIN * 2
    )
    const left = Math.min(
      window.innerWidth - width - POPOVER_MARGIN,
      Math.max(POPOVER_MARGIN, rect.left + rect.width / 2 - width / 2)
    )
    const fitsAbove = rect.top - height - POPOVER_GAP >= POPOVER_MARGIN
    const proposedTop = fitsAbove
      ? rect.top - height - POPOVER_GAP
      : rect.bottom + POPOVER_GAP
    const top = Math.min(
      Math.max(POPOVER_MARGIN, window.innerHeight - height - POPOVER_MARGIN),
      Math.max(POPOVER_MARGIN, proposedTop)
    )

    setPosition({ left, top, width })
  }, [])

  useLayoutEffect(() => {
    if (!showPopover) return
    updatePosition()
    const frame = window.requestAnimationFrame(() => {
      if (popoverRef.current) {
        updatePosition(popoverRef.current.getBoundingClientRect().height)
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [showPopover, updatePosition])

  useEffect(() => {
    if (!showPopover) return

    const handleViewportChange = () =>
      updatePosition(
        popoverRef.current?.getBoundingClientRect().height ??
          ESTIMATED_POPOVER_HEIGHT
      )
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !anchorRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        closePopover()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePopover()
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closePopover, showPopover, updatePosition])

  useEffect(() => () => cancelClose(), [cancelClose])

  const handleClick = useCallback(() => {
    cancelClose()
    isPinnedRef.current = true
    setShowPopover(true)
    onTap?.()
  }, [cancelClose, onTap])

  const handlePointerDown = useCallback(() => {
    cancelClose()
    isPinnedRef.current = true
    setShowPopover(true)
  }, [cancelClose])

  const popoverSpring = useSpring({
    opacity: showPopover ? 1 : 0,
    y: showPopover ? 0 : 7,
    scale: showPopover ? 1 : 0.98,
    config: { tension: 360, friction: 28 },
  })

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-decree-scroll={decree.rarity}
        className={`
          game-decree-card group relative h-20 w-16 min-h-[44px] min-w-[44px] flex-shrink-0
          overflow-visible rounded-lg border-2 bg-black/20 ${DECREE_RARITY_COLORS[decree.rarity]}
          ${isSuppressed ? 'opacity-60 grayscale' : ''}
          cursor-pointer transition-[transform,filter,box-shadow] duration-200
          hover:-translate-y-1 hover:scale-105 hover:drop-shadow-lg
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]
        `}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClose}
        onFocus={openPopover}
        onBlur={scheduleClose}
        aria-label={
          faceDown
            ? t('gameplay.faceDownDecree', 'Face-down Decree')
            : decreeName
        }
        aria-haspopup="dialog"
        aria-expanded={showPopover}
        aria-controls={showPopover ? popoverId : undefined}
      >
        <img
          src={getDecreeScrollIllustration(decree.rarity)}
          alt=""
          aria-hidden="true"
          className="game-illustration absolute inset-0 h-full w-full scale-[1.18] object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.55)] transition-transform duration-200 group-hover:scale-[1.23]"
          draggable={false}
        />

        <span className="absolute left-1/2 top-[47%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]">
          {faceDown ? (
            <span className="font-decorative text-2xl font-black text-amber-950">
              ?
            </span>
          ) : (
            <DecreeUniqueIcon
              decreeId={decree.id}
              size={32}
              color={DECREE_ICON_COLORS[decree.rarity]}
            />
          )}
        </span>

        {decree.sticker && !faceDown && (
          <span
            aria-hidden="true"
            title={decree.sticker.type}
            className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full border border-amber-200/80 bg-[#14251d] px-1 text-[9px] font-black text-amber-100 shadow"
          >
            {decree.sticker.type === 'Eternal' && '∞'}
            {decree.sticker.type === 'Perishable' && 'P'}
            {decree.sticker.type === 'Rental' && '¥'}
          </span>
        )}

        {isSuppressed && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/45">
            <svg
              aria-hidden="true"
              className="h-8 w-8 text-red-300 drop-shadow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <circle cx="12" cy="12" r="8.5" />
              <path d="m6 6 12 12" />
            </svg>
          </span>
        )}
      </button>

      {showPopover &&
        position &&
        createPortal(
          <animated.div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label={t('gameplay.decreeDetails', '{{name}} details', {
              name: displayName,
            })}
            className="fixed z-[100] overflow-y-auto rounded-xl border border-[var(--color-metallic-gold)]/85 bg-[#0b1b15]/[0.98] text-left shadow-[0_18px_50px_rgba(0,0,0,0.68),0_0_24px_rgba(200,178,115,0.16)] backdrop-blur-sm"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onFocus={cancelClose}
            onBlur={scheduleClose}
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              maxHeight: `calc(100dvh - ${POPOVER_MARGIN * 2}px)`,
              opacity: popoverSpring.opacity,
              transform: popoverSpring.y.to(
                (y) => `translateY(${y}px) scale(${popoverSpring.scale.get()})`
              ),
            }}
          >
            <div
              className="h-1"
              style={{ backgroundColor: DECREE_ICON_COLORS[decree.rarity] }}
            />
            <div className="p-3.5">
              <div className="flex items-start gap-3">
                <span className="relative flex h-[76px] w-[60px] shrink-0 items-center justify-center">
                  <img
                    src={getDecreeScrollIllustration(decree.rarity)}
                    alt=""
                    aria-hidden="true"
                    className="game-illustration absolute inset-0 h-full w-full object-contain drop-shadow-md"
                  />
                  <span className="relative mt-[-2px]">
                    {faceDown ? (
                      <span className="font-decorative text-2xl font-black text-amber-950">
                        ?
                      </span>
                    ) : (
                      <DecreeUniqueIcon
                        decreeId={decree.id}
                        size={30}
                        color={DECREE_ICON_COLORS[decree.rarity]}
                      />
                    )}
                  </span>
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="font-decorative text-base font-bold leading-tight text-[var(--color-golden-yellow)]">
                    {displayName}
                  </p>
                  <span
                    className="mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]"
                    style={{
                      borderColor: DECREE_ICON_COLORS[decree.rarity],
                      color: DECREE_ICON_COLORS[decree.rarity],
                    }}
                  >
                    {rarityLabel}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[var(--color-beige-white)]/90">
                {faceDown
                  ? t(
                      'gameplay.hiddenDecreeDescription',
                      'Amber Acorn conceals this Decree until the Showdown ends.'
                    )
                  : decreeDescription}
              </p>

              {disabledByMandate && !faceDown && (
                <p className="mt-3 rounded-lg border border-red-400/35 bg-red-950/45 px-2.5 py-2 text-xs font-semibold text-red-200">
                  {t(
                    'gameplay.decreeDisabledByMandate',
                    'Disabled by Crimson Heart this hand'
                  )}
                </p>
              )}

              {onSell && (
                <button
                  type="button"
                  disabled={!canSell}
                  aria-label={
                    canSell
                      ? faceDown
                        ? t('gameplay.sellHidden', 'Sell hidden Decree')
                        : t('gameplay.sellNamed', 'Sell {{name}}', {
                            name: decreeName,
                          })
                      : t(
                          'gameplay.eternalCannotSellNamed',
                          '{{name}} is Eternal and cannot be sold',
                          { name: decreeName }
                        )
                  }
                  onClick={() => {
                    onSell()
                    closePopover()
                  }}
                  className="mt-3 min-h-11 w-full rounded-lg border border-amber-300/70 bg-amber-900/75 px-3 py-2 text-sm font-bold text-amber-50 shadow transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {canSell
                    ? faceDown
                      ? t('gameplay.sellHidden', 'Sell hidden Decree')
                      : t('gameplay.sellFor', 'Sell for ¥{{value}}', {
                          value: sellValue,
                        })
                    : t('gameplay.eternalCannotSell', 'Eternal · Cannot sell')}
                </button>
              )}
            </div>
          </animated.div>,
          document.body
        )}
    </>
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
        game-decree-card flex-shrink-0 w-16 h-20
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
    <div
      data-tutorial="decrees"
      className="flex gap-2 px-4 py-2 overflow-x-auto"
    >
      {/* Render owned decrees */}
      {decrees.map((decree) => (
        <DecreeCardCompact
          key={decree.id}
          decree={decree}
          onTap={() => onDecreeTap?.(decree)}
        />
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
