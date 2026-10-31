/**
 * CashOutToasts: the round's pay arriving in the purse.
 *
 * The Tea House opens on the pay-out itself rather than a receipt. One toast
 * per source of Gold slides into the corner under the purse — the clear, the
 * interest, Decrees, Gold tiles, any adjustment, the rentals charged and
 * Gold a swift-clear Omen paid — its coins fly into the purse, and the balance counts up
 * as each lands (rentals fly back out). The toasts fade on their own. Nothing
 * here moves money: the engine settled the round already, and the purse only
 * shows what has landed so far.
 *
 * @module components/shop/CashOutToasts
 */

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RoundCashOutSummary } from '../../game/GameOrchestrator'
import { illustrationAssets } from '../../utils/assets'
import { GoldIcon } from '../ui/GoldIcon'
import { OmenArtwork } from '../ui/OmenArtwork'
import { cashOutEntries, type CashOutEntry } from './cashOutEntries'

type Phase = 'pending' | 'flying' | 'landed' | 'leaving' | 'gone'

interface Coin {
  key: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  delay: number
}

/** Timing, in ms. */
const STAGGER = 420
const FLIGHT = 640
const LINGER = 3000
const LEAVE = 320
const COIN_GAP = 70
const MAX_COINS = 6

export interface CashOutToastsProps {
  summary: RoundCashOutSummary
  /** The element coins fly into: the header's purse. */
  purseSelector?: string
  /** Offset from the top of the screen, below the header. */
  top: number
  /** A toast's Gold has reached (or left) the purse. */
  onLanded?: (entry: CashOutEntry) => void
  /** Every toast has faded. */
  onDone?: () => void
  reducedMotion?: boolean
}

export function CashOutToasts({
  summary,
  purseSelector = '[data-gold-purse]',
  top,
  onLanded,
  onDone,
  reducedMotion = false,
}: CashOutToastsProps) {
  const { t, i18n } = useTranslation()
  const entries = useMemo(() => cashOutEntries(summary, t), [summary, t])
  const [phases, setPhases] = useState<Record<string, Phase>>({})
  const [coins, setCoins] = useState<Record<string, Coin[]>>({})
  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null)
  // Keyed on the language itself so a switch after mount reformats.
  const locale = i18n.resolvedLanguage ?? i18n.language
  const signed = useMemo(
    () => new Intl.NumberFormat(locale, { signDisplay: 'always' }).format,
    [locale]
  )
  const stagger = reducedMotion ? 0 : STAGGER
  const flight = reducedMotion ? 0 : FLIGHT

  // The schedule: each toast appears, lands its coins, lingers, then leaves.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, work: () => void) =>
      timers.push(setTimeout(work, ms))
    const phase = (id: string, next: Phase) =>
      setPhases((current) => ({ ...current, [id]: next }))
    entries.forEach((entry, index) => {
      const appear = index * stagger
      at(appear, () => phase(entry.id, 'flying'))
      at(appear + flight, () => {
        phase(entry.id, 'landed')
        onLanded?.(entry)
      })
      at(appear + flight + LINGER, () => phase(entry.id, 'leaving'))
      at(appear + flight + LINGER + (reducedMotion ? 0 : LEAVE), () =>
        phase(entry.id, 'gone')
      )
    })
    return () => timers.forEach(clearTimeout)
    // The schedule belongs to one settlement; callbacks read the latest entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, stagger, flight, reducedMotion])

  const allGone =
    entries.length > 0 && entries.every((entry) => phases[entry.id] === 'gone')
  useEffect(() => {
    if (allGone) onDone?.()
  }, [allGone, onDone])

  // Measure where each flying toast's coins start and where the purse is.
  useLayoutEffect(() => {
    if (!wrapper || reducedMotion) return
    const purse = document.querySelector<HTMLElement>(purseSelector)
    const origin = wrapper.getBoundingClientRect()
    const purseRect = purse?.getBoundingClientRect()
    setCoins((current) => {
      let changed = false
      const next = { ...current }
      for (const entry of entries) {
        if (phases[entry.id] !== 'flying' || entry.amount === 0) continue
        if (next[entry.id]) continue
        const chip = wrapper.querySelector<HTMLElement>(
          `[data-cash-out-toast="${entry.id}"] [data-cash-out-amount]`
        )
        if (!chip || !purseRect) continue
        const chipRect = chip.getBoundingClientRect()
        const chipX = chipRect.left + chipRect.width / 2 - origin.left - 11
        const chipY = chipRect.top + chipRect.height / 2 - origin.top - 11
        const purseX = purseRect.left + purseRect.width / 2 - origin.left - 11
        const purseY = purseRect.top + purseRect.height / 2 - origin.top - 11
        const outgoing = entry.amount < 0
        const count = Math.min(
          MAX_COINS,
          Math.max(1, Math.round(Math.abs(entry.amount)))
        )
        next[entry.id] = Array.from({ length: count }, (_, i) => ({
          key: `${entry.id}-${i}`,
          fromX: outgoing ? purseX : chipX,
          fromY: outgoing ? purseY : chipY,
          toX: outgoing ? chipX : purseX,
          toY: outgoing ? chipY : purseY,
          delay: i * COIN_GAP,
        }))
        changed = true
      }
      return changed ? next : current
    })
  }, [wrapper, entries, phases, purseSelector, reducedMotion])

  const visible = entries.filter((entry) => {
    const phase = phases[entry.id] ?? 'pending'
    return phase !== 'pending' && phase !== 'gone'
  })
  if (visible.length === 0) return null

  return (
    <div
      ref={setWrapper}
      data-cash-out
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
    >
      <div
        data-cash-out-toasts
        role="status"
        aria-live="polite"
        aria-label={t('shop.payoutBreakdown')}
        className="absolute right-3 flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-1.5 sm:right-5"
        style={{ top }}
      >
        {visible.map((entry) => {
          const phase = phases[entry.id]
          const negative = entry.amount < 0
          return (
            <div
              key={entry.id}
              data-cash-out-toast={entry.id}
              data-cash-out-phase={phase}
              data-payout-value={entry.amount}
              data-payout-omen={entry.omenId}
              className={`flex max-w-full items-center gap-2 rounded-xl border px-3 py-1.5 text-sm text-[var(--color-beige-white)] shadow-xl [overflow-wrap:anywhere] ${
                entry.omenId
                  ? 'border-purple-300/60 bg-purple-950/90'
                  : 'border-[var(--color-golden-yellow)]/60 bg-[#10261d]/95'
              } ${
                reducedMotion
                  ? ''
                  : phase === 'leaving'
                    ? 'cash-out-toast-leave'
                    : 'cash-out-toast-enter'
              }`}
            >
              {entry.omenId ? (
                <OmenArtwork
                  omenId={entry.omenId}
                  className="h-6 w-6 shrink-0"
                />
              ) : (
                <img
                  src={illustrationAssets.settlementLedger}
                  alt=""
                  aria-hidden="true"
                  className="h-6 w-6 shrink-0 object-contain"
                />
              )}
              <span className="min-w-0">{entry.label}</span>
              <span
                data-cash-out-amount
                className={`inline-flex shrink-0 items-center gap-1 font-black tabular-nums ${
                  negative ? 'text-red-300' : 'text-emerald-300'
                }`}
              >
                <GoldIcon className="h-4 w-4" />
                {signed(entry.amount)}G
              </span>
            </div>
          )
        })}
      </div>
      {!reducedMotion &&
        visible.flatMap((entry) =>
          phases[entry.id] === 'flying'
            ? (coins[entry.id] ?? []).map((coin) => (
                <img
                  key={coin.key}
                  src={illustrationAssets.currency.gold}
                  alt=""
                  aria-hidden="true"
                  data-cash-out-coin={entry.id}
                  className="cash-out-coin gold-emblem"
                  style={
                    {
                      '--from-x': `${coin.fromX}px`,
                      '--from-y': `${coin.fromY}px`,
                      '--mid-x': `${(coin.fromX + coin.toX) / 2}px`,
                      '--mid-y': `${Math.min(coin.fromY, coin.toY) - 36}px`,
                      '--to-x': `${coin.toX}px`,
                      '--to-y': `${coin.toY}px`,
                      '--coin-ms': `${FLIGHT - coin.delay}ms`,
                      '--coin-delay': `${coin.delay}ms`,
                    } as React.CSSProperties
                  }
                />
              ))
            : []
        )}
    </div>
  )
}

export default CashOutToasts
