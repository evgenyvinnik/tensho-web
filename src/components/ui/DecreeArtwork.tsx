import { getDecreeIllustration } from '../../utils/assets'
import { DecreeUniqueIcon } from './svg/DecreeIcons'

/** Optional authored portraits share one mapping across shop, archive and inventory. */
export function DecreeArtwork({
  decreeId,
  size = 48,
  color,
}: {
  decreeId: string
  size?: number
  color?: string
}) {
  const illustration = getDecreeIllustration(decreeId)
  return illustration ? (
    <img
      src={illustration}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="game-illustration shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  ) : (
    <DecreeUniqueIcon decreeId={decreeId} size={size} color={color} />
  )
}
