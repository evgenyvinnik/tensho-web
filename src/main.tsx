// Keep first: in the iOS app it reads localStorage before any store does.
import { IS_NATIVE_APP, nativeStorageReady } from './native/nativeStorage'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerUpdates } from './pwa/registerUpdates'
import { registerReloadGuard } from './pwa/reloadGuards'
import {
  isOutsideRunPath,
  setUpdateBoundary,
  useUpdateStore,
} from './pwa/updateStore'
import './index.css'
import { i18nReady } from './i18n' // Initialize i18next
import App from './App.tsx'
import { AppErrorBoundary } from './components/ui/ErrorBoundary'
import { initializeMetaProgressionBridge } from './game/MetaProgressionBridge'
import { initializeClassicPersistence } from './game/classicPersistenceApp'
import { installFloraRevealQueue } from './game/floraRevealQueue'
import { installDecreeRevealQueue } from './game/decreeRevealQueue'
import { installOrbRevealQueue } from './game/orbRevealQueue'
import { scheduleBossAds } from './native/adBreaks'

// Install persisted Archive, lifetime progression, and achievement tracking
// before any run can emit gameplay events.
initializeMetaProgressionBridge()
installFloraRevealQueue()
installDecreeRevealQueue()
installOrbRevealQueue()
const persistence = initializeClassicPersistence()
registerReloadGuard(
  'classic',
  () => !persistence.hasLocalRun || persistence.retrySave()
)

// Updates apply themselves, but only outside a run: never during a hand, a
// scoring reveal, a pack choice or a purchase. Route changes (see the router)
// and backgrounding the tab are the moments an update is retried.
setUpdateBoundary(() => isOutsideRunPath(window.location.pathname))
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden')
    void useUpdateStore.getState().attempt()
})

// The iOS app behaves like a native game: no text selection or callouts.
if (IS_NATIVE_APP) document.documentElement.dataset.nativeApp = ''

// Register service worker for PWA. The iOS app updates through the App Store.
if (import.meta.env.PROD && !IS_NATIVE_APP && 'serviceWorker' in navigator) {
  void registerUpdates(
    navigator.serviceWorker,
    import.meta.env.BASE_URL,
    useUpdateStore.getState().announce
  ).catch((error) => console.warn('Offline installation unavailable', error))
}

// Only English is bundled up front; the detected language is fetched first so
// the interface does not render once in English and then again translated.
// The iOS app first restores saves the OS may have cleared.
void nativeStorageReady
  .then(() => i18nReady)
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </StrictMode>
    )
  })

// The iOS app's ads, after every second Boss. The consent and tracking prompts
// come after the first frame; the website never loads AdMob.
if (IS_NATIVE_APP)
  void nativeStorageReady
    .then(() => import('./native/admobInterstitials'))
    .then(({ startAdMob }) => startAdMob())
    .then((ads) => scheduleBossAds(ads))
    .catch((error: unknown) => console.warn('Ads unavailable', error))
