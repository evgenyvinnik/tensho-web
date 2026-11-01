/**
 * SimulatedAdOverlay: the stand-in "advertisement" of the simulated rewarded
 * ad provider (development, tests, or VITE_REWARDED_ADS=simulate).
 *
 * It plays for SIMULATED_AD_SECONDS, then offers the reward. Closing it early
 * forfeits the reward, as closing a real rewarded ad does. Renders nothing
 * unless the simulated provider is showing an ad.
 *
 * @module components/gameplay/SimulatedAdOverlay
 */

import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  getSimulatedAdRequest,
  SIMULATED_AD_SECONDS,
  subscribeSimulatedAd,
  type SimulatedAdRequest,
} from '../../ads/rewardedAds'

export function SimulatedAdOverlay() {
  const request = useSyncExternalStore(
    subscribeSimulatedAd,
    getSimulatedAdRequest,
    () => null
  )
  if (!request) return null
  return <SimulatedAd key={request.placement} request={request} />
}

function SimulatedAd({ request }: { request: SimulatedAdRequest }) {
  const { t, i18n } = useTranslation()
  const [left, setLeft] = useState(SIMULATED_AD_SECONDS)
  useEffect(() => {
    if (left <= 0) return
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])
  const number = new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language)

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulated-ad-title"
      data-simulated-ad
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl border-2 border-dashed border-white/40 bg-[var(--color-dark-forest)] p-6 text-center text-[var(--color-beige-white)]">
        <p
          id="simulated-ad-title"
          className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-metallic-gold)]"
        >
          {t('gameplay.emergencyTurn.simulatedAd')}
        </p>
        <p className="mt-4 text-sm opacity-80" aria-live="polite">
          {left > 0
            ? t('gameplay.emergencyTurn.adCountdown', {
                seconds: number.format(left),
              })
            : t('gameplay.emergencyTurn.adReady')}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            data-simulated-ad-close
            onClick={() => request.finish('dismissed')}
            className="min-h-11 rounded-lg border-2 border-white/40 px-3 font-bold"
          >
            {t('common.close', 'Close')}
          </button>
          <button
            type="button"
            data-simulated-ad-claim
            disabled={left > 0}
            onClick={() => request.finish('rewarded')}
            className="min-h-11 rounded-lg border-2 border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] px-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('gameplay.emergencyTurn.adClaim')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default SimulatedAdOverlay
