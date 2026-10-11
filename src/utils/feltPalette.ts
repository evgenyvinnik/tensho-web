/**
 * Felt palette.
 *
 * One table cloth colour drives the whole play surface: the table background,
 * its wave pattern and vignette, and the panels laid on it. Shades are mixed
 * toward black or white in plain hex, because the wave pattern is drawn as an
 * SVG data URI where CSS colour functions are not reliable.
 */

type Rgb = [number, number, number]

function toRgb(hex: string): Rgb {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : value
  return [0, 2, 4].map((offset) =>
    parseInt(full.slice(offset, offset + 2), 16)
  ) as Rgb
}

function toHex([red, green, blue]: Rgb): string {
  return `#${[red, green, blue]
    .map((channel) =>
      Math.round(Math.min(255, Math.max(0, channel)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

/** Mix `hex` toward `target` by `amount` (0 keeps `hex`, 1 gives `target`). */
export function mixHex(hex: string, target: string, amount: number): string {
  const from = toRgb(hex)
  const to = toRgb(target)
  return toHex(
    from.map(
      (channel, index) => channel + (to[index] - channel) * amount
    ) as Rgb
  )
}

function rgba(hex: string, alpha: number): string {
  const [red, green, blue] = toRgb(hex)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export interface FeltPalette {
  /** Table background, darkest to lightest. */
  greenDark: string
  greenMid: string
  greenLight: string
  /** Seigaiha wave stroke. */
  waveColor: string
  /** Edge shading over the table. */
  vignette: string
  /** Panels laid on the felt (score bar, rack, action bar). */
  surface: string
  /** Hover and raised controls on those panels. */
  surfaceRaised: string
}

export function feltPalette(felt: string): FeltPalette {
  return {
    greenDark: mixHex(felt, '#000000', 0.45),
    greenMid: felt,
    greenLight: mixHex(felt, '#ffffff', 0.14),
    waveColor: rgba(mixHex(felt, '#ffffff', 0.3), 0.4),
    vignette: rgba(mixHex(felt, '#000000', 0.7), 0.5),
    surface: mixHex(felt, '#000000', 0.38),
    surfaceRaised: mixHex(felt, '#ffffff', 0.06),
  }
}
