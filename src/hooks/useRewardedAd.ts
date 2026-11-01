/**
 * useRewardedAd: offer a rewarded ad when the player becomes eligible.
 *
 * Pass a key that is non-null while an ad may be offered and changes with
 * each new opportunity. The hook asks the configured provider for an ad; the
 * offer is `available` only once one is ready, so with ads off (the default)
 * nothing is ever shown.
 *
 * @module hooks/useRewardedAd
 */

import { useCallback, useEffect, useState } from 'react'
import {
  getRewardedAdProvider,
  type RewardedAdOutcome,
  type ShowRewardedAd,
} from '../ads/rewardedAds'
import { audioSystem } from '../systems/AudioSystem'

const AUDIO_HOOKS = {
  beforeAd: () => audioSystem.pauseMusic(),
  afterAd: () => audioSystem.resumeMusic(),
}

export function useRewardedAd(placement: string, opportunity: string | null) {
  const [ready, setReady] = useState<{
    opportunity: string
    show: ShowRewardedAd
  } | null>(null)
  const [watching, setWatching] = useState(false)

  useEffect(() => {
    if (!opportunity) return
    let cancelled = false
    void getRewardedAdProvider(AUDIO_HOOKS)
      .prepare(placement)
      .then((show) => {
        if (!cancelled && show) setReady({ opportunity, show })
      })
    return () => {
      cancelled = true
    }
  }, [placement, opportunity])

  const available =
    opportunity !== null && ready !== null && ready.opportunity === opportunity

  const watch = useCallback(async (): Promise<RewardedAdOutcome> => {
    if (!available || !ready) return 'unavailable'
    setWatching(true)
    try {
      return await ready.show()
    } finally {
      setWatching(false)
      setReady(null)
    }
  }, [available, ready])

  return { available, watching, watch }
}
