/**
 * ScorePopup Component for Tensho Mahjong Roguelike
 *
 * Animated score popup that floats up and fades out.
 * Shows points earned with multipliers applied.
 *
 * Enhanced with:
 * - Chips/mult number popups
 * - Score counter animation (counting up)
 * - Combo multiplier display
 * - Retrigger pulse effect
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSpring, useTrail, animated, config } from '@react-spring/web';
import { useSettingsStore } from '../../stores/settingsStore';
import { SPRINGS, DURATIONS, ANIMATION_COLORS, ANIMATION_Z_INDEX } from '../../animations/constants';
import { colors } from '../../styles/theme';

// =============================================================================
// TYPES
// =============================================================================

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
  variant?: 'default' | 'bonus' | 'critical' | 'chips' | 'mult';
  /** Additional CSS class name */
  className?: string;
}

export type ScoreDisplayStyle = 'float' | 'pop' | 'slide' | 'cascade';

// =============================================================================
// SCORE POPUP COMPONENT
// =============================================================================

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
      case 'chips':
        return ANIMATION_COLORS.blue;
      case 'mult':
        return ANIMATION_COLORS.red;
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

  const displayText =
    multiplier && multiplier > 1
      ? `+${points.toLocaleString()} x${multiplier.toFixed(1)}`
      : `+${points.toLocaleString()}`;

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

// =============================================================================
// CHIPS AND MULT POPUP
// =============================================================================

export interface ChipsMullPopupProps {
  /** Base chips value */
  chips: number;
  /** Multiplier value */
  mult: number;
  /** Position relative to parent */
  position?: { x: number; y: number };
  /** Whether to animate the calculation */
  animateCalc?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * ChipsMultPopup component
 * Shows Balatro-style chips x mult display
 */
export const ChipsMultPopup: React.FC<ChipsMullPopupProps> = ({
  chips,
  mult,
  position = { x: 50, y: 50 },
  animateCalc = true,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [phase, setPhase] = useState<'chips' | 'mult' | 'result'>('chips');
  const [displayChips, setDisplayChips] = useState(0);
  const [displayMult, setDisplayMult] = useState(0);

  // Animate chips counting up
  const chipsSpring = useSpring({
    from: { value: 0, scale: 0.5, opacity: 0 },
    to: { value: chips, scale: 1, opacity: 1 },
    config: { duration: reducedMotion ? 0 : DURATIONS.normal },
    onChange: ({ value }) => {
      setDisplayChips(Math.floor(value.value));
    },
    onRest: () => {
      if (!reducedMotion) {
        setTimeout(() => setPhase('mult'), DURATIONS.fast);
      }
    },
  });

  // Animate mult appearing
  const multSpring = useSpring({
    from: { scale: 0, opacity: 0, x: -20 },
    to: {
      scale: phase === 'mult' || phase === 'result' ? 1 : 0,
      opacity: phase === 'mult' || phase === 'result' ? 1 : 0,
      x: phase === 'mult' || phase === 'result' ? 0 : -20,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
    onChange: ({ value }) => {
      if (phase === 'mult') {
        setDisplayMult(Math.floor(value.scale * mult));
      }
    },
    onRest: () => {
      if (phase === 'mult' && !reducedMotion) {
        setTimeout(() => setPhase('result'), DURATIONS.normal);
      }
    },
  });

  // Animate result
  const resultSpring = useSpring({
    from: { scale: 0, opacity: 0, y: 20 },
    to: {
      scale: phase === 'result' ? 1.2 : 0,
      opacity: phase === 'result' ? 1 : 0,
      y: phase === 'result' ? 0 : 20,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
    onRest: () => {
      if (phase === 'result') {
        setTimeout(() => onComplete?.(), DURATIONS.slow);
      }
    },
  });

  // Skip animation if reduced motion
  useEffect(() => {
    if (reducedMotion || !animateCalc) {
      setPhase('result');
      setDisplayChips(chips);
      setDisplayMult(mult);
    }
  }, [reducedMotion, animateCalc, chips, mult]);

  const finalScore = chips * mult;

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: ANIMATION_Z_INDEX.effects,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* Chips x Mult row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Chips */}
        <animated.div
          style={{
            transform: chipsSpring.scale.to((s) => `scale(${s})`),
            opacity: chipsSpring.opacity,
            color: ANIMATION_COLORS.blue,
            fontSize: '28px',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${ANIMATION_COLORS.blue}`,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {displayChips.toLocaleString()}
        </animated.div>

        {/* X symbol */}
        <animated.div
          style={{
            transform: multSpring.scale.to((s) => `scale(${s})`),
            opacity: multSpring.opacity,
            color: colors.beigeWhite,
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          x
        </animated.div>

        {/* Mult */}
        <animated.div
          style={{
            transform: multSpring.scale.to((s) => `scale(${s})`),
            opacity: multSpring.opacity,
            color: ANIMATION_COLORS.red,
            fontSize: '28px',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${ANIMATION_COLORS.red}`,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {displayMult.toFixed(1)}
        </animated.div>
      </div>

      {/* Result */}
      <animated.div
        style={{
          transform: resultSpring.scale.to(
            (s) => `scale(${s}) translateY(${resultSpring.y.get()}px)`
          ),
          opacity: resultSpring.opacity,
          color: ANIMATION_COLORS.gold,
          fontSize: '36px',
          fontWeight: 'bold',
          textShadow: `0 0 15px ${ANIMATION_COLORS.gold}, 0 0 30px ${ANIMATION_COLORS.gold}`,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        {finalScore.toLocaleString()}
      </animated.div>
    </div>
  );
};

// =============================================================================
// SCORE COUNTER COMPONENT
// =============================================================================

export interface ScoreCounterProps {
  /** Current score value */
  value: number;
  /** Whether to animate changes */
  animate?: boolean;
  /** Duration of count animation in ms */
  duration?: number;
  /** Label to display */
  label?: string;
  /** Color of the score */
  color?: string;
  /** Font size */
  fontSize?: number;
  /** Additional CSS class name */
  className?: string;
}

/**
 * ScoreCounter component
 * Animated score display that counts up/down when value changes
 */
export const ScoreCounter: React.FC<ScoreCounterProps> = ({
  value,
  animate = true,
  duration = DURATIONS.slow,
  label,
  color = ANIMATION_COLORS.gold,
  fontSize = 32,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const previousValueRef = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [isPulsing, setIsPulsing] = useState(false);

  // Count up animation
  const spring = useSpring({
    from: { value: previousValueRef.current },
    to: { value },
    config: {
      duration: reducedMotion || !animate ? 0 : duration,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    },
    onChange: ({ value: springValue }) => {
      setDisplayValue(Math.floor(springValue.value));
    },
    onStart: () => {
      if (value !== previousValueRef.current && !reducedMotion) {
        setIsPulsing(true);
      }
    },
    onRest: () => {
      previousValueRef.current = value;
      setIsPulsing(false);
    },
  });

  // Pulse animation on change
  const pulseSpring = useSpring({
    scale: isPulsing ? 1.1 : 1,
    config: { tension: 400, friction: 10 },
    immediate: reducedMotion,
  });

  return (
    <animated.div
      className={`text-center ${className}`}
      style={{
        transform: pulseSpring.scale.to((s) => `scale(${s})`),
      }}
    >
      {label && (
        <div
          style={{
            color: colors.beigeWhite,
            opacity: 0.7,
            fontSize: `${fontSize * 0.5}px`,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          color,
          fontSize: `${fontSize}px`,
          fontWeight: 'bold',
          textShadow: `0 0 10px ${color}`,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        {displayValue.toLocaleString()}
      </div>
    </animated.div>
  );
};

// =============================================================================
// COMBO DISPLAY COMPONENT
// =============================================================================

export interface ComboDisplayProps {
  /** Combo count */
  combo: number;
  /** Maximum combo for scaling effects */
  maxCombo?: number;
  /** Position */
  position?: { x: number; y: number };
  /** Additional CSS class name */
  className?: string;
}

/**
 * ComboDisplay component
 * Shows escalating combo counter with effects
 */
export const ComboDisplay: React.FC<ComboDisplayProps> = ({
  combo,
  maxCombo = 10,
  position = { x: 85, y: 20 },
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [prevCombo, setPrevCombo] = useState(combo);

  // Scale and glow intensity based on combo
  const intensity = Math.min(combo / maxCombo, 1);
  const scale = 1 + intensity * 0.5;
  const glowSize = 10 + intensity * 20;

  // Get combo color
  const getComboColor = () => {
    if (combo >= 7) return ANIMATION_COLORS.orange;
    if (combo >= 4) return ANIMATION_COLORS.gold;
    return colors.beigeWhite;
  };

  const spring = useSpring({
    scale: combo > prevCombo ? scale * 1.2 : scale,
    glowIntensity: intensity,
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
    onRest: () => setPrevCombo(combo),
  });

  // Reset to normal scale after pop
  useEffect(() => {
    if (combo > prevCombo && !reducedMotion) {
      const timeout = setTimeout(() => {
        setPrevCombo(combo);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [combo, prevCombo, reducedMotion]);

  if (combo <= 0) return null;

  return (
    <animated.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        right: `${100 - position.x}%`,
        top: `${position.y}%`,
        transform: spring.scale.to((s) => `scale(${s})`),
        textAlign: 'right',
      }}
    >
      <animated.div
        style={{
          color: getComboColor(),
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: spring.glowIntensity.to(
            (i) => `0 0 ${glowSize * i}px ${getComboColor()}`
          ),
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        <div style={{ fontSize: '14px', opacity: 0.8 }}>COMBO</div>
        <div style={{ fontSize: '36px' }}>x{combo}</div>
      </animated.div>
    </animated.div>
  );
};

// =============================================================================
// STACKING SCORE POPUP
// =============================================================================

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
              +{item.points.toLocaleString()}
              {item.multiplier && item.multiplier > 1 && (
                <span
                  className="text-sm ml-1"
                  style={{ color: ANIMATION_COLORS.orange }}
                >
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

// =============================================================================
// TOTAL SCORE REVEAL
// =============================================================================

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
        <div
          className="text-sm"
          style={{ color: colors.beigeWhite, opacity: 0.7 }}
        >
          Base Points
        </div>
        <div className="text-2xl font-bold" style={{ color: colors.beigeWhite }}>
          {basePoints.toLocaleString()}
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
        <div
          className="text-3xl font-bold"
          style={{ color: ANIMATION_COLORS.orange }}
        >
          x {totalMultiplier.toFixed(2)}
        </div>
      </animated.div>

      {/* Divider */}
      <div
        className="w-full h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${ANIMATION_COLORS.gold}, transparent)`,
        }}
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

// =============================================================================
// RETRIGGER POPUP
// =============================================================================

export interface RetriggerPopupProps {
  /** Number of retriggers */
  count: number;
  /** Position */
  position?: { x: number; y: number };
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * RetriggerPopup component
 * Shows retrigger effect with pulse animation
 */
export const RetriggerPopup: React.FC<RetriggerPopupProps> = ({
  count,
  position = { x: 50, y: 50 },
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [pulseCount, setPulseCount] = useState(0);

  // Pulse animation for each retrigger
  const spring = useSpring({
    loop: pulseCount < count,
    from: { scale: 1, opacity: 1 },
    to: async (next) => {
      await next({ scale: 1.3, opacity: 0.8 });
      await next({ scale: 1, opacity: 1 });
      setPulseCount((p) => p + 1);
    },
    config: { tension: 300, friction: 10 },
    immediate: reducedMotion,
    onRest: () => {
      if (pulseCount >= count) {
        setTimeout(() => onComplete?.(), DURATIONS.fast);
      }
    },
  });

  useEffect(() => {
    if (reducedMotion) {
      setPulseCount(count);
      onComplete?.();
    }
  }, [reducedMotion, count, onComplete]);

  return (
    <animated.div
      className={`absolute pointer-events-none ${className}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: spring.scale.to((s) => `translate(-50%, -50%) scale(${s})`),
        opacity: spring.opacity,
        zIndex: ANIMATION_Z_INDEX.effects,
      }}
    >
      <div
        style={{
          color: ANIMATION_COLORS.purple,
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: `0 0 15px ${ANIMATION_COLORS.purple}`,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        Retrigger x{count}
      </div>
    </animated.div>
  );
};

// =============================================================================
// HOOK FOR MANAGING SCORE POPUPS
// =============================================================================

export function useScorePopups() {
  const [popups, setPopups] = useState<Array<ScorePopupProps & { id: string }>>([]);

  const showPopup = useCallback(
    (props: Omit<ScorePopupProps, 'onComplete'>) => {
      const id = `popup-${Date.now()}-${Math.random()}`;
      setPopups((prev) => [...prev, { ...props, id }]);
    },
    []
  );

  const handleComplete = useCallback((id: string) => {
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
