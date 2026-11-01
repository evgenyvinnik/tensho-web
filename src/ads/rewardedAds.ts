/**
 * Rewarded ads: watch an advertisement, receive a reward in the game.
 *
 * One provider is active, chosen at build time:
 *
 *   VITE_REWARDED_ADS=google     Google H5 Games Ads (Ad Placement API).
 *                                Needs VITE_ADSENSE_CLIENT=ca-pub-…, an
 *                                AdSense account approved for H5 games, and
 *                                VITE_ADS_TEST=on while testing. See
 *                                docs/REWARDED_ADS.md.
 *   VITE_REWARDED_ADS=simulate   A local stand-in that shows a placeholder
 *                                "advertisement" for a few seconds.
 *   (unset)                      Off: no ad is ever offered and nothing is
 *                                loaded from a third party.
 *
 * Development and test builds (never production) may also choose
 * `simulate` at runtime with localStorage `tensho-rewarded-ads`, so the flow
 * can be exercised without an ad account.
 *
 * The game only asks two things: is an ad ready for this placement, and did
 * the player watch it to the end. Rewards are granted by the caller.
 *
 * @module ads/rewardedAds
 */

export type RewardedAdOutcome = 'rewarded' | 'dismissed' | 'unavailable'

/** Shows the prepared ad; resolves once it has finished or closed. */
export type ShowRewardedAd = () => Promise<RewardedAdOutcome>

export interface RewardedAdProvider {
  readonly kind: 'off' | 'simulated' | 'google'
  /**
   * Ask for a rewarded ad for a placement. Resolves with a function that
   * shows it, or null when no ad is ready (the offer should stay hidden).
   */
  prepare(placement: string): Promise<ShowRewardedAd | null>
}

// =============================================================================
// OFF
// =============================================================================

const off: RewardedAdProvider = {
  kind: 'off',
  prepare: () => Promise.resolve(null),
}

// =============================================================================
// SIMULATED
// =============================================================================

/** Seconds the simulated advertisement must play before it rewards. */
export const SIMULATED_AD_SECONDS = 3

export interface SimulatedAdRequest {
  placement: string
  finish: (outcome: RewardedAdOutcome) => void
}

let simulatedRequest: SimulatedAdRequest | null = null
const simulatedListeners = new Set<() => void>()

/** The simulated ad currently playing, for the overlay that draws it. */
export function getSimulatedAdRequest(): SimulatedAdRequest | null {
  return simulatedRequest
}

export function subscribeSimulatedAd(listener: () => void): () => void {
  simulatedListeners.add(listener)
  return () => simulatedListeners.delete(listener)
}

function setSimulatedRequest(request: SimulatedAdRequest | null) {
  simulatedRequest = request
  for (const listener of simulatedListeners) listener()
}

const simulated: RewardedAdProvider = {
  kind: 'simulated',
  prepare: (placement) =>
    Promise.resolve(
      () =>
        new Promise<RewardedAdOutcome>((resolve) => {
          setSimulatedRequest({
            placement,
            finish: (outcome) => {
              setSimulatedRequest(null)
              resolve(outcome)
            },
          })
        })
    ),
}

// =============================================================================
// GOOGLE H5 GAMES ADS (Ad Placement API)
// =============================================================================

interface PlacementInfo {
  breakStatus?: string
}

interface AdBreakOptions {
  type: 'reward'
  name: string
  beforeAd?: () => void
  afterAd?: () => void
  beforeReward: (showAdFn: () => void) => void
  adDismissed: () => void
  adViewed: () => void
  adBreakDone: (placementInfo: PlacementInfo) => void
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
    adBreak?: (options: AdBreakOptions) => void
    adConfig?: (options: Record<string, unknown>) => void
  }
}

/** How long to wait for Google to say an ad is ready before giving up. */
const GOOGLE_READY_TIMEOUT_MS = 5000

let googleLoaded = false

function loadGoogle(client: string, test: boolean): void {
  if (googleLoaded) return
  googleLoaded = true
  window.adsbygoogle = window.adsbygoogle ?? []
  const push = (options: object) => window.adsbygoogle!.push(options)
  window.adBreak = push
  window.adConfig = push
  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
  script.dataset.adClient = client
  if (test) script.dataset.adbreakTest = 'on'
  document.head.appendChild(script)
  window.adConfig({ preloadAdBreaks: 'on', sound: 'on' })
}

/** Game hooks Google calls around an ad (pause and resume audio). */
export interface RewardedAdHooks {
  beforeAd?: () => void
  afterAd?: () => void
}

export function createGoogleProvider(
  client: string,
  test: boolean,
  hooks: RewardedAdHooks = {}
): RewardedAdProvider {
  return {
    kind: 'google',
    prepare: (placement) =>
      new Promise<ShowRewardedAd | null>((resolveReady) => {
        loadGoogle(client, test)
        let ready = false
        let settle: (outcome: RewardedAdOutcome) => void = () => {}
        const outcome = new Promise<RewardedAdOutcome>((resolve) => {
          settle = resolve
        })
        const timer = setTimeout(() => {
          if (!ready) resolveReady(null)
        }, GOOGLE_READY_TIMEOUT_MS)
        window.adBreak!({
          type: 'reward',
          name: placement,
          beforeAd: hooks.beforeAd,
          afterAd: hooks.afterAd,
          beforeReward: (showAdFn) => {
            ready = true
            clearTimeout(timer)
            resolveReady(() => {
              showAdFn()
              return outcome
            })
          },
          adViewed: () => settle('rewarded'),
          adDismissed: () => settle('dismissed'),
          // Always called last; the first outcome wins.
          adBreakDone: () => {
            if (ready) settle('unavailable')
            else {
              clearTimeout(timer)
              resolveReady(null)
            }
          },
        })
      }),
  }
}

// =============================================================================
// SELECTION
// =============================================================================

const RUNTIME_OVERRIDE_KEY = 'tensho-rewarded-ads'

function runtimeOverride(): string | null {
  if (!import.meta.env.DEV && import.meta.env.MODE !== 'test') return null
  try {
    return localStorage.getItem(RUNTIME_OVERRIDE_KEY)
  } catch {
    return null
  }
}

let provider: RewardedAdProvider | null = null

/** The configured provider (see the module comment). */
export function getRewardedAdProvider(
  hooks: RewardedAdHooks = {}
): RewardedAdProvider {
  if (provider) return provider
  const choice =
    runtimeOverride() ?? import.meta.env.VITE_REWARDED_ADS ?? undefined
  const client = import.meta.env.VITE_ADSENSE_CLIENT
  provider =
    choice === 'simulate'
      ? simulated
      : choice === 'google' && typeof client === 'string' && client
        ? createGoogleProvider(
            client,
            import.meta.env.VITE_ADS_TEST === 'on',
            hooks
          )
        : off
  return provider
}

/** Tests only: forget the chosen provider so the next call re-reads config. */
export function resetRewardedAdProvider(next?: RewardedAdProvider): void {
  provider = next ?? null
  setSimulatedRequest(null)
}
