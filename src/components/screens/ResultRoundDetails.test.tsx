import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ResultRoundDetails } from './ResultRoundDetails'
import type { RoundCashOutSummary } from '../../game/GameOrchestrator'
import '../../i18n'

const summary: RoundCashOutSummary = {
  actNumber: 2,
  roundNumber: 1,
  roundType: 'Small',
  score: 90,
  target: 100,
  baseReward: 0,
  interest: 0,
  decreeGold: 0,
  heldGoldMarkReward: 0,
  rentalCost: 3,
  netGoldChange: -3,
  goldBefore: 1,
  goldAfter: -2,
  nextRoundType: null,
  nextTarget: null,
}
const state = {
  currentAct: 2,
  currentRound: 1,
  score: 90,
  targetScore: 100,
  gold: -2,
  lastRoundSummary: summary,
}

it('shows the last round shortfall, debt and charged rent separately', () => {
  const { container } = render(<ResultRoundDetails state={state} defeated />)
  expect(
    container.querySelector('[data-result-detail="roundScore"]')
  ).toHaveTextContent('90')
  expect(
    container.querySelector('[data-result-detail="shortfall"]')
  ).toHaveTextContent('10')
  expect(
    container.querySelector('[data-result-detail="remainingGold"]')
  ).toHaveTextContent('-2')
  expect(
    container.querySelector('[data-result-detail="rentalPaid"]')
  ).toHaveTextContent('-3')
  expect(screen.getByText(/On defeat, Rental is charged/)).toBeVisible()
})

it.each([null, { ...summary, roundNumber: 3 }, { ...summary, score: 12 }])(
  'does not report stale or missing settlement as a new fee',
  (lastRoundSummary) => {
    const { container } = render(
      <ResultRoundDetails state={{ ...state, lastRoundSummary }} defeated />
    )
    expect(
      container.querySelector('[data-result-detail="rentalPaid"]')
    ).toBeNull()
    expect(screen.getByText('Gold remaining')).toBeVisible()
  }
)

it('does not describe a victory as a failed round', () => {
  const { container } = render(
    <ResultRoundDetails state={{ ...state, score: 120 }} defeated={false} />
  )
  expect(container.querySelector('[data-result-detail="shortfall"]')).toBeNull()
  expect(screen.queryByText(/On defeat/)).toBeNull()
})
