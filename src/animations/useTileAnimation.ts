/**
 * Tile Animation Hooks for Tensho Mahjong Roguelike
 *
 * Provides animation primitives for tile interactions using React Spring.
 * All animations respect reduced motion preferences.
 */

import { useSpring, config, to } from '@react-spring/web';
import { useCallback, useState } from 'react';
import { SPRINGS, OFFSETS, SCALES } from './constants';
import { useSettingsStore, selectAnimationMultiplier } from '../stores/settingsStore';

/**
 * Get adjusted spring config based on animation speed setting
 */
function useAdjustedSpring(baseConfig: typeof SPRINGS.snappy) {
  const multiplier = useSettingsStore(selectAnimationMultiplier);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  if (reducedMotion) {
    return { ...config.stiff, duration: 0 };
  }

  // Adjust tension based on speed (higher multiplier = slower = lower tension)
  const adjustedTension = baseConfig.tension / multiplier;
  return {
    tension: adjustedTension,
    friction: baseConfig.friction,
  };
}

/**
 * Hook for tile draw animation
 * Animates a tile sliding in from the right with a fade effect
 */
export function useTileDrawAnimation() {
  const springConfig = useAdjustedSpring(SPRINGS.snappy);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const [spring, api] = useSpring(() => ({
    from: {
      x: 100,
      opacity: 0,
      scale: 0.8,
    },
    to: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    config: springConfig,
    immediate: reducedMotion,
  }));

  const trigger = useCallback(() => {
    api.start({
      from: {
        x: 100,
        opacity: 0,
        scale: 0.8,
      },
      to: {
        x: 0,
        opacity: 1,
        scale: 1,
      },
    });
  }, [api]);

  const reset = useCallback(() => {
    api.set({
      x: 0,
      opacity: 1,
      scale: 1,
    });
  }, [api]);

  return {
    style: {
      transform: spring.x.to((x) => `translateX(${x}px)`),
      opacity: spring.opacity,
      scale: spring.scale,
    },
    spring,
    trigger,
    reset,
  };
}

/**
 * Hook for tile discard animation
 * Animates a tile sliding out and shrinking
 */
export function useTileDiscardAnimation() {
  const springConfig = useAdjustedSpring(SPRINGS.snappy);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const [spring, api] = useSpring(() => ({
    from: {
      y: 0,
      opacity: 1,
      scale: 1,
    },
    config: springConfig,
    immediate: reducedMotion,
  }));

  const trigger = useCallback(() => {
    return api.start({
      to: {
        y: -50,
        opacity: 0,
        scale: 0.6,
      },
    });
  }, [api]);

  const reset = useCallback(() => {
    api.set({
      y: 0,
      opacity: 1,
      scale: 1,
    });
  }, [api]);

  return {
    style: {
      transform: to(
        [spring.y, spring.scale],
        (y, scale) => `translateY(${y}px) scale(${scale})`
      ),
      opacity: spring.opacity,
    },
    spring,
    trigger,
    reset,
  };
}

/**
 * Hook for tile selection animation
 * Bounce/lift effect when a tile is selected
 */
export function useTileSelectAnimation(isSelected: boolean = false) {
  const springConfig = useAdjustedSpring(SPRINGS.bouncy);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const spring = useSpring({
    y: isSelected ? OFFSETS.lift : 0,
    scale: isSelected ? SCALES.pop : SCALES.normal,
    config: springConfig,
    immediate: reducedMotion,
  });

  return {
    style: {
      transform: to(
        [spring.y, spring.scale],
        (y, scale) => `translateY(${y}px) scale(${scale})`
      ),
    },
    spring,
  };
}

/**
 * Hook for tile shake animation
 * Shake effect for invalid actions
 */
export function useTileShakeAnimation() {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [isShaking, setIsShaking] = useState(false);

  const spring = useSpring({
    x: isShaking ? 1 : 0,
    config: { tension: 400, friction: 5 },
    immediate: reducedMotion,
    onRest: () => setIsShaking(false),
  });

  const trigger = useCallback(() => {
    if (!reducedMotion) {
      setIsShaking(true);
    }
  }, [reducedMotion]);

  // Create shake transform from spring value
  const shakeTransform = spring.x.to((value) => {
    if (value === 0) return 'translateX(0px)';
    // Create a shake pattern
    const shake = Math.sin(value * Math.PI * 8) * 5;
    return `translateX(${shake}px)`;
  });

  return {
    style: {
      transform: shakeTransform,
    },
    spring,
    trigger,
    isShaking,
  };
}

/**
 * Hook for tile glow animation
 * Pulsing glow effect for winning tiles or special highlights
 */
export function useTileGlowAnimation(isGlowing: boolean = false) {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const spring = useSpring({
    loop: isGlowing && !reducedMotion,
    from: { glowIntensity: 0.5 },
    to: isGlowing ? { glowIntensity: 1 } : { glowIntensity: 0 },
    config: SPRINGS.gentle,
    immediate: reducedMotion && !isGlowing,
    reverse: isGlowing,
  });

  return {
    style: {
      boxShadow: spring.glowIntensity.to(
        (i) => `0 0 ${i * 20}px ${i * 10}px rgba(255, 213, 79, ${i * 0.6})`
      ),
    },
    spring,
  };
}

/**
 * Hook for tile hover animation
 * Subtle lift effect on hover
 */
export function useTileHoverAnimation() {
  const springConfig = useAdjustedSpring(SPRINGS.snappy);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [isHovered, setIsHovered] = useState(false);

  const spring = useSpring({
    y: isHovered ? -4 : 0,
    scale: isHovered ? 1.02 : 1,
    config: springConfig,
    immediate: reducedMotion,
  });

  const handlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onTouchStart: () => setIsHovered(true),
    onTouchEnd: () => setIsHovered(false),
  };

  return {
    style: {
      transform: to(
        [spring.y, spring.scale],
        (y, scale) => `translateY(${y}px) scale(${scale})`
      ),
    },
    spring,
    isHovered,
    handlers,
  };
}

/**
 * Hook for tile press animation
 * Press down effect for touch feedback
 */
export function useTilePressAnimation() {
  const springConfig = useAdjustedSpring(SPRINGS.stiff);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [isPressed, setIsPressed] = useState(false);

  const spring = useSpring({
    scale: isPressed ? SCALES.pressed : SCALES.normal,
    config: springConfig,
    immediate: reducedMotion,
  });

  const handlers = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false),
  };

  return {
    style: {
      transform: spring.scale.to((s) => `scale(${s})`),
    },
    spring,
    isPressed,
    handlers,
  };
}

/**
 * Combined hook for all tile interactions
 * Manages hover, press, select, and glow states together
 */
export function useTileInteractionAnimation(options: {
  isSelected?: boolean;
  isGlowing?: boolean;
  disabled?: boolean;
}) {
  const { isSelected = false, isGlowing = false, disabled = false } = options;
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const springConfig = useAdjustedSpring(SPRINGS.snappy);

  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Combined spring for all transformations
  const spring = useSpring({
    y: isSelected ? OFFSETS.lift : isHovered && !disabled ? -4 : 0,
    scale: isPressed && !disabled
      ? SCALES.pressed
      : isSelected
        ? SCALES.pop
        : isHovered && !disabled
          ? 1.02
          : SCALES.normal,
    glowIntensity: isGlowing ? 1 : 0,
    config: springConfig,
    immediate: reducedMotion,
  });

  const handlers = disabled
    ? {}
    : {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => {
          setIsHovered(false);
          setIsPressed(false);
        },
        onMouseDown: () => setIsPressed(true),
        onMouseUp: () => setIsPressed(false),
        onTouchStart: () => {
          setIsHovered(true);
          setIsPressed(true);
        },
        onTouchEnd: () => {
          setIsHovered(false);
          setIsPressed(false);
        },
      };

  return {
    style: {
      transform: to(
        [spring.y, spring.scale],
        (y, scale) => `translateY(${y}px) scale(${scale})`
      ),
      boxShadow: spring.glowIntensity.to(
        (i) => `0 0 ${i * 20}px ${i * 10}px rgba(255, 213, 79, ${i * 0.6})`
      ),
    },
    spring,
    handlers,
    isHovered,
    isPressed,
  };
}

/**
 * Hook for drag-to-discard animation
 * Tracks drag state and animates tile during drag
 * Position follows finger immediately for responsive feel
 */
export function useTileDragAnimation() {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Visual effects spring (scale, opacity, glow) - these animate smoothly
  const visualSpring = useSpring({
    scale: isDragging ? 1.25 : 1,
    opacity: isDragging ? 0.95 : 1,
    shadowOpacity: isDragging ? 0.6 : 0,
    lift: isDragging ? -8 : 0, // Extra lift effect
    config: { tension: 300, friction: 20 },
    immediate: reducedMotion,
  });

  // Position spring - immediate during drag, bouncy on release
  const positionSpring = useSpring({
    x: isDragging ? dragOffset.x : 0,
    y: isDragging ? dragOffset.y : 0,
    rotate: isDragging ? Math.max(-20, Math.min(20, dragOffset.x / 10)) : 0,
    // Bouncy snap-back on release
    config: isDragging
      ? { tension: 500, friction: 30 }
      : { tension: 400, friction: 15 }, // Bouncy return
    // Position follows finger immediately during drag
    immediate: (key: string) => isDragging && (key === 'x' || key === 'y'),
  });

  const startDrag = useCallback(() => {
    setIsDragging(true);
  }, []);

  const updateDrag = useCallback((x: number, y: number) => {
    setDragOffset({ x, y });
  }, []);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  return {
    style: {
      // Use proper interpolation with to() to combine all animated values reactively
      transform: to(
        [positionSpring.x, positionSpring.y, positionSpring.rotate, visualSpring.scale, visualSpring.lift],
        (x, y, rotate, scale, lift) =>
          `translate(${x}px, ${y + lift}px) scale(${scale}) rotate(${rotate}deg)`
      ),
      opacity: visualSpring.opacity,
      boxShadow: visualSpring.shadowOpacity.to(
        (o) => `0 ${12 + o * 20}px ${24 + o * 32}px rgba(0, 0, 0, ${o * 0.7}), 0 0 ${o * 30}px rgba(255, 87, 34, ${o * 0.3})`
      ),
    },
    // Also expose individual springs for advanced usage
    positionSpring,
    visualSpring,
    isDragging,
    startDrag,
    updateDrag,
    endDrag,
  };
}
