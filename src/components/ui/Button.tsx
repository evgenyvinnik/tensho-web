/**
 * Button Component for Tensho Mahjong Roguelike
 *
 * A versatile, game-themed button component with multiple variants and sizes.
 * Features spring-based press animations and full accessibility support.
 *
 * @module components/ui/Button
 *
 * @example
 * ```tsx
 * // Primary action button
 * <Button variant="primary" size="lg" onClick={handlePlay}>
 *   Play Game
 * </Button>
 *
 * // Secondary button with custom class
 * <Button variant="secondary" size="md" className="mt-4">
 *   Settings
 * </Button>
 *
 * // Image-based menu button
 * <ImageButton src="/assets/play-button.png" alt="Play" onClick={handleStart} />
 * ```
 */

import React, { useState, useCallback } from 'react'
import { useSpring, animated } from '@react-spring/web'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Available button visual variants
 * - `primary`: Orange background, high visibility for main actions
 * - `secondary`: Green background, for secondary actions
 * - `menu`: Background image support, for menu screens
 * - `game`: Background image with golden text, for in-game actions
 */
export type ButtonVariant = 'primary' | 'secondary' | 'menu' | 'game'

/**
 * Available button sizes
 * - `sm`: 44px height, compact for tight spaces
 * - `md`: 48px height, default size
 * - `lg`: 56px height, prominent actions
 */
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Props for the Button component
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant
  /** Size preset */
  size?: ButtonSize
  /** Custom background image URL for menu/game variants */
  backgroundImage?: string
  /** Enable press animation (default: true) */
  animate?: boolean
  /** Additional CSS classes */
  className?: string
  /** Button content */
  children: React.ReactNode
}

/**
 * Props for the ImageButton component
 */
export interface ImageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Image source URL */
  src: string
  /** Alt text for accessibility */
  alt: string
  /** Fixed width in pixels */
  width?: number
  /** Fixed height in pixels */
  height?: number
  /** Enable press animation (default: true) */
  animate?: boolean
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// STYLE CONFIGURATIONS
// =============================================================================

/**
 * Size-based style configurations
 * All sizes meet 44px minimum touch target requirement
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] min-w-[80px] px-4 py-2 text-sm',
  md: 'min-h-[48px] min-w-[120px] px-6 py-3 text-base',
  lg: 'min-h-[56px] min-w-[160px] px-8 py-4 text-lg',
}

/**
 * Variant-based style configurations
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-vibrant-orange hover:bg-deep-orange
    text-beige-white font-semibold
    shadow-button hover:shadow-lg
    border-2 border-golden-yellow
  `,
  secondary: `
    bg-forest-green hover:bg-dark-forest
    text-beige-white font-semibold
    shadow-button hover:shadow-lg
    border-2 border-metallic-gold
  `,
  menu: `
    bg-cover bg-center bg-no-repeat
    text-beige-white font-bold
    drop-shadow-lg
  `,
  game: `
    bg-cover bg-center bg-no-repeat
    text-golden-yellow font-bold
    drop-shadow-lg
  `,
}

/**
 * Base styles applied to all button variants
 */
const baseStyles = `
  relative
  rounded-lg
  cursor-pointer
  transition-all duration-150
  focus:outline-none focus:ring-2 focus:ring-golden-yellow focus:ring-opacity-50
  disabled:opacity-50 disabled:cursor-not-allowed
  select-none
  font-ui
`

// =============================================================================
// ANIMATED COMPONENTS
// =============================================================================

const AnimatedButton = animated('button')

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

/**
 * Primary button component with game-themed styling and spring animations.
 *
 * Features:
 * - Four visual variants (primary, secondary, menu, game)
 * - Three size presets (sm, md, lg)
 * - Spring-based press animation
 * - Full keyboard and touch support
 * - Accessible focus states
 *
 * @param props - Button properties
 * @returns Rendered button element
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  backgroundImage,
  animate = true,
  className = '',
  disabled = false,
  children,
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false)

  // Spring animation for press effect
  const springProps = useSpring({
    scale: animate && isPressed ? 0.95 : 1,
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

  // Background image style for menu/game variants
  const backgroundStyle = backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}

  return (
    <AnimatedButton
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`.trim()}
      style={{
        ...backgroundStyle,
        transform: springProps.scale.to((s) => `scale(${s})`),
      }}
      disabled={disabled}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onClick={handleClick}
      {...props}
    >
      {children}
    </AnimatedButton>
  )
}

// =============================================================================
// IMAGE BUTTON COMPONENT
// =============================================================================

/**
 * Image-based button for menu screens using asset images as backgrounds.
 *
 * Useful for custom-styled buttons that use sprite/image assets instead of
 * CSS styling. Maintains accessibility with alt text support.
 *
 * @param props - ImageButton properties
 * @returns Rendered image button element
 */
export const ImageButton: React.FC<ImageButtonProps> = ({
  src,
  alt,
  width,
  height,
  animate = true,
  className = '',
  disabled = false,
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false)

  // Spring animation for press effect
  const springProps = useSpring({
    scale: animate && isPressed ? 0.95 : 1,
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

  return (
    <AnimatedButton
      className={`
        relative cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-golden-yellow focus:ring-opacity-50
        disabled:opacity-50 disabled:cursor-not-allowed
        min-w-[44px] min-h-[44px]
        ${className}
      `.trim()}
      style={{
        transform: springProps.scale.to((s) => `scale(${s})`),
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
      }}
      disabled={disabled}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onClick={handleClick}
      {...props}
    >
      <img src={src} alt={alt} className="w-full h-full object-contain pointer-events-none" draggable={false} />
    </AnimatedButton>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Button
