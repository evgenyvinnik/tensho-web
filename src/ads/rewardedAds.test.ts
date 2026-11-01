import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createGoogleProvider,
  getRewardedAdProvider,
  getSimulatedAdRequest,
  resetRewardedAdProvider,
} from './rewardedAds'

/** The shared test setup's localStorage is inert; answer the override key. */
function simulateOverride() {
  vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) =>
    key === 'tensho-rewarded-ads' ? 'simulate' : null
  )
}

afterEach(() => {
  resetRewardedAdProvider()
  vi.restoreAllMocks()
  vi.useRealTimers()
  delete window.adBreak
  delete window.adConfig
})

describe('provider selection', () => {
  it('is off by default: no ad is ever ready', async () => {
    const provider = getRewardedAdProvider()
    expect(provider.kind).toBe('off')
    await expect(provider.prepare('emergency-turn')).resolves.toBeNull()
  })

  it('can simulate in development and test builds only', () => {
    simulateOverride()
    expect(getRewardedAdProvider().kind).toBe('simulated')
  })
})

describe('simulated provider', () => {
  it('plays an ad and reports how it ended', async () => {
    simulateOverride()
    const show = await getRewardedAdProvider().prepare('emergency-turn')
    expect(show).not.toBeNull()
    const outcome = show!()
    const request = getSimulatedAdRequest()!
    expect(request.placement).toBe('emergency-turn')
    request.finish('rewarded')
    await expect(outcome).resolves.toBe('rewarded')
    expect(getSimulatedAdRequest()).toBeNull()
  })
})

describe('Google H5 Games Ads provider', () => {
  type Options = Parameters<NonNullable<Window['adBreak']>>[0]

  it('loads the ad script once, in test mode, with the publisher id', async () => {
    const provider = createGoogleProvider('ca-pub-test', true)
    void provider.prepare('emergency-turn')
    const script = document.head.querySelector<HTMLScriptElement>(
      'script[src*="adsbygoogle"]'
    )!
    expect(script.dataset.adClient).toBe('ca-pub-test')
    expect(script.dataset.adbreakTest).toBe('on')
  })

  it('offers the ad only once Google says it is ready, and rewards a full view', async () => {
    const provider = createGoogleProvider('ca-pub-test', false)
    const showAdFn = vi.fn()
    let options: Options | undefined
    window.adBreak = (o) => {
      options = o
    }
    const prepared = provider.prepare('emergency-turn')
    // The provider pushes through the loaded queue first; capture directly.
    options ??= (window.adsbygoogle as Options[]).at(-1)
    options!.beforeReward(showAdFn)
    const show = await prepared
    expect(show).not.toBeNull()
    const outcome = show!()
    expect(showAdFn).toHaveBeenCalledOnce()
    options!.adViewed()
    options!.adBreakDone({ breakStatus: 'viewed' })
    await expect(outcome).resolves.toBe('rewarded')
  })

  it('reports a dismissed ad, and no ad when Google has none', async () => {
    const provider = createGoogleProvider('ca-pub-test', false)
    let options: Options | undefined
    window.adBreak = (o) => {
      options = o
    }
    let prepared = provider.prepare('emergency-turn')
    options ??= (window.adsbygoogle as Options[]).at(-1)
    options!.beforeReward(() => {})
    const outcome = (await prepared)!()
    options!.adDismissed()
    await expect(outcome).resolves.toBe('dismissed')

    options = undefined
    prepared = provider.prepare('emergency-turn')
    options ??= (window.adsbygoogle as Options[]).at(-1)
    options!.adBreakDone({ breakStatus: 'notReady' })
    await expect(prepared).resolves.toBeNull()
  })

  it('gives up when Google never answers', async () => {
    vi.useFakeTimers()
    const provider = createGoogleProvider('ca-pub-test', false)
    window.adBreak = () => {}
    const prepared = provider.prepare('emergency-turn')
    vi.advanceTimersByTime(5000)
    await expect(prepared).resolves.toBeNull()
  })
})
