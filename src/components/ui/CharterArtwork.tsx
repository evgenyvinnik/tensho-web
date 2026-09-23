import { illustrationAssets } from '../../utils/assets'

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
      src={
        charterId === 'money_tree'
          ? illustrationAssets.moneyTreeCharter
          : illustrationAssets.imperialCharter
      }
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={`game-illustration object-contain ${className}`}
      draggable={false}
    />
  )
}
