import { OmenArtwork } from './OmenArtwork'

/** Decorative illustration; the adjacent localized name supplies the meaning. */
export function DoubleOmenArtwork({
  className = 'h-16 w-16',
}: {
  className?: string
}) {
  return <OmenArtwork omenId="double_omen" className={className} />
}
