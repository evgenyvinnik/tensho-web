import { useEffect } from 'react'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './routeManifest'

/** Announce the rendered UI language, including screens without SEO metadata. */
export function useDocumentLanguage(language: string): void {
  useEffect(() => {
    document.documentElement.lang = SUPPORTED_LANGUAGES.includes(
      language as SupportedLanguage
    )
      ? language
      : 'en'
  }, [language])
}
