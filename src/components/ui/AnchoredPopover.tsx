/**
 * AnchoredPopover
 *
 * A details panel that opens beside its trigger instead of as a window over
 * the whole screen. It is non-modal: the table stays visible and usable, focus
 * is never trapped, and the panel closes on Escape, on a press outside it, or
 * from its own close button. It stays inside the viewport, scrolling its own
 * content when the screen is short.
 *
 * The panel is portaled to escape clipped scroll boxes, so Tab order is kept
 * by hand: Tab on the trigger enters the panel, Shift+Tab at its start returns
 * to the trigger, and Tab at its end closes it and moves on past the trigger.
 *
 * @module components/ui/AnchoredPopover
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ControlIcon } from './ControlIcon'

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function tabbables(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (element) => element.getClientRects().length > 0
  )
}

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

interface Insets {
  top: number
  bottom: number
}

let insetProbe: HTMLElement | null = null
/** The notch and home indicator, which a panel must not sit under. */
function safeAreaInsets(): Insets {
  if (!insetProbe) {
    insetProbe = document.createElement('div')
    insetProbe.setAttribute('aria-hidden', 'true')
    insetProbe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)'
    document.body.appendChild(insetProbe)
  }
  const style = getComputedStyle(insetProbe)
  return {
    top: parseFloat(style.paddingTop) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
  }
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
  /**
   * Actions pinned to the panel's bottom edge, so a Buy or Sell button stays
   * on screen however far the details scroll.
   */
  footer?: ReactNode
  children: ReactNode
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), Math.max(low, high))

/**
 * Below the trigger when there is room (or more room than above), otherwise
 * above it — and always fully on screen, even when the trigger itself has
 * scrolled out of view.
 */
function place(
  anchor: DOMRect,
  contentHeight: number,
  insets: Insets
): Placement {
  const viewport = window.visualViewport
  const vw = viewport?.width ?? innerWidth
  const vh = viewport?.height ?? innerHeight
  const top = Math.max(MARGIN, insets.top)
  const bottom = Math.max(MARGIN, insets.bottom)
  const width = Math.min(MAX_WIDTH, vw - MARGIN * 2)
  const left = clamp(
    anchor.left + anchor.width / 2 - width / 2,
    MARGIN,
    vw - width - MARGIN
  )
  const below = vh - anchor.bottom - GAP - bottom
  const above = anchor.top - GAP - top
  const openBelow = below >= MIN_COMFORTABLE_HEIGHT || below >= above
  const maxHeight = Math.min(
    Math.max(120, vh - top - bottom),
    Math.max(120, openBelow ? below : above)
  )
  const height = Math.min(contentHeight || maxHeight, maxHeight)
  const ideal = openBelow ? anchor.bottom + GAP : anchor.top - GAP - height
  return {
    left,
    top: clamp(ideal, top, vh - bottom - height),
    width,
    maxHeight,
  }
}

/** Touch pointers always leave when the finger lifts or a scroll starts. */
const mouseOnly =
  (handler?: () => void) => (event: { pointerType: string }) => {
    if (event.pointerType === 'mouse') handler?.()
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
  footer,
  children,
}: AnchoredPopoverProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)

  const reposition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    setPlacement(
      place(
        anchor.getBoundingClientRect(),
        panelRef.current?.scrollHeight ?? 0,
        safeAreaInsets()
      )
    )
  }, [anchorRef])

  useLayoutEffect(() => {
    if (open) reposition()
    else setPlacement(null)
  }, [open, reposition])

  // Move focus in once the panel is placed and shown, not while it is still
  // being measured.
  const placed = placement !== null
  const focusedThisOpen = useRef(false)
  useEffect(() => {
    if (!open) {
      focusedThisOpen.current = false
      return
    }
    if (!placed || !focusOnOpen || focusedThisOpen.current) return
    focusedThisOpen.current = true
    closeRef.current?.focus({ preventScroll: true })
  }, [open, placed, focusOnOpen])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
      anchorRef.current?.focus({ preventScroll: true })
    }
    const anchor = anchorRef.current
    const onAnchorKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.shiftKey || !panelRef.current) return
      const [first] = tabbables(panelRef.current)
      if (!first) return
      event.preventDefault()
      first.focus({ preventScroll: true })
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
    anchor?.addEventListener('keydown', onAnchorKey)
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    window.visualViewport?.addEventListener('resize', reposition)
    return () => {
      observer?.disconnect()
      document.removeEventListener('keydown', onKey)
      anchor?.removeEventListener('keydown', onAnchorKey)
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      window.visualViewport?.removeEventListener('resize', reposition)
    }
  }, [open, onClose, anchorRef, reposition])

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !panelRef.current) return
    const inside = tabbables(panelRef.current)
    const anchor = anchorRef.current
    if (!anchor || inside.length === 0) return
    if (event.shiftKey && document.activeElement === inside[0]) {
      event.preventDefault()
      anchor.focus({ preventScroll: true })
    } else if (
      !event.shiftKey &&
      document.activeElement === inside[inside.length - 1]
    ) {
      // Continue the page's order after the trigger, as if the panel sat
      // right behind it.
      const page = tabbables(document).filter(
        (element) => !panelRef.current!.contains(element)
      )
      const next = page[page.indexOf(anchor) + 1]
      event.preventDefault()
      onClose()
      ;(next ?? anchor).focus()
    }
  }

  if (!open) return null
  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      data-popup-frame
      onPointerEnter={mouseOnly(onPointerEnter)}
      onPointerLeave={mouseOnly(onPointerLeave)}
      onKeyDown={onPanelKeyDown}
      // No transitions: reduced motion gives every element a one-frame one,
      // which would sweep the panel from its measuring spot across the page
      // under a resting mouse, and closing it then reads as re-entering the
      // trigger, reopening a hover panel.
      className="fixed z-[90] overflow-y-auto overscroll-contain rounded-xl transition-none border border-[var(--color-metallic-gold)]/80 bg-[#0b1b15]/[0.98] p-3 text-left text-[var(--color-beige-white)] shadow-[0_18px_50px_rgba(0,0,0,0.6)]"
      style={
        placement
          ? {
              left: placement.left,
              top: placement.top,
              width: placement.width,
              maxHeight: placement.maxHeight,
            }
          : // Measured before it is shown. Opacity, not visibility: a
            // visibility change can still be mid-transition (reduced motion
            // gives everything a tiny one) when focus moves in, and a hidden
            // button ignores focus.
            { opacity: 0, pointerEvents: 'none', left: 0, top: 0 }
      }
    >
      <div className="sticky -top-3 z-10 -mx-3 -mt-3 mb-2 flex items-start justify-between gap-2 rounded-t-xl bg-[#0b1b15] px-3 pt-3">
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
          <ControlIcon name="close" size={18} />
        </button>
      </div>
      {children}
      {footer && (
        <div
          data-popover-footer
          className="sticky -bottom-3 z-10 -mx-3 -mb-3 mt-2 space-y-2 rounded-b-xl border-t border-white/10 bg-[#0b1b15] px-3 pb-3 pt-2"
        >
          {footer}
        </div>
      )}
    </div>,
    document.body
  )
}

export default AnchoredPopover
