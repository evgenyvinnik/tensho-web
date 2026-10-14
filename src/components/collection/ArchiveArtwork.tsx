import type { PackType } from '../../systems/types'
import {
  PACK_VARIANT_DEFINITIONS,
  type ArchiveCategory,
} from '../../config/archiveDefinitions'
import {
  getCelestialOrbIllustration,
  getFateSealIllustration,
  getMandateIllustration,
  getPackIllustration,
  getTableStyleIllustration,
} from '../../utils/assets'
import { getGeneratedArt } from '../../utils/generatedArt'
import { getItemArt } from '../../utils/itemArt'
import { getOmenIllustration } from '../../utils/omenArt'

/** The picture of any Archive item: its own art, or its family's. */
export function getArchiveIllustration(
  category: ArchiveCategory,
  id: string
): string | undefined {
  switch (category) {
    case 'decrees':
    case 'charters':
      return getItemArt(category, id).src
    case 'omens':
      return getOmenIllustration(id)
    case 'consumables':
      if (id.startsWith('seal_')) return getFateSealIllustration(id)
      if (id.endsWith('_orb')) return getCelestialOrbIllustration(id)
      return getItemArt('scripts', id).src
    case 'mandates':
      return getMandateIllustration(id)
    case 'walls':
      return getTableStyleIllustration(id)
    case 'tileMarks':
      return getGeneratedArt('enhancements', id)
    case 'seals':
      return getGeneratedArt('seals', id)
    case 'editions':
      return getGeneratedArt('editions', id)
    case 'packs': {
      const pack = PACK_VARIANT_DEFINITIONS.find((entry) => entry.id === id)
      return pack ? getPackIllustration(pack.type as PackType) : undefined
    }
    default:
      return undefined
  }
}

export function ArchiveArtwork({
  category,
  id,
  className = '',
}: {
  category: ArchiveCategory
  id: string
  className?: string
}) {
  const src = getArchiveIllustration(category, id)
  return src ? (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`game-illustration object-contain ${className}`}
    />
  ) : null
}
