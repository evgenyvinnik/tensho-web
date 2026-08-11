import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { animated, useSpring } from '@react-spring/web'
import type { VoidScript } from '../../systems/VoidScriptSystem'
import { getVoidScriptIllustration } from '../../utils/assets'
import { useTranslation } from 'react-i18next'

type VoidScriptDisplay = Pick<
  VoidScript,
  | 'id'
  | 'name'
  | 'japaneseName'
  | 'description'
  | 'rarity'
  | 'penalty'
  | 'mahjongTwist'
>

interface PopoverPosition {
  left: number
  top: number
  width: number
}

export interface VoidScriptArtworkProps {
  script: VoidScriptDisplay
  name?: string
  description?: string
  className?: string
  /** Disable the extra tab stop when the artwork sits inside another control. */
  focusable?: boolean
  showPopover?: boolean
}

const POPOVER_MARGIN = 12
const POPOVER_GAP = 10
const POPOVER_MAX_WIDTH = 304
const ESTIMATED_POPOVER_HEIGHT = 232

function getRarityColor(rarity: VoidScriptDisplay['rarity']): string {
  switch (rarity) {
    case 'Legendary':
      return '#C084FC'
    case 'Rare':
      return '#60A5FA'
    case 'Uncommon':
      return '#4ADE80'
    default:
      return '#D1D5DB'
  }
}

/**
 * Script-specific artwork with a viewport-aware, unclipped hover/focus card.
 * Touch users receive the same information from the surrounding item details.
 */
export function VoidScriptArtwork({
  script,
  name = script.name,
  description = script.description,
  className = '',
  focusable = true,
  showPopover = true,
}: VoidScriptArtworkProps) {
  const { t } = useTranslation()
  const anchorRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<PopoverPosition | null>(null)

  const updatePosition = useCallback((height = ESTIMATED_POPOVER_HEIGHT) => {
    const anchor = anchorRef.current
    if (!anchor || typeof window === 'undefined') return

    const rect = anchor.getBoundingClientRect()
    const width = Math.min(
      POPOVER_MAX_WIDTH,
      window.innerWidth - POPOVER_MARGIN * 2
    )
    const left = Math.min(
      window.innerWidth - width - POPOVER_MARGIN,
      Math.max(POPOVER_MARGIN, rect.left + rect.width / 2 - width / 2)
    )
    const fitsAbove = rect.top - height - POPOVER_GAP >= POPOVER_MARGIN
    const proposedTop = fitsAbove
      ? rect.top - height - POPOVER_GAP
      : rect.bottom + POPOVER_GAP
    const top = Math.min(
      Math.max(POPOVER_MARGIN, window.innerHeight - height - POPOVER_MARGIN),
      Math.max(POPOVER_MARGIN, proposedTop)
    )

    setPosition({ left, top, width })
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()

    const frame = window.requestAnimationFrame(() => {
      if (popoverRef.current) {
        updatePosition(popoverRef.current.getBoundingClientRect().height)
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return

    const handleViewportChange = () => {
      updatePosition(
        popoverRef.current?.getBoundingClientRect().height ??
          ESTIMATED_POPOVER_HEIGHT
      )
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [isOpen, updatePosition])

  const popoverSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    y: isOpen ? 0 : 6,
    scale: isOpen ? 1 : 0.98,
    config: { tension: 360, friction: 28 },
  })

  const penaltyDescription = script.penalty?.description
  const ariaDescription = [
    name.replace(/[.!?]+$/u, ''),
    description.replace(/[.!?]+$/u, ''),
    penaltyDescription
      ? `Cost: ${penaltyDescription.replace(/[.!?]+$/u, '')}`
      : null,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <>
      <span
        ref={anchorRef}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)] ${className}`}
        role="img"
        tabIndex={focusable ? 0 : undefined}
        aria-label={ariaDescription}
        aria-describedby={isOpen && showPopover ? tooltipId : undefined}
        onMouseEnter={() => showPopover && setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => showPopover && setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        <img
          src={getVoidScriptIllustration(script.id)}
          alt=""
          aria-hidden="true"
          className="game-illustration h-full w-full object-contain"
          draggable={false}
        />
      </span>

      {isOpen &&
        showPopover &&
        position &&
        createPortal(
          <animated.div
            ref={popoverRef}
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-[100] overflow-hidden rounded-xl border border-[var(--color-metallic-gold)]/80 bg-[#0b1b15]/[0.98] text-left shadow-[0_18px_50px_rgba(0,0,0,0.65),0_0_24px_rgba(113,72,170,0.18)] backdrop-blur-sm"
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              maxHeight: `calc(100dvh - ${POPOVER_MARGIN * 2}px)`,
              opacity: popoverSpring.opacity,
              transform: popoverSpring.y.to(
                (y) => `translateY(${y}px) scale(${popoverSpring.scale.get()})`
              ),
            }}
          >
            <div className="h-1 bg-gradient-to-r from-violet-700 via-[var(--color-metallic-gold)] to-red-700" />
            <div className="p-3.5">
              <div className="flex items-start gap-3">
                <img
                  src={getVoidScriptIllustration(script.id)}
                  alt=""
                  aria-hidden="true"
                  className="game-illustration h-14 w-14 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-decorative text-base font-bold leading-tight text-[var(--color-golden-yellow)]">
                    {name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-tile text-xs text-[var(--color-metallic-gold)]">
                      {script.japaneseName}
                    </span>
                    <span
                      className="rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        borderColor: getRarityColor(script.rarity),
                        color: getRarityColor(script.rarity),
                      }}
                    >
                      {script.rarity}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[var(--color-beige-white)]">
                {description}
              </p>

              {penaltyDescription && (
                <div className="mt-3 rounded-lg border border-red-400/35 bg-red-950/45 px-2.5 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-300">
                    {t('collection.voidCost', 'Void cost')}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-red-100">
                    {penaltyDescription}
                  </p>
                </div>
              )}

              <p className="mt-2 text-xs italic text-[var(--color-metallic-gold)]/80">
                {script.mahjongTwist}
              </p>
            </div>
          </animated.div>,
          document.body
        )}
    </>
  )
}

export default VoidScriptArtwork
