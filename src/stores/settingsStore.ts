/**
 * Settings Store - User settings with localStorage persistence
 *
 * Manages audio settings, language, and other user preferences.
 * Uses Zustand's persist middleware to save settings to localStorage.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SupportedLanguage } from '../i18n'

export interface SettingsState {
  // Audio settings
  musicVolume: number // 0.0 to 1.0
  sfxVolume: number // 0.0 to 1.0
  musicEnabled: boolean
  sfxEnabled: boolean

  // Display settings
  /** Group shapes in the rack (Pairs, Sequences…). */
  showTileHints: boolean
  /** Arabic rank numbers on tile faces, for players who cannot read them yet. */
  showRankNumbers: boolean
  animationSpeed: 'slow' | 'normal' | 'fast'
  reducedMotion: boolean
  /** One-key table shortcuts (P, R, A, Esc); can be turned off (WCAG 2.1.4). */
  keyboardShortcuts: boolean

  // Language setting (synced with i18next via localStorage)
  language: SupportedLanguage

  // Gameplay settings
  redFivesEnabled: boolean // Enable red fives (aka-dora) for bonus scoring

  // Actions
  setMusicVolume: (volume: number) => void
  setSfxVolume: (volume: number) => void
  toggleMusic: () => void
  toggleSfx: () => void
  setShowTileHints: (show: boolean) => void
  setShowRankNumbers: (show: boolean) => void
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void
  setReducedMotion: (reduced: boolean) => void
  setKeyboardShortcuts: (enabled: boolean) => void
  setLanguage: (language: SupportedLanguage) => void
  setRedFivesEnabled: (enabled: boolean) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS = {
  musicVolume: 0.7,
  sfxVolume: 0.8,
  musicEnabled: true,
  sfxEnabled: true,
  showTileHints: true,
  showRankNumbers: false,
  animationSpeed: 'normal' as const,
  reducedMotion: false,
  keyboardShortcuts: true,
  language: 'en' as SupportedLanguage,
  redFivesEnabled: false, // Red fives disabled by default for backward compatibility
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state (defaults)
      ...DEFAULT_SETTINGS,

      // Actions
      setMusicVolume: (volume: number) => {
        set({ musicVolume: clamp(volume, 0, 1) })
      },

      setSfxVolume: (volume: number) => {
        set({ sfxVolume: clamp(volume, 0, 1) })
      },

      toggleMusic: () => {
        set((state) => ({ musicEnabled: !state.musicEnabled }))
      },

      toggleSfx: () => {
        set((state) => ({ sfxEnabled: !state.sfxEnabled }))
      },

      setShowTileHints: (show: boolean) => {
        set({ showTileHints: show })
      },

      setShowRankNumbers: (show: boolean) => {
        set({ showRankNumbers: show })
      },

      setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => {
        set({ animationSpeed: speed })
      },

      setReducedMotion: (reduced: boolean) => {
        set({ reducedMotion: reduced })
      },

      setKeyboardShortcuts: (enabled: boolean) => {
        set({ keyboardShortcuts: enabled })
      },

      setLanguage: (language: SupportedLanguage) => {
        set({ language })
        // Also update localStorage for i18next synchronization
        localStorage.setItem('tensho-language', language)
      },

      setRedFivesEnabled: (enabled: boolean) => {
        set({ redFivesEnabled: enabled })
      },

      resetSettings: () => {
        set(DEFAULT_SETTINGS)
      },
    }),
    {
      name: 'tensho-settings', // localStorage key
      version: 1, // Schema version for migrations
      partialize: (state) => ({
        // Only persist these fields (not actions)
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        musicEnabled: state.musicEnabled,
        sfxEnabled: state.sfxEnabled,
        showTileHints: state.showTileHints,
        showRankNumbers: state.showRankNumbers,
        animationSpeed: state.animationSpeed,
        reducedMotion: state.reducedMotion,
        keyboardShortcuts: state.keyboardShortcuts,
        language: state.language,
        redFivesEnabled: state.redFivesEnabled,
      }),
    }
  )
)

/**
 * Selector: Get effective music volume (0 if disabled)
 */
export const selectEffectiveMusicVolume = (state: SettingsState): number => {
  return state.musicEnabled ? state.musicVolume : 0
}

/**
 * Selector: Get effective SFX volume (0 if disabled)
 */
export const selectEffectiveSfxVolume = (state: SettingsState): number => {
  return state.sfxEnabled ? state.sfxVolume : 0
}

/**
 * Selector: Get animation duration multiplier based on speed setting
 */
export const selectAnimationMultiplier = (state: SettingsState): number => {
  if (state.reducedMotion) {
    return 0 // No animations
  }

  switch (state.animationSpeed) {
    case 'slow':
      return 1.5
    case 'normal':
      return 1.0
    case 'fast':
      return 0.5
    default:
      return 1.0
  }
}
