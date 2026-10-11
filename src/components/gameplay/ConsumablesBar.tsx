/**
 * ConsumablesBar Component for Tensho Mahjong Roguelike
 *
 * Quick access bar for using consumables during gameplay.
 * Shows Fate Seals, Celestial Orbs, and Void Scripts.
 *
 * @module components/gameplay/ConsumablesBar
 */

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { OrbSVG, ScriptSVG, SealSVG } from '../ui/svg/ConsumableSVG'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Individual consumable item configuration
 */
interface ConsumableItem {
  id: 'seal' | 'orb' | 'script'
  /** Display name */
  name: string
  /** Current count */
  count: number
  /** Native compact icon */
  icon: ReactNode
  /** Border color class */
  color: string
  /** Use handler */
  onUse?: () => void
}

/**
 * Props for ConsumablesBar
 */
export interface ConsumablesBarProps {
  /** Number of Fate Seals available */
  fateSeals: number
  /** Number of Celestial Orbs available */
  celestialOrbs: number
  /** Number of Void Scripts available */
  voidScripts: number
  /** Handler for using a Fate Seal */
  onUseFateSeal?: () => void
  /** Handler for using a Celestial Orb */
  onUseCelestialOrb?: () => void
  /** Handler for using a Void Script */
  onUseVoidScript?: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Horizontal bar for accessing consumable items.
 *
 * Displays three consumable types with counts:
 * - Fate Seals (運命) - Purple border, native seal SVG
 * - Celestial Orbs (天球) - Blue border, native orb SVG
 * - Void Scripts (虚空) - Gray border, native script SVG
 *
 * Empty categories occupy no space; owned items retain their illustrated controls.
 * Meets 44px minimum touch target requirement.
 */
export function ConsumablesBar({
  fateSeals,
  celestialOrbs,
  voidScripts,
  onUseFateSeal,
  onUseCelestialOrb,
  onUseVoidScript,
}: ConsumablesBarProps) {
  const { t } = useTranslation()
  const consumables: ConsumableItem[] = [
    {
      id: 'seal',
      name: t('consumableUse.fateSeals'),
      count: fateSeals,
      icon: <SealSVG variant="wisdom" size={32} />,
      color: 'border-purple-500',
      onUse: onUseFateSeal,
    },
    {
      id: 'orb',
      name: t('consumableUse.celestialOrbs'),
      count: celestialOrbs,
      icon: <OrbSVG variant="neptune" size={32} />,
      color: 'border-blue-500',
      onUse: onUseCelestialOrb,
    },
    {
      id: 'script',
      name: t('consumableUse.voidScripts'),
      count: voidScripts,
      icon: <ScriptSVG size={32} />,
      color: 'border-gray-500',
      onUse: onUseVoidScript,
    },
  ]
  const owned = consumables.filter((item) => item.count > 0)
  if (owned.length === 0) return null

  return (
    <div data-consumables-bar className="flex gap-1 min-[360px]:gap-2">
      {owned.map((item) => (
        <button
          type="button"
          key={item.id}
          data-consumable-family={item.id}
          onClick={item.onUse}
          className={`
            game-consumable group flex items-center justify-center gap-0 px-1 py-1 min-[360px]:gap-1 min-[360px]:px-2
            bg-[var(--color-dark-forest)] rounded-lg
            border ${item.color}
            hover:bg-[var(--color-forest-green)]
            transition-all min-w-[44px] min-h-[44px]
          `}
          title={item.name}
          aria-label={t('consumableUse.available', {
            name: item.name,
            count: item.count,
          })}
        >
          <span
            aria-hidden="true"
            className="game-illustration inline-flex h-8 w-8 shrink-0 items-center justify-center"
          >
            {item.icon}
          </span>
          <span className="hidden text-sm text-[var(--color-beige-white)] font-mono min-[360px]:inline">
            ×{item.count}
          </span>
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ConsumablesBar
