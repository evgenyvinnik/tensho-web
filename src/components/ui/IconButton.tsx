/**
 * IconButton Component for Tensho Mahjong Roguelike
 *
 * A circular icon-only button for actions like settings, audio toggle, close dialogs, etc.
 * Provides consistent styling, spring animations, and full accessibility support.
 *
 * @module components/ui/IconButton
 *
 * @example
 * ```tsx
 * // Settings button with default styling
 * <IconButton icon={<Icons.Settings />} ariaLabel="Open settings" onClick={handleSettings} />
 *
 * // Active state toggle (e.g., audio mute)
 * <IconButton
 *   icon={isMuted ? <Icons.VolumeOff /> : <Icons.VolumeOn />}
 *   ariaLabel={isMuted ? "Unmute" : "Mute"}
 *   isActive={isMuted}
 *   onClick={toggleMute}
 * />
 *
 * // Primary variant with large size
 * <IconButton icon={<Icons.Refresh />} ariaLabel="Refresh" variant="primary" size="lg" />
 * ```
 */

import React, { useState, useCallback } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { VolumeMutedIcon } from './Icons'
import { ControlIcon } from './ControlIcon'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Available icon button visual variants
 * - `default`: Dark background, standard for most actions
 * - `primary`: Orange background, high visibility
 * - `secondary`: Green background, medium visibility
 * - `ghost`: Transparent background, minimal visual footprint
 */
export type IconButtonVariant = 'default' | 'primary' | 'secondary' | 'ghost'

/**
 * Available icon button sizes
 * - `sm`: 36px, compact for toolbars
 * - `md`: 44px, meets touch target requirements (default)
 * - `lg`: 52px, prominent actions
 */
export type IconButtonSize = 'sm' | 'md' | 'lg'

/**
 * Props for the IconButton component
 */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon element to display (SVG or React element) */
  icon: React.ReactNode
  /** Accessible label (required for icon-only buttons) */
  ariaLabel: string
  /** Visual style variant */
  variant?: IconButtonVariant
  /** Size preset */
  size?: IconButtonSize
  /** Whether button is in active/selected state */
  isActive?: boolean
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// STYLE CONFIGURATIONS
// =============================================================================

/**
 * Size-based style configurations
 */
const sizeStyles: Record<IconButtonSize, { button: string; icon: string }> = {
  sm: {
    button: 'min-w-[36px] min-h-[36px] p-2',
    icon: 'w-4 h-4',
  },
  md: {
    button: 'min-w-[44px] min-h-[44px] p-3',
    icon: 'w-5 h-5',
  },
  lg: {
    button: 'min-w-[52px] min-h-[52px] p-3',
    icon: 'w-6 h-6',
  },
}

/**
 * Variant-based style configurations with base and active states
 */
const variantStyles: Record<
  IconButtonVariant,
  { base: string; active: string }
> = {
  default: {
    base: `
      bg-[var(--color-dark-forest)]
      hover:bg-[var(--color-forest-green)]
      border-2 border-[var(--color-saddle-brown)]
      hover:border-[var(--color-metallic-gold)]
      text-[var(--color-beige-white)]
    `,
    active: `
      bg-[var(--color-vibrant-orange)]
      border-[var(--color-golden-yellow)]
    `,
  },
  primary: {
    base: `
      bg-[var(--color-vibrant-orange)]
      hover:bg-[var(--color-deep-orange)]
      border-2 border-[var(--color-golden-yellow)]
      text-[var(--color-beige-white)]
    `,
    active: `
      bg-[var(--color-deep-orange)]
    `,
  },
  secondary: {
    base: `
      bg-[var(--color-forest-green)]
      hover:bg-[var(--color-dark-forest)]
      border-2 border-[var(--color-metallic-gold)]
      text-[var(--color-beige-white)]
    `,
    active: `
      bg-[var(--color-dark-forest)]
      border-[var(--color-golden-yellow)]
    `,
  },
  ghost: {
    base: `
      bg-transparent
      hover:bg-[var(--color-forest-green)]
      border-2 border-transparent
      hover:border-[var(--color-metallic-gold)]
      text-[var(--color-beige-white)]
    `,
    active: `
      bg-[var(--color-forest-green)]
      border-[var(--color-metallic-gold)]
    `,
  },
}

// =============================================================================
// ANIMATED COMPONENTS
// =============================================================================

const AnimatedButton = animated('button')

// =============================================================================
// ICON BUTTON COMPONENT
// =============================================================================

/**
 * Circular icon button with game-themed styling and spring animations.
 *
 * Features:
 * - Four visual variants (default, primary, secondary, ghost)
 * - Three size presets (sm, md, lg)
 * - Active state support for toggles
 * - Spring-based press animation
 * - Full accessibility with aria-label and aria-pressed
 *
 * @param props - IconButton properties
 * @returns Rendered icon button element
 */
export function IconButton({
  icon,
  ariaLabel,
  variant = 'default',
  size = 'md',
  isActive = false,
  className = '',
  disabled = false,
  onClick,
  ...props
}: IconButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  // Spring animation for press effect
  const spring = useSpring({
    scale: isPressed ? 0.95 : 1,
    config: { tension: 300, friction: 10 },
  })

  // Event handlers
  const handlePressStart = useCallback(() => {
    if (!disabled) setIsPressed(true)
  }, [disabled])

  const handlePressEnd = useCallback(() => {
    setIsPressed(false)
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && onClick) {
        onClick(e)
      }
    },
    [disabled, onClick]
  )

  const styles = variantStyles[variant]
  const sizes = sizeStyles[size]

  return (
    <AnimatedButton
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      className={`
        rounded-full
        transition-all duration-200
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-golden-yellow focus:ring-opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizes.button}
        ${styles.base}
        ${isActive ? styles.active : ''}
        ${className}
      `.trim()}
      style={{
        transform: spring.scale.to((s) => `scale(${s})`),
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      {...props}
    >
      <span className={sizes.icon}>{icon}</span>
    </AnimatedButton>
  )
}

// =============================================================================
// COMMON ICON COMPONENTS
// =============================================================================

/**
 * Pre-built SVG icons for common actions.
 * Use these with IconButton for consistent styling.
 *
 * @example
 * ```tsx
 * <IconButton icon={<Icons.Settings />} ariaLabel="Settings" />
 * ```
 */
export const Icons = {
  /** Gear/cog icon for settings */
  Settings: () => <ControlIcon name="settings" size="100%" />,

  /** Speaker with sound waves for volume on */
  VolumeOn: () => <ControlIcon name="sound" size="100%" />,

  /** Speaker with X for volume off/mute */
  VolumeOff: () => <VolumeMutedIcon className="w-full h-full" size="100%" />,

  /** X mark for close/dismiss */
  Close: () => <ControlIcon name="close" size="100%" />,

  /** Text fallback for menu navigation */
  Menu: () => (
    <span
      aria-hidden="true"
      className="inline-flex h-full w-full items-center justify-center text-[10px] leading-none"
    >
      Menu
    </span>
  ),

  /** Circular arrows for refresh/reload */
  Refresh: () => <ControlIcon name="redraw" size="100%" />,
}

// =============================================================================
// EXPORTS
// =============================================================================

export default IconButton
