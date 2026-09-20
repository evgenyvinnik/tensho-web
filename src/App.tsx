/**
 * Tensho Mahjong Roguelike - Main Application Component
 * Uses React Router for language-prefixed navigation with CRT aesthetics
 */

import { lazy, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { VFXProvider } from './hooks/useVFX'
import { useAudioLifecycle } from './hooks/useAudioLifecycle'

// Router imports
import { createAppRouter, AppRouterProvider } from './router'

const queryClient = new QueryClient()

// Module-scope lazy components keep their identity across renders. Each screen
// has a separate chunk; the PWA still precaches them for offline navigation.
const MenuScreen = lazy(() =>
  import('./components/screens/MenuScreen').then((m) => ({
    default: m.MenuScreen,
  }))
)
const GameplayScreen = lazy(() =>
  import('./components/screens/GameplayScreen').then((m) => ({
    default: m.GameplayScreen,
  }))
)
const TableLoopScreen = lazy(() =>
  import('./components/screens/TableLoopScreen').then((m) => ({
    default: m.TableLoopScreen,
  }))
)
const ShopScreen = lazy(() =>
  import('./components/screens/ShopScreen').then((m) => ({
    default: m.ShopScreen,
  }))
)
const GameOverScreen = lazy(() =>
  import('./components/screens/GameOverScreen').then((m) => ({
    default: m.GameOverScreen,
  }))
)
const AchievementsScreen = lazy(() =>
  import('./components/screens/AchievementsScreen').then((m) => ({
    default: m.AchievementsScreen,
  }))
)
const CodexScreen = lazy(() =>
  import('./components/screens/CodexScreen').then((m) => ({
    default: m.CodexScreen,
  }))
)
const CollectionScreen = lazy(() =>
  import('./components/screens/CollectionScreen').then((m) => ({
    default: m.CollectionScreen,
  }))
)
const SettingsScreen = lazy(() =>
  import('./components/screens/SettingsScreen').then((m) => ({
    default: m.SettingsScreen,
  }))
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
        GameplayScreen,
        TableLoopScreen,
        ShopScreen,
        GameOverScreen,
        AchievementsScreen,
        CodexScreen,
        CollectionScreen,
        SettingsScreen,
      }),
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      <VFXProvider>
        <AppRouterProvider router={router} />
      </VFXProvider>
    </QueryClientProvider>
  )
}

export default App
