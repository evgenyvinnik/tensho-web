/**
 * GameplayTopBar Component for Tensho Mahjong Roguelike
 *
 * Top navigation bar showing gold, act/round indicator,
 * and action buttons (exit, settings).
 *
 * @module components/gameplay/GameplayTopBar
 */

import { TFunction } from 'i18next'
import { GlowEffect } from '../effects/GlowEffect'
import { RoundTypeIndicator } from './RoundTypeIndicator'
import { RoundType } from './gameplayTypes'
import { getStakeByTier } from '../../config/stakeDefinitions'

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
  /** Current round type */
  roundType: RoundType
  /** Boss mandate name (if applicable) */
  mandateName?: string
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
}

// =============================================================================
// ICONS
// =============================================================================

const ExitIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
  </svg>
)

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
  roundType,
  mandateName,
  upcomingMandateName,
  canRerollMandate = false,
  onRerollMandate,
  t,
  onExit,
  onSettings,
}: GameplayTopBarProps) {
  const stakeDefinition = getStakeByTier(stake)

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-dark-forest)] text-[var(--color-beige-white)]">
      {/* Gold display */}
      <div className="flex flex-col items-start">
        <GlowEffect variant="gold" intensity={0.4} pulsing={false}>
          <span data-tutorial="gold" className="text-lg font-bold text-[var(--color-golden-yellow)]">
            ¥{gold}
          </span>
        </GlowEffect>
        <span
          className="text-[9px] font-black uppercase tracking-wider"
          style={{ color: stakeDefinition?.color }}
          title={stakeDefinition?.description}
        >
          Stake {stake}
        </span>
      </div>

      {/* Act/Round with Round Type indicator */}
      <div data-tutorial="act-round" className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <span className="text-base leading-tight sm:text-lg">
            {t('gameplay.act')} {currentAct}
          </span>
          {currentAct <= 8 ? (
            <div
              className="mt-1 flex gap-1"
              aria-label={`Act ${currentAct} of 8`}
              title={`Act ${currentAct} of 8`}
            >
              {Array.from({ length: 8 }, (_, index) => (
                <span
                  key={index}
                  className={`h-1 w-2 rounded-full ${
                    index < currentAct
                      ? 'bg-[var(--color-golden-yellow)]'
                      : 'bg-white/15'
                  }`}
                />
              ))}
            </div>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-widest text-purple-300">
              Endless
            </span>
          )}
        </div>
        <RoundTypeIndicator roundType={roundType} mandateName={mandateName} />
        {upcomingMandateName && onRerollMandate && (
          <button
            type="button"
            onClick={onRerollMandate}
            disabled={!canRerollMandate}
            className="min-h-[44px] max-w-40 rounded border border-[var(--color-metallic-gold)] px-2 py-1 text-xs text-[var(--color-golden-yellow)] disabled:cursor-not-allowed disabled:opacity-45"
            title={`Reroll upcoming Boss Mandate for 10 Gold: ${upcomingMandateName}`}
            aria-label={`Reroll ${upcomingMandateName} for 10 Gold`}
          >
            ↻ {upcomingMandateName} · 10G
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Exit button */}
        <button
          onClick={onExit}
          className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-300"
          aria-label={t('common.exit', 'Exit')}
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
