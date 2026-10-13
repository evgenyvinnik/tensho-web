import { describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import {
  classifyMahjong,
  classifyPlay,
  DRAGON_GROUP_MULT,
  MAHJONG_PATTERN_MULT,
  type PlayPatternId,
} from './PlayPattern'
import { parsePlay, toPartialParsedHand } from './PartialHandParser'
import {
  calculateScore,
  createScoringContext,
  getTilePoints,
  WIND_TILE_POINTS,
} from './ScoringEngine'

let next = 0
const tiles = (suit: TileSuit, ranks: number[]) =>
  ranks.map((rank) => new Tile(suit, rank, `pattern-${next++}`))
const meld = (type: MeldType, suit: TileSuit, ranks: number[]) =>
  new Meld(type, tiles(suit, ranks))

const M = TileSuit.Manzu
const P = TileSuit.Pinzu
const S = TileSuit.Souzu

const pair = () => meld(MeldType.Pair, P, [5, 5])
const sequence = () => meld(MeldType.Sequence, S, [2, 3, 4])
const triplet = () => meld(MeldType.Triplet, M, [7, 7, 7])
const quad = () => meld(MeldType.Quad, P, [9, 9, 9, 9])
const straight4 = () => meld(MeldType.Straight, S, [3, 4, 5, 6])
const straight5 = () => meld(MeldType.Straight, P, [4, 5, 6, 7, 8])

/** Score a selection the way a play does: best split, then the engine. */
function play(selection: Tile[]) {
  const parsed = parsePlay(selection)
  return calculateScore(
    createScoringContext(selection, toPartialParsedHand(parsed, selection), {
      partialMelds: parsed.groups,
      previewMode: true,
    })
  )
}

describe('classifyPlay', () => {
  it.each<[PlayPatternId, () => Meld[], number]>([
    ['loose', () => [], 0],
    ['pair', () => [pair()], 0],
    ['sequence', () => [sequence()], 0],
    ['triplet', () => [triplet()], 1],
    ['straight4', () => [straight4()], 1],
    ['quad', () => [quad()], 2],
    ['straight5', () => [straight5()], 2],
    ['two_pairs', () => [pair(), pair()], 1],
    ['three_pairs', () => [pair(), pair(), pair()], 2],
    ['two_sequences', () => [sequence(), sequence()], 1],
    ['sequence_pair', () => [pair(), sequence()], 1],
    ['triplet_pair', () => [pair(), triplet()], 2],
    ['two_triplets', () => [triplet(), triplet()], 3],
    ['triplet_sequence', () => [sequence(), triplet()], 2],
    ['quad_pair', () => [pair(), quad()], 3],
    ['straight_pair', () => [pair(), straight4()], 2],
  ])('names %s and adds the formula Mult', (id, groups, mult) => {
    expect(classifyPlay(groups())).toMatchObject({ id, mult })
  })

  it('lists groups largest first, whatever order they were found in', () => {
    expect(classifyPlay([pair(), quad()]).groups).toEqual(['quad', 'pair'])
  })

  it('falls back to a combination for shapes only Decrees can reach', () => {
    expect(classifyPlay([pair(), pair(), sequence()])).toMatchObject({
      id: 'combination',
      mult: 2,
    })
  })

  it('gives a complete Mahjong hand its flat bonus instead', () => {
    expect(classifyMahjong([sequence(), triplet(), pair()])).toEqual({
      id: 'mahjong',
      mult: MAHJONG_PATTERN_MULT,
      groups: ['sequence', 'triplet', 'pair'],
    })
  })
})

describe('reading a play', () => {
  it('splits a selection into the reading that pays the most', () => {
    // 2-3-4 + 4-4 (70 points × 2) beats 4-4-4 with two half-paid loose tiles
    // (59 × 2).
    expect(play(tiles(S, [2, 3, 4, 4, 4])).pattern.id).toBe('sequence_pair')
    // 2-6 + a loose 7 (87 × 3) beats 2-3-4 + 5-6-7 (90 × 2).
    expect(play(tiles(P, [2, 3, 4, 5, 6, 7])).pattern.id).toBe('straight5')
  })

  it('prefers a five-tile Straight to two overlapping readings', () => {
    expect(play(tiles(M, [1, 2, 3, 4, 5])).pattern.id).toBe('straight5')
    expect(play(tiles(M, [1, 2, 3, 4])).pattern.id).toBe('straight4')
  })

  it('counts every tile once', () => {
    const selection = tiles(P, [2, 3, 4, 6, 7, 8])
    const score = play(selection)
    expect(score.pattern.id).toBe('two_sequences')
    expect(score.tilePoints).toBe(
      selection.reduce((sum, tile) => sum + getTilePoints(tile), 0)
    )
  })

  it('scores Winds at their own points and Dragons in a group with extra Mult', () => {
    const winds = tiles(TileSuit.Wind, [1, 1])
    expect(winds.map(getTilePoints)).toEqual([
      WIND_TILE_POINTS,
      WIND_TILE_POINTS,
    ])
    expect(play(winds).dragonMult).toBe(0)
    const dragons = tiles(TileSuit.Dragon, [3, 3])
    const score = play(dragons)
    expect(score.pattern.id).toBe('pair')
    expect(score.dragonMult).toBe(2 * DRAGON_GROUP_MULT)
    // A loose Dragon adds nothing.
    expect(play([...tiles(TileSuit.Dragon, [1]), ...tiles(P, [5, 5])]).dragonMult).toBe(0)
  })

  it('pays points × (1 + pattern + Dragons) with no Yaku', () => {
    const selection = tiles(P, [5, 5, 5])
    const score = play(selection)
    expect(score.finalScore).toBe(
      Math.floor(
        score.basePoints * (1 + score.pattern.mult + score.dragonMult)
      )
    )
  })
})
