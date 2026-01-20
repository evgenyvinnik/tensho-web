/**
 * ParticleEffect Component for Tensho Mahjong Roguelike
 *
 * Renders particle effects for various game events:
 * - Gold coins for earning gold
 * - Flower petals for flower collection
 * - Sparkles for yaku completion
 * - Confetti for round wins
 * - Stars for yakuman
 *
 * Enhanced with:
 * - Gravity simulation
 * - Configurable burst patterns
 * - Integration with VFX system
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useTrail, useSpring, animated } from '@react-spring/web';
import { useSettingsStore } from '../../stores/settingsStore';
import { DURATIONS, ANIMATION_COLORS, ANIMATION_Z_INDEX } from '../../animations/constants';
import { vfxSystem } from '../../systems/VFXSystem';

// =============================================================================
// TYPES
// =============================================================================

export type ParticleType = 'gold' | 'flower' | 'sparkle' | 'confetti' | 'star';

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
  /** Custom colors array (for confetti) */
  colors?: string[];
  /** Whether the effect is active */
  isActive?: boolean;
  /** Gravity factor (0 = no gravity, 1 = normal) */
  gravity?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  rotation: number;
  rotationSpeed: number;
  size: number;
  delay: number;
  color: string;
  shape: 'circle' | 'square' | 'diamond' | 'petal' | 'star';
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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
    case 'star':
      return ANIMATION_COLORS.gold;
  }
}

/**
 * Get default colors for particle type
 */
function getDefaultColors(type: ParticleType): string[] {
  switch (type) {
    case 'confetti':
      return [
        ANIMATION_COLORS.gold,
        ANIMATION_COLORS.orange,
        ANIMATION_COLORS.red,
        ANIMATION_COLORS.purple,
        ANIMATION_COLORS.blue,
        ANIMATION_COLORS.green,
      ];
    case 'star':
      return [ANIMATION_COLORS.gold, ANIMATION_COLORS.white, ANIMATION_COLORS.orange];
    default:
      return [getDefaultColor(type)];
  }
}

/**
 * Get particle shape for type
 */
function getParticleShape(type: ParticleType): Particle['shape'] {
  switch (type) {
    case 'gold':
      return 'circle';
    case 'flower':
      return 'petal';
    case 'sparkle':
      return 'diamond';
    case 'confetti':
      return Math.random() > 0.5 ? 'square' : 'diamond';
    case 'star':
      return 'star';
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
  customColors?: string[]
): Particle[] {
  const colors = customColors || getDefaultColors(type);

  return Array.from({ length: count }, (_, i) => {
    // Random angle for burst direction
    const angle = (Math.random() * Math.PI * 2);
    const speed = 2 + Math.random() * 4;

    return {
      id: i,
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed * (spread / 50),
      vy: Math.sin(angle) * speed * (spread / 50) - 2, // Initial upward bias
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      size: type === 'sparkle' ? 4 + Math.random() * 4 : 8 + Math.random() * 8,
      delay: i * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: getParticleShape(type),
    };
  });
}

// =============================================================================
// PARTICLE SHAPE COMPONENTS
// =============================================================================

const ParticleShape: React.FC<{
  shape: Particle['shape'];
  color: string;
  size: number;
}> = ({ shape, color, size }) => {
  switch (shape) {
    case 'circle':
      return (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${color}, ${adjustColor(color, -30)})`,
            boxShadow: `0 0 ${size / 2}px ${color}`,
          }}
        />
      );
    case 'square':
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
    case 'diamond':
      return (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            transform: 'rotate(45deg)',
            boxShadow: `0 0 ${size / 2}px ${color}`,
          }}
        />
      );
    case 'petal':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path
            d="M10 0 C12 4, 16 4, 20 10 C16 16, 12 16, 10 20 C8 16, 4 16, 0 10 C4 4, 8 4, 10 0"
            fill={color}
            opacity={0.8}
          />
        </svg>
      );
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path
            d="M10 0 L11.5 7 L20 7.5 L13 12 L15 20 L10 15 L5 20 L7 12 L0 7.5 L8.5 7 Z"
            fill={color}
            style={{ filter: `drop-shadow(0 0 ${size / 4}px ${color})` }}
          />
        </svg>
      );
  }
};

/**
 * Adjust color brightness
 */
function adjustColor(color: string, amount: number): string {
  // Simple hex color adjustment
  if (color.startsWith('#') && color.length === 7) {
    const r = Math.max(0, Math.min(255, parseInt(color.slice(1, 3), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(color.slice(3, 5), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(color.slice(5, 7), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return color;
}

// =============================================================================
// PARTICLE EFFECT COMPONENT
// =============================================================================

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  type,
  count = 20,
  duration = DURATIONS.dramatic,
  spread = 100,
  origin = { x: 50, y: 50 },
  color,
  colors,
  isActive = true,
  gravity = 0.5,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  // Generate particles
  const particles = useMemo(
    () => generateParticles(count, spread, origin, type, colors || (color ? [color] : undefined)),
    [count, spread, origin.x, origin.y, type, color, colors]
  );

  // Create trail animation for all particles
  const trail = useTrail(particles.length, {
    from: {
      opacity: 1,
      progress: 0,
    },
    to: isActive
      ? {
          opacity: 0,
          progress: 1,
        }
      : {
          opacity: 0,
          progress: 0,
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

  // Don't render if reduced motion or not active
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
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: style.opacity,
              transform: style.progress.to((p) => {
                // Calculate position with physics
                const time = p * (duration / 1000);
                const x = particle.vx * time * 50;
                const y = particle.vy * time * 50 + 0.5 * gravity * 100 * time * time;
                const rotation = particle.rotation + particle.rotationSpeed * time * 100;
                const scale = 1 - p * 0.5;
                return `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
              }),
            }}
          >
            <ParticleShape
              shape={particle.shape}
              color={particle.color}
              size={particle.size}
            />
          </animated.div>
        );
      })}
    </div>
  );
};

// =============================================================================
// CONFETTI BURST COMPONENT
// =============================================================================

export interface ConfettiBurstProps {
  /** Number of confetti pieces */
  count?: number;
  /** Origin position (percentage) */
  origin?: { x: number; y: number };
  /** Duration in ms */
  duration?: number;
  /** Whether active */
  isActive?: boolean;
  /** Colors to use */
  colors?: string[];
  /** Callback on complete */
  onComplete?: () => void;
  /** Additional CSS class */
  className?: string;
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
  count = 50,
  origin = { x: 50, y: 50 },
  duration = DURATIONS.extended,
  isActive = true,
  colors,
  onComplete,
  className = '',
}) => {
  return (
    <ParticleEffect
      type="confetti"
      count={count}
      origin={origin}
      duration={duration}
      spread={200}
      gravity={0.8}
      colors={colors}
      isActive={isActive}
      onComplete={onComplete}
      className={className}
    />
  );
};

// =============================================================================
// STAR BURST COMPONENT
// =============================================================================

export interface StarBurstProps {
  /** Number of stars */
  count?: number;
  /** Origin position (percentage) */
  origin?: { x: number; y: number };
  /** Duration in ms */
  duration?: number;
  /** Whether active */
  isActive?: boolean;
  /** Callback on complete */
  onComplete?: () => void;
  /** Additional CSS class */
  className?: string;
}

export const StarBurst: React.FC<StarBurstProps> = ({
  count = 30,
  origin = { x: 50, y: 50 },
  duration = DURATIONS.extended,
  isActive = true,
  onComplete,
  className = '',
}) => {
  return (
    <ParticleEffect
      type="star"
      count={count}
      origin={origin}
      duration={duration}
      spread={150}
      gravity={0.3}
      isActive={isActive}
      onComplete={onComplete}
      className={className}
    />
  );
};

// =============================================================================
// SPARKLE TRAIL COMPONENT
// =============================================================================

export interface SparkleTrailProps {
  /** Path to follow (array of {x, y} percentages) */
  path?: Array<{ x: number; y: number }>;
  /** Duration in ms */
  duration?: number;
  /** Color */
  color?: string;
  /** Whether active */
  isActive?: boolean;
  /** Callback on complete */
  onComplete?: () => void;
  /** Additional CSS class */
  className?: string;
}

export const SparkleTrail: React.FC<SparkleTrailProps> = ({
  path = [
    { x: 20, y: 80 },
    { x: 50, y: 50 },
    { x: 80, y: 80 },
  ],
  duration = DURATIONS.slow,
  color = ANIMATION_COLORS.gold,
  isActive = true,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [currentIndex, setCurrentIndex] = useState(0);

  const spring = useSpring({
    from: { x: path[0]?.x ?? 50, y: path[0]?.y ?? 50, opacity: 1 },
    to: path[currentIndex] ?? path[0],
    config: { duration: duration / path.length },
    onRest: () => {
      if (currentIndex < path.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onComplete?.();
      }
    },
    immediate: reducedMotion,
  });

  if (!isActive || reducedMotion) return null;

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
      <animated.div
        style={{
          position: 'absolute',
          left: spring.x.to((x) => `${x}%`),
          top: spring.y.to((y) => `${y}%`),
          transform: 'translate(-50%, -50%)',
        }}
      >
        <svg width={16} height={16} viewBox="0 0 20 20">
          <path
            d="M10 0 L11 8 L20 10 L11 12 L10 20 L9 12 L0 10 L9 8 Z"
            fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
      </animated.div>
    </div>
  );
};

// =============================================================================
// GOLD RAIN COMPONENT
// =============================================================================

export interface GoldRainProps {
  /** Number of coins */
  count?: number;
  /** Duration in ms */
  duration?: number;
  /** Whether active */
  isActive?: boolean;
  /** Callback on complete */
  onComplete?: () => void;
  /** Additional CSS class */
  className?: string;
}

export const GoldRain: React.FC<GoldRainProps> = ({
  count = 20,
  duration = DURATIONS.dramatic,
  isActive = true,
  onComplete,
  className = '',
}) => {
  return (
    <ParticleEffect
      type="gold"
      count={count}
      origin={{ x: 50, y: 0 }}
      duration={duration}
      spread={300}
      gravity={1.2}
      isActive={isActive}
      onComplete={onComplete}
      className={className}
    />
  );
};

// =============================================================================
// HOOK FOR PARTICLE EFFECTS
// =============================================================================

export function useParticleEffect() {
  const [effects, setEffects] = useState<Array<ParticleEffectProps & { id: string }>>([]);

  // Subscribe to VFX system
  useEffect(() => {
    const unsubscribe = vfxSystem.onParticles((config) => {
      emit({
        type: config.type,
        count: config.count,
        origin: config.origin,
        spread: config.spread,
        colors: config.colors,
        duration: config.duration,
        gravity: config.gravity,
      });
    });
    return unsubscribe;
  }, []);

  const emit = useCallback((props: Omit<ParticleEffectProps, 'onComplete'>) => {
    const id = `particle-${Date.now()}-${Math.random()}`;
    setEffects((prev) => [...prev, { ...props, id, isActive: true }]);
  }, []);

  const handleComplete = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const ParticleContainer: React.FC = useCallback(
    () => (
      <>
        {effects.map((effect) => (
          <ParticleEffect
            key={effect.id}
            {...effect}
            onComplete={() => handleComplete(effect.id)}
          />
        ))}
      </>
    ),
    [effects, handleComplete]
  );

  // Preset emitters
  const emitConfetti = useCallback(
    (origin?: { x: number; y: number }) => {
      emit({
        type: 'confetti',
        count: 50,
        origin: origin ?? { x: 50, y: 50 },
        spread: 200,
        gravity: 0.8,
        duration: DURATIONS.extended,
      });
    },
    [emit]
  );

  const emitStars = useCallback(
    (origin?: { x: number; y: number }) => {
      emit({
        type: 'star',
        count: 30,
        origin: origin ?? { x: 50, y: 50 },
        spread: 150,
        gravity: 0.3,
        duration: DURATIONS.extended,
      });
    },
    [emit]
  );

  const emitGold = useCallback(
    (origin?: { x: number; y: number }) => {
      emit({
        type: 'gold',
        count: 20,
        origin: origin ?? { x: 50, y: 30 },
        spread: 100,
        gravity: 0.8,
        duration: DURATIONS.dramatic,
      });
    },
    [emit]
  );

  const emitFlowers = useCallback(
    (origin?: { x: number; y: number }) => {
      emit({
        type: 'flower',
        count: 15,
        origin: origin ?? { x: 50, y: 50 },
        spread: 80,
        gravity: 0.3,
        duration: DURATIONS.slow,
      });
    },
    [emit]
  );

  const emitSparkles = useCallback(
    (origin?: { x: number; y: number }) => {
      emit({
        type: 'sparkle',
        count: 25,
        origin: origin ?? { x: 50, y: 50 },
        spread: 120,
        gravity: 0.4,
        duration: DURATIONS.normal,
      });
    },
    [emit]
  );

  return {
    emit,
    emitConfetti,
    emitStars,
    emitGold,
    emitFlowers,
    emitSparkles,
    ParticleContainer,
    activeCount: effects.length,
  };
}

export default ParticleEffect;
