/**
 * TableStyleCard Component
 *
 * Displays an individual table style with its name, theme color,
 * modifiers, and unlock status for selection.
 */

import React from 'react'
import { useSpring, animated } from '@react-spring/web'
import type { TableStyleDefinition } from '../../config/tableStyleDefinitions'
import { getCurrentLanguage } from '../../i18n'

const AnimatedDiv = animated('div')

/** Check if current language uses CJK characters */
function isCJKLanguage(): boolean {
  const lang = getCurrentLanguage()
  return lang === 'ja' || lang === 'ko' || lang === 'zh-Hant' || lang === 'zh-Hans'
}

export interface TableStyleCardProps {
  /** Table style definition */
  style: TableStyleDefinition
  /** Whether this style is unlocked */
  isUnlocked: boolean
  /** Whether this style is currently selected */
  isSelected: boolean
  /** Progress toward unlocking (0-1), only used if locked */
  unlockProgress?: number
  /** Click handler */
  onClick: () => void
  /** Animation delay for staggered entrance */
  delay?: number
}

/**
 * TableStyleCard - Displays a table style with visual effects based on theme
 */
export function TableStyleCard({
  style,
  isUnlocked,
  isSelected,
  unlockProgress = 0,
  onClick,
  delay = 0,
}: TableStyleCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const springProps = useSpring({
    from: { opacity: 0, scale: 0.9, y: 20 },
    to: {
      opacity: 1,
      scale: isHovered && isUnlocked ? 1.03 : 1,
      y: isHovered && isUnlocked ? -4 : 0,
    },
    delay,
    config: { tension: 300, friction: 20 },
  })

  // Get benefits and detriments for display
  const benefits = style.startingModifiers.filter((m) => m.isBenefit && m.type !== 'none')
  const detriments = style.startingModifiers.filter((m) => !m.isBenefit)

  return (
    <AnimatedDiv
      className={`
        relative flex-shrink-0 w-full
        bg-[var(--color-dark-forest)] rounded-xl
        border-3 transition-all duration-200
        ${isSelected && isUnlocked ? 'ring-3 ring-[var(--color-golden-yellow)] border-[var(--color-golden-yellow)]' : 'border-[var(--color-saddle-brown)]'}
        ${!isUnlocked ? 'opacity-60 grayscale-[50%]' : 'cursor-pointer hover:shadow-xl'}
        overflow-hidden
      `}
      style={{
        opacity: springProps.opacity,
        transform: springProps.scale.to(
          (s) => `scale(${s}) translateY(${springProps.y.get()}px)`
        ),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={isUnlocked ? onClick : undefined}
      role="button"
      tabIndex={isUnlocked ? 0 : -1}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.key === 'Enter' || e.key === ' ') && isUnlocked) {
          onClick()
        }
      }}
      aria-disabled={!isUnlocked}
    >
      {/* Theme color header strip */}
      <div
        className="h-14 w-full relative overflow-hidden"
        style={{
          backgroundColor: style.themeColor,
          boxShadow: `inset 0 -4px 8px ${style.accentColor}`,
        }}
      >
        {/* Theme pattern overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 30%),
              radial-gradient(circle at 80% 50%, rgba(255,255,255,0.15) 0%, transparent 25%)
            `,
          }}
        />

        {/* Theme label */}
        <div className="absolute top-2 left-3">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: style.accentColor,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            {style.theme}
          </span>
        </div>

        {/* Lock icon for locked styles */}
        {!isUnlocked && (
          <div className="absolute top-2 right-3">
            <span className="text-xl drop-shadow-lg">
              <svg
                className="w-6 h-6 text-white drop-shadow-lg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            </span>
          </div>
        )}

        {/* Selected checkmark */}
        {isSelected && isUnlocked && (
          <div className="absolute top-2 right-3">
            <span className="text-xl text-white drop-shadow-lg">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name row */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-[var(--color-beige-white)]">
            {style.displayName}
          </h3>
          {isCJKLanguage() && (
            <span
              className="text-lg font-decorative"
              style={{ color: style.themeColor }}
            >
              {style.japaneseName}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--color-beige-white)] opacity-70 mb-3 line-clamp-2">
          {style.description}
        </p>

        {/* Modifiers */}
        <div className="space-y-1">
          {benefits.length > 0 && benefits.map((mod, idx) => (
            <div
              key={`benefit-${idx}`}
              className="flex items-center gap-2 text-sm"
            >
              <span className="text-green-400">+</span>
              <span className="text-green-300">{mod.description}</span>
            </div>
          ))}

          {detriments.map((mod, idx) => (
            <div
              key={`detriment-${idx}`}
              className="flex items-center gap-2 text-sm"
            >
              <span className="text-red-400">-</span>
              <span className="text-red-300">{mod.description}</span>
            </div>
          ))}

          {/* No modifiers case */}
          {benefits.length === 0 && detriments.length === 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-metallic-gold)]">*</span>
              <span className="text-[var(--color-beige-white)] opacity-70">
                No special modifiers
              </span>
            </div>
          )}
        </div>

        {/* Unlock condition for locked styles */}
        {!isUnlocked && (
          <div className="mt-4 pt-3 border-t border-[var(--color-saddle-brown)]">
            <div className="flex items-center gap-2 text-xs text-[var(--color-beige-white)] opacity-80">
              <svg
                className="w-4 h-4 text-[var(--color-golden-yellow)]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              <span>{style.unlockCondition.description}</span>
            </div>

            {/* Progress bar */}
            {unlockProgress > 0 && unlockProgress < 1 && (
              <div className="mt-2">
                <div className="h-1.5 bg-[var(--color-dark-forest)] rounded-full overflow-hidden border border-[var(--color-saddle-brown)]">
                  <div
                    className="h-full bg-[var(--color-golden-yellow)] transition-all duration-300"
                    style={{ width: `${unlockProgress * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--color-metallic-gold)] mt-1">
                  {Math.floor(unlockProgress * 100)}% complete
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hover glow effect for unlocked */}
      {isUnlocked && (
        <div
          className={`
            absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            boxShadow: `0 0 20px ${style.themeColor}40, 0 0 40px ${style.themeColor}20`,
          }}
        />
      )}

      {/* Selection indicator glow */}
      {isSelected && isUnlocked && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            boxShadow: `0 0 15px var(--color-golden-yellow), inset 0 0 10px ${style.themeColor}30`,
          }}
        />
      )}
    </AnimatedDiv>
  )
}

export default TableStyleCard
