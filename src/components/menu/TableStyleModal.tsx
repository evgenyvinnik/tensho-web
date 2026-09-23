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
import { useProgressionStore } from '../../stores/progressionStore'
import { getTableStyleIllustration } from '../../utils/assets'
import { useItemText } from '../../i18n/useItemText'
import { getStakeRules, STAKE_NAME_KEYS } from '../../i18n/stakeRules'
import { useReducedMotion } from '../../hooks/useReducedMotion'

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
  const { t, i18n } = useTranslation()
  const reduceMotion = useReducedMotion()
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const backdropPress = React.useRef(false)
  const titleId = React.useId()
  const showCJK = isCJKLanguage()
  const fullUnlockEnabled = useProgressionStore(
    (state) => state.fullUnlockEnabled
  )
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
  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.9,
    y: isOpen ? 0 : 30,
    immediate: reduceMotion,
    config: { tension: 300, friction: 20 },
  })

  // Native modality isolates background controls; focus returns to the opener.
  React.useEffect(() => {
    if (!isOpen) return
    const previous = document.activeElement
    const dialog = dialogRef.current!
    dialog.showModal()
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      dialog.close()
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true })
    }
  }, [isOpen])

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
  const activeRules = getStakeRules(
    t,
    i18n.resolvedLanguage ?? i18n.language,
    tempStakeTier
  )

  if (!isOpen) return null

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      data-table-style-backdrop
      className="fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none overflow-hidden border-0 open:flex items-center justify-center p-3 sm:p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
      onCancel={(event) => {
        event.preventDefault()
        handleCancel()
      }}
      onPointerDown={(event) => {
        backdropPress.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && backdropPress.current)
          handleCancel()
        backdropPress.current = false
      }}
      onKeyDown={(event) => {
        if (
          event.key !== 'Tab' ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        )
          return
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), summary'
          )
        ).filter((control) => control.tabIndex >= 0)
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
    >
      <AnimatedDiv
        data-table-style-modal
        className="relative flex w-full max-w-4xl max-h-full min-h-0 flex-col overflow-hidden rounded-2xl border-3 border-[var(--color-saddle-brown)]"
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
            ref={closeRef}
            onClick={handleCancel}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-[var(--color-forest-green)] hover:bg-[var(--color-vibrant-orange)]
                       border-2 border-[var(--color-metallic-gold)] hover:border-[var(--color-golden-yellow)]
                       text-[var(--color-beige-white)] hover:text-white
                       transition-colors
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
              <h2
                id={titleId}
                className="font-decorative text-xl font-bold text-[var(--color-golden-yellow)] sm:text-2xl"
              >
                {t('tableStyle.title', 'Choose Table')}
              </h2>
              <p className="text-xs text-[var(--color-beige-white)] opacity-70 sm:text-sm">
                {t('tableStyle.subtitle', 'Select a table style for your run')}
              </p>
            </div>

            {/* Japanese title - only show for CJK languages */}
            {showCJK && (
              <span className="ml-auto hidden shrink-0 whitespace-nowrap text-3xl font-decorative text-[var(--color-metallic-gold)] opacity-70 pr-12 sm:block">
                {t('tableStyle.titleJp', '卓風')}
              </span>
            )}
          </div>
        </div>

        {/* One scroll area keeps both rules and cards reachable on short screens. */}
        <div
          data-table-style-list
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {/* Stake selection: difficulty and per-table progression */}
          <section className="flex-shrink-0 border-b-2 border-[var(--color-saddle-brown)] bg-black/15 px-4 py-3 sm:px-6">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-metallic-gold)]">
                  {t('menu.tableStakeDifficulty', 'Table Stake · Difficulty')}
                </p>
                <p className="text-sm font-bold text-[var(--color-beige-white)]">
                  {t(`stakes.${STAKE_NAME_KEYS[tempStakeTier - 1]}`)}{' '}
                  {showCJK && (
                    <span className="opacity-60">
                      {selectedStake?.japaneseName}
                    </span>
                  )}
                </p>
              </div>
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
                    aria-label={`${t(`stakes.${STAKE_NAME_KEYS[stake.tier - 1]}`)}: ${unlocked ? t('gameplay.stake', { tier: stake.tier }) : t('stakes.locked')}`}
                    disabled={!unlocked}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setTempStakeTier(stake.tier)}
                    onKeyDown={(event) => {
                      if (event.altKey || event.ctrlKey || event.metaKey) return
                      const step =
                        event.key === 'ArrowRight' || event.key === 'ArrowDown'
                          ? 1
                          : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                            ? -1
                            : 0
                      if (!step && event.key !== 'Home' && event.key !== 'End')
                        return
                      event.preventDefault()
                      const next =
                        event.key === 'Home'
                          ? 1
                          : event.key === 'End'
                            ? highestAvailableStake
                            : ((stake.tier - 1 + step + highestAvailableStake) %
                                highestAvailableStake) +
                              1
                      setTempStakeTier(next)
                      const radios =
                        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                          '[role="radio"]'
                        )
                      radios?.[next - 1]?.focus()
                    }}
                    className={`min-h-[44px] rounded-lg border text-sm font-black transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-golden-yellow)] sm:min-h-[46px] ${
                      selected
                        ? 'text-white shadow-lg'
                        : unlocked
                          ? 'text-white/75 hover:text-white'
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
                        ? t(`stakes.${STAKE_NAME_KEYS[stake.tier - 1]}`)
                        : t('stakes.locked')
                    }
                  >
                    {stake.tier}
                  </button>
                )
              })}
            </div>
            <details className="mt-3 text-xs leading-relaxed text-[var(--color-beige-white)]/85">
              <summary className="min-h-11 cursor-pointer content-center font-semibold text-[var(--color-metallic-gold)]">
                {t('stakes.rulesTitle')}
              </summary>
              <p>{t('stakes.cumulative')}</p>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                {activeRules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </details>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-beige-white)]/70">
              {fullUnlockEnabled
                ? t('settings.fullUnlock.active')
                : highestAvailableStake < 8
                  ? t('stakes.progression', {
                      current: highestAvailableStake,
                      next: highestAvailableStake + 1,
                    })
                  : t('stakes.finalTier')}
            </p>
          </section>

          {/* Content - Scrollable grid */}
          <div className="p-4 sm:p-6">
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
                <span className="ml-2 hidden whitespace-nowrap text-[var(--color-metallic-gold)] font-decorative sm:inline">
                  ({selectedStyle.japaneseName})
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
            <button
              onClick={handleCancel}
              className="whitespace-nowrap px-2 py-3 sm:px-6 bg-[var(--color-forest-green)] hover:bg-[var(--color-dark-forest)]
                         text-[var(--color-beige-white)] font-bold rounded-lg
                         border-2 border-[var(--color-metallic-gold)]
                         transition-colors
                         w-full sm:min-w-[100px]"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={handleConfirm}
              className="whitespace-nowrap px-2 py-3 sm:px-6 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                         text-[var(--color-beige-white)] font-bold rounded-lg
                         border-2 border-[var(--color-golden-yellow)]
                         transition-colors
                         w-full sm:min-w-[100px]"
            >
              {t('common.confirm', 'Confirm')}
            </button>
          </div>
        </div>
      </AnimatedDiv>
    </dialog>,
    document.body
  )
}

export default TableStyleModal
