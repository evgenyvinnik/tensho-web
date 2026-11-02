import { create } from 'zustand'

/** The apps open the policy in the browser, at the site's public address. */
export const PUBLIC_PRIVACY_POLICY_URL = 'https://tensho.app/privacy/'

/** The website links its own copy, served as-is from public/privacy/. */
export const privacyPolicyUrl = (
  native: boolean,
  base: string = import.meta.env.BASE_URL
): string => (native ? PUBLIC_PRIVACY_POLICY_URL : `${base}privacy/`)

/**
 * Settings › Privacy Choices. Only the apps' AdMob module registers it,
 * and only while Google's consent check (UMP) says the player must be able to
 * change their answer. The website imports this module, never Capacitor.
 */
interface PrivacyChoicesState {
  /** Shows Google's privacy options form; null when none is required. */
  open: (() => Promise<void>) | null
}

export const usePrivacyChoices = create<PrivacyChoicesState>(() => ({
  open: null,
}))

export function offerPrivacyChoices(open: (() => Promise<void>) | null) {
  usePrivacyChoices.setState({ open })
}
