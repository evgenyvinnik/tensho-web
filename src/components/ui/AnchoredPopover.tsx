/**
 * AnchoredPopover
 *
 * A details panel that opens beside its trigger instead of as a window over
 * the whole screen. It is non-modal: the table stays visible and usable, focus
 * is never trapped, and the panel closes on Escape, on a press outside it, or
 * from its own close button. It stays inside the viewport, scrolling its own
 * content when the screen is short.
 *
 * @module components/ui/AnchoredPopover
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

const MARGIN = 12
const GAP = 8
const MAX_WIDTH = 380
/** Below this much room under the trigger, open above it if that is roomier. */
const MIN_COMFORTABLE_HEIGHT = 240

interface Placement {
  left: number
  top: number
  width: number
  maxHeight: number
}

export interface AnchoredPopoverProps {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  /** Accessible name of the panel. */
  title: string
  onClose: () => void
  /** Move focus to the close button (keyboard opening). */
  focusOnOpen?: boolean
  /** Keep a hover-opened panel open while the pointer is over it. */
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  id?: string
  children: ReactNode
}

function place(anchor: DOMRect): Placement {
  const viewport = window.visualViewport
  const width = Math.min(
    MAX_WIDTH,
    (viewport?.width ?? innerWidth) - MARGIN * 2
  )
  const vw = viewport?.width ?? innerWidth
  const vh = viewport?.height ?? innerHeight
  const left = Math.max(
    MARGIN,
    Math.min(anchor.left + anchor.width / 2 - width / 2, vw - width - MARGIN)
  )
  const below = vh - anchor.bottom - GAP - MARGIN
  const above = anchor.top - GAP - MARGIN
  if (below >= MIN_COMFORTABLE_HEIGHT || below >= above)
    return {
      left,
      top: anchor.bottom + GAP,
      width,
      maxHeight: Math.max(120, below),
    }
  return { left, top: MARGIN, width, maxHeight: Math.max(120, above) }
}

export function AnchoredPopover({
  open,
  anchorRef,
  title,
  onClose,
  focusOnOpen = false,
  onPointerEnter,
  onPointerLeave,
  id,
  children,
}: AnchoredPopoverProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)

  const reposition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const next = place(anchor.getBoundingClientRect())
    const panel = panelRef.current
    // Opening above: sit the panel's bottom just over the trigger.
    if (panel && next.top === MARGIN) {
      const height = Math.min(panel.scrollHeight, next.maxHeight)
      next.top = Math.max(
        MARGIN,
        anchor.getBoundingClientRect().top - GAP - height
      )
    }
    setPlacement(next)
  }, [anchorRef])

  useLayoutEffect(() => {
    if (open) reposition()
    else setPlacement(null)
  }, [open, reposition])

  useEffect(() => {
    if (!open) return
    if (focusOnOpen) closeRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
      anchorRef.current?.focus({ preventScroll: true })
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      )
        return
      onClose()
    }
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(reposition)
    if (panelRef.current) observer?.observe(panelRef.current)
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    window.visualViewport?.addEventListener('resize', reposition)
    return () => {
      observer?.disconnect()
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      window.visualViewport?.removeEventListener('resize', reposition)
    }
  }, [open, focusOnOpen, onClose, anchorRef, reposition])

  if (!open) return null
  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      data-popup-frame
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="fixed z-[90] overflow-y-auto overscroll-contain rounded-xl border border-[var(--color-metallic-gold)]/80 bg-[#0b1b15]/[0.98] p-3 text-left text-[var(--color-beige-white)] shadow-[0_18px_50px_rgba(0,0,0,0.6)]"
      style={
        placement
          ? {
              left: placement.left,
              top: placement.top,
              width: placement.width,
              maxHeight: placement.maxHeight,
            }
          : { visibility: 'hidden', left: 0, top: 0 }
      }
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="pt-2 text-sm font-bold text-[var(--color-golden-yellow)]">
          {title}
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={() => {
            onClose()
            anchorRef.current?.focus({ preventScroll: true })
          }}
          aria-label={t('common.close', 'Close')}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-lg text-[var(--color-beige-white)]/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      {children}
    </div>,
    document.body
  )
}

export default AnchoredPopover
