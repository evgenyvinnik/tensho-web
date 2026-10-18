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

// Register service worker for PWA
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void registerUpdates(
    navigator.serviceWorker,
    import.meta.env.BASE_URL,
    useUpdateStore.getState().announce
  ).catch((error) => console.warn('Offline installation unavailable', error))
}

// Only English is bundled up front; the detected language is fetched first so
// the interface does not render once in English and then again translated.
void i18nReady.finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>
  )
})
