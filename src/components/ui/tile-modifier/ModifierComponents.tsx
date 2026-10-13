/**
 * Tile Modifier Components
 *
 * Visual components for displaying tile modifiers.
 */

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
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const sizeClasses = {
    small: 'w-4 h-4 text-[8px]',
    medium: 'w-6 h-6 text-xs',
    large: 'w-8 h-8 text-sm',
  }

  // Enhancement badge
  if (enhancement && enhancement !== EnhancementType.None) {
    const colors = ENHANCEMENT_COLORS[enhancement]
    const def = ENHANCEMENT_DEFINITIONS[enhancement]
    const name = t(`tileMarks.items.${enhancement}.name`, def.name)
    const description = t(
      `tileMarks.items.${enhancement}.description`,
      def.description
    )
    const IconComponent = getEnhancementIcon(enhancement)

    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${className}`}
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          color: colors.text,
          borderWidth: 1,
        }}
        title={`${name}: ${description}`}
      >
        {IconComponent && (
          <IconComponent
            className={iconSizeClasses[size]}
            color={colors.text}
          />
        )}
        {showLabel && <span className="ml-1">{name}</span>}
      </div>
    )
  }

  // Seal badge
  if (seal && seal !== SealType.None) {
    const colors = SEAL_COLORS[seal]
    const def = SEAL_DEFINITIONS[seal]
    const name = t(`archiveSeals.items.${seal}.name`, def.name)
    const description = t(
      `archiveSeals.items.${seal}.description`,
      def.description
    )
    const IconComponent = getSealIcon(seal)

    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${className}`}
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: 2,
        }}
        title={`${name}: ${description}`}
      >
        {IconComponent && (
          <IconComponent className={iconSizeClasses[size]} color="#FFF" />
        )}
        {showLabel && <span className="ml-1 text-white">{name}</span>}
      </div>
    )
  }

  // Edition badge
  if (edition && edition !== EditionType.Base) {
    const def = EDITION_DEFINITIONS[edition]
    const name = t(`editions.items.${edition}.name`, def.name)
    const description = t(
      `editions.items.${edition}.description`,
      def.description
    )
    const effects = EDITION_EFFECTS[edition]
    const IconComponent = getEditionIcon(edition)

    return (
      <div
        className={`${sizeClasses[size]} rounded flex items-center justify-center ${effects.overlay} ${className}`}
        title={`${name}: ${description}`}
      >
        {IconComponent && <IconComponent className={iconSizeClasses[size]} />}
        {showLabel && <span className="ml-1">{name}</span>}
      </div>
    )
  }

  return null
}

/** Small pictograms for a mark's gem and a seal's stamp — never letters. */
const MARK_GLYPHS: Partial<Record<EnhancementType, string>> = {
  [EnhancementType.Bonus]: 'M12 6v12M6 12h12',
  [EnhancementType.Mult]: 'M7 7l10 10M17 7 7 17',
  [EnhancementType.Wild]: 'm12 4 2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16.2 7 19l1.2-5.6L4 9.6l5.6-.6z',
  [EnhancementType.Glass]: 'M12 3 20 12 12 21 4 12z',
  [EnhancementType.Steel]: 'M12 3 19 6v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
  [EnhancementType.Gold]: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM10 10h4v4h-4z',
  [EnhancementType.Lucky]: 'M12 12c-3-5-8-2-5 1M12 12c5-3 2-8-1-5M12 12c3 5 8 2 5-1M12 12c-5 3-2 8 1 5M12 12l3 8',
}

const SEAL_GLYPHS: Partial<Record<SealType, string>> = {
  [SealType.Gold]: 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM10.5 10.5h3v3h-3z',
  [SealType.Red]: 'M7 9a6 6 0 0 1 10 0l1-3M17 15a6 6 0 0 1-10 0l-1 3',
  [SealType.Blue]: 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM5 12h14',
  [SealType.Purple]: 'M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
}

function Glyph({ d }: { d?: string }) {
  if (!d) return null
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
    >
      <path d={d} />
    </svg>
  )
}

/**
 * The look of a special tile. Each layer is a whole-tile treatment, not a
 * corner badge, and the layers combine truthfully:
 *  - a mark (enhancement) frames the tile in its material — gilded gold,
 *    sapphire, ruby, prismatic, glass, brushed steel, granite, jade — with a
 *    gem showing its pictogram;
 *  - a seal is a wax stamp in its colour, pressed into the lower corner;
 *  - an edition washes the face — foil sheen, holographic rainbow,
 *    shifting polychrome, or a negative.
 * Rank and suit stay readable underneath; the tile's details list the exact
 * combination.
 */
export function ModifierOverlay({
  tile,
  className = '',
}: ModifierOverlayProps) {
  const enhancement = tile.enhancement
  const seal = tile.seal
  const edition = tile.edition
  return (
    <>
      {edition !== EditionType.Base && (
        <div
          aria-hidden="true"
          data-tile-edition={edition}
          className={`tile-edition tile-edition--${edition} ${className}`}
        />
      )}
      {enhancement !== EnhancementType.None && (
        <div
          aria-hidden="true"
          data-tile-mark={enhancement}
          className={`tile-mark tile-mark--${enhancement} ${className}`}
        >
          {MARK_GLYPHS[enhancement] && (
            <span className="tile-mark-gem">
              <Glyph d={MARK_GLYPHS[enhancement]} />
            </span>
          )}
        </div>
      )}
      {seal !== SealType.None && (
        <div
          aria-hidden="true"
          data-tile-seal={seal}
          className={`tile-seal tile-seal--${seal}`}
        >
          <Glyph d={SEAL_GLYPHS[seal]} />
        </div>
      )}
    </>
  )
}

/**
 * Helper component for modifier tooltip rows
 */
export function ModifierRow({
  name,
  japaneseName,
  description,
  colors,
}: ModifierRowProps) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: 1,
          }}
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
export function ModifierTooltip({
  tile,
  className = '',
}: ModifierTooltipProps) {
  const { t } = useTranslation()
  if (!tile.hasModifiers) {
    return null
  }

  return (
    <div
      className={`bg-dark-forest border border-golden-yellow rounded-lg p-3 shadow-xl min-w-[200px] ${className}`}
      style={{ backgroundColor: 'rgba(28, 58, 46, 0.95)' }}
    >
      <div className="text-golden-yellow font-bold text-sm mb-2">
        {t('tiles.tileModifiers', 'Tile Modifiers')}
      </div>

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
          <div className="text-purple-400">
            ×{tile.modifierMultiplier.toFixed(1)} Mult
          </div>
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
  const { t } = useTranslation()
  const enhancements = Object.values(EnhancementType)
  const seals = Object.values(SealType)
  const editions = Object.values(EditionType)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Enhancement selector */}
      {onEnhancementChange && (
        <div>
          <div className="text-sm font-medium text-beige-white mb-2">
            {t('tiles.enhancement', 'Enhancement')}
          </div>
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
                    isSelected
                      ? 'ring-2 ring-golden-yellow'
                      : 'opacity-60 hover:opacity-100'
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
                    isSelected
                      ? 'ring-2 ring-golden-yellow'
                      : 'opacity-60 hover:opacity-100'
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
          <div className="text-sm font-medium text-beige-white mb-2">
            {t('tiles.edition', 'Edition')}
          </div>
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
                    isSelected
                      ? 'ring-2 ring-golden-yellow'
                      : 'opacity-60 hover:opacity-100'
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
