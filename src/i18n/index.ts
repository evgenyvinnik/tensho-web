/**
 * i18n Configuration for Tensho Mahjong Roguelike
 *
 * Supports 13 languages with browser language detection and localStorage persistence.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// English ships in the main bundle because it is the fallback: every missing
// key resolves through it, so it has to be present before anything renders.
// The other twelve are ~900KB of JSON between them and a player reads one, so
// they are fetched on demand and Vite gives each its own chunk.
import en from './locales/en.json'

/**
 * Supported language codes
 */
export const SUPPORTED_LANGUAGES = [
  'en',
  'ru',
  'tr',
  'id',
  'es',
  'ja',
  'ko',
  'zh-Hant',
  'zh-Hans',
  'fr',
  'it',
  'tl',
  'th',
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * Language display names (in their native script)
 */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ru: 'Русский',
  tr: 'Türkçe',
  id: 'Bahasa Indonesia',
  es: 'Español',
  ja: '日本語',
  ko: '한국어',
  'zh-Hant': '繁體中文',
  'zh-Hans': '简体中文',
  fr: 'Français',
  it: 'Italiano',
  tl: 'Tagalog',
  th: 'ไทย',
}

/**
 * Language display names in English (for accessibility)
 */
export const LANGUAGE_NAMES_EN: Record<SupportedLanguage, string> = {
  en: 'English',
  ru: 'Russian',
  tr: 'Turkish',
  id: 'Indonesian',
  es: 'Spanish',
  ja: 'Japanese',
  ko: 'Korean',
  'zh-Hant': 'Traditional Chinese',
  'zh-Hans': 'Simplified Chinese',
  fr: 'French',
  it: 'Italian',
  tl: 'Tagalog',
  th: 'Thai',
}

/**
 * Loaders for the languages that are not bundled up front.
 *
 * Written out rather than built from a template string so the bundler can see
 * every target statically and split them.
 */
const LOADERS: Record<
  Exclude<SupportedLanguage, 'en'>,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  ru: () => import('./locales/ru.json'),
  tr: () => import('./locales/tr.json'),
  id: () => import('./locales/id.json'),
  es: () => import('./locales/es.json'),
  ja: () => import('./locales/ja.json'),
  ko: () => import('./locales/ko.json'),
  'zh-Hant': () => import('./locales/zh-Hant.json'),
  'zh-Hans': () => import('./locales/zh-Hans.json'),
  fr: () => import('./locales/fr.json'),
  it: () => import('./locales/it.json'),
  tl: () => import('./locales/tl.json'),
  th: () => import('./locales/th.json'),
}

const loaded = new Set<SupportedLanguage>(['en'])

/**
 * Make sure a language's strings are in memory.
 *
 * Safe to call repeatedly and concurrently: the set guards the second call, and
 * a failed fetch leaves the language unloaded so i18next falls back to English
 * rather than rendering keys.
 */
export async function loadLanguage(lang: SupportedLanguage): Promise<void> {
  if (loaded.has(lang) || lang === 'en') return
  const load = LOADERS[lang as Exclude<SupportedLanguage, 'en'>]
  if (!load) return

  try {
    const bundle = await load()
    i18n.addResourceBundle(lang, 'translation', bundle.default, true, true)
    loaded.add(lang)
  } catch (error) {
    // Leaving it unloaded is the graceful outcome: English still renders.
    console.error(`Failed to load translations for ${lang}`, error)
  }
}

const resources = {
  en: { translation: en },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'tensho-language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already handles escaping
    },

    // React options
    react: {
      useSuspense: true,
    },
  })

/**
 * Resolves once the language i18next detected is actually in memory.
 *
 * Detection runs against `localStorage` and the browser, so on a second visit
 * the chosen language is known before the first render but its strings are
 * not. Awaiting this in the entry point keeps a Japanese player from seeing a
 * frame of English.
 */
export const i18nReady: Promise<void> = loadLanguage(getCurrentLanguage())

export default i18n

/**
 * Helper to check if a language code is supported
 */
export function isSupportedLanguage(code: string): code is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(code as SupportedLanguage)
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): SupportedLanguage {
  const lang = i18n.language
  if (isSupportedLanguage(lang)) {
    return lang
  }
  // Handle Chinese variants
  if (lang.startsWith('zh')) {
    return lang.includes('TW') || lang.includes('HK') || lang.includes('Hant')
      ? 'zh-Hant'
      : 'zh-Hans'
  }
  return 'en'
}

/**
 * Change the current language
 */
export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
  // Fetch before switching, so the interface never renders a frame of English
  // on its way to the language the player asked for.
  await loadLanguage(lang)
  await i18n.changeLanguage(lang)
  // Also update localStorage directly for persistence
  localStorage.setItem('tensho-language', lang)
}
