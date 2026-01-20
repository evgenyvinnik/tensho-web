/**
 * useAudio Hook for Tensho Mahjong Roguelike
 * Provides audio playback functionality for background music
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { audioAssets, AudioTrack } from '../utils/assets';

export interface UseAudioOptions {
  /** Initial volume (0-1) */
  initialVolume?: number;
  /** Whether to loop the audio */
  loop?: boolean;
  /** Whether to auto-play on mount */
  autoPlay?: boolean;
  /** Initial track to play */
  initialTrack?: AudioTrack;
}

export interface UseAudioReturn {
  /** Currently playing track */
  currentTrack: AudioTrack | null;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current volume (0-1) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Whether audio is loading */
  isLoading: boolean;
  /** Play a specific track */
  play: (track?: AudioTrack) => Promise<void>;
  /** Pause the current audio */
  pause: () => void;
  /** Stop the current audio and reset position */
  stop: () => void;
  /** Toggle play/pause */
  toggle: () => void;
  /** Set the volume (0-1) */
  setVolume: (volume: number) => void;
  /** Toggle mute */
  toggleMute: () => void;
  /** Switch to a different track */
  switchTrack: (track: AudioTrack) => Promise<void>;
  /** Get all available tracks */
  availableTracks: AudioTrack[];
}

/**
 * Hook for managing background music playback
 */
export function useAudio(options: UseAudioOptions = {}): UseAudioReturn {
  const {
    initialVolume = 0.5,
    loop = true,
    autoPlay = false,
    initialTrack,
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(initialTrack ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = loop;
      audioRef.current.volume = initialVolume;
    }

    const audio = audioRef.current;

    // Event handlers
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      if (!loop) {
        setIsPlaying(false);
      }
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error('Audio playback error');
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [loop, initialVolume]);

  // Auto-play initial track
  useEffect(() => {
    if (autoPlay && initialTrack && audioRef.current) {
      const audio = audioRef.current;
      audio.src = audioAssets[initialTrack];
      audio.play().catch((err) => {
        // Auto-play might be blocked by browser
        console.warn('Auto-play blocked:', err);
      });
    }
  }, [autoPlay, initialTrack]);

  /**
   * Play a track (or resume current)
   */
  const play = useCallback(async (track?: AudioTrack): Promise<void> => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const trackToPlay = track ?? currentTrack;

    if (!trackToPlay) {
      console.warn('No track specified to play');
      return;
    }

    // If different track, load it
    if (track && track !== currentTrack) {
      audio.src = audioAssets[track];
      setCurrentTrack(track);
    }

    try {
      await audio.play();
    } catch (err) {
      console.warn('Play failed:', err);
    }
  }, [currentTrack]);

  /**
   * Pause the current audio
   */
  const pause = useCallback((): void => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  /**
   * Stop the current audio and reset position
   */
  const stop = useCallback((): void => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  /**
   * Toggle play/pause
   */
  const toggle = useCallback((): void => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  /**
   * Set the volume (0-1)
   */
  const setVolume = useCallback((newVolume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clampedVolume;
    }
  }, [isMuted]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback((): void => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.volume = newMuted ? 0 : volume;
      }
      return newMuted;
    });
  }, [volume]);

  /**
   * Switch to a different track
   */
  const switchTrack = useCallback(async (track: AudioTrack): Promise<void> => {
    if (!audioRef.current) return;

    const wasPlaying = isPlaying;
    const audio = audioRef.current;

    // Stop current
    audio.pause();
    audio.currentTime = 0;

    // Load new track
    audio.src = audioAssets[track];
    setCurrentTrack(track);

    // Resume if was playing
    if (wasPlaying) {
      try {
        await audio.play();
      } catch (err) {
        console.warn('Switch track play failed:', err);
      }
    }
  }, [isPlaying]);

  const availableTracks = Object.keys(audioAssets) as AudioTrack[];

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
    switchTrack,
    availableTracks,
  };
}

export default useAudio;
