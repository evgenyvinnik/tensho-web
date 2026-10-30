import {
  AdmobConsentStatus,
  type AdmobConsentInfo,
} from '@capacitor-community/admob'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { startAdMob } from './admobInterstitials'
import { offerPrivacyChoices, usePrivacyChoices } from './privacy'

const { AdMob } = vi.hoisted(() => ({
  AdMob: {
    requestConsentInfo: vi.fn(),
    showConsentForm: vi.fn(),
    showPrivacyOptionsForm: vi.fn(),
    trackingAuthorizationStatus: vi.fn(),
    requestTrackingAuthorization: vi.fn(),
    initialize: vi.fn(),
    addListener: vi.fn(),
    prepareInterstitial: vi.fn(),
    showInterstitial: vi.fn(),
  },
}))

vi.mock('@capacitor-community/admob', async (original) => ({
  ...(await original<typeof import('@capacitor-community/admob')>()),
  AdMob,
}))
vi.mock('../systems/AudioSystem', () => ({
  audioSystem: { pauseMusic: vi.fn(), resumeMusic: vi.fn() },
}))

// The plugin does not export PrivacyOptionsRequirementStatus at runtime.
type PrivacyOptions = AdmobConsentInfo['privacyOptionsRequirementStatus']
const REQUIRED = 'REQUIRED' as PrivacyOptions
const NOT_REQUIRED = 'NOT_REQUIRED' as PrivacyOptions

const consent = (
  privacyOptionsRequirementStatus: PrivacyOptions
): AdmobConsentInfo => ({
  status: AdmobConsentStatus.OBTAINED,
  canRequestAds: true,
  privacyOptionsRequirementStatus,
})
const npaOfLastAd = () =>
  (AdMob.prepareInterstitial.mock.lastCall?.[0] as { npa: boolean }).npa

beforeEach(() => {
  vi.clearAllMocks()
  offerPrivacyChoices(null)
  AdMob.trackingAuthorizationStatus.mockResolvedValue({ status: 'authorized' })
  AdMob.showPrivacyOptionsForm.mockResolvedValue(undefined)
})
afterEach(() => vi.restoreAllMocks())

it('offers Privacy Choices only where UMP requires them', async () => {
  AdMob.requestConsentInfo.mockResolvedValue(consent(NOT_REQUIRED))
  await startAdMob()
  expect(usePrivacyChoices.getState().open).toBeNull()

  AdMob.requestConsentInfo.mockResolvedValue(consent(REQUIRED))
  await startAdMob()
  expect(usePrivacyChoices.getState().open).toBeInstanceOf(Function)
})

it('gathers consent again once the form closes, and reloads the ad under it', async () => {
  AdMob.requestConsentInfo.mockResolvedValue(consent(REQUIRED))
  const ads = await startAdMob()
  await ads.prepare()
  await ads.prepare()
  expect(AdMob.prepareInterstitial).toHaveBeenCalledTimes(1)

  await usePrivacyChoices.getState().open!()
  expect(AdMob.showPrivacyOptionsForm).toHaveBeenCalledTimes(1)
  expect(AdMob.requestConsentInfo).toHaveBeenCalledTimes(2)
  expect(usePrivacyChoices.getState().open).toBeInstanceOf(Function)

  await ads.prepare()
  expect(AdMob.prepareInterstitial).toHaveBeenCalledTimes(2)
  expect(npaOfLastAd()).toBe(false)
})

it('stops loading ads when the new answer forbids them', async () => {
  AdMob.requestConsentInfo.mockResolvedValue(consent(REQUIRED))
  const ads = await startAdMob()
  AdMob.requestConsentInfo.mockResolvedValue({
    ...consent(REQUIRED),
    canRequestAds: false,
  })
  await usePrivacyChoices.getState().open!()

  await ads.prepare()
  expect(AdMob.prepareInterstitial).not.toHaveBeenCalled()
})

it('falls back to non-personalized ads if the check after the form fails', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  AdMob.requestConsentInfo.mockResolvedValue(consent(REQUIRED))
  const ads = await startAdMob()
  AdMob.requestConsentInfo.mockRejectedValue(new Error('offline'))
  await usePrivacyChoices.getState().open!()

  await ads.prepare()
  expect(npaOfLastAd()).toBe(true)
  expect(usePrivacyChoices.getState().open).toBeNull()
})

it('leaves consent untouched when the form cannot open', async () => {
  AdMob.requestConsentInfo.mockResolvedValue(consent(REQUIRED))
  await startAdMob()
  AdMob.showPrivacyOptionsForm.mockRejectedValue(new Error('No ViewController'))

  await expect(usePrivacyChoices.getState().open!()).rejects.toThrow()
  expect(AdMob.requestConsentInfo).toHaveBeenCalledTimes(1)
})
