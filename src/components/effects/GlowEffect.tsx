/**
 * GlowEffect Component for Tensho Mahjong Roguelike
 *
 * Renders pulsing glow overlays for important elements:
 * - Gold glow for score displays
 * - Orange glow for actions
 * - Red glow for warnings
 */

import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useSettingsStore } from '../../stores/settingsStore';
import { SPRINGS, DURATIONS, ANIMATION_COLORS } from '../../animations/constants';

export type GlowVariant = 'gold' | 'orange' | 'red' | 'green' | 'purple' | 'blue' | 'white';

export interface GlowEffectProps {
  /** Color variant of the glow */
  variant?: GlowVariant;
  /** Custom color (overrides variant) */
  color?: string;
  /** Intensity of the glow (0-1) */
  intensity?: number;
  /** Whether the glow is pulsing */
  pulsing?: boolean;
  /** Pulse speed in milliseconds */
  pulseSpeed?: number;
  /** Size of the glow in pixels */
  size?: number;
  /** Blur amount in pixels */
  blur?: number;
  /** Whether the glow is active */
  isActive?: boolean;
  /** Children to wrap with glow */
  children?: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** Style for the container */
  style?: React.CSSProperties;
}

/**
 * Get color value from variant
 */
function getGlowColor(variant: GlowVariant): string {
  switch (variant) {
    case 'gold':
      return ANIMATION_COLORS.gold;
    case 'orange':
      return ANIMATION_COLORS.orange;
    case 'red':
      return ANIMATION_COLORS.red;
    case 'green':
      return ANIMATION_COLORS.green;
    case 'purple':
      return ANIMATION_COLORS.purple;
    case 'blue':
      return ANIMATION_COLORS.blue;
    case 'white':
      return ANIMATION_COLORS.white;
  }
}

/**
 * GlowEffect component
 * Wraps children with an animated glow effect
 */
export const GlowEffect: React.FC<GlowEffectProps> = ({
  variant = 'gold',
  color,
  intensity = 0.6,
  pulsing = true,
  pulseSpeed = DURATIONS.slow,
  size = 20,
  blur = 15,
  isActive = true,
  children,
  className = '',
  style,
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const glowColor = color || getGlowColor(variant);

  const spring = useSpring({
    loop: pulsing && isActive && !reducedMotion,
    from: { glowIntensity: intensity * 0.6 },
    to: isActive
      ? [
          { glowIntensity: intensity },
          { glowIntensity: intensity * 0.6 },
        ]
      : { glowIntensity: 0 },
    config: {
      duration: pulseSpeed,
    },
    immediate: reducedMotion,
  });

  if (!isActive && reducedMotion) {
    return <div className={className} style={style}>{children}</div>;
  }

  return (
    <animated.div
      className={`relative inline-block ${className}`}
      style={{
        ...style,
        filter: spring.glowIntensity.to(
          (i) => `drop-shadow(0 0 ${blur * i}px ${glowColor})`
        ),
      }}
    >
      {children}
      {/* Additional glow layer for stronger effect */}
      <animated.div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: spring.glowIntensity.to(
            (i) => `0 0 ${size * i}px ${size * 0.5 * i}px ${glowColor}`
          ),
          borderRadius: 'inherit',
          opacity: spring.glowIntensity.to((i) => i * 0.5),
        }}
      />
    </animated.div>
  );
};

/**
 * GlowOverlay component
 * Standalone glow overlay that can be positioned absolutely
 */
export interface GlowOverlayProps {
  /** Color variant of the glow */
  variant?: GlowVariant;
  /** Custom color (overrides variant) */
  color?: string;
  /** Intensity of the glow (0-1) */
  intensity?: number;
  /** Whether the glow is pulsing */
  pulsing?: boolean;
  /** Pulse speed in milliseconds */
  pulseSpeed?: number;
  /** Whether the glow is active */
  isActive?: boolean;
  /** Additional CSS class name */
  className?: string;
}

export const GlowOverlay: React.FC<GlowOverlayProps> = ({
  variant = 'gold',
  color,
  intensity = 0.4,
  pulsing = true,
  pulseSpeed = DURATIONS.slow,
  isActive = true,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const glowColor = color || getGlowColor(variant);

  const spring = useSpring({
    loop: pulsing && isActive && !reducedMotion,
    from: { opacity: intensity * 0.5 },
    to: isActive
      ? [
          { opacity: intensity },
          { opacity: intensity * 0.5 },
        ]
      : { opacity: 0 },
    config: {
      duration: pulseSpeed,
    },
    immediate: reducedMotion,
  });

  if (!isActive) {
    return null;
  }

  return (
    <animated.div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)`,
        opacity: spring.opacity,
        mixBlendMode: 'screen',
      }}
    />
  );
};

/**
 * BorderGlow component
 * Adds animated glow border effect
 */
export interface BorderGlowProps {
  /** Color variant of the glow */
  variant?: GlowVariant;
  /** Custom color (overrides variant) */
  color?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Whether the glow is pulsing */
  pulsing?: boolean;
  /** Whether the glow is active */
  isActive?: boolean;
  /** Children to wrap */
  children?: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
}

export const BorderGlow: React.FC<BorderGlowProps> = ({
  variant = 'gold',
  color,
  borderWidth = 2,
  pulsing = true,
  isActive = true,
  children,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const glowColor = color || getGlowColor(variant);

  const spring = useSpring({
    loop: pulsing && isActive && !reducedMotion,
    from: { glowSize: 4 },
    to: isActive
      ? [
          { glowSize: 8 },
          { glowSize: 4 },
        ]
      : { glowSize: 0 },
    config: SPRINGS.gentle,
    immediate: reducedMotion,
  });

  return (
    <animated.div
      className={`relative ${className}`}
      style={{
        border: isActive ? `${borderWidth}px solid ${glowColor}` : 'none',
        boxShadow: spring.glowSize.to(
          (s) =>
            isActive
              ? `0 0 ${s}px ${s / 2}px ${glowColor}, inset 0 0 ${s / 2}px ${glowColor}`
              : 'none'
        ),
      }}
    >
      {children}
    </animated.div>
  );
};

/**
 * Hook for programmatic glow control
 */
export function useGlowEffect(initialActive: boolean = false) {
  const [isActive, setIsActive] = React.useState(initialActive);
  const [intensity, setIntensity] = React.useState(0.6);

  const activate = React.useCallback((newIntensity?: number) => {
    if (newIntensity !== undefined) {
      setIntensity(newIntensity);
    }
    setIsActive(true);
  }, []);

  const deactivate = React.useCallback(() => {
    setIsActive(false);
  }, []);

  const toggle = React.useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  return {
    isActive,
    intensity,
    activate,
    deactivate,
    toggle,
    setIntensity,
  };
}

export default GlowEffect;
