/**
 * Popup Component for Tensho Mahjong Roguelike
 * Uses the native Popover API with fallback for older browsers
 */

import React, { useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSpring, animated } from '@react-spring/web'
import { popupAssets } from '../../utils/assets'

const AnimatedDiv = animated('div')

export interface PopupProps {
  /** Whether the popup is open */
  isOpen: boolean
  /** Callback when popup should close */
  onClose: () => void
  /** Popup title */
  title?: string
  /** Popup content */
  children: React.ReactNode
  /** Whether to show close button */
  showCloseButton?: boolean
  /** Whether clicking backdrop closes popup */
  closeOnBackdrop?: boolean
  /** Custom class name */
  className?: string
  /** Use native popover API if available */
  useNativePopover?: boolean
}

/**
 * Check if Popover API is supported
 */
function supportsPopover(): boolean {
  return typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype
}

/**
 * Popup component with Popover API support
 */
export function Popup({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  className = '',
  useNativePopover = true,
}: PopupProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  // Disable native popover API due to cross-browser inconsistencies
  // The portal fallback is more reliable
  const hasNativeSupport = false // useNativePopover && supportsPopover()

  // Animation spring
  const spring = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.9,
    config: { tension: 300, friction: 20 },
  })

  // Handle native popover
  useEffect(() => {
    const element = popoverRef.current
    if (!element || !hasNativeSupport) return

    if (isOpen) {
      try {
        element.showPopover()
      } catch {
        // Popover already shown or not supported
      }
    } else {
      try {
        element.hidePopover()
      } catch {
        // Popover already hidden or not supported
      }
    }
  }, [isOpen, hasNativeSupport])

  // Handle toggle event from native popover
  useEffect(() => {
    const element = popoverRef.current
    if (!element || !hasNativeSupport) return

    const handleToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent
      if (toggleEvent.newState === 'closed') {
        onClose()
      }
    }

    element.addEventListener('toggle', handleToggle)
    return () => element.removeEventListener('toggle', handleToggle)
  }, [hasNativeSupport, onClose])

  // Handle escape key for non-native popover
  useEffect(() => {
    if (hasNativeSupport || !isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasNativeSupport, isOpen, onClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdrop && e.target === e.currentTarget) {
        onClose()
      }
    },
    [closeOnBackdrop, onClose]
  )

  // Render popup content
  const popupContent = (
    <AnimatedDiv
      className={`
        relative max-w-[90vw] max-h-[85vh]
        rounded-xl
        bg-[var(--color-dark-forest)] border-2 border-[var(--color-saddle-brown)]
        shadow-2xl
        ${className}
      `}
      style={{
        opacity: spring.opacity,
        transform: spring.scale.to((s) => `scale(${s})`),
        backgroundImage: `url(${popupAssets.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button - positioned at top right edge */}
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-5 right-3 z-10 p-2 rounded-lg bg-[var(--color-forest-green)] hover:bg-[var(--color-vibrant-orange)]
                     border-2 border-[var(--color-metallic-gold)] hover:border-[var(--color-golden-yellow)]
                     text-[var(--color-beige-white)] hover:text-white
                     transition-all hover:scale-110 active:scale-95
                     min-w-[44px] min-h-[44px] flex items-center justify-center
                     shadow-md"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Inner container with padding for scroll background */}
      <div className="p-6 pt-12 pb-12 px-20 md:px-24 lg:px-28 overflow-auto max-h-[85vh]">
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-4 pr-10">
            <h2 className="text-2xl font-bold text-[var(--color-golden-yellow)] font-decorative">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="text-[var(--color-beige-white)]">{children}</div>
      </div>
    </AnimatedDiv>
  )

  // Native popover rendering
  if (hasNativeSupport) {
    // Don't render anything if not open (native popover should handle this, but as a safety)
    if (!isOpen) return null

    return (
      <div
        ref={popoverRef}
        // @ts-expect-error - popover attribute not yet in React types
        popover="manual"
        className="fixed inset-0 m-0 p-0 border-0 bg-transparent max-w-none max-h-none w-full h-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={handleBackdropClick}
      >
        {popupContent}
      </div>
    )
  }

  // Fallback portal rendering
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={handleBackdropClick}
    >
      {popupContent}
    </div>,
    document.body
  )
}

/**
 * Simple alert popup
 */
export interface AlertPopupProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  confirmText?: string
}

export function AlertPopup({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'OK',
}: AlertPopupProps) {
  return (
    <Popup isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
      <p className="mb-6 text-lg">{message}</p>
      <div className="flex justify-center">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                     text-[var(--color-beige-white)] font-bold rounded-lg
                     border-2 border-[var(--color-golden-yellow)]
                     transition-all hover:scale-105 active:scale-95"
        >
          {confirmText}
        </button>
      </div>
    </Popup>
  )
}

/**
 * Confirm popup with two buttons
 */
export interface ConfirmPopupProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

export function ConfirmPopup({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmPopupProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Popup isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
      <p className="mb-6 text-lg">{message}</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-[var(--color-forest-green)] hover:bg-[var(--color-dark-forest)]
                     text-[var(--color-beige-white)] font-bold rounded-lg
                     border-2 border-[var(--color-metallic-gold)]
                     transition-all hover:scale-105 active:scale-95"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className="px-6 py-3 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                     text-[var(--color-beige-white)] font-bold rounded-lg
                     border-2 border-[var(--color-golden-yellow)]
                     transition-all hover:scale-105 active:scale-95"
        >
          {confirmText}
        </button>
      </div>
    </Popup>
  )
}

export default Popup
