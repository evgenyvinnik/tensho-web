import { describe, expect, it } from 'vitest'
import { fitSlotTileSize } from './slotTileSize'

describe('fitSlotTileSize', () => {
  it('keeps the largest allowed size when the tiles fit', () => {
    // Three medium tiles: 3 × 50 − 2 × 4 = 142px.
    expect(fitSlotTileSize(3, 190, 'medium')).toBe('medium')
  })

  it('steps down until a full meld fits a narrow slot', () => {
    expect(fitSlotTileSize(3, 113, 'medium')).toBe('small')
    expect(fitSlotTileSize(3, 130, 'medium')).toBe('compact')
  })

  it('never grows past the cap', () => {
    expect(fitSlotTileSize(2, 1000, 'compact')).toBe('compact')
  })

  it('falls back to the smallest size and to the cap when unmeasured', () => {
    expect(fitSlotTileSize(4, 60, 'large')).toBe('small')
    expect(fitSlotTileSize(4, 0, 'large')).toBe('large')
  })
})
