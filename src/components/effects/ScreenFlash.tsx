/**
 * ScreenFlash Component for Tensho Mahjong Roguelike
 *
 * Full-screen flash effect for:
 * - Yakuman completion
 * - Round completion
 * - Game over
 * - Custom events
 */

import React, { useCallback, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useSettingsStore } from '../../stores/settingsStore';
import { DURATIONS, ANIMATION_COLORS, ANIMATION_Z_INDEX } from '../../animations/constants';

export type FlashVariant = 'yakuman' | 'win' | 'round' | 'gameOver' | 'custom';

export interface ScreenFlashProps {
  /** Type of flash effect */
  variant?: FlashVariant;
  /** Custom color (overrides variant) */
  color?: string;
  /** Intensity of the flash (0-1) */
  intensity?: number;
  /** Duration of the flash in milliseconds */
  duration?: number;
  /** Whether the flash is active */
  isActive?: boolean;
  /** Callback when flash completes */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Get flash color based on variant
 */
function getFlashColor(variant: FlashVariant): string {
  switch (variant) {
    case 'yakuman':
      return ANIMATION_COLORS.red;
    case 'win':
      return ANIMATION_COLORS.gold;
    case 'round':
      return ANIMATION_COLORS.white;
    case 'gameOver':
      return '#000000';
    case 'custom':
    default:
      return ANIMATION_COLORS.white;
  }
}

/**
 * Get default intensity based on variant
 */
function getDefaultIntensity(variant: FlashVariant): number {
  switch (variant) {
    case 'yakuman':
      return 0.8;
    case 'win':
      return 0.6;
    case 'round':
      return 0.4;
    case 'gameOver':
      return 1;
    default:
      return 0.5;
  }
}

/**
 * ScreenFlash component
 * Renders a full-screen flash effect
 */
export const ScreenFlash: React.FC<ScreenFlashProps> = ({
  variant = 'custom',
  color,
  intensity,
  duration = DURATIONS.fast,
  isActive = false,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const flashColor = color || getFlashColor(variant);
  const flashIntensity = intensity ?? getDefaultIntensity(variant);

  const spring = useSpring({
    from: { opacity: 0 },
    to: async (next) => {
      if (isActive && !reducedMotion) {
        // Flash in
        await next({ opacity: flashIntensity, immediate: true });
        // Flash out
        await next({ opacity: 0 });
      } else if (isActive && reducedMotion) {
        // Brief visible state for reduced motion
        await next({ opacity: flashIntensity * 0.3 });
        await next({ opacity: 0 });
      }
    },
    config: {
      duration: reducedMotion ? DURATIONS.instant : duration,
    },
    onRest: () => {
      if (isActive) {
        onComplete?.();
      }
    },
  });

  if (!isActive) {
    return null;
  }

  return (
    <animated.div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{
        backgroundColor: flashColor,
        opacity: spring.opacity,
        zIndex: ANIMATION_Z_INDEX.screenEffect,
        mixBlendMode: variant === 'gameOver' ? 'normal' : 'screen',
      }}
    />
  );
};

/**
 * YakumanFlash component
 * Special multi-stage flash for yakuman achievement
 */
export interface YakumanFlashProps {
  /** Whether the flash is active */
  isActive?: boolean;
  /** Callback when flash completes */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

export const YakumanFlash: React.FC<YakumanFlashProps> = ({
  isActive = false,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const spring = useSpring({
    from: { opacity: 0, scale: 1 },
    to: async (next) => {
      if (isActive && !reducedMotion) {
        // First flash - white
        await next({ opacity: 1, immediate: true });
        await next({ opacity: 0 });
        // Second flash - gold
        await next({ opacity: 0.8 });
        await next({ opacity: 0 });
        // Third flash - red (sustained)
        await next({ opacity: 0.6 });
        await new Promise((r) => setTimeout(r, DURATIONS.normal));
        await next({ opacity: 0 });
      } else if (isActive && reducedMotion) {
        await next({ opacity: 0.3 });
        await next({ opacity: 0 });
      }
    },
    config: { duration: DURATIONS.fast },
    onRest: () => {
      if (isActive) {
        onComplete?.();
      }
    },
  });

  if (!isActive) {
    return null;
  }

  return (
    <>
      {/* Multi-layer flash effect */}
      <animated.div
        className={`fixed inset-0 pointer-events-none ${className}`}
        style={{
          background: `radial-gradient(circle at center, ${ANIMATION_COLORS.gold}, ${ANIMATION_COLORS.red}, transparent)`,
          opacity: spring.opacity,
          zIndex: ANIMATION_Z_INDEX.screenEffect,
          mixBlendMode: 'screen',
        }}
      />
      {/* Center burst */}
      <animated.div
        className="fixed pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: '200vmax',
          height: '200vmax',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${ANIMATION_COLORS.white} 0%, transparent 70%)`,
          opacity: spring.opacity.to((o) => o * 0.5),
          zIndex: ANIMATION_Z_INDEX.screenEffect + 1,
        }}
      />
    </>
  );
};

/**
 * VignetteFlash component
 * Flash with vignette effect (edges darker than center)
 */
export interface VignetteFlashProps {
  /** Color of the vignette */
  color?: string;
  /** Whether active */
  isActive?: boolean;
  /** Callback on complete */
  onComplete?: () => void;
  /** Additional CSS class */
  className?: string;
}

export const VignetteFlash: React.FC<VignetteFlashProps> = ({
  color = ANIMATION_COLORS.gold,
  isActive = false,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const spring = useSpring({
    from: { opacity: 0 },
    to: async (next) => {
      if (isActive && !reducedMotion) {
        await next({ opacity: 0.6 });
        await next({ opacity: 0 });
      } else if (isActive && reducedMotion) {
        await next({ opacity: 0.2 });
        await next({ opacity: 0 });
      }
    },
    config: { duration: DURATIONS.normal },
    onRest: () => {
      if (isActive) {
        onComplete?.();
      }
    },
  });

  if (!isActive) {
    return null;
  }

  return (
    <animated.div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{
        background: `radial-gradient(ellipse at center, transparent 30%, ${color} 100%)`,
        opacity: spring.opacity,
        zIndex: ANIMATION_Z_INDEX.screenEffect,
      }}
    />
  );
};

/**
 * Hook for triggering screen flashes
 */
export function useScreenFlash() {
  const [flashes, setFlashes] = useState<
    Array<ScreenFlashProps & { id: string }>
  >([]);

  const flash = useCallback(
    (props: Omit<ScreenFlashProps, 'isActive' | 'onComplete'>) => {
      const id = `flash-${Date.now()}-${Math.random()}`;
      setFlashes((prev) => [...prev, { ...props, id, isActive: true }]);
    },
    []
  );

  const handleComplete = useCallback((id: string) => {
    setFlashes((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Preset flash triggers
  const flashYakuman = useCallback(() => {
    flash({ variant: 'yakuman', duration: DURATIONS.normal });
  }, [flash]);

  const flashWin = useCallback(() => {
    flash({ variant: 'win' });
  }, [flash]);

  const flashRound = useCallback(() => {
    flash({ variant: 'round' });
  }, [flash]);

  const FlashContainer: React.FC = () => (
    <>
      {flashes.map((flashProps) => (
        <ScreenFlash
          key={flashProps.id}
          {...flashProps}
          onComplete={() => handleComplete(flashProps.id)}
        />
      ))}
    </>
  );

  return {
    flash,
    flashYakuman,
    flashWin,
    flashRound,
    FlashContainer,
    activeCount: flashes.length,
  };
}

/**
 * GameOverOverlay component
 * Full game over screen with fade to black
 */
export interface GameOverOverlayProps {
  /** Whether visible */
  isVisible?: boolean;
  /** Final score to display */
  finalScore?: number;
  /** Callback when animation settles */
  onReady?: () => void;
  /** Additional CSS class */
  className?: string;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  isVisible = false,
  finalScore,
  onReady,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const overlaySpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: isVisible ? 1 : 0 },
    config: { duration: reducedMotion ? 0 : DURATIONS.dramatic },
    onRest: () => {
      if (isVisible) {
        onReady?.();
      }
    },
  });

  const textSpring = useSpring({
    from: { opacity: 0, y: 30 },
    to: {
      opacity: isVisible ? 1 : 0,
      y: isVisible ? 0 : 30,
    },
    delay: isVisible && !reducedMotion ? DURATIONS.normal : 0,
    config: { duration: reducedMotion ? 0 : DURATIONS.slow },
  });

  if (!isVisible) {
    return null;
  }

  return (
    <animated.div
      className={`fixed inset-0 flex flex-col items-center justify-center ${className}`}
      style={{
        backgroundColor: '#000000',
        opacity: overlaySpring.opacity,
        zIndex: ANIMATION_Z_INDEX.screenEffect,
      }}
    >
      <animated.div
        className="text-center"
        style={{
          opacity: textSpring.opacity,
          transform: textSpring.y.to((y) => `translateY(${y}px)`),
        }}
      >
        <h1
          className="text-5xl font-bold mb-8"
          style={{
            color: ANIMATION_COLORS.red,
            textShadow: `0 0 30px ${ANIMATION_COLORS.red}`,
            fontFamily: "'Noto Sans JP', serif",
          }}
        >
          Game Over
        </h1>
        {finalScore !== undefined && (
          <div
            className="text-3xl"
            style={{ color: ANIMATION_COLORS.gold }}
          >
            Final Score: {finalScore.toLocaleString()}
          </div>
        )}
      </animated.div>
    </animated.div>
  );
};

export default ScreenFlash;
