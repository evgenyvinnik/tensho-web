import { expect, it } from 'vitest'
import { scoreMultiplier, scoreNumber, shownRounding } from './scoreNumber'

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

it('keeps ordinary scores whole and compacts from a million to one decimal', () => {
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
  expect(scoreNumber(1_234_567).display).toBe('1.2M')
  expect(scoreNumber(999_940_000_000_000).display).toBe('999.9T')
  expect(scoreNumber(0)).toEqual({ display: '0', exact: '0', isCompact: false })
})

it.each([
  ['en', '1.2E15', '1E15'],
  ['es', '1,2E15', '1E15'],
  ['ja', '1.2E15', '1E15'],
])(
  'switches %s to scientific notation where compact units would read 1000T',
  (language, large, edge) => {
    expect(scoreNumber(1.234e15, language).display).toBe(large)
    expect(scoreNumber(999_950_000_000_000, language).display).toBe(edge)
    expect(scoreNumber(1.234e15, language).isCompact).toBe(true)
    expect(scoreNumber(1.234e15, language).exact).toBe(
      new Intl.NumberFormat(language).format(1.234e15)
    )
  }
)

it.each([
  ['en', '2.6', '47.5', '0.975'],
  ['es', '2,6', '47,5', '0,975'],
  ['ru', '2,6', '47,5', '0,975'],
  ['ja', '2.6', '47.5', '0.975'],
])(
  'shows %s points and multipliers with at most one decimal',
  (language, mult, points, precise) => {
    expect(scoreMultiplier(2.6, language)).toEqual({
      display: mult,
      exact: mult,
      isCompact: false,
    })
    expect(scoreNumber(47.5, language).display).toBe(points)
    expect(scoreMultiplier(2, language).display).toBe('2')
    // Summer ×1.3 with Winter ×0.75 reads ×1; its tooltip keeps 0.975, never
    // 0.9750000000000001.
    expect(scoreMultiplier(1.3 * 0.75, language)).toEqual({
      display: '1',
      exact: precise,
      isCompact: false,
    })
    expect(scoreMultiplier(1_234_567.125, language)).toEqual(
      scoreNumber(1_234_567.125, language)
    )
  }
)

it('notes a rounding only where the numbers on screen differ', () => {
  expect(shownRounding(50, 0.975)).toEqual({ product: '48.8', rounded: '48' })
  expect(shownRounding(47.5, 1, 'es')).toEqual({
    product: '47,5',
    rounded: '47',
  })
  // 23.52 × 2 = 47.04: shown as 47 and paid as 47, nothing to explain.
  expect(shownRounding(23.52, 2)).toBeNull()
  expect(shownRounding(20, 2)).toBeNull()
})
