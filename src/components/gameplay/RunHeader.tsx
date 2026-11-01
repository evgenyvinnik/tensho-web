/**
 * RunHeader: the round at a glance, in one row.
 *
 *   Act 1 · Small Round                         120 / 300
 *   ──── round progress ────  [2] [Gold]  [?] [Exit] [Settings]
 *   ([2] is the Stake; tapping it lists the Stake's active rules)
 *   [boss art] The Manacle · Rack −1                  (Boss rounds only)
 *              The full rule (tablet and desktop; on a phone, on tap)
 *
 * Long translations wrap inside the label instead of pushing the controls
 * off screen; scores use compact numbers with the exact value on hover and
 * for screen readers.
 *
 * @module components/gameplay/RunHeader
 */

import { useId, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { GoldIcon } from '../ui/GoldIcon'
import { ControlIcon } from '../ui/ControlIcon'
import { AnchoredPopover } from '../ui/AnchoredPopover'
import { getStakeRules, STAKE_NAME_KEYS } from '../../i18n/stakeRules'
import { getStakeByTier } from '../../config/stakeDefinitions'
import { scoreNumber } from '../../utils/scoreNumber'
import { getMandateIllustration } from '../../utils/assets'
import type { MandateDefinition } from '../../config/mandateDefinitions'
import type { PlayPatternId } from '../../rules/PlayPattern'
import { mandateConsequence } from '../../gameplay/mandateConsequence'
import { useMediaQuery } from '../../hooks/useMediaQuery'
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
    /** The hand type The Mouth fixed with the round's first play. */
    lockedPattern?: PlayPatternId | null
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
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10 max-[359px]:invisible"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              cleared ? 'bg-emerald-400' : 'bg-[var(--color-vibrant-orange)]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <StakeBadge stake={stake} />
        <span
          data-tutorial="gold"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums text-[var(--color-golden-yellow)]"
          aria-label={t('shop.ui.goldBalance', {
            amount: number.format(gold),
          })}
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
            <ControlIcon name="help" size={28} />
          </IconButton>
          <IconButton
            label={t('common.exit')}
            onClick={onExit}
            className="text-red-300"
          >
            <ControlIcon name="exit" size={28} />
          </IconButton>
          <IconButton label={t('menu.settings')} onClick={onSettings}>
            <ControlIcon name="settings" size={28} />
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

/**
 * The run's Stake as a coloured tier number. Its rules change the round
 * without showing on the table, so a tap (or hover) lists them.
 */
export function StakeBadge({ stake }: { stake: number }) {
  const { t, i18n } = useTranslation()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const language = i18n.resolvedLanguage ?? i18n.language
  const definition = getStakeByTier(stake)
  const nameKey = STAKE_NAME_KEYS[stake - 1]
  if (!definition || !nameKey) return null
  const name = t(`stakes.${nameKey}`)
  const rules = getStakeRules(t, language, stake)
  const label = `${name} · ${t('stakes.rulesTitle')}`

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-run-header-stake={stake}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        title={[name, ...rules].join('\n')}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[var(--color-golden-yellow)]"
      >
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-black tabular-nums"
          style={{
            borderColor: definition.color,
            backgroundColor: `${definition.color}33`,
            color: '#fff',
          }}
        >
          {new Intl.NumberFormat(language).format(stake)}
        </span>
      </button>
      <AnchoredPopover
        open={open}
        anchorRef={anchorRef}
        title={name}
        onClose={() => setOpen(false)}
      >
        <div data-stake-rules={stake} className="[overflow-wrap:anywhere]">
          <p
            className="text-xs font-black uppercase tracking-wider"
            style={{ color: definition.color }}
          >
            {t('gameplay.stake', { tier: stake })} · {t('stakes.rulesTitle')}
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          {stake > 1 && (
            <p className="mt-2 text-xs leading-snug opacity-75">
              {t('stakes.cumulative')}
            </p>
          )}
        </div>
      </AnchoredPopover>
    </>
  )
}

/** From tablet width up the header has room for the Boss's full rule. */
const INLINE_RULES_QUERY = '(min-width: 640px)'

const BADGE_FRAME =
  'border border-red-400/60 bg-red-950/50 text-left text-red-100 shadow-[0_0_14px_rgba(248,113,113,0.25)]'

/**
 * The Boss's portrait, name and consequence. On tablets and desktops the full
 * rule is written beside them; on a phone it opens on tap.
 */
export function BossMandateBadge({
  mandate,
}: {
  mandate: NonNullable<RunHeaderProps['mandate']>
}) {
  const { t } = useTranslation()
  const inline = useMediaQuery(INLINE_RULES_QUERY)
  const nameId = useId()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const consequence = mandateConsequence(mandate.effect, mandate.lockedPattern)
  const { targetKey, patternKey } = consequence.values
  const text = t(`mandateConsequence.${consequence.key}`, {
    ...consequence.values,
    target: typeof targetKey === 'string' && targetKey ? t(targetKey) : '',
    pattern: typeof patternKey === 'string' ? t(patternKey) : '',
  })
  const art = getMandateIllustration(mandate.id)

  if (inline)
    return (
      <section
        data-mandate-details={mandate.id}
        data-mandate-effect={mandate.effect.type}
        aria-labelledby={nameId}
        className={`flex min-w-0 max-w-xl items-center gap-3 rounded-2xl py-1 pl-1.5 pr-4 ${BADGE_FRAME}`}
      >
        {art && (
          <img src={art} alt="" className="h-14 w-14 shrink-0 object-contain" />
        )}
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <p className="text-sm leading-tight">
            <span id={nameId} className="font-bold">
              {mandate.name}
            </span>
            <span aria-hidden="true" className="mx-1.5 text-red-300/70">
              ·
            </span>
            <span data-mandate-consequence className="font-bold text-red-200">
              {text}
            </span>
          </p>
          <p
            data-mandate-description
            className="mt-0.5 text-xs leading-snug text-[var(--color-beige-white)]"
          >
            {mandate.description}
          </p>
        </div>
      </section>
    )

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
        className={`flex min-h-11 min-w-0 items-center gap-2 rounded-full py-0.5 pl-1 pr-3 text-xs focus-visible:outline-2 focus-visible:outline-[var(--color-golden-yellow)] ${BADGE_FRAME}`}
      >
        {art && (
          <img src={art} alt="" className="h-10 w-10 shrink-0 object-contain" />
        )}
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
          {art && (
            <img
              src={art}
              alt=""
              className="h-20 w-20 shrink-0 object-contain"
            />
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
