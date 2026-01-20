/**
 * Tile Modifier Components
 *
 * Visual components for displaying tile modifiers.
 */

import React from 'react'
import {
  EnhancementType,
  SealType,
  EditionType,
  ENHANCEMENT_DEFINITIONS,
  SEAL_DEFINITIONS,
  EDITION_DEFINITIONS,
} from '../../../core/TileModifier'
import { Tile } from '../../../core/Tile'
import {
  ENHANCEMENT_COLORS,
  SEAL_COLORS,
  EDITION_EFFECTS,
  getEnhancementIcon,
  getSealIcon,
  getEditionIcon,
} from './constants'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for ModifierBadge component
 */
export interface ModifierBadgeProps {
  enhancement?: EnhancementType
  seal?: SealType
  edition?: EditionType
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  className?: string
}

/**
 * Props for ModifierOverlay component
 */
export interface ModifierOverlayProps {
  tile: Tile
  className?: string
}

/**
 * Props for ModifierTooltip component
 */
export interface ModifierTooltipProps {
  tile: Tile
  className?: string
}

/**
 * Props for ModifierRow helper component
 */
export interface ModifierRowProps {
  type: 'enhancement' | 'seal' | 'edition'
  name: string
  japaneseName: string
  description: string
  colors: { bg: string; border: string; text: string }
}

/**
 * Props for ModifierSelector component
 */
export interface ModifierSelectorProps {
  currentEnhancement: EnhancementType
  currentSeal: SealType
  currentEdition: EditionType
  onEnhancementChange?: (enhancement: EnhancementType) => void
  onSealChange?: (seal: SealType) => void
  onEditionChange?: (edition: EditionType) => void
  className?: string
}

// =============================================================================
// HELPER - Icon size classes
// =============================================================================

const iconSizeClasses = {
  small: 'w-3 h-3',
  medium: 'w-4 h-4',
  large: 'w-5 h-5',
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Small badge showing a single modifier type
 */
export function ModifierBadge({
  enhancement,
  seal,
  edition,
  size = 'small',
  showLabel = false,
  className = '',
}: ModifierBadgeProps) {
  const sizeClasses = {
    small: 'w-4 h-4 text-[8px]',
    medium: 'w-6 h-6 text-xs',
    large: 'w-8 h-8 text-sm',
  }

  // Enhancement badge
  if (enhancement && enhancement !== EnhancementType.None) {
    const colors = ENHANCEMENT_COLORS[enhancement]
    const def = ENHANCEMENT_DEFINITIONS[enhancement]
    const IconComponent = getEnhancementIcon(enhancement)

    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${className}`}
        style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text, borderWidth: 1 }}
        title={`${def.name}: ${def.description}`}
      >
        {IconComponent && <IconComponent className={iconSizeClasses[size]} color={colors.text} />}
        {showLabel && <span className="ml-1">{def.name}</span>}
      </div>
    )
  }

  // Seal badge
  if (seal && seal !== SealType.None) {
    const colors = SEAL_COLORS[seal]
    const def = SEAL_DEFINITIONS[seal]
    const IconComponent = getSealIcon(seal)

    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`}
        style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 2 }}
        title={`${def.name}: ${def.description}`}
      >
        {IconComponent && <IconComponent className={iconSizeClasses[size]} color="#FFF" />}
        {showLabel && <span className="ml-1 text-white">{def.name}</span>}
      </div>
    )
  }

  // Edition badge
  if (edition && edition !== EditionType.Base) {
    const def = EDITION_DEFINITIONS[edition]
    const effects = EDITION_EFFECTS[edition]
    const IconComponent = getEditionIcon(edition)

    return (
      <div
        className={`${sizeClasses[size]} rounded flex items-center justify-center ${effects.overlay} ${className}`}
        title={`${def.name}: ${def.description}`}
      >
        {IconComponent && <IconComponent className={iconSizeClasses[size]} />}
        {showLabel && <span className="ml-1">{def.name}</span>}
      </div>
    )
  }

  return null
}

/**
 * Overlay effects applied to modified tiles
 */
export function ModifierOverlay({ tile, className = '' }: ModifierOverlayProps) {
  const effects = EDITION_EFFECTS[tile.edition]
  const sealColors = SEAL_COLORS[tile.seal]

  return (
    <>
      {/* Edition overlay */}
      {tile.edition !== EditionType.Base && (
        <div
          className={`absolute inset-0 pointer-events-none rounded ${effects.overlay} ${effects.className} ${className}`}
        />
      )}

      {/* Seal border */}
      {tile.seal !== SealType.None && (
        <div
          className="absolute inset-0 pointer-events-none rounded"
          style={{
            border: `3px solid ${sealColors.bg}`,
            boxShadow: `0 0 8px ${sealColors.bg}`,
          }}
        />
      )}

      {/* Enhancement indicator (bottom-left corner) */}
      {tile.enhancement !== EnhancementType.None && (
        <div className="absolute bottom-0 left-0 transform translate-y-1/4 -translate-x-1/4">
          <ModifierBadge enhancement={tile.enhancement} size="small" />
        </div>
      )}

      {/* Seal indicator (top-right corner) */}
      {tile.seal !== SealType.None && (
        <div className="absolute top-0 right-0 transform -translate-y-1/4 translate-x-1/4">
          <ModifierBadge seal={tile.seal} size="small" />
        </div>
      )}
    </>
  )
}

/**
 * Helper component for modifier tooltip rows
 */
export function ModifierRow({ name, japaneseName, description, colors }: ModifierRowProps) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }}
        />
        <span className="text-beige-white font-medium text-xs">
          {name} <span className="text-gray-400">({japaneseName})</span>
        </span>
      </div>
      <div className="text-gray-300 text-xs ml-5">{description}</div>
    </div>
  )
}

/**
 * Detailed tooltip showing all modifiers
 */
export function ModifierTooltip({ tile, className = '' }: ModifierTooltipProps) {
  if (!tile.hasModifiers) {
    return null
  }

  return (
    <div
      className={`bg-dark-forest border border-golden-yellow rounded-lg p-3 shadow-xl min-w-[200px] ${className}`}
      style={{ backgroundColor: 'rgba(28, 58, 46, 0.95)' }}
    >
      <div className="text-golden-yellow font-bold text-sm mb-2">Tile Modifiers</div>

      {/* Enhancement */}
      {tile.enhancement !== EnhancementType.None && (
        <ModifierRow
          type="enhancement"
          name={tile.enhancementDef.name}
          japaneseName={tile.enhancementDef.japaneseName}
          description={tile.enhancementDef.description}
          colors={ENHANCEMENT_COLORS[tile.enhancement]}
        />
      )}

      {/* Seal */}
      {tile.seal !== SealType.None && (
        <ModifierRow
          type="seal"
          name={tile.sealDef.name}
          japaneseName={tile.sealDef.japaneseName}
          description={tile.sealDef.description}
          colors={{ ...SEAL_COLORS[tile.seal], text: '#FFF' }}
        />
      )}

      {/* Edition */}
      {tile.edition !== EditionType.Base && (
        <ModifierRow
          type="edition"
          name={tile.editionDef.name}
          japaneseName={tile.editionDef.japaneseName}
          description={tile.editionDef.description}
          colors={{ bg: '#A78BFA', border: '#7C3AED', text: '#FFF' }}
        />
      )}

      {/* Stats summary */}
      <div className="mt-2 pt-2 border-t border-gray-600 text-xs">
        {tile.modifierChips > 0 && (
          <div className="text-blue-400">+{tile.modifierChips} Chips</div>
        )}
        {tile.modifierMult > 0 && (
          <div className="text-red-400">+{tile.modifierMult} Mult</div>
        )}
        {tile.modifierMultiplier !== 1 && (
          <div className="text-purple-400">×{tile.modifierMultiplier.toFixed(1)} Mult</div>
        )}
        {tile.retriggers > 0 && (
          <div className="text-yellow-400">Retriggers: {tile.retriggers}</div>
        )}
      </div>
    </div>
  )
}

/**
 * UI for selecting modifiers to apply to a tile
 */
export function ModifierSelector({
  currentEnhancement,
  currentSeal,
  currentEdition,
  onEnhancementChange,
  onSealChange,
  onEditionChange,
  className = '',
}: ModifierSelectorProps) {
  const enhancements = Object.values(EnhancementType)
  const seals = Object.values(SealType)
  const editions = Object.values(EditionType)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Enhancement selector */}
      {onEnhancementChange && (
        <div>
          <div className="text-sm font-medium text-beige-white mb-2">Enhancement</div>
          <div className="flex flex-wrap gap-2">
            {enhancements.map((enhancement) => {
              const def = ENHANCEMENT_DEFINITIONS[enhancement]
              const colors = ENHANCEMENT_COLORS[enhancement]
              const isSelected = currentEnhancement === enhancement

              return (
                <button
                  key={enhancement}
                  onClick={() => onEnhancementChange(enhancement)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    isSelected ? 'ring-2 ring-golden-yellow' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  title={def.description}
                >
                  {def.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Seal selector */}
      {onSealChange && (
        <div>
          <div className="text-sm font-medium text-beige-white mb-2">Seal</div>
          <div className="flex flex-wrap gap-2">
            {seals.map((seal) => {
              const def = SEAL_DEFINITIONS[seal]
              const colors = SEAL_COLORS[seal]
              const isSelected = currentSeal === seal

              return (
                <button
                  key={seal}
                  onClick={() => onSealChange(seal)}
                  className={`px-2 py-1 rounded text-xs transition-all text-white ${
                    isSelected ? 'ring-2 ring-golden-yellow' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: colors.bg || '#374151',
                    borderColor: colors.border || '#4B5563',
                    borderWidth: 1,
                  }}
                  title={def.description}
                >
                  {def.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Edition selector */}
      {onEditionChange && (
        <div>
          <div className="text-sm font-medium text-beige-white mb-2">Edition</div>
          <div className="flex flex-wrap gap-2">
            {editions.map((edition) => {
              const def = EDITION_DEFINITIONS[edition]
              const effects = EDITION_EFFECTS[edition]
              const isSelected = currentEdition === edition

              return (
                <button
                  key={edition}
                  onClick={() => onEditionChange(edition)}
                  className={`px-2 py-1 rounded text-xs transition-all ${effects.overlay} ${
                    isSelected ? 'ring-2 ring-golden-yellow' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={def.description}
                >
                  {def.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
