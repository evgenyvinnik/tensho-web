import { describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { MeldType } from '../core/Meld'
import {
  isSecretPattern,
  SECRET_PATTERNS,
  TAUGHT_PATTERNS,
} from './PlayPattern'
import {
  parsePartialHand,
  parsePlay,
  toPartialParsedHand,
} from './PartialHandParser'
import {
  calculateScore,
  createScoringContext,
  FOUR_WINDS_POINTS,
  STRUCTURE_POINTS_BY_TYPE,
} from './ScoringEngine'

let next = 0
const tiles = (suit: TileSuit, ranks: number[]) =>
  ranks.map((rank) => new Tile(suit, rank, `secret-${next++}`))

const D = TileSuit.Dragon
const W = TileSuit.Wind

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

describe('secret hands', () => {
  it('reads one of every Dragon as Three Dragons', () => {
    const score = play(tiles(D, [3, 1, 2]))
    expect(score.pattern).toEqual({
      id: 'three_dragons',
      mult: 2,
      groups: ['three_dragons'],
    })
    expect(score.structurePoints).toBe(
      STRUCTURE_POINTS_BY_TYPE[MeldType.Honors]
    )
  })

  it('reads one of every Wind as Four Winds', () => {
    const score = play(tiles(W, [4, 2, 1, 3]))
    expect(score.pattern).toEqual({
      id: 'four_winds',
      mult: 2,
      groups: ['four_winds'],
    })
    expect(score.structurePoints).toBe(FOUR_WINDS_POINTS)
  })

  it('needs every member, of one honor suit', () => {
    expect(play(tiles(D, [1, 2])).pattern.id).toBe('loose')
    expect(play(tiles(W, [1, 2, 3])).pattern.id).toBe('loose')
    expect(play([...tiles(D, [1, 2]), ...tiles(W, [3])]).pattern.id).toBe(
      'loose'
    )
  })

  it('names a play after its secret group and still counts the rest', () => {
    expect(play([...tiles(W, [1, 2, 3, 4]), ...tiles(D, [2, 2])]).pattern)
      .toEqual({ id: 'four_winds', mult: 3, groups: ['four_winds', 'pair'] })
    expect(play([...tiles(D, [1, 2, 3]), ...tiles(TileSuit.Souzu, [4, 5, 6])])
      .pattern).toEqual({
      id: 'three_dragons',
      mult: 3,
      groups: ['three_dragons', 'sequence'],
    })
  })

  it('reads two of every Dragon as two Three Dragons, not three Pairs', () => {
    expect(play(tiles(D, [1, 1, 2, 2, 3, 3])).pattern).toEqual({
      id: 'three_dragons',
      mult: 5,
      groups: ['three_dragons', 'three_dragons'],
    })
  })

  it('pays more than an honor Triplet of the same suit', () => {
    expect(play(tiles(D, [1, 2, 3])).finalScore).toBeGreaterThan(
      play(tiles(D, [1, 1, 1])).finalScore
    )
    expect(play(tiles(W, [1, 2, 3, 4])).finalScore).toBeGreaterThan(
      play(tiles(W, [1, 1, 1])).finalScore
    )
  })

  it('stays out of rack groups and the coach, which use parsePartialHand', () => {
    expect(parsePartialHand(tiles(W, [1, 2, 3, 4])).groups).toEqual([])
    expect(parsePartialHand(tiles(D, [1, 2, 3])).groups).toEqual([])
  })

  it('stays out of the taught list', () => {
    for (const id of SECRET_PATTERNS) {
      expect(isSecretPattern(id)).toBe(true)
      expect(TAUGHT_PATTERNS).not.toContain(id)
    }
    expect(isSecretPattern('quad')).toBe(false)
  })
})
