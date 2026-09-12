/** Settings-backed UI adapter to the app-lifetime audio owner. */
import { useSyncExternalStore } from 'react'
import { audioSystem } from '../systems/AudioSystem'
import { useSettingsStore } from '../stores/settingsStore'
import { audioAssets, type AudioTrack } from '../utils/assets'

export function useAudio() {
  useSyncExternalStore(
    audioSystem.subscribe,
    audioSystem.getRevision,
    audioSystem.getRevision
  )
  const enabled = useSettingsStore((state) => state.musicEnabled)
  const volume = useSettingsStore((state) => state.musicVolume)
  const state = audioSystem.getState()
  const currentTrack = (Object.entries(audioAssets).find(
    ([, path]) => path === state.currentTrack
  )?.[0] ?? null) as AudioTrack | null
  const play = async (track?: AudioTrack) => {
    // Starting a run must not override the user's persisted mute preference.
    if (!useSettingsStore.getState().musicEnabled) return
    audioSystem.unlock()
    if (track) audioSystem.playTrack(audioAssets[track])
    else audioSystem.resumeMusic()
  }
  return {
    currentTrack,
    isPlaying: state.isPlaying,
    isMuted: !enabled,
    volume,
    isLoading: false,
    availableTracks: Object.keys(audioAssets) as AudioTrack[],
    play,
    pause: () => audioSystem.pauseMusic(),
    stop: () => audioSystem.stopMusic(false),
    next: () => audioSystem.nextTrack(),
    setVolume: (value: number) =>
      useSettingsStore.getState().setMusicVolume(value),
    toggleMute: () => useSettingsStore.getState().toggleMusic(),
    toggle: () => useSettingsStore.getState().toggleMusic(),
  }
}
export default useAudio
