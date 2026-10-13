import { describe, expect, it } from 'vitest'
import { fitHandTileSize } from './useHandTileSize'

describe('fitHandTileSize', () => {
  it('keeps a laptop rack on one row instead of two oversized rows', () => {
    // 1440×800 MacBook viewport: the rack is ~1180px wide.
    expect(
      fitHandTileSize({
        availableWidth: 1180,
        viewportHeight: 800,
        tileCount: 16,
        groupCount: 4,
      })
    ).toBe('regular')
  })

  it('uses large tiles on a tall tablet, where two rows still fit', () => {
    expect(
      fitHandTileSize({
        availableWidth: 700,
        viewportHeight: 1024,
        tileCount: 16,
        groupCount: 2,
      })
    ).toBe('large')
  })

  it('falls back to touch-sized compact tiles on a phone', () => {
    expect(
      fitHandTileSize({
        availableWidth: 333,
        viewportHeight: 664,
        tileCount: 16,
        groupCount: 3,
      })
    ).toBe('compact')
  })

  it('charges the gaps between groups to the rack width', () => {
    const plain = fitHandTileSize({
      availableWidth: 1040,
      viewportHeight: 800,
      tileCount: 16,
    })
    const grouped = fitHandTileSize({
      availableWidth: 1040,
      viewportHeight: 800,
      tileCount: 16,
      groupCount: 8,
    })
    // Two label lines and group gaps must both fit the same height budget.
    expect(plain).toBe('large')
    expect(grouped).toBe('medium')
  })

  it('charges the gaps between suits to the rack width', () => {
    const fit = (suitBreaks: number) =>
      fitHandTileSize({
        availableWidth: 930,
        viewportHeight: 700,
        tileCount: 16,
        groupCount: 4,
        suitBreaks,
      })
    expect(fit(0)).toBe('medium')
    expect(fit(4)).toBe('compact')
  })

  it('has a sane default before the rack is measured', () => {
    expect(
      fitHandTileSize({ availableWidth: 0, viewportHeight: 800, tileCount: 14 })
    ).toBe('medium')
  })
})
