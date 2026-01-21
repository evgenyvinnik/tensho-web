/**
 * TableStyleModal Component
 *
 * Modal for selecting a table style before starting a run.
 * Shows a grid of table style cards with unlock status.
 */

import React, { useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSpring, animated } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import { TableStyleCard } from './TableStyleCard'
import { useTableStyleStore } from '../../stores/tableStyleStore'
import { TABLE_STYLE_DEFINITIONS } from '../../config/tableStyleDefinitions'
import { getCurrentLanguage } from '../../i18n'

const AnimatedDiv = animated('div')

/** Check if current language uses CJK characters */
function isCJKLanguage(): boolean {
  const lang = getCurrentLanguage()
  return lang === 'ja' || lang === 'ko' || lang === 'zh-Hant' || lang === 'zh-Hans'
}

export interface TableStyleModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Callback when a style is confirmed */
  onConfirm?: (styleId: string) => void
}

/**
 * TableStyleModal - Modal for table style selection
 */
export function TableStyleModal({
  isOpen,
  onClose,
  onConfirm,
}: TableStyleModalProps) {
  const { t } = useTranslation()
  const showCJK = isCJKLanguage()
  const {
    currentStyleId,
    selectStyle,
    isStyleUnlocked,
    getUnlockProgress,
    getCurrentStyle,
  } = useTableStyleStore()

  // Track temporarily selected style (before confirmation)
  const [tempSelectedId, setTempSelectedId] = React.useState(currentStyleId)

  // Reset temp selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedId(currentStyleId)
    }
  }, [isOpen, currentStyleId])

  // Animation spring for modal
  const backdropSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { tension: 300, friction: 25 },
  })

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.9,
    y: isOpen ? 0 : 30,
    config: { tension: 300, friction: 20 },
  })

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Handle style selection
  const handleStyleSelect = useCallback((styleId: string) => {
    setTempSelectedId(styleId)
  }, [])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    const success = selectStyle(tempSelectedId)
    if (success) {
      onConfirm?.(tempSelectedId)
      onClose()
    }
  }, [tempSelectedId, selectStyle, onConfirm, onClose])

  // Handle cancel
  const handleCancel = useCallback(() => {
    setTempSelectedId(currentStyleId) // Reset to original
    onClose()
  }, [currentStyleId, onClose])

  // Get the currently selected style for preview
  const selectedStyle = TABLE_STYLE_DEFINITIONS.find(
    (s) => s.id === tempSelectedId
  ) ?? getCurrentStyle()

  if (!isOpen) return null

  return createPortal(
    <AnimatedDiv
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        opacity: backdropSpring.opacity,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      }}
      onClick={handleBackdropClick}
    >
      <AnimatedDiv
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border-3 border-[var(--color-saddle-brown)]"
        style={{
          opacity: modalSpring.opacity,
          transform: modalSpring.scale.to(
            (s) => `scale(${s}) translateY(${modalSpring.y.get()}px)`
          ),
          backgroundColor: 'var(--color-dark-forest)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-6 py-5 border-b-2 border-[var(--color-saddle-brown)]"
          style={{
            background: `linear-gradient(135deg, ${selectedStyle.themeColor}30 0%, var(--color-dark-forest) 100%)`,
          }}
        >
          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-[var(--color-forest-green)] hover:bg-[var(--color-vibrant-orange)]
                       border-2 border-[var(--color-metallic-gold)] hover:border-[var(--color-golden-yellow)]
                       text-[var(--color-beige-white)] hover:text-white
                       transition-all hover:scale-110 active:scale-95
                       min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            {/* Table icon */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: selectedStyle.themeColor }}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[var(--color-golden-yellow)] font-decorative">
                {t('tableStyle.title', 'Choose Table')}
              </h2>
              <p className="text-sm text-[var(--color-beige-white)] opacity-70">
                {t('tableStyle.subtitle', 'Select a table style for your run')}
              </p>
            </div>

            {/* Japanese title - only show for CJK languages */}
            {showCJK && (
              <span className="ml-auto text-3xl font-decorative text-[var(--color-metallic-gold)] opacity-70 pr-12">
                {t('tableStyle.titleJp', '卓風')}
              </span>
            )}
          </div>
        </div>

        {/* Content - Scrollable grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TABLE_STYLE_DEFINITIONS.map((style, index) => {
              const unlocked = isStyleUnlocked(style.id)
              const progress = unlocked ? 1 : getUnlockProgress(style.id)

              return (
                <TableStyleCard
                  key={style.id}
                  style={style}
                  isUnlocked={unlocked}
                  isSelected={tempSelectedId === style.id}
                  unlockProgress={progress}
                  onClick={() => handleStyleSelect(style.id)}
                  delay={index * 50}
                />
              )
            })}
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="px-6 py-4 border-t-2 border-[var(--color-saddle-brown)] bg-[var(--color-dark-forest)] flex justify-between items-center">
          {/* Currently selected info */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg"
              style={{ backgroundColor: selectedStyle.themeColor }}
            />
            <div>
              <span className="text-sm text-[var(--color-beige-white)] opacity-70">
                {t('tableStyle.selected', 'Selected:')}
              </span>
              <span className="ml-2 text-[var(--color-beige-white)] font-bold">
                {selectedStyle.displayName}
              </span>
              {showCJK && (
                <span className="ml-2 text-[var(--color-metallic-gold)] font-decorative">
                  ({selectedStyle.japaneseName})
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-[var(--color-forest-green)] hover:bg-[var(--color-dark-forest)]
                         text-[var(--color-beige-white)] font-bold rounded-lg
                         border-2 border-[var(--color-metallic-gold)]
                         transition-all hover:scale-105 active:scale-95
                         min-w-[100px]"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                         text-[var(--color-beige-white)] font-bold rounded-lg
                         border-2 border-[var(--color-golden-yellow)]
                         transition-all hover:scale-105 active:scale-95
                         min-w-[100px]"
            >
              {t('common.confirm', 'Confirm')}
            </button>
          </div>
        </div>
      </AnimatedDiv>
    </AnimatedDiv>,
    document.body
  )
}

export default TableStyleModal
