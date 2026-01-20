/**
 * VFX System for Tensho Mahjong Roguelike
 *
 * Central visual effects management system that handles:
 * - Screen effects (shake, flash, vignette)
 * - Particle effects (confetti, sparkles, etc.)
 * - Score popups and number animations
 * - Integration with EventBus for game events
 */

import { eventBus, GameEvent, GameEventData } from '../game/EventBus';
import { ANIMATION_COLORS, DURATIONS } from '../animations/constants';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Screen shake intensity levels
 */
export type ShakeIntensity = 'light' | 'medium' | 'heavy' | 'yakuman';

/**
 * Screen shake configuration
 */
export interface ShakeConfig {
  /** Maximum displacement in pixels */
  amplitude: number;
  /** Duration in milliseconds */
  duration: number;
  /** Frequency of oscillation */
  frequency: number;
  /** Decay factor (0-1, how quickly it settles) */
  decay: number;
}

/**
 * Flash effect configuration
 */
export interface FlashConfig {
  /** Flash color */
  color: string;
  /** Maximum opacity (0-1) */
  intensity: number;
  /** Duration in milliseconds */
  duration: number;
  /** Whether to use radial gradient */
  radial?: boolean;
  /** Blend mode */
  blendMode?: 'screen' | 'overlay' | 'normal';
}

/**
 * Particle burst configuration
 */
export interface ParticleBurstConfig {
  /** Particle type */
  type: 'confetti' | 'sparkle' | 'gold' | 'flower' | 'star';
  /** Number of particles */
  count: number;
  /** Origin position (normalized 0-1) */
  origin: { x: number; y: number };
  /** Spread radius in pixels */
  spread: number;
  /** Colors to use */
  colors: string[];
  /** Duration in milliseconds */
  duration: number;
  /** Gravity factor */
  gravity?: number;
}

/**
 * Score popup configuration
 */
export interface ScorePopupConfig {
  /** Value to display */
  value: number;
  /** Position (normalized 0-1) */
  position: { x: number; y: number };
  /** Text color */
  color?: string;
  /** Font size */
  fontSize?: number;
  /** Label text (e.g., "Chips", "Mult") */
  label?: string;
  /** Duration in milliseconds */
  duration?: number;
  /** Animation style */
  style?: 'float' | 'pop' | 'slide';
}

/**
 * VFX event data
 */
export interface VFXEventData {
  shake: ShakeConfig;
  flash: FlashConfig;
  particles: ParticleBurstConfig;
  scorePopup: ScorePopupConfig;
}

/**
 * VFX callback type
 */
export type VFXCallback<T extends keyof VFXEventData> = (config: VFXEventData[T]) => void;

/**
 * VFX system state
 */
export interface VFXSystemState {
  isEnabled: boolean;
  reducedMotion: boolean;
  screenShakeEnabled: boolean;
  particlesEnabled: boolean;
  flashEnabled: boolean;
}

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

/**
 * Screen shake presets
 */
export const SHAKE_PRESETS: Record<ShakeIntensity, ShakeConfig> = {
  light: {
    amplitude: 3,
    duration: 150,
    frequency: 25,
    decay: 0.9,
  },
  medium: {
    amplitude: 6,
    duration: 250,
    frequency: 30,
    decay: 0.85,
  },
  heavy: {
    amplitude: 12,
    duration: 400,
    frequency: 35,
    decay: 0.8,
  },
  yakuman: {
    amplitude: 20,
    duration: 800,
    frequency: 40,
    decay: 0.7,
  },
};

/**
 * Flash effect presets
 */
export const FLASH_PRESETS = {
  win: {
    color: ANIMATION_COLORS.gold,
    intensity: 0.4,
    duration: DURATIONS.fast,
    blendMode: 'screen' as const,
  },
  yakuman: {
    color: ANIMATION_COLORS.red,
    intensity: 0.8,
    duration: DURATIONS.normal,
    radial: true,
    blendMode: 'screen' as const,
  },
  error: {
    color: ANIMATION_COLORS.red,
    intensity: 0.2,
    duration: DURATIONS.instant,
    blendMode: 'normal' as const,
  },
  purchase: {
    color: ANIMATION_COLORS.gold,
    intensity: 0.2,
    duration: DURATIONS.fast,
    blendMode: 'screen' as const,
  },
  roundComplete: {
    color: ANIMATION_COLORS.white,
    intensity: 0.3,
    duration: DURATIONS.fast,
    blendMode: 'screen' as const,
  },
};

/**
 * Particle burst presets
 */
export const PARTICLE_PRESETS = {
  roundWin: {
    type: 'confetti' as const,
    count: 50,
    origin: { x: 0.5, y: 0.5 },
    spread: 200,
    colors: [
      ANIMATION_COLORS.gold,
      ANIMATION_COLORS.orange,
      ANIMATION_COLORS.red,
      ANIMATION_COLORS.purple,
      ANIMATION_COLORS.blue,
    ],
    duration: DURATIONS.dramatic,
    gravity: 0.5,
  },
  yakuman: {
    type: 'star' as const,
    count: 100,
    origin: { x: 0.5, y: 0.5 },
    spread: 300,
    colors: [ANIMATION_COLORS.gold, ANIMATION_COLORS.white, ANIMATION_COLORS.orange],
    duration: DURATIONS.extended,
    gravity: 0.2,
  },
  goldEarned: {
    type: 'gold' as const,
    count: 20,
    origin: { x: 0.5, y: 0.3 },
    spread: 100,
    colors: [ANIMATION_COLORS.gold],
    duration: DURATIONS.slow,
    gravity: 0.8,
  },
  flowerCollected: {
    type: 'flower' as const,
    count: 15,
    origin: { x: 0.5, y: 0.5 },
    spread: 80,
    colors: ['#FFB7C5', '#FF69B4', '#FFC0CB'],
    duration: DURATIONS.slow,
    gravity: 0.3,
  },
  yakuScored: {
    type: 'sparkle' as const,
    count: 25,
    origin: { x: 0.5, y: 0.5 },
    spread: 120,
    colors: [ANIMATION_COLORS.gold, ANIMATION_COLORS.white],
    duration: DURATIONS.normal,
    gravity: 0.4,
  },
};

// =============================================================================
// VFX SYSTEM CLASS
// =============================================================================

/**
 * Centralized VFX management system
 */
export class VFXSystem {
  // State
  private state: VFXSystemState = {
    isEnabled: true,
    reducedMotion: false,
    screenShakeEnabled: true,
    particlesEnabled: true,
    flashEnabled: true,
  };

  // Callback registry
  private shakeCallbacks: Set<VFXCallback<'shake'>> = new Set();
  private flashCallbacks: Set<VFXCallback<'flash'>> = new Set();
  private particleCallbacks: Set<VFXCallback<'particles'>> = new Set();
  private scorePopupCallbacks: Set<VFXCallback<'scorePopup'>> = new Set();

  // Event unsubscribers
  private eventUnsubscribers: Array<() => void> = [];

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  /**
   * Initialize the VFX system
   */
  initialize(): void {
    // Check for reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.state.reducedMotion = mediaQuery.matches;

      mediaQuery.addEventListener('change', (e) => {
        this.state.reducedMotion = e.matches;
      });
    }

    // Subscribe to game events
    this.subscribeToEvents();
  }

  /**
   * Cleanup the VFX system
   */
  destroy(): void {
    // Unsubscribe from events
    this.eventUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.eventUnsubscribers = [];

    // Clear callbacks
    this.shakeCallbacks.clear();
    this.flashCallbacks.clear();
    this.particleCallbacks.clear();
    this.scorePopupCallbacks.clear();
  }

  // =============================================================================
  // CALLBACK REGISTRATION
  // =============================================================================

  /**
   * Register a shake effect callback
   */
  onShake(callback: VFXCallback<'shake'>): () => void {
    this.shakeCallbacks.add(callback);
    return () => this.shakeCallbacks.delete(callback);
  }

  /**
   * Register a flash effect callback
   */
  onFlash(callback: VFXCallback<'flash'>): () => void {
    this.flashCallbacks.add(callback);
    return () => this.flashCallbacks.delete(callback);
  }

  /**
   * Register a particle effect callback
   */
  onParticles(callback: VFXCallback<'particles'>): () => void {
    this.particleCallbacks.add(callback);
    return () => this.particleCallbacks.delete(callback);
  }

  /**
   * Register a score popup callback
   */
  onScorePopup(callback: VFXCallback<'scorePopup'>): () => void {
    this.scorePopupCallbacks.add(callback);
    return () => this.scorePopupCallbacks.delete(callback);
  }

  // =============================================================================
  // EFFECT TRIGGERS
  // =============================================================================

  /**
   * Trigger a screen shake effect
   */
  shake(intensity: ShakeIntensity | ShakeConfig): void {
    if (!this.canPlayEffect('shake')) return;

    const config = typeof intensity === 'string' ? SHAKE_PRESETS[intensity] : intensity;

    // Reduce intensity for reduced motion
    const finalConfig = this.state.reducedMotion
      ? { ...config, amplitude: config.amplitude * 0.3, duration: config.duration * 0.5 }
      : config;

    this.shakeCallbacks.forEach((callback) => callback(finalConfig));
  }

  /**
   * Trigger a screen flash effect
   */
  flash(preset: keyof typeof FLASH_PRESETS | FlashConfig): void {
    if (!this.canPlayEffect('flash')) return;

    const config = typeof preset === 'string' ? FLASH_PRESETS[preset] : preset;

    // Reduce intensity for reduced motion
    const finalConfig = this.state.reducedMotion
      ? { ...config, intensity: config.intensity * 0.5, duration: config.duration * 0.5 }
      : config;

    this.flashCallbacks.forEach((callback) => callback(finalConfig));
  }

  /**
   * Trigger a particle burst effect
   */
  particles(preset: keyof typeof PARTICLE_PRESETS | ParticleBurstConfig): void {
    if (!this.canPlayEffect('particles')) return;
    if (this.state.reducedMotion) return; // Skip particles entirely for reduced motion

    const config = typeof preset === 'string' ? PARTICLE_PRESETS[preset] : preset;

    this.particleCallbacks.forEach((callback) => callback(config));
  }

  /**
   * Show a score popup
   */
  scorePopup(config: ScorePopupConfig): void {
    if (!this.state.isEnabled) return;

    // Apply defaults
    const finalConfig: ScorePopupConfig = {
      color: ANIMATION_COLORS.gold,
      fontSize: 24,
      duration: DURATIONS.slow,
      style: 'float',
      ...config,
    };

    this.scorePopupCallbacks.forEach((callback) => callback(finalConfig));
  }

  /**
   * Show multiple score popups in sequence (for combo display)
   */
  comboPopups(
    items: Array<{ value: number; label: string; color?: string }>,
    basePosition: { x: number; y: number },
    staggerMs: number = 100
  ): void {
    items.forEach((item, index) => {
      setTimeout(() => {
        this.scorePopup({
          value: item.value,
          label: item.label,
          position: {
            x: basePosition.x,
            y: basePosition.y - index * 0.05, // Stack upward
          },
          color: item.color,
          style: 'pop',
        });
      }, index * staggerMs);
    });
  }

  // =============================================================================
  // COMPOUND EFFECTS
  // =============================================================================

  /**
   * Play yakuman celebration effects
   */
  yakumanCelebration(): void {
    this.shake('yakuman');
    this.flash('yakuman');
    this.particles('yakuman');
  }

  /**
   * Play round win effects
   */
  roundWinCelebration(score: number): void {
    this.shake('medium');
    this.flash('roundComplete');
    this.particles('roundWin');
    this.scorePopup({
      value: score,
      position: { x: 0.5, y: 0.4 },
      label: 'Round Complete!',
      fontSize: 32,
      style: 'pop',
    });
  }

  /**
   * Play yaku scored effects
   */
  yakuScoredEffect(yakuName: string, multiplier: number): void {
    this.shake('light');
    this.particles('yakuScored');
    this.scorePopup({
      value: multiplier,
      position: { x: 0.5, y: 0.5 },
      label: yakuName,
      style: 'pop',
    });
  }

  /**
   * Play gold earned effects
   */
  goldEarnedEffect(amount: number, position?: { x: number; y: number }): void {
    this.particles({
      ...PARTICLE_PRESETS.goldEarned,
      origin: position ?? { x: 0.5, y: 0.3 },
    });
    this.scorePopup({
      value: amount,
      position: position ?? { x: 0.5, y: 0.3 },
      label: 'Gold',
      color: ANIMATION_COLORS.gold,
      style: 'float',
    });
  }

  /**
   * Play error feedback effect
   */
  errorFeedback(): void {
    this.shake('light');
    this.flash('error');
  }

  /**
   * Play big score effect (for high scores during gameplay)
   */
  bigScoreEffect(score: number, intensity: 'low' | 'medium' | 'high' = 'medium'): void {
    const shakeIntensity: ShakeIntensity =
      intensity === 'high' ? 'heavy' : intensity === 'medium' ? 'medium' : 'light';

    this.shake(shakeIntensity);

    if (intensity !== 'low') {
      this.flash('win');
    }

    this.scorePopup({
      value: score,
      position: { x: 0.5, y: 0.5 },
      fontSize: intensity === 'high' ? 48 : intensity === 'medium' ? 36 : 28,
      style: 'pop',
    });
  }

  // =============================================================================
  // CONFIGURATION
  // =============================================================================

  /**
   * Enable or disable all VFX
   */
  setEnabled(enabled: boolean): void {
    this.state.isEnabled = enabled;
  }

  /**
   * Set reduced motion mode
   */
  setReducedMotion(reduced: boolean): void {
    this.state.reducedMotion = reduced;
  }

  /**
   * Enable or disable screen shake
   */
  setScreenShakeEnabled(enabled: boolean): void {
    this.state.screenShakeEnabled = enabled;
  }

  /**
   * Enable or disable particles
   */
  setParticlesEnabled(enabled: boolean): void {
    this.state.particlesEnabled = enabled;
  }

  /**
   * Enable or disable flash effects
   */
  setFlashEnabled(enabled: boolean): void {
    this.state.flashEnabled = enabled;
  }

  /**
   * Get current state
   */
  getState(): VFXSystemState {
    return { ...this.state };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Check if an effect type can be played
   */
  private canPlayEffect(type: 'shake' | 'flash' | 'particles'): boolean {
    if (!this.state.isEnabled) return false;

    switch (type) {
      case 'shake':
        return this.state.screenShakeEnabled;
      case 'flash':
        return this.state.flashEnabled;
      case 'particles':
        return this.state.particlesEnabled;
      default:
        return true;
    }
  }

  /**
   * Subscribe to game events for automatic VFX
   */
  private subscribeToEvents(): void {
    // Yaku scored
    this.eventUnsubscribers.push(
      eventBus.on('yakuScored', (data) => {
        this.yakuScoredEffect(data.yakuName, data.multiplier);
      })
    );

    // Yakuman scored
    this.eventUnsubscribers.push(
      eventBus.on('yakumanScored', () => {
        this.yakumanCelebration();
      })
    );

    // Round end
    this.eventUnsubscribers.push(
      eventBus.on('roundEnd', (data) => {
        if (data.won) {
          this.roundWinCelebration(data.score);
        } else {
          this.errorFeedback();
        }
      })
    );

    // Gold changed
    this.eventUnsubscribers.push(
      eventBus.on('goldChanged', (data) => {
        if (data.delta > 0) {
          this.goldEarnedEffect(data.delta);
        }
      })
    );

    // Item purchased
    this.eventUnsubscribers.push(
      eventBus.on('itemPurchased', () => {
        this.flash('purchase');
      })
    );

    // Flower collected
    this.eventUnsubscribers.push(
      eventBus.on('flowerCollected', () => {
        this.particles('flowerCollected');
      })
    );

    // Decree acquired
    this.eventUnsubscribers.push(
      eventBus.on('decreeAcquired', () => {
        this.shake('light');
        this.particles('yakuScored');
      })
    );
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global VFX system instance
 */
export const vfxSystem = new VFXSystem();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Trigger screen shake (convenience function)
 */
export function screenShake(intensity: ShakeIntensity = 'medium'): void {
  vfxSystem.shake(intensity);
}

/**
 * Trigger screen flash (convenience function)
 */
export function screenFlash(preset: keyof typeof FLASH_PRESETS = 'win'): void {
  vfxSystem.flash(preset);
}

/**
 * Trigger particle burst (convenience function)
 */
export function particleBurst(preset: keyof typeof PARTICLE_PRESETS = 'roundWin'): void {
  vfxSystem.particles(preset);
}

/**
 * Show score popup (convenience function)
 */
export function showScorePopup(value: number, label?: string): void {
  vfxSystem.scorePopup({
    value,
    label,
    position: { x: 0.5, y: 0.5 },
  });
}

export default vfxSystem;
