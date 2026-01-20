/**
 * VFX Hook for Tensho Mahjong Roguelike
 *
 * React hook for integrating VFX system with components.
 * Provides:
 * - Screen shake animations
 * - Screen flash effects
 * - Particle burst triggers
 * - Score popup management
 */

import React, { useEffect, useState, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { useSettingsStore } from '../stores/settingsStore';
import {
  vfxSystem,
  ShakeConfig,
  FlashConfig,
  ParticleBurstConfig,
  ScorePopupConfig,
  ShakeIntensity,
  SHAKE_PRESETS,
  FLASH_PRESETS,
  PARTICLE_PRESETS,
} from '../systems/VFXSystem';
import { ANIMATION_COLORS, ANIMATION_Z_INDEX, DURATIONS } from '../animations/constants';

// =============================================================================
// TYPES
// =============================================================================

// VFXState is used for reference but not directly instantiated
// Kept for documentation of the state shape

interface VFXContextValue {
  // Trigger methods
  shake: (intensity?: ShakeIntensity) => void;
  flash: (preset?: keyof typeof FLASH_PRESETS) => void;
  particles: (preset?: keyof typeof PARTICLE_PRESETS) => void;
  scorePopup: (value: number, label?: string) => void;
  comboPopups: (items: Array<{ value: number; label: string; color?: string }>) => void;

  // Compound effects
  yakumanCelebration: () => void;
  roundWinCelebration: (score: number) => void;
  errorFeedback: () => void;

  // Container components
  ShakeContainer: React.FC<{ children: ReactNode }>;
  FlashOverlay: React.FC;
  PopupContainer: React.FC;
}

// =============================================================================
// SCREEN SHAKE HOOK
// =============================================================================

/**
 * Hook for screen shake effect
 */
export function useScreenShake() {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const configRef = useRef<ShakeConfig | null>(null);

  const shake = useCallback(
    (intensity: ShakeIntensity | ShakeConfig = 'medium') => {
      if (reducedMotion) return;

      const config = typeof intensity === 'string' ? SHAKE_PRESETS[intensity] : intensity;
      configRef.current = config;
      startTimeRef.current = performance.now();

      const animateShake = (currentTime: number) => {
        if (!configRef.current) return;

        const elapsed = currentTime - startTimeRef.current;
        const progress = elapsed / configRef.current.duration;

        if (progress >= 1) {
          setShakeOffset({ x: 0, y: 0 });
          configRef.current = null;
          return;
        }

        // Calculate shake with decay
        const decayedAmplitude =
          configRef.current.amplitude * Math.pow(configRef.current.decay, progress * 10);
        const frequency = configRef.current.frequency;

        // Random-ish oscillation
        const x = Math.sin(elapsed * frequency * 0.01) * decayedAmplitude;
        const y = Math.cos(elapsed * frequency * 0.01 + 0.5) * decayedAmplitude * 0.7;

        setShakeOffset({ x, y });
        animationFrameRef.current = requestAnimationFrame(animateShake);
      };

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animateShake);
    },
    [reducedMotion]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Subscribe to VFX system
  useEffect(() => {
    const unsubscribe = vfxSystem.onShake((config) => {
      shake(config);
    });
    return unsubscribe;
  }, [shake]);

  // Container component
  const ShakeContainer: React.FC<{ children: ReactNode }> = useCallback(
    ({ children }) => (
      <div
        style={{
          transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    ),
    [shakeOffset]
  );

  return {
    shake,
    shakeOffset,
    ShakeContainer,
  };
}

// =============================================================================
// SCREEN FLASH HOOK
// =============================================================================

/**
 * Hook for screen flash effect
 */
export function useScreenFlash() {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [flashConfig, setFlashConfig] = useState<FlashConfig | null>(null);
  const [isActive, setIsActive] = useState(false);

  const spring = useSpring({
    opacity: isActive ? (flashConfig?.intensity ?? 0.5) : 0,
    config: {
      duration: reducedMotion ? 0 : flashConfig?.duration ?? DURATIONS.fast,
    },
    onRest: () => {
      if (isActive) {
        setIsActive(false);
        setFlashConfig(null);
      }
    },
  });

  const flash = useCallback(
    (preset: keyof typeof FLASH_PRESETS | FlashConfig = 'win') => {
      const config = typeof preset === 'string' ? FLASH_PRESETS[preset] : preset;
      setFlashConfig(config);
      setIsActive(true);
    },
    []
  );

  // Subscribe to VFX system
  useEffect(() => {
    const unsubscribe = vfxSystem.onFlash((config) => {
      flash(config);
    });
    return unsubscribe;
  }, [flash]);

  // Overlay component
  const FlashOverlay: React.FC = useCallback(
    () =>
      flashConfig ? (
        <animated.div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: ANIMATION_Z_INDEX.screenEffect,
            backgroundColor: flashConfig.color,
            opacity: spring.opacity,
            mixBlendMode: flashConfig.blendMode ?? 'screen',
            background: flashConfig.radial
              ? `radial-gradient(ellipse at center, ${flashConfig.color}, transparent 70%)`
              : flashConfig.color,
          }}
        />
      ) : null,
    [flashConfig, spring.opacity]
  );

  return {
    flash,
    isActive,
    FlashOverlay,
  };
}

// =============================================================================
// SCORE POPUP HOOK
// =============================================================================

interface PopupItem extends ScorePopupConfig {
  id: string;
}

/**
 * Hook for managing score popups
 */
export function useScorePopups() {
  const [popups, setPopups] = useState<PopupItem[]>([]);

  const showPopup = useCallback((config: ScorePopupConfig) => {
    const id = `popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setPopups((prev) => [...prev, { ...config, id }]);
  }, []);

  const removePopup = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Subscribe to VFX system
  useEffect(() => {
    const unsubscribe = vfxSystem.onScorePopup((config) => {
      showPopup(config);
    });
    return unsubscribe;
  }, [showPopup]);

  // Popup container component
  const PopupContainer: React.FC = useCallback(
    () => (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: ANIMATION_Z_INDEX.effects,
          overflow: 'hidden',
        }}
      >
        {popups.map((popup) => (
          <ScorePopupItem
            key={popup.id}
            {...popup}
            onComplete={() => removePopup(popup.id)}
          />
        ))}
      </div>
    ),
    [popups, removePopup]
  );

  return {
    showPopup,
    popups,
    PopupContainer,
  };
}

/**
 * Individual score popup component
 */
const ScorePopupItem: React.FC<PopupItem & { onComplete: () => void }> = ({
  value,
  position,
  color = ANIMATION_COLORS.gold,
  fontSize = 24,
  label,
  duration = DURATIONS.slow,
  style = 'float',
  onComplete,
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const getAnimationConfig = () => {
    switch (style) {
      case 'pop':
        return {
          from: { opacity: 0, scale: 0.5, y: 0 },
          to: async (next: (props: object) => Promise<void>) => {
            await next({ opacity: 1, scale: 1.2, y: -10 });
            await next({ scale: 1, y: -20 });
            await new Promise((resolve) => setTimeout(resolve, duration));
            await next({ opacity: 0, scale: 0.8, y: -40 });
          },
        };
      case 'slide':
        return {
          from: { opacity: 0, x: -30, y: 0 },
          to: async (next: (props: object) => Promise<void>) => {
            await next({ opacity: 1, x: 0 });
            await new Promise((resolve) => setTimeout(resolve, duration));
            await next({ opacity: 0, x: 30 });
          },
        };
      case 'float':
      default:
        return {
          from: { opacity: 0, y: 0, scale: 0.8 },
          to: async (next: (props: object) => Promise<void>) => {
            await next({ opacity: 1, scale: 1 });
            await new Promise((resolve) => setTimeout(resolve, duration * 0.5));
            await next({ opacity: 0, y: -60, scale: 0.9 });
          },
        };
    }
  };

  const spring = useSpring({
    ...getAnimationConfig(),
    config: config.gentle,
    immediate: reducedMotion,
    onRest: onComplete,
  });

  return (
    <animated.div
      style={{
        position: 'absolute',
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: spring.scale.to(
          (s) => `translate(-50%, -50%) scale(${s}) translateY(${spring.y?.get() ?? 0}px)`
        ),
        opacity: spring.opacity,
        color,
        fontSize: `${fontSize}px`,
        fontWeight: 'bold',
        textShadow: `0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.5)`,
        fontFamily: "'Noto Sans JP', sans-serif",
        whiteSpace: 'nowrap',
        textAlign: 'center',
      }}
    >
      {label && (
        <div style={{ fontSize: `${fontSize * 0.6}px`, opacity: 0.8, marginBottom: 4 }}>
          {label}
        </div>
      )}
      <div>
        {value >= 0 ? '+' : ''}
        {value.toLocaleString()}
      </div>
    </animated.div>
  );
};

// =============================================================================
// COMBINED VFX HOOK
// =============================================================================

/**
 * Combined hook for all VFX functionality
 */
export function useVFX() {
  const { shake, ShakeContainer } = useScreenShake();
  const { flash, FlashOverlay } = useScreenFlash();
  const { showPopup, PopupContainer } = useScorePopups();
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  // Initialize VFX system
  useEffect(() => {
    vfxSystem.initialize();
    vfxSystem.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  // Convenience methods
  const scorePopup = useCallback(
    (value: number, label?: string) => {
      showPopup({
        value,
        label,
        position: { x: 0.5, y: 0.5 },
      });
    },
    [showPopup]
  );

  const comboPopups = useCallback(
    (items: Array<{ value: number; label: string; color?: string }>) => {
      vfxSystem.comboPopups(items, { x: 0.5, y: 0.5 });
    },
    []
  );

  const yakumanCelebration = useCallback(() => {
    vfxSystem.yakumanCelebration();
  }, []);

  const roundWinCelebration = useCallback((score: number) => {
    vfxSystem.roundWinCelebration(score);
  }, []);

  const errorFeedback = useCallback(() => {
    vfxSystem.errorFeedback();
  }, []);

  const particles = useCallback((preset: keyof typeof PARTICLE_PRESETS = 'roundWin') => {
    vfxSystem.particles(preset);
  }, []);

  return {
    // Direct triggers
    shake,
    flash,
    particles,
    scorePopup,
    comboPopups,

    // Compound effects
    yakumanCelebration,
    roundWinCelebration,
    errorFeedback,

    // Container components
    ShakeContainer,
    FlashOverlay,
    PopupContainer,
  };
}

// =============================================================================
// VFX CONTEXT PROVIDER
// =============================================================================

const VFXContext = createContext<VFXContextValue | null>(null);

/**
 * VFX Provider component
 */
export function VFXProvider({ children }: { children: ReactNode }) {
  const vfx = useVFX();

  return (
    <VFXContext.Provider value={vfx}>
      <vfx.ShakeContainer>
        {children}
        <vfx.FlashOverlay />
        <vfx.PopupContainer />
      </vfx.ShakeContainer>
    </VFXContext.Provider>
  );
}

/**
 * Hook to access VFX context
 */
export function useVFXContext() {
  const context = useContext(VFXContext);
  if (!context) {
    throw new Error('useVFXContext must be used within VFXProvider');
  }
  return context;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for button press effects
 */
export function useButtonPressEffect() {
  const [isPressed, setIsPressed] = useState(false);

  const spring = useSpring({
    scale: isPressed ? 0.95 : 1,
    config: { tension: 400, friction: 15 },
  });

  const handlers = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false),
  };

  return {
    style: { transform: spring.scale.to((s) => `scale(${s})`) },
    handlers,
    isPressed,
  };
}

/**
 * Hook for hover glow effects
 */
export function useHoverGlow(color: string = ANIMATION_COLORS.gold) {
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const spring = useSpring({
    glowIntensity: isHovered ? 1 : 0,
    config: { tension: 200, friction: 20 },
    immediate: reducedMotion,
  });

  const handlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return {
    style: {
      boxShadow: spring.glowIntensity.to(
        (i) => `0 0 ${i * 20}px ${i * 8}px ${color}`
      ),
    },
    handlers,
    isHovered,
  };
}

/**
 * Hook for counting up number animation
 */
export function useCountUp(
  targetValue: number,
  options?: {
    duration?: number;
    delay?: number;
    onComplete?: () => void;
  }
) {
  const { duration = DURATIONS.slow, delay = 0, onComplete } = options ?? {};
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const spring = useSpring({
    from: { value: 0 },
    to: { value: targetValue },
    delay,
    config: {
      duration: reducedMotion ? 0 : duration,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    },
    onRest: onComplete,
  });

  return {
    value: spring.value,
    displayValue: spring.value.to((v) => Math.floor(v)),
    formattedValue: spring.value.to((v) => Math.floor(v).toLocaleString()),
  };
}

/**
 * Hook for pulsing effect on value change
 */
export function usePulseOnChange<T>(value: T) {
  const [isPulsing, setIsPulsing] = useState(false);
  const previousValueRef = useRef(value);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  useEffect(() => {
    if (value !== previousValueRef.current) {
      previousValueRef.current = value;
      if (!reducedMotion) {
        setIsPulsing(true);
        const timeout = setTimeout(() => setIsPulsing(false), 300);
        return () => clearTimeout(timeout);
      }
    }
  }, [value, reducedMotion]);

  const spring = useSpring({
    scale: isPulsing ? 1.1 : 1,
    config: { tension: 400, friction: 10 },
    immediate: reducedMotion,
  });

  return {
    style: { transform: spring.scale.to((s) => `scale(${s})`) },
    isPulsing,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { SHAKE_PRESETS, FLASH_PRESETS, PARTICLE_PRESETS };
export type { ShakeIntensity, ShakeConfig, FlashConfig, ParticleBurstConfig, ScorePopupConfig };
