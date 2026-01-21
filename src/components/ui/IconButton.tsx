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
const variantStyles: Record<IconButtonVariant, { base: string; active: string }> = {
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
  Settings: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),

  /** Speaker with sound waves for volume on */
  VolumeOn: () => (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  ),

  /** Speaker with X for volume off/mute */
  VolumeOff: () => (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  ),

  /** X mark for close/dismiss */
  Close: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),

  /** Hamburger menu icon */
  Menu: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),

  /** Circular arrows for refresh/reload */
  Refresh: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),
}

// =============================================================================
// EXPORTS
// =============================================================================

export default IconButton
