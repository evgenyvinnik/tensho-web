import { getDecreeIllustration, illustrationAssets } from '../../utils/assets'

/** Optional authored portraits share one mapping across shop, archive and inventory. */
export function DecreeArtwork({
  decreeId,
  size = 48,
  color: _color,
}: {
  decreeId: string
  size?: number
  color?: string
}) {
  const illustration = getDecreeIllustration(decreeId)
  return (
    <img
      src={illustration ?? illustrationAssets.codex.decrees}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="game-illustration shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  )
}
