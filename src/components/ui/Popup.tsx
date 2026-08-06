/**
 * Popup Component for Tensho Mahjong Roguelike
 * Uses React portal for modal rendering
 */

import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSpring, animated } from '@react-spring/web'
import { popupAssets } from '../../utils/assets'
import { Button } from './Button'
import { IconButton, Icons } from './IconButton'

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
}

/**
 * Popup component with portal rendering
 */
export function Popup({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  className = '',
}: PopupProps) {
  // Animation spring
  const spring = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.9,
    config: { tension: 300, friction: 20 },
  })

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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
      onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
    >
      {/* Close button - positioned at top right edge */}
      {showCloseButton && (
        <div className="absolute top-5 right-3 z-10">
          <IconButton
            icon={<Icons.Close />}
            ariaLabel="Close"
            variant="secondary"
            size="md"
            onClick={onClose}
          />
        </div>
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

  // Portal rendering
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
        <Button variant="primary" size="md" onClick={onClose}>
          {confirmText}
        </Button>
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
        <Button variant="secondary" size="md" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant="primary" size="md" onClick={handleConfirm}>
          {confirmText}
        </Button>
      </div>
    </Popup>
  )
}

export default Popup
