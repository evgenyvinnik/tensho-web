/**
 * SettingsScreen Component
 *
 * Settings page for audio, visual, and gameplay preferences.
 * Uses the settingsStore for persistence.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FORMATTED_APP_VERSION } from '../../utils/version'
import { useAppNavigation } from '../../router'
import { useSettingsStore } from '../../stores/settingsStore'
import {
  resetAllProgress,
  resetTutorialProgress,
  activateFullUnlock,
} from '../../game/resetProgress'
import { useProgressionStore } from '../../stores/progressionStore'
import { Button } from '../ui/Button'
import { PavilionScreen } from '../ui/PavilionScreen'
import { ControlIcon } from '../ui/ControlIcon'
import { PavilionIcon } from '../ui/PavilionIcon'
import { Slider } from '../ui/Slider'
import { Toggle } from '../ui/Toggle'
import { useClassicPersistence } from '../../game/useClassicPersistence'
import { SOUND_EFFECT_CREDITS } from '../../config/creditsDefinitions'

const creditLink =
  'underline decoration-[var(--color-metallic-gold)] underline-offset-2 hover:text-[var(--color-golden-yellow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-golden-yellow)]'

function downloadBackup(raw: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'tensho-run-backup.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
import { LanguageSelector } from '../ui/LanguageSelector'
import { ConfirmPopup, AlertPopup } from '../ui/Popup'

/**
 * SettingsScreen - User preferences page
 */
export function SettingsScreen() {
  const { t } = useTranslation()
  const { goBack } = useAppNavigation()
  const { disk } = useClassicPersistence()
  const fullUnlockEnabled = useProgressionStore(
    (state) => state.fullUnlockEnabled
  )
  const [showFullUnlockConfirm, setShowFullUnlockConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [fullUnlockError, setFullUnlockError] = useState(false)

  // Confirmation dialog states
  const [showResetTutorialConfirm, setShowResetTutorialConfirm] =
    useState(false)
  const [showResetProgressConfirm, setShowResetProgressConfirm] =
    useState(false)
  const [showTutorialResetSuccess, setShowTutorialResetSuccess] =
    useState(false)
  const [showProgressResetSuccess, setShowProgressResetSuccess] =
    useState(false)

  const [resetError, setResetError] = useState<
    'resetFailed' | 'resetPartial' | null
  >(null)

  // Settings store
  const {
    musicVolume,
    sfxVolume,
    musicEnabled,
    sfxEnabled,
    animationSpeed,
    reducedMotion,
    showTileHints,
    showRankNumbers,
    setMusicVolume,
    setSfxVolume,
    toggleMusic,
    toggleSfx,
    setAnimationSpeed,
    setReducedMotion,
    setShowTileHints,
    setShowRankNumbers,
    resetSettings,
  } = useSettingsStore()

  // Reset tutorial handler
  const handleResetTutorial = useCallback(() => {
    const result = resetTutorialProgress()
    setShowResetTutorialConfirm(false)
    if (result.success) setShowTutorialResetSuccess(true)
    else setResetError(result.restored ? 'resetFailed' : 'resetPartial')
  }, [])

  // Reset all progress handler
  const handleResetProgress = useCallback(async () => {
    if (resetting) return
    setResetting(true)
    const result = await resetAllProgress()
    setResetting(false)
    setShowResetProgressConfirm(false)
    if (result.success) setShowProgressResetSuccess(true)
    else setResetError(result.restored ? 'resetFailed' : 'resetPartial')
  }, [resetting])

  return (
    <PavilionScreen page="settings" title={t('menu.settings')} onBack={goBack}>
      <div className="pavilion-settings">
        {/* Language Section */}
        <section className="pavilion-panel">
          <h2 className="pavilion-section-heading">
            <ControlIcon name="language" size={36} /> {t('settings.language')}
          </h2>
          <LanguageSelector className="w-full" />
        </section>

        {/* Audio Section */}
        <section className="pavilion-panel space-y-4 lg:row-span-2">
          <h2 className="pavilion-section-heading">
            <ControlIcon name="sound" size={36} /> {t('settings.audio')}
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
        <section className="pavilion-panel space-y-4">
          <h2 className="pavilion-section-heading">
            <ControlIcon name="settings" size={36} /> {t('settings.visual')}
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
                  aria-pressed={animationSpeed === speed}
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
        <section className="pavilion-panel space-y-4">
          <h2 className="pavilion-section-heading">
            <PavilionIcon name="tiles" size={36} /> {t('settings.gameplay')}
          </h2>

          <Toggle
            label={t('settings.tileHints')}
            description={t('settings.tileHintsDesc')}
            checked={showTileHints}
            onChange={setShowTileHints}
          />
          <Toggle
            label={t('settings.rankNumbers')}
            description={t('settings.rankNumbersDesc')}
            checked={showRankNumbers}
            onChange={setShowRankNumbers}
          />
        </section>

        {/* Data & Progress Section */}
        <section className="pavilion-panel space-y-4">
          <h2 className="pavilion-section-heading">
            <ControlIcon name="archive" size={36} /> {t('settings.data')}
          </h2>

          <div className="space-y-3 rounded-lg border border-[var(--color-metallic-gold)] p-3">
            <h3 className="font-semibold text-[var(--color-golden-yellow)]">
              {t('settings.fullUnlock.title')}
            </h3>
            <p
              className="text-sm leading-relaxed text-[var(--color-beige-white)]"
              role={fullUnlockEnabled ? 'status' : undefined}
            >
              {t(
                fullUnlockEnabled
                  ? 'settings.fullUnlock.active'
                  : 'settings.fullUnlock.description'
              )}
            </p>
            {!fullUnlockEnabled && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowFullUnlockConfirm(true)}
              >
                {t('settings.fullUnlock.title')}
              </Button>
            )}
          </div>

          {/* An unreadable saved run can be kept as a file before a New Run
                replaces it. Routine saves never need this. */}
          {disk.kind === 'invalid' && (
            <div className="space-y-2 rounded-lg border border-amber-300/50 p-3">
              <p className="text-sm leading-relaxed text-[var(--color-beige-white)]">
                {t('settings.unreadableSave')}
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => downloadBackup(disk.raw)}
              >
                {t('classicSave.backup')}
              </Button>
            </div>
          )}

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
        <section className="pavilion-panel pavilion-danger space-y-4">
          <h2 className="pavilion-section-heading">
            <ControlIcon name="warning" size={36} /> {t('settings.dangerZone')}
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
              aria-disabled={resetting}
              onClick={() => {
                if (!resetting) setShowResetProgressConfirm(true)
              }}
              className="w-full flex-shrink-0 px-4 py-2 bg-red-700 hover:bg-red-600 sm:w-auto
                         text-white font-bold rounded-lg text-sm
                         border-2 border-red-400
                         transition-all hover:scale-105 active:scale-95"
            >
              {resetting ? t('common.loading') : t('settings.resetProgress')}
            </button>
          </div>
        </section>

        {/* Reset Settings Section */}
        <section className="pavilion-panel lg:col-span-2">
          <Button
            variant="secondary"
            onClick={resetSettings}
            className="w-full"
          >
            {t('settings.resetToDefaults')}
          </Button>
        </section>

        {/* Credits: attribution for third-party audio */}
        <section
          className="pavilion-panel space-y-4 lg:col-span-2"
          aria-labelledby="settings-credits-heading"
        >
          <h2
            id="settings-credits-heading"
            className="pavilion-section-heading"
          >
            <ControlIcon name="music" size={36} /> {t('settings.credits.title')}
          </h2>
          <h3 className="text-base font-semibold text-[var(--color-golden-yellow)]">
            {t('settings.credits.soundEffects')}
          </h3>
          <ul className="space-y-3">
            {SOUND_EFFECT_CREDITS.map((credit) => (
              <li
                key={credit.id}
                className="text-sm leading-relaxed text-[var(--color-beige-white)]"
              >
                <p className="opacity-70">
                  {t(`settings.credits.${credit.role}`)}
                </p>
                <p>
                  <a
                    href={credit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-semibold ${creditLink}`}
                  >
                    {credit.title}
                  </a>
                  {' · '}
                  {credit.author}
                  {' · '}
                  <a
                    href={credit.license.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={creditLink}
                  >
                    {credit.license.name}
                  </a>
                </p>
                {credit.modified && (
                  <p className="opacity-70">{t('settings.credits.modified')}</p>
                )}
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-[var(--color-beige-white)] opacity-70">
            {t('settings.credits.original')}
          </p>
        </section>

        {/* Version info */}
        <p className="text-center text-sm text-[var(--color-beige-white)] opacity-50 lg:col-span-2">
          Tensho {FORMATTED_APP_VERSION}
        </p>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmPopup
        isOpen={showFullUnlockConfirm}
        onClose={() => setShowFullUnlockConfirm(false)}
        onConfirm={() => {
          const result = activateFullUnlock()
          setShowFullUnlockConfirm(false)
          setFullUnlockError(!result.success)
        }}
        title={t('settings.fullUnlock.title')}
        message={t('settings.fullUnlock.confirm')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
      />
      <AlertPopup
        isOpen={fullUnlockError}
        onClose={() => setFullUnlockError(false)}
        title={t('common.error')}
        message={t('settings.fullUnlock.error')}
        confirmText={t('common.ok')}
      />
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
        message={`${t('settings.resetProgressConfirm')} ${t('settings.resetProgressScope')}`}
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

      <AlertPopup
        isOpen={resetError !== null}
        onClose={() => setResetError(null)}
        title={t('common.error')}
        message={resetError ? t(`settings.${resetError}`) : ''}
        confirmText={t('common.ok')}
      />
    </PavilionScreen>
  )
}
