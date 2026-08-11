/**
 * PackCard Component
 *
 * Displays a Blessing Pack in the Tea House shop.
 * Features:
 * - Pack type with icon and color
 * - Pack size (Normal/Jumbo/Mega)
 * - Choice count display
 * - Japanese names
 * - Visual feedback for hover/press
 *
 * Uses the game's color palette and React Spring for animations.
 */

import { useState, useCallback } from 'react'
import { useSpring, animated, to } from '@react-spring/web'
import { BlessingPack, PackType, PackSize } from '../../systems/types'
import {
  PACK_TYPE_DEFINITIONS,
  PACK_SIZE_DEFINITIONS,
} from '../../config/packDefinitions'
import { getCurrentLanguage } from '../../i18n'

const AnimatedDiv = animated('div')

/** Check if current language uses CJK characters */
function isCJKLanguage(): boolean {
  const lang = getCurrentLanguage()
  return (
    lang === 'ja' || lang === 'ko' || lang === 'zh-Hant' || lang === 'zh-Hans'
  )
}

// =============================================================================
// TYPES
// =============================================================================

export interface PackCardProps {
  /** The pack to display */
  pack: BlessingPack
  /** Final cost after discounts */
  finalCost: number
  /** Whether player can afford this pack */
  canAfford: boolean
  /** Callback when pack is purchased */
  onPurchase: () => void
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get pack type icon
 */
function getPackTypeIcon(type: PackType): string {
  switch (type) {
    case 'Arcana':
      return '\uD83D\uDD2E' // Crystal ball
    case 'Celestial':
      return '\u2B50' // Star
    case 'Tile':
      return '\uD83C\uDC04' // Mahjong tile
    case 'Decree':
      return '\uD83D\uDCDC' // Scroll
    case 'Void':
      return '\uD83C\uDF11' // New moon
    default:
      return '\uD83C\uDF81' // Gift
  }
}

/**
 * Get pack size visual indicator
 */
function getPackSizeIndicator(
  size: PackSize,
  showCJK: boolean
): { scale: number; label: string } {
  switch (size) {
    case 'Normal':
      return { scale: 1, label: '' }
    case 'Jumbo':
      return { scale: 1.15, label: showCJK ? '\u5927' : 'L' } // Large
    case 'Mega':
      return { scale: 1.3, label: showCJK ? '\u7279\u5927' : 'XL' } // Extra Large
    default:
      return { scale: 1, label: '' }
  }
}

/**
 * Get pack background gradient based on type
 */
function getPackGradient(type: PackType): string {
  const baseColor = PACK_TYPE_DEFINITIONS[type]?.iconColor || '#2D5F4A'

  switch (type) {
    case 'Arcana':
      return `linear-gradient(135deg, ${baseColor}40 0%, #1C3A2E 100%)`
    case 'Celestial':
      return `linear-gradient(135deg, ${baseColor}40 0%, #1C3A2E 100%)`
    case 'Tile':
      return `linear-gradient(135deg, #8B4513 0%, #1C3A2E 100%)`
    case 'Decree':
      return `linear-gradient(135deg, ${baseColor}40 0%, #1C3A2E 100%)`
    case 'Void':
      return `linear-gradient(135deg, #000000 0%, #1C3A2E 100%)`
    default:
      return `linear-gradient(135deg, #2D5F4A 0%, #1C3A2E 100%)`
  }
}

// =============================================================================
// PACK CARD COMPONENT
// =============================================================================

/**
 * PackCard - Displays a purchasable blessing pack
 */
export function PackCard({
  pack,
  finalCost,
  canAfford,
  onPurchase,
}: PackCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const showCJK = isCJKLanguage()
  const typeInfo = PACK_TYPE_DEFINITIONS[pack.type]
  const sizeInfo = PACK_SIZE_DEFINITIONS[pack.size]
  const icon = getPackTypeIcon(pack.type)
  const sizeIndicator = getPackSizeIndicator(pack.size, showCJK)
  const gradient = getPackGradient(pack.type)

  // Animation spring
  const spring = useSpring({
    scale: isPressed ? 0.95 : isHovered ? 1.05 : 1,
    rotateY: isHovered ? 5 : 0,
    config: { tension: 400, friction: 30 },
  })

  // Icon spring for size emphasis
  const iconSpring = useSpring({
    scale: sizeIndicator.scale * (isHovered ? 1.1 : 1),
    config: { tension: 300, friction: 20 },
  })

  const handleClick = useCallback(() => {
    if (canAfford) {
      onPurchase()
    }
  }, [canAfford, onPurchase])

  return (
    <AnimatedDiv
      className="relative min-w-0 w-full rounded-xl overflow-hidden cursor-pointer"
      style={{
        transform: to(
          [spring.scale, spring.rotateY],
          (scale, rotateY) =>
            `perspective(500px) rotateY(${rotateY}deg) scale(${scale})`
        ),
        background: gradient,
        border: `2px solid ${typeInfo?.iconColor || '#C8B273'}`,
        boxShadow: isHovered
          ? `0 8px 20px rgba(0, 0, 0, 0.4), 0 0 15px ${typeInfo?.iconColor}40`
          : '0 4px 10px rgba(0, 0, 0, 0.3)',
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
      {/* Size badge for Jumbo/Mega */}
      {pack.size !== 'Normal' && (
        <div
          className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold text-white"
          style={{ backgroundColor: typeInfo?.iconColor || '#FFD700' }}
        >
          {sizeIndicator.label}
        </div>
      )}

      {/* Content */}
      <div className="flex min-h-[184px] flex-col items-center p-3">
        {/* Icon */}
        <animated.div
          className="text-4xl mb-2"
          style={{
            transform: iconSpring.scale.to((s) => `scale(${s})`),
          }}
        >
          {icon}
        </animated.div>

        {/* Pack size */}
        <p className="text-sm font-bold text-[var(--color-beige-white)]">
          {sizeInfo?.name || pack.size}
        </p>

        {/* Pack type */}
        <p
          className="text-xs font-semibold text-center"
          style={{ color: typeInfo?.iconColor || '#FFD54F' }}
        >
          {typeInfo?.name || pack.type}
        </p>

        {/* Japanese name - only show for CJK languages */}
        {showCJK && typeInfo?.japaneseName && (
          <p className="text-xs text-[var(--color-metallic-gold)] mt-1">
            {typeInfo.japaneseName}
          </p>
        )}

        {/* Choice info */}
        <p className="text-xs text-[var(--color-beige-white)] opacity-60 text-center mt-2">
          {pack.selectCount === 1
            ? `Pick 1 of ${pack.choiceCount}`
            : `Pick ${pack.selectCount} of ${pack.choiceCount}`}
        </p>

        {/* Purchase button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
          disabled={!canAfford}
          className={`
            mt-auto pt-2 w-full py-2 rounded-lg text-sm font-bold
            transition-all duration-200
            min-h-[44px]
            ${
              canAfford
                ? 'bg-[var(--color-golden-yellow)] text-[var(--color-dark-forest)] hover:bg-[var(--color-vibrant-orange)] hover:text-[var(--color-beige-white)] active:scale-95'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {finalCost}G
        </button>
      </div>

      {/* Decorative shimmer effect */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}
    </AnimatedDiv>
  )
}

export default PackCard
