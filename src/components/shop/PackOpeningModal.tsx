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

import { useState, useCallback, useEffect, useRef, useId } from 'react'
import { useSpring, animated, to } from '@react-spring/web'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { PackContent, PackOffering } from '../../systems/BlessingPackSystem'
import { PACK_TYPE_DEFINITIONS } from '../../config/packDefinitions'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'
import { Tile } from '../../core/Tile'
import {
  getTileImagePath,
  getVoidScriptIllustration,
  illustrationAssets,
} from '../../utils/assets'
import type { VoidScript } from '../../systems/VoidScriptSystem'
import {
  useItemText,
  type ItemKind,
  type TranslatableItem,
} from '../../i18n/useItemText'
import { VoidScriptArtwork } from '../ui/VoidScriptArtwork'
import { tileRewardText } from '../../i18n/tileRewardText'

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
  /** Combined capacity check; selection is editable even when it cannot fit. */
  canConfirmSelection?: (indices: number[]) => boolean
  error?: string | null
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
  const { t } = useTranslation()
  const text = useItemText()
  const reducedMotion = useReducedMotion()
  const kinds: Partial<Record<PackContent['type'], ItemKind>> = {
    Decree: 'decrees',
    FateSeal: 'seals',
    CelestialOrb: 'orbs',
    VoidScript: 'scripts',
  }
  const kind = kinds[content.type]
  const item = content.data as TranslatableItem
  const tileText =
    content.type === 'Tile' && content.data instanceof Tile
      ? tileRewardText(content.data, t)
      : null
  const name = tileText?.name ?? (kind ? text.name(kind, item) : content.name)
  const description =
    tileText?.description ??
    (kind ? text.description(kind, item) : content.description)
  const descriptionId = useId()

  const rarityColor = getRarityColor(content.rarity)
  const artwork = getContentArtwork(content)
  const voidScript =
    content.type === 'VoidScript' ? (content.data as VoidScript) : null
  const glow = getRarityGlow(content.rarity)

  // Entry animation
  const entrySpring = useSpring({
    from: reducedMotion
      ? { opacity: 1, scale: 1, y: 0 }
      : { opacity: 0, scale: 0.5, y: 50 },
    to: { opacity: 1, scale: 1, y: 0 },
    delay: reducedMotion ? 0 : animationDelay,
    immediate: reducedMotion,
    config: { tension: 300, friction: 20 },
  })

  // Interaction animation
  const interactionSpring = useSpring({
    immediate: reducedMotion,
    scale: reducedMotion ? 1 : isSelected ? 1.05 : isHovered ? 1.02 : 1,
    borderWidth: isSelected ? 4 : 2,
    config: { tension: 400, friction: 30 },
  })

  return (
    <AnimatedDiv
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-disabled={!canSelect && !isSelected}
      aria-label={name}
      aria-describedby={descriptionId}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (
          e.target === e.currentTarget &&
          (e.key === 'Enter' || e.key === ' ')
        ) {
          e.preventDefault()
          if (canSelect || isSelected) onToggle()
        }
      }}
      className={`
        relative w-full max-w-[140px] rounded-xl overflow-hidden
        ${canSelect || isSelected ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
      `}
      style={{
        // Static values also cover the first render before springs advance.
        opacity: reducedMotion ? 1 : entrySpring.opacity,
        transform: reducedMotion
          ? 'none'
          : to(
              [entrySpring.scale, interactionSpring.scale, entrySpring.y],
              (entryScale, interactionScale, y) =>
                `scale(${entryScale * interactionScale}) translateY(${y}px)`
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
              name={name}
              description={description}
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
            {t(`shop.ui.rarity_${content.rarity}`, content.rarity)}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold text-[var(--color-beige-white)] text-center break-words">
          {name}
        </h3>

        {/* Description */}
        <p
          id={descriptionId}
          className="text-xs text-[var(--color-beige-white)] opacity-80 text-center mt-2 break-words flex-1"
        >
          {description}
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
  canConfirmSelection,
  error,
}: PackOpeningModalProps) {
  const { t } = useTranslation()
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [isRevealed, setIsRevealed] = useState(false)
  const reducedMotion = useReducedMotion()
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const selectionAllowed =
    selectedIndices.length > 0 &&
    (canConfirmSelection?.(selectedIndices) ?? true)

  useEffect(() => {
    if (!isOpen) return
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => previous?.focus()
  }, [isOpen])

  // A new pack resets selection; changing presentation preferences must not.
  useEffect(() => {
    if (isOpen && packOffering) setSelectedIndices([])
  }, [isOpen, packOffering])

  // Reset reveal timing independently from the player's reward choices.
  useEffect(() => {
    if (isOpen && packOffering) {
      setIsRevealed(false)

      // Reveal animation delay
      const timer = setTimeout(
        () => {
          setIsRevealed(true)
        },
        reducedMotion ? 0 : 300
      )

      return () => clearTimeout(timer)
    }
  }, [isOpen, packOffering, reducedMotion])

  // Backdrop animation
  const backdropSpring = useSpring({
    immediate: reducedMotion,
    opacity: isOpen ? 1 : 0,
    config: { tension: 300, friction: 30 },
  })

  // Modal animation
  const modalSpring = useSpring({
    immediate: reducedMotion,
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
    if (selectionAllowed) {
      onConfirm(selectedIndices)
    }
  }, [selectedIndices, onConfirm, selectionAllowed])

  if (!isOpen || !packOffering) return null

  const pack = packOffering.pack
  const typeInfo = PACK_TYPE_DEFINITIONS[pack.type]
  const packName = t(
    `packs.items.${pack.type.toLowerCase()}_${pack.size.toLowerCase()}.name`
  )
  const maxSelections = packOffering.maxSelections

  return createPortal(
    <AnimatedDiv
      className="fixed inset-0 z-50 flex items-center justify-center p-3 safe-area-top safe-area-bottom sm:p-4"
      style={{
        opacity: reducedMotion ? 1 : backdropSpring.opacity,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
      }}
    >
      <AnimatedDiv
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          // Paid rewards require an explicit claim or Skip, not accidental dismissal.
          if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
          }
          if (e.key !== 'Tab') return
          const controls = Array.from(
            dialogRef.current?.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [tabindex="0"]'
            ) ?? []
          )
          const first = controls[0]
          const last = controls.at(-1)
          if (
            e.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === dialogRef.current)
          ) {
            e.preventDefault()
            last?.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }}
        className="relative flex max-h-[calc(100dvh-24px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl"
        style={{
          opacity: reducedMotion ? 1 : modalSpring.opacity,
          transform: reducedMotion
            ? 'none'
            : modalSpring.scale.to((s) => `scale(${s})`),
          background: 'linear-gradient(135deg, #1C3A2E 0%, #0D1F17 100%)',
          border: `3px solid ${typeInfo?.iconColor || '#C8B273'}`,
          boxShadow: `0 0 50px ${typeInfo?.iconColor}40, 0 25px 50px rgba(0, 0, 0, 0.5)`,
        }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[var(--color-metallic-gold)] border-opacity-30 p-3 sm:p-4">
          <div className="relative flex items-center justify-center gap-3 text-center sm:gap-4">
            <img
              src={illustrationAssets.packs[pack.type]}
              alt=""
              aria-hidden="true"
              className="game-illustration h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
              draggable={false}
            />
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative"
              >
                {packName}
              </h2>
              <p className="text-sm text-[var(--color-metallic-gold)]">
                {t('shop.packChoices', {
                  count: packOffering.contents.length,
                  max: packOffering.maxSelections,
                })}
              </p>
            </div>
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
        </div>

        {/* Keep the reason for a disabled confirmation next to its action. */}
        <div className="flex-shrink-0 border-t border-[var(--color-metallic-gold)] border-opacity-30 p-3 sm:p-4">
          <div className="mb-3 text-center">
            <p className="text-sm text-[var(--color-beige-white)]">
              {t('shop.packSelected', {
                count: selectedIndices.length,
                max: maxSelections,
              })}
            </p>
            {(error || (selectedIndices.length > 0 && !selectionAllowed)) && (
              <p
                role="status"
                className="mt-2 text-sm text-[var(--color-golden-yellow)]"
              >
                {error || t('shop.packInventoryFull')}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4">
            {/* Skip button */}
            <button
              onClick={onSkip}
              className="
              min-w-0 break-words px-2 py-3 rounded-lg text-sm font-bold sm:px-6 sm:text-base
              bg-[var(--color-forest-green)] text-[var(--color-beige-white)]
              border-2 border-[var(--color-metallic-gold)]
              hover:bg-[var(--color-dark-forest)]
              transition-all duration-200
              min-h-[48px]
            "
            >
              {t('shop.skipRewards')}
            </button>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={!selectionAllowed}
              className={`
              min-w-0 w-full break-words px-2 py-3 rounded-lg font-bold text-sm sm:px-8 sm:text-lg
              transition-all duration-200
              min-h-[48px]
              ${
                selectionAllowed
                  ? `bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] border-2 border-[var(--color-golden-yellow)] hover:bg-[var(--color-deep-orange)] ${reducedMotion ? '' : 'active:scale-95'}`
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed border-2 border-gray-500'
              }
            `}
            >
              {selectedIndices.length > 0
                ? t('shop.confirmSelection', 'Confirm Selection')
                : t('shop.selectItems', 'Select Items')}
            </button>
          </div>
        </div>
      </AnimatedDiv>
    </AnimatedDiv>,
    document.body
  )
}

export default PackOpeningModal
