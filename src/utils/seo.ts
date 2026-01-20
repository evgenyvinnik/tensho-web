/**
 * SEO utilities for Tensho
 *
 * Provides hooks and utilities for managing page-level SEO metadata.
 * Updates document title and meta tags dynamically based on the current route.
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * SEO metadata for a page
 */
export interface PageSEO {
  /** Page title (will be appended with " | Tensho") */
  title?: string
  /** Page description for meta description tag */
  description?: string
  /** Canonical URL path (e.g., "/en/play") */
  canonicalPath?: string
  /** Open Graph image override */
  ogImage?: string
  /** Prevent indexing for this page */
  noIndex?: boolean
}

/** Default SEO values */
const DEFAULT_SEO: Required<PageSEO> = {
  title: 'Tensho (天翔) - Mahjong Roguelike Game',
  description:
    'A strategic roguelike deck-builder inspired by Riichi Mahjong. Build powerful tile combinations, collect Decrees, and master Yaku patterns.',
  canonicalPath: '/',
  ogImage: '/og-image.png',
  noIndex: false,
}

/** Base URL for the site */
const BASE_URL = 'https://tensho.game'

/**
 * Updates a meta tag's content, creating it if it doesn't exist
 */
function updateMetaTag(
  selector: string,
  content: string,
  attribute: 'name' | 'property' = 'name'
): void {
  let element = document.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    const attrName = selector.match(/\[(?:name|property)="([^"]+)"\]/)?.[1]
    if (attrName) {
      element.setAttribute(attribute, attrName)
    }
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

/**
 * Updates the canonical link tag
 */
function updateCanonicalLink(url: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }

  link.setAttribute('href', url)
}

/**
 * Hook to set page-level SEO metadata
 *
 * @example
 * ```tsx
 * function PlayPage() {
 *   usePageSEO({
 *     title: 'Play',
 *     description: 'Start your Tensho run and build powerful hands.',
 *     canonicalPath: '/en/play',
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function usePageSEO(seo: PageSEO = {}): void {
  const { i18n } = useTranslation()

  useEffect(() => {
    const merged = { ...DEFAULT_SEO, ...seo }
    const fullTitle = seo.title ? `${seo.title} | Tensho` : merged.title
    const canonicalUrl = `${BASE_URL}${merged.canonicalPath}`

    // Update document title
    document.title = fullTitle

    // Update meta tags
    updateMetaTag('meta[name="title"]', fullTitle, 'name')
    updateMetaTag('meta[name="description"]', merged.description, 'name')

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', fullTitle, 'property')
    updateMetaTag('meta[property="og:description"]', merged.description, 'property')
    updateMetaTag('meta[property="og:url"]', canonicalUrl, 'property')
    updateMetaTag('meta[property="og:image"]', `${BASE_URL}${merged.ogImage}`, 'property')
    updateMetaTag('meta[property="og:locale"]', getOGLocale(i18n.language), 'property')

    // Update Twitter tags
    updateMetaTag('meta[name="twitter:title"]', fullTitle, 'name')
    updateMetaTag('meta[name="twitter:description"]', merged.description, 'name')
    updateMetaTag('meta[name="twitter:url"]', canonicalUrl, 'name')
    updateMetaTag('meta[name="twitter:image"]', `${BASE_URL}${merged.ogImage}`, 'name')

    // Update canonical link
    updateCanonicalLink(canonicalUrl)

    // Update robots
    if (merged.noIndex) {
      updateMetaTag('meta[name="robots"]', 'noindex, nofollow', 'name')
    } else {
      updateMetaTag('meta[name="robots"]', 'index, follow', 'name')
    }

    // Update lang attribute
    document.documentElement.lang = i18n.language

    // Cleanup: restore defaults when unmounting
    return () => {
      document.title = DEFAULT_SEO.title
    }
  }, [seo.title, seo.description, seo.canonicalPath, seo.ogImage, seo.noIndex, i18n.language])
}

/**
 * Converts i18n language code to Open Graph locale format
 */
function getOGLocale(lang: string): string {
  const localeMap: Record<string, string> = {
    en: 'en_US',
    ja: 'ja_JP',
    ko: 'ko_KR',
    'zh-Hans': 'zh_CN',
    'zh-Hant': 'zh_TW',
    es: 'es_ES',
    fr: 'fr_FR',
    it: 'it_IT',
    ru: 'ru_RU',
    tr: 'tr_TR',
    id: 'id_ID',
    th: 'th_TH',
    tl: 'tl_PH',
  }

  return localeMap[lang] || 'en_US'
}

/**
 * Pre-defined SEO configurations for common pages
 */
export const PAGE_SEO = {
  menu: {
    title: undefined, // Use default
    description:
      'A strategic roguelike deck-builder inspired by Riichi Mahjong. Build powerful tile combinations, collect Decrees, and master Yaku patterns.',
    canonicalPath: '/',
  },
  play: {
    title: 'Play',
    description:
      'Start your Tensho run. Draw tiles, build hands, trigger Yaku patterns, and climb through Acts to achieve the highest score.',
    canonicalPath: '/play',
  },
  shop: {
    title: 'Tea House',
    description:
      'Visit the Tea House to purchase Decrees, Fate Seals, Celestial Orbs, and more to power up your run.',
    canonicalPath: '/shop',
  },
  tutorial: {
    title: 'Tutorial',
    description:
      'Learn how to play Tensho. Master the basics of Mahjong tiles, Yaku patterns, and roguelike mechanics.',
    canonicalPath: '/tutorial',
  },
  settings: {
    title: 'Settings',
    description: 'Configure game settings including audio, language, and display preferences.',
    canonicalPath: '/settings',
    noIndex: true,
  },
  achievements: {
    title: 'Heavenly Accolades',
    description:
      'View your achievements and progress. Unlock rewards by mastering Tensho gameplay.',
    canonicalPath: '/achievements',
  },
  collection: {
    title: 'Archive of Hands',
    description:
      'Browse your collection of discovered Yaku, Decrees, Seals, and more in the Archive of Hands.',
    canonicalPath: '/collection',
  },
  gameOver: {
    title: 'Game Over',
    description: 'Your run has ended. View your final score and start a new game.',
    canonicalPath: '/game-over',
    noIndex: true,
  },
} as const

/**
 * Get SEO config with language prefix
 */
export function getLocalizedSEO(
  page: keyof typeof PAGE_SEO,
  lang: string
): PageSEO {
  const baseSEO = PAGE_SEO[page]
  return {
    ...baseSEO,
    canonicalPath: `/${lang}${baseSEO.canonicalPath === '/' ? '' : baseSEO.canonicalPath}`,
  }
}
