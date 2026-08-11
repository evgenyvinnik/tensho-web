/**
 * ShopItemCard Component
 *
 * Displays a single shop item (Decree, Fate Seal, or Celestial Orb) in the Tea House.
 * Features:
 * - Item name (English + Japanese)
 * - Rarity-colored border
 * - Edition visual effects (Foil/Holo/Poly/Negative)
 * - Sticker indicators (Eternal/Perishable/Rental)
 * - Cost with discount display
 * - Tap to view details, tap again to purchase
 *
 * Uses the game's color palette and React Spring for animations.
 */

import { useState, useCallback } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import { Decree, Sticker } from '../../systems/types'
import { EditionType } from '../../systems/PricingCalculator'
import { getCurrentLanguage } from '../../i18n'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'
import { Tile } from '../../core/Tile'

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

export interface ShopItemCardProps {
  /** The offering to display */
  offering: TeaHouseOffering
  /** Whether the player can afford this item */
  canAfford: boolean
  /** Callback when item is purchased */
  onPurchase: () => void
  /** Callback when item is selected for details */
  onSelect?: () => void
  /** Whether this item is currently selected */
  isSelected?: boolean
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get rarity border color based on decree rarity
 */
function getRarityBorderColor(rarity: string): string {
  switch (rarity) {
    case 'LocalEdict':
    case 'common':
      return '#A0A0A0' // Gray
    case 'RegionalMandate':
    case 'uncommon':
      return '#4CAF50' // Green
    case 'ImperialDecree':
    case 'rare':
      return '#2196F3' // Blue
    case 'HeavenlyOrdinance':
    case 'legendary':
    case 'mythic':
      return '#9C27B0' // Purple
    default:
      return '#A0A0A0'
  }
}

/**
 * Get rarity display name
 */
function getRarityDisplayName(rarity: string): string {
  switch (rarity) {
    case 'LocalEdict':
      return 'Common'
    case 'RegionalMandate':
      return 'Uncommon'
    case 'ImperialDecree':
      return 'Rare'
    case 'HeavenlyOrdinance':
      return 'Legendary'
    default:
      return rarity
  }
}

/**
 * Get item type icon
 */
function getItemTypeIcon(itemType: string): string {
  switch (itemType) {
    case 'Decree':
      return '\uD83D\uDCDC' // Scroll
    case 'FateSeal':
      return '\uD83D\uDD2E' // Crystal ball
    case 'CelestialOrb':
      return '\u2B50' // Star
    case 'VoidScript':
      return '\uD83C\uDF0C' // Milky Way
    case 'Tile':
      return '\uD83C\uDC04' // Mahjong tile
    default:
      return '\u2753' // Question mark
  }
}

/**
 * Get item type Japanese name
 */
function getItemTypeJapaneseName(itemType: string): string {
  switch (itemType) {
    case 'Decree':
      return '\u6CD5\u4EE4' // Decree
    case 'FateSeal':
      return '\u904B\u547D\u7B26' // Fate Seal
    case 'CelestialOrb':
      return '\u5929\u7403' // Celestial Orb
    case 'VoidScript':
      return '\u865A\u7A7A' // Void
    case 'Tile':
      return '\u724C' // Tile
    default:
      return ''
  }
}

/**
 * Get edition visual style
 */
function getEditionStyle(edition?: EditionType): React.CSSProperties {
  if (!edition) return {}

  switch (edition) {
    case 'Foil':
      return {
        background:
          'linear-gradient(135deg, rgba(192,192,192,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(192,192,192,0.3) 100%)',
        boxShadow: '0 0 10px rgba(192,192,192,0.5)',
      }
    case 'Holographic':
      return {
        background:
          'linear-gradient(135deg, rgba(255,0,0,0.15) 0%, rgba(255,127,0,0.15) 17%, rgba(255,255,0,0.15) 33%, rgba(0,255,0,0.15) 50%, rgba(0,0,255,0.15) 67%, rgba(75,0,130,0.15) 83%, rgba(148,0,211,0.15) 100%)',
        boxShadow: '0 0 15px rgba(148,0,211,0.4)',
      }
    case 'Polychrome':
      return {
        background:
          'linear-gradient(135deg, rgba(255,0,128,0.2) 0%, rgba(0,255,255,0.2) 50%, rgba(255,255,0,0.2) 100%)',
        boxShadow: '0 0 20px rgba(255,0,128,0.5)',
        animation: 'polychrome-shift 3s ease-in-out infinite',
      }
    case 'Negative':
      return {
        background:
          'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(60,60,60,0.3) 100%)',
        boxShadow:
          '0 0 15px rgba(0,0,0,0.7), inset 0 0 10px rgba(255,255,255,0.1)',
      }
    default:
      return {}
  }
}

/**
 * Get edition label
 */
function getEditionLabel(
  edition?: EditionType,
  showCJK: boolean = false
): string | null {
  if (!edition) return null

  switch (edition) {
    case 'Foil':
      return showCJK ? '\u7B94\u62BC' : 'Foil'
    case 'Holographic':
      return showCJK ? '\u8679\u5F69' : 'Holo'
    case 'Polychrome':
      return showCJK ? '\u6975\u5F69' : 'Poly'
    case 'Negative':
      return showCJK ? '\u9670' : 'Neg'
    default:
      return null
  }
}

// =============================================================================
// STICKER INDICATOR COMPONENT
// =============================================================================

interface StickerIndicatorProps {
  sticker: Sticker
}

function StickerIndicator({ sticker }: StickerIndicatorProps) {
  const getStyle = (): {
    bg: string
    text: string
    label: string
    japaneseLabel: string
  } => {
    switch (sticker.type) {
      case 'Eternal':
        return {
          bg: 'bg-blue-600',
          text: 'text-blue-100',
          label: 'Eternal',
          japaneseLabel: '\u6C38\u52AB',
        }
      case 'Perishable':
        return {
          bg: 'bg-orange-600',
          text: 'text-orange-100',
          label: `${sticker.roundsRemaining || 5}R`,
          japaneseLabel: '\u8150\u673D',
        }
      case 'Rental':
        return {
          bg: 'bg-yellow-600',
          text: 'text-yellow-100',
          label: `-${sticker.goldPerRound || 3}G/R`,
          japaneseLabel: '\u79DF\u501F',
        }
      default:
        return {
          bg: 'bg-gray-600',
          text: 'text-gray-100',
          label: '?',
          japaneseLabel: '',
        }
    }
  }

  const style = getStyle()

  return (
    <div
      className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold ${style.bg} ${style.text}`}
      title={`${sticker.type}: ${style.japaneseLabel}`}
    >
      {style.label}
    </div>
  )
}

// =============================================================================
// SHOP ITEM CARD COMPONENT
// =============================================================================

/**
 * ShopItemCard - Displays a purchasable item in the Tea House
 */
export function ShopItemCard({
  offering,
  canAfford,
  onPurchase,
  onSelect,
  isSelected = false,
}: ShopItemCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const showCJK = isCJKLanguage()

  // Extract item info based on type
  let name = ''
  let japaneseName = ''
  let description = ''
  let rarity = 'common'
  let sticker: Sticker | undefined
  let decreeId: string | undefined

  switch (offering.itemType) {
    case 'Decree': {
      const decree = offering.item as Decree
      name = decree.name
      japaneseName = '' // Would come from localization
      description = decree.description
      rarity = decree.rarity
      sticker = decree.sticker
      decreeId = decree.id
      break
    }
    case 'FateSeal':
      name = 'Fate Seal'
      japaneseName = showCJK ? '\u904B\u547D\u7B26' : ''
      description = 'A mystical seal that alters the current hand'
      rarity = 'uncommon'
      break
    case 'CelestialOrb':
      name = 'Celestial Orb'
      japaneseName = showCJK ? '\u5929\u7403' : ''
      description = 'Permanently upgrades a yaku family'
      rarity = 'uncommon'
      break
    case 'VoidScript': {
      const script = offering.item as {
        name: string
        description: string
        rarity: string
      }
      name = script.name
      description = script.description
      rarity = script.rarity.toLowerCase()
      break
    }
    case 'Tile': {
      const tile = offering.item as Tile
      name = tile.displayName
      description = tile.hasModifiers
        ? tile.modifierDisplay
        : 'Add this tile to the run wall'
      rarity = tile.hasModifiers ? 'uncommon' : 'common'
      break
    }
    default:
      name = 'Unknown'
      description = ''
  }

  const icon = getItemTypeIcon(offering.itemType)
  const rarityColor = getRarityBorderColor(rarity)
  const hasDiscount =
    offering.baseCost + offering.editionCost > offering.finalCost
  const editionStyle = getEditionStyle(offering.edition)
  const editionLabel = getEditionLabel(offering.edition, showCJK)

  // Animation spring
  const spring = useSpring({
    scale: isPressed ? 0.95 : isHovered ? 1.03 : 1,
    borderWidth: isSelected ? 4 : 2,
    config: { tension: 400, friction: 30 },
  })

  const handleClick = useCallback(() => {
    if (isSelected) {
      onPurchase()
    } else if (onSelect) {
      onSelect()
    } else {
      onPurchase()
    }
  }, [isSelected, onPurchase, onSelect])

  return (
    <AnimatedDiv
      className="relative min-w-0 w-full rounded-xl overflow-hidden cursor-pointer"
      style={{
        transform: spring.scale.to((s) => `scale(${s})`),
        borderWidth: spring.borderWidth.to((w) => `${w}px`),
        borderStyle: 'solid',
        borderColor: isSelected ? 'var(--color-golden-yellow)' : rarityColor,
        ...editionStyle,
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
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--color-dark-forest)]" />

      {/* Sticker indicator */}
      {sticker && <StickerIndicator sticker={sticker} />}

      {/* Content */}
      <div className="relative flex h-full min-h-[194px] flex-col p-3 sm:min-h-[210px]">
        {/* Icon and type */}
        <div className="text-center mb-2">
          {decreeId ? (
            <div className="flex justify-center">
              <DecreeUniqueIcon
                decreeId={decreeId}
                size={48}
                color={rarityColor}
              />
            </div>
          ) : (
            <span className="text-3xl">{icon}</span>
          )}
          {showCJK && (
            <p className="text-xs text-[var(--color-metallic-gold)] mt-1">
              {getItemTypeJapaneseName(offering.itemType)}
            </p>
          )}
        </div>

        {/* Name */}
        <h3 className="line-clamp-2 min-h-10 text-center text-sm font-bold leading-5 text-[var(--color-beige-white)]">
          {name}
        </h3>
        {japaneseName && (
          <p className="text-xs text-[var(--color-metallic-gold)] text-center">
            {japaneseName}
          </p>
        )}

        {/* Rarity */}
        <div className="flex items-center justify-center gap-1 mt-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: rarityColor }}
          />
          <span className="text-xs text-[var(--color-beige-white)] opacity-70">
            {getRarityDisplayName(rarity)}
          </span>
        </div>

        {/* Edition label */}
        {editionLabel && (
          <p className="text-xs text-blue-300 text-center mt-1 font-semibold">
            {editionLabel}
          </p>
        )}

        {/* Description */}
        <p className="text-xs text-[var(--color-beige-white)] opacity-60 text-center mt-2 line-clamp-2 flex-1">
          {description}
        </p>

        {/* Purchase button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPurchase()
          }}
          disabled={!canAfford}
          className={`
            mt-3 py-2 px-3 rounded-lg text-sm font-bold
            transition-all duration-200 w-full
            min-h-[44px]
            ${
              canAfford
                ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] hover:bg-[var(--color-deep-orange)] active:scale-95'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {hasDiscount && (
            <span className="line-through text-gray-400 mr-2 text-xs">
              {offering.baseCost + offering.editionCost}G
            </span>
          )}
          <span>{offering.finalCost}G</span>
        </button>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-4 border-[var(--color-golden-yellow)] rounded-xl pointer-events-none">
          <div className="absolute top-0 left-0 right-0 bg-[var(--color-golden-yellow)] text-[var(--color-dark-forest)] text-xs font-bold text-center py-0.5">
            Tap to Buy
          </div>
        </div>
      )}
    </AnimatedDiv>
  )
}

export default ShopItemCard
