/**
 * Toggle Component
 *
 * Reusable toggle switch for boolean settings.
 * Styled to match the game's visual theme.
 */

import React from 'react'

export interface ToggleProps {
  /** Current checked state */
  checked: boolean
  /** Change handler */
  onChange: (checked: boolean) => void
  /** Label text */
  label?: string
  /** Optional description text */
  description?: string
  /** Whether the toggle is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Toggle - Switch toggle for boolean values
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}: ToggleProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault()
      onChange(!checked)
    }
  }

  return (
    <div className={`flex items-center justify-between py-2 ${className}`}>
      {/* Label and description */}
      {(label || description) && (
        <div className="flex-1 mr-4">
          {label && (
            <p className={`text-[var(--color-beige-white)] ${disabled ? 'opacity-50' : ''}`}>
              {label}
            </p>
          )}
          {description && (
            <p className={`text-sm text-[var(--color-beige-white)] opacity-60 ${disabled ? 'opacity-40' : ''}`}>
              {description}
            </p>
          )}
        </div>
      )}

      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative w-12 h-6 rounded-full
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-golden-yellow focus:ring-opacity-50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked
            ? 'bg-[var(--color-vibrant-orange)]'
            : 'bg-[var(--color-dark-forest)]'
          }
        `}
      >
        {/* Toggle knob */}
        <span
          className={`
            absolute top-1 w-4 h-4 rounded-full
            bg-[var(--color-beige-white)]
            shadow-md
            transition-transform duration-200
            ${checked ? 'translate-x-7' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  )
}

export default Toggle
