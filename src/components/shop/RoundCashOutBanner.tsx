import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { animated, useSpring, to } from '@react-spring/web'
import type { RoundCashOutSummary } from '../../game/GameOrchestrator'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { GoldIcon } from '../ui/GoldIcon'

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
  const number = new Intl.NumberFormat(i18n.resolvedLanguage).format
  const signed = new Intl.NumberFormat(i18n.resolvedLanguage, {
    signDisplay: 'always',
  }).format
  const totalText = `${signed(summary.netGoldChange)}G`
  const totalSize =
    totalText.length > 18
      ? 'text-sm sm:text-lg'
      : totalText.length > 12
        ? 'text-lg sm:text-2xl'
        : 'text-3xl'
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
    summary.heldGoldMarkReward

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
      className="mx-3 mt-3 overflow-hidden rounded-2xl border border-[var(--color-golden-yellow)]/70 bg-[linear-gradient(135deg,rgba(19,52,39,0.98),rgba(9,29,22,0.98))] shadow-[0_16px_50px_rgba(0,0,0,0.3)] sm:mx-4"
      style={{
        opacity: entrance.opacity,
        transform: to(
          [entrance.y, entrance.scale],
          (y, scale) => `translateY(${y}px) scale(${scale})`
        ),
      }}
    >
      <div className="grid min-w-0 gap-3 p-4 md:grid-cols-[minmax(0,1fr)_minmax(10rem,0.55fr)]">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">
            {t('shop.roundCleared')}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="min-w-0 break-words text-xl font-black text-[var(--color-golden-yellow)] sm:text-2xl">
              {t('shop.payout.heading', {
                act: number(summary.actNumber),
                round: t(`rounds.${summary.roundType.toLowerCase()}`),
              })}
            </h2>
            <span className="flex min-w-0 flex-wrap gap-x-1 break-words text-sm tabular-nums text-[var(--color-beige-white)]/65">
              <span>{number(summary.score)}</span>
              <span> / </span>
              <span>{number(summary.target)}</span>
            </span>
          </div>

          <div
            className="mt-3 flex flex-wrap gap-1.5"
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
          </div>
        </div>

        <div className="grid min-w-0 content-center gap-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 md:text-right">
          <span className="text-xs uppercase tracking-widest text-[var(--color-beige-white)]/50">
            {t('shop.cashOut')}
          </span>
          <strong
            className={`flex min-w-0 items-center gap-1 font-black tabular-nums md:justify-end ${totalSize} ${
              summary.netGoldChange >= 0 ? 'text-emerald-300' : 'text-red-300'
            }`}
          >
            <GoldIcon className="h-7 w-7" />
            <span className="min-w-0 break-all" data-payout-total>
              {totalText}
            </span>
          </strong>
          <span className="flex min-w-0 flex-wrap gap-x-1 break-words text-xs tabular-nums text-[var(--color-beige-white)]/55 md:justify-end">
            <span>{number(summary.goldBefore)}G</span>
            <span> → </span>
            <span>{number(summary.goldAfter)}G</span>
          </span>
        </div>
      </div>

      <div className="grid border-t border-white/10 bg-black/15 text-xs md:grid-cols-2">
        <p
          className="min-w-0 break-words px-4 py-2.5 text-[var(--color-beige-white)]/65"
          data-interest-coach
        >
          <span className="mr-1.5" aria-hidden="true">
            ◎
          </span>
          {interestCoach}
        </p>
        <p className="min-w-0 break-words border-t border-white/10 px-4 py-2.5 font-semibold text-[var(--color-metallic-gold)] md:border-l md:border-t-0 md:text-right">
          {summary.nextRoundType && summary.nextTarget !== null
            ? t('shop.payout.nextRound', {
                round: t(`rounds.${summary.nextRoundType.toLowerCase()}`),
                target: number(summary.nextTarget),
              })
            : t('shop.payout.nextAct', { act: number(nextActNumber) })}
        </p>
      </div>
    </AnimatedSection>
  )
}

export default RoundCashOutBanner
