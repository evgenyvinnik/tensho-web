import { describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { calculateShanten } from './ShantenCalculator'

function makeTiles(specs: Array<[TileSuit, number, number]>): Tile[] {
  let id = 0
  return specs.flatMap(([suit, rank, count]) =>
    Array.from({ length: count }, () => new Tile(suit, rank, `shanten-${id++}`))
  )
}

describe('ShantenCalculator', () => {
  it('recognizes a complete standard hand', () => {
    const hand = makeTiles([
      [TileSuit.Manzu, 1, 1],
      [TileSuit.Manzu, 2, 1],
      [TileSuit.Manzu, 3, 1],
      [TileSuit.Manzu, 5, 2],
      [TileSuit.Pinzu, 1, 1],
      [TileSuit.Pinzu, 2, 1],
      [TileSuit.Pinzu, 3, 1],
      [TileSuit.Souzu, 1, 1],
      [TileSuit.Souzu, 2, 1],
      [TileSuit.Souzu, 3, 1],
      [TileSuit.Wind, 1, 3],
    ])

    expect(calculateShanten(hand).shanten).toBe(-1)
  })

  it('recognizes a genuine one-tile wait as tenpai', () => {
    const hand = makeTiles([
      [TileSuit.Manzu, 1, 1],
      [TileSuit.Manzu, 2, 2],
      [TileSuit.Manzu, 3, 1],
      [TileSuit.Pinzu, 1, 1],
      [TileSuit.Pinzu, 2, 1],
      [TileSuit.Pinzu, 3, 1],
      [TileSuit.Souzu, 1, 1],
      [TileSuit.Souzu, 2, 1],
      [TileSuit.Souzu, 3, 1],
      [TileSuit.Wind, 1, 3],
    ])

    expect(hand).toHaveLength(13)
    expect(calculateShanten(hand).shanten).toBe(0)
  })

  it('does not label a merely promising hand as tenpai', () => {
    // This shape has three useful groups but still needs an additional change
    // before it reaches tenpai. It mirrors the false-positive seen in the live
    // opening-hand audit.
    const hand = makeTiles([
      [TileSuit.Manzu, 1, 2],
      [TileSuit.Manzu, 2, 2],
      [TileSuit.Manzu, 3, 1],
      [TileSuit.Manzu, 8, 1],
      [TileSuit.Pinzu, 2, 1],
      [TileSuit.Pinzu, 3, 1],
      [TileSuit.Pinzu, 4, 1],
      [TileSuit.Pinzu, 5, 1],
      [TileSuit.Pinzu, 6, 1],
      [TileSuit.Pinzu, 7, 1],
      [TileSuit.Wind, 2, 1],
      [TileSuit.Dragon, 1, 1],
    ])

    expect(hand).toHaveLength(14)
    expect(calculateShanten(hand).shanten).toBe(1)
  })
})
