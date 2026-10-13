import { expect, it } from 'vitest'
import { scoreMultiplier, scoreNumber } from './scoreNumber'

it.each([
  ['en', '45B'],
  ['es', '45 mil M'],
  ['ru', '45 млрд'],
  ['ja', '450億'],
])(
  'uses %s compact notation without changing the exact value',
  (language, display) => {
    expect(scoreNumber(45_000_000_000, language)).toEqual({
      display,
      isCompact: true,
      exact: new Intl.NumberFormat(language).format(45_000_000_000),
    })
  }
)

it('keeps ordinary scores exact and preserves rounding detail for inspection', () => {
  expect(scoreNumber(999_999)).toEqual({
    display: '999,999',
    exact: '999,999',
    isCompact: false,
  })
  expect(scoreNumber(1_000_001)).toEqual({
    display: '1M',
    exact: '1,000,001',
    isCompact: true,
  })
  expect(scoreNumber(0)).toEqual({ display: '0', exact: '0', isCompact: false })
})

it.each([
  ['en', '2.60', '2.6'],
  ['es', '2,60', '2,6'],
  ['ru', '2,60', '2,6'],
  ['ja', '2.60', '2.6'],
])(
  'formats %s multipliers to three trimmed decimals without float noise',
  (language, display, exact) => {
    expect(scoreMultiplier(2.6, language)).toEqual({
      display,
      exact,
      isCompact: false,
    })
    const threeDecimals = new Intl.NumberFormat(language, {
      maximumFractionDigits: 3,
    })
    expect(scoreMultiplier(1.23456789, language).exact).toBe(
      threeDecimals.format(1.235)
    )
    // Summer ×1.3 with Winter ×0.75: shown as 0.975, never 0.98 or
    // 0.9750000000000001, so 50 × 0.975 visibly gives 48.75.
    expect(scoreMultiplier(1.3 * 0.75, language)).toEqual({
      display: threeDecimals.format(0.975),
      exact: threeDecimals.format(0.975),
      isCompact: false,
    })
    expect(scoreMultiplier(1_234_567.125, language)).toEqual(
      scoreNumber(1_234_567.125, language)
    )
  }
)
