import { scoreRounding } from '../rules/ScoreEquation'

/** Decimal places the precise value keeps for tooltips and screen readers. */
export const SCORE_FRACTION_DIGITS = 3
/** Points and multipliers on screen show at most one decimal: 2.6, never 2.60. */
const DISPLAY_FRACTION_DIGITS = 1
/** From a million, compact units: 1.2M, 45B, 1.2T. */
const COMPACT_FROM = 1_000_000
/** Where compact units run out (999.95T would read 1000T): 1.2E15. */
const SCIENTIFIC_FROM = 999.95e12

const formatters = new Map<
  string,
  {
    exact: Intl.NumberFormat
    display: Intl.NumberFormat
    compact: Intl.NumberFormat
    scientific: Intl.NumberFormat
  }
>()

function getFormatters(language: string) {
  let formatter = formatters.get(language)
  if (!formatter) {
    formatter = {
      // Inspection precision: enough to check a multiplier such as 0.975 by
      // hand, without exposing float noise like 0.9750000000000001.
      exact: new Intl.NumberFormat(language, {
        maximumFractionDigits: SCORE_FRACTION_DIGITS,
      }),
      display: new Intl.NumberFormat(language, {
        maximumFractionDigits: DISPLAY_FRACTION_DIGITS,
      }),
      compact: new Intl.NumberFormat(language, {
        notation: 'compact',
        maximumFractionDigits: DISPLAY_FRACTION_DIGITS,
      }),
      scientific: new Intl.NumberFormat(language, {
        notation: 'scientific',
        maximumFractionDigits: DISPLAY_FRACTION_DIGITS,
      }),
    }
    formatters.set(language, formatter)
  }
  return formatter
}

/**
 * Presentation never changes the score. `display` is what the player reads:
 * at most one decimal, compact units from a million, scientific notation past
 * the trillions. `exact` is the inspection value for tooltips, screen readers
 * and the exact-values disclosure: whole numbers in full, fractions to three
 * trimmed decimals. `isCompact` marks a display in compact or scientific form.
 */
export function scoreNumber(value: number, language = 'en') {
  const formatter = getFormatters(language)
  const size = Math.abs(value)
  const isCompact = Number.isFinite(value) && size >= COMPACT_FROM
  return {
    exact: formatter.exact.format(value),
    isCompact,
    display: !isCompact
      ? formatter.display.format(value)
      : size >= SCIENTIFIC_FROM
        ? formatter.scientific.format(value)
        : // CLDR unit separators are non-breaking. Allow wrapping between
          // words in narrow HUD cells rather than splitting a localized unit.
          formatter.compact.format(value).replace(/[\u00a0\u202f]/g, ' '),
  }
}

/** Multipliers read like points: ×2, ×2.6, ×1.2M. */
export function scoreMultiplier(value: number, language = 'en') {
  return scoreNumber(value, language)
}

/**
 * The engine pays floor(points × Mult). Returns the product and its floor as
 * shown, or null when the one-decimal numbers on screen already agree
 * (47.04 shows as 47), so no rounding note is needed.
 */
export function shownRounding(points: number, mult: number, language = 'en') {
  const { product, rounded, roundedDown } = scoreRounding(points, mult)
  const shown = {
    product: scoreNumber(product, language).display,
    rounded: scoreNumber(rounded, language).display,
  }
  return roundedDown && shown.product !== shown.rounded ? shown : null
}
