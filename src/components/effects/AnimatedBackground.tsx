import React, { useMemo } from 'react';
import { useSpring, animated } from '@react-spring/web';

/**
 * Subtle Animated Background Component
 *
 * Creates gentle, non-distracting animated swirls and waves
 * that add visual interest without overwhelming the game.
 */

interface AnimatedBackgroundProps {
  /** Background image URL (optional) */
  backgroundImage?: string;
  /** Whether to show the subtle animated overlay */
  showAnimation?: boolean;
  /** Animation intensity: 'minimal' | 'subtle' | 'gentle' */
  intensity?: 'minimal' | 'subtle' | 'gentle';
  /** Additional className */
  className?: string;
  /** Children to render on top */
  children?: React.ReactNode;
}

export function AnimatedBackground({
  backgroundImage,
  showAnimation = true,
  intensity = 'subtle',
  className = '',
  children,
}: AnimatedBackgroundProps) {
  // Very slow, gentle movement for the gradient overlay
  const gradientSpring = useSpring({
    from: { x: 0, y: 0 },
    to: async (next) => {
      while (true) {
        await next({ x: 10, y: -5 });
        await next({ x: -5, y: 10 });
        await next({ x: -10, y: -5 });
        await next({ x: 5, y: 5 });
        await next({ x: 0, y: 0 });
      }
    },
    config: { duration: 20000 },
    pause: !showAnimation,
  });

  // Intensity-based opacity values
  const overlayOpacity = useMemo(() => {
    switch (intensity) {
      case 'minimal':
        return 0.03;
      case 'subtle':
        return 0.06;
      case 'gentle':
        return 0.1;
      default:
        return 0.06;
    }
  }, [intensity]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle gradient overlay with very slow drift */}
      {showAnimation && (
        <animated.div
          className="pointer-events-none absolute inset-0"
          style={{
            transform: gradientSpring.x.to(
              (x) => `translate(${x}px, ${gradientSpring.y.get()}px)`
            ),
            background: `
              radial-gradient(
                ellipse 80% 60% at 30% 20%,
                rgba(45, 95, 74, ${overlayOpacity}) 0%,
                transparent 60%
              ),
              radial-gradient(
                ellipse 60% 80% at 70% 80%,
                rgba(200, 178, 115, ${overlayOpacity * 0.7}) 0%,
                transparent 50%
              )
            `,
            zIndex: 1,
          }}
        />
      )}

      {/* Very subtle vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 50%,
            rgba(28, 58, 46, 0.25) 100%
          )`,
          zIndex: 2,
        }}
      />

      {/* Content */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Subtle Wave Background
 *
 * Creates a gentle wave pattern overlay
 */
interface WaveBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function WaveBackground({ className = '', children }: WaveBackgroundProps) {
  const waveSpring = useSpring({
    from: { y: 0 },
    to: async (next) => {
      while (true) {
        await next({ y: -2 });
        await next({ y: 2 });
        await next({ y: 0 });
      }
    },
    config: { duration: 4000 },
  });

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Subtle wave overlay */}
      <animated.div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: waveSpring.y.to((y) => `translateY(${y}px) scaleY(${1 + y * 0.002})`),
          background: `linear-gradient(
            180deg,
            transparent 0%,
            rgba(45, 95, 74, 0.04) 30%,
            rgba(45, 95, 74, 0.06) 50%,
            rgba(45, 95, 74, 0.04) 70%,
            transparent 100%
          )`,
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Floating Particles Background
 *
 * Very subtle floating particles for ambient effect
 */
interface FloatingParticlesProps {
  /** Number of particles (keep low for subtlety) */
  count?: number;
  /** Particle color */
  color?: string;
  className?: string;
  children?: React.ReactNode;
}

export function FloatingParticles({
  count = 5,
  color = 'rgba(200, 178, 115, 0.15)',
  className = '',
  children,
}: FloatingParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${10 + (i * 80) / count}%`,
      size: 3 + Math.random() * 4,
      delay: i * 3000,
      duration: 15000 + Math.random() * 10000,
    }));
  }, [count]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="pointer-events-none absolute animate-float-subtle"
          style={{
            left: particle.left,
            bottom: '-20px',
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            backgroundColor: color,
            opacity: 0.4,
            animation: `float-particle ${particle.duration}ms ease-in-out infinite`,
            animationDelay: `${particle.delay}ms`,
            zIndex: 1,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          50% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0.3;
          }
          90% {
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
}

export default AnimatedBackground;
