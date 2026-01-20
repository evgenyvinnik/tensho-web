/**
 * AnimatedTile Component for Tensho Mahjong Roguelike
 *
 * Wrapper component combining TileImage with animations.
 * Integrates tile animations with hover, press, select, and glow effects.
 */

import React, { useCallback, useRef } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { Tile } from '../../core/Tile';
import { TileImage, TileSize } from './TileImage';
import { tileSizes } from '../../styles/theme';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  useTileInteractionAnimation,
  useTileShakeAnimation,
  useTileDragAnimation,
} from '../../animations/useTileAnimation';
import { SPRINGS, ANIMATION_COLORS } from '../../animations/constants';

export interface AnimatedTileProps {
  /** The tile to display */
  tile: Tile;
  /** Size of the tile */
  size?: TileSize;
  /** Whether the tile is selected */
  selected?: boolean;
  /** Whether the tile is highlighted (e.g., for hints) */
  highlighted?: boolean;
  /** Whether the tile is glowing (e.g., winning tile) */
  glowing?: boolean;
  /** Whether the tile is disabled */
  disabled?: boolean;
  /** Whether to show face-down */
  faceDown?: boolean;
  /** Whether dragging is enabled */
  draggable?: boolean;
  /** Click handler */
  onClick?: (tile: Tile) => void;
  /** Drag start handler */
  onDragStart?: (tile: Tile) => void;
  /** Drag end handler */
  onDragEnd?: (tile: Tile, position: { x: number; y: number }) => void;
  /** Invalid action handler (triggers shake) */
  onInvalidAction?: () => void;
  /** Animation state for entering/exiting */
  animationState?: 'entering' | 'idle' | 'exiting';
  /** Delay for enter animation */
  enterDelay?: number;
  /** Additional CSS class */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * AnimatedTile component
 * Wraps TileImage with comprehensive animations
 */
export const AnimatedTile: React.FC<AnimatedTileProps> = ({
  tile,
  size = 'medium',
  selected = false,
  highlighted = false,
  glowing = false,
  disabled = false,
  faceDown = false,
  draggable = false,
  onClick,
  onDragStart,
  onDragEnd,
  onInvalidAction,
  animationState = 'idle',
  enterDelay = 0,
  className = '',
  style,
}) => {
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);
  const dimensions = tileSizes[size];
  const elementRef = useRef<HTMLDivElement>(null);

  // Interaction animations (hover, press, select, glow)
  const {
    style: interactionStyle,
    handlers: interactionHandlers,
  } = useTileInteractionAnimation({
    isSelected: selected,
    isGlowing: glowing,
    disabled,
  });

  // Shake animation for invalid actions
  const {
    style: shakeStyle,
    trigger: triggerShake,
  } = useTileShakeAnimation();

  // Drag animation
  const {
    style: dragStyle,
    isDragging,
    startDrag,
    updateDrag,
    endDrag,
  } = useTileDragAnimation();

  // Enter/exit animation spring
  const enterExitSpring = useSpring({
    from: {
      opacity: 0,
      x: animationState === 'entering' ? 100 : 0,
      scale: 0.8,
    },
    to: {
      opacity: animationState === 'exiting' ? 0 : 1,
      x: animationState === 'exiting' ? -50 : 0,
      scale: animationState === 'exiting' ? 0.6 : 1,
    },
    delay: animationState === 'entering' && !reducedMotion ? enterDelay : 0,
    config: SPRINGS.snappy,
    immediate: reducedMotion,
  });

  // Handle click
  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick(tile);
    }
  }, [disabled, onClick, tile]);

  // Handle invalid action (exposed via ref or callback)
  const handleInvalidAction = useCallback(() => {
    triggerShake();
    onInvalidAction?.();
  }, [triggerShake, onInvalidAction]);

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!draggable || disabled) return;

      e.preventDefault();
      startDrag();
      onDragStart?.(tile);
    },
    [draggable, disabled, startDrag, onDragStart, tile]
  );

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        updateDrag(clientX - startX, clientY - startY);
      }
    },
    [isDragging, updateDrag]
  );

  const handleDragEnd = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

      endDrag();
      onDragEnd?.(tile, { x: clientX, y: clientY });
    },
    [isDragging, endDrag, onDragEnd, tile]
  );

  // Set up global drag listeners
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Combine all transforms
  const combinedStyle = {
    ...style,
    width: dimensions.width,
    height: dimensions.height,
    transform: enterExitSpring.x.to((x) => {
      const interactionTransform = interactionStyle.transform?.get?.() ?? '';
      const shakeTransform = shakeStyle.transform?.get?.() ?? '';
      const dragTransform = isDragging ? dragStyle.transform?.get?.() ?? '' : '';
      const enterExitTransform = `translateX(${x}px) scale(${enterExitSpring.scale.get()})`;

      // Only apply the most relevant transform to avoid conflicts
      if (isDragging) return dragTransform;
      if (shakeTransform && shakeTransform !== 'translateX(0px)') return shakeTransform;
      return `${enterExitTransform} ${interactionTransform}`;
    }),
    opacity: enterExitSpring.opacity,
    boxShadow: interactionStyle.boxShadow,
    cursor: disabled ? 'not-allowed' : draggable ? 'grab' : onClick ? 'pointer' : 'default',
  };

  return (
    <animated.div
      ref={elementRef}
      className={`relative inline-block ${className}`}
      style={combinedStyle}
      onClick={handleClick}
      onMouseDown={draggable ? handleDragStart : undefined}
      onTouchStart={draggable ? handleDragStart : undefined}
      {...(!draggable ? interactionHandlers : {})}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-pressed={onClick ? selected : undefined}
      aria-disabled={disabled}
    >
      <TileImage
        tile={tile}
        size={size}
        selected={selected}
        highlighted={highlighted}
        disabled={disabled}
        faceDown={faceDown}
        className="w-full h-full"
      />

      {/* Glow overlay */}
      {glowing && (
        <animated.div
          className="absolute inset-0 pointer-events-none rounded"
          style={{
            boxShadow: `0 0 20px 10px ${ANIMATION_COLORS.gold}`,
            opacity: 0.6,
          }}
        />
      )}

      {/* Drag indicator */}
      {isDragging && (
        <div
          className="absolute inset-0 pointer-events-none rounded"
          style={{
            border: `2px dashed ${ANIMATION_COLORS.orange}`,
            backgroundColor: `${ANIMATION_COLORS.orange}22`,
          }}
        />
      )}
    </animated.div>
  );
};

/**
 * AnimatedTileRow component
 * Row of animated tiles with staggered animations
 */
export interface AnimatedTileRowProps {
  tiles: Tile[];
  size?: TileSize;
  selectedIds?: Set<string>;
  highlightedIds?: Set<string>;
  glowingIds?: Set<string>;
  onTileClick?: (tile: Tile) => void;
  overlap?: boolean;
  staggerDelay?: number;
  className?: string;
}

export const AnimatedTileRow: React.FC<AnimatedTileRowProps> = ({
  tiles,
  size = 'medium',
  selectedIds = new Set(),
  highlightedIds = new Set(),
  glowingIds = new Set(),
  onTileClick,
  overlap = false,
  staggerDelay = 50,
  className = '',
}) => {
  const dimensions = tileSizes[size];
  const overlapAmount = overlap ? Math.floor(dimensions.width * 0.3) : 0;

  return (
    <div
      className={`flex items-end ${className}`}
      role="group"
      aria-label="Tile row"
    >
      {tiles.map((tile, index) => (
        <div
          key={tile.id}
          style={{
            marginLeft: index > 0 && overlap ? -overlapAmount : 0,
            zIndex: index,
          }}
        >
          <AnimatedTile
            tile={tile}
            size={size}
            selected={selectedIds.has(tile.id)}
            highlighted={highlightedIds.has(tile.id)}
            glowing={glowingIds.has(tile.id)}
            onClick={onTileClick}
            animationState="entering"
            enterDelay={index * staggerDelay}
          />
        </div>
      ))}
    </div>
  );
};

export default AnimatedTile;
