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
        className="group relative flex h-11 w-12 shrink-0 items-center justify-center rounded-full focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {/* The button keeps a 44px touch target; the visible track stays a
            pill, with a border so the off state reads on a dark panel. */}
        <span
          aria-hidden="true"
          className={`
            relative block h-6 w-12 rounded-full border
            transition-colors duration-200
            group-focus-visible:ring-2 group-focus-visible:ring-[var(--color-golden-yellow)]
            ${checked
              ? 'border-[var(--color-vibrant-orange)] bg-[var(--color-vibrant-orange)]'
              : 'border-[var(--color-metallic-gold)]/50 bg-black/30'
            }
          `}
        >
          {/* Toggle knob */}
          <span
            className={`
              absolute left-0 top-[3px] h-4 w-4 rounded-full
              bg-[var(--color-beige-white)]
              shadow-md
              transition-transform duration-200
              ${checked ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </span>
      </button>
    </div>
  )
}

export default Toggle
