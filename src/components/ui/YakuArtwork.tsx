import { getYakuIllustration } from '../../utils/generatedArt'

export function YakuArtwork({
  id,
  className = 'h-8 w-8',
}: {
  id: string
  className?: string
}) {
  const src = getYakuIllustration(id)
  return src ? (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`inline-block shrink-0 object-contain align-middle ${className}`}
    />
  ) : null
}
