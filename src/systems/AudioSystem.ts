/**
 * Audio System for Tensho Mahjong Roguelike
 *
 * Central audio management system that handles:
 * - Sound effect playback with pooling
 * - Background music with crossfade
 * - Volume controls and muting
 * - Tab visibility handling
 * - Integration with EventBus for game events
 */

import {
  SoundEffectId,
  SoundEffectConfig,
  SOUND_EFFECT_CONFIG,
  MusicContext,
  getMusicForContext,
  getPreloadSounds,
  TILE_SOUNDS,
  UI_SOUNDS,
  GAME_SOUNDS,
  SPECIAL_SOUNDS,
  FEEDBACK_SOUNDS,
  SHOP_SOUNDS,
} from '../config/audioDefinitions';
import { eventBus } from '../game/EventBus';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Pooled audio instance
 */
interface PooledAudio {
  element: HTMLAudioElement;
  inUse: boolean;
  id: string;
}

/**
 * Audio pool for a specific sound effect
 */
interface AudioPool {
  instances: PooledAudio[];
  config: SoundEffectConfig;
}

/**
 * Audio system state
 */
interface AudioSystemState {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
  isTabVisible: boolean;
  currentMusicContext: MusicContext | null;
  isInitialized: boolean;
}

/**
 * Music playback state
 */
interface MusicState {
  currentTrack: string | null;
  isPlaying: boolean;
  isCrossfading: boolean;
}

// =============================================================================
// AUDIO SYSTEM CLASS
// =============================================================================

/**
 * Centralized audio management system
 */
export class AudioSystem {
  // State
  private state: AudioSystemState = {
    masterVolume: 1,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    musicMuted: false,
    sfxMuted: false,
    isTabVisible: true,
    currentMusicContext: null,
    isInitialized: false,
  };

  // Music state
  private musicState: MusicState = {
    currentTrack: null,
    isPlaying: false,
    isCrossfading: false,
  };

  // Audio pools for sound effects
  private soundPools: Map<SoundEffectId, AudioPool> = new Map();

  // Music elements (two for crossfading)
  private musicA: HTMLAudioElement | null = null;
  private musicB: HTMLAudioElement | null = null;
  private activeMusicElement: 'A' | 'B' = 'A';

  // Music queue for playlist
  private musicQueue: string[] = [];
  private musicQueueIndex: number = 0;

  // Animation frame for crossfade
  private crossfadeAnimationFrame: number | null = null;

  // Crossfade duration in ms
  private readonly CROSSFADE_DURATION = 2000;

  // Volume fade for tab visibility
  private tabVisibilityFadeFrame: number | null = null;

  // Event unsubscribers
  private eventUnsubscribers: Array<() => void> = [];

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  /**
   * Initialize the audio system
   */
  initialize(): void {
    if (this.state.isInitialized) return;

    // Create music elements
    this.musicA = new Audio();
    this.musicB = new Audio();
    this.musicA.preload = 'auto';
    this.musicB.preload = 'auto';

    // Setup music end handlers
    this.musicA.addEventListener('ended', this.handleMusicEnded);
    this.musicB.addEventListener('ended', this.handleMusicEnded);

    // Setup tab visibility listener
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Preload common sounds
    this.preloadSounds();

    // Subscribe to game events
    this.subscribeToEvents();

    this.state.isInitialized = true;
  }

  /**
   * Cleanup the audio system
   */
  destroy(): void {
    // Cancel any pending animations
    if (this.crossfadeAnimationFrame) {
      cancelAnimationFrame(this.crossfadeAnimationFrame);
    }
    if (this.tabVisibilityFadeFrame) {
      cancelAnimationFrame(this.tabVisibilityFadeFrame);
    }

    // Cleanup music elements
    if (this.musicA) {
      this.musicA.pause();
      this.musicA.removeEventListener('ended', this.handleMusicEnded);
      this.musicA = null;
    }
    if (this.musicB) {
      this.musicB.pause();
      this.musicB.removeEventListener('ended', this.handleMusicEnded);
      this.musicB = null;
    }

    // Cleanup sound pools
    this.soundPools.forEach((pool) => {
      pool.instances.forEach((instance) => {
        instance.element.pause();
        instance.element.src = '';
      });
    });
    this.soundPools.clear();

    // Remove visibility listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    // Unsubscribe from events
    this.eventUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.eventUnsubscribers = [];

    this.state.isInitialized = false;
  }

  // =============================================================================
  // SOUND EFFECT PLAYBACK
  // =============================================================================

  /**
   * Play a sound effect
   */
  play(soundId: SoundEffectId, options?: { volume?: number; pitch?: number }): void {
    if (!this.state.isInitialized) return;
    if (this.state.sfxMuted) return;

    const config = SOUND_EFFECT_CONFIG[soundId];
    if (!config) {
      console.warn(`Sound effect not found: ${soundId}`);
      return;
    }

    // Get or create pool
    let pool = this.soundPools.get(soundId);
    if (!pool) {
      pool = this.createPool(soundId, config);
    }

    // Find available instance
    let instance = pool.instances.find((inst) => !inst.inUse);

    // If no available instance and at max, either skip or replace lowest priority
    if (!instance) {
      if (pool.instances.length >= config.maxInstances) {
        if (!config.allowOverlap) return;
        // Reuse oldest instance
        instance = pool.instances[0];
        instance.element.pause();
        instance.element.currentTime = 0;
      } else {
        // Create new instance
        instance = this.createPoolInstance(soundId, config);
        pool.instances.push(instance);
      }
    }

    // Calculate final volume
    const baseVolume = options?.volume ?? config.volume;
    const finalVolume = baseVolume * this.state.sfxVolume * this.state.masterVolume;

    // Apply pitch variation if configured
    if (config.pitchVariation || options?.pitch) {
      const [min, max] = config.pitchVariation ?? [1, 1];
      const pitch = options?.pitch ?? min + Math.random() * (max - min);
      instance.element.playbackRate = pitch;
    }

    // Play the sound
    instance.element.volume = finalVolume;
    instance.inUse = true;

    const playPromise = instance.element.play();
    if (playPromise) {
      playPromise.catch((error) => {
        // Autoplay was blocked, silently ignore
        if (error.name !== 'NotAllowedError') {
          console.warn(`Failed to play sound ${soundId}:`, error);
        }
      });
    }
  }

  /**
   * Create an audio pool for a sound effect
   */
  private createPool(soundId: SoundEffectId, config: SoundEffectConfig): AudioPool {
    const pool: AudioPool = {
      instances: [],
      config,
    };

    // Pre-create one instance
    const instance = this.createPoolInstance(soundId, config);
    pool.instances.push(instance);

    this.soundPools.set(soundId, pool);
    return pool;
  }

  /**
   * Create a pooled audio instance
   */
  private createPoolInstance(soundId: SoundEffectId, config: SoundEffectConfig): PooledAudio {
    const element = new Audio(config.path);
    element.preload = 'auto';

    const instance: PooledAudio = {
      element,
      inUse: false,
      id: `${soundId}-${Date.now()}-${Math.random()}`,
    };

    // Mark as available when ended
    element.addEventListener('ended', () => {
      instance.inUse = false;
      element.currentTime = 0;
    });

    return instance;
  }

  /**
   * Preload commonly used sounds
   */
  private preloadSounds(): void {
    const preloadList = getPreloadSounds();

    for (const soundId of preloadList) {
      const config = SOUND_EFFECT_CONFIG[soundId];
      if (config) {
        this.createPool(soundId, config);
      }
    }
  }

  // =============================================================================
  // MUSIC PLAYBACK
  // =============================================================================

  /**
   * Start playing music for a context
   */
  playMusic(context: MusicContext): void {
    if (!this.state.isInitialized) return;

    // If same context and already playing, don't restart
    if (context === this.state.currentMusicContext && this.musicState.isPlaying) {
      return;
    }

    this.state.currentMusicContext = context;

    // Get tracks for this context
    const tracks = getMusicForContext(context);
    if (tracks.length === 0) return;

    // Shuffle and create queue
    this.musicQueue = this.shuffleArray(tracks.map((t) => t.path));
    this.musicQueueIndex = 0;

    // Start playback
    this.playNextTrack(true);
  }

  /**
   * Stop music playback
   */
  stopMusic(fadeOut: boolean = true): void {
    if (!this.state.isInitialized) return;

    if (fadeOut) {
      this.fadeOutMusic();
    } else {
      const activeElement = this.getActiveMusicElement();
      if (activeElement) {
        activeElement.pause();
        activeElement.currentTime = 0;
      }
      this.musicState.isPlaying = false;
      this.musicState.currentTrack = null;
    }
  }

  /**
   * Pause music playback
   */
  pauseMusic(): void {
    const activeElement = this.getActiveMusicElement();
    if (activeElement) {
      activeElement.pause();
    }
    this.musicState.isPlaying = false;
  }

  /**
   * Resume music playback
   */
  resumeMusic(): void {
    const activeElement = this.getActiveMusicElement();
    if (activeElement && this.musicState.currentTrack) {
      activeElement.play().catch(() => {});
      this.musicState.isPlaying = true;
    }
  }

  /**
   * Skip to next track
   */
  nextTrack(): void {
    this.playNextTrack(false);
  }

  /**
   * Play the next track in queue
   */
  private playNextTrack(immediate: boolean): void {
    if (this.musicQueue.length === 0) return;

    // Get next track
    const trackPath = this.musicQueue[this.musicQueueIndex];
    this.musicQueueIndex = (this.musicQueueIndex + 1) % this.musicQueue.length;

    // Reshuffle if we've gone through all tracks
    if (this.musicQueueIndex === 0) {
      this.musicQueue = this.shuffleArray(this.musicQueue);
    }

    if (immediate || !this.musicState.isPlaying) {
      this.startTrack(trackPath);
    } else {
      this.crossfadeToTrack(trackPath);
    }
  }

  /**
   * Start playing a track immediately
   */
  private startTrack(trackPath: string): void {
    const element = this.getActiveMusicElement();
    if (!element) return;

    element.src = trackPath;
    element.volume = this.getEffectiveMusicVolume();
    element.currentTime = 0;

    const playPromise = element.play();
    if (playPromise) {
      playPromise
        .then(() => {
          this.musicState.isPlaying = true;
          this.musicState.currentTrack = trackPath;
        })
        .catch((error) => {
          if (error.name !== 'NotAllowedError') {
            console.warn('Failed to play music:', error);
          }
        });
    }
  }

  /**
   * Crossfade to a new track
   */
  private crossfadeToTrack(trackPath: string): void {
    if (this.musicState.isCrossfading) return;

    const outgoingElement = this.getActiveMusicElement();
    const incomingElement = this.activeMusicElement === 'A' ? this.musicB : this.musicA;

    if (!outgoingElement || !incomingElement) return;

    this.musicState.isCrossfading = true;

    // Setup incoming
    incomingElement.src = trackPath;
    incomingElement.volume = 0;
    incomingElement.currentTime = 0;

    const playPromise = incomingElement.play();
    if (!playPromise) return;

    playPromise
      .then(() => {
        const startTime = performance.now();
        const targetVolume = this.getEffectiveMusicVolume();
        const startVolume = outgoingElement.volume;

        const animateCrossfade = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / this.CROSSFADE_DURATION, 1);

          // Ease in/out
          const eased =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          incomingElement.volume = eased * targetVolume;
          outgoingElement.volume = (1 - eased) * startVolume;

          if (progress < 1) {
            this.crossfadeAnimationFrame = requestAnimationFrame(animateCrossfade);
          } else {
            // Complete crossfade
            outgoingElement.pause();
            outgoingElement.currentTime = 0;
            this.activeMusicElement = this.activeMusicElement === 'A' ? 'B' : 'A';
            this.musicState.currentTrack = trackPath;
            this.musicState.isCrossfading = false;
          }
        };

        this.crossfadeAnimationFrame = requestAnimationFrame(animateCrossfade);
      })
      .catch(() => {
        this.musicState.isCrossfading = false;
      });
  }

  /**
   * Fade out current music
   */
  private fadeOutMusic(): void {
    const element = this.getActiveMusicElement();
    if (!element) return;

    const startTime = performance.now();
    const startVolume = element.volume;

    const animateFadeOut = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.CROSSFADE_DURATION, 1);

      element.volume = startVolume * (1 - progress);

      if (progress < 1) {
        this.crossfadeAnimationFrame = requestAnimationFrame(animateFadeOut);
      } else {
        element.pause();
        element.currentTime = 0;
        this.musicState.isPlaying = false;
        this.musicState.currentTrack = null;
      }
    };

    this.crossfadeAnimationFrame = requestAnimationFrame(animateFadeOut);
  }

  /**
   * Handle music track ended
   */
  private handleMusicEnded = (): void => {
    if (!this.musicState.isCrossfading) {
      this.playNextTrack(true);
    }
  };

  /**
   * Get the currently active music element
   */
  private getActiveMusicElement(): HTMLAudioElement | null {
    return this.activeMusicElement === 'A' ? this.musicA : this.musicB;
  }

  /**
   * Get effective music volume
   */
  private getEffectiveMusicVolume(): number {
    if (this.state.musicMuted) return 0;
    return this.state.musicVolume * this.state.masterVolume;
  }

  // =============================================================================
  // VOLUME CONTROL
  // =============================================================================

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.state.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  /**
   * Set SFX volume
   */
  setSfxVolume(volume: number): void {
    this.state.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Toggle music mute
   */
  toggleMusicMute(): void {
    this.state.musicMuted = !this.state.musicMuted;
    this.updateMusicVolume();
  }

  /**
   * Toggle SFX mute
   */
  toggleSfxMute(): void {
    this.state.sfxMuted = !this.state.sfxMuted;
  }

  /**
   * Set music muted state
   */
  setMusicMuted(muted: boolean): void {
    this.state.musicMuted = muted;
    this.updateMusicVolume();
  }

  /**
   * Set SFX muted state
   */
  setSfxMuted(muted: boolean): void {
    this.state.sfxMuted = muted;
  }

  /**
   * Update music element volume
   */
  private updateMusicVolume(): void {
    const element = this.getActiveMusicElement();
    if (element && this.musicState.isPlaying && !this.musicState.isCrossfading) {
      element.volume = this.getEffectiveMusicVolume();
    }
  }

  // =============================================================================
  // TAB VISIBILITY
  // =============================================================================

  /**
   * Handle tab visibility change
   */
  private handleVisibilityChange = (): void => {
    const wasVisible = this.state.isTabVisible;
    this.state.isTabVisible = document.visibilityState === 'visible';

    if (wasVisible && !this.state.isTabVisible) {
      // Tab hidden - mute audio
      this.fadeToVisibilityVolume(0);
    } else if (!wasVisible && this.state.isTabVisible) {
      // Tab visible - restore audio
      this.fadeToVisibilityVolume(1);
    }
  };

  /**
   * Fade volume for visibility change
   */
  private fadeToVisibilityVolume(targetMultiplier: number): void {
    const element = this.getActiveMusicElement();
    if (!element) return;

    if (this.tabVisibilityFadeFrame) {
      cancelAnimationFrame(this.tabVisibilityFadeFrame);
    }

    const startTime = performance.now();
    const startVolume = element.volume;
    const targetVolume = this.getEffectiveMusicVolume() * targetMultiplier;
    const duration = 200; // Quick fade

    const animateFade = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      element.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress < 1) {
        this.tabVisibilityFadeFrame = requestAnimationFrame(animateFade);
      }
    };

    this.tabVisibilityFadeFrame = requestAnimationFrame(animateFade);
  }

  // =============================================================================
  // EVENT INTEGRATION
  // =============================================================================

  /**
   * Subscribe to game events for automatic sound playback
   */
  private subscribeToEvents(): void {
    // Tile events
    this.eventUnsubscribers.push(
      eventBus.on('tileDrawn', () => {
        this.play(TILE_SOUNDS.draw);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on('tileDiscarded', () => {
        this.play(TILE_SOUNDS.discard);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on('tileSelected', () => {
        this.play(TILE_SOUNDS.select);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on('tileDeselected', () => {
        this.play(TILE_SOUNDS.deselect);
      })
    );

    // Game events
    this.eventUnsubscribers.push(
      eventBus.on('yakuScored', () => {
        this.play(SPECIAL_SOUNDS.yakuScored);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on('yakumanScored', () => {
        this.play(SPECIAL_SOUNDS.yakumanScored);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on('roundEnd', (data) => {
        if (data.won) {
          this.play(GAME_SOUNDS.roundComplete);
        } else {
          this.play(GAME_SOUNDS.roundFailed);
        }
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on('goldChanged', (data) => {
        if (data.delta > 0) {
          this.play(GAME_SOUNDS.goldEarned);
        } else if (data.delta < 0) {
          this.play(GAME_SOUNDS.goldSpent);
        }
      })
    );

    // Shop events
    this.eventUnsubscribers.push(
      eventBus.on('itemPurchased', () => {
        this.play(SHOP_SOUNDS.purchase);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on('shopRerolled', () => {
        this.play(SHOP_SOUNDS.reroll);
      })
    );

    // Item events
    this.eventUnsubscribers.push(
      eventBus.on('decreeAcquired', () => {
        this.play(SPECIAL_SOUNDS.decreeAcquired);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on('decreeTriggered', () => {
        this.play(SPECIAL_SOUNDS.decreeTriggered);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on('flowerCollected', () => {
        this.play(SPECIAL_SOUNDS.flowerCollected);
      })
    );

    this.eventUnsubscribers.push(
      eventBus.on('seasonActivated', () => {
        this.play(SPECIAL_SOUNDS.seasonActivated);
      })
    );

    // Phase changes for music
    this.eventUnsubscribers.push(
      eventBus.on('phaseChanged', (data) => {
        this.handlePhaseChange(data.newPhase as MusicContext);
      })
    );

    // Screen transitions for music
    this.eventUnsubscribers.push(
      eventBus.on('screenTransition', (data) => {
        this.handleScreenTransition(data.to as MusicContext);
      })
    );
  }

  /**
   * Handle game phase change
   */
  private handlePhaseChange(phase: string): void {
    // Map phase to music context
    const contextMap: Record<string, MusicContext> = {
      menu: 'menu',
      gameplay: 'gameplay',
      shop: 'shop',
      gameOver: 'gameOver',
    };

    const context = contextMap[phase];
    if (context) {
      this.playMusic(context);
    }
  }

  /**
   * Handle screen transition
   */
  private handleScreenTransition(to: string): void {
    // Map screen to music context
    const contextMap: Record<string, MusicContext> = {
      menu: 'menu',
      game: 'gameplay',
      shop: 'shop',
      gameOver: 'gameOver',
      victory: 'victory',
    };

    const context = contextMap[to];
    if (context) {
      this.playMusic(context);
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Fisher-Yates shuffle
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get current state (for debugging)
   */
  getState(): AudioSystemState & MusicState {
    return {
      ...this.state,
      ...this.musicState,
    };
  }

  /**
   * Check if audio is supported
   */
  isAudioSupported(): boolean {
    return typeof Audio !== 'undefined';
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global audio system instance
 */
export const audioSystem = new AudioSystem();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Play a sound effect (convenience function)
 */
export function playSFX(
  soundId: SoundEffectId,
  options?: { volume?: number; pitch?: number }
): void {
  audioSystem.play(soundId, options);
}

/**
 * Play tile sound shortcuts
 */
export const TileSFX = {
  draw: () => playSFX(TILE_SOUNDS.draw),
  discard: () => playSFX(TILE_SOUNDS.discard),
  select: () => playSFX(TILE_SOUNDS.select),
  deselect: () => playSFX(TILE_SOUNDS.deselect),
  slide: () => playSFX(TILE_SOUNDS.slide),
};

/**
 * Play UI sound shortcuts
 */
export const UISFX = {
  click: () => playSFX(UI_SOUNDS.buttonClick),
  hover: () => playSFX(UI_SOUNDS.buttonHover),
  menuOpen: () => playSFX(UI_SOUNDS.menuOpen),
  menuClose: () => playSFX(UI_SOUNDS.menuClose),
};

/**
 * Play feedback sound shortcuts
 */
export const FeedbackSFX = {
  error: () => playSFX(FEEDBACK_SOUNDS.error),
  invalid: () => playSFX(FEEDBACK_SOUNDS.invalidAction),
  success: () => playSFX(FEEDBACK_SOUNDS.success),
};

export default audioSystem;
