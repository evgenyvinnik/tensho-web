/**
 * Audio Manager for Tensho Mahjong Roguelike
 *
 * Enhanced audio management with:
 * - Background music playback with crossfade
 * - Sound effects with pooling
 * - Integration with settings store
 * - Tab visibility handling
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useSettingsStore } from '../stores';
import { audioSystem, playSFX, TileSFX, UISFX, FeedbackSFX } from '../systems/AudioSystem';
import {
  SoundEffectId,
  MusicContext,
} from '../config/audioDefinitions';

// =============================================================================
// MUSIC TRACKS
// =============================================================================

const MUSIC_TRACKS = [
  '/assets/Dragon Dance.mp3',
  '/assets/JapaneseWinter.mp3',
  '/assets/Lotus Pond.mp3',
  '/assets/TheDojo.mp3',
];

// Crossfade duration in milliseconds
const CROSSFADE_DURATION = 2000;

/**
 * Shuffle array using Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// =============================================================================
// AUDIO MANAGER STATE
// =============================================================================

interface AudioManagerState {
  isPlaying: boolean;
  currentTrack: string | null;
  volume: number;
}

// =============================================================================
// USE AUDIO MANAGER HOOK
// =============================================================================

/**
 * Hook for managing background music
 */
export function useAudioManager() {
  const [state, setState] = useState<AudioManagerState>({
    isPlaying: false,
    currentTrack: null,
    volume: 1,
  });

  // Two audio elements for crossfading
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioRef = useRef<'A' | 'B'>('A');

  // Track queue for random playback without immediate repeats
  const trackQueueRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);

  // Crossfade animation frame
  const fadeAnimationRef = useRef<number | null>(null);

  // Settings store for volume
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);

  // Initialize audio elements
  useEffect(() => {
    audioARef.current = new Audio();
    audioBRef.current = new Audio();

    // Preload settings
    audioARef.current.preload = 'auto';
    audioBRef.current.preload = 'auto';

    return () => {
      // Cleanup
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
      }
      audioARef.current?.pause();
      audioBRef.current?.pause();
      audioARef.current = null;
      audioBRef.current = null;
    };
  }, []);

  // Update volume when settings change
  useEffect(() => {
    const effectiveVolume = musicEnabled ? musicVolume : 0;
    setState((s) => ({ ...s, volume: effectiveVolume }));

    const activeAudio =
      activeAudioRef.current === 'A' ? audioARef.current : audioBRef.current;
    if (activeAudio) {
      activeAudio.volume = effectiveVolume;
    }
  }, [musicVolume, musicEnabled]);

  /**
   * Get next track from shuffled queue
   */
  const getNextTrack = useCallback(() => {
    // Reshuffle if queue is empty or exhausted
    if (
      trackQueueRef.current.length === 0 ||
      currentIndexRef.current >= trackQueueRef.current.length
    ) {
      trackQueueRef.current = shuffleArray(MUSIC_TRACKS);
      currentIndexRef.current = 0;
    }

    const track = trackQueueRef.current[currentIndexRef.current];
    currentIndexRef.current++;
    return track;
  }, []);

  /**
   * Crossfade to a new track
   */
  const crossfadeToTrack = useCallback(
    (trackUrl: string) => {
      const outgoingAudio =
        activeAudioRef.current === 'A' ? audioARef.current : audioBRef.current;
      const incomingAudio =
        activeAudioRef.current === 'A' ? audioBRef.current : audioARef.current;

      if (!incomingAudio) return;

      // Setup incoming audio
      incomingAudio.src = trackUrl;
      incomingAudio.volume = 0;
      incomingAudio.currentTime = 0;

      // Start playing incoming
      const playPromise = incomingAudio.play();

      if (playPromise) {
        playPromise.catch((error) => {
          console.warn('Audio playback failed:', error);
        });
      }

      // Animate crossfade
      const startTime = performance.now();
      const targetVolume = state.volume;

      const animateFade = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / CROSSFADE_DURATION, 1);

        // Ease in/out curve
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Update volumes
        if (incomingAudio) {
          incomingAudio.volume = eased * targetVolume;
        }
        if (outgoingAudio) {
          outgoingAudio.volume = (1 - eased) * targetVolume;
        }

        if (progress < 1) {
          fadeAnimationRef.current = requestAnimationFrame(animateFade);
        } else {
          // Crossfade complete
          if (outgoingAudio) {
            outgoingAudio.pause();
            outgoingAudio.currentTime = 0;
          }
          // Switch active audio
          activeAudioRef.current = activeAudioRef.current === 'A' ? 'B' : 'A';
        }
      };

      // Cancel any ongoing fade
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
      }

      fadeAnimationRef.current = requestAnimationFrame(animateFade);

      setState((s) => ({ ...s, currentTrack: trackUrl }));
    },
    [state.volume]
  );

  /**
   * Handle track ending - play next track
   */
  const handleTrackEnd = useCallback(() => {
    const nextTrack = getNextTrack();
    crossfadeToTrack(nextTrack);
  }, [getNextTrack, crossfadeToTrack]);

  // Setup track end listeners
  useEffect(() => {
    const audioA = audioARef.current;
    const audioB = audioBRef.current;

    if (audioA) {
      audioA.addEventListener('ended', handleTrackEnd);
    }
    if (audioB) {
      audioB.addEventListener('ended', handleTrackEnd);
    }

    return () => {
      if (audioA) {
        audioA.removeEventListener('ended', handleTrackEnd);
      }
      if (audioB) {
        audioB.removeEventListener('ended', handleTrackEnd);
      }
    };
  }, [handleTrackEnd]);

  /**
   * Start playing music
   */
  const play = useCallback(() => {
    if (state.isPlaying) return;

    const track = getNextTrack();
    const audio = audioARef.current;

    if (audio) {
      audio.src = track;
      audio.volume = state.volume;
      audio.currentTime = 0;

      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => {
            setState((s) => ({
              ...s,
              isPlaying: true,
              currentTrack: track,
            }));
          })
          .catch((error) => {
            console.warn('Audio playback failed:', error);
          });
      }
    }
  }, [state.isPlaying, state.volume, getNextTrack]);

  /**
   * Pause music
   */
  const pause = useCallback(() => {
    const activeAudio =
      activeAudioRef.current === 'A' ? audioARef.current : audioBRef.current;

    if (activeAudio) {
      activeAudio.pause();
    }

    setState((s) => ({ ...s, isPlaying: false }));
  }, []);

  /**
   * Stop music and reset
   */
  const stop = useCallback(() => {
    if (fadeAnimationRef.current) {
      cancelAnimationFrame(fadeAnimationRef.current);
    }

    audioARef.current?.pause();
    audioBRef.current?.pause();

    if (audioARef.current) audioARef.current.currentTime = 0;
    if (audioBRef.current) audioBRef.current.currentTime = 0;

    trackQueueRef.current = [];
    currentIndexRef.current = 0;

    setState({
      isPlaying: false,
      currentTrack: null,
      volume: state.volume,
    });
  }, [state.volume]);

  /**
   * Skip to next track
   */
  const next = useCallback(() => {
    if (!state.isPlaying) return;

    const nextTrack = getNextTrack();
    crossfadeToTrack(nextTrack);
  }, [state.isPlaying, getNextTrack, crossfadeToTrack]);

  /**
   * Set volume (0-1)
   */
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    const activeAudio =
      activeAudioRef.current === 'A' ? audioARef.current : audioBRef.current;

    if (activeAudio) {
      activeAudio.volume = clampedVolume;
    }

    setState((s) => ({ ...s, volume: clampedVolume }));
  }, []);

  return {
    isPlaying: state.isPlaying,
    currentTrack: state.currentTrack,
    volume: state.volume,
    play,
    pause,
    stop,
    next,
    setVolume,
  };
}

// =============================================================================
// SOUND EFFECTS HOOK
// =============================================================================

/**
 * Hook for playing sound effects
 */
export function useSoundEffects() {
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const sfxEnabled = useSettingsStore((s) => s.sfxEnabled);

  // Update audio system when settings change
  useEffect(() => {
    audioSystem.setSfxVolume(sfxVolume);
    audioSystem.setSfxMuted(!sfxEnabled);
  }, [sfxVolume, sfxEnabled]);

  // Play a specific sound effect
  const play = useCallback(
    (soundId: SoundEffectId, options?: { volume?: number; pitch?: number }) => {
      if (!sfxEnabled) return;
      playSFX(soundId, options);
    },
    [sfxEnabled]
  );

  // Shorthand methods
  const tile = useMemo(
    () => ({
      draw: () => sfxEnabled && TileSFX.draw(),
      discard: () => sfxEnabled && TileSFX.discard(),
      select: () => sfxEnabled && TileSFX.select(),
      deselect: () => sfxEnabled && TileSFX.deselect(),
      slide: () => sfxEnabled && TileSFX.slide(),
    }),
    [sfxEnabled]
  );

  const ui = useMemo(
    () => ({
      click: () => sfxEnabled && UISFX.click(),
      hover: () => sfxEnabled && UISFX.hover(),
      menuOpen: () => sfxEnabled && UISFX.menuOpen(),
      menuClose: () => sfxEnabled && UISFX.menuClose(),
    }),
    [sfxEnabled]
  );

  const feedback = useMemo(
    () => ({
      error: () => sfxEnabled && FeedbackSFX.error(),
      invalid: () => sfxEnabled && FeedbackSFX.invalid(),
      success: () => sfxEnabled && FeedbackSFX.success(),
    }),
    [sfxEnabled]
  );

  return {
    play,
    tile,
    ui,
    feedback,
    isEnabled: sfxEnabled,
    volume: sfxVolume,
  };
}

// =============================================================================
// COMBINED AUDIO HOOK
// =============================================================================

/**
 * Combined hook for all audio functionality
 */
export function useGameAudio() {
  const music = useAudioManager();
  const sfx = useSoundEffects();

  // Initialize audio system on mount
  useEffect(() => {
    audioSystem.initialize();

    return () => {
      // Don't destroy on unmount as it's a singleton
      // audioSystem.destroy();
    };
  }, []);

  return {
    music,
    sfx,
    // Convenience method to play music based on game context
    playMusicForContext: useCallback((context: MusicContext) => {
      audioSystem.playMusic(context);
    }, []),
  };
}

// =============================================================================
// AUDIO CONTEXT PROVIDER
// =============================================================================

import { createContext, useContext, ReactNode } from 'react';

interface AudioContextValue {
  isPlaying: boolean;
  currentTrack: string | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  // SFX methods
  playSFX: (soundId: SoundEffectId) => void;
  tileSFX: {
    draw: () => void;
    discard: () => void;
    select: () => void;
    deselect: () => void;
  };
  uiSFX: {
    click: () => void;
    hover: () => void;
  };
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const { music, sfx } = useGameAudio();

  const value: AudioContextValue = {
    isPlaying: music.isPlaying,
    currentTrack: music.currentTrack,
    play: music.play,
    pause: music.pause,
    stop: music.stop,
    next: music.next,
    playSFX: sfx.play,
    tileSFX: sfx.tile,
    uiSFX: sfx.ui,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { playSFX, TileSFX, UISFX, FeedbackSFX };
export type { SoundEffectId, MusicContext };
