import { afterEach, describe, expect, it, vi } from 'vitest'
import { eventBus } from '../game/EventBus'
import type { OrchestratorState } from '../game/GameOrchestrator'
import { adBreak, adFollowsBoss, scheduleBossAds } from './adBreaks'

function setup(
  round: { type: string; act: number } = { type: 'Small', act: 1 }
) {
  const ads = { prepare: vi.fn(async () => {}), show: vi.fn(async () => {}) }
  const state = () =>
    ({
      currentAct: round.act,
      roundManager: { getCurrentRound: () => ({ roundType: round.type }) },
    }) as unknown as OrchestratorState
  const stop = scheduleBossAds(ads, state)
  return { ads, round, stop }
}

let stop: (() => void) | undefined
afterEach(() => stop?.())

describe('ads after every second Boss', () => {
  it('follows Acts 2, 4, 6 and Endless, never an odd Act', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].filter(adFollowsBoss)).toEqual([2, 4, 6, 8])
  })

  it('loads during the Boss and shows once at the next screen', () => {
    const run = setup()
    stop = run.stop
    eventBus.emit('roundStart', {
      actNumber: 2,
      roundNumber: 3,
      roundType: 'Boss',
      target: 900,
    })
    expect(run.ads.prepare).toHaveBeenCalledOnce()
    eventBus.emit('actComplete', { actNumber: 2, totalScore: 0 })
    expect(run.ads.show).not.toHaveBeenCalled()
    adBreak()
    adBreak()
    expect(run.ads.show).toHaveBeenCalledOnce()
  })

  it('skips the first Boss and every round that is not a Boss', () => {
    const run = setup()
    stop = run.stop
    eventBus.emit('roundStart', {
      actNumber: 2,
      roundNumber: 1,
      roundType: 'Small',
      target: 300,
    })
    eventBus.emit('roundStart', {
      actNumber: 1,
      roundNumber: 3,
      roundType: 'Boss',
      target: 600,
    })
    eventBus.emit('actComplete', { actNumber: 1, totalScore: 0 })
    eventBus.emit('roundEnd', { won: true, score: 300, target: 300 })
    adBreak()
    expect(run.ads.prepare).not.toHaveBeenCalled()
    expect(run.ads.show).not.toHaveBeenCalled()
  })

  it('also follows a second Boss that ended the run', () => {
    const run = setup({ type: 'Boss', act: 4 })
    stop = run.stop
    eventBus.emit('roundEnd', { won: false, score: 10, target: 900 })
    adBreak()
    expect(run.ads.show).toHaveBeenCalledOnce()
  })

  it('does nothing once stopped', () => {
    const run = setup()
    run.stop()
    eventBus.emit('actComplete', { actNumber: 2, totalScore: 0 })
    adBreak()
    expect(run.ads.show).not.toHaveBeenCalled()
  })
})
