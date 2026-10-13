/**
 * ShopHeader Component
 *
 * Top header for the Tea House shop screen displaying:
 * - Current gold amount
 * - Reroll button with cost
 * - Settings button
 *
 * Uses the game's color palette and maintains minimum touch targets.
 */

import { useCallback, useRef, useState, type ReactNode } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import { GoldIcon } from '../ui/GoldIcon'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import { ControlIcon } from '../ui/ControlIcon'

const AnimatedSpan = animated('span')

// =============================================================================
// TYPES
// =============================================================================

export interface ShopHeaderProps {
  /** Current gold amount */
  gold: number
  /** Current reroll cost */
  rerollCost: number
  /** Whether player can afford reroll */
  canAffordReroll: boolean
  /** Callback when reroll button is clicked */
  onReroll: () => void
  /** Callback when settings button is clicked */
  onSettings: () => void
  /** Number of rerolls this visit */
  rerollCount: number
  /** Compact run status (for example the save indicator). */
  status?: ReactNode
  /** Most interest Gold one round can pay, for the title's help. */
  interestCap: number
}

// =============================================================================
// GOLD DISPLAY COMPONENT
// =============================================================================

interface GoldDisplayProps {
  gold: number
}

function GoldDisplay({ gold }: GoldDisplayProps) {
  const { t, i18n } = useTranslation()
  const reduceMotion = useReducedMotion()
  const number = new Intl.NumberFormat(i18n.resolvedLanguage).format
  const spring = useSpring({
    number: gold,
    config: { tension: 300, friction: 30 },
    immediate: reduceMotion,
  })

  return (
    <div
      className="flex min-w-0 items-center gap-1 sm:gap-2"
      aria-label={t('shop.ui.goldBalance', { amount: number(gold) })}
    >
      <GoldIcon className="h-8 w-8 sm:h-9 sm:w-9" />
      <AnimatedSpan className="min-w-0 break-all text-xl font-bold leading-tight tabular-nums text-[var(--color-golden-yellow)] sm:text-2xl">
        {spring.number.to((n) => number(Math.floor(n)))}
      </AnimatedSpan>
    </div>
  )
}

// =============================================================================
// REROLL BUTTON COMPONENT
// =============================================================================

interface RerollButtonProps {
  cost: number
  canAfford: boolean
  onClick: () => void
  rerollCount: number
}

function RerollButton({
  cost,
  canAfford,
  onClick,
  rerollCount,
}: RerollButtonProps) {
  const { t, i18n } = useTranslation()
  const reduceMotion = useReducedMotion()

  const handleClick = useCallback(() => {
    if (canAfford) {
      onClick()
    }
  }, [canAfford, onClick])

  return (
    <button
      onClick={handleClick}
      disabled={!canAfford}
      className={`
        flex items-center gap-1 px-2 py-2 rounded-lg sm:gap-2 sm:px-4
        font-bold text-sm transition-all duration-200
        min-w-[76px] min-h-[44px] justify-center sm:min-w-[100px]
        border-2
        ${
          canAfford
            ? `bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] border-[var(--color-golden-yellow)] hover:bg-[var(--color-deep-orange)] ${reduceMotion ? '' : 'hover:scale-105 active:scale-95'}`
            : 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed opacity-60'
        }
      `}
      aria-label={t('shop.reroll')}
      aria-description={t('shop.rerollCost', {
        cost: cost.toLocaleString(i18n.resolvedLanguage),
      })}
    >
      <ControlIcon name="redraw" size={20} />
      <span className="inline-flex items-center gap-1">
        <GoldIcon className="h-4 w-4" />
        {cost.toLocaleString(i18n.resolvedLanguage)}
      </span>
      {rerollCount > 0 && (
        <span
          className="text-xs opacity-70"
          aria-label={t('shop.ui.rerollsUsed', { count: rerollCount })}
        >
          (+{rerollCount.toLocaleString(i18n.resolvedLanguage)})
        </span>
      )}
    </button>
  )
}

// =============================================================================
// SETTINGS BUTTON COMPONENT
// =============================================================================

interface SettingsButtonProps {
  onClick: () => void
}

function SettingsButton({ onClick }: SettingsButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onClick}
      className="
        p-2 rounded-lg
        bg-[var(--color-dark-forest)] hover:bg-[var(--color-forest-green)]
        text-[var(--color-beige-white)]
        min-w-[44px] min-h-[44px]
        flex items-center justify-center
        transition-colors duration-200
        border border-[var(--color-metallic-gold)]
      "
      aria-label={t('menu.settings')}
    >
      <ControlIcon name="settings" size={24} />
    </button>
  )
}

// =============================================================================
// TITLE WITH HELP
// =============================================================================

/**
 * "Tea House", centred. Tapping, hovering or focusing it explains what the
 * Tea House is and how its economy works.
 */
function TeaHouseTitle({ interestCap }: { interestCap: number }) {
  const { t, i18n } = useTranslation()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  // A click pins a hover-opened panel instead of closing it again.
  const pinned = useRef(false)
  const hoverClose = useRef<ReturnType<typeof setTimeout> | null>(null)
  const number = (value: number) =>
    value.toLocaleString(i18n.resolvedLanguage ?? i18n.language)
  const cancel = () => {
    if (hoverClose.current) clearTimeout(hoverClose.current)
    hoverClose.current = null
  }
  return (
    <>
      <h1 className="min-w-0 text-center">
        <button
          ref={anchorRef}
          type="button"
          data-tea-house-help
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            cancel()
            if (open && !pinned.current) {
              pinned.current = true
              return
            }
            pinned.current = !open
            setOpen(!open)
          }}
          onPointerEnter={(event) => {
            if (
              event.pointerType === 'mouse' &&
              window.matchMedia?.('(any-hover: hover)').matches
            ) {
              cancel()
              setOpen(true)
            }
          }}
          onPointerLeave={() => {
            cancel()
            if (pinned.current) return
            hoverClose.current = setTimeout(() => setOpen(false), 200)
          }}
          className="inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-lg px-2 font-decorative text-lg font-bold text-[var(--color-golden-yellow)] [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-amber-300 sm:text-2xl"
        >
          {t('shop.title', 'Tea House')}
          <span
            aria-hidden="true"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs"
          >
            ?
          </span>
        </button>
      </h1>
      <AnchoredPopover
        open={open}
        anchorRef={anchorRef}
        title={t('shop.title', 'Tea House')}
        onClose={() => {
          pinned.current = false
          setOpen(false)
        }}
        onPointerEnter={cancel}
        onPointerLeave={() => {
          hoverClose.current = setTimeout(() => setOpen(false), 200)
        }}
      >
        <div data-tea-house-explainer className="space-y-2 text-sm leading-relaxed">
          <p className="font-semibold">{t('shop.help.what')}</p>
          <p>{t('shop.help.buy')}</p>
          <p>
            {t('shop.help.interest', { cap: number(interestCap) })}
          </p>
          <p className="text-xs text-[var(--color-beige-white)]/70">
            {t('shop.help.cashOut')}
          </p>
        </div>
      </AnchoredPopover>
    </>
  )
}

// =============================================================================
// SHOP HEADER COMPONENT
// =============================================================================

/**
 * ShopHeader - Top bar for the Tea House shop
 */
export function ShopHeader({
  gold,
  rerollCost,
  canAffordReroll,
  onReroll,
  onSettings,
  rerollCount,
  status,
  interestCap,
}: ShopHeaderProps) {

  return (
    <header className="relative z-10 flex-shrink-0 border-b-2 border-[var(--color-saddle-brown)] bg-[var(--color-dark-forest)]/95 safe-area-top backdrop-blur-sm">
      <div className="screen-canvas grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 px-2 py-2 sm:gap-2 sm:px-5 sm:py-3">
        {/* Gold display */}
        <GoldDisplay gold={gold} />

        {/* Title, centred, with its explanation */}
        <TeaHouseTitle interestCap={interestCap} />

        {/* Actions */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-3">
          {status}
          <RerollButton
            cost={rerollCost}
            canAfford={canAffordReroll}
            onClick={onReroll}
            rerollCount={rerollCount}
          />
          <SettingsButton onClick={onSettings} />
        </div>
      </div>
    </header>
  )
}

export default ShopHeader
