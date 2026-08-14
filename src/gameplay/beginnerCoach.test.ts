import { describe, expect, it } from 'vitest'
import { MeldType } from '../core/Meld'
import { Tile, TileSuit } from '../core/Tile'
import {
  findBeginnerSuggestion,
  selectionMatchesSuggestion,
} from './beginnerCoach'

const tile = (suit: TileSuit, rank: number, id: string) =>
  new Tile(suit, rank, id)

describe('beginner coach', () => {
  it('points to the strongest finished shape in the real hand', () => {
    const suggestion = findBeginnerSuggestion([
      tile(TileSuit.Pinzu, 2, 'sequence-2'),
      tile(TileSuit.Pinzu, 3, 'sequence-3'),
      tile(TileSuit.Pinzu, 4, 'sequence-4'),
      tile(TileSuit.Wind, 1, 'east-a'),
      tile(TileSuit.Wind, 1, 'east-b'),
      tile(TileSuit.Wind, 1, 'east-c'),
    ])

    expect(suggestion).toEqual({
      kind: MeldType.Triplet,
      tileIds: ['east-a', 'east-b', 'east-c'],
      structurePoints: 30,
    })
  })

  it('teaches a sequence when it is the available scoring shape', () => {
    const suggestion = findBeginnerSuggestion([
      tile(TileSuit.Souzu, 5, 'five'),
      tile(TileSuit.Souzu, 6, 'six'),
      tile(TileSuit.Souzu, 7, 'seven'),
      tile(TileSuit.Manzu, 1, 'isolated'),
    ])

    expect(suggestion?.kind).toBe(MeldType.Sequence)
    expect(suggestion?.tileIds).toEqual(['five', 'six', 'seven'])
    expect(suggestion?.structurePoints).toBe(20)
  })

  it('suggests a redraw when no finished shape is visible', () => {
    const suggestion = findBeginnerSuggestion([
      tile(TileSuit.Manzu, 1, 'one'),
      tile(TileSuit.Pinzu, 4, 'four'),
      tile(TileSuit.Souzu, 8, 'eight'),
    ])

    expect(suggestion?.kind).toBe('redraw')
    expect(suggestion?.tileIds).toHaveLength(3)
    expect(suggestion?.structurePoints).toBe(0)
  })

  it('recognizes only the exact guided selection', () => {
    const suggestion = {
      kind: MeldType.Pair,
      tileIds: ['pair-a', 'pair-b'],
      structurePoints: 10,
    }

    expect(selectionMatchesSuggestion(suggestion, ['pair-b', 'pair-a'])).toBe(
      true
    )
    expect(selectionMatchesSuggestion(suggestion, ['pair-a'])).toBe(false)
    expect(
      selectionMatchesSuggestion(suggestion, ['pair-a', 'pair-b', 'extra'])
    ).toBe(false)
  })
})
