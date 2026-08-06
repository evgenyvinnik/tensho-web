/**
 * ConsumablesBar Component for Tensho Mahjong Roguelike
 *
 * Quick access bar for using consumables during gameplay.
 * Shows Fate Seals, Celestial Orbs, and Void Scripts.
 *
 * @module components/gameplay/ConsumablesBar
 */


// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Individual consumable item configuration
 */
interface ConsumableItem {
  /** Display name */
  name: string
  /** Japanese name */
  japanese: string
  /** Current count */
  count: number
  /** Emoji icon */
  emoji: string
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
 * - Fate Seals (運命) - Purple border, 🎴 icon
 * - Celestial Orbs (天球) - Blue border, 🔮 icon
 * - Void Scripts (虚空) - Gray border, 📜 icon
 *
 * Each button is disabled when count is 0.
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
  const consumables: ConsumableItem[] = [
    {
      name: 'Fate Seal',
      japanese: '運命',
      count: fateSeals,
      emoji: '🎴',
      color: 'border-purple-500',
      onUse: onUseFateSeal,
    },
    {
      name: 'Celestial Orb',
      japanese: '天球',
      count: celestialOrbs,
      emoji: '🔮',
      color: 'border-blue-500',
      onUse: onUseCelestialOrb,
    },
    {
      name: 'Void Script',
      japanese: '虚空',
      count: voidScripts,
      emoji: '📜',
      color: 'border-gray-500',
      onUse: onUseVoidScript,
    },
  ]

  return (
    <div className="flex gap-2">
      {consumables.map((item) => (
        <button
          key={item.name}
          onClick={item.onUse}
          disabled={item.count === 0}
          className={`
            flex items-center gap-1 px-2 py-1
            bg-[var(--color-dark-forest)] rounded-lg
            border ${item.color}
            ${item.count > 0 ? 'opacity-100 hover:bg-[var(--color-forest-green)]' : 'opacity-40'}
            transition-all min-w-[44px] min-h-[44px]
          `}
          title={item.name}
          aria-label={`${item.name} (${item.count} available)`}
        >
          <span className="text-lg">{item.emoji}</span>
          <span className="text-sm text-[var(--color-beige-white)] font-mono">×{item.count}</span>
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ConsumablesBar
