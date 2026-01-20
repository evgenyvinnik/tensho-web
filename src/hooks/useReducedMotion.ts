/**
 * useReducedMotion Hook for Tensho Mahjong Roguelike
 *
 * Accessibility hook that:
 * - Detects prefers-reduced-motion media query
 * - Integrates with settingsStore.reducedMotion
 * - Provides fallback static states for animations
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Check if the user prefers reduced motion via media query
 */
function getSystemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Hook to detect system-level prefers-reduced-motion preference
 */
export function useSystemReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getSystemPrefersReducedMotion
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Combined hook that respects both system and app-level reduced motion settings
 *
 * Returns true if either:
 * - The user has set reducedMotion in app settings
 * - The system prefers-reduced-motion is enabled
 */
export function useReducedMotion(): boolean {
  const systemPrefersReducedMotion = useSystemReducedMotion();
  const appReducedMotion = useSettingsStore((state) => state.reducedMotion);

  return systemPrefersReducedMotion || appReducedMotion;
}

/**
 * Hook that provides animation config based on reduced motion preference
 */
export function useAnimationConfig() {
  const shouldReduceMotion = useReducedMotion();
  const animationSpeed = useSettingsStore((state) => state.animationSpeed);

  // Get duration multiplier based on settings
  const durationMultiplier = useMemo(() => {
    if (shouldReduceMotion) return 0;

    switch (animationSpeed) {
      case 'slow':
        return 1.5;
      case 'fast':
        return 0.5;
      case 'normal':
      default:
        return 1;
    }
  }, [shouldReduceMotion, animationSpeed]);

  // Get spring config based on settings
  const springConfig = useMemo(() => {
    if (shouldReduceMotion) {
      return { immediate: true };
    }

    const baseConfig = { tension: 300, friction: 20 };

    switch (animationSpeed) {
      case 'slow':
        return { ...baseConfig, tension: 200, friction: 25 };
      case 'fast':
        return { ...baseConfig, tension: 400, friction: 15 };
      case 'normal':
      default:
        return baseConfig;
    }
  }, [shouldReduceMotion, animationSpeed]);

  return {
    shouldReduceMotion,
    durationMultiplier,
    springConfig,
    immediate: shouldReduceMotion,
  };
}

/**
 * Hook that provides static fallback values for animations
 * Use this when you need to provide non-animated fallback states
 */
export function useAnimationFallback<T>(
  animatedValue: T,
  staticValue: T
): T {
  const shouldReduceMotion = useReducedMotion();
  return shouldReduceMotion ? staticValue : animatedValue;
}

/**
 * Hook for conditionally applying animation props
 * Returns either the animated props or empty object based on reduced motion
 */
export function useConditionalAnimation<T extends object>(
  animationProps: T
): T | Record<string, never> {
  const shouldReduceMotion = useReducedMotion();
  return shouldReduceMotion ? {} : animationProps;
}

/**
 * Hook for creating accessible animation values
 * Provides both animated value and current static value
 */
export function useAccessibleAnimation<T>(options: {
  from: T;
  to: T;
  duration?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [currentValue, setCurrentValue] = useState(options.from);

  useEffect(() => {
    if (shouldReduceMotion) {
      // Immediately set to target value
      setCurrentValue(options.to);
      return;
    }

    // For animated version, just update the target
    // Actual animation is handled by the animation library
    setCurrentValue(options.to);
  }, [options.to, shouldReduceMotion]);

  return {
    value: currentValue,
    from: options.from,
    to: options.to,
    immediate: shouldReduceMotion,
  };
}

/**
 * Hook for managing animation lifecycle with accessibility
 */
export function useAnimationLifecycle(options?: {
  onStart?: () => void;
  onComplete?: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [isAnimating, setIsAnimating] = useState(false);

  const start = useCallback(() => {
    if (shouldReduceMotion) {
      // Skip animation, call complete immediately
      options?.onStart?.();
      options?.onComplete?.();
      return;
    }

    setIsAnimating(true);
    options?.onStart?.();
  }, [shouldReduceMotion, options]);

  const complete = useCallback(() => {
    setIsAnimating(false);
    options?.onComplete?.();
  }, [options]);

  return {
    isAnimating,
    shouldReduceMotion,
    start,
    complete,
  };
}

/**
 * Sync app settings with system preference
 * Call this once at app initialization
 */
export function useSyncReducedMotionWithSystem() {
  const systemPrefersReducedMotion = useSystemReducedMotion();
  const setReducedMotion = useSettingsStore((state) => state.setReducedMotion);

  useEffect(() => {
    // Only sync if system preference changes to true
    // Don't override user's explicit choice to enable animations
    if (systemPrefersReducedMotion) {
      setReducedMotion(true);
    }
  }, [systemPrefersReducedMotion, setReducedMotion]);
}

/**
 * Types for animation state management
 */
export interface AnimationState {
  isActive: boolean;
  phase: 'idle' | 'entering' | 'active' | 'exiting';
  progress: number;
}

/**
 * Hook for managing complex animation states with accessibility
 */
export function useAnimationState(
  initialActive: boolean = false
): {
  state: AnimationState;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  setPhase: (phase: AnimationState['phase']) => void;
} {
  const shouldReduceMotion = useReducedMotion();
  const [state, setState] = useState<AnimationState>({
    isActive: initialActive,
    phase: initialActive ? 'active' : 'idle',
    progress: initialActive ? 1 : 0,
  });

  const start = useCallback(() => {
    if (shouldReduceMotion) {
      setState({ isActive: true, phase: 'active', progress: 1 });
    } else {
      setState((prev) => ({ ...prev, isActive: true, phase: 'entering' }));
    }
  }, [shouldReduceMotion]);

  const stop = useCallback(() => {
    if (shouldReduceMotion) {
      setState({ isActive: false, phase: 'idle', progress: 0 });
    } else {
      setState((prev) => ({ ...prev, phase: 'exiting' }));
    }
  }, [shouldReduceMotion]);

  const toggle = useCallback(() => {
    if (state.isActive) {
      stop();
    } else {
      start();
    }
  }, [state.isActive, start, stop]);

  const setPhase = useCallback((phase: AnimationState['phase']) => {
    setState((prev) => ({
      ...prev,
      phase,
      isActive: phase !== 'idle',
      progress: phase === 'active' ? 1 : phase === 'idle' ? 0 : prev.progress,
    }));
  }, []);

  return { state, start, stop, toggle, setPhase };
}

export default useReducedMotion;
