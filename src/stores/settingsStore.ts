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
  showTileHints: boolean
  animationSpeed: 'slow' | 'normal' | 'fast'
  reducedMotion: boolean

  // Language setting (synced with i18next via localStorage)
  language: SupportedLanguage

  // Actions
  setMusicVolume: (volume: number) => void
  setSfxVolume: (volume: number) => void
  toggleMusic: () => void
  toggleSfx: () => void
  setShowTileHints: (show: boolean) => void
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void
  setReducedMotion: (reduced: boolean) => void
  setLanguage: (language: SupportedLanguage) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS = {
  musicVolume: 0.7,
  sfxVolume: 0.8,
  musicEnabled: true,
  sfxEnabled: true,
  showTileHints: true,
  animationSpeed: 'normal' as const,
  reducedMotion: false,
  language: 'en' as SupportedLanguage,
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

      setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => {
        set({ animationSpeed: speed })
      },

      setReducedMotion: (reduced: boolean) => {
        set({ reducedMotion: reduced })
      },

      setLanguage: (language: SupportedLanguage) => {
        set({ language })
        // Also update localStorage for i18next synchronization
        localStorage.setItem('tensho-language', language)
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
        animationSpeed: state.animationSpeed,
        reducedMotion: state.reducedMotion,
        language: state.language,
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
