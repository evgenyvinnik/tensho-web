/**
 * RunHeader: the round at a glance, in one row.
 *
 *   [Gold]  Act 1 · Small Round   120 / 300   [?] [Exit] [Settings]
 *   ───────────────── round progress ─────────────────
 *   [boss icon] The Manacle · Rack −1                 (Boss rounds only)
 *
 * Long translations wrap inside the label instead of pushing the controls
 * off screen; scores use compact numbers with the exact value on hover and
 * for screen readers.
 *
 * @module components/gameplay/RunHeader
 */

import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { GoldIcon } from '../ui/GoldIcon'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import { getStakeRules } from '../../i18n/stakeRules'
import { scoreNumber } from '../../utils/scoreNumber'
import { getMandateIllustration } from '../../utils/assets'
import type { MandateDefinition } from '../../config/mandateDefinitions'
import { mandateConsequence } from '../../gameplay/mandateConsequence'
import { MandateEffectIcon } from './MandateEffectIcon'
import type { RoundType } from './gameplayTypes'

export interface RunHeaderProps {
  gold: number
  stake: number
  currentAct: number
  hasEnteredEndless: boolean
  roundType: RoundType
  score: number
  target: number
  mandate?: Pick<MandateDefinition, 'id' | 'effect'> & {
    name: string
    description: string
  }
  /** A Charter lets the player reroll the upcoming Boss for 10 Gold. */
  reroll?: {
    upcomingName: string
    allowed: boolean
    onReroll: () => void
  }
  onHelp: () => void
  onExit: () => void
  onSettings: () => void
  /** Compact save status beside the controls. */
  status?: ReactNode
}

const IconButton = ({
  label,
  onClick,
  children,
  className = '',
  testId,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  className?: string
  testId?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    data-testid={testId}
    className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[var(--color-golden-yellow)] ${className}`}
  >
    {children}
  </button>
)

export function RunHeader({
  gold,
  stake,
  currentAct,
  hasEnteredEndless,
  roundType,
  score,
  target,
  mandate,
  reroll,
  onHelp,
  onExit,
  onSettings,
  status,
}: RunHeaderProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const number = new Intl.NumberFormat(language)
  const stakeRules = getStakeRules(t, language, stake).join('\n')
  const cleared = score >= target
  const progress = target > 0 ? Math.min(100, (score / target) * 100) : 0
  const scoreText = scoreNumber(score, language)
  const targetText = scoreNumber(target, language)
  const roundName = t('gameplay.roundTitle', {
    act: number.format(currentAct),
    round: t(`rounds.${roundType.toLowerCase()}Short`, roundType),
  })

  return (
    <header
      data-frame-corner-row="top"
      data-run-header
      className="gameplay-frame-corner-row rounded-sm bg-[var(--color-dark-forest)] px-1 pt-1 text-[var(--color-beige-white)] sm:px-3"
    >
      {/* Act and round, then this round's score against its target: one row. */}
      <div
        data-tutorial="act-round"
        className="flex min-w-0 items-baseline justify-between gap-2 px-1"
      >
        <h1
          data-run-header-round
          className="min-w-0 truncate text-sm font-semibold leading-tight sm:text-base"
        >
          {roundName}
          {hasEnteredEndless && (
            <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-purple-300">
              {t('gameplay.endless', 'Endless')}
            </span>
          )}
        </h1>
        <p
          data-run-header-score
          className="shrink-0 whitespace-nowrap text-sm font-black tabular-nums leading-tight sm:text-lg"
          aria-label={t('gameplay.scoreOfTarget', {
            score: scoreText.exact,
            target: targetText.exact,
          })}
          title={`${scoreText.exact} / ${targetText.exact}`}
        >
          <span
            data-tutorial="current-score"
            className={
              cleared ? 'text-emerald-300' : 'text-[var(--color-golden-yellow)]'
            }
          >
            {scoreText.display}
          </span>
          <span className="mx-0.5 opacity-50">/</span>
          <span data-tutorial="score-target">{targetText.display}</span>
        </p>
      </div>

      {/* Round progress and Gold, then help, exit and settings. */}
      <div className="flex min-w-0 items-center gap-2 pl-1">
        <div
          role="progressbar"
          aria-label={t('gameplay.score')}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={Math.max(0, Math.min(score, target))}
          aria-valuetext={t('gameplay.scoreOfTarget', {
            score: scoreText.exact,
            target: targetText.exact,
          })}
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              cleared ? 'bg-emerald-400' : 'bg-[var(--color-vibrant-orange)]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span
          data-tutorial="gold"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums text-[var(--color-golden-yellow)]"
          aria-label={t('shop.ui.goldBalance', {
            amount: number.format(gold),
          })}
          title={stakeRules}
        >
          <GoldIcon className="h-4 w-4" />
          {number.format(gold)}
        </span>
        <div className="relative flex shrink-0 items-center">
          {status && (
            <div className="pointer-events-none max-sm:absolute max-sm:-top-0.5 max-sm:right-0 max-sm:z-10">
              {status}
            </div>
          )}
          <IconButton
            label={t('gameplay.help', 'How to play')}
            onClick={onHelp}
            testId="gameplay-help"
            className="text-lg font-black text-[var(--color-golden-yellow)]"
          >
            <span aria-hidden="true">?</span>
          </IconButton>
          <IconButton
            label={t('common.exit')}
            onClick={onExit}
            className="text-red-300"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </IconButton>
          <IconButton label={t('menu.settings')} onClick={onSettings}>
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
            </svg>
          </IconButton>
        </div>
      </div>

      {(mandate || reroll) && (
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 pb-1">
          {mandate && <BossMandateBadge mandate={mandate} />}
          {reroll && (
            <button
              type="button"
              onClick={reroll.onReroll}
              disabled={!reroll.allowed}
              className="min-h-11 rounded border border-[var(--color-metallic-gold)] px-2 py-1 text-xs text-[var(--color-golden-yellow)] disabled:cursor-not-allowed disabled:opacity-45"
              title={t('gameplay.rerollMandate', {
                name: reroll.upcomingName,
                cost: number.format(10),
              })}
              aria-label={t('gameplay.rerollMandate', {
                name: reroll.upcomingName,
                cost: number.format(10),
              })}
            >
              ↻ {reroll.upcomingName} · {number.format(10)}G
            </button>
          )}
        </div>
      )}
    </header>
  )
}

/** The Boss's effect as an icon and a few words; details on tap or hover. */
export function BossMandateBadge({
  mandate,
}: {
  mandate: NonNullable<RunHeaderProps['mandate']>
}) {
  const { t } = useTranslation()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const consequence = mandateConsequence(mandate.effect)
  const text = t(`mandateConsequence.${consequence.key}`, {
    ...consequence.values,
    target:
      typeof consequence.values.targetKey === 'string' &&
      consequence.values.targetKey
        ? t(consequence.values.targetKey)
        : '',
  })
  const art = getMandateIllustration(mandate.id)
  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-mandate-details={mandate.id}
        data-mandate-effect={mandate.effect.type}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${mandate.name}: ${text}`}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 min-w-0 items-center gap-2 rounded-full border border-red-400/60 bg-red-950/50 py-1 pl-1 pr-3 text-left text-xs text-red-100 shadow-[0_0_14px_rgba(248,113,113,0.25)] focus-visible:outline-2 focus-visible:outline-[var(--color-golden-yellow)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-900/70 text-red-200">
          <MandateEffectIcon type={mandate.effect.type} />
        </span>
        <span className="min-w-0 leading-tight [overflow-wrap:anywhere]">
          <span className="block font-bold">{mandate.name}</span>
          <span data-mandate-consequence className="block text-red-200">
            {text}
          </span>
        </span>
      </button>
      <AnchoredPopover
        open={open}
        anchorRef={anchorRef}
        title={mandate.name}
        onClose={() => setOpen(false)}
      >
        <div className="flex items-start gap-3">
          {art ? (
            <img
              src={art}
              alt=""
              className="h-20 w-20 shrink-0 object-contain"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-900/60 text-red-200">
              <MandateEffectIcon
                type={mandate.effect.type}
                className="h-10 w-10"
              />
            </span>
          )}
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <p className="font-bold text-red-200">{text}</p>
            <p className="mt-1 text-sm leading-relaxed">
              {mandate.description}
            </p>
          </div>
        </div>
      </AnchoredPopover>
    </>
  )
}

export default RunHeader
