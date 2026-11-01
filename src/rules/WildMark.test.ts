/**
 * The Wild Mark: a Wild tile counts as every suit, including for Yaku.
 *
 * It keeps its rank, so it can fill that rank in a run or a same-face group of
 * any suit, but the rest of the group must still agree on one suit.
 */

import { describe, expect, it } from 'vitest'
import { Hand } from '../core/Hand'
import { Meld, MeldType } from '../core/Meld'
import { Tile, TileSuit, WindType } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { groupHand } from '../gameplay/handGroups'
import { findCompleteHandSubset } from './CompleteHandSubset'
import { validateHand } from './HandValidator'
import { parsePartialHand, parsePlay } from './PartialHandParser'
import { checkChinitsu, checkHonitsu, type YakuContext } from './YakuDetector'

const SUIT = { m: TileSuit.Manzu, p: TileSuit.Pinzu, s: TileSuit.Souzu }
let counter = 0

/** `'6s*'` is a Wild 6 of Bamboo; `'E'` is the East Wind. */
function tile(spec: string): Tile {
  if (spec === 'E') return new Tile(TileSuit.Wind, 1, `E-${counter++}`)
  const suit = SUIT[spec[1] as keyof typeof SUIT]
  const plain = new Tile(suit, Number(spec[0]), `${spec}-${counter++}`)
  return spec.endsWith('*')
    ? plain.withEnhancement(EnhancementType.Wild)
    : plain
}
const tiles = (specs: string) => specs.split(' ').map(tile)
const shapes = (groups: readonly Meld[]) =>
  groups.map((group) => `${group.type}:${group}`)

describe('Wild tiles in a play', () => {
  it('completes a Sequence of another suit: 4·5 Dots with a Wild 6 Bamboo', () => {
    const play = tiles('4p 5p 6s*')
    const parse = parsePlay(play)
    expect(shapes(parse.groups)).toEqual(['sequence:[4p5p6s]'])
    expect(parse.leftovers).toEqual([])
    expect(parse.structurePoints).toBe(30)
    expect(parse.groups[0].suit).toBe(TileSuit.Pinzu)
  })

  it.each([['4p 6p 5s*'], ['4s* 5p 6p'], ['4m* 5p 6s*'], ['6s* 7s* 8s*']])(
    'reads %s as a Sequence wherever the Wild tile sits',
    (specs) => {
      expect(parsePlay(tiles(specs)).groups.map((g) => g.type)).toEqual([
        MeldType.Sequence,
      ])
    }
  )

  it('fills a Straight', () => {
    expect(shapes(parsePlay(tiles('3p 4p 5s* 6p 7p')).groups)).toEqual([
      'straight:[3p4p5s6p7p]',
    ])
  })

  it('completes a Pair or Triplet of another suit', () => {
    expect(shapes(parsePlay(tiles('5p 5s*')).groups)).toEqual(['pair:[5p5s]'])
    // The Wild tile sorts first here, ahead of the Dots it joins.
    expect(shapes(parsePlay(tiles('5m* 5p 5p')).groups)).toEqual([
      'triplet:[5m5p5p]',
    ])
  })

  it('never joins two different natural suits', () => {
    expect(parsePlay(tiles('4p 5m* 6s')).groups).toEqual([])
    // A Wild 5 pairs with either, but the Dots and Bamboo never share a face.
    expect(parsePlay(tiles('5m* 5p 5s')).groups.map((g) => g.type)).toEqual([
      MeldType.Pair,
    ])
  })

  it('keeps its rank', () => {
    expect(parsePlay(tiles('4p 5p 7s*')).groups).toEqual([])
  })
})

describe('Wild tiles in the rack view', () => {
  it('groups the Wild tile with the suit it completes', () => {
    const rack = tiles('4p 5p 1m 6s* 9s')
    expect(shapes(parsePartialHand(rack).groups)).toEqual(['sequence:[4p5p6s]'])
    expect(groupHand(rack).map((c) => [c.kind, c.suit])).toEqual([
      [MeldType.Sequence, TileSuit.Pinzu],
      ['loose', TileSuit.Manzu],
      ['loose', TileSuit.Souzu],
    ])
  })

  it('handles a rack where every suited tile is Wild', () => {
    const parse = parsePartialHand(tiles('1m* 2p* 3s* 7s* 7p*'))
    expect(parse.groups.map((g) => g.type).sort()).toEqual([
      MeldType.Pair,
      MeldType.Sequence,
    ])
  })
})

describe('Wild tiles in a complete hand', () => {
  const winning = '1m 2m 3m 4p 5p 6s* 7s 8s 9s 2p 2p 2p 9m 9m'

  it('validates a hand whose only off-suit tile is Wild', () => {
    const result = validateHand(new Hand(tiles(winning)))
    expect(result.isComplete).toBe(true)
    expect(result.parsedHands[0].melds.map(String)).toContain('[4p5p6s]')
  })

  it('still rejects the same hand without the Wild Mark', () => {
    const plain = winning.replace('6s*', '6s')
    expect(validateHand(new Hand(tiles(plain))).isComplete).toBe(false)
  })

  it('pairs a Wild tile with another suit', () => {
    const hand = tiles('1m 2m 3m 4m 5m 6m 7m 8m 9m 2p 3p 4p 5s 5p*')
    expect(validateHand(new Hand(hand)).isComplete).toBe(true)
  })

  it('is found by the complete-hand search', () => {
    const rack = tiles(`${winning} E`)
    const found = findCompleteHandSubset(
      rack,
      (ids) =>
        validateHand(new Hand(rack.filter((t) => ids.includes(t.id))))
          .isComplete
    )
    expect(found).toHaveLength(14)
    expect(found).toContain(rack.find((t) => t.isWild)!.id)
  })
})

describe('Wild tiles for Yaku', () => {
  function context(hand: Tile[]): YakuContext {
    const parsed = validateHand(new Hand(hand)).parsedHands[0]
    return {
      tiles: hand,
      parsedHand: parsed,
      declaredMelds: [],
      isConcealed: true,
      isTsumo: true,
      seatWind: WindType.East,
      roundWind: WindType.East,
      winningTile: parsed?.winningTile ?? hand[0],
    } as YakuContext
  }

  it('counts a Wild tile of another suit toward a Full Flush', () => {
    const hand = tiles('1m 2m 3m 4m 5m 6m 7m 8m 9m 2m 3m 4s* 5m 5m')
    expect(checkChinitsu(context(hand))).toBe(true)
    const plain = hand.map((t) => t.withoutModifiers())
    expect(checkChinitsu(context(plain))).toBe(false)
  })

  it('counts a Wild tile of another suit toward a Half Flush', () => {
    const hand = tiles('1m 2m 3m 4m 5m 6m 7m 8m 9m 2p* 3m 4m E E')
    expect(checkHonitsu(context(hand))).toBe(true)
  })

  it('reads identical sequences through a Wild tile', () => {
    const [a, b] = [tiles('4p 5p 6p'), tiles('4p 5s* 6p')].map(
      (run) => new Meld(MeldType.Sequence, run)
    )
    expect(a.typeKey).toBe(b.typeKey)
    expect(b.tiles.map((t) => t.rank)).toEqual([4, 5, 6])
  })
})

describe('Meld checks', () => {
  it('accept a Wild tile in any suit but still need one suit overall', () => {
    expect(Meld.canFormSequence(tiles('4p 5p 6s*'))).toBe(true)
    expect(Meld.canFormSequence(tiles('4p 5m* 6s'))).toBe(false)
    expect(Meld.canFormStraight(tiles('4p 5p 6s* 7p'))).toBe(true)
    expect(Meld.canFormTriplet(tiles('5m* 5p 5p'))).toBe(true)
    expect(Meld.canFormTriplet(tiles('5m* 5p 5s'))).toBe(false)
    expect(Meld.canFormPair(tiles('5p 5s*'))).toBe(true)
  })
})
