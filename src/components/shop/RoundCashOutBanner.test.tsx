import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { RoundCashOutBanner } from './RoundCashOutBanner'
import {
  GameOrchestrator,
  type OrchestratorState,
  type RoundCashOutSummary,
} from '../../game/GameOrchestrator'
import { ALL_DECREES } from '../../systems/DecreeSystem'
import { changeLanguage } from '../../i18n'
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
    screen.queryByText('Reward bonus', { exact: false })
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
  expect(screen.getByText('Reward bonus', { exact: false })).toHaveTextContent(
    `+${base}G`
  )
  expect(JSON.stringify(payout)).toBe(before)
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
  expect(receipt).toHaveTextContent(
    new Intl.NumberFormat('es').format(summary.score)
  )
  expect(receipt).not.toHaveTextContent(/Gold tiles|Rentals|Save |Next:/)
})
