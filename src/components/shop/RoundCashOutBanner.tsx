import { useEffect, useState } from 'react'
import { animated, useSpring } from '@react-spring/web'
import type { RoundCashOutSummary } from '../../game/GameOrchestrator'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const AnimatedSection = animated('section')

export interface RoundCashOutBannerProps {
  summary: RoundCashOutSummary
  currentGold: number
  interestCap: number
  interestBlocked?: boolean
}

interface PayoutChipProps {
  label: string
  value: number
  alwaysShow?: boolean
}

function PayoutChip({ label, value, alwaysShow = false }: PayoutChipProps) {
  if (!alwaysShow && value === 0) return null

  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-[var(--color-beige-white)]/75">
      {label}{' '}
      <strong className={value < 0 ? 'text-red-300' : 'text-emerald-300'}>
        {value >= 0 ? '+' : ''}{value}G
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
  interestCap,
  interestBlocked = false,
}: RoundCashOutBannerProps) {
  const reduceMotion = useReducedMotion()
  const [hasEntered, setHasEntered] = useState(reduceMotion)
  const projectedInterest = interestBlocked
    ? 0
    : Math.min(Math.floor(currentGold / 5), interestCap)
  const nextInterestThreshold = (projectedInterest + 1) * 5
  const goldToNextInterest = nextInterestThreshold - currentGold

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
    ? 'Interest is blocked for this payout cycle.'
    : projectedInterest >= interestCap
      ? `Savings are at the +${interestCap}G interest cap.`
      : goldToNextInterest > 0
        ? `Save ${goldToNextInterest}G more to earn +${projectedInterest + 1}G interest after the next clear.`
        : `Current savings earn +${projectedInterest}G interest after the next clear.`

  return (
    <AnimatedSection
      data-testid="round-cash-out"
      className="mx-3 mt-3 overflow-hidden rounded-2xl border border-[var(--color-golden-yellow)]/70 bg-[linear-gradient(135deg,rgba(19,52,39,0.98),rgba(9,29,22,0.98))] shadow-[0_16px_50px_rgba(0,0,0,0.3)] sm:mx-4"
      style={{
        opacity: entrance.opacity,
        transform: entrance.y.to(
          (y) => `translateY(${y}px) scale(${entrance.scale.get()})`
        ),
      }}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">
            Round cleared
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-xl font-black text-[var(--color-golden-yellow)] sm:text-2xl">
              Act {summary.actNumber} · {summary.roundType}
            </h2>
            <span className="text-sm tabular-nums text-[var(--color-beige-white)]/65">
              {summary.score.toLocaleString()} / {summary.target.toLocaleString()}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Round payout breakdown">
            <PayoutChip label="Clear" value={summary.baseReward} alwaysShow />
            <PayoutChip label="Interest" value={summary.interest} alwaysShow />
            <PayoutChip label="Decrees" value={summary.decreeGold} />
            <PayoutChip label="Gold tiles" value={summary.heldGoldMarkReward} />
            <PayoutChip label="Rentals" value={-summary.rentalCost} />
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 sm:min-w-44 sm:flex-col sm:items-end sm:gap-0">
          <span className="text-xs uppercase tracking-widest text-[var(--color-beige-white)]/50">
            Cash out
          </span>
          <strong
            className={`text-3xl font-black tabular-nums ${
              summary.netGoldChange >= 0 ? 'text-emerald-300' : 'text-red-300'
            }`}
          >
            {summary.netGoldChange >= 0 ? '+' : ''}{summary.netGoldChange}G
          </strong>
          <span className="text-xs tabular-nums text-[var(--color-beige-white)]/55">
            {summary.goldBefore}G → {summary.goldAfter}G
          </span>
        </div>
      </div>

      <div className="grid border-t border-white/10 bg-black/15 text-xs sm:grid-cols-2">
        <p className="px-4 py-2.5 text-[var(--color-beige-white)]/65">
          <span className="mr-1.5" aria-hidden="true">◎</span>
          {interestCoach}
        </p>
        <p className="border-t border-white/10 px-4 py-2.5 text-right font-semibold text-[var(--color-metallic-gold)] sm:border-l sm:border-t-0">
          {summary.nextRoundType && summary.nextTarget !== null
            ? `Next: ${summary.nextRoundType} · ${summary.nextTarget.toLocaleString()} target`
            : `Next: Act ${summary.actNumber + 1} ascent`}
        </p>
      </div>
    </AnimatedSection>
  )
}

export default RoundCashOutBanner
