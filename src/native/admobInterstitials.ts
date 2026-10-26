import {
  AdMob,
  AdmobConsentStatus,
  InterstitialAdPluginEvents,
  MaxAdContentRating,
} from '@capacitor-community/admob'
import { audioSystem } from '../systems/AudioSystem'
import type { InterstitialAds } from './adBreaks'

/**
 * Google's sample interstitial: it always serves test ads, and tapping one
 * earns nothing. Set VITE_ADMOB_INTERSTITIAL_IOS to your AdMob ad unit (and
 * GADApplicationIdentifier in ios/App/App/Info.plist to your app ID) before
 * release. Clicking your own live ads can get an AdMob account banned.
 */
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/4411468910'
const adId: string =
  import.meta.env.VITE_ADMOB_INTERSTITIAL_IOS || TEST_INTERSTITIAL

/** May ads be requested, and must they be non-personalized? */
async function gatherConsent(): Promise<{ allowed: boolean; npa: boolean }> {
  try {
    let consent = await AdMob.requestConsentInfo()
    if (
      consent.isConsentFormAvailable &&
      consent.status === AdmobConsentStatus.REQUIRED
    )
      consent = await AdMob.showConsentForm()
    return { allowed: consent.canRequestAds, npa: false }
  } catch (error) {
    // Offline, or no consent message published in AdMob's Privacy &
    // messaging: keep earning, but with non-personalized ads only.
    console.warn('Consent unavailable; non-personalized ads only', error)
    return { allowed: true, npa: true }
  }
}

/**
 * Ask for consent where the law requires it (Google's UMP form), then for
 * App Tracking Transparency, then start the SDK. Only loaded in the iOS app.
 */
export async function startAdMob(): Promise<InterstitialAds> {
  const consent = await gatherConsent()
  if ((await AdMob.trackingAuthorizationStatus()).status === 'notDetermined')
    await AdMob.requestTrackingAuthorization()
  await AdMob.initialize({
    maxAdContentRating: MaxAdContentRating.ParentalGuidance,
  })

  let ready = false
  // The game's music would otherwise play over the ad's sound.
  void AdMob.addListener(InterstitialAdPluginEvents.Showed, () =>
    audioSystem.pauseMusic()
  )
  const finished = () => {
    ready = false
    audioSystem.resumeMusic()
  }
  void AdMob.addListener(InterstitialAdPluginEvents.Dismissed, finished)
  void AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, finished)

  return {
    async prepare() {
      if (ready || !consent.allowed) return
      try {
        await AdMob.prepareInterstitial({
          adId,
          isTesting: adId === TEST_INTERSTITIAL,
          npa: consent.npa,
        })
        ready = true
      } catch (error) {
        console.warn('Interstitial unavailable', error)
      }
    },
    async show() {
      if (!ready) return
      try {
        await AdMob.showInterstitial()
      } catch (error) {
        finished()
        console.warn('Interstitial could not show', error)
      }
    },
  }
}
