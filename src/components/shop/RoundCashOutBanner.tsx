import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { animated, useSpring, to } from '@react-spring/web'
import type { RoundCashOutSummary } from '../../game/GameOrchestrator'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { illustrationAssets } from '../../utils/assets'

const AnimatedSection = animated('section')

export interface RoundCashOutBannerProps {
  summary: RoundCashOutSummary
  currentGold: number
  nextActNumber: number
  interestCap: number
  interestBlocked?: boolean
}

interface PayoutChipProps {
  label: string
  value: number
  alwaysShow?: boolean
}

function PayoutChip({ label, value, alwaysShow = false }: PayoutChipProps) {
  const { i18n } = useTranslation()
  if (!alwaysShow && value === 0) return null

  return (
    <span
      className="min-w-0 max-w-full break-words rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-[var(--color-beige-white)]/75"
      data-payout-value={value}
    >
      {label}{' '}
      <strong className={value < 0 ? 'text-red-300' : 'text-emerald-300'}>
        {value >= 0 ? '+' : ''}
        {value.toLocaleString(i18n.resolvedLanguage)}G
      </strong>
    </span>
  )
}

/**
 * Makes a round clear feel like a payoff while teaching the economy and the
 * next difficulty step without introducing another modal.
 */
export function RoundCashOutBanner({
  summary,
  currentGold,
  nextActNumber,
  interestCap,
  interestBlocked = false,
}: RoundCashOutBannerProps) {
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()
  const totalId = useId()
  const number = new Intl.NumberFormat(i18n.resolvedLanguage).format
  const signed = new Intl.NumberFormat(i18n.resolvedLanguage, {
    signDisplay: 'always',
  }).format
  const totalText = `${signed(summary.netGoldChange)}G`
  const totalSize =
    totalText.length > 18
      ? 'text-xs sm:text-lg'
      : totalText.length > 12
        ? 'text-sm sm:text-xl'
        : 'text-xl sm:text-2xl'
  const reduceMotion = useReducedMotion()
  const [hasEntered, setHasEntered] = useState(reduceMotion)
  const projectedInterest = interestBlocked
    ? 0
    : Math.min(Math.floor(currentGold / 5), interestCap)
  const nextInterestThreshold = (projectedInterest + 1) * 5
  const goldToNextInterest = nextInterestThreshold - currentGold
  // The settled total already includes all multipliers. Explain the difference
  // without recomputing or awarding money from the presentation layer.
  const payoutBonus =
    summary.netGoldChange +
    summary.rentalCost -
    summary.baseReward -
    summary.interest -
    summary.decreeGold -
    summary.heldGoldMarkReward -
    (summary.omenGold ?? 0)

  useEffect(() => {
    setHasEntered(true)
  }, [])

  const entrance = useSpring({
    opacity: hasEntered ? 1 : 0,
    y: hasEntered ? 0 : -18,
    scale: hasEntered ? 1 : 0.98,
    config: { tension: 260, friction: 22 },
    immediate: reduceMotion,
  })

  const interestCoach = interestBlocked
    ? t('shop.payout.interestBlocked')
    : projectedInterest >= interestCap
      ? t('shop.payout.interestCap', { interest: signed(interestCap) })
      : t('shop.payout.interestSave', {
          interest: signed(projectedInterest),
          needed: number(goldToNextInterest),
          next: signed(projectedInterest + 1),
        })

  return (
    <AnimatedSection
      data-testid="round-cash-out"
      className="mx-3 mt-2 overflow-hidden rounded-2xl border border-[var(--color-golden-yellow)]/70 bg-[linear-gradient(135deg,rgba(19,52,39,0.98),rgba(9,29,22,0.98))] shadow-[0_16px_50px_rgba(0,0,0,0.3)] sm:mx-4"
      style={{
        opacity: entrance.opacity,
        transform: to(
          [entrance.y, entrance.scale],
          (y, scale) => `translateY(${y}px) scale(${scale})`
        ),
      }}
    >
      <button
        type="button"
        data-payout-toggle
        aria-expanded={expanded}
        aria-controls={detailsId}
        aria-label={t('shop.payoutBreakdown')}
        aria-describedby={totalId}
        onClick={() => setExpanded((value) => !value)}
        className="flex min-h-14 w-full min-w-0 items-center gap-2 px-3 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-amber-200"
      >
        <img
          src={illustrationAssets.settlementLedger}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 object-contain"
        />
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-0.5">
          <span
            data-payout-round
            className="min-w-0 text-sm font-bold text-[var(--color-golden-yellow)] [overflow-wrap:anywhere]"
          >
            {t('shop.payout.heading', {
              act: number(summary.actNumber),
              round: t(`rounds.${summary.roundType.toLowerCase()}`),
            })}
          </span>
          <strong
            id={totalId}
            data-payout-total
            className={`min-w-0 font-black tabular-nums [overflow-wrap:anywhere] ${totalSize} ${
              summary.netGoldChange >= 0 ? 'text-emerald-300' : 'text-red-300'
            }`}
          >
            {totalText}
          </strong>
          {summary.omenId && (
            <span
              data-payout-omen={summary.omenId}
              className="rounded-full border border-purple-300/60 bg-purple-950/60 px-2 py-0.5 text-[11px] font-bold text-purple-100"
            >
              {t('shop.payout.omenEarned', {
                name: t(`omens.items.${summary.omenId}.name`),
              })}
            </span>
          )}
        </span>
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          className={`shrink-0 text-[var(--color-metallic-gold)] ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div id={detailsId} data-payout-details hidden={!expanded}>
        <div className="grid min-w-0 gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(10rem,0.55fr)]">
          <div className="min-w-0">
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={t('shop.payoutBreakdown')}
            >
              <PayoutChip
                label={t('shop.payout.clear')}
                value={summary.baseReward}
                alwaysShow
              />
              <PayoutChip
                label={t('shop.payout.interest')}
                value={summary.interest}
                alwaysShow
              />
              <PayoutChip
                label={t('shop.payout.decrees')}
                value={summary.decreeGold}
              />
              <PayoutChip
                label={t('shop.payout.goldTiles')}
                value={summary.heldGoldMarkReward}
              />
              <PayoutChip label={t('shop.payout.bonus')} value={payoutBonus} />
              <PayoutChip
                label={t('shop.payout.rentals')}
                value={-summary.rentalCost}
              />
              <PayoutChip
                label={t('shop.payout.omen')}
                value={summary.omenGold ?? 0}
              />
            </div>
          </div>

          {/* Settled balance, distinct from the live savings guidance below. */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-black/20 px-4 py-2 md:grid md:content-center md:gap-1 md:text-right">
            <span className="text-xs uppercase tracking-widest text-[var(--color-beige-white)]/50">
              {t('shop.payout.balance')}
            </span>
            <span className="ml-auto flex min-w-0 flex-wrap gap-x-1 break-words text-xs tabular-nums text-[var(--color-beige-white)]/55 md:ml-0 md:justify-end">
              <span>{number(summary.goldBefore)}G</span>
              <span> → </span>
              <span>{number(summary.goldAfter)}G</span>
            </span>
          </div>
        </div>

        <div className="grid border-t border-white/10 bg-black/15 text-xs md:grid-cols-2">
          <p
            className="min-w-0 break-words px-4 py-2 text-[var(--color-beige-white)]/65"
            data-interest-coach
          >
            <span className="mr-1.5" aria-hidden="true">
              ◎
            </span>
            {interestCoach}
          </p>
          <p className="min-w-0 break-words border-t border-white/10 px-4 py-2 font-semibold text-[var(--color-metallic-gold)] md:border-l md:border-t-0 md:text-right">
            {summary.nextRoundType && summary.nextTarget !== null
              ? t('shop.payout.nextRound', {
                  round: t(`rounds.${summary.nextRoundType.toLowerCase()}`),
                  target: number(summary.nextTarget),
                })
              : t('shop.payout.nextAct', { act: number(nextActNumber) })}
          </p>
        </div>
      </div>
    </AnimatedSection>
  )
}

export default RoundCashOutBanner
