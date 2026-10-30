import {
  AdMob,
  AdmobConsentStatus,
  InterstitialAdPluginEvents,
  MaxAdContentRating,
} from '@capacitor-community/admob'
import { audioSystem } from '../systems/AudioSystem'
import type { InterstitialAds } from './adBreaks'
import { offerPrivacyChoices } from './privacy'

/**
 * Google's sample interstitial: it always serves test ads, and tapping one
 * earns nothing. Set VITE_ADMOB_INTERSTITIAL_IOS to your AdMob ad unit (and
 * GADApplicationIdentifier in ios/App/App/Info.plist to your app ID) before
 * release. Clicking your own live ads can get an AdMob account banned.
 */
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/4411468910'
const adId: string =
  import.meta.env.VITE_ADMOB_INTERSTITIAL_IOS || TEST_INTERSTITIAL

// PrivacyOptionsRequirementStatus.REQUIRED: the plugin (8.2.1) declares the
// enum but leaves it out of the package's exports.
const PRIVACY_OPTIONS_REQUIRED: string = 'REQUIRED'

interface Consent {
  /** May ads be requested? */
  allowed: boolean
  /** Must they be non-personalized? */
  npa: boolean
  /** Must Settings let the player change their answer? */
  changeable: boolean
}

async function gatherConsent(): Promise<Consent> {
  try {
    let consent = await AdMob.requestConsentInfo()
    if (
      consent.isConsentFormAvailable &&
      consent.status === AdmobConsentStatus.REQUIRED
    )
      consent = await AdMob.showConsentForm()
    return {
      allowed: consent.canRequestAds,
      npa: false,
      changeable:
        consent.privacyOptionsRequirementStatus === PRIVACY_OPTIONS_REQUIRED,
    }
  } catch (error) {
    // Offline, or no consent message published in AdMob's Privacy &
    // messaging: keep earning, but with non-personalized ads only.
    console.warn('Consent unavailable; non-personalized ads only', error)
    return { allowed: true, npa: true, changeable: false }
  }
}

/**
 * Ask for consent where the law requires it (Google's UMP form), then for
 * App Tracking Transparency, then start the SDK. Only loaded in the iOS app.
 */
export async function startAdMob(): Promise<InterstitialAds> {
  let consent = await gatherConsent()
  let ready = false
  // Settings › Privacy Choices reopens Google's form. Ads requested after it
  // closes follow the new answer; one loaded under the old answer is dropped.
  const changeConsent = async () => {
    await AdMob.showPrivacyOptionsForm()
    consent = await gatherConsent()
    ready = false
    offerPrivacyChoices(consent.changeable ? changeConsent : null)
  }
  offerPrivacyChoices(consent.changeable ? changeConsent : null)

  if ((await AdMob.trackingAuthorizationStatus()).status === 'notDetermined')
    await AdMob.requestTrackingAuthorization()
  await AdMob.initialize({
    maxAdContentRating: MaxAdContentRating.ParentalGuidance,
  })

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
