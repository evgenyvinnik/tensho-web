import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CashOutToasts } from './CashOutToasts'
import { cashOutEntries } from './cashOutEntries'
import type { RoundCashOutSummary } from '../../game/GameOrchestrator'
import i18n, { changeLanguage, SUPPORTED_LANGUAGES } from '../../i18n'

const summary: RoundCashOutSummary = {
  actNumber: 8,
  roundNumber: 2,
  roundType: 'Large',
  score: 1234567,
  target: 1000000,
  baseReward: 4,
  interest: 2,
  decreeGold: 3,
  heldGoldMarkReward: 3,
  rentalCost: 2,
  netGoldChange: 10,
  goldBefore: 10,
  goldAfter: 20,
  nextRoundType: 'Boss',
  nextTarget: 2000000,
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(async () => {
  vi.useRealTimers()
  await act(async () => {
    await changeLanguage('en')
  })
})

const values = (root: ParentNode) =>
  Array.from(
    root.querySelectorAll<HTMLElement>('[data-payout-value]'),
    (node) => Number(node.dataset.payoutValue)
  )

it('pays every source into the purse in order and sums to the settled total', () => {
  const landed: number[] = []
  const onDone = vi.fn()
  const { container } = render(
    <>
      <span data-gold-purse />
      <CashOutToasts
        summary={summary}
        top={64}
        onLanded={(entry) => landed.push(entry.amount)}
        onDone={onDone}
      />
    </>
  )
  // The first toast is on screen at once; the next waits its turn.
  act(() => vi.advanceTimersByTime(0))
  expect(container.querySelectorAll('[data-cash-out-toast]')).toHaveLength(1)
  expect(screen.getByText('Round cleared')).toBeInTheDocument()
  expect(
    container.querySelector('[data-cash-out-toast="clear"]')
  ).toHaveTextContent('+4G')
  // Four coins carry four Gold toward the purse.
  expect(
    container.querySelectorAll('[data-cash-out-coin="clear"]')
  ).toHaveLength(4)
  expect(landed).toEqual([])
  act(() => vi.advanceTimersByTime(640))
  expect(landed).toEqual([4])
  // Landed coins are gone; the next toast's are already in the air.
  expect(
    container.querySelectorAll('[data-cash-out-coin="clear"]')
  ).toHaveLength(0)
  expect(
    container.querySelectorAll('[data-cash-out-coin="interest"]')
  ).toHaveLength(2)
  act(() => vi.advanceTimersByTime(5 * 420))
  const total = values(container).reduce((sum, value) => sum + value, 0)
  expect(total).toBe(summary.netGoldChange)
  expect(screen.getByText('Rentals')).toBeInTheDocument()
  expect(
    container.querySelector('[data-cash-out-toast="rentals"]')
  ).toHaveTextContent('-2G')
  act(() => vi.advanceTimersByTime(640))
  expect(landed).toEqual([4, 2, 3, 3, -2])
  expect(onDone).not.toHaveBeenCalled()
  act(() => vi.advanceTimersByTime(4000))
  expect(container.querySelectorAll('[data-cash-out-toast]')).toHaveLength(0)
  expect(onDone).toHaveBeenCalledOnce()
})

it('shows everything at once without coins under reduced motion and still fades', () => {
  const onLanded = vi.fn()
  const onDone = vi.fn()
  const { container } = render(
    <CashOutToasts
      summary={{
        ...summary,
        omenId: 'abundance_omen',
        omenGold: 5,
        netGoldChange: 15,
      }}
      top={64}
      onLanded={onLanded}
      onDone={onDone}
      reducedMotion
    />
  )
  act(() => vi.advanceTimersByTime(0))
  // The Omen itself is revealed centre stage first; only its Gold is a toast.
  expect(container.querySelectorAll('[data-cash-out-toast]')).toHaveLength(6)
  expect(container.querySelectorAll('[data-cash-out-coin]')).toHaveLength(0)
  expect(onLanded).toHaveBeenCalledTimes(6)
  expect(values(container).reduce((sum, value) => sum + value, 0)).toBe(15)
  const omen = container.querySelector('[data-payout-omen="abundance_omen"]')!
  expect(omen).toHaveAttribute('data-cash-out-toast', 'omenGold')
  expect(omen).toHaveTextContent('Omen: Abundance Omen')
  expect(omen).toHaveAttribute('data-payout-value', '5')
  expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  act(() => vi.advanceTimersByTime(3000))
  expect(container.querySelectorAll('[data-cash-out-toast]')).toHaveLength(0)
  expect(onDone).toHaveBeenCalledOnce()
})

it('hides absent sources, keeps the clear, and explains multiplied rewards as an adjustment', () => {
  const entries = cashOutEntries(
    {
      ...summary,
      baseReward: 0,
      interest: 0,
      decreeGold: 0,
      heldGoldMarkReward: 0,
      rentalCost: 7,
      netGoldChange: 1,
    },
    i18n.t
  )
  expect(entries.map((entry) => [entry.id, entry.amount])).toEqual([
    ['clear', 0],
    ['bonus', 8],
    ['rentals', -7],
  ])
  expect(entries.reduce((sum, entry) => sum + entry.amount, 0)).toBe(1)
})

it.each(SUPPORTED_LANGUAGES)('labels every source in %s', async (language) => {
  await act(async () => {
    await changeLanguage(language)
  })
  const { container } = render(
    <CashOutToasts summary={summary} top={64} reducedMotion />
  )
  act(() => vi.advanceTimersByTime(0))
  const text = container.textContent!
  for (const key of ['interest', 'decrees', 'goldTiles', 'rentals'])
    expect(text).toContain(i18n.t(`shop.payout.${key}`))
  expect(text).toContain(i18n.t('shop.roundCleared'))
  expect(text).not.toContain('shop.')
  expect(text).toContain(
    new Intl.NumberFormat(language, { signDisplay: 'always' }).format(4) + 'G'
  )
})
