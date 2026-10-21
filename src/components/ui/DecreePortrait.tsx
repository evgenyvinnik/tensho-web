import type { CSSProperties } from 'react'
import type { DecreeEdition } from '../../systems/types'
import { withBasePath } from '../../utils/basePath'
import './decreePortrait.css'

/** Keep the Decree's identity; its edition changes the finish and painted mount. */
export function DecreePortrait({
  src,
  edition,
  className = 'relative block h-full w-full',
  imageClassName = '',
  style,
  size,
}: {
  src: string
  edition?: DecreeEdition
  className?: string
  imageClassName?: string
  style?: CSSProperties
  size?: number
}) {
  return (
    <span
      aria-hidden="true"
      data-decree-edition-art={edition ?? 'Base'}
      className={`decree-portrait ${className}`}
      style={size === undefined ? undefined : { width: size, height: size }}
    >
      <img
        src={src}
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
      {edition && (
        <>
          <span className="decree-portrait__finish" />
          <img
            data-decree-edition-frame={edition}
            src={withBasePath(
              `assets/illustrations/decree-editions/${edition.toLowerCase()}.webp`
            )}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="decree-portrait__frame"
          />
        </>
      )}
    </span>
  )
}
