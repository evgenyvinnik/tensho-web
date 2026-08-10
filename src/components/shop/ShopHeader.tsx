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

import { useCallback } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useTranslation } from 'react-i18next'

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
}

// =============================================================================
// GOLD DISPLAY COMPONENT
// =============================================================================

interface GoldDisplayProps {
  gold: number
}

function GoldDisplay({ gold }: GoldDisplayProps) {
  const spring = useSpring({
    number: gold,
    config: { tension: 300, friction: 30 },
  })

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <span className="text-xl sm:text-2xl" role="img" aria-label="gold">
        &#x5186;
      </span>
      <AnimatedSpan className="text-xl font-bold text-[var(--color-golden-yellow)] sm:text-2xl">
        {spring.number.to((n) => Math.floor(n).toLocaleString())}
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

function RerollButton({ cost, canAfford, onClick, rerollCount }: RerollButtonProps) {
  const { t } = useTranslation()

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
            ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] border-[var(--color-golden-yellow)] hover:bg-[var(--color-deep-orange)] hover:scale-105 active:scale-95'
            : 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed opacity-60'
        }
      `}
      aria-label={t('shop.reroll')}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span>{cost}G</span>
      {rerollCount > 0 && (
        <span className="text-xs opacity-70">(+{rerollCount})</span>
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
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
      </svg>
    </button>
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
}: ShopHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="flex items-center justify-between gap-2 border-b-2 border-[var(--color-saddle-brown)] bg-[var(--color-dark-forest)] px-2 py-3 sm:px-4">
      {/* Gold display */}
      <GoldDisplay gold={gold} />

      {/* Title */}
      <h1 className="whitespace-nowrap text-base font-bold tracking-wide text-[var(--color-beige-white)] font-decorative sm:text-xl">
        {t('shop.title', 'Tea House')}
        <span className="ml-2 hidden text-lg text-[var(--color-metallic-gold)] sm:inline">&#x8336;&#x5BE5;</span>
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <RerollButton
          cost={rerollCost}
          canAfford={canAffordReroll}
          onClick={onReroll}
          rerollCount={rerollCount}
        />
        <SettingsButton onClick={onSettings} />
      </div>
    </header>
  )
}

export default ShopHeader
