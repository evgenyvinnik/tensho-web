/**
 * SettingsScreen Component
 *
 * Settings page for audio, visual, and gameplay preferences.
 * Uses the settingsStore for persistence.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation } from '../../router'
import { useSettingsStore, selectEffectiveMusicVolume, selectEffectiveSfxVolume } from '../../stores/settingsStore'
import { useAchievementStore } from '../../stores/achievementStore'
import { Button } from '../ui/Button'
import { LanguageSelector } from '../ui/LanguageSelector'
import { ConfirmPopup, AlertPopup } from '../ui/Popup'

/**
 * Slider component for volume controls
 */
interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label: string
  disabled?: boolean
}

function Slider({ value, onChange, min = 0, max = 100, step = 1, label, disabled }: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-[var(--color-beige-white)]">{label}</label>
        <span className="text-[var(--color-golden-yellow)] font-mono">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-[var(--color-dark-forest)] rounded-lg appearance-none cursor-pointer accent-[var(--color-vibrant-orange)] disabled:opacity-50"
      />
    </div>
  )
}

/**
 * Toggle switch component
 */
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-[var(--color-beige-white)]">{label}</p>
        {description && (
          <p className="text-sm text-[var(--color-beige-white)] opacity-60">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-[var(--color-vibrant-orange)]' : 'bg-[var(--color-dark-forest)]'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-[var(--color-beige-white)] rounded-full transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

/**
 * SettingsScreen - User preferences page
 */
export function SettingsScreen() {
  const { t } = useTranslation()
  const { goBack } = useAppNavigation()

  // Confirmation dialog states
  const [showResetTutorialConfirm, setShowResetTutorialConfirm] = useState(false)
  const [showResetProgressConfirm, setShowResetProgressConfirm] = useState(false)
  const [showTutorialResetSuccess, setShowTutorialResetSuccess] = useState(false)
  const [showProgressResetSuccess, setShowProgressResetSuccess] = useState(false)

  // Achievement store for resetting progress
  const resetAchievements = useAchievementStore((state) => state.resetAchievements)

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const effectiveMusicVolume = useSettingsStore(selectEffectiveMusicVolume)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const effectiveSfxVolume = useSettingsStore(selectEffectiveSfxVolume)

  // Reset tutorial handler
  const handleResetTutorial = useCallback(() => {
    // Clear tutorial completion from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tensho_tutorial_completed')
    }
    setShowResetTutorialConfirm(false)
    setShowTutorialResetSuccess(true)
  }, [])

  // Reset all progress handler
  const handleResetProgress = useCallback(() => {
    // Reset achievements and stats
    resetAchievements()
    // Also reset tutorial
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tensho_tutorial_completed')
    }
    setShowResetProgressConfirm(false)
    setShowProgressResetSuccess(true)
  }, [resetAchievements])

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-forest-green)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[var(--color-dark-forest)]">
        <button
          onClick={goBack}
          className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-beige-white)]"
          aria-label={t('common.back')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-[var(--color-golden-yellow)]">
          {t('menu.settings')}
        </h1>
        <div className="w-[44px]" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Language Section */}
        <section className="bg-[var(--color-dark-forest)] rounded-lg p-4">
          <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-4">
            {t('settings.language')}
          </h2>
          <LanguageSelector />
        </section>

        {/* Audio Section */}
        <section className="bg-[var(--color-dark-forest)] rounded-lg p-4 space-y-4">
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
        <section className="bg-[var(--color-dark-forest)] rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-4">
            {t('settings.visual')}
          </h2>

          <div className="space-y-2">
            <label className="text-[var(--color-beige-white)]">{t('settings.animationSpeed')}</label>
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
        <section className="bg-[var(--color-dark-forest)] rounded-lg p-4 space-y-4">
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
        <section className="bg-[var(--color-dark-forest)] rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-4">
            {t('settings.data')}
          </h2>

          {/* Reset Tutorial */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[var(--color-beige-white)]">{t('settings.resetTutorial')}</p>
              <p className="text-sm text-[var(--color-beige-white)] opacity-60">
                {t('settings.resetTutorialDesc')}
              </p>
            </div>
            <button
              onClick={() => setShowResetTutorialConfirm(true)}
              className="px-4 py-2 bg-[var(--color-forest-green)] hover:bg-[var(--color-vibrant-orange)]
                         text-[var(--color-beige-white)] font-bold rounded-lg text-sm
                         border-2 border-[var(--color-metallic-gold)]
                         transition-all hover:scale-105 active:scale-95"
            >
              {t('settings.resetTutorial')}
            </button>
          </div>
        </section>

        {/* Danger Zone Section */}
        <section className="bg-red-950/30 rounded-lg p-4 space-y-4 border border-red-500/30">
          <h2 className="text-lg font-bold text-red-400 mb-4">
            {t('settings.dangerZone')}
          </h2>

          {/* Reset All Progress */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[var(--color-beige-white)]">{t('settings.resetProgress')}</p>
              <p className="text-sm text-red-300 opacity-80">
                {t('settings.resetProgressDesc')}
              </p>
            </div>
            <button
              onClick={() => setShowResetProgressConfirm(true)}
              className="px-4 py-2 bg-red-700 hover:bg-red-600
                         text-white font-bold rounded-lg text-sm
                         border-2 border-red-400
                         transition-all hover:scale-105 active:scale-95"
            >
              {t('settings.resetProgress')}
            </button>
          </div>
        </section>

        {/* Reset Settings Section */}
        <section className="bg-[var(--color-dark-forest)] rounded-lg p-4">
          <Button
            variant="secondary"
            onClick={resetSettings}
            className="w-full"
          >
            {t('settings.resetToDefaults')}
          </Button>
        </section>

        {/* Version info */}
        <p className="text-center text-sm text-[var(--color-beige-white)] opacity-50">
          Tensho v0.1.0
        </p>
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
