/**
 * BackButton Component
 *
 * Reusable back navigation button used across screens.
 * Provides consistent styling and accessibility.
 */

import React from 'react'
import { useSpring, animated } from '@react-spring/web'

const AnimatedButton = animated('button')

export interface BackButtonProps {
  /** Click handler */
  onClick: () => void
  /** Accessible label */
  ariaLabel?: string
  /** Additional CSS classes */
  className?: string
  /** Whether to animate on mount */
  animate?: boolean
}

/**
 * BackButton - Navigation back button with consistent styling
 */
export function BackButton({
  onClick,
  ariaLabel = 'Back',
  className = '',
  animate = false,
}: BackButtonProps) {
  const [isPressed, setIsPressed] = React.useState(false)

  const spring = useSpring({
    scale: isPressed ? 0.95 : 1,
    config: { tension: 300, friction: 10 },
  })

  return (
    <AnimatedButton
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        p-2 rounded-lg
        hover:bg-[var(--color-forest-green)]
        transition-colors duration-150
        min-w-[44px] min-h-[44px]
        flex items-center justify-center
        text-[var(--color-beige-white)]
        focus:outline-none focus:ring-2 focus:ring-golden-yellow focus:ring-opacity-50
        ${className}
      `.trim()}
      style={{
        transform: animate ? spring.scale.to((s) => `scale(${s})`) : undefined,
      }}
      aria-label={ariaLabel}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </AnimatedButton>
  )
}

export default BackButton
