import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import '../../i18n'
import { RunJourney } from './RunJourney'

it('shows the cleared round and next destination without claiming an early victory', () => {
  const { rerender } = render(
    <RunJourney act={1} round={1} nextAct={2} hasWonRun={false} />
  )
  expect(screen.getByText('Next: Act 1 · Round 2')).toBeVisible()
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1')
  rerender(<RunJourney act={5} round={3} nextAct={6} hasWonRun={false} />)
  expect(screen.getByText('Next: Act 6 · Round 1')).toBeVisible()
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '15')
  expect(screen.getByRole('progressbar')).toHaveAttribute('max', '18')
  expect(screen.queryByText(/Victory secured/)).toBeNull()
})

it('respects Act-reduction Charters instead of assuming the next Act', () => {
  render(<RunJourney act={4} round={3} nextAct={4} hasWonRun={false} />)
  expect(screen.getByText('Next: Act 4 · Round 1')).toBeVisible()
})

it('keeps a legacy late run legible until its next Boss', () => {
  render(<RunJourney act={8} round={1} nextAct={9} hasWonRun={false} />)
  expect(screen.getByText('Act 8 / 8 · Round 1 / 3 cleared')).toBeVisible()
  expect(screen.getByRole('progressbar')).toHaveAttribute('max', '24')
})

it('shows a secured victory in Endless, not an impossible Act 9 of 8 goal', () => {
  render(<RunJourney act={9} round={1} nextAct={10} hasWonRun />)
  expect(
    screen.getByText('All 6 Acts complete · Victory secured')
  ).toBeVisible()
  expect(screen.getByText('Next: Act 9 · Round 2')).toBeVisible()
  expect(screen.queryByRole('progressbar')).toBeNull()
})
