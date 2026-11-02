import { useEffect } from 'react'
import { audioSystem } from '../systems/AudioSystem'
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
    document.addEventListener('pointerdown', gesture, true)
    document.addEventListener('keydown', key, true)
    return () => {
      unsubscribe()
      document.removeEventListener('pointerdown', gesture, true)
      document.removeEventListener('keydown', key, true)
      audioSystem.destroy()
    }
  }, [])
}
