/** Decimal places shown for fractional scores and multipliers. */
export const SCORE_FRACTION_DIGITS = 3

const formatters = new Map<
  string,
  {
    exact: Intl.NumberFormat
    compact: Intl.NumberFormat
    multiplier: Intl.NumberFormat
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
      compact: new Intl.NumberFormat(language, {
        notation: 'compact',
        maximumFractionDigits: 2,
      }),
      multiplier: new Intl.NumberFormat(language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: SCORE_FRACTION_DIGITS,
      }),
    }
    formatters.set(language, formatter)
  }
  return formatter
}

/**
 * Compact presentation never changes the score. `exact` is the inspection
 * value: whole numbers in full, fractions to three trimmed decimals.
 */
export function scoreNumber(value: number, language = 'en') {
  const formatter = getFormatters(language)
  const exact = formatter.exact.format(value)
  const isCompact = Number.isFinite(value) && Math.abs(value) >= 1_000_000
  return {
    exact,
    isCompact,
    // CLDR unit separators are non-breaking. Allow wrapping between words in
    // narrow HUD cells rather than splitting a localized unit in the middle.
    display: isCompact
      ? formatter.compact.format(value).replace(/[\u00a0\u202f]/g, ' ')
      : exact,
  }
}

/**
 * Match forecast and payment notation. A multiplier keeps its third decimal
 * (×0.975, not ×0.98), so the equation on screen multiplies out.
 */
export function scoreMultiplier(value: number, language = 'en') {
  const number = scoreNumber(value, language)
  return {
    ...number,
    display: number.isCompact
      ? number.display
      : getFormatters(language).multiplier.format(value),
  }
}
