import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { RoundCashOutBanner } from './RoundCashOutBanner'
import {
  GameOrchestrator,
  type OrchestratorState,
  type RoundCashOutSummary,
} from '../../game/GameOrchestrator'
import { ALL_DECREES } from '../../systems/DecreeSystem'
import i18n, { changeLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { eventBus } from '../../game/EventBus'

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

afterEach(async () => {
  eventBus.clear()
  await act(async () => {
    await changeLanguage('en')
  })
})

it('starts compact and preserves the chosen receipt state while savings change', async () => {
  const before = JSON.stringify(summary)
  const ui = (gold: number) => (
    <RoundCashOutBanner
      summary={summary}
      currentGold={gold}
      nextActNumber={9}
      interestCap={5}
    />
  )
  const { container, rerender } = render(ui(17))
  const toggle = screen.getByRole('button', { name: 'Round payout breakdown' })
  const details = container.querySelector('[data-payout-details]')!
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(toggle).toHaveAccessibleDescription('+10G')
  expect(details).not.toBeVisible()
  expect(toggle.querySelector('img')).toHaveAttribute(
    'src',
    expect.stringContaining('settlement-ledger.webp')
  )
  toggle.focus()
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-controls', details.id)
  await waitFor(() => expect(details).toBeVisible())
  rerender(ui(14))
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText(/With current savings/)).toHaveTextContent('+2G')
  expect(toggle).toHaveFocus()
  fireEvent.click(toggle)
  expect(details).not.toBeVisible()
  expect(JSON.stringify(summary)).toBe(before)
})

it.each(SUPPORTED_LANGUAGES)(
  'localizes the compact receipt and retains exact settlement in %s',
  async (language) => {
    await act(async () => {
      await changeLanguage(language)
    })
    const { container } = render(
      <RoundCashOutBanner
        summary={summary}
        currentGold={20}
        nextActNumber={9}
        interestCap={5}
      />
    )
    const toggle = screen.getByRole('button', {
      name: i18n.t('shop.payoutBreakdown'),
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    // The compact receipt names the round it settles, not a generic heading.
    expect(toggle).toHaveTextContent(
      i18n.t('shop.payout.heading', {
        act: new Intl.NumberFormat(language).format(8),
        round: i18n.t('rounds.large'),
      })
    )
    expect(toggle).toHaveAccessibleDescription(
      new Intl.NumberFormat(language, { signDisplay: 'always' }).format(10) +
        'G'
    )
    fireEvent.click(toggle)
    await waitFor(() =>
      expect(container.querySelector('[data-payout-details]')).toBeVisible()
    )
    expect(
      screen.getByRole('group', { name: i18n.t('shop.payoutBreakdown') })
    ).toBeVisible()
  }
)

it('updates savings guidance after spending without changing the settled receipt', () => {
  const { rerender } = render(
    <RoundCashOutBanner
      summary={summary}
      currentGold={17}
      nextActNumber={9}
      interestCap={5}
    />
  )
  expect(screen.getByText(/With current savings/)).toHaveTextContent(
    '+3G interest. Save 3G more for +4G'
  )
  rerender(
    <RoundCashOutBanner
      summary={summary}
      currentGold={14}
      nextActNumber={9}
      interestCap={5}
    />
  )
  expect(screen.getByText(/With current savings/)).toHaveTextContent(
    '+2G interest. Save 1G more for +3G'
  )
  expect(screen.getByTestId('round-cash-out')).toHaveTextContent('10G → 20G')
})

it('explains capped interest, including a zero cap, without recommending more savings', () => {
  const { rerender } = render(
    <RoundCashOutBanner
      summary={summary}
      currentGold={100}
      nextActNumber={9}
      interestCap={5}
    />
  )
  expect(screen.getByTestId('round-cash-out')).toHaveTextContent(
    'Savings have reached the +5G interest cap.'
  )
  rerender(
    <RoundCashOutBanner
      summary={summary}
      currentGold={0}
      nextActNumber={9}
      interestCap={0}
    />
  )
  expect(screen.getByTestId('round-cash-out')).toHaveTextContent(
    'Savings have reached the +0G interest cap.'
  )
  expect(screen.queryByText(/Save .*more/)).not.toBeInTheDocument()
})

it('gives the blocked-interest explanation precedence over savings and caps', () => {
  render(
    <RoundCashOutBanner
      summary={summary}
      currentGold={100}
      nextActNumber={9}
      interestCap={5}
      interestBlocked
    />
  )
  expect(screen.getByTestId('round-cash-out')).toHaveTextContent(
    'Interest is currently blocked.'
  )
  expect(screen.queryByText(/interest cap/)).not.toBeInTheDocument()
})

it('keeps zero base categories, hides absent rewards, and displays negative rental totals exactly', () => {
  const payout = {
    ...summary,
    baseReward: 0,
    interest: 0,
    decreeGold: 0,
    heldGoldMarkReward: 0,
    rentalCost: 7,
    netGoldChange: -7,
    goldBefore: 3,
    goldAfter: -4,
  }
  const { container } = render(
    <RoundCashOutBanner
      summary={payout}
      currentGold={0}
      nextActNumber={9}
      interestCap={5}
    />
  )
  expect(container.querySelector('[data-payout-total]')).toHaveTextContent(
    '-7G'
  )
  const values = Array.from(
    container.querySelectorAll('[data-payout-value]')
  ).map((node) => Number(node.getAttribute('data-payout-value')))
  expect(values).toEqual([0, 0, -7])
  expect(values.reduce((sum, value) => sum + value, 0)).toBe(
    payout.netGoldChange
  )
  expect(
    screen.queryByText('Reward adjustment', { exact: false })
  ).not.toBeInTheDocument()
})

it('formats scores and balances in French and localizes the next-Act fallback', async () => {
  await act(async () => {
    await changeLanguage('fr')
  })
  render(
    <RoundCashOutBanner
      summary={{
        ...summary,
        nextRoundType: null,
        nextTarget: null,
        goldBefore: 1234567,
        goldAfter: 1234577,
      }}
      currentGold={20}
      nextActNumber={9}
      interestCap={5}
    />
  )
  const text = screen.getByTestId('round-cash-out').textContent!
  expect(text).toContain(new Intl.NumberFormat('fr').format(1234567))
  expect(text).toContain('Suite : Acte 9')
  expect(text).not.toContain('1,234,567')
})

it('shows the missing payout bonus from an actual Philosopher round settlement', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  expect(
    game.addDecree(
      ALL_DECREES.find((d) => d.id === 'decree-philosophers-stone')!
    )
  ).toBe(true)
  state.targetScore = 1
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
    }).success
  ).toBe(true)
  const payout = state.lastRoundSummary!
  expect(payout).not.toBeNull()
  const base =
    payout.baseReward +
    payout.interest +
    payout.decreeGold +
    payout.heldGoldMarkReward
  expect(payout.netGoldChange).toBe(base * 2 - payout.rentalCost)
  const before = JSON.stringify(payout)
  render(
    <RoundCashOutBanner
      summary={payout}
      currentGold={state.gold}
      nextActNumber={1}
      interestCap={5}
    />
  )
  expect(
    screen.getByText('Reward adjustment', { exact: false })
  ).toHaveTextContent(`+${base}G`)
  expect(JSON.stringify(payout)).toBe(before)
})

it('explains fractional Decree gold rounding as an adjustment without inventing currency', () => {
  const payout = {
    ...summary,
    baseReward: 3,
    interest: 0,
    decreeGold: 0.5,
    heldGoldMarkReward: 0,
    rentalCost: 0,
    netGoldChange: 3,
    goldBefore: 0,
    goldAfter: 3,
  }
  const { container } = render(
    <RoundCashOutBanner
      summary={payout}
      currentGold={3}
      nextActNumber={1}
      interestCap={5}
    />
  )
  expect(
    screen.getByText('Reward adjustment', { exact: false })
  ).toHaveTextContent('-0.5G')
  const displayedParts = Array.from(
    container.querySelectorAll<HTMLElement>('[data-payout-value]'),
    (node) => Number(node.dataset.payoutValue)
  )
  expect(displayedParts.reduce((sum, part) => sum + part, 0)).toBe(3)
  expect(screen.getByTestId('round-cash-out')).toHaveTextContent('0G → 3G')
})

it('localizes every payout category and round heading in Spanish', async () => {
  await act(async () => {
    await changeLanguage('es')
  })
  render(
    <RoundCashOutBanner
      summary={summary}
      currentGold={17}
      nextActNumber={9}
      interestCap={5}
    />
  )
  const receipt = screen.getByTestId('round-cash-out')
  expect(receipt).toHaveTextContent('Acto 8 · Ronda Grande')
  for (const label of [
    'Victoria',
    'Intereses',
    'Decretos',
    'Fichas de oro',
    'Alquileres',
  ])
    expect(receipt).toHaveTextContent(label)
  expect(receipt).toHaveTextContent('Siguiente: Ronda de Jefe')
  // The compact receipt settles gold; the round's score is not repeated.
  expect(receipt).not.toHaveTextContent(
    new Intl.NumberFormat('es').format(summary.score)
  )
  expect(receipt).not.toHaveTextContent(/Gold tiles|Rentals|Save |Next:/)
})
