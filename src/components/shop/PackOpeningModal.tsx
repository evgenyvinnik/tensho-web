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
import { useSpring, animated } from '@react-spring/web'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { PackContent, PackOffering } from '../../systems/BlessingPackSystem'
import {
  PACK_TYPE_DEFINITIONS,
  PACK_SIZE_DEFINITIONS,
} from '../../config/packDefinitions'
import { getCurrentLanguage } from '../../i18n'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'
import { Tile } from '../../core/Tile'
import {
  getTileImagePath,
  getVoidScriptIllustration,
  illustrationAssets,
} from '../../utils/assets'
import type { VoidScript } from '../../systems/VoidScriptSystem'
import { VoidScriptArtwork } from '../ui/VoidScriptArtwork'

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

function getContentArtwork(content: PackContent): string | null {
  switch (content.type) {
    case 'FateSeal':
      return illustrationAssets.consumables.fateSeal
    case 'CelestialOrb':
      return illustrationAssets.consumables.celestialOrb
    case 'VoidScript':
      return getVoidScriptIllustration(content.id)
    case 'Tile': {
      const tile = content.data as Tile
      return tile?.suit && tile?.rank
        ? getTileImagePath(tile.suit, tile.rank)
        : null
    }
    default:
      return null
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
  index: _index,
  isSelected,
  canSelect,
  onToggle,
  animationDelay,
}: PackContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const rarityColor = getRarityColor(content.rarity)
  const artwork = getContentArtwork(content)
  const voidScript =
    content.type === 'VoidScript' ? (content.data as VoidScript) : null
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
        boxShadow: isSelected
          ? `0 0 25px rgba(255, 215, 79, 0.5), ${glow}`
          : glow,
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
          <svg
            className="w-4 h-4 text-[var(--color-dark-forest)]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
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
        {/* Icon - Use unique icon for decrees */}
        <div
          className={`mb-2 flex items-center justify-center ${voidScript ? 'h-16 w-16' : 'h-12 w-12'}`}
        >
          {content.type === 'Decree' ? (
            <DecreeUniqueIcon
              decreeId={content.id}
              size={48}
              color={rarityColor}
            />
          ) : voidScript ? (
            <VoidScriptArtwork
              script={voidScript}
              name={content.name}
              description={content.description}
              className="h-16 w-16"
            />
          ) : artwork ? (
            <img
              src={artwork}
              alt=""
              aria-hidden="true"
              className="game-illustration h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <span className="text-2xl text-[var(--color-metallic-gold)]">
              ?
            </span>
          )}
        </div>

        {/* Rarity indicator */}
        <div className="flex items-center gap-1 mb-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: rarityColor }}
          />
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

  const showCJK = isCJKLanguage()

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 safe-area-top safe-area-bottom sm:p-4"
      style={{
        opacity: backdropSpring.opacity,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
      }}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <AnimatedDiv
        className="relative flex max-h-[calc(100dvh-24px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl"
        style={{
          opacity: modalSpring.opacity,
          transform: modalSpring.scale.to((s) => `scale(${s})`),
          background: 'linear-gradient(135deg, #1C3A2E 0%, #0D1F17 100%)',
          border: `3px solid ${typeInfo?.iconColor || '#C8B273'}`,
          boxShadow: `0 0 50px ${typeInfo?.iconColor}40, 0 25px 50px rgba(0, 0, 0, 0.5)`,
        }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[var(--color-metallic-gold)] border-opacity-30 p-3 sm:p-4">
          <div className="relative flex items-center justify-center gap-3 pr-12 text-center sm:gap-4">
            <img
              src={illustrationAssets.packs[pack.type]}
              alt=""
              aria-hidden="true"
              className="game-illustration h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
              draggable={false}
            />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative">
                {sizeInfo?.name} {typeInfo?.name}
              </h2>
              <p className="text-sm text-[var(--color-metallic-gold)]">
                {showCJK && typeInfo?.japaneseName
                  ? `${typeInfo.japaneseName} \u2022 `
                  : ''}
                {sizeInfo?.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute right-0 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg p-2 text-[var(--color-beige-white)] hover:bg-[var(--color-forest-green)]"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content grid */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="grid grid-cols-2 justify-items-center gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
            {packOffering.contents.map((content, index) => (
              <PackContentCard
                key={content.id}
                content={content}
                index={index}
                isSelected={selectedIndices.includes(index)}
                canSelect={
                  selectedIndices.length < maxSelections ||
                  selectedIndices.includes(index)
                }
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
        <div className="grid flex-shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-[var(--color-metallic-gold)] border-opacity-30 p-3 sm:gap-4 sm:p-4">
          {/* Skip button */}
          <button
            onClick={onSkip}
            className="
              px-4 py-3 rounded-lg font-bold sm:px-6
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
              w-full px-4 py-3 rounded-lg font-bold text-sm sm:px-8 sm:text-lg
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
