/**
 * FlowerTrack Component
 *
 * Displays the player's collected flowers and their bonuses.
 * Shows visual representation of the four flower types and set bonuses.
 */

import React from 'react'
import { useSpring, animated, useTrail } from '@react-spring/web'
import { FlowerVariant, FlowerTile, FlowerSetBonus } from '../../systems/types'

/**
 * Flower variant visual data
 */
const FLOWER_DATA: Record<
  FlowerVariant,
  { emoji: string; color: string; effect: string }
> = {
  Plum: {
    emoji: '🌸',
    color: 'from-pink-400 to-pink-600',
    effect: '+5% per sequence',
  },
  Orchid: {
    emoji: '🌺',
    color: 'from-purple-400 to-purple-600',
    effect: '+5% per honor',
  },
  Chrysanthemum: {
    emoji: '🌼',
    color: 'from-yellow-400 to-yellow-600',
    effect: '+5% per concealed',
  },
  Bamboo: {
    emoji: '🎋',
    color: 'from-green-400 to-green-600',
    effect: '+5% per terminal',
  },
}

/**
 * Order of flowers for display
 */
const FLOWER_ORDER: FlowerVariant[] = ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo']

export interface FlowerTrackProps {
  flowers: FlowerTile[]
  activeBonuses?: FlowerSetBonus[]
  effectiveness?: number
  variant?: 'horizontal' | 'vertical' | 'compact'
  showLabels?: boolean
  showEffects?: boolean
  className?: string
}

/**
 * FlowerTrack - Visual display of collected flowers
 */
export function FlowerTrack({
  flowers,
  activeBonuses = [],
  effectiveness = 1.0,
  variant = 'horizontal',
  showLabels = true,
  showEffects = false,
  className = '',
}: FlowerTrackProps) {
  const collectedTypes = new Set(flowers.map((f) => f.type))

  const trail = useTrail(4, {
    opacity: 1,
    scale: 1,
    from: { opacity: 0, scale: 0.8 },
    config: { tension: 300, friction: 20 },
  })

  const isVertical = variant === 'vertical'
  const isCompact = variant === 'compact'

  return (
    <div
      className={`
        ${isVertical ? 'flex flex-col gap-2' : 'flex gap-2'}
        ${className}
      `}
    >
      {/* Flower slots */}
      <div
        className={`
          flex ${isVertical ? 'flex-col' : 'flex-row'} gap-2
          ${isCompact ? '' : 'p-2 bg-[var(--color-dark-forest)] rounded-lg'}
        `}
      >
        {trail.map((style, index) => {
          const flowerType = FLOWER_ORDER[index]
          const isCollected = collectedTypes.has(flowerType)
          const data = FLOWER_DATA[flowerType]

          return (
            <animated.div
              key={flowerType}
              style={style}
              className={`
                relative flex flex-col items-center justify-center
                ${isCompact ? 'w-10 h-10' : 'w-14 h-14'}
                rounded-lg border-2
                ${
                  isCollected
                    ? `border-[var(--color-golden-yellow)] bg-gradient-to-b ${data.color}`
                    : 'border-gray-600 bg-gray-800/50 opacity-40'
                }
                transition-all duration-300
              `}
              title={`${flowerType}: ${data.effect}`}
            >
              <span className={isCompact ? 'text-lg' : 'text-2xl'}>
                {isCollected ? data.emoji : '❓'}
              </span>

              {showLabels && !isCompact && (
                <span className="text-[8px] text-[var(--color-beige-white)] font-bold mt-1">
                  {flowerType.slice(0, 3).toUpperCase()}
                </span>
              )}

              {/* Effectiveness multiplier badge */}
              {isCollected && effectiveness > 1 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-vibrant-orange)] rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">×{effectiveness}</span>
                </div>
              )}
            </animated.div>
          )
        })}
      </div>

      {/* Effects display */}
      {showEffects && !isCompact && flowers.length > 0 && (
        <div className="flex flex-col gap-1 text-xs">
          {flowers.map((flower) => (
            <div
              key={flower.id}
              className="flex items-center gap-2 text-[var(--color-beige-white)]"
            >
              <span>{FLOWER_DATA[flower.type].emoji}</span>
              <span className="opacity-70">{FLOWER_DATA[flower.type].effect}</span>
              {effectiveness > 1 && (
                <span className="text-[var(--color-golden-yellow)]">
                  (×{effectiveness})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Set bonuses */}
      {!isCompact && activeBonuses.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          {activeBonuses.map((bonus, index) => (
            <SetBonusBadge key={index} bonus={bonus} />
          ))}
        </div>
      )}

      {/* Flower count summary for compact mode */}
      {isCompact && (
        <span className="text-sm text-[var(--color-golden-yellow)] font-bold">
          {flowers.length}/4
        </span>
      )}
    </div>
  )
}

/**
 * Set bonus badge component
 */
interface SetBonusBadgeProps {
  bonus: FlowerSetBonus
}

function SetBonusBadge({ bonus }: SetBonusBadgeProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-[var(--color-dark-forest)] rounded text-xs">
      <span className="text-[var(--color-golden-yellow)] font-bold">
        {bonus.requiredCount}🌸
      </span>
      <span className="text-[var(--color-beige-white)]">
        {bonus.effect.description}
      </span>
    </div>
  )
}

/**
 * FlowerMini - Compact single flower indicator
 */
export interface FlowerMiniProps {
  type: FlowerVariant
  isCollected?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function FlowerMini({
  type,
  isCollected = true,
  size = 'md',
  className = '',
}: FlowerMiniProps) {
  const data = FLOWER_DATA[type]
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-12 h-12 text-2xl',
  }

  return (
    <div
      className={`
        flex items-center justify-center rounded-full
        ${sizeClasses[size]}
        ${
          isCollected
            ? `bg-gradient-to-b ${data.color}`
            : 'bg-gray-800/50 opacity-40'
        }
        ${className}
      `}
      title={`${type}: ${data.effect}`}
    >
      <span>{isCollected ? data.emoji : '❓'}</span>
    </div>
  )
}

/**
 * FlowerProgress - Progress bar showing flowers collected
 */
export interface FlowerProgressProps {
  count: number
  maxCount?: number
  showMilestones?: boolean
  className?: string
}

export function FlowerProgress({
  count,
  maxCount = 4,
  showMilestones = true,
  className = '',
}: FlowerProgressProps) {
  const progressSpring = useSpring({
    width: `${(count / maxCount) * 100}%`,
    config: { tension: 200, friction: 20 },
  })

  return (
    <div className={`relative w-full ${className}`}>
      {/* Background track */}
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        {/* Progress fill */}
        <animated.div
          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 rounded-full"
          style={progressSpring}
        />
      </div>

      {/* Milestones */}
      {showMilestones && (
        <div className="absolute top-0 left-0 right-0 h-3 flex justify-around pointer-events-none">
          {[2, 3, 4].map((milestone) => (
            <div
              key={milestone}
              className={`
                w-1 h-full
                ${count >= milestone ? 'bg-[var(--color-golden-yellow)]' : 'bg-gray-600'}
              `}
              style={{ marginLeft: `${((milestone - 1) / maxCount) * 100}%` }}
            />
          ))}
        </div>
      )}

      {/* Count label */}
      <div className="flex justify-between mt-1 text-xs text-[var(--color-beige-white)]">
        <span>🌸 {count}/{maxCount}</span>
        {count >= 4 && (
          <span className="text-[var(--color-golden-yellow)] font-bold">
            ×2 Effectiveness!
          </span>
        )}
      </div>
    </div>
  )
}

export default FlowerTrack
