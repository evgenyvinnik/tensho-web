/**
 * Router Configuration for Tensho Mahjong Roguelike
 *
 * Implements language-prefixed routes for i18n support:
 * - /:lang/ - Menu (default)
 * - /:lang/play - Gameplay
 * - /:lang/shop - Tea House shop
 * - /:lang/game-over - Game over screen
 * - /:lang/tutorial - Tutorial
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
} from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  getCurrentLanguage,
  changeLanguage,
  type SupportedLanguage,
} from '../i18n'

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
  TUTORIAL: 'tutorial',
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
      const currentPath = window.location.pathname
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
  TutorialScreen?: React.ComponentType
  CollectionScreen?: React.ComponentType
  SettingsScreen?: React.ComponentType
  AchievementsScreen?: React.ComponentType
}) {
  const {
    MenuScreen,
    GameplayScreen,
    ShopScreen,
    GameOverScreen,
    TutorialScreen,
    CollectionScreen,
    SettingsScreen,
    AchievementsScreen,
  } = routes

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
    },
    // Language-prefixed routes
    {
      path: '/:lang',
      element: <LanguageLayout />,
      children: [
        {
          index: true,
          element: <MenuScreen />,
        },
        {
          path: ROUTES.PLAY,
          element: <GameplayScreen />,
        },
        {
          path: ROUTES.SHOP,
          element: <ShopScreen />,
        },
        {
          path: ROUTES.GAME_OVER,
          element: <GameOverScreen />,
        },
        {
          path: ROUTES.TUTORIAL,
          element: TutorialScreen ? <TutorialScreen /> : <PlaceholderScreen title="Tutorial" />,
        },
        {
          path: ROUTES.COLLECTION,
          element: CollectionScreen ? <CollectionScreen /> : <PlaceholderScreen title="Collection" />,
        },
        {
          path: ROUTES.SETTINGS,
          element: SettingsScreen ? <SettingsScreen /> : <PlaceholderScreen title="Settings" />,
        },
        {
          path: ROUTES.ACHIEVEMENTS,
          element: AchievementsScreen ? <AchievementsScreen /> : <PlaceholderScreen title="Achievements" />,
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
  ])
}

/**
 * App Router Provider component
 */
export function AppRouterProvider({
  router,
  children,
}: {
  router: ReturnType<typeof createBrowserRouter>
  children?: React.ReactNode
}) {
  return <RouterProvider router={router} />
}
