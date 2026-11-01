/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** Rewarded-ad provider: 'google', 'simulate', or unset for none. */
  readonly VITE_REWARDED_ADS?: string
  /** AdSense publisher id (ca-pub-…) for the Google provider. */
  readonly VITE_ADSENSE_CLIENT?: string
  /** 'on' requests Google's test ads. */
  readonly VITE_ADS_TEST?: string
}
