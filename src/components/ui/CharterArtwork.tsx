import { illustrationAssets } from '../../utils/assets'

const portraits: Record<string, string> = {
  money_tree: illustrationAssets.moneyTreeCharter,
  plentiful_stock: illustrationAssets.plentifulStockCharter,
}

/** Item-specific portraits with a shared category illustration for other grants. */
export function CharterArtwork({
  charterId,
  className = '',
  alt = '',
}: {
  charterId: string
  className?: string
  alt?: string
}) {
  return (
    <img
      src={portraits[charterId] ?? illustrationAssets.imperialCharter}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={`game-illustration object-contain ${className}`}
      draggable={false}
    />
  )
}
