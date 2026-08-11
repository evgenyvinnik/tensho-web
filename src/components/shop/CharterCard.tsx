/**
 * CharterCard Component
 *
 * Displays an Imperial Charter (voucher-style permanent upgrade) in the Tea House.
 * Features:
 * - Charter name and Japanese name
 * - Effect description
 * - Upgraded badge for tier 2 charters
 * - Premium visual styling
 *
 * Imperial Charters only appear after boss rounds.
 */

import { useState, useCallback } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import { ImperialCharter } from '../../systems/types'
import { useItemText } from '../../i18n/useItemText'

const AnimatedDiv = animated('div')

// =============================================================================
// TYPES
// =============================================================================

export interface CharterCardProps {
  /** The charter to display */
  charter: ImperialCharter
  /** Final cost after discounts */
  finalCost: number
  /** Whether player can afford this charter */
  canAfford: boolean
  /** Callback when charter is purchased */
  onPurchase: () => void
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get charter effect icon based on effect type
 */
function getEffectIcon(effectType: string): string {
  switch (effectType) {
    case 'shop_slots':
      return '\uD83C\uDFEA' // Store
    case 'discount':
      return '\uD83D\uDCB0' // Money bag
    case 'reroll_discount':
      return '\uD83C\uDFB2' // Dice
    case 'hands':
      return '\u270B' // Hand
    case 'discards':
      return '\uD83D\uDDD1' // Trash
    case 'interest_cap':
      return '\uD83D\uDCB8' // Money with wings
    case 'seal_weight':
      return '\uD83D\uDD2E' // Crystal ball
    case 'orb_weight':
      return '\u2B50' // Star
    default:
      return '\uD83D\uDCDC' // Scroll
  }
}

/**
 * Get Japanese name for charter effect type
 */
function getEffectJapaneseName(effectType: string): string {
  switch (effectType) {
    case 'shop_slots':
      return '\u5546\u54C1\u67A0' // Shop slots
    case 'discount':
      return '\u5272\u5F15' // Discount
    case 'reroll_discount':
      return '\u518D\u632F' // Reroll
    case 'hands':
      return '\u624B\u724C' // Hands
    case 'discards':
      return '\u6368\u724C' // Discards
    case 'interest_cap':
      return '\u5229\u5B50' // Interest
    case 'seal_weight':
      return '\u7B26\u5370' // Seals
    case 'orb_weight':
      return '\u5929\u7403' // Orbs
    default:
      return '\u52B9\u679C' // Effect
  }
}

// =============================================================================
// CHARTER CARD COMPONENT
// =============================================================================

/**
 * CharterCard - Displays an Imperial Charter for purchase
 */
export function CharterCard({
  charter,
  finalCost,
  canAfford,
  onPurchase,
}: CharterCardProps) {
  const { t } = useTranslation()
  const itemText = useItemText()
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const effectIcon = getEffectIcon(charter.effect.type)
  const effectJapaneseName = getEffectJapaneseName(charter.effect.type)

  // Animation spring
  const spring = useSpring({
    scale: isPressed ? 0.98 : isHovered ? 1.02 : 1,
    brightness: isHovered ? 1.1 : 1,
    config: { tension: 400, friction: 30 },
  })

  const handleClick = useCallback(() => {
    if (canAfford) {
      onPurchase()
    }
  }, [canAfford, onPurchase])

  return (
    <AnimatedDiv
      className="relative w-full rounded-xl overflow-hidden cursor-pointer"
      style={{
        transform: spring.scale.to((s) => `scale(${s})`),
        filter: spring.brightness.to((b) => `brightness(${b})`),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPressed(false)
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onClick={handleClick}
    >
      {/* Background with premium styling */}
      <div
        className="absolute inset-0"
        style={{
          background: charter.isUpgraded
            ? 'linear-gradient(135deg, #2D5F4A 0%, #1C3A2E 50%, #FFD70020 100%)'
            : 'linear-gradient(135deg, #2D5F4A 0%, #1C3A2E 100%)',
          borderWidth: '3px',
          borderStyle: 'solid',
          borderColor: charter.isUpgraded ? '#FFD700' : '#C8B273',
          borderRadius: '0.75rem',
        }}
      />

      {/* Decorative pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent 0px, transparent 10px, rgba(255,215,79,0.1) 10px, rgba(255,215,79,0.1) 11px)',
        }}
      />

      {/* Upgraded badge */}
      {charter.isUpgraded && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[var(--color-golden-yellow)] text-[var(--color-dark-forest)] text-xs font-bold flex items-center gap-1">
          <span>\u2B06</span>
          <span>{t('shop.upgraded', 'Upgraded')}</span>
        </div>
      )}

      {/* Content */}
      <div className="relative p-4">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap sm:gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-[var(--color-dark-forest)] border-2 border-[var(--color-metallic-gold)] flex items-center justify-center">
            <span className="text-3xl">{effectIcon}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-[var(--color-golden-yellow)] truncate">
                {itemText.name('charters', charter)}
              </h3>
            </div>

            {/* Japanese subtitle */}
            <p className="text-sm text-[var(--color-metallic-gold)]">
              \u7687\u52C5 \u2022 {effectJapaneseName}
            </p>

            {/* Description */}
            <p className="text-sm text-[var(--color-beige-white)] opacity-80 mt-2">
              {itemText.description('charters', charter)}
            </p>
          </div>

          {/* Purchase button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
            disabled={!canAfford}
            className={`
              order-last w-full flex-shrink-0 px-6 py-3 rounded-lg font-bold text-lg sm:order-none sm:w-auto
              transition-all duration-200
              min-w-[100px] min-h-[48px]
              ${
                canAfford
                  ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] hover:bg-[var(--color-deep-orange)] active:scale-95 border-2 border-[var(--color-golden-yellow)]'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed border-2 border-gray-500'
              }
            `}
          >
            {finalCost}G
          </button>
        </div>

        {/* Effect type indicator */}
        <div className="mt-3 pt-3 border-t border-[var(--color-metallic-gold)] border-opacity-30 flex items-center justify-between">
          <span className="text-xs text-[var(--color-beige-white)] opacity-60">
            {t('shop.imperialCharter', 'Imperial Charter')}
          </span>
          <span className="text-xs text-[var(--color-metallic-gold)]">
            {charter.isUpgraded
              ? '\u7D1A\u4E0A\u3052\u7248'
              : '\u57FA\u672C\u7248'}
          </span>
        </div>
      </div>

      {/* Hover glow effect */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            boxShadow: charter.isUpgraded
              ? '0 0 30px rgba(255, 215, 79, 0.3), inset 0 0 20px rgba(255, 215, 79, 0.1)'
              : '0 0 20px rgba(200, 178, 115, 0.2), inset 0 0 15px rgba(200, 178, 115, 0.05)',
          }}
        />
      )}
    </AnimatedDiv>
  )
}

export default CharterCard
