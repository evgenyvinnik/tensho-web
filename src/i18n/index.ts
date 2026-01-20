/**
 * i18n Configuration for Tensho Mahjong Roguelike
 *
 * Supports 13 languages with browser language detection and localStorage persistence.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import all translation files
import en from './locales/en.json'
import ru from './locales/ru.json'
import tr from './locales/tr.json'
import id from './locales/id.json'
import es from './locales/es.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import zhHant from './locales/zh-Hant.json'
import zhHans from './locales/zh-Hans.json'
import fr from './locales/fr.json'
import it from './locales/it.json'
import tl from './locales/tl.json'
import th from './locales/th.json'

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
 * Resources for i18next
 */
const resources = {
  en: { translation: en },
  ru: { translation: ru },
  tr: { translation: tr },
  id: { translation: id },
  es: { translation: es },
  ja: { translation: ja },
  ko: { translation: ko },
  'zh-Hant': { translation: zhHant },
  'zh-Hans': { translation: zhHans },
  fr: { translation: fr },
  it: { translation: it },
  tl: { translation: tl },
  th: { translation: th },
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
  await i18n.changeLanguage(lang)
  // Also update localStorage directly for persistence
  localStorage.setItem('tensho-language', lang)
}
