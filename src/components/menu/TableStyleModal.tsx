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
import { STAKE_DEFINITIONS } from '../../config/stakeDefinitions'
import { getCurrentLanguage } from '../../i18n'
import { useStakeStore } from '../../stores/stakeStore'
import { getTableStyleIllustration } from '../../utils/assets'
import { useItemText } from '../../i18n/useItemText'

const AnimatedDiv = animated('div')

/** Check if current language uses CJK characters */
function isCJKLanguage(): boolean {
  const lang = getCurrentLanguage()
  return (
    lang === 'ja' || lang === 'ko' || lang === 'zh-Hant' || lang === 'zh-Hans'
  )
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
  const itemText = useItemText()
  const { t } = useTranslation()
  const showCJK = isCJKLanguage()
  const {
    currentStyleId,
    selectStyle,
    isStyleUnlocked,
    getUnlockProgress,
    getCurrentStyle,
  } = useTableStyleStore()
  const {
    currentStakeTier,
    currentWallId,
    selectStake,
    getHighestAvailableStake,
  } = useStakeStore()

  // Track temporarily selected style (before confirmation)
  const [tempSelectedId, setTempSelectedId] = React.useState(currentStyleId)
  const [tempStakeTier, setTempStakeTier] = React.useState(
    currentWallId === currentStyleId ? currentStakeTier : 1
  )

  // Reset temp selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedId(currentStyleId)
      setTempStakeTier(currentWallId === currentStyleId ? currentStakeTier : 1)
    }
  }, [isOpen, currentStyleId, currentStakeTier, currentWallId])

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
  const handleStyleSelect = useCallback(
    (styleId: string) => {
      setTempSelectedId(styleId)
      setTempStakeTier((tier) =>
        Math.min(tier, getHighestAvailableStake(styleId))
      )
    },
    [getHighestAvailableStake]
  )

  // Handle confirm
  const handleConfirm = useCallback(() => {
    const styleSelected = selectStyle(tempSelectedId)
    const stakeSelected = selectStake(tempSelectedId, tempStakeTier)
    if (styleSelected && stakeSelected) {
      onConfirm?.(tempSelectedId)
      onClose()
    }
  }, [
    tempSelectedId,
    tempStakeTier,
    selectStyle,
    selectStake,
    onConfirm,
    onClose,
  ])

  // Handle cancel
  const handleCancel = useCallback(() => {
    setTempSelectedId(currentStyleId) // Reset to original
    setTempStakeTier(currentWallId === currentStyleId ? currentStakeTier : 1)
    onClose()
  }, [currentStyleId, currentStakeTier, currentWallId, onClose])

  // Get the currently selected style for preview
  const selectedStyle =
    TABLE_STYLE_DEFINITIONS.find((s) => s.id === tempSelectedId) ??
    getCurrentStyle()
  const selectedStake = STAKE_DEFINITIONS[tempStakeTier - 1]
  const highestAvailableStake = getHighestAvailableStake(tempSelectedId)

  if (!isOpen) return null

  return createPortal(
    <AnimatedDiv
      data-table-style-backdrop
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        opacity: backdropSpring.opacity,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      }}
      onClick={handleBackdropClick}
    >
      <AnimatedDiv
        data-table-style-modal
        className="relative flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border-3 border-[var(--color-saddle-brown)]"
        style={{
          opacity: modalSpring.opacity,
          transform: modalSpring.scale.to(
            (s) => `scale(${s}) translateY(${modalSpring.y.get()}px)`
          ),
          backgroundColor: 'var(--color-dark-forest)',
        }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          data-table-style-header
          className="relative flex-shrink-0 overflow-hidden border-b-2 border-[var(--color-saddle-brown)] px-4 py-4 sm:px-6 sm:py-5"
        >
          <img
            src={getTableStyleIllustration(selectedStyle.id)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-[var(--color-dark-forest)]/80 to-black/65" />

          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-[var(--color-forest-green)] hover:bg-[var(--color-vibrant-orange)]
                       border-2 border-[var(--color-metallic-gold)] hover:border-[var(--color-golden-yellow)]
                       text-[var(--color-beige-white)] hover:text-white
                       transition-all hover:scale-110 active:scale-95
                       min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={t('common.close', 'Close')}
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

          <div className="relative flex items-center gap-3 pr-12 sm:gap-4 sm:pr-0">
            {/* Selected table miniature */}
            <div
              className="hidden h-12 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 border-white/25 shadow-lg sm:block sm:h-14 sm:w-20"
              style={{ boxShadow: `0 0 16px ${selectedStyle.themeColor}55` }}
            >
              <img
                src={getTableStyleIllustration(selectedStyle.id)}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <h2 className="font-decorative text-xl font-bold text-[var(--color-golden-yellow)] sm:text-2xl">
                {t('tableStyle.title', 'Choose Table')}
              </h2>
              <p className="text-xs text-[var(--color-beige-white)] opacity-70 sm:text-sm">
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

        {/* Stake selection: difficulty and per-table progression */}
        <section className="flex-shrink-0 border-b-2 border-[var(--color-saddle-brown)] bg-black/15 px-4 py-3 sm:px-6">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-metallic-gold)]">
                {t('menu.tableStakeDifficulty', 'Table Stake · Difficulty')}
              </p>
              <p className="text-sm font-bold text-[var(--color-beige-white)]">
                {selectedStake?.name}{' '}
                <span className="opacity-60">
                  {selectedStake?.japaneseName}
                </span>
              </p>
            </div>
            <p className="max-w-md text-right text-xs text-[var(--color-beige-white)]/70">
              {selectedStake?.description}
            </p>
          </div>

          <div
            className="grid grid-cols-4 gap-1.5 sm:grid-cols-8"
            role="radiogroup"
            aria-label={t('menu.tableStake', 'Table stake')}
          >
            {STAKE_DEFINITIONS.map((stake) => {
              const unlocked = stake.tier <= highestAvailableStake
              const selected = stake.tier === tempStakeTier

              return (
                <button
                  key={stake.tier}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${stake.name}: ${unlocked ? stake.description : 'Locked; defeat the previous stake on this table'}`}
                  disabled={!unlocked}
                  onClick={() => setTempStakeTier(stake.tier)}
                  className={`min-h-[42px] rounded-lg border text-sm font-black transition-all duration-150 sm:min-h-[46px] ${
                    selected
                      ? 'scale-[1.04] text-white shadow-lg'
                      : unlocked
                        ? 'text-white/75 hover:-translate-y-0.5 hover:text-white'
                        : 'cursor-not-allowed border-white/5 bg-black/25 text-white/20'
                  }`}
                  style={
                    unlocked
                      ? {
                          borderColor: `${stake.color}${selected ? 'FF' : '70'}`,
                          backgroundColor: `${stake.color}${selected ? '35' : '12'}`,
                          boxShadow: selected
                            ? `0 0 16px ${stake.color}45`
                            : undefined,
                        }
                      : undefined
                  }
                  title={
                    unlocked
                      ? stake.description
                      : 'Defeat the previous stake on this table to unlock'
                  }
                >
                  {unlocked ? stake.tier : '·'}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[10px] text-[var(--color-beige-white)]/50">
            {tempStakeTier < 8
              ? `Progress is tracked separately for each table. Win Stake ${tempStakeTier} to unlock Stake ${tempStakeTier + 1} here.`
              : 'Gold Stake is the final challenge for this table.'}
          </p>
        </section>

        {/* Content - Scrollable grid */}
        <div
          data-table-style-list
          className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
        >
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
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
        <div
          data-table-style-footer
          className="flex flex-shrink-0 flex-col gap-3 border-t-2 border-[var(--color-saddle-brown)] bg-[var(--color-dark-forest)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4"
        >
          {/* Currently selected info */}
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={getTableStyleIllustration(selectedStyle.id)}
              alt=""
              aria-hidden="true"
              className="h-10 w-14 shrink-0 rounded-lg border border-white/20 object-cover shadow-md"
            />
            <div className="min-w-0">
              <span className="text-sm text-[var(--color-beige-white)] opacity-70">
                {t('tableStyle.selected', 'Selected:')}
              </span>
              <span className="ml-2 text-[var(--color-beige-white)] font-bold">
                {itemText.name('tableStyles', {
                  ...selectedStyle,
                  name: selectedStyle.displayName,
                })}
              </span>
              <span
                className="ml-2 text-xs font-black uppercase"
                style={{ color: selectedStake?.color }}
              >
                ·{' '}
                {t('gameplay.stake', 'Stake {{tier}}', { tier: tempStakeTier })}
              </span>
              {showCJK && (
                <span className="ml-2 text-[var(--color-metallic-gold)] font-decorative">
                  ({selectedStyle.japaneseName})
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-[var(--color-forest-green)] hover:bg-[var(--color-dark-forest)]
                         text-[var(--color-beige-white)] font-bold rounded-lg
                         border-2 border-[var(--color-metallic-gold)]
                         transition-all hover:scale-105 active:scale-95
                         w-full sm:min-w-[100px]"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                         text-[var(--color-beige-white)] font-bold rounded-lg
                         border-2 border-[var(--color-golden-yellow)]
                         transition-all hover:scale-105 active:scale-95
                         w-full sm:min-w-[100px]"
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
