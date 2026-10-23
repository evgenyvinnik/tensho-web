import type { CSSProperties } from 'react'
import type { DecreeEdition } from '../../systems/types'
import { getDecreeEditionArt } from '../../utils/decreeEditionArt'
import './decreePortrait.css'

/** Editions use complete authored portraits, preserving the Decree's identity. */
export function DecreePortrait({
  src,
  decreeId,
  edition,
  className = 'relative block h-full w-full',
  imageClassName = '',
  style,
  size,
}: {
  src: string
  decreeId?: string
  edition?: DecreeEdition
  className?: string
  imageClassName?: string
  style?: CSSProperties
  size?: number
}) {
  const editionPortrait = getDecreeEditionArt(decreeId, edition)
  return (
    <span
      aria-hidden="true"
      data-decree-edition-art={edition ?? 'Base'}
      className={`decree-portrait ${className}`}
      style={size === undefined ? undefined : { width: size, height: size }}
    >
      <img
        src={editionPortrait ?? src}
        data-decree-edition-portrait={editionPortrait ? edition : undefined}
        alt=""
        aria-hidden="true"
        draggable={false}
        width={size}
        height={size}
        className={`decree-portrait__image game-illustration h-full w-full object-contain ${imageClassName}`}
        style={{
          ...style,
          ...(size === undefined ? {} : { width: size, height: size }),
        }}
      />
    </span>
  )
}
