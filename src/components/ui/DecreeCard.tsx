/**
 * DecreeCard Component
 *
 * Displays a decree with its name, description, cost, rarity, and effect.
 * Supports different display modes: shop view, inventory view, and compact.
 */

import React from 'react'
import { useSpring, animated } from '@react-spring/web'
import { Decree, OwnedDecree, DecreeRarity } from '../../systems/types'
import { DecreeUniqueIcon } from './svg/DecreeIcons'

/**
 * Rarity color mapping
 */
const RARITY_COLORS: Record<DecreeRarity, string> = {
  LocalEdict: 'border-gray-400 bg-gradient-to-b from-gray-500/20 to-gray-600/20',
  RegionalMandate: 'border-green-500 bg-gradient-to-b from-green-500/20 to-green-600/20',
  ImperialDecree: 'border-blue-500 bg-gradient-to-b from-blue-500/20 to-blue-600/20',
  HeavenlyOrdinance: 'border-purple-500 bg-gradient-to-b from-purple-500/20 to-purple-600/20',
}

/**
 * Rarity label mapping
 */
const RARITY_LABELS: Record<DecreeRarity, string> = {
  LocalEdict: 'Common',
  RegionalMandate: 'Uncommon',
  ImperialDecree: 'Rare',
  HeavenlyOrdinance: 'Mythic',
}

/**
 * Rarity icon color mapping
 */
const RARITY_ICON_COLORS: Record<DecreeRarity, string> = {
  LocalEdict: '#9CA3AF', // gray-400
  RegionalMandate: '#22C55E', // green-500
  ImperialDecree: '#3B82F6', // blue-500
  HeavenlyOrdinance: '#A855F7', // purple-500
}

export type DecreeCardMode = 'shop' | 'inventory' | 'compact'

export interface DecreeCardProps {
  decree: Decree | OwnedDecree
  mode?: DecreeCardMode
  canAfford?: boolean
  isSelected?: boolean
  isDebuffed?: boolean
  onPurchase?: () => void
  onSell?: () => void
  onClick?: () => void
  className?: string
}

/**
 * DecreeCard - Displays a decree with visual effects based on rarity
 */
export function DecreeCard({
  decree,
  mode = 'shop',
  canAfford = true,
  isSelected = false,
  isDebuffed = false,
  onPurchase,
  onSell,
  onClick,
  className = '',
}: DecreeCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const springProps = useSpring({
    scale: isHovered ? 1.02 : 1,
    y: isHovered ? -4 : 0,
    config: { tension: 300, friction: 20 },
  })

  const isOwned = 'acquiredRound' in decree
  const sellValue = decree.sellValue ?? Math.floor(decree.cost / 2)

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (mode === 'shop' && canAfford && onPurchase) {
      onPurchase()
    }
  }

  const cardWidth = mode === 'compact' ? 'w-24' : 'w-36'
  const cardHeight = mode === 'compact' ? 'h-32' : 'h-48'

  return (
    <animated.div
      className={`
        relative flex-shrink-0 ${cardWidth} ${cardHeight}
        bg-[var(--color-dark-forest)] rounded-lg
        border-2 ${RARITY_COLORS[decree.rarity]}
        ${isSelected ? 'ring-2 ring-[var(--color-golden-yellow)]' : ''}
        ${isDebuffed ? 'opacity-50 grayscale' : ''}
        cursor-pointer transition-shadow
        hover:shadow-lg
        ${className}
      `}
      style={{
        transform: springProps.scale.to(
          (s) => `scale(${s}) translateY(${springProps.y.get()}px)`
        ),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick()
        }
      }}
    >
      {/* Unique decree icon */}
      <div className="absolute top-1 left-1">
        <DecreeUniqueIcon
          decreeId={decree.id}
          size={mode === 'compact' ? 20 : 28}
          color={RARITY_ICON_COLORS[decree.rarity]}
        />
      </div>

      {/* Rarity indicator */}
      <div className="absolute top-1 right-1">
        <span
          className={`text-xs font-bold px-1 rounded ${
            decree.rarity === 'HeavenlyOrdinance'
              ? 'text-purple-300'
              : decree.rarity === 'ImperialDecree'
                ? 'text-blue-300'
                : decree.rarity === 'RegionalMandate'
                  ? 'text-green-300'
                  : 'text-gray-300'
          }`}
        >
          {mode !== 'compact' && RARITY_LABELS[decree.rarity]}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full pt-7 pb-2 px-2">
        {/* Name */}
        <p
          className={`text-[var(--color-beige-white)] font-bold text-center ${
            mode === 'compact' ? 'text-xs' : 'text-sm'
          } line-clamp-2`}
        >
          {decree.name}
        </p>

        {/* Description */}
        {mode !== 'compact' && (
          <p className="text-xs text-[var(--color-beige-white)] opacity-70 text-center mt-1 flex-1 line-clamp-3">
            {decree.description}
          </p>
        )}

        {/* Sticker indicator */}
        {decree.sticker && (
          <div className="text-center">
            <span
              className={`text-xs px-1 rounded ${
                decree.sticker.type === 'Eternal'
                  ? 'bg-yellow-500/30 text-yellow-300'
                  : decree.sticker.type === 'Perishable'
                    ? 'bg-red-500/30 text-red-300'
                    : 'bg-orange-500/30 text-orange-300'
              }`}
            >
              {decree.sticker.type}
              {decree.sticker.roundsRemaining !== undefined &&
                ` (${decree.sticker.roundsRemaining})`}
            </span>
          </div>
        )}

        {/* Scaling value for owned decrees */}
        {isOwned && (decree as OwnedDecree).scalingValue !== undefined && (
          <p className="text-xs text-[var(--color-golden-yellow)] text-center">
            +{((decree as OwnedDecree).scalingValue! * 100).toFixed(0)}%
          </p>
        )}

        {/* Action button */}
        <div className="mt-auto">
          {mode === 'shop' && onPurchase && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPurchase()
              }}
              disabled={!canAfford}
              className={`w-full py-1 rounded text-xs font-bold transition-colors ${
                canAfford
                  ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] hover:opacity-90'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              ¥{decree.cost}
            </button>
          )}

          {mode === 'inventory' && onSell && !decree.sticker?.type?.includes('Eternal') && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSell()
              }}
              className="w-full py-1 rounded text-xs font-bold bg-[var(--color-forest-green)] text-[var(--color-beige-white)] hover:opacity-90 transition-colors"
            >
              Sell ¥{sellValue}
            </button>
          )}
        </div>
      </div>

      {/* Debuff overlay */}
      {isDebuffed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
          <span className="text-2xl">🚫</span>
        </div>
      )}

      {/* Flower requirement badge */}
      {decree.flowerRequirement && (
        <div className="absolute bottom-8 right-1">
          <span className="text-xs bg-pink-500/30 text-pink-300 px-1 rounded">
            🌸×{decree.flowerRequirement}
          </span>
        </div>
      )}
    </animated.div>
  )
}

/**
 * DecreeSlot - Empty slot for decree inventory
 */
export interface DecreeSlotProps {
  isLocked?: boolean
  onClick?: () => void
  className?: string
}

export function DecreeSlot({ isLocked = false, onClick, className = '' }: DecreeSlotProps) {
  return (
    <div
      className={`
        flex-shrink-0 w-36 h-48
        bg-[var(--color-dark-forest)] rounded-lg
        border-2 border-dashed
        ${isLocked ? 'border-gray-600 opacity-50' : 'border-[var(--color-metallic-gold)]'}
        flex items-center justify-center
        cursor-pointer hover:bg-[var(--color-forest-green)] transition-colors
        ${className}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          onClick()
        }
      }}
    >
      {isLocked ? (
        <span className="text-2xl">🔒</span>
      ) : (
        <span className="text-2xl text-[var(--color-metallic-gold)]">+</span>
      )}
    </div>
  )
}

export default DecreeCard
