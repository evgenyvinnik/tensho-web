import { withBasePath } from '../../utils/basePath'

/** Decorative illustration; the adjacent localized name supplies the meaning. */
export function DoubleOmenArtwork({
  className = 'h-16 w-16',
}: {
  className?: string
}) {
  return (
    <img
      src={withBasePath('assets/illustrations/omens/double-omen.png')}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`object-contain ${className}`}
    />
  )
}
