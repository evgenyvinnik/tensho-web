import type { CSSProperties } from 'react'
import { getControlArt, type ControlArtId } from '../../utils/generatedArt'

/** Decorative generated art. The owning control retains its localized label. */
export function ControlIcon({
  name,
  size = 24,
  className = '',
  style,
}: {
  name: ControlArtId
  size?: number | string
  className?: string
  style?: CSSProperties
}) {
  return (
    <img
      src={getControlArt(name)}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      className={`inline-block shrink-0 object-contain align-middle ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  )
}
