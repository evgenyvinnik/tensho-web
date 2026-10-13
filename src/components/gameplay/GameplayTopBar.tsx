/**
 * GameplayTopBar Component for Tensho Mahjong Roguelike
 *
 * Top navigation bar showing gold, act/round indicator,
 * and action buttons (exit, settings).
 *
 * @module components/gameplay/GameplayTopBar
 */

import type { ReactNode } from 'react'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { GlowEffect } from '../effects/GlowEffect'
import { RoundTypeIndicator } from './RoundTypeIndicator'
import { RoundType } from './gameplayTypes'
import { getStakeByTier } from '../../config/stakeDefinitions'
import { GoldIcon } from '../ui/GoldIcon'
import { getStakeRules } from '../../i18n/stakeRules'
import { ControlIcon } from '../ui/ControlIcon'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for GameplayTopBar
 */
export interface GameplayTopBarProps {
  /** Current gold amount */
  gold: number
  /** Active difficulty tier */
  stake: number
  /** Current act number */
  currentAct: number
  /** Endless is a run mode, independent of an Act-reducing Charter. */
  hasEnteredEndless: boolean
  /** Current round type */
  roundType: RoundType
  /** Boss mandate name (if applicable) */
  mandateName?: string
  mandateId?: string
  mandateDescription?: string
  /** Upcoming Boss mandate exposed by a reroll Charter */
  upcomingMandateName?: string
  /** Whether the paid reroll can currently be used */
  canRerollMandate?: boolean
  /** Handler for the paid Boss Mandate reroll */
  onRerollMandate?: () => void
  /** Translation function for i18n */
  t: TFunction
  /** Handler for exit button */
  onExit: () => void
  /** Handler for settings button */
  onSettings: () => void
  /** Compact run status (for example the save indicator) beside the menu. */
  status?: ReactNode
}

// =============================================================================
// ICONS
// =============================================================================

const ExitIcon = () => <ControlIcon name="exit" size={24} />

const SettingsIcon = () => <ControlIcon name="settings" size={24} />

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Top bar for gameplay screen.
 *
 * Features:
 * - Gold display with glow effect
 * - Act and round type indicator
 * - Exit and settings buttons
 * - 44px minimum touch targets for accessibility
 */
export function GameplayTopBar({
  gold,
  stake,
  currentAct,
  hasEnteredEndless,
  roundType,
  mandateName,
  mandateId,
  mandateDescription,
  upcomingMandateName,
  canRerollMandate = false,
  onRerollMandate,
  t,
  onExit,
  onSettings,
  status,
}: GameplayTopBarProps) {
  const { i18n } = useTranslation()
  const stakeDefinition = getStakeByTier(stake)
  const language = i18n.resolvedLanguage ?? i18n.language
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 20 })
  const stakeRules = getStakeRules(t, language, stake).join('\n')
  const actProgress = t('gameplay.actProgress', {
    current: number.format(currentAct),
    total: number.format(8),
  })
  const rerollLabel = t('gameplay.rerollMandate', {
    name: upcomingMandateName ?? '',
    cost: number.format(10),
  })

  return (
    <div
      data-frame-corner-row="top"
      className="gameplay-frame-corner-row flex items-center justify-between rounded-sm bg-[var(--color-dark-forest)] px-1 py-1 text-[var(--color-beige-white)] sm:px-4"
    >
      {/* Gold display */}
      <div className="flex flex-col items-start">
        <GlowEffect variant="gold" intensity={0.4} pulsing={false}>
          <span
            data-tutorial="gold"
            className="inline-flex items-center gap-1 text-lg font-bold text-[var(--color-golden-yellow)]"
            aria-label={t('shop.ui.goldBalance', {
              amount: number.format(gold),
            })}
          >
            <GoldIcon className="h-6 w-6" />
            {gold}
          </span>
        </GlowEffect>
        <span
          data-gameplay-top-bar-stake
          className="whitespace-nowrap text-[9px] font-black uppercase tracking-wider"
          style={{ color: stakeDefinition?.color }}
          title={stakeRules}
        >
          {t('gameplay.stake', 'Stake {{tier}}', { tier: stake })}
        </span>
        <span
          data-gameplay-top-bar-compact-progress
          className="hidden whitespace-nowrap text-[9px] font-black uppercase tracking-wider"
          style={{ color: stakeDefinition?.color }}
          title={stakeRules}
        >
          {t('gameplay.act')} {currentAct} · S{stake}
        </span>
      </div>

      {/* Act/Round with Round Type indicator */}
      <div
        data-tutorial="act-round"
        className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1 sm:gap-2"
      >
        {/* One chip: which Act, how far through the run, and this round. */}
        <RoundTypeIndicator
          roundType={roundType}
          mandateName={mandateName}
          mandateId={mandateId}
          mandateDescription={mandateDescription}
          lead={
            <span
              data-gameplay-top-bar-act
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className="text-sm font-semibold text-[var(--color-beige-white)] sm:text-base">
                {t('gameplay.act')} {currentAct}
              </span>
              {hasEnteredEndless && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-purple-300">
                  {t('gameplay.endless', 'Endless')}
                </span>
              )}
              <span aria-hidden="true" className="opacity-40">
                ·
              </span>
            </span>
          }
          progress={
            hasEnteredEndless ? undefined : (
              <span
                className="flex gap-0.5"
                role="img"
                aria-label={actProgress}
                title={actProgress}
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <span
                    key={index}
                    className={`h-0.5 flex-1 rounded-full ${
                      index < currentAct
                        ? 'bg-[var(--color-golden-yellow)]'
                        : 'bg-white/15'
                    }`}
                  />
                ))}
              </span>
            )
          }
        />
        {upcomingMandateName && onRerollMandate && (
          <button
            type="button"
            onClick={onRerollMandate}
            disabled={!canRerollMandate}
            className="min-h-[44px] max-w-40 rounded border border-[var(--color-metallic-gold)] px-2 py-1 text-xs text-[var(--color-golden-yellow)] disabled:cursor-not-allowed disabled:opacity-45"
            title={rerollLabel}
            aria-label={rerollLabel}
          >
            <span data-gameplay-top-bar-reroll-label>
              ↻ {upcomingMandateName} · 10G
            </span>
            <span data-gameplay-top-bar-reroll-compact className="hidden">
              ↻ 10G
            </span>
          </button>
        )}
      </div>

      <div className="relative flex shrink-0 items-center gap-0 sm:gap-2">
        {/* Phones show the status as a badge on the corner, using no width. */}
        {status && (
          <div className="pointer-events-none max-sm:absolute max-sm:-top-0.5 max-sm:right-0 max-sm:z-10">
            {status}
          </div>
        )}
        {/* Exit button */}
        <button
          onClick={onExit}
          className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-300"
          aria-label={t('common.exit')}
        >
          <ExitIcon />
        </button>

        {/* Settings button */}
        <button
          onClick={onSettings}
          className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={t('menu.settings')}
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default GameplayTopBar
