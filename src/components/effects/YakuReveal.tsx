/**
 * YakuReveal Component for Tensho Mahjong Roguelike
 *
 * Dramatic yaku announcement animation with:
 * - Japanese name with translation
 * - Tier-based styling (higher tier = more dramatic)
 * - Chain animations for multiple yaku
 */

import React, { useEffect, useState } from 'react';
import { useSpring, useTrail, animated, config } from '@react-spring/web';
import { useSettingsStore } from '../../stores/settingsStore';
import { SPRINGS, DURATIONS, ANIMATION_COLORS, ANIMATION_Z_INDEX } from '../../animations/constants';
import { colors } from '../../styles/theme';
import { YakuTier, YakuDefinition } from '../../rules/YakuDefinition';

export interface YakuRevealProps {
  /** Yaku to reveal */
  yaku: YakuDefinition;
  /** Multiplier value for this yaku */
  multiplier: number;
  /** Whether the reveal is active */
  isVisible?: boolean;
  /** Delay before showing (for chaining) */
  delay?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Get styling based on yaku tier
 */
function getTierStyles(tier: YakuTier) {
  switch (tier) {
    case YakuTier.Tier4: // Yakuman
      return {
        backgroundColor: `linear-gradient(135deg, ${colors.darkForest}, #1a0a1a)`,
        borderColor: ANIMATION_COLORS.red,
        glowColor: ANIMATION_COLORS.red,
        textColor: ANIMATION_COLORS.gold,
        accentColor: ANIMATION_COLORS.red,
        intensity: 1,
        scale: 1.2,
      };
    case YakuTier.Tier3: // Advanced
      return {
        backgroundColor: `linear-gradient(135deg, ${colors.darkForest}, #1a1a0a)`,
        borderColor: ANIMATION_COLORS.gold,
        glowColor: ANIMATION_COLORS.gold,
        textColor: ANIMATION_COLORS.gold,
        accentColor: ANIMATION_COLORS.orange,
        intensity: 0.8,
        scale: 1.1,
      };
    case YakuTier.Tier2: // Intermediate
      return {
        backgroundColor: `linear-gradient(135deg, ${colors.darkForest}, #0a1a1a)`,
        borderColor: ANIMATION_COLORS.orange,
        glowColor: ANIMATION_COLORS.orange,
        textColor: colors.beigeWhite,
        accentColor: ANIMATION_COLORS.gold,
        intensity: 0.6,
        scale: 1.05,
      };
    case YakuTier.Tier1: // Basic
    default:
      return {
        backgroundColor: colors.darkForest,
        borderColor: colors.beigeWhite,
        glowColor: colors.beigeWhite,
        textColor: colors.beigeWhite,
        accentColor: ANIMATION_COLORS.gold,
        intensity: 0.4,
        scale: 1,
      };
  }
}

/**
 * YakuReveal component
 * Shows a single yaku with dramatic animation
 */
export const YakuReveal: React.FC<YakuRevealProps> = ({
  yaku,
  multiplier,
  isVisible = true,
  delay = 0,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const tierStyles = getTierStyles(yaku.tier);
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  // Sequence through phases
  useEffect(() => {
    if (!isVisible) return;

    const timers: NodeJS.Timeout[] = [];

    const enterDelay = reducedMotion ? 0 : delay;
    const holdDuration = yaku.tier === YakuTier.Tier4 ? DURATIONS.extended : DURATIONS.dramatic;
    const exitDelay = enterDelay + holdDuration;

    timers.push(setTimeout(() => setPhase('hold'), enterDelay + DURATIONS.normal));
    timers.push(setTimeout(() => setPhase('exit'), exitDelay));
    timers.push(setTimeout(() => onComplete?.(), exitDelay + DURATIONS.normal));

    return () => timers.forEach(clearTimeout);
  }, [isVisible, delay, yaku.tier, reducedMotion, onComplete]);

  // Main container animation
  const containerSpring = useSpring({
    from: {
      opacity: 0,
      scale: 0.5,
      y: 50,
    },
    to: {
      opacity: phase === 'exit' ? 0 : 1,
      scale: phase === 'enter' ? tierStyles.scale : phase === 'hold' ? tierStyles.scale : 0.8,
      y: phase === 'exit' ? -50 : 0,
    },
    delay: reducedMotion ? 0 : delay,
    config: yaku.tier === YakuTier.Tier4 ? SPRINGS.bouncy : SPRINGS.snappy,
    immediate: reducedMotion,
  });

  // Japanese name slide-in
  const japaneseSpring = useSpring({
    from: { x: -100, opacity: 0 },
    to: { x: 0, opacity: 1 },
    delay: reducedMotion ? 0 : delay + 100,
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  });

  // English name slide-in
  const englishSpring = useSpring({
    from: { x: 100, opacity: 0 },
    to: { x: 0, opacity: 1 },
    delay: reducedMotion ? 0 : delay + 200,
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  });

  // Multiplier pop
  const multiplierSpring = useSpring({
    from: { scale: 0, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    delay: reducedMotion ? 0 : delay + 300,
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
  });

  // Glow pulse for yakuman
  const glowSpring = useSpring({
    loop: yaku.tier === YakuTier.Tier4 && phase === 'hold' && !reducedMotion,
    from: { glowSize: 10 },
    to: yaku.tier === YakuTier.Tier4
      ? [{ glowSize: 30 }, { glowSize: 10 }]
      : { glowSize: 15 * tierStyles.intensity },
    config: { duration: DURATIONS.slow },
    immediate: reducedMotion,
  });

  if (!isVisible && phase === 'exit') {
    return null;
  }

  return (
    <animated.div
      className={`relative overflow-hidden rounded-xl p-6 ${className}`}
      style={{
        opacity: containerSpring.opacity,
        transform: containerSpring.scale.to(
          (s) => `scale(${s}) translateY(${containerSpring.y.get()}px)`
        ),
        background: tierStyles.backgroundColor,
        border: `3px solid ${tierStyles.borderColor}`,
        boxShadow: glowSpring.glowSize.to(
          (g) => `0 0 ${g}px ${g / 2}px ${tierStyles.glowColor}`
        ),
        zIndex: ANIMATION_Z_INDEX.overlay,
        minWidth: '300px',
        maxWidth: '400px',
      }}
    >
      {/* Tier indicator */}
      <div
        className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold"
        style={{
          backgroundColor: tierStyles.borderColor,
          color: colors.darkForest,
        }}
      >
        {yaku.tier === YakuTier.Tier4 ? 'YAKUMAN' : `Tier ${yaku.tier}`}
      </div>

      {/* Japanese name */}
      <animated.div
        className="text-4xl font-bold text-center mb-2"
        style={{
          opacity: japaneseSpring.opacity,
          transform: japaneseSpring.x.to((x) => `translateX(${x}px)`),
          color: tierStyles.textColor,
          fontFamily: "'Noto Sans JP', serif",
          textShadow: `0 0 10px ${tierStyles.glowColor}`,
        }}
      >
        {yaku.japaneseName}
      </animated.div>

      {/* English name */}
      <animated.div
        className="text-xl text-center mb-4"
        style={{
          opacity: englishSpring.opacity,
          transform: englishSpring.x.to((x) => `translateX(${x}px)`),
          color: colors.beigeWhite,
          opacity: 0.9,
        }}
      >
        {yaku.name}
      </animated.div>

      {/* Multiplier display */}
      <animated.div
        className="text-center"
        style={{
          opacity: multiplierSpring.opacity,
          transform: multiplierSpring.scale.to((s) => `scale(${s})`),
        }}
      >
        <span
          className="text-3xl font-bold px-4 py-2 rounded-lg"
          style={{
            backgroundColor: `${tierStyles.accentColor}33`,
            color: tierStyles.accentColor,
            border: `2px solid ${tierStyles.accentColor}`,
          }}
        >
          x{multiplier.toFixed(1)}
        </span>
      </animated.div>

      {/* Description */}
      <div
        className="text-sm text-center mt-4"
        style={{ color: colors.beigeWhite, opacity: 0.7 }}
      >
        {yaku.description}
      </div>
    </animated.div>
  );
};

/**
 * YakuRevealSequence component
 * Shows multiple yaku in sequence with chain animations
 */
export interface YakuRevealSequenceProps {
  /** Array of yaku to reveal */
  yakuList: Array<{
    definition: YakuDefinition;
    multiplier: number;
  }>;
  /** Whether the sequence is active */
  isVisible?: boolean;
  /** Delay between each yaku reveal */
  staggerDelay?: number;
  /** Callback when all reveals complete */
  onComplete?: () => void;
  /** Additional CSS class name */
  className?: string;
}

export const YakuRevealSequence: React.FC<YakuRevealSequenceProps> = ({
  yakuList,
  isVisible = true,
  staggerDelay = DURATIONS.dramatic,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Sort by tier (highest first) for dramatic effect
  const sortedYaku = [...yakuList].sort(
    (a, b) => b.definition.tier - a.definition.tier
  );

  const handleYakuComplete = () => {
    setCompletedCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= sortedYaku.length) {
        onComplete?.();
      }
      return newCount;
    });
  };

  if (!isVisible || sortedYaku.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${className}`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: ANIMATION_Z_INDEX.overlay,
      }}
    >
      <div className="flex flex-col items-center gap-4">
        {sortedYaku.map((yaku, index) => (
          <YakuReveal
            key={yaku.definition.id}
            yaku={yaku.definition}
            multiplier={yaku.multiplier}
            isVisible={isVisible}
            delay={reducedMotion ? 0 : index * staggerDelay}
            onComplete={handleYakuComplete}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * YakuBanner component
 * Compact horizontal banner for yaku notification
 */
export interface YakuBannerProps {
  /** Yaku to display */
  yaku: YakuDefinition;
  /** Multiplier value */
  multiplier: number;
  /** Position from top */
  position?: 'top' | 'center' | 'bottom';
  /** Whether visible */
  isVisible?: boolean;
  /** Callback on complete */
  onComplete?: () => void;
  /** Additional CSS class */
  className?: string;
}

export const YakuBanner: React.FC<YakuBannerProps> = ({
  yaku,
  multiplier,
  position = 'center',
  isVisible = true,
  onComplete,
  className = '',
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const tierStyles = getTierStyles(yaku.tier);

  const spring = useSpring({
    from: {
      opacity: 0,
      scale: 0.8,
      x: -100,
    },
    to: async (next) => {
      await next({ opacity: 1, scale: 1, x: 0 });
      await new Promise((r) => setTimeout(r, DURATIONS.dramatic));
      await next({ opacity: 0, scale: 0.8, x: 100 });
    },
    config: SPRINGS.snappy,
    immediate: reducedMotion,
    onRest: onComplete,
  });

  const positionStyles = {
    top: 'top-20',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-20',
  };

  if (!isVisible) {
    return null;
  }

  return (
    <animated.div
      className={`fixed left-1/2 -translate-x-1/2 ${positionStyles[position]} ${className}`}
      style={{
        opacity: spring.opacity,
        transform: spring.x.to(
          (x) => `translateX(calc(-50% + ${x}px)) scale(${spring.scale.get()})`
        ),
        zIndex: ANIMATION_Z_INDEX.overlay,
      }}
    >
      <div
        className="flex items-center gap-4 px-6 py-3 rounded-full"
        style={{
          background: tierStyles.backgroundColor,
          border: `2px solid ${tierStyles.borderColor}`,
          boxShadow: `0 0 20px ${tierStyles.glowColor}`,
        }}
      >
        <span
          className="text-2xl font-bold"
          style={{
            color: tierStyles.textColor,
            fontFamily: "'Noto Sans JP', serif",
          }}
        >
          {yaku.japaneseName}
        </span>
        <span style={{ color: colors.beigeWhite, opacity: 0.8 }}>
          {yaku.name}
        </span>
        <span
          className="font-bold px-3 py-1 rounded"
          style={{
            backgroundColor: tierStyles.accentColor,
            color: colors.darkForest,
          }}
        >
          x{multiplier.toFixed(1)}
        </span>
      </div>
    </animated.div>
  );
};

export default YakuReveal;
