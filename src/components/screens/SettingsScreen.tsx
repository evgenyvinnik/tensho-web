/**
 * SettingsScreen Component
 *
 * Settings page for audio, visual, and gameplay preferences.
 * Uses the settingsStore for persistence.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation } from '../../router'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAchievementStore } from '../../stores/achievementStore'
import { Button } from '../ui/Button'
import { BackButton } from '../ui/BackButton'
import { Slider } from '../ui/Slider'
import { Toggle } from '../ui/Toggle'
import { LanguageSelector } from '../ui/LanguageSelector'
import { ConfirmPopup, AlertPopup } from '../ui/Popup'
import {
  PROGRESSIVE_HINTS_STORAGE_KEY,
  HINTS_DISABLED_STORAGE_KEY,
} from '../../config/progressiveTutorialHints'

/**
 * SettingsScreen - User preferences page
 */
export function SettingsScreen() {
  const { t } = useTranslation()
  const { goBack } = useAppNavigation()

  // Confirmation dialog states
  const [showResetTutorialConfirm, setShowResetTutorialConfirm] =
    useState(false)
  const [showResetProgressConfirm, setShowResetProgressConfirm] =
    useState(false)
  const [showTutorialResetSuccess, setShowTutorialResetSuccess] =
    useState(false)
  const [showProgressResetSuccess, setShowProgressResetSuccess] =
    useState(false)

  // Achievement store for resetting progress
  const resetAchievements = useAchievementStore(
    (state) => state.resetAchievements
  )

  // Settings store
  const {
    musicVolume,
    sfxVolume,
    musicEnabled,
    sfxEnabled,
    animationSpeed,
    reducedMotion,
    showTileHints,
    setMusicVolume,
    setSfxVolume,
    toggleMusic,
    toggleSfx,
    setAnimationSpeed,
    setReducedMotion,
    setShowTileHints,
    resetSettings,
  } = useSettingsStore()

  // Reset tutorial handler
  const handleResetTutorial = useCallback(() => {
    // Clear tutorial completion from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tensho_tutorial_completed')
      localStorage.removeItem('tensho_game_tutorial_completed')
      // Also clear progressive hints so they show again
      localStorage.removeItem(PROGRESSIVE_HINTS_STORAGE_KEY)
      localStorage.removeItem(HINTS_DISABLED_STORAGE_KEY)
    }
    setShowResetTutorialConfirm(false)
    setShowTutorialResetSuccess(true)
  }, [])

  // Reset all progress handler
  const handleResetProgress = useCallback(() => {
    // Reset achievements and stats
    resetAchievements()
    // Also reset tutorial and progressive hints
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tensho_tutorial_completed')
      localStorage.removeItem('tensho_game_tutorial_completed')
      localStorage.removeItem(PROGRESSIVE_HINTS_STORAGE_KEY)
      localStorage.removeItem(HINTS_DISABLED_STORAGE_KEY)
    }
    setShowResetProgressConfirm(false)
    setShowProgressResetSuccess(true)
  }, [resetAchievements])

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-forest-green)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-[var(--color-dark-forest)] shadow-lg">
        <div className="screen-canvas flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
          <BackButton onClick={goBack} ariaLabel={t('common.back')} />
          <h1 className="text-xl font-bold text-[var(--color-golden-yellow)]">
            {t('menu.settings')}
          </h1>
          <div className="w-[44px]" />
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="screen-canvas grid items-start gap-3 p-3 sm:gap-4 sm:p-5 lg:grid-cols-2 lg:gap-5 lg:py-6">
          {/* Language Section */}
          <section className="rounded-xl border border-white/5 bg-[var(--color-dark-forest)] p-4 shadow-lg">
            <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-4">
              {t('settings.language')}
            </h2>
            <LanguageSelector />
          </section>

          {/* Audio Section */}
          <section className="rounded-xl border border-white/5 bg-[var(--color-dark-forest)] p-4 shadow-lg space-y-4 lg:row-span-2">
            <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-4">
              {t('settings.audio')}
            </h2>

            <Slider
              label={t('settings.musicVolume')}
              value={Math.round(musicVolume * 100)}
              onChange={(v) => setMusicVolume(v / 100)}
              disabled={!musicEnabled}
            />

            <Toggle
              label={t('settings.muteMusic')}
              checked={!musicEnabled}
              onChange={toggleMusic}
            />

            <div className="border-t border-[var(--color-forest-green)] my-2" />

            <Slider
              label={t('settings.sfxVolume')}
              value={Math.round(sfxVolume * 100)}
              onChange={(v) => setSfxVolume(v / 100)}
              disabled={!sfxEnabled}
            />

            <Toggle
              label={t('settings.muteSfx')}
              checked={!sfxEnabled}
              onChange={toggleSfx}
            />
          </section>

          {/* Visual Section */}
          <section className="rounded-xl border border-white/5 bg-[var(--color-dark-forest)] p-4 shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-4">
              {t('settings.visual')}
            </h2>

            <div className="space-y-2">
              <label className="text-[var(--color-beige-white)]">
                {t('settings.animationSpeed')}
              </label>
              <div className="flex gap-2">
                {(['slow', 'normal', 'fast'] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setAnimationSpeed(speed)}
                    className={`flex-1 py-2 px-3 rounded-lg transition-colors ${
                      animationSpeed === speed
                        ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)]'
                        : 'bg-[var(--color-forest-green)] text-[var(--color-beige-white)] hover:bg-opacity-80'
                    }`}
                  >
                    {t(`settings.speed.${speed}`)}
                  </button>
                ))}
              </div>
            </div>

            <Toggle
              label={t('settings.reducedMotion')}
              description={t('settings.reducedMotionDesc')}
              checked={reducedMotion}
              onChange={setReducedMotion}
            />
          </section>

          {/* Gameplay Section */}
          <section className="rounded-xl border border-white/5 bg-[var(--color-dark-forest)] p-4 shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-4">
              {t('settings.gameplay')}
            </h2>

            <Toggle
              label={t('settings.tileHints')}
              description={t('settings.tileHintsDesc')}
              checked={showTileHints}
              onChange={setShowTileHints}
            />
          </section>

          {/* Data & Progress Section */}
          <section className="rounded-xl border border-white/5 bg-[var(--color-dark-forest)] p-4 shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-4">
              {t('settings.data')}
            </h2>

            {/* Reset Tutorial */}
            <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[var(--color-beige-white)]">
                  {t('settings.resetTutorial')}
                </p>
                <p className="text-sm text-[var(--color-beige-white)] opacity-60">
                  {t('settings.resetTutorialDesc')}
                </p>
              </div>
              <button
                onClick={() => setShowResetTutorialConfirm(true)}
                className="w-full flex-shrink-0 px-4 py-2 bg-[var(--color-forest-green)] hover:bg-[var(--color-vibrant-orange)] sm:w-auto
                         text-[var(--color-beige-white)] font-bold rounded-lg text-sm
                         border-2 border-[var(--color-metallic-gold)]
                         transition-all hover:scale-105 active:scale-95"
              >
                {t('settings.resetTutorial')}
              </button>
            </div>
          </section>

          {/* Danger Zone Section */}
          <section className="rounded-xl bg-red-950/30 p-4 shadow-lg space-y-4 border border-red-500/30">
            <h2 className="text-lg font-bold text-red-400 mb-4">
              {t('settings.dangerZone')}
            </h2>

            {/* Reset All Progress */}
            <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[var(--color-beige-white)]">
                  {t('settings.resetProgress')}
                </p>
                <p className="text-sm text-red-300 opacity-80">
                  {t('settings.resetProgressDesc')}
                </p>
              </div>
              <button
                onClick={() => setShowResetProgressConfirm(true)}
                className="w-full flex-shrink-0 px-4 py-2 bg-red-700 hover:bg-red-600 sm:w-auto
                         text-white font-bold rounded-lg text-sm
                         border-2 border-red-400
                         transition-all hover:scale-105 active:scale-95"
              >
                {t('settings.resetProgress')}
              </button>
            </div>
          </section>

          {/* Reset Settings Section */}
          <section className="rounded-xl border border-white/5 bg-[var(--color-dark-forest)] p-4 shadow-lg lg:col-span-2">
            <Button
              variant="secondary"
              onClick={resetSettings}
              className="w-full"
            >
              {t('settings.resetToDefaults')}
            </Button>
          </section>

          {/* Version info */}
          <p className="text-center text-sm text-[var(--color-beige-white)] opacity-50 lg:col-span-2">
            Tensho v0.1.0
          </p>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmPopup
        isOpen={showResetTutorialConfirm}
        onClose={() => setShowResetTutorialConfirm(false)}
        onConfirm={handleResetTutorial}
        title={t('settings.resetTutorial')}
        message={t('settings.resetTutorialConfirm')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
      />

      <ConfirmPopup
        isOpen={showResetProgressConfirm}
        onClose={() => setShowResetProgressConfirm(false)}
        onConfirm={handleResetProgress}
        title={t('settings.resetProgress')}
        message={t('settings.resetProgressConfirm')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
      />

      <AlertPopup
        isOpen={showTutorialResetSuccess}
        onClose={() => setShowTutorialResetSuccess(false)}
        title={t('settings.resetTutorial')}
        message={t('settings.resetTutorialSuccess')}
        confirmText={t('common.ok')}
      />

      <AlertPopup
        isOpen={showProgressResetSuccess}
        onClose={() => setShowProgressResetSuccess(false)}
        title={t('settings.resetProgress')}
        message={t('settings.resetProgressSuccess')}
        confirmText={t('common.ok')}
      />
    </div>
  )
}
