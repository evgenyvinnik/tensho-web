/**
 * Slider Component
 *
 * Reusable slider/range input for volume controls and other numeric values.
 * Styled to match the game's visual theme.
 */


export interface SliderProps {
  /** Current value */
  value: number
  /** Change handler */
  onChange: (value: number) => void
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step increment */
  step?: number
  /** Label text */
  label?: string
  /** Whether to show value display */
  showValue?: boolean
  /** Value format (e.g., '%' for percentage) */
  valueSuffix?: string
  /** Whether the slider is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Slider - Styled range input for numeric values
 */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  valueSuffix = '%',
  disabled = false,
  className = '',
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Label and value display */}
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && (
            <label className={`text-[var(--color-beige-white)] ${disabled ? 'opacity-50' : ''}`}>
              {label}
            </label>
          )}
          {showValue && (
            <span className={`text-[var(--color-golden-yellow)] font-mono font-bold ${disabled ? 'opacity-50' : ''}`}>
              {value}{valueSuffix}
            </span>
          )}
        </div>
      )}

      {/* Slider track */}
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div
          className={`
            absolute w-full h-3 rounded-full
            bg-[var(--color-dark-forest)]
            border border-[var(--color-metallic-gold)]
            ${disabled ? 'opacity-50' : ''}
          `}
        />

        {/* Filled track */}
        <div
          className={`
            absolute h-3 rounded-full
            bg-gradient-to-r from-[var(--color-vibrant-orange)] to-[var(--color-golden-yellow)]
            ${disabled ? 'opacity-50' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />

        {/* Hidden input for accessibility */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute w-full h-6 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label={label}
        />

        {/* Thumb indicator */}
        <div
          className={`
            absolute w-5 h-5 rounded-full
            bg-[var(--color-beige-white)]
            border-2 border-[var(--color-golden-yellow)]
            shadow-lg pointer-events-none
            transition-opacity
            ${disabled ? 'opacity-50' : ''}
          `}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    </div>
  )
}

export default Slider
