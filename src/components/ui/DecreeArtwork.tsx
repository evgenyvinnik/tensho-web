import { getDecreeIllustration, illustrationAssets } from '../../utils/assets'
import type { DecreeEdition } from '../../systems/types'
import { DecreePortrait } from './DecreePortrait'

/** Optional authored portraits share one mapping across shop, archive and inventory. */
export function DecreeArtwork({
  decreeId,
  size = 48,
  color: _color,
  edition,
}: {
  decreeId: string
  size?: number
  color?: string
  edition?: DecreeEdition
}) {
  const illustration = getDecreeIllustration(decreeId)
  return (
    <DecreePortrait
      decreeId={decreeId}
      src={illustration ?? illustrationAssets.codex.decrees}
      edition={edition}
      size={size}
      className="relative inline-block shrink-0"
    />
  )
}
