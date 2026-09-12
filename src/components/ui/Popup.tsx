/**
 * Popup Component for Tensho Mahjong Roguelike
 * Uses React portal for modal rendering
 */

import React, { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSpring, animated } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { popupAssets } from '../../utils/assets'
import { Button } from './Button'
import { IconButton, Icons } from './IconButton'

const AnimatedDiv = animated('div')

function focusableControls(dialog: HTMLDialogElement) {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]'
    )
  ).filter((control) => {
    if (
      control.tabIndex < 0 ||
      control.matches(':disabled') ||
      control.closest('[hidden], [inert]')
    )
      return false
    for (
      let node: HTMLElement | null = control;
      node && node !== dialog;
      node = node.parentElement
    ) {
      const style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden')
        return false
    }
    return true
  })
}

export interface PopupProps {
  /** Whether the popup is open */
  isOpen: boolean
  /** Callback when popup should close */
  onClose: () => void
  /** Popup title */
  title: string
  /** ID of a short description; omit for structured tutorial content. */
  descriptionId?: string
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
  descriptionId,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  className = '',
}: PopupProps) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const backdropPress = useRef(false)
  // Animation spring
  const spring = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.9,
    immediate: reduceMotion,
    config: { tension: 300, friction: 20 },
  })

  // Only opening/closing changes focus. Parent renders and new callbacks must
  // not move a keyboard user away from the control they are reading.
  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current!
    const previous = document.activeElement
    dialog.showModal()
    const initial = focusableControls(dialog)[0]
    initial?.focus({ preventScroll: true })
    return () => {
      dialog.close()
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [isOpen])

  // Render popup content
  const popupContent = (
    <AnimatedDiv
      data-popup-frame
      className={`
        relative flex min-h-0 w-full max-w-xl max-h-full flex-col
        rounded-xl
        bg-[var(--color-dark-forest)] border-2 border-[var(--color-saddle-brown)]
        shadow-2xl
        ${className}
      `}
      style={{
        opacity: reduceMotion ? 1 : spring.opacity,
        transform: reduceMotion
          ? 'none'
          : spring.scale.to((s) => `scale(${s})`),
      }}
    >
      {/* Nine-slice the existing scroll: fixed end caps cannot grow underneath
          long content or crop the side ornaments on a tall, narrow phone. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          borderStyle: 'solid',
          borderColor: 'transparent',
          borderWidth: '64px 40px',
          borderImageSource: `url(${popupAssets.background})`,
          borderImageSlice: '200 280 240 280 fill',
          borderImageRepeat: 'stretch',
        }}
      />
      {/* Close button - positioned at top right edge */}
      {showCloseButton && (
        <div className="absolute top-5 right-3 z-10">
          <IconButton
            icon={<Icons.Close />}
            ariaLabel={t('common.close')}
            variant="secondary"
            size="md"
            onClick={onClose}
          />
        </div>
      )}

      {/* Inner container with padding for scroll background */}
      <div className="relative flex min-h-0 flex-col px-12 pb-[72px] pt-20 sm:px-16">
        <div
          data-popup-scroll
          className="min-h-0 overflow-auto overscroll-contain"
        >
          {/* Header */}
          {title && (
            <div className="mb-4 flex items-center justify-center">
              <h2
                id={titleId}
                className="w-full text-center text-xl font-bold text-[var(--color-golden-yellow)] font-decorative sm:text-2xl"
              >
                {title}
              </h2>
            </div>
          )}

          {/* Content */}
          <div className="text-[var(--color-beige-white)]">{children}</div>
        </div>
      </div>
    </AnimatedDiv>
  )

  // Portal rendering
  if (!isOpen) return null

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-modal="true"
      className="fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none overflow-hidden border-0 open:flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(12px, env(safe-area-inset-left))',
        paddingRight: 'max(12px, env(safe-area-inset-right))',
      }}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={(event) => {
        if (
          event.key !== 'Tab' ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        )
          return
        const controls = focusableControls(event.currentTarget)
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (!first) {
          event.preventDefault()
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            !controls.includes(document.activeElement as HTMLElement))
        ) {
          event.preventDefault()
          last.focus()
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !controls.includes(document.activeElement as HTMLElement))
        ) {
          event.preventDefault()
          first.focus()
        }
      }}
      onPointerDown={(event) => {
        backdropPress.current = event.target === event.currentTarget
      }}
      onPointerCancel={() => {
        backdropPress.current = false
      }}
      onClick={(event) => {
        const dismiss =
          backdropPress.current && event.target === event.currentTarget
        backdropPress.current = false
        if (closeOnBackdrop && dismiss) onClose()
      }}
    >
      {popupContent}
    </dialog>,
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
  confirmText,
}: AlertPopupProps) {
  const { t } = useTranslation()
  const descriptionId = useId()
  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      descriptionId={descriptionId}
      showCloseButton={false}
    >
      <p
        id={descriptionId}
        className="mb-6 text-base leading-relaxed sm:text-lg"
      >
        {message}
      </p>
      <div className="flex justify-center">
        <Button
          variant="primary"
          size="md"
          onClick={onClose}
          className="min-w-0 px-5"
        >
          {confirmText ?? t('common.ok')}
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
  confirmText,
  cancelText,
}: ConfirmPopupProps) {
  const { t } = useTranslation()
  const descriptionId = useId()
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      descriptionId={descriptionId}
      showCloseButton={false}
    >
      <p
        id={descriptionId}
        className="mb-6 text-base leading-relaxed sm:text-lg"
      >
        {message}
      </p>
      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:flex sm:justify-center sm:gap-4">
        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          className="w-full min-w-0 px-2 sm:w-auto sm:min-w-[120px] sm:px-6"
        >
          {cancelText ?? t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleConfirm}
          className="w-full min-w-0 px-2 sm:w-auto sm:min-w-[120px] sm:px-6"
        >
          {confirmText ?? t('common.confirm')}
        </Button>
      </div>
    </Popup>
  )
}

export default Popup
