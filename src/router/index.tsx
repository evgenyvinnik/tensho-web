/**
 * Router Configuration for Tensho Mahjong Roguelike
 *
 * Implements language-prefixed routes for i18n support:
 * - /:lang/ - Menu (default)
 * - /:lang/play - Gameplay
 * - /:lang/shop - Tea House shop
 * - /:lang/game-over - Game over screen
 * - /:lang/codex - Codex (game reference guide)
 * - /:lang/tutorial - Legacy redirect to Codex
 * - /:lang/collection - Collection
 * - /:lang/settings - Settings
 * - /:lang/achievements - Achievements
 */

import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useParams,
  useNavigate,
  useLocation,
  useRouteError,
  isRouteErrorResponse,
} from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  isSupportedLanguage,
  getCurrentLanguage,
  changeLanguage,
  type SupportedLanguage,
} from '../i18n'
import { ErrorFallback, reportError } from '../components/ui/ErrorBoundary'
import { APP_BASE_URL, APP_ROUTER_BASENAME } from '../utils/basePath'

// Re-export navigation hooks for use in components
export { useNavigate, useLocation, useParams }

/**
 * Route paths (without language prefix)
 */
export const ROUTES = {
  MENU: '',
  PLAY: 'play',
  SHOP: 'shop',
  GAME_OVER: 'game-over',
  CODEX: 'codex',
  TUTORIAL: 'tutorial', // Legacy alias for CODEX
  COLLECTION: 'collection',
  SETTINGS: 'settings',
  ACHIEVEMENTS: 'achievements',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

/**
 * Build a full path with language prefix
 */
export function buildPath(route: RoutePath, lang?: SupportedLanguage): string {
  const language = lang || getCurrentLanguage()
  return `/${language}/${route}`.replace(/\/$/, '') || `/${language}`
}

/**
 * Hook to get navigation helpers with language awareness
 */
export function useAppNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useParams<{ lang: string }>()
  const currentLang = (isSupportedLanguage(lang || '') ? lang : getCurrentLanguage()) as SupportedLanguage

  return {
    /**
     * Navigate to a route within the current language
     */
    navigateTo: (route: RoutePath) => {
      navigate(buildPath(route, currentLang))
    },

    /**
     * Navigate to the same route but in a different language
     */
    changeLanguage: async (newLang: SupportedLanguage) => {
      await changeLanguage(newLang)
      // Router locations are already stripped of the deployment basename.
      const currentPath = location.pathname
      const pathWithoutLang = currentPath.replace(/^\/[^/]+/, '')
      navigate(`/${newLang}${pathWithoutLang || ''}`)
    },

    /**
     * Go back in history
     */
    goBack: () => navigate(-1),

    /**
     * Current language from URL
     */
    currentLang,
  }
}

/**
 * Component that syncs URL language with i18n
 */
export function LanguageSync({ children }: { children: React.ReactNode }) {
  const { lang } = useParams<{ lang: string }>()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!lang) return

    // If the URL language is different from i18n language, sync them
    if (isSupportedLanguage(lang) && i18n.language !== lang) {
      changeLanguage(lang)
    }
  }, [lang, i18n.language])

  // If language in URL is invalid, redirect to current language
  useEffect(() => {
    if (lang && !isSupportedLanguage(lang)) {
      const currentLang = getCurrentLanguage()
      const pathWithoutLang = location.pathname.replace(/^\/[^/]+/, '')
      navigate(`/${currentLang}${pathWithoutLang || ''}`, { replace: true })
    }
  }, [lang, navigate, location.pathname])

  return <>{children}</>
}

/**
 * Root redirect - redirects to user's preferred language
 */
export function RootRedirect() {
  const currentLang = getCurrentLanguage()
  return <Navigate to={`/${currentLang}`} replace />
}

/**
 * Route error boundary component for React Router
 */
export function RouteErrorBoundary() {
  const error = useRouteError()

  // Handle route errors (404, etc.)
  if (isRouteErrorResponse(error)) {
    return (
      <div className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)] p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🗺️</div>
          <h1 className="text-3xl font-bold text-[var(--color-golden-yellow)] mb-3">
            {error.status === 404 ? 'Page Not Found' : `Error ${error.status}`}
          </h1>
          <p className="text-[var(--color-beige-white)] mb-6">
            {error.status === 404
              ? "The page you're looking for doesn't exist."
              : error.statusText || 'Something went wrong.'}
          </p>
          <button
            onClick={() => (window.location.href = APP_BASE_URL)}
            className="px-6 py-3 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                       text-white font-bold rounded-lg transition-all hover:scale-105
                       border-2 border-[var(--color-golden-yellow)]"
          >
            Go to Menu
          </button>
        </div>
      </div>
    )
  }

  // Handle JavaScript errors
  const actualError = error instanceof Error ? error : new Error('Unknown error occurred')
  reportError(actualError)

  return (
    <ErrorFallback
      error={actualError}
      onRetry={() => window.location.reload()}
      onGoHome={() => (window.location.href = APP_BASE_URL)}
      variant="full"
    />
  )
}

/**
 * Language layout wrapper that provides language sync
 */
export function LanguageLayout() {
  return (
    <LanguageSync>
      <Outlet />
    </LanguageSync>
  )
}

/**
 * Create the router with all routes
 * This is called with lazy-loaded route components
 */
export function createAppRouter(routes: {
  MenuScreen: React.ComponentType
  GameplayScreen: React.ComponentType
  ShopScreen: React.ComponentType
  GameOverScreen: React.ComponentType
  CodexScreen?: React.ComponentType
  TutorialScreen?: React.ComponentType // Legacy alias for CodexScreen
  CollectionScreen?: React.ComponentType
  SettingsScreen?: React.ComponentType
  AchievementsScreen?: React.ComponentType
}) {
  const {
    MenuScreen,
    GameplayScreen,
    ShopScreen,
    GameOverScreen,
    CodexScreen,
    TutorialScreen,
    CollectionScreen,
    SettingsScreen,
    AchievementsScreen,
  } = routes

  // Use CodexScreen if available, fall back to TutorialScreen for backwards compatibility
  const ActualCodexScreen = CodexScreen || TutorialScreen

  // Placeholder component for unimplemented screens
  const PlaceholderScreen = ({ title }: { title: string }) => (
    <div className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)]">
      <div className="text-center text-[var(--color-beige-white)]">
        <h1 className="text-2xl mb-4">{title}</h1>
        <p className="opacity-70">Coming Soon</p>
      </div>
    </div>
  )

  return createBrowserRouter([
    // Root redirect to default language
    {
      path: '/',
      element: <RootRedirect />,
      errorElement: <RouteErrorBoundary />,
    },
    // Language-prefixed routes
    {
      path: '/:lang',
      element: <LanguageLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          index: true,
          element: <MenuScreen />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: ROUTES.PLAY,
          element: <GameplayScreen />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: ROUTES.SHOP,
          element: <ShopScreen />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: ROUTES.GAME_OVER,
          element: <GameOverScreen />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: ROUTES.CODEX,
          element: ActualCodexScreen ? <ActualCodexScreen /> : <PlaceholderScreen title="Codex" />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          // Legacy tutorial route redirects to Codex
          path: ROUTES.TUTORIAL,
          element: <Navigate to={`../${ROUTES.CODEX}`} replace />,
        },
        {
          path: ROUTES.COLLECTION,
          element: CollectionScreen ? <CollectionScreen /> : <PlaceholderScreen title="Collection" />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: ROUTES.SETTINGS,
          element: SettingsScreen ? <SettingsScreen /> : <PlaceholderScreen title="Settings" />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: ROUTES.ACHIEVEMENTS,
          element: AchievementsScreen ? <AchievementsScreen /> : <PlaceholderScreen title="Achievements" />,
          errorElement: <RouteErrorBoundary />,
        },
        // Catch-all for unknown routes within a language - redirect to menu
        {
          path: '*',
          element: <Navigate to="" replace />,
        },
      ],
    },
    // Catch-all for completely unknown routes
    {
      path: '*',
      element: <RootRedirect />,
    },
  ], {
    basename: APP_ROUTER_BASENAME,
  })
}

/**
 * App Router Provider component
 */
export function AppRouterProvider({
  router,
  children: _children,
}: {
  router: ReturnType<typeof createBrowserRouter>
  children?: React.ReactNode
}) {
  return <RouterProvider router={router} />
}
