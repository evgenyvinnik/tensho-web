/**
 * Tensho Mahjong Roguelike - Main Application Component
 * Uses React Router for language-prefixed navigation with CRT aesthetics
 */

import { useMemo, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Screen imports
import { MenuScreen } from './components/screens/MenuScreen'
import { GameplayScreen } from './components/screens/GameplayScreen'
import { ShopScreen } from './components/screens/ShopScreen'
import { GameOverScreen } from './components/screens/GameOverScreen'
import { AchievementsScreen } from './components/screens/AchievementsScreen'
import { TutorialScreen } from './components/screens/TutorialScreen'
import { CollectionScreen } from './components/screens/CollectionScreen'
import { SettingsScreen } from './components/screens/SettingsScreen'

// Router imports
import { createAppRouter, AppRouterProvider } from './router'

const queryClient = new QueryClient()

/**
 * Loading fallback for Suspense while i18n loads
 */
function LoadingFallback() {
  return (
    <div className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)]">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[var(--color-golden-yellow)] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-2 border-4 border-[var(--color-vibrant-orange)] border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <p className="text-[var(--color-golden-yellow)] text-lg font-ui neon-text-subtle">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Main App Component with Router
 */
function App() {
  // Create the router with all screen components
  const router = useMemo(
    () =>
      createAppRouter({
        MenuScreen,
        GameplayScreen,
        ShopScreen,
        GameOverScreen,
        AchievementsScreen,
        TutorialScreen,
        CollectionScreen,
        SettingsScreen,
      }),
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingFallback />}>
        <AppRouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  )
}

export default App
