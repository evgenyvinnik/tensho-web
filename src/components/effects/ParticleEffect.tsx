/**
 * ParticleEffect Component for Tensho Mahjong Roguelike
 *
 * Renders particle effects for various game events:
 * - Gold coins for earning gold
 * - Flower petals for flower collection
 * - Sparkles for yaku completion
 */

import React, { useMemo, useCallback } from 'react';
import { useTrail, animated, config } from '@react-spring/web';
import { useSettingsStore } from '../../stores/settingsStore';
import { DURATIONS, ANIMATION_COLORS, ANIMATION_Z_INDEX } from '../../animations/constants';

export type ParticleType = 'gold' | 'flower' | 'sparkle' | 'confetti';

export interface ParticleEffectProps {
  /** Type of particle effect */
  type: ParticleType;
  /** Number of particles to emit */
  count?: number;
  /** Duration of the effect in milliseconds */
  duration?: number;
  /** Spread radius in pixels */
  spread?: number;
  /** Origin position (x, y) relative to container */
  origin?: { x: number; y: number };
  /** Custom color (overrides type default) */
  color?: string;
  /** Whether the effect is active */
  isActive?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  size: number;
  delay: number;
  color: string;
}

/**
 * Get default color for particle type
 */
function getDefaultColor(type: ParticleType): string {
  switch (type) {
    case 'gold':
      return ANIMATION_COLORS.gold;
    case 'flower':
      return '#FFB7C5'; // Sakura pink
    case 'sparkle':
      return ANIMATION_COLORS.white;
    case 'confetti':
      return ANIMATION_COLORS.orange;
  }
}

/**
 * Generate particle data
 */
function generateParticles(
  count: number,
  spread: number,
  origin: { x: number; y: number },
  type: ParticleType,
  customColor?: string
): Particle[] {
  const colors = type === 'confetti'
    ? [ANIMATION_COLORS.gold, ANIMATION_COLORS.orange, ANIMATION_COLORS.red, ANIMATION_COLORS.purple, ANIMATION_COLORS.blue]
    : [customColor || getDefaultColor(type)];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: origin.x + (Math.random() - 0.5) * spread * 2,
    y: origin.y + (Math.random() - 0.5) * spread * 2,
    rotation: Math.random() * 360,
    size: type === 'sparkle' ? 4 + Math.random() * 4 : 8 + Math.random() * 8,
    delay: i * 30,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

/**
 * Render individual particle based on type
 */
const ParticleShape: React.FC<{
  type: ParticleType;
  color: string;
  size: number;
}> = ({ type, color, size }) => {
  switch (type) {
    case 'gold':
      return (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${color}, #B8860B)`,
            boxShadow: `0 0 ${size / 2}px ${color}`,
          }}
        />
      );
    case 'flower':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path
            d="M10 0 C12 4, 16 4, 20 10 C16 16, 12 16, 10 20 C8 16, 4 16, 0 10 C4 4, 8 4, 10 0"
            fill={color}
            opacity={0.8}
          />
        </svg>
      );
    case 'sparkle':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path
            d="M10 0 L11 8 L20 10 L11 12 L10 20 L9 12 L0 10 L9 8 Z"
            fill={color}
          />
        </svg>
      );
    case 'confetti':
      return (
        <div
          style={{
            width: size,
            height: size / 2,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      );
  }
};

/**
 * ParticleEffect component
 */
export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  type,
  count = 20,
  duration = DURATIONS.dramatic,
  spread = 100,
  origin = { x: 50, y: 50 },
  color,
  isActive = true,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  // Generate particles
  const particles = useMemo(
    () => generateParticles(count, spread, origin, type, color),
    [count, spread, origin.x, origin.y, type, color]
  );

  // Create trail animation for all particles
  const trail = useTrail(particles.length, {
    from: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    to: isActive
      ? {
          opacity: 0,
          y: -100 - Math.random() * 50,
          scale: 0.5,
        }
      : {
          opacity: 0,
          y: 0,
          scale: 1,
        },
    config: {
      tension: 120,
      friction: 14,
      duration: reducedMotion ? 0 : duration,
    },
    immediate: reducedMotion,
    onRest: (_, __, index) => {
      if (index === particles.length - 1) {
        onComplete?.();
      }
    },
  });

  // Don't render if reduced motion
  if (reducedMotion || !isActive) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: ANIMATION_Z_INDEX.effects,
      }}
    >
      {trail.map((style, index) => {
        const particle = particles[index];
        return (
          <animated.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: particle.x,
              top: particle.y,
              opacity: style.opacity,
              transform: style.y.to(
                (y) =>
                  `translateY(${y}px) rotate(${particle.rotation}deg) scale(${style.scale.get()})`
              ),
            }}
          >
            <ParticleShape
              type={type}
              color={particle.color}
              size={particle.size}
            />
          </animated.div>
        );
      })}
    </div>
  );
};

/**
 * Hook for triggering particle effects
 */
export function useParticleEffect() {
  const [effects, setEffects] = React.useState<
    Array<ParticleEffectProps & { id: string }>
  >([]);

  const emit = useCallback(
    (props: Omit<ParticleEffectProps, 'onComplete'>) => {
      const id = `particle-${Date.now()}-${Math.random()}`;
      setEffects((prev) => [...prev, { ...props, id, isActive: true }]);
    },
    []
  );

  const handleComplete = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const ParticleContainer: React.FC = () => (
    <>
      {effects.map((effect) => (
        <ParticleEffect
          key={effect.id}
          {...effect}
          onComplete={() => handleComplete(effect.id)}
        />
      ))}
    </>
  );

  return {
    emit,
    ParticleContainer,
    activeCount: effects.length,
  };
}

export default ParticleEffect;
