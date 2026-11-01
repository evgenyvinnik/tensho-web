import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SimulatedAdOverlay } from './SimulatedAdOverlay'
import {
  getRewardedAdProvider,
  resetRewardedAdProvider,
  SIMULATED_AD_SECONDS,
  type RewardedAdOutcome,
} from '../../ads/rewardedAds'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) =>
    key === 'tensho-rewarded-ads' ? 'simulate' : null
  )
})

afterEach(() => {
  resetRewardedAdProvider()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

/** Start the simulated ad; the outcome is wrapped so awaiting does not wait for it. */
async function play(): Promise<{ outcome: Promise<RewardedAdOutcome> }> {
  const show = await getRewardedAdProvider().prepare('emergency-turn')
  let outcome!: Promise<RewardedAdOutcome>
  act(() => {
    outcome = show!()
  })
  return { outcome }
}

it('renders nothing until an ad plays', () => {
  const { container } = render(<SimulatedAdOverlay />)
  expect(container).toBeEmptyDOMElement()
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('rewards only after the ad has played its full time', async () => {
  render(<SimulatedAdOverlay />)
  const { outcome } = await play()
  const dialog = screen.getByRole('dialog', {
    name: 'Advertisement (simulated)',
  })
  const claim = screen.getByRole('button', { name: 'Claim +1 Turn' })
  expect(claim).toBeDisabled()
  expect(dialog).toHaveTextContent(
    `Your reward is ready in ${SIMULATED_AD_SECONDS} s`
  )
  for (let i = 0; i < SIMULATED_AD_SECONDS; i++)
    act(() => vi.advanceTimersByTime(1000))
  expect(claim).toBeEnabled()
  fireEvent.click(claim)
  await expect(outcome).resolves.toBe('rewarded')
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('forfeits the reward when closed early', async () => {
  render(<SimulatedAdOverlay />)
  const { outcome } = await play()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  await expect(outcome).resolves.toBe('dismissed')
})
