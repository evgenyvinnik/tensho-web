import { getOmenIllustration } from '../../utils/omenArt'

/** Decorative artwork; the adjacent localized Omen name supplies its meaning. */
export function OmenArtwork({
  omenId,
  className = 'h-16 w-16',
}: {
  omenId: string
  className?: string
}) {
  const src = getOmenIllustration(omenId)
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
