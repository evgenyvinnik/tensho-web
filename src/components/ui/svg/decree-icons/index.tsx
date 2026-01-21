/**
 * Decree Icons - Unique SVG icons for each decree
 *
 * Provides thematically appropriate icons for all 155 decrees.
 * Icons are organized by rarity and rendered as inline SVGs.
 *
 * @module components/ui/svg/decree-icons
 */

import type { DecreeIconProps, IconFn, DecreeIconMap } from './types'
import { COMMON_ICONS } from './CommonIcons'
import { UNCOMMON_ICONS } from './UncommonIcons'
import { RARE_ICONS } from './RareIcons'
import { LEGENDARY_ICONS } from './LegendaryIcons'
import { MYTHIC_ICONS } from './MythicIcons'

// Re-export types
export type { DecreeIconProps, IconFn, DecreeIconMap }

// Default icon for unknown decrees
const DefaultIcon: IconFn = ({ color }) => (
  <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill="none" />
)

// Combined icon registry
const DECREE_ICONS: DecreeIconMap = {
  ...COMMON_ICONS,
  ...UNCOMMON_ICONS,
  ...RARE_ICONS,
  ...LEGENDARY_ICONS,
  ...MYTHIC_ICONS,
}

/**
 * Get unique icon for a decree by ID
 */
export function DecreeUniqueIcon({
  decreeId,
  size = 32,
  color = '#FFD54F',
  className = '',
}: DecreeIconProps) {
  const IconComponent = DECREE_ICONS[decreeId] || DefaultIcon

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      fill="none"
    >
      <IconComponent color={color} />
    </svg>
  )
}

export default DecreeUniqueIcon
