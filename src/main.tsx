import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { i18nReady } from './i18n' // Initialize i18next
import App from './App.tsx'
import { AppErrorBoundary } from './components/ui/ErrorBoundary'
import { initializeMetaProgressionBridge } from './game/MetaProgressionBridge'

// Install persisted Archive, lifetime progression, and achievement tracking
// before any run can emit gameplay events.
initializeMetaProgressionBridge()

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

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
