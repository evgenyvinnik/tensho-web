import { useEffect } from 'react'
import { audioSystem, UISFX } from '../systems/AudioSystem'
import { useSettingsStore } from '../stores/settingsStore'

/** Mounted once above routing: settings, gestures and playback survive screens. */
export function useAudioLifecycle() {
  useEffect(() => {
    const sync = () => {
      const settings = useSettingsStore.getState()
      audioSystem.setMusicVolume(settings.musicVolume)
      audioSystem.setSfxVolume(settings.sfxVolume)
      audioSystem.setMusicMuted(!settings.musicEnabled)
      audioSystem.setSfxMuted(!settings.sfxEnabled)
    }
    sync()
    audioSystem.initialize()
    const unsubscribe = useSettingsStore.subscribe(sync)
    const gesture = () => audioSystem.unlock()
    const key = (event: KeyboardEvent) => {
      if (!event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey)
        gesture()
    }
    const click = (event: MouseEvent) => {
      const button =
        event.target instanceof Element ? event.target.closest('button') : null
      if (
        button &&
        !button.disabled &&
        button.getAttribute('aria-disabled') !== 'true'
      )
        UISFX.click()
    }
    document.addEventListener('pointerdown', gesture, true)
    document.addEventListener('keydown', key, true)
    document.addEventListener('click', click)
    return () => {
      unsubscribe()
      document.removeEventListener('pointerdown', gesture, true)
      document.removeEventListener('keydown', key, true)
      document.removeEventListener('click', click)
      audioSystem.destroy()
    }
  }, [])
}
