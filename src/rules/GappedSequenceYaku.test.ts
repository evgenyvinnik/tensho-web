import { expect, it } from 'vitest'
import { Tile, TileSuit, WindType } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { WaitType } from '../core/Hand'
import {
  checkIipeikou,
  checkRyanpeikou,
  checkSanshokuDoujun,
  checkIttsu,
  checkPinfu,
  type YakuContext,
} from './YakuDetector'

function sequence(ranks: number[], suit = TileSuit.Manzu, id = 'seq') {
  return new Meld(
    MeldType.Sequence,
    ranks.map((rank, i) => new Tile(suit, rank, `${id}-${i}`))
  )
}
function context(melds: Meld[]): YakuContext {
  const pair = new Meld(MeldType.Pair, [
    new Tile(TileSuit.Pinzu, 5, 'pair-1'),
    new Tile(TileSuit.Pinzu, 5, 'pair-2'),
  ])
  const winningTile = melds[0].tiles[0]
  return {
    tiles: [...melds.flatMap((m) => m.tiles), ...pair.tiles],
    parsedHand: {
      melds,
      pair,
      waitType: WaitType.Ryanmen,
      winningTile,
      isConcealed: true,
    },
    declaredMelds: [],
    isConcealed: true,
    isTsumo: true,
    isRiichi: false,
    seatWind: WindType.East,
    roundWind: WindType.East,
    winningTile,
  }
}

it('requires identical actual ranks, not just the same starting rank', () => {
  const a = sequence([1, 2, 4]),
    b = sequence([1, 3, 4]),
    c = sequence([1, 2, 3])
  expect(a.typeKey).not.toBe(b.typeKey)
  expect(a.typeKey).not.toBe(c.typeKey)
  expect(checkIipeikou(context([a, b]))).toBe(false)
  expect(
    checkIipeikou(context([a, sequence([1, 2, 4], TileSuit.Manzu, 'copy')]))
  ).toBe(true)
  expect(
    checkRyanpeikou(context([a, b, sequence([4, 5, 7]), sequence([4, 6, 7])]))
  ).toBe(false)
  expect(checkRyanpeikou(context([a, a, b, b]))).toBe(true)
})

it('compares the full sequence across all three suits', () => {
  const a = sequence([1, 2, 4]),
    b = sequence([1, 3, 4], TileSuit.Pinzu),
    c = sequence([1, 2, 3], TileSuit.Souzu)
  expect(checkSanshokuDoujun(context([a, b, c]))).toBe(false)
  expect(
    checkSanshokuDoujun(
      context([
        a,
        sequence([1, 2, 4], TileSuit.Pinzu),
        sequence([1, 2, 4], TileSuit.Souzu),
      ])
    )
  ).toBe(true)
})

it('does not invent missing ranks for a full straight', () => {
  expect(
    checkIttsu(
      context([sequence([1, 2, 4]), sequence([4, 5, 7]), sequence([7, 8, 9])])
    )
  ).toBe(false)
  expect(
    checkIttsu(
      context([sequence([1, 2, 3]), sequence([4, 5, 6]), sequence([7, 8, 9])])
    )
  ).toBe(true)
})

it('keeps Pinfu consecutive even when a gapped hand is legally complete', () => {
  const other = [
    sequence([2, 3, 4], TileSuit.Pinzu),
    sequence([5, 6, 7], TileSuit.Pinzu),
    sequence([6, 7, 8], TileSuit.Souzu),
  ]
  expect(checkPinfu(context([sequence([1, 2, 4]), ...other]))).toBe(false)
  expect(checkPinfu(context([sequence([1, 2, 3]), ...other]))).toBe(true)
})

it('does not revoke an independent Decree suit-matching permission for consecutive ranks', () => {
  const mixed = new Meld(MeldType.Sequence, [
    new Tile(TileSuit.Manzu, 1, 'm'),
    new Tile(TileSuit.Pinzu, 2, 'p'),
    new Tile(TileSuit.Souzu, 3, 's'),
  ])
  const rest = [sequence([2, 3, 4]), sequence([5, 6, 7]), sequence([6, 7, 8])]
  expect(checkPinfu(context([mixed, ...rest]))).toBe(true)
})
