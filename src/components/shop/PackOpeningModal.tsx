/**
 * PackOpeningModal Component
 *
 * Modal overlay for opening Blessing Packs.
 * Features:
 * - Animated pack opening sequence
 * - Display all available choices with selection
 * - Allow picking 1 (Normal/Jumbo) or 2 (Mega) items
 * - Skip option for synergy decrees
 * - Rarity-based styling for each item
 *
 * Uses React Spring for animations and the game's color palette.
 */

import { useState, useCallback, useEffect } from 'react'
import { useSpring, useSprings, animated } from '@react-spring/web'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { PackContent, PackOffering } from '../../systems/BlessingPackSystem'
import { PACK_TYPE_DEFINITIONS, PACK_SIZE_DEFINITIONS } from '../../config/packDefinitions'

const AnimatedDiv = animated('div')

// =============================================================================
// TYPES
// =============================================================================

export interface PackOpeningModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** The pack offering being opened */
  packOffering: PackOffering | null
  /** Callback when selection is confirmed */
  onConfirm: (selectedIndices: number[]) => void
  /** Callback when pack is skipped */
  onSkip: () => void
  /** Callback to close modal */
  onClose: () => void
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get rarity color for content items
 */
function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common':
      return '#A0A0A0' // Gray
    case 'uncommon':
      return '#4CAF50' // Green
    case 'rare':
      return '#2196F3' // Blue
    case 'legendary':
      return '#9C27B0' // Purple
    default:
      return '#A0A0A0'
  }
}

/**
 * Get content type icon
 */
function getContentTypeIcon(type: string): string {
  switch (type) {
    case 'FateSeal':
      return '\uD83D\uDD2E' // Crystal ball
    case 'CelestialOrb':
      return '\u2B50' // Star
    case 'Tile':
      return '\uD83C\uDC04' // Mahjong tile
    case 'Decree':
      return '\uD83D\uDCDC' // Scroll
    case 'VoidScript':
      return '\uD83C\uDF11' // New moon
    default:
      return '\u2753' // Question mark
  }
}

/**
 * Get rarity glow style
 */
function getRarityGlow(rarity: string): string {
  switch (rarity) {
    case 'legendary':
      return '0 0 20px rgba(156, 39, 176, 0.6), 0 0 40px rgba(156, 39, 176, 0.3)'
    case 'rare':
      return '0 0 15px rgba(33, 150, 243, 0.5), 0 0 30px rgba(33, 150, 243, 0.2)'
    case 'uncommon':
      return '0 0 10px rgba(76, 175, 80, 0.4)'
    default:
      return 'none'
  }
}

// =============================================================================
// PACK CONTENT CARD COMPONENT
// =============================================================================

interface PackContentCardProps {
  content: PackContent
  index: number
  isSelected: boolean
  canSelect: boolean
  onToggle: () => void
  animationDelay: number
}

function PackContentCard({
  content,
  index,
  isSelected,
  canSelect,
  onToggle,
  animationDelay,
}: PackContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const rarityColor = getRarityColor(content.rarity)
  const icon = getContentTypeIcon(content.type)
  const glow = getRarityGlow(content.rarity)

  // Entry animation
  const entrySpring = useSpring({
    from: { opacity: 0, scale: 0.5, y: 50 },
    to: { opacity: 1, scale: 1, y: 0 },
    delay: animationDelay,
    config: { tension: 300, friction: 20 },
  })

  // Interaction animation
  const interactionSpring = useSpring({
    scale: isSelected ? 1.05 : isHovered ? 1.02 : 1,
    borderWidth: isSelected ? 4 : 2,
    config: { tension: 400, friction: 30 },
  })

  return (
    <AnimatedDiv
      className={`
        relative w-full max-w-[140px] rounded-xl overflow-hidden
        ${canSelect || isSelected ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
      `}
      style={{
        opacity: entrySpring.opacity,
        transform: entrySpring.scale.to(
          (s) =>
            `scale(${s * interactionSpring.scale.get()}) translateY(${entrySpring.y.get()}px)`
        ),
        borderWidth: interactionSpring.borderWidth.to((w) => `${w}px`),
        borderStyle: 'solid',
        borderColor: isSelected ? 'var(--color-golden-yellow)' : rarityColor,
        boxShadow: isSelected ? `0 0 25px rgba(255, 215, 79, 0.5), ${glow}` : glow,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => (canSelect || isSelected) && onToggle()}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--color-dark-forest)]" />

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[var(--color-golden-yellow)] flex items-center justify-center z-10">
          <svg className="w-4 h-4 text-[var(--color-dark-forest)]" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="relative p-3 flex flex-col items-center min-h-[160px]">
        {/* Icon */}
        <div className="text-3xl mb-2">{icon}</div>

        {/* Rarity indicator */}
        <div className="flex items-center gap-1 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rarityColor }} />
          <span className="text-xs capitalize" style={{ color: rarityColor }}>
            {content.rarity}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold text-[var(--color-beige-white)] text-center line-clamp-2">
          {content.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-[var(--color-beige-white)] opacity-60 text-center mt-2 line-clamp-3 flex-1">
          {content.description}
        </p>
      </div>
    </AnimatedDiv>
  )
}

// =============================================================================
// PACK OPENING MODAL COMPONENT
// =============================================================================

/**
 * PackOpeningModal - Modal for opening blessing packs
 */
export function PackOpeningModal({
  isOpen,
  packOffering,
  onConfirm,
  onSkip,
  onClose,
}: PackOpeningModalProps) {
  const { t } = useTranslation()
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [isRevealed, setIsRevealed] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && packOffering) {
      setSelectedIndices([])
      setIsRevealed(false)

      // Reveal animation delay
      const timer = setTimeout(() => {
        setIsRevealed(true)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isOpen, packOffering])

  // Backdrop animation
  const backdropSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { tension: 300, friction: 30 },
  })

  // Modal animation
  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.9,
    config: { tension: 300, friction: 25 },
  })

  const handleToggleSelection = useCallback(
    (index: number) => {
      if (!packOffering) return

      setSelectedIndices((prev) => {
        if (prev.includes(index)) {
          // Deselect
          return prev.filter((i) => i !== index)
        } else {
          // Check if can select more
          if (prev.length < packOffering.maxSelections) {
            return [...prev, index]
          }
          // Replace the first selection if at max
          return [...prev.slice(1), index]
        }
      })
    },
    [packOffering]
  )

  const handleConfirm = useCallback(() => {
    if (selectedIndices.length > 0) {
      onConfirm(selectedIndices)
    }
  }, [selectedIndices, onConfirm])

  if (!isOpen || !packOffering) return null

  const pack = packOffering.pack
  const typeInfo = PACK_TYPE_DEFINITIONS[pack.type]
  const sizeInfo = PACK_SIZE_DEFINITIONS[pack.size]
  const maxSelections = packOffering.maxSelections

  return createPortal(
    <AnimatedDiv
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        opacity: backdropSpring.opacity,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <AnimatedDiv
        className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
        style={{
          opacity: modalSpring.opacity,
          transform: modalSpring.scale.to((s) => `scale(${s})`),
          background: 'linear-gradient(135deg, #1C3A2E 0%, #0D1F17 100%)',
          border: `3px solid ${typeInfo?.iconColor || '#C8B273'}`,
          boxShadow: `0 0 50px ${typeInfo?.iconColor}40, 0 25px 50px rgba(0, 0, 0, 0.5)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-metallic-gold)] border-opacity-30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative">
                {sizeInfo?.name} {typeInfo?.name}
              </h2>
              <p className="text-sm text-[var(--color-metallic-gold)]">
                {typeInfo?.japaneseName} \u2022 {sizeInfo?.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-forest-green)] text-[var(--color-beige-white)] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content grid */}
        <div className="p-6">
          <div className="flex flex-wrap justify-center gap-4">
            {packOffering.contents.map((content, index) => (
              <PackContentCard
                key={content.id}
                content={content}
                index={index}
                isSelected={selectedIndices.includes(index)}
                canSelect={selectedIndices.length < maxSelections || selectedIndices.includes(index)}
                onToggle={() => handleToggleSelection(index)}
                animationDelay={isRevealed ? 100 + index * 100 : 0}
              />
            ))}
          </div>

          {/* Selection indicator */}
          <div className="mt-4 text-center">
            <p className="text-sm text-[var(--color-beige-white)]">
              {selectedIndices.length} / {maxSelections} selected
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-metallic-gold)] border-opacity-30 flex items-center justify-between gap-4">
          {/* Skip button */}
          <button
            onClick={onSkip}
            className="
              px-6 py-3 rounded-lg font-bold
              bg-[var(--color-forest-green)] text-[var(--color-beige-white)]
              border-2 border-[var(--color-metallic-gold)]
              hover:bg-[var(--color-dark-forest)]
              transition-all duration-200
              min-h-[48px]
            "
          >
            {t('common.skip', 'Skip')}
          </button>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={selectedIndices.length === 0}
            className={`
              flex-1 px-8 py-3 rounded-lg font-bold text-lg
              transition-all duration-200
              min-h-[48px]
              ${
                selectedIndices.length > 0
                  ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] border-2 border-[var(--color-golden-yellow)] hover:bg-[var(--color-deep-orange)] active:scale-95'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed border-2 border-gray-500'
              }
            `}
          >
            {selectedIndices.length > 0
              ? t('shop.confirmSelection', 'Confirm Selection')
              : t('shop.selectItems', 'Select Items')}
          </button>
        </div>
      </AnimatedDiv>
    </AnimatedDiv>,
    document.body
  )
}

export default PackOpeningModal
