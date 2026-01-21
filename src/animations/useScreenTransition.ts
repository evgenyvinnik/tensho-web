/**
 * Screen Transition Hooks for Tensho Mahjong Roguelike
 *
 * Provides animation primitives for transitioning between screens.
 * Uses React Spring for smooth, physics-based transitions.
 */

import { useSpring, useTransition } from '@react-spring/web';
import { useCallback, useState } from 'react';
import { SPRINGS, DURATIONS } from './constants';
import { useSettingsStore, selectAnimationMultiplier } from '../stores/settingsStore';

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Hook for fade transitions between screens
 */
export function useFadeTransition(isVisible: boolean = true) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const multiplier = useSettingsStore(selectAnimationMultiplier);

  const spring = useSpring({
    from: { opacity: 0 },
    to: { opacity: isVisible ? 1 : 0 },
    config: {
      duration: reducedMotion ? 0 : DURATIONS.normal * multiplier,
    },
    immediate: reducedMotion,
  });

  return {
    style: {
      opacity: spring.opacity,
    },
    spring,
  };
}

/**
 * Hook for slide transitions between screens
 */
export function useSlideTransition(
  isVisible: boolean = true,
  direction: SlideDirection = 'right'
) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  // Calculate offset based on direction
  const getOffset = () => {
    switch (direction) {
      case 'left':
        return { x: isVisible ? 0 : -100, y: 0 };
      case 'right':
        return { x: isVisible ? 0 : 100, y: 0 };
      case 'up':
        return { x: 0, y: isVisible ? 0 : -100 };
      case 'down':
        return { x: 0, y: isVisible ? 0 : 100 };
    }
  };

  const offset = getOffset();

  const spring = useSpring({
    from: {
      x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
      y: direction === 'up' ? -100 : direction === 'down' ? 100 : 0,
      opacity: 0,
    },
    to: {
      x: offset.x,
      y: offset.y,
      opacity: isVisible ? 1 : 0,
    },
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  });

  return {
    style: {
      transform: spring.x.to(
        (x) => `translate(${x}%, ${spring.y.get()}%)`
      ),
      opacity: spring.opacity,
    },
    spring,
  };
}

/**
 * Hook for zoom transitions between screens
 */
export function useZoomTransition(
  isVisible: boolean = true,
  options?: {
    zoomIn?: boolean; // true for zoom in, false for zoom out
  }
) {
  const { zoomIn = true } = options ?? {};
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const fromScale = zoomIn ? 0.8 : 1.2;
  const toScale = isVisible ? 1 : (zoomIn ? 0.8 : 1.2);

  const spring = useSpring({
    from: {
      scale: fromScale,
      opacity: 0,
    },
    to: {
      scale: toScale,
      opacity: isVisible ? 1 : 0,
    },
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  });

  return {
    style: {
      transform: spring.scale.to((s) => `scale(${s})`),
      opacity: spring.opacity,
    },
    spring,
  };
}

/**
 * Hook for page transition with configurable enter/exit animations
 */
export function usePageTransition<T>(
  currentPage: T,
  options?: {
    enterDirection?: SlideDirection;
    exitDirection?: SlideDirection;
    type?: 'slide' | 'fade' | 'zoom';
  }
) {
  const {
    enterDirection = 'right',
    exitDirection = 'left',
    type = 'slide',
  } = options ?? {};
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const getTransform = (direction: SlideDirection, entering: boolean) => {
    const offset = entering ? 0 : 100;
    switch (direction) {
      case 'left':
        return `translateX(${-offset}%)`;
      case 'right':
        return `translateX(${offset}%)`;
      case 'up':
        return `translateY(${-offset}%)`;
      case 'down':
        return `translateY(${offset}%)`;
    }
  };

  const transitions = useTransition(currentPage, {
    from: () => {
      if (type === 'fade') {
        return { opacity: 0, transform: 'none' };
      }
      if (type === 'zoom') {
        return { opacity: 0, transform: 'scale(0.8)' };
      }
      return {
        opacity: 0,
        transform: getTransform(enterDirection, false),
      };
    },
    enter: { opacity: 1, transform: 'translateX(0%) translateY(0%) scale(1)' },
    leave: () => {
      if (type === 'fade') {
        return { opacity: 0, transform: 'none' };
      }
      if (type === 'zoom') {
        return { opacity: 0, transform: 'scale(1.2)' };
      }
      return {
        opacity: 0,
        transform: getTransform(exitDirection, false),
      };
    },
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  });

  return {
    transitions,
  };
}

/**
 * Hook for modal/overlay transitions
 */
export function useModalTransition(isOpen: boolean = false) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const backdropSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: isOpen ? 0.7 : 0 },
    config: { duration: DURATIONS.fast },
    immediate: reducedMotion,
  });

  const contentSpring = useSpring({
    from: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    to: {
      opacity: isOpen ? 1 : 0,
      scale: isOpen ? 1 : 0.9,
      y: isOpen ? 0 : 20,
    },
    config: SPRINGS.bouncy,
    immediate: reducedMotion,
  });

  return {
    backdropStyle: {
      opacity: backdropSpring.opacity,
    },
    contentStyle: {
      opacity: contentSpring.opacity,
      transform: contentSpring.scale.to(
        (s) => `scale(${s}) translateY(${contentSpring.y.get()}px)`
      ),
    },
    backdropSpring,
    contentSpring,
  };
}

/**
 * Hook for curtain/wipe transitions
 * Creates a sweeping reveal effect
 */
export function useCurtainTransition(
  isRevealed: boolean = false,
  direction: 'horizontal' | 'vertical' = 'horizontal'
) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const spring = useSpring({
    from: { progress: 0 },
    to: { progress: isRevealed ? 100 : 0 },
    config: SPRINGS.gentle,
    immediate: reducedMotion,
  });

  const clipPath = spring.progress.to((p) => {
    if (direction === 'horizontal') {
      return `inset(0 ${100 - p}% 0 0)`;
    }
    return `inset(0 0 ${100 - p}% 0)`;
  });

  return {
    style: {
      clipPath,
    },
    spring,
  };
}

/**
 * Hook for staggered content reveal on screen enter
 */
export function useStaggeredReveal(
  isVisible: boolean = true,
  itemCount: number = 1,
  options?: {
    staggerDelay?: number;
    direction?: 'up' | 'down';
  }
) {
  const { staggerDelay = 50, direction = 'up' } = options ?? {};
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const multiplier = useSettingsStore(selectAnimationMultiplier);

  const items = Array.from({ length: itemCount }, (_, i) => i);

  const transitions = useTransition(isVisible ? items : [], {
    from: {
      opacity: 0,
      y: direction === 'up' ? 30 : -30,
    },
    enter: {
      opacity: 1,
      y: 0,
    },
    leave: {
      opacity: 0,
      y: direction === 'up' ? -30 : 30,
    },
    trail: reducedMotion ? 0 : staggerDelay * multiplier,
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  });

  return {
    transitions,
    getItemStyle: (index: number) => {
      const item = transitions[index];
      if (!item) return { opacity: 1, transform: 'translateY(0)' };
      return {
        opacity: item.opacity,
        transform: item.y?.to((y: number) => `translateY(${y}px)`),
      };
    },
  };
}

/**
 * Hook for screen shake effect
 * Used for impactful moments like yakuman
 */
export function useScreenShake() {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [isShaking, setIsShaking] = useState(false);

  const spring = useSpring({
    from: { x: 0, y: 0 },
    to: isShaking
      ? [
          { x: -5, y: 2 },
          { x: 5, y: -2 },
          { x: -3, y: 1 },
          { x: 3, y: -1 },
          { x: 0, y: 0 },
        ]
      : { x: 0, y: 0 },
    config: { tension: 500, friction: 5 },
    immediate: reducedMotion,
    onRest: () => setIsShaking(false),
  });

  const trigger = useCallback(
    (_intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (!reducedMotion) {
        setIsShaking(true);
      }
    },
    [reducedMotion]
  );

  return {
    style: {
      transform: spring.x.to(
        (x) => `translate(${x}px, ${spring.y.get()}px)`
      ),
    },
    spring,
    trigger,
    isShaking,
  };
}
