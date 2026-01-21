/**
 * useAudio Hook for Tensho Mahjong Roguelike
 *
 * Provides audio playback functionality with:
 * - Random track selection (shuffled queue, no immediate repeats)
 * - Seamless looping across tracks
 * - Crossfade transitions between tracks
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { audioAssets, AudioTrack, MUSIC_TRACKS } from '../utils/assets'

// Crossfade duration in milliseconds
const CROSSFADE_DURATION = 2500

export interface UseAudioOptions {
  /** Initial volume (0-1) */
  initialVolume?: number
  /** Whether to loop through all tracks randomly */
  loop?: boolean
  /** Whether to auto-play on mount (usually blocked by browsers) */
  autoPlay?: boolean
  /** Initial track to play */
  initialTrack?: AudioTrack
}

export interface UseAudioReturn {
  /** Currently playing track */
  currentTrack: AudioTrack | null
  /** Whether audio is currently playing */
  isPlaying: boolean
  /** Current volume (0-1) */
  volume: number
  /** Whether audio is muted */
  isMuted: boolean
  /** Whether audio is loading */
  isLoading: boolean
  /** Play (optionally a specific track, or random if none specified) */
  play: (track?: AudioTrack) => Promise<void>
  /** Pause the current audio */
  pause: () => void
  /** Stop the current audio and reset */
  stop: () => void
  /** Toggle play/pause */
  toggle: () => void
  /** Set the volume (0-1) */
  setVolume: (volume: number) => void
  /** Toggle mute */
  toggleMute: () => void
  /** Skip to next track with crossfade */
  next: () => void
  /** Get all available tracks */
  availableTracks: AudioTrack[]
}

/**
 * Shuffle array using Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get track name from URL
 */
function getTrackNameFromUrl(url: string): AudioTrack | null {
  for (const [name, path] of Object.entries(audioAssets)) {
    if (path === url) {
      return name as AudioTrack
    }
  }
  return null
}

/**
 * Hook for managing background music with crossfade
 */
export function useAudio(options: UseAudioOptions = {}): UseAudioReturn {
  const { initialVolume = 0.5, loop = true, autoPlay: _autoPlay = false } = options

  // State
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(initialVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Two audio elements for crossfading
  const audioARef = useRef<HTMLAudioElement | null>(null)
  const audioBRef = useRef<HTMLAudioElement | null>(null)
  const activeAudioRef = useRef<'A' | 'B'>('A')

  // Track queue for random playback
  const trackQueueRef = useRef<string[]>([])
  const currentIndexRef = useRef(0)

  // Crossfade animation
  const fadeAnimationRef = useRef<number | null>(null)

  // Initialize audio elements
  useEffect(() => {
    audioARef.current = new Audio()
    audioBRef.current = new Audio()

    audioARef.current.preload = 'auto'
    audioBRef.current.preload = 'auto'

    return () => {
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current)
      }
      audioARef.current?.pause()
      audioBRef.current?.pause()
      audioARef.current = null
      audioBRef.current = null
    }
  }, [])

  /**
   * Get next track from shuffled queue
   */
  const getNextTrack = useCallback((): string => {
    if (
      trackQueueRef.current.length === 0 ||
      currentIndexRef.current >= trackQueueRef.current.length
    ) {
      trackQueueRef.current = shuffleArray(MUSIC_TRACKS)
      currentIndexRef.current = 0
    }

    const track = trackQueueRef.current[currentIndexRef.current]
    currentIndexRef.current++
    return track
  }, [])

  /**
   * Get effective volume (accounting for mute)
   */
  const getEffectiveVolume = useCallback(() => {
    return isMuted ? 0 : volume
  }, [isMuted, volume])

  /**
   * Crossfade to a new track
   */
  const crossfadeToTrack = useCallback(
    (trackUrl: string) => {
      const outgoingAudio =
        activeAudioRef.current === 'A' ? audioARef.current : audioBRef.current
      const incomingAudio =
        activeAudioRef.current === 'A' ? audioBRef.current : audioARef.current

      if (!incomingAudio) return

      // Setup incoming audio
      incomingAudio.src = trackUrl
      incomingAudio.volume = 0
      incomingAudio.currentTime = 0

      setIsLoading(true)

      // Start playing incoming
      const playPromise = incomingAudio.play()

      if (playPromise) {
        playPromise
          .then(() => {
            setIsLoading(false)

            // Animate crossfade
            const startTime = performance.now()
            const targetVolume = getEffectiveVolume()

            const animateFade = (currentTime: number) => {
              const elapsed = currentTime - startTime
              const progress = Math.min(elapsed / CROSSFADE_DURATION, 1)

              // Ease in/out curve
              const eased =
                progress < 0.5
                  ? 2 * progress * progress
                  : 1 - Math.pow(-2 * progress + 2, 2) / 2

              // Update volumes
              if (incomingAudio) {
                incomingAudio.volume = eased * targetVolume
              }
              if (outgoingAudio) {
                outgoingAudio.volume = (1 - eased) * targetVolume
              }

              if (progress < 1) {
                fadeAnimationRef.current = requestAnimationFrame(animateFade)
              } else {
                // Crossfade complete
                if (outgoingAudio) {
                  outgoingAudio.pause()
                  outgoingAudio.currentTime = 0
                }
                // Switch active audio
                activeAudioRef.current =
                  activeAudioRef.current === 'A' ? 'B' : 'A'
              }
            }

            // Cancel any ongoing fade
            if (fadeAnimationRef.current) {
              cancelAnimationFrame(fadeAnimationRef.current)
            }

            fadeAnimationRef.current = requestAnimationFrame(animateFade)
          })
          .catch((error) => {
            console.warn('Audio playback failed:', error)
            setIsLoading(false)
          })
      }

      // Update current track
      const trackName = getTrackNameFromUrl(trackUrl)
      setCurrentTrack(trackName)
    },
    [getEffectiveVolume]
  )

  /**
   * Handle track ending - play next track with crossfade
   */
  const handleTrackEnd = useCallback(() => {
    if (loop) {
      const nextTrack = getNextTrack()
      crossfadeToTrack(nextTrack)
    } else {
      setIsPlaying(false)
    }
  }, [loop, getNextTrack, crossfadeToTrack])

  // Setup track end listeners
  useEffect(() => {
    const audioA = audioARef.current
    const audioB = audioBRef.current

    if (audioA) {
      audioA.addEventListener('ended', handleTrackEnd)
    }
    if (audioB) {
      audioB.addEventListener('ended', handleTrackEnd)
    }

    return () => {
      if (audioA) {
        audioA.removeEventListener('ended', handleTrackEnd)
      }
      if (audioB) {
        audioB.removeEventListener('ended', handleTrackEnd)
      }
    }
  }, [handleTrackEnd])

  /**
   * Play (optionally a specific track)
   */
  const play = useCallback(
    async (track?: AudioTrack): Promise<void> => {
      if (isPlaying && !track) return

      let trackUrl: string

      if (track) {
        trackUrl = audioAssets[track]
      } else {
        trackUrl = getNextTrack()
      }

      const audio = audioARef.current

      if (audio && !isPlaying) {
        // First play - no crossfade needed
        audio.src = trackUrl
        audio.volume = getEffectiveVolume()
        audio.currentTime = 0

        setIsLoading(true)

        try {
          await audio.play()
          setIsPlaying(true)
          setCurrentTrack(getTrackNameFromUrl(trackUrl))
        } catch (error) {
          console.warn('Audio playback failed:', error)
        }

        setIsLoading(false)
      } else if (track && isPlaying) {
        // Switch track with crossfade
        crossfadeToTrack(trackUrl)
      }
    },
    [isPlaying, getNextTrack, getEffectiveVolume, crossfadeToTrack]
  )

  /**
   * Pause the current audio
   */
  const pause = useCallback((): void => {
    const activeAudio =
      activeAudioRef.current === 'A' ? audioARef.current : audioBRef.current

    if (activeAudio) {
      activeAudio.pause()
    }

    setIsPlaying(false)
  }, [])

  /**
   * Stop and reset
   */
  const stop = useCallback((): void => {
    if (fadeAnimationRef.current) {
      cancelAnimationFrame(fadeAnimationRef.current)
    }

    audioARef.current?.pause()
    audioBRef.current?.pause()

    if (audioARef.current) audioARef.current.currentTime = 0
    if (audioBRef.current) audioBRef.current.currentTime = 0

    trackQueueRef.current = []
    currentIndexRef.current = 0

    setIsPlaying(false)
    setCurrentTrack(null)
  }, [])

  /**
   * Toggle play/pause
   */
  const toggle = useCallback((): void => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, pause, play])

  /**
   * Set volume
   */
  const setVolume = useCallback((newVolume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolumeState(clampedVolume)

    const activeAudio =
      activeAudioRef.current === 'A' ? audioARef.current : audioBRef.current

    if (activeAudio) {
      activeAudio.volume = clampedVolume
    }
  }, [])

  /**
   * Toggle mute
   */
  const toggleMute = useCallback((): void => {
    setIsMuted((prev) => {
      const newMuted = !prev
      const activeAudio =
        activeAudioRef.current === 'A' ? audioARef.current : audioBRef.current

      if (activeAudio) {
        activeAudio.volume = newMuted ? 0 : volume
      }

      return newMuted
    })
  }, [volume])

  /**
   * Skip to next track
   */
  const next = useCallback((): void => {
    if (!isPlaying) return

    const nextTrack = getNextTrack()
    crossfadeToTrack(nextTrack)
  }, [isPlaying, getNextTrack, crossfadeToTrack])

  // Update volume when it changes
  useEffect(() => {
    const activeAudio =
      activeAudioRef.current === 'A' ? audioARef.current : audioBRef.current

    if (activeAudio && isPlaying) {
      activeAudio.volume = getEffectiveVolume()
    }
  }, [volume, isMuted, isPlaying, getEffectiveVolume])

  const availableTracks = Object.keys(audioAssets) as AudioTrack[]

  return {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    isLoading,
    play,
    pause,
    stop,
    toggle,
    setVolume,
    toggleMute,
    next,
    availableTracks,
  }
}

export default useAudio
