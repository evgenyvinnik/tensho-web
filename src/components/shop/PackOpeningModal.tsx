/**
 * PackOpeningModal Component
 *
 * Modal overlay for opening Blessing Packs.
 * Features:
 * - Animated pack opening sequence
 * - Display all available choices with selection
 * - Allow picking 1 (Normal/Jumbo) or 2 (Mega) items
 * - Skip option for synergy decrees
 * - Each reward drawn big, glowing by its rarity
 * - A tap chooses a reward; hover, focus or press and hold it to see its
 *   details card
 * - A pack offering Decrees shows the owned ones, which can be sold for room
 *
 * Uses React Spring for animations and the game's color palette.
 */

import {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useId,
  type RefObject,
} from 'react'
import { useSpring, animated, to } from '@react-spring/web'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { PackContent, PackOffering } from '../../systems/BlessingPackSystem'
import { PACK_TYPE_DEFINITIONS } from '../../config/packDefinitions'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { getPackIllustration } from '../../utils/assets'
import type { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import type { Decree, OwnedDecree } from '../../systems/types'
import { ControlIcon } from '../ui/ControlIcon'
import { DecreeModifierDetails } from '../ui/DecreeModifierDetails'
import { OfferArt } from './OfferArt'
import { SellableDecrees } from './SellableDecrees'
import { RARITY_COLORS, useOfferText, type OfferText } from './useOfferText'

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
  selectionError?: (indices: number[]) => string | null
  error?: string | null
  /** The Decrees already owned, which a pack offering Decrees can sell. */
  build?: PackBuild
}

export interface PackBuild {
  decrees: OwnedDecree[]
  maxSlots: number
  onSell: (instanceId: string) => { success: boolean }
}

// =============================================================================
// PACK CHOICE DETAILS
// =============================================================================

const DETAILS_WIDTH = 300
const DETAILS_MARGIN = 12
const DETAILS_GAP = 10
/** How long a touch rests on a reward before it shows the details. */
const HOLD_MS = 450
/** How far a resting touch may drift before it counts as a scroll. */
const HOLD_SLOP = 10

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), Math.max(low, high))

function isFocusVisible(element: Element): boolean {
  try {
    return element.matches(':focus-visible')
  } catch {
    return false
  }
}

interface PackChoiceDetailsProps {
  anchorRef: RefObject<HTMLElement | null>
  content: PackContent
  offer: Pick<TeaHouseOffering, 'itemType' | 'item'>
  text: OfferText
  rarityColor: string
  rarityLabel: string
  animate: boolean
}

/**
 * What a reward does, on a card floating beside it: above when there is
 * room, otherwise below, always on screen. It only shows; the reward itself
 * is still what the player presses, so the card never takes a click.
 */
function PackChoiceDetails({
  anchorRef,
  content,
  offer,
  text,
  rarityColor,
  rarityLabel,
  animate,
}: PackChoiceDetailsProps) {
  const { t } = useTranslation()
  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number }>()

  const place = useCallback(() => {
    const anchor = anchorRef.current?.getBoundingClientRect()
    const card = cardRef.current
    if (!anchor || !card) return
    const width = card.offsetWidth
    const height = card.offsetHeight
    const above = anchor.top - DETAILS_GAP - height
    const below = anchor.bottom + DETAILS_GAP
    setPosition({
      left: clamp(
        anchor.left + anchor.width / 2 - width / 2,
        DETAILS_MARGIN,
        innerWidth - width - DETAILS_MARGIN
      ),
      top:
        above >= DETAILS_MARGIN
          ? above
          : clamp(below, DETAILS_MARGIN, innerHeight - height - DETAILS_MARGIN),
    })
  }, [anchorRef])

  useLayoutEffect(() => {
    place()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place)
    if (cardRef.current) observer?.observe(cardRef.current)
    window.addEventListener('resize', place)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [place])

  return createPortal(
    <div
      ref={cardRef}
      aria-hidden="true"
      data-pack-choice-details={content.id}
      className={`pointer-events-none fixed z-[60] overflow-hidden rounded-xl border-2 bg-[#0b1b15]/[0.98] text-left text-[var(--color-beige-white)] ${
        animate ? 'pack-choice-details-enter' : ''
      }`}
      style={{
        width: Math.min(DETAILS_WIDTH, innerWidth - DETAILS_MARGIN * 2),
        maxHeight: `calc(100dvh - ${DETAILS_MARGIN * 2}px)`,
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        // Measured where it cannot be seen, then placed before paint.
        visibility: position ? 'visible' : 'hidden',
        borderColor: rarityColor,
        boxShadow: `0 18px 50px rgba(0, 0, 0, 0.65), 0 0 28px ${rarityColor}55`,
      }}
    >
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${rarityColor}, var(--color-metallic-gold), ${rarityColor})`,
        }}
      />
      <div className="space-y-2 p-3 text-sm [overflow-wrap:anywhere]">
        <div className="flex items-start gap-3">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center">
            <OfferArt offering={offer} tileSize="compact" />
          </span>
          <div className="min-w-0">
            <p className="font-decorative text-base font-bold leading-tight text-[var(--color-golden-yellow)]">
              {text.name}
            </p>
            <p
              className="mt-1 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: rarityColor }}
            >
              {text.kind}
            </p>
            {/* A Decree's kind already names its rarity. */}
            {content.type !== 'Decree' && (
              <span
                className="mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ borderColor: rarityColor, color: rarityColor }}
              >
                {rarityLabel}
              </span>
            )}
          </div>
        </div>
        <p className="leading-relaxed">{text.description}</p>
        {text.cost && (
          <p className="rounded-lg border border-red-400/35 bg-red-950/45 p-2 text-xs text-red-100">
            {t('consumableUse.cost')}: {text.cost}
          </p>
        )}
        {text.extra && (
          <p className="whitespace-pre-line rounded-lg bg-black/25 p-2 text-xs text-[var(--color-beige-white)]/80">
            {text.extra}
          </p>
        )}
        {content.type === 'Decree' && (
          <DecreeModifierDetails decree={content.data as Decree} />
        )}
      </div>
    </div>,
    document.body
  )
}

// =============================================================================
// PACK CONTENT CARD COMPONENT
// =============================================================================

interface PackContentCardProps {
  content: PackContent
  isSelected: boolean
  canSelect: boolean
  /** This reward's details card is the one showing. */
  showDetails: boolean
  /** Show (true) or hide (false) this reward's details card. */
  onInspect: (show: boolean) => void
  onToggle: () => void
  animationDelay: number
}

function PackContentCard({
  content,
  isSelected,
  canSelect,
  showDetails,
  onInspect,
  onToggle,
  animationDelay,
}: PackContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion()
  const anchorRef = useRef<HTMLDivElement>(null)
  const lastPointer = useRef('mouse')
  const hold = useRef<{
    x: number
    y: number
    timer: ReturnType<typeof setTimeout>
  } | null>(null)
  /** The last touch rested long enough to show the details, not to choose. */
  const held = useRef(false)
  const descriptionId = useId()
  const offer = {
    itemType: content.type,
    item: content.data as TeaHouseOffering['item'],
  }
  const text = useOfferText(offer)
  const rarityColor = RARITY_COLORS[content.rarity] ?? RARITY_COLORS.common
  const rarityLabel = t(`shop.ui.rarity_${content.rarity}`, content.rarity)
  const description = text.cost
    ? `${text.description} ${t('consumableUse.cost')}: ${text.cost}`
    : text.description

  const endHold = () => {
    if (hold.current) clearTimeout(hold.current.timer)
    hold.current = null
  }
  useEffect(() => endHold, [])

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
    scale: reducedMotion ? 1 : isSelected ? 1.05 : isHovered ? 1.03 : 1,
    config: { tension: 400, friction: 30 },
  })

  return (
    <>
      <AnimatedDiv
        ref={anchorRef}
        role="button"
        tabIndex={0}
        data-pack-choice={content.id}
        aria-pressed={isSelected}
        aria-disabled={!canSelect && !isSelected}
        aria-label={text.name}
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
          relative flex w-full max-w-[10rem] select-none flex-col items-center rounded-2xl border-2 px-2 pb-2 pt-3 text-center outline-none [-webkit-touch-callout:none] odd:last:col-span-2
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-golden-yellow)] sm:w-40 sm:max-w-none
          ${isSelected ? 'border-[var(--color-golden-yellow)] bg-[var(--color-golden-yellow)]/10' : 'border-transparent hover:bg-white/5'}
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
          boxShadow: isSelected ? '0 0 24px rgba(255, 215, 79, 0.35)' : 'none',
        }}
        onPointerEnter={(e: React.PointerEvent<HTMLDivElement>) => {
          if (e.pointerType !== 'mouse') return
          setIsHovered(true)
          onInspect(true)
        }}
        onPointerLeave={(e: React.PointerEvent<HTMLDivElement>) => {
          if (e.pointerType !== 'mouse') return
          setIsHovered(false)
          onInspect(false)
        }}
        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
          lastPointer.current = e.pointerType
          held.current = false
          endHold()
          if (e.pointerType === 'mouse') return
          // A touch has no hover: a tap only chooses, and resting on the
          // reward shows what it does.
          hold.current = {
            x: e.clientX,
            y: e.clientY,
            timer: setTimeout(() => {
              hold.current = null
              held.current = true
              onInspect(true)
            }, HOLD_MS),
          }
        }}
        onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => {
          if (
            hold.current &&
            Math.hypot(e.clientX - hold.current.x, e.clientY - hold.current.y) >
              HOLD_SLOP
          )
            endHold()
        }}
        onPointerUp={endHold}
        onPointerCancel={endHold}
        onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
          // A long press is the details, not the browser's menu.
          if (lastPointer.current !== 'mouse') e.preventDefault()
        }}
        onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
          if (isFocusVisible(e.currentTarget)) onInspect(true)
        }}
        onBlur={() => onInspect(false)}
        onClick={() => {
          // The touch that showed the details does not also choose.
          if (held.current) {
            held.current = false
            return
          }
          if (canSelect || isSelected) onToggle()
        }}
      >
        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-golden-yellow)]">
            <ControlIcon
              name="check"
              size={16}
              className="text-[var(--color-dark-forest)]"
            />
          </div>
        )}

        {/* The reward itself, big, glowing by its rarity */}
        <span
          aria-hidden="true"
          data-rarity={content.rarity}
          className={`pack-choice-art ${reducedMotion ? 'pack-choice-art--still' : ''}`}
        >
          <span className="pack-choice-halo" />
          {content.rarity === 'legendary' && (
            <span className="pack-choice-rays">
              <span />
            </span>
          )}
          <span className="pack-choice-figure">
            <OfferArt offering={offer} tileSize="large" showStickers />
          </span>
        </span>

        {/* Name */}
        <h3 className="mt-2 w-full break-words text-sm font-bold leading-tight text-[var(--color-beige-white)]">
          {text.name}
        </h3>

        {/* Rarity, on the card's foot so a row's labels line up however
            many lines its names wrap to */}
        <span
          className="mt-auto inline-flex items-center gap-1 pt-1 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: rarityColor }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: rarityColor }}
          />
          {rarityLabel}
        </span>

        {/* Read by assistive technology; sighted players get the card. */}
        <span id={descriptionId} className="sr-only">
          {description}
        </span>
      </AnimatedDiv>
      {showDetails && (
        <PackChoiceDetails
          anchorRef={anchorRef}
          content={content}
          offer={offer}
          text={text}
          rarityColor={rarityColor}
          rarityLabel={rarityLabel}
          animate={!reducedMotion}
        />
      )}
    </>
  )
}

// =============================================================================
// OWNED DECREES
// =============================================================================

/**
 * The Decrees already owned, under a pack that offers more: selling one
 * here makes room for the choice without giving up the pack.
 */
function PackBuildRow({ decrees, maxSlots, onSell }: PackBuild) {
  const { t, i18n } = useTranslation()
  const titleId = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const number = (value: number) => value.toLocaleString(i18n.resolvedLanguage)

  return (
    <section
      data-pack-build
      aria-labelledby={titleId}
      className="flex-shrink-0 border-t border-[var(--color-metallic-gold)] border-opacity-30 px-3 py-2 sm:px-4"
    >
      <h3
        id={titleId}
        ref={titleRef}
        tabIndex={-1}
        className="text-xs font-semibold uppercase tracking-wider text-[var(--color-beige-white)]/60 focus-visible:outline focus-visible:outline-2"
      >
        {t('shop.build.slots', {
          used: number(decrees.length),
          max: number(maxSlots),
        })}
      </h3>
      <SellableDecrees
        decrees={decrees}
        onSell={onSell}
        focusTarget={titleRef}
      />
    </section>
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
  selectionError,
  error,
  build,
}: PackOpeningModalProps) {
  const { t } = useTranslation()
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  /** The reward whose details card is showing. */
  const [inspected, setInspected] = useState<number | null>(null)
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
    if (isOpen && packOffering) {
      setSelectedIndices([])
      setInspected(null)
    }
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
        reducedMotion ? 0 : 700
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
        if (prev.includes(index)) return prev.filter((i) => i !== index)
        // A one-reward pack moves its choice; a fuller choice must be undone first.
        if (packOffering.maxSelections === 1) return [index]
        return prev.length < packOffering.maxSelections
          ? [...prev, index]
          : prev
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
          // A Decree's details and its sale confirmation are portals that
          // handle their own keys, Escape included.
          if (!dialogRef.current?.contains(e.target as Node)) return
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
        className="relative flex max-h-[calc(100dvh-24px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl sm:w-fit sm:min-w-[36rem]"
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
        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
          // A new touch, or a click away from the rewards, puts a card away.
          if (
            e.pointerType !== 'mouse' ||
            !(e.target as Element).closest('[data-pack-choice]')
          )
            setInspected(null)
        }}
      >
        {/* Header, rewards and build scroll together, so on a short screen
            (a phone held sideways) the actions below always stay in view. */}
        <div
          data-pack-scroll
          className="min-h-0 flex-1 overflow-y-auto"
          // A card would drift from its reward as the rewards scroll.
          onScroll={() => setInspected(null)}
        >
          {/* Header */}
          <div className="border-b border-[var(--color-metallic-gold)] border-opacity-30 p-3 sm:p-4">
            <div className="relative flex items-center justify-center gap-3 text-center sm:gap-4">
              <img
                src={getPackIllustration(pack.type, 'open')}
                alt=""
                aria-hidden="true"
                className={`game-illustration h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20 ${
                  reducedMotion || isRevealed ? '' : 'pack-bag-open'
                }`}
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
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-2 justify-items-center gap-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
              {packOffering.contents.map((content, index) => (
                <PackContentCard
                  key={`${packOffering.pack.id}:choice:${index}`}
                  content={content}
                  isSelected={selectedIndices.includes(index)}
                  canSelect={
                    maxSelections === 1 ||
                    selectedIndices.length < maxSelections ||
                    selectedIndices.includes(index)
                  }
                  showDetails={inspected === index}
                  onInspect={(show) =>
                    setInspected((current) =>
                      show ? index : current === index ? null : current
                    )
                  }
                  onToggle={() => handleToggleSelection(index)}
                  animationDelay={isRevealed ? 100 + index * 100 : 0}
                />
              ))}
            </div>
          </div>

          {build &&
            packOffering.contents.some(
              (content) => content.type === 'Decree'
            ) && <PackBuildRow {...build} />}
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
                {error ||
                  selectionError?.(selectedIndices) ||
                  t('shop.packInventoryFull')}
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
