/**
 * usePreviewPopover
 *
 * The behaviour of a picture that explains itself in an AnchoredPopover:
 * mouse hover previews the panel, a tap or click pins it (a second one
 * closes it), and the keyboard opens it and moves focus inside. Leaving a
 * hover preview closes it after a short grace period, so the pointer can
 * travel from the picture into the panel.
 *
 * Spread `triggerProps` on the trigger button (with `anchorRef` as its ref)
 * and `popoverProps` on the AnchoredPopover.
 *
 * @module components/ui/usePreviewPopover
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react'

export function usePreviewPopover({
  open: controlledOpen,
  onOpenChange,
}: {
  /** Opened state is controlled by the caller when supplied. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
} = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange]
  )
  const [keyboardOpened, setKeyboardOpened] = useState(false)
  const pinned = useRef(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])
  const close = useCallback(() => {
    cancelClose()
    pinned.current = false
    setKeyboardOpened(false)
    setOpen(false)
  }, [cancelClose, setOpen])
  const scheduleClose = useCallback(() => {
    if (pinned.current) return
    cancelClose()
    closeTimer.current = setTimeout(close, 150)
  }, [cancelClose, close])
  useEffect(() => cancelClose, [cancelClose])

  return {
    open,
    anchorRef,
    triggerProps: {
      'aria-haspopup': 'dialog' as const,
      'aria-expanded': open,
      'aria-controls': open ? panelId : undefined,
      onPointerEnter: (event: PointerEvent) => {
        if (
          event.pointerType !== 'mouse' ||
          !window.matchMedia?.('(any-hover: hover)').matches
        )
          return
        cancelClose()
        setOpen(true)
      },
      onPointerLeave: scheduleClose,
      onClick: (event: MouseEvent) => {
        cancelClose()
        // Keyboard or assistive activation: open and move into the panel.
        if (event.detail === 0) {
          pinned.current = true
          setKeyboardOpened(true)
          setOpen(true)
          return
        }
        // A click on a hover-opened panel pins it; otherwise toggle.
        if (open && !pinned.current) {
          pinned.current = true
          return
        }
        if (open) close()
        else {
          pinned.current = true
          setOpen(true)
        }
      },
    },
    popoverProps: {
      open,
      anchorRef,
      id: panelId,
      onClose: close,
      focusOnOpen: keyboardOpened,
      onPointerEnter: cancelClose,
      onPointerLeave: scheduleClose,
    },
  }
}
