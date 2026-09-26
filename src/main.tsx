import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerUpdates } from './pwa/registerUpdates'
import { registerReloadGuard } from './pwa/reloadGuards'
import { useUpdateStore } from './pwa/updateStore'
import './index.css'
import { i18nReady } from './i18n' // Initialize i18next
import App from './App.tsx'
import { AppErrorBoundary } from './components/ui/ErrorBoundary'
import { initializeMetaProgressionBridge } from './game/MetaProgressionBridge'
import { initializeClassicPersistence } from './game/classicPersistenceApp'

// Install persisted Archive, lifetime progression, and achievement tracking
// before any run can emit gameplay events.
initializeMetaProgressionBridge()
const persistence = initializeClassicPersistence()
registerReloadGuard(
  'classic',
  () => !persistence.hasLocalRun || persistence.retrySave()
)

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
