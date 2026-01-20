/**
 * PackOpening Component for Tensho Mahjong Roguelike
 *
 * Displays the pack opening interface with:
 * - Pack opening animation
 * - Content display for selection
 * - Selection controls (confirm/skip)
 */

import React, { useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useSpring, animated, useTrail } from '@react-spring/web'
import { PackContent } from '../../systems/BlessingPackSystem'
import { PackType, PackSize } from '../../systems/types'
import {
  usePackStore,
  selectCanConfirm,
  selectCanSelectMore,
  selectRemainingSelections,
  getPackDisplayInfo,
  getPackJapaneseName,
  getPackIconColor,
} from '../../stores'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface PackOpeningProps {
  /** Callback when pack opening is complete with selected items */
  onComplete: (selectedItems: PackContent[]) => void
  /** Callback when pack is skipped */
  onSkip?: () => void
  /** Custom class name */
  className?: string
}

// =============================================================================
// PACK TYPE ICONS
// =============================================================================

const PACK_TYPE_ICONS: Record<PackType, string> = {
  Arcana: '🔮',
  Celestial: '🌟',
  Tile: '🀄',
  Decree: '📜',
  Void: '👻',
}

const CONTENT_TYPE_ICONS: Record<string, string> = {
  FateSeal: '🔮',
  CelestialOrb: '🌟',
  Tile: '🀄',
  Decree: '📜',
  VoidScript: '👻',
}

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-400 bg-gradient-to-b from-gray-500/20 to-gray-600/20',
  uncommon: 'border-green-500 bg-gradient-to-b from-green-500/20 to-green-600/20',
  rare: 'border-blue-500 bg-gradient-to-b from-blue-500/20 to-blue-600/20',
  legendary: 'border-purple-500 bg-gradient-to-b from-purple-500/20 to-purple-600/20',
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
}

// =============================================================================
// CONTENT CARD COMPONENT
// =============================================================================

interface ContentCardProps {
  content: PackContent
  index: number
  isSelected: boolean
  canSelect: boolean
  onSelect: (index: number) => void
  style?: React.CSSProperties
}

function ContentCard({
  content,
  index,
  isSelected,
  canSelect,
  onSelect,
  style,
}: ContentCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const springProps = useSpring({
    scale: isHovered ? 1.05 : 1,
    y: isSelected ? -8 : isHovered ? -4 : 0,
    config: { tension: 300, friction: 20 },
  })

  const handleClick = useCallback(() => {
    if (canSelect || isSelected) {
      onSelect(index)
    }
  }, [canSelect, isSelected, onSelect, index])

  const rarityClass = RARITY_COLORS[content.rarity] || RARITY_COLORS.common
  const rarityLabel = RARITY_LABELS[content.rarity] || 'Common'
  const contentIcon = CONTENT_TYPE_ICONS[content.type] || '📦'

  return (
    <animated.div
      className={`
        relative w-36 h-52 flex-shrink-0
        bg-[var(--color-dark-forest)] rounded-lg
        border-2 ${rarityClass}
        ${isSelected ? 'ring-2 ring-[var(--color-golden-yellow)] shadow-lg shadow-yellow-500/30' : ''}
        ${!canSelect && !isSelected ? 'opacity-60' : ''}
        cursor-pointer transition-shadow
        hover:shadow-lg
      `}
      style={{
        ...style,
        transform: springProps.scale.to(
          (s) => `scale(${s}) translateY(${springProps.y.get()}px)`
        ),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick()
        }
      }}
    >
      {/* Content type icon */}
      <div className="absolute top-2 left-2 text-2xl">
        {contentIcon}
      </div>

      {/* Rarity indicator */}
      <div className="absolute top-2 right-2">
        <span
          className={`text-xs font-bold px-1 rounded ${
            content.rarity === 'legendary'
              ? 'text-purple-300'
              : content.rarity === 'rare'
                ? 'text-blue-300'
                : content.rarity === 'uncommon'
                  ? 'text-green-300'
                  : 'text-gray-300'
          }`}
        >
          {rarityLabel}
        </span>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-10 h-10 bg-[var(--color-golden-yellow)] rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-[var(--color-dark-forest)]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Content details */}
      <div className="flex flex-col h-full pt-10 pb-3 px-3">
        {/* Name */}
        <p className="text-[var(--color-beige-white)] font-bold text-center text-sm line-clamp-2">
          {content.name}
        </p>

        {/* Description */}
        <p className="text-xs text-[var(--color-beige-white)] opacity-70 text-center mt-2 flex-1 line-clamp-4">
          {content.description}
        </p>

        {/* Content type label */}
        <div className="text-center mt-2">
          <span className="text-xs bg-[var(--color-forest-green)] text-[var(--color-beige-white)] px-2 py-0.5 rounded">
            {content.type === 'FateSeal' ? 'Fate Seal' :
             content.type === 'CelestialOrb' ? 'Celestial Orb' :
             content.type === 'VoidScript' ? 'Void Script' :
             content.type}
          </span>
        </div>
      </div>
    </animated.div>
  )
}

// =============================================================================
// PACK OPENING COMPONENT
// =============================================================================

export function PackOpening({
  onComplete,
  onSkip,
  className = '',
}: PackOpeningProps) {
  const {
    openingPack,
    selectContent,
    deselectContent,
    confirmSelection,
    skipSelection,
    closePackOpening,
  } = usePackStore()

  const canConfirm = usePackStore(selectCanConfirm)
  const canSelectMore = usePackStore(selectCanSelectMore)
  const remainingSelections = usePackStore(selectRemainingSelections)

  // Animation for pack opening
  const openingSpring = useSpring({
    opacity: openingPack?.phase === 'opening' ? 1 : openingPack ? 1 : 0,
    scale: openingPack?.phase === 'opening' ? 1.2 : 1,
    config: { tension: 200, friction: 20 },
  })

  // Trail animation for content cards
  const trail = useTrail(openingPack?.contents.length || 0, {
    from: { opacity: 0, y: 50 },
    to: {
      opacity: openingPack?.phase === 'selecting' || openingPack?.phase === 'confirmed' ? 1 : 0,
      y: openingPack?.phase === 'selecting' || openingPack?.phase === 'confirmed' ? 0 : 50,
    },
    config: { tension: 300, friction: 20 },
  })

  // Pack display info
  const packInfo = useMemo(() => {
    if (!openingPack) return null
    return {
      ...getPackDisplayInfo(openingPack.pack),
      japaneseName: getPackJapaneseName(openingPack.pack),
      iconColor: getPackIconColor(openingPack.pack.type),
      icon: PACK_TYPE_ICONS[openingPack.pack.type],
    }
  }, [openingPack])

  // Handle content selection toggle
  const handleSelect = useCallback((index: number) => {
    if (!openingPack) return

    if (openingPack.selectedIndices.includes(index)) {
      deselectContent(index)
    } else {
      selectContent(index)
    }
  }, [openingPack, selectContent, deselectContent])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    const selected = confirmSelection()
    onComplete(selected)
    setTimeout(() => {
      closePackOpening()
    }, 500)
  }, [confirmSelection, onComplete, closePackOpening])

  // Handle skip
  const handleSkip = useCallback(() => {
    skipSelection()
    onSkip?.()
    setTimeout(() => {
      closePackOpening()
    }, 300)
  }, [skipSelection, onSkip, closePackOpening])

  // Don't render if no pack is being opened
  if (!openingPack || !packInfo) {
    return null
  }

  const isSelecting = openingPack.phase === 'selecting'
  const isConfirmed = openingPack.phase === 'confirmed'
  const isSkipped = openingPack.phase === 'skipped'

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 ${className}`}
    >
      <animated.div
        className="relative max-w-[95vw] max-h-[90vh] p-8 rounded-2xl
                   bg-[var(--color-dark-forest)] border-4 border-[var(--color-saddle-brown)]
                   shadow-2xl overflow-hidden"
        style={{
          opacity: openingSpring.opacity,
        }}
      >
        {/* Pack header */}
        <div className="text-center mb-6">
          <animated.div
            className="text-6xl mb-2"
            style={{
              transform: openingSpring.scale.to((s) => `scale(${s})`),
            }}
          >
            {packInfo.icon}
          </animated.div>
          <h2 className="text-2xl font-bold text-[var(--color-golden-yellow)] font-decorative">
            {packInfo.fullName}
          </h2>
          <p className="text-sm text-[var(--color-metallic-gold)]">
            {packInfo.japaneseName}
          </p>
          <p className="text-sm text-[var(--color-beige-white)] mt-1">
            {packInfo.choiceText}
          </p>
        </div>

        {/* Content grid */}
        {(isSelecting || isConfirmed) && (
          <div className="flex flex-wrap justify-center gap-4 mb-6 max-w-4xl">
            {trail.map((style, index) => (
              <animated.div key={openingPack.contents[index].id} style={style}>
                <ContentCard
                  content={openingPack.contents[index]}
                  index={index}
                  isSelected={openingPack.selectedIndices.includes(index)}
                  canSelect={canSelectMore}
                  onSelect={handleSelect}
                />
              </animated.div>
            ))}
          </div>
        )}

        {/* Selection status */}
        {isSelecting && (
          <div className="text-center mb-4">
            <p className="text-[var(--color-beige-white)]">
              {openingPack.selectedIndices.length > 0 ? (
                <>
                  Selected: <span className="text-[var(--color-golden-yellow)] font-bold">
                    {openingPack.selectedIndices.length}
                  </span>
                  {remainingSelections > 0 && (
                    <span className="text-[var(--color-metallic-gold)]">
                      {' '}(can select {remainingSelections} more)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[var(--color-metallic-gold)]">
                  Select up to {openingPack.maxSelections} item{openingPack.maxSelections > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Confirmed state */}
        {isConfirmed && (
          <div className="text-center mb-4">
            <p className="text-[var(--color-golden-yellow)] font-bold text-lg">
              Selection Confirmed!
            </p>
          </div>
        )}

        {/* Skipped state */}
        {isSkipped && (
          <div className="text-center mb-4">
            <p className="text-[var(--color-metallic-gold)] font-bold text-lg">
              Pack Skipped
            </p>
          </div>
        )}

        {/* Action buttons */}
        {isSelecting && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-[var(--color-forest-green)] hover:bg-[var(--color-dark-forest)]
                       text-[var(--color-beige-white)] font-bold rounded-lg
                       border-2 border-[var(--color-metallic-gold)]
                       transition-all hover:scale-105 active:scale-95
                       min-w-[120px]"
            >
              Skip
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`px-6 py-3 font-bold rounded-lg
                       border-2 transition-all min-w-[120px]
                       ${canConfirm
                         ? 'bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)] text-[var(--color-beige-white)] border-[var(--color-golden-yellow)] hover:scale-105 active:scale-95'
                         : 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed'
                       }`}
            >
              Confirm
            </button>
          </div>
        )}
      </animated.div>
    </div>,
    document.body
  )
}

// =============================================================================
// PACK CARD (FOR SHOP DISPLAY)
// =============================================================================

export interface PackCardProps {
  packType: PackType
  packSize: PackSize
  cost: number
  discountedCost: number
  canAfford: boolean
  isPurchased: boolean
  onPurchase: () => void
  className?: string
}

export function PackCard({
  packType,
  packSize,
  cost,
  discountedCost,
  canAfford,
  isPurchased,
  onPurchase,
  className = '',
}: PackCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const springProps = useSpring({
    scale: isHovered && !isPurchased ? 1.05 : 1,
    y: isHovered && !isPurchased ? -4 : 0,
    config: { tension: 300, friction: 20 },
  })

  const icon = PACK_TYPE_ICONS[packType]
  const iconColor = getPackIconColor(packType)

  const sizeLabels: Record<PackSize, string> = {
    Normal: 'Normal',
    Jumbo: 'Jumbo',
    Mega: 'Mega',
  }

  const typeLabels: Record<PackType, string> = {
    Arcana: 'Arcana',
    Celestial: 'Celestial',
    Tile: 'Tile',
    Decree: 'Decree',
    Void: 'Void',
  }

  const sizeDescriptions: Record<PackSize, string> = {
    Normal: 'Choose 1 of 3',
    Jumbo: 'Choose 1 of 5',
    Mega: 'Choose 2 of 5',
  }

  const hasDiscount = discountedCost < cost

  return (
    <animated.div
      className={`
        relative w-32 h-44 flex-shrink-0
        bg-[var(--color-dark-forest)] rounded-lg
        border-2 border-[var(--color-saddle-brown)]
        ${isPurchased ? 'opacity-50 grayscale' : ''}
        ${!canAfford && !isPurchased ? 'opacity-70' : ''}
        cursor-pointer transition-shadow
        hover:shadow-lg hover:border-[var(--color-metallic-gold)]
        ${className}
      `}
      style={{
        transform: springProps.scale.to(
          (s) => `scale(${s}) translateY(${springProps.y.get()}px)`
        ),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isPurchased && canAfford && onPurchase()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isPurchased && canAfford) {
          onPurchase()
        }
      }}
    >
      {/* Pack icon */}
      <div
        className="text-4xl text-center mt-3"
        style={{ textShadow: `0 0 10px ${iconColor}` }}
      >
        {icon}
      </div>

      {/* Pack info */}
      <div className="flex flex-col h-[calc(100%-50px)] px-2 pb-2">
        <p className="text-[var(--color-beige-white)] font-bold text-center text-xs mt-1">
          {sizeLabels[packSize]}
        </p>
        <p className="text-[var(--color-golden-yellow)] font-bold text-center text-sm">
          {typeLabels[packType]}
        </p>
        <p className="text-[var(--color-metallic-gold)] text-center text-xs mt-1">
          {sizeDescriptions[packSize]}
        </p>

        {/* Price / Purchased state */}
        <div className="mt-auto">
          {isPurchased ? (
            <div className="text-center py-1">
              <span className="text-xs text-gray-400">Purchased</span>
            </div>
          ) : (
            <button
              disabled={!canAfford}
              className={`w-full py-1 rounded text-xs font-bold transition-colors ${
                canAfford
                  ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] hover:opacity-90'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {hasDiscount ? (
                <>
                  <span className="line-through opacity-60">{cost}</span>
                  {' '}
                  <span className="text-[var(--color-golden-yellow)]">{discountedCost}</span>
                </>
              ) : (
                `${discountedCost}`
              )} Gold
            </button>
          )}
        </div>
      </div>

      {/* Size badge */}
      <div className="absolute top-1 right-1">
        <span
          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            packSize === 'Mega'
              ? 'bg-purple-500/30 text-purple-300'
              : packSize === 'Jumbo'
                ? 'bg-blue-500/30 text-blue-300'
                : 'bg-gray-500/30 text-gray-300'
          }`}
        >
          {packSize === 'Mega' ? 'M' : packSize === 'Jumbo' ? 'J' : 'N'}
        </span>
      </div>
    </animated.div>
  )
}

export default PackOpening
