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
      exact: new Intl.NumberFormat(language, { maximumFractionDigits: 20 }),
      compact: new Intl.NumberFormat(language, {
        notation: 'compact',
        maximumFractionDigits: 2,
      }),
      multiplier: new Intl.NumberFormat(language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    }
    formatters.set(language, formatter)
  }
  return formatter
}

/** Compact presentation never changes the score or the exact inspection value. */
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

/** Match forecast and payment notation; retain the unrounded value for inspection. */
export function scoreMultiplier(value: number, language = 'en') {
  const number = scoreNumber(value, language)
  return {
    ...number,
    display: number.isCompact
      ? number.display
      : getFormatters(language).multiplier.format(value),
  }
}
