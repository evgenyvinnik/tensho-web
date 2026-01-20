/**
 * ScorePopup Component for Tensho Mahjong Roguelike
 *
 * Animated score popup that floats up and fades out.
 * Shows points earned with multipliers applied.
 */

import React, { useEffect, useState } from 'react';
import { useSpring, useTrail, animated } from '@react-spring/web';
import { useSettingsStore } from '../../stores/settingsStore';
import { SPRINGS, DURATIONS, ANIMATION_COLORS, ANIMATION_Z_INDEX } from '../../animations/constants';
import { colors } from '../../styles/theme';

export interface ScorePopupProps {
  /** Points to display */
  points: number;
  /** Multiplier applied (optional) */
  multiplier?: number;
  /** Position relative to parent (percentage) */
  position?: { x: number; y: number };
  /** Duration before fade out in milliseconds */
  displayDuration?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Color variant */
  variant?: 'default' | 'bonus' | 'critical';
  /** Additional CSS class name */
  className?: string;
}

/**
 * ScorePopup component
 * Shows animated score popup that floats and fades
 */
export const ScorePopup: React.FC<ScorePopupProps> = ({
  points,
  multiplier,
  position = { x: 50, y: 50 },
  displayDuration = DURATIONS.slow,
  onComplete,
  variant = 'default',
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [isVisible, setIsVisible] = useState(true);

  // Get color based on variant
  const getColor = () => {
    switch (variant) {
      case 'bonus':
        return ANIMATION_COLORS.gold;
      case 'critical':
        return ANIMATION_COLORS.orange;
      default:
        return colors.beigeWhite;
    }
  };

  // Main animation spring
  const spring = useSpring({
    from: {
      opacity: 1,
      y: 0,
      scale: 0.5,
    },
    to: async (next) => {
      // Initial pop-in
      await next({ scale: 1.2, y: -10 });
      await next({ scale: 1, y: -20 });
      // Wait for display duration
      await new Promise((resolve) => setTimeout(resolve, displayDuration));
      // Fade out
      await next({ opacity: 0, y: -60, scale: 0.8 });
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
    onRest: () => {
      setIsVisible(false);
      onComplete?.();
    },
  });

  if (!isVisible) {
    return null;
  }

  const displayText = multiplier && multiplier > 1
    ? `+${points} x${multiplier.toFixed(1)}`
    : `+${points}`;

  return (
    <animated.div
      className={`absolute pointer-events-none font-bold text-2xl ${className}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: spring.y.to(
          (y) => `translate(-50%, ${y}px) scale(${spring.scale.get()})`
        ),
        opacity: spring.opacity,
        color: getColor(),
        textShadow: `0 0 10px ${getColor()}, 0 2px 4px rgba(0,0,0,0.5)`,
        zIndex: ANIMATION_Z_INDEX.effects,
        fontFamily: "'Noto Sans JP', sans-serif",
      }}
    >
      {displayText}
    </animated.div>
  );
};

/**
 * StackingScorePopup component
 * Shows multiple score popups stacked for yaku combos
 */
export interface StackingScorePopupProps {
  /** Array of score items to display */
  items: Array<{
    label: string;
    points: number;
    multiplier?: number;
  }>;
  /** Position relative to parent */
  position?: { x: number; y: number };
  /** Stagger delay between items */
  staggerDelay?: number;
  /** Callback when all animations complete */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

export const StackingScorePopup: React.FC<StackingScorePopupProps> = ({
  items,
  position = { x: 50, y: 50 },
  staggerDelay = 200,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [completedCount, setCompletedCount] = useState(0);

  // Trail animation for staggered entry
  const trail = useTrail(items.length, {
    from: {
      opacity: 0,
      y: 20,
      scale: 0.5,
    },
    to: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
    delay: (index: number) => index * staggerDelay,
  });

  // Handle individual item completion
  const handleItemComplete = () => {
    setCompletedCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= items.length) {
        onComplete?.();
      }
      return newCount;
    });
  };

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: ANIMATION_Z_INDEX.effects,
      }}
    >
      {trail.map((style, index) => {
        const item = items[index];
        return (
          <animated.div
            key={index}
            className="text-center mb-2"
            style={{
              opacity: style.opacity,
              transform: style.y.to(
                (y) => `translateY(${y}px) scale(${style.scale.get()})`
              ),
            }}
          >
            <div
              className="text-sm font-medium"
              style={{ color: colors.beigeWhite, opacity: 0.8 }}
            >
              {item.label}
            </div>
            <div
              className="text-xl font-bold"
              style={{
                color: ANIMATION_COLORS.gold,
                textShadow: `0 0 8px ${ANIMATION_COLORS.gold}`,
              }}
            >
              +{item.points}
              {item.multiplier && item.multiplier > 1 && (
                <span className="text-sm ml-1" style={{ color: ANIMATION_COLORS.orange }}>
                  x{item.multiplier.toFixed(1)}
                </span>
              )}
            </div>
          </animated.div>
        );
      })}
    </div>
  );
};

/**
 * TotalScoreReveal component
 * Dramatic reveal for final score with breakdown
 */
export interface TotalScoreRevealProps {
  /** Base points before multipliers */
  basePoints: number;
  /** Total multiplier */
  totalMultiplier: number;
  /** Final calculated score */
  finalScore: number;
  /** Whether to show the reveal */
  isVisible?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

export const TotalScoreReveal: React.FC<TotalScoreRevealProps> = ({
  basePoints,
  totalMultiplier,
  finalScore,
  isVisible = true,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [phase, setPhase] = useState<'base' | 'multiplier' | 'total'>('base');

  // Sequence through phases
  useEffect(() => {
    if (!isVisible || reducedMotion) {
      setPhase('total');
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => setPhase('multiplier'), DURATIONS.slow));
    timers.push(setTimeout(() => setPhase('total'), DURATIONS.slow * 2));
    timers.push(setTimeout(() => onComplete?.(), DURATIONS.slow * 3));

    return () => timers.forEach(clearTimeout);
  }, [isVisible, reducedMotion, onComplete]);

  const baseSpring = useSpring({
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
  });

  const multiplierSpring = useSpring({
    from: { opacity: 0, x: -20 },
    to: {
      opacity: phase === 'multiplier' || phase === 'total' ? 1 : 0,
      x: phase === 'multiplier' || phase === 'total' ? 0 : -20,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
  });

  const totalSpring = useSpring({
    from: { opacity: 0, scale: 0.5 },
    to: {
      opacity: phase === 'total' ? 1 : 0,
      scale: phase === 'total' ? 1 : 0.5,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`flex flex-col items-center gap-4 p-6 ${className}`}
      style={{
        background: `linear-gradient(to bottom, ${colors.darkForest}dd, ${colors.darkForest})`,
        borderRadius: '16px',
        border: `2px solid ${ANIMATION_COLORS.gold}`,
      }}
    >
      {/* Base points */}
      <animated.div
        className="text-center"
        style={{
          opacity: baseSpring.opacity,
          transform: baseSpring.scale.to((s) => `scale(${s})`),
        }}
      >
        <div className="text-sm" style={{ color: colors.beigeWhite, opacity: 0.7 }}>
          Base Points
        </div>
        <div
          className="text-2xl font-bold"
          style={{ color: colors.beigeWhite }}
        >
          {basePoints}
        </div>
      </animated.div>

      {/* Multiplier */}
      <animated.div
        className="text-center"
        style={{
          opacity: multiplierSpring.opacity,
          transform: multiplierSpring.x.to((x) => `translateX(${x}px)`),
        }}
      >
        <div className="text-3xl font-bold" style={{ color: ANIMATION_COLORS.orange }}>
          x {totalMultiplier.toFixed(2)}
        </div>
      </animated.div>

      {/* Divider */}
      <div
        className="w-full h-px"
        style={{ background: `linear-gradient(to right, transparent, ${ANIMATION_COLORS.gold}, transparent)` }}
      />

      {/* Final score */}
      <animated.div
        className="text-center"
        style={{
          opacity: totalSpring.opacity,
          transform: totalSpring.scale.to((s) => `scale(${s})`),
        }}
      >
        <div className="text-sm" style={{ color: ANIMATION_COLORS.gold }}>
          Total Score
        </div>
        <div
          className="text-4xl font-bold"
          style={{
            color: ANIMATION_COLORS.gold,
            textShadow: `0 0 20px ${ANIMATION_COLORS.gold}`,
          }}
        >
          {finalScore.toLocaleString()}
        </div>
      </animated.div>
    </div>
  );
};

/**
 * Hook for managing score popups
 */
export function useScorePopups() {
  const [popups, setPopups] = useState<Array<ScorePopupProps & { id: string }>>([]);

  const showPopup = React.useCallback(
    (props: Omit<ScorePopupProps, 'onComplete'>) => {
      const id = `popup-${Date.now()}-${Math.random()}`;
      setPopups((prev) => [...prev, { ...props, id }]);
    },
    []
  );

  const handleComplete = React.useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const PopupContainer: React.FC = () => (
    <>
      {popups.map((popup) => (
        <ScorePopup
          key={popup.id}
          {...popup}
          onComplete={() => handleComplete(popup.id)}
        />
      ))}
    </>
  );

  return {
    showPopup,
    PopupContainer,
    activeCount: popups.length,
  };
}

export default ScorePopup;
