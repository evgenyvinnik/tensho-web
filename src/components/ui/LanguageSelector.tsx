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
import { ControlIcon } from './ControlIcon'

interface LanguageSelectorProps {
  className?: string
  compact?: boolean
  /**
   * Fill the container (Settings): the button spells out the native and
   * English names like the list rows, and the list is at least as wide as
   * the button and centred under it.
   */
  fullWidth?: boolean
}

/**
 * Language selector dropdown
 */
export function LanguageSelector({
  className = '',
  compact = false,
  fullWidth = false,
}: LanguageSelectorProps) {
  const { t } = useTranslation()
  const { changeLanguage: switchLanguage } = useAppNavigation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = getCurrentLanguage()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  // The URL carries the language too. The navigation helper rewrites the
  // current entry in place, so Back leaves this screen and keeps the choice.
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await switchLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative ${fullWidth ? 'block w-full' : 'inline-block'} ${className}`}
    >
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
          ${fullWidth ? 'w-full' : ''}
          ${isOpen ? 'ring-2 ring-[var(--color-golden-yellow)]' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('accessibility.selectLanguage')}
      >
        {fullWidth ? (
          <>
            <span className="shrink-0 whitespace-nowrap text-base">
              {LANGUAGE_NAMES[currentLang]}
            </span>
            {/* Only the English name gives way on a very narrow screen. */}
            <span className="ml-auto min-w-0 truncate text-sm opacity-60">
              {LANGUAGE_NAMES_EN[currentLang]}
            </span>
          </>
        ) : (
          <>
            {/* Compact live language code keeps this control identifiable. */}
            <span
              aria-hidden="true"
              className="inline-flex h-5 min-w-5 items-center justify-center text-[10px] font-semibold leading-none"
            >
              {currentLang.toUpperCase()}
            </span>

            {/* Current Language */}
            {!compact && (
              <span className="hidden whitespace-nowrap sm:inline">
                {LANGUAGE_NAMES[currentLang]}
              </span>
            )}
          </>
        )}

        {/* Dropdown Arrow */}
        <ControlIcon
          name="next"
          size={16}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? '-rotate-90' : 'rotate-90'}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2
            bg-[var(--color-dark-forest)] rounded-lg
            border-2 border-[var(--color-golden-yellow)] border-opacity-50
            shadow-xl shadow-black/30
            max-h-[60vh] overflow-y-auto
            w-max max-w-[calc(100vw-2rem)]
            ${
              // Centred under a full-width button, the list can spill into the
              // panel padding on a narrow phone instead of wrapping names.
              fullWidth
                ? 'left-1/2 -translate-x-1/2 min-w-full'
                : 'right-0 min-w-[200px]'
            }
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
              <span className="font-ui text-base shrink-0 whitespace-nowrap">
                {LANGUAGE_NAMES[lang]}
              </span>

              {/* English Name (for accessibility); on a very narrow screen it
                  shortens with an ellipsis rather than wrapping. */}
              <span className="min-w-0 truncate text-sm opacity-60">
                {LANGUAGE_NAMES_EN[lang]}
              </span>

              {/* Checkmark for selected */}
              {lang === currentLang && (
                <ControlIcon
                  name="check"
                  size={20}
                  className="shrink-0 text-[var(--color-golden-yellow)]"
                />
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
export function LanguageSelectorCompact({
  className = '',
}: {
  className?: string
}) {
  return <LanguageSelector className={className} compact />
}

export default LanguageSelector
