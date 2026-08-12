/**
 * Language Selector Component
 *
 * A dropdown component for selecting the game language.
 * Displays language names in their native script for easy identification.
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  LANGUAGE_NAMES_EN,
  getCurrentLanguage,
  type SupportedLanguage,
} from '../../i18n'
import { useAppNavigation } from '../../router'

interface LanguageSelectorProps {
  className?: string
  compact?: boolean
}

/**
 * Language selector dropdown
 */
export function LanguageSelector({ className = '', compact = false }: LanguageSelectorProps) {
  const { t } = useTranslation()
  const { changeLanguage: switchLanguage } = useAppNavigation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = getCurrentLanguage()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // The URL carries the language, and LanguageSync mirrors it back into
  // i18next on every render. Switching i18next alone would be undone on the
  // next pass, so the navigation helper moves the URL as well.
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await switchLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          bg-[var(--color-forest-green)] hover:bg-[var(--color-dark-forest)]
          text-[var(--color-beige-white)] font-ui
          border-2 border-[var(--color-golden-yellow)] border-opacity-50
          transition-all duration-200
          min-w-[44px] min-h-[44px]
          ${isOpen ? 'ring-2 ring-[var(--color-golden-yellow)]' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('accessibility.selectLanguage')}
      >
        {/* Globe Icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>

        {/* Current Language */}
        {!compact && (
          <span className="hidden sm:inline">{LANGUAGE_NAMES[currentLang]}</span>
        )}

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 right-0
            bg-[var(--color-dark-forest)] rounded-lg
            border-2 border-[var(--color-golden-yellow)] border-opacity-50
            shadow-xl shadow-black/30
            max-h-[60vh] overflow-y-auto
            min-w-[200px]
          `}
          role="listbox"
          aria-label={t('accessibility.selectLanguage')}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              className={`
                w-full px-4 py-3 text-left
                flex items-center justify-between gap-4
                transition-colors duration-150
                min-h-[44px]
                ${
                  lang === currentLang
                    ? 'bg-[var(--color-forest-green)] text-[var(--color-golden-yellow)]'
                    : 'text-[var(--color-beige-white)] hover:bg-[var(--color-forest-green)]'
                }
                ${lang === SUPPORTED_LANGUAGES[0] ? 'rounded-t-lg' : ''}
                ${lang === SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1] ? 'rounded-b-lg' : ''}
              `}
              role="option"
              aria-selected={lang === currentLang}
            >
              {/* Native Name */}
              <span className="font-ui text-base">{LANGUAGE_NAMES[lang]}</span>

              {/* English Name (for accessibility) */}
              <span className="text-sm opacity-60">{LANGUAGE_NAMES_EN[lang]}</span>

              {/* Checkmark for selected */}
              {lang === currentLang && (
                <svg className="w-5 h-5 text-[var(--color-golden-yellow)]" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Compact language selector for mobile/small spaces
 */
export function LanguageSelectorCompact({ className = '' }: { className?: string }) {
  return <LanguageSelector className={className} compact />
}

export default LanguageSelector
