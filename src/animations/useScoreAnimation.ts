/**
 * Score Animation Hooks for Tensho Mahjong Roguelike
 *
 * Provides animation primitives for score displays, multipliers, and combos.
 * Uses React Spring for smooth, physics-based animations.
 */

import { useSpring, useTrail, config } from '@react-spring/web';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SPRINGS, DURATIONS, SCALES, OFFSETS } from './constants';
import { useSettingsStore, selectAnimationMultiplier } from '../stores/settingsStore';

/**
 * Hook for animated score counter
 * Counts up from current value to target value with easing
 */
export function useScoreCountUp(targetScore: number, options?: {
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}) {
  const {
    duration = DURATIONS.slow,
    delay = 0,
    onComplete,
  } = options ?? {};

  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const multiplier = useSettingsStore(selectAnimationMultiplier);
  const adjustedDuration = reducedMotion ? 0 : duration * multiplier;

  const spring = useSpring({
    from: { value: 0 },
    to: { value: targetScore },
    delay,
    config: {
      duration: adjustedDuration,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // Ease out cubic
    },
    onRest: onComplete,
  });

  return {
    displayValue: spring.value.to((v) => Math.floor(v)),
    spring,
  };
}

/**
 * Hook for score increment animation
 * Animates the difference when score changes
 */
export function useScoreIncrement(
  currentScore: number,
  options?: {
    onIncrement?: (amount: number) => void;
  }
) {
  const { onIncrement } = options ?? {};
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const previousScoreRef = useRef(currentScore);
  const [increment, setIncrement] = useState(0);

  const spring = useSpring({
    from: { value: previousScoreRef.current },
    to: { value: currentScore },
    config: SPRINGS.snappy,
    immediate: reducedMotion,
    onChange: ({ value }) => {
      if (value.value !== undefined) {
        const diff = currentScore - previousScoreRef.current;
        if (diff > 0 && increment !== diff) {
          setIncrement(diff);
          onIncrement?.(diff);
        }
      }
    },
    onRest: () => {
      previousScoreRef.current = currentScore;
    },
  });

  return {
    displayValue: spring.value.to((v) => Math.floor(v)),
    increment,
    spring,
  };
}

/**
 * Hook for score pop-in animation
 * Pop effect when score is displayed
 */
export function useScorePopAnimation(isVisible: boolean = true) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const spring = useSpring({
    from: {
      scale: 0.5,
      opacity: 0,
      y: 20,
    },
    to: {
      scale: isVisible ? 1 : 0.5,
      opacity: isVisible ? 1 : 0,
      y: isVisible ? 0 : 20,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
  });

  return {
    style: {
      transform: spring.scale.to(
        (s) => `scale(${s}) translateY(${spring.y.get()}px)`
      ),
      opacity: spring.opacity,
    },
    spring,
  };
}

/**
 * Hook for multiplier flash animation
 * Flash/pulse effect when a multiplier is applied
 */
export function useMultiplierAnimation() {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [isFlashing, setIsFlashing] = useState(false);

  const spring = useSpring({
    scale: isFlashing ? SCALES.emphasis : SCALES.normal,
    brightness: isFlashing ? 1.5 : 1,
    config: { tension: 400, friction: 10 },
    immediate: reducedMotion,
    onRest: () => {
      if (isFlashing) {
        setIsFlashing(false);
      }
    },
  });

  const trigger = useCallback(() => {
    if (!reducedMotion) {
      setIsFlashing(true);
    }
  }, [reducedMotion]);

  return {
    style: {
      transform: spring.scale.to((s) => `scale(${s})`),
      filter: spring.brightness.to((b) => `brightness(${b})`),
    },
    spring,
    trigger,
    isFlashing,
  };
}

/**
 * Hook for combo counter animation
 * Escalating effects as combo count increases
 */
export function useComboAnimation(comboCount: number) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  // Scale and intensity increase with combo count
  const intensity = Math.min(comboCount / 5, 1); // Max out at 5 combos
  const targetScale = 1 + intensity * 0.3; // Max 1.3x scale
  const targetShake = intensity * 5; // Max 5px shake

  const spring = useSpring({
    scale: comboCount > 0 ? targetScale : 1,
    shake: comboCount > 0 ? targetShake : 0,
    glow: comboCount > 0 ? intensity : 0,
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
  });

  // Color based on combo count
  const getComboColor = () => {
    if (comboCount >= 5) return '#FF5722'; // Orange for high combos
    if (comboCount >= 3) return '#FFD54F'; // Gold for medium combos
    return '#F5F5DC'; // Beige for low combos
  };

  return {
    style: {
      transform: spring.scale.to((s) => `scale(${s})`),
      textShadow: spring.glow.to(
        (g) => `0 0 ${g * 20}px ${getComboColor()}`
      ),
      color: getComboColor(),
    },
    spring,
    intensity,
    color: getComboColor(),
  };
}

/**
 * Hook for cascading score reveals
 * Staggered animation for multiple score components
 */
export function useCascadingScoreAnimation(itemCount: number) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const trail = useTrail(itemCount, {
    from: {
      opacity: 0,
      y: 30,
      scale: 0.8,
    },
    to: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  });

  return {
    trail,
    getItemStyle: (index: number) => ({
      opacity: trail[index]?.opacity ?? 1,
      transform: trail[index]?.y?.to(
        (y: number) => `translateY(${y}px) scale(${trail[index]?.scale?.get() ?? 1})`
      ),
    }),
  };
}

/**
 * Hook for total score reveal
 * Dramatic reveal for final score display
 */
export function useTotalScoreReveal(isRevealed: boolean = false) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const spring = useSpring({
    from: {
      scale: 0,
      opacity: 0,
      rotate: -10,
    },
    to: {
      scale: isRevealed ? 1 : 0,
      opacity: isRevealed ? 1 : 0,
      rotate: isRevealed ? 0 : -10,
    },
    config: SPRINGS.bouncy,
    delay: isRevealed ? DURATIONS.normal : 0,
    immediate: reducedMotion,
  });

  return {
    style: {
      transform: spring.scale.to(
        (s) => `scale(${s}) rotate(${spring.rotate.get()}deg)`
      ),
      opacity: spring.opacity,
    },
    spring,
  };
}

/**
 * Hook for score breakdown animation
 * Animates individual score components appearing one by one
 */
export function useScoreBreakdownAnimation(
  items: { label: string; value: number }[],
  options?: {
    staggerDelay?: number;
    onComplete?: () => void;
  }
) {
  const { staggerDelay = 150, onComplete } = options ?? {};
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const multiplier = useSettingsStore(selectAnimationMultiplier);
  const adjustedDelay = reducedMotion ? 0 : staggerDelay * multiplier;

  const trail = useTrail(items.length, {
    from: {
      opacity: 0,
      x: -30,
      value: 0,
    },
    to: {
      opacity: 1,
      x: 0,
      value: 1,
    },
    config: SPRINGS.snappy,
    immediate: reducedMotion,
    delay: (index: number) => index * adjustedDelay,
    onRest: (_, __, index) => {
      if (index === items.length - 1) {
        onComplete?.();
      }
    },
  });

  return {
    trail,
    items: items.map((item, index) => ({
      ...item,
      style: {
        opacity: trail[index]?.opacity ?? 1,
        transform: trail[index]?.x?.to((x: number) => `translateX(${x}px)`),
      },
      displayValue: trail[index]?.value?.to(
        (v: number) => Math.floor(v * item.value)
      ),
    })),
  };
}

/**
 * Hook for pulsing score highlight
 * Continuous pulse effect for emphasized scores
 */
export function usePulsingScore(isPulsing: boolean = false) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const spring = useSpring({
    loop: isPulsing && !reducedMotion,
    from: { scale: 1, glow: 0.5 },
    to: isPulsing
      ? [
          { scale: 1.05, glow: 1 },
          { scale: 1, glow: 0.5 },
        ]
      : { scale: 1, glow: 0 },
    config: { duration: DURATIONS.slow },
    immediate: reducedMotion && !isPulsing,
  });

  return {
    style: {
      transform: spring.scale.to((s) => `scale(${s})`),
      boxShadow: spring.glow.to(
        (g) => `0 0 ${g * 15}px rgba(255, 213, 79, ${g * 0.8})`
      ),
    },
    spring,
  };
}
