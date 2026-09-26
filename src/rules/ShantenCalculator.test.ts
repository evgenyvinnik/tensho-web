import { describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import {
  calculateShanten,
  calculateStandardShanten,
  getWaitingTiles,
} from './ShantenCalculator'
import { KOKUSHI_TILES, isCompleteHand } from './HandValidator'
import { Meld, MeldType } from '../core/Meld'

function makeTiles(specs: Array<[TileSuit, number, number]>): Tile[] {
  let id = 0
  return specs.flatMap(([suit, rank, count]) =>
    Array.from({ length: count }, () => new Tile(suit, rank, `shanten-${id++}`))
  )
}

describe('ShantenCalculator', () => {
  it('does not call an underfilled rack ready when it still lacks both head tiles', () => {
    const hand = makeTiles([
      [TileSuit.Manzu, 1, 3],
      [TileSuit.Pinzu, 2, 3],
      [TileSuit.Souzu, 3, 3],
      [TileSuit.Wind, 1, 3],
    ])
    expect(calculateStandardShanten(hand)).toBe(1)
    expect(getWaitingTiles(hand)).toEqual([])
    hand.push(new Tile(TileSuit.Dragon, 1, 'head-first'))
    expect(calculateStandardShanten(hand)).toBe(0)
    hand.push(new Tile(TileSuit.Dragon, 1, 'head-second'))
    expect(calculateStandardShanten(hand)).toBe(-1)
  })

  it('tries triplets before committing overlapping tiles to a sequence', () => {
    // 111234m 55p 678s EE: 111 + 234 is better than greedily taking 123.
    const hand = makeTiles([
      [TileSuit.Manzu, 1, 3],
      [TileSuit.Manzu, 2, 1],
      [TileSuit.Manzu, 3, 1],
      [TileSuit.Manzu, 4, 1],
      [TileSuit.Pinzu, 5, 2],
      [TileSuit.Souzu, 6, 1],
      [TileSuit.Souzu, 7, 1],
      [TileSuit.Souzu, 8, 1],
      [TileSuit.Wind, 1, 2],
    ])
    expect(calculateStandardShanten(hand)).toBe(0)
    const waits = getWaitingTiles(hand)
    expect(waits.map((tile) => tile.typeKey).sort()).toEqual(
      [`${TileSuit.Pinzu}-5`, `${TileSuit.Wind}-1`].sort()
    )
    for (const tile of waits) expect(isCompleteHand([...hand, tile])).toBe(true)
  })

  it('does not report Thirteen Orphans as a complete standard hand', () => {
    const hand = makeTiles(
      KOKUSHI_TILES.map(({ suit, rank }) => [suit, rank, 1])
    )
    hand.push(new Tile(TileSuit.Manzu, 1, 'orphan-pair'))
    const result = calculateShanten(hand)
    expect(result.shanten).toBe(-1)
    expect(result.bestForm).toBe('kokushi')
    expect(result.standardShanten).toBeGreaterThan(0)
  })

  it('keeps a special seven-pairs completion separate from standard form', () => {
    const hand = makeTiles([
      [TileSuit.Wind, 1, 2],
      [TileSuit.Wind, 2, 2],
      [TileSuit.Wind, 3, 2],
      [TileSuit.Wind, 4, 2],
      [TileSuit.Dragon, 1, 2],
      [TileSuit.Dragon, 2, 2],
      [TileSuit.Dragon, 3, 2],
    ])
    expect(calculateShanten(hand).bestForm).toBe('sevenPairs')
    expect(calculateStandardShanten(hand)).toBeGreaterThan(0)
  })

  it('accounts for declared melds without allowing concealed special forms', () => {
    const meld = new Meld(
      MeldType.Triplet,
      makeTiles([[TileSuit.Wind, 1, 3]]),
      false
    )
    const hand = makeTiles([
      [TileSuit.Manzu, 1, 3],
      [TileSuit.Manzu, 2, 1],
      [TileSuit.Manzu, 3, 1],
      [TileSuit.Manzu, 4, 1],
      [TileSuit.Pinzu, 5, 2],
      [TileSuit.Souzu, 6, 1],
      [TileSuit.Souzu, 7, 1],
    ])
    const result = calculateShanten(hand, [meld])
    expect(result.standardShanten).toBe(0)
    expect(result.sevenPairsShanten).toBe(8)
    expect(result.kokushiShanten).toBe(13)
    expect(getWaitingTiles(hand, [meld]).map((tile) => tile.typeKey)).toEqual([
      `${TileSuit.Souzu}-5`,
      `${TileSuit.Souzu}-8`,
    ])
  })

  it('never calls a complete subset plus unrelated surplus tiles a complete rack', () => {
    const hand = makeTiles([
      [TileSuit.Manzu, 1, 3],
      [TileSuit.Pinzu, 2, 3],
      [TileSuit.Souzu, 3, 3],
      [TileSuit.Wind, 1, 3],
      [TileSuit.Dragon, 1, 2],
      [TileSuit.Dragon, 2, 1],
    ])
    expect(calculateShanten(hand).shanten).toBeGreaterThanOrEqual(0)
  })

  it('agrees with the validator for generated complete hands and every single-tile removal', () => {
    const suits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]
    for (let seed = 0; seed < 24; seed++) {
      const specs: Array<[TileSuit, number, number]> = []
      for (let group = 0; group < 3; group++) {
        const suit = suits[group]
        const rank = 1 + ((seed + group * 2) % 7)
        if (seed % 2 === 0) specs.push([suit, rank, 3])
        else
          specs.push([suit, rank, 1], [suit, rank + 1, 1], [suit, rank + 2, 1])
      }
      specs.push(
        [TileSuit.Wind, 1 + (seed % 4), 3],
        [TileSuit.Dragon, 1 + (seed % 3), 2]
      )
      const hand = makeTiles(specs)
      const before = JSON.stringify(hand)
      expect(isCompleteHand(hand)).toBe(true)
      expect(calculateStandardShanten(hand)).toBe(-1)
      for (let index = 0; index < hand.length; index++) {
        const waiting = hand.filter((_, i) => i !== index)
        expect(calculateStandardShanten(waiting)).toBe(0)
        expect(calculateStandardShanten([...waiting].reverse())).toBe(0)
      }
      expect(JSON.stringify(hand)).toEqual(before)
    }
  })

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
