/**
 * Tensho Mahjong Roguelike - Main Application Component
 * Uses React Router for language-prefixed navigation with CRT aesthetics
 */

import { useMemo } from 'react'
import { lazyScreen as lazy } from './router/screenDownloadRecovery'

import { VFXProvider } from './hooks/useVFX'
import { useAudioLifecycle } from './hooks/useAudioLifecycle'
import { ClassicRunBoundary } from './components/gameplay/ClassicRunBoundary'
import { AchievementToast } from './components/ui/AchievementToast'

// Router imports
import { createAppRouter, AppRouterProvider } from './router'

// Module-scope lazy components keep their identity across renders. All screens
// share one chunk (see routedScreens); the PWA still precaches it for offline
// navigation.
const screens = () => import('./components/screens/routedScreens')
const MenuScreen = lazy(() =>
  screens().then((m) => ({ default: m.MenuScreen }))
)
const GameplayScreen = lazy(() =>
  screens().then((m) => ({ default: m.GameplayScreen }))
)
const ShopScreen = lazy(() =>
  screens().then((m) => ({ default: m.ShopScreen }))
)
const GameOverScreen = lazy(() =>
  screens().then((m) => ({ default: m.GameOverScreen }))
)
const AchievementsScreen = lazy(() =>
  screens().then((m) => ({ default: m.AchievementsScreen }))
)
const CodexScreen = lazy(() =>
  screens().then((m) => ({ default: m.CodexScreen }))
)
const CollectionScreen = lazy(() =>
  screens().then((m) => ({ default: m.CollectionScreen }))
)
const SettingsScreen = lazy(() =>
  screens().then((m) => ({ default: m.SettingsScreen }))
)

const ResumableGameplay = () => (
  <ClassicRunBoundary requested="play">
    <GameplayScreen />
  </ClassicRunBoundary>
)
const ResumableShop = () => (
  <ClassicRunBoundary requested="shop">
    <ShopScreen />
  </ClassicRunBoundary>
)
const ResumableResult = () => (
  <ClassicRunBoundary requested="game-over">
    <GameOverScreen />
  </ClassicRunBoundary>
)

/**
 * Main App Component with Router
 */
function App() {
  useAudioLifecycle()
  // Create the router with all screen components
  const router = useMemo(
    () =>
      createAppRouter({
        MenuScreen,
        GameplayScreen: ResumableGameplay,
        ShopScreen: ResumableShop,
        GameOverScreen: ResumableResult,
        AchievementsScreen,
        CodexScreen,
        CollectionScreen,
        SettingsScreen,
      }),
    []
  )

  return (
    <VFXProvider>
      <AppRouterProvider router={router} />
      <AchievementToast />
    </VFXProvider>
  )
}

export default App
