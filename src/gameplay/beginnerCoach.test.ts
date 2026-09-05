import { describe, expect, it } from 'vitest'
import { MeldType } from '../core/Meld'
import { Tile, TileSuit } from '../core/Tile'
import { getTilePoints } from '../rules/ScoringEngine'
import { parsePartialHand } from '../rules/PartialHandParser'
import {
  buildCoachAdvice,
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

// =============================================================================
// SCORE-AWARE ADVICE
// =============================================================================

/**
 * A stand-in for the game's own preview: tile points plus structure points.
 *
 * The real coach is handed `orchestrator.previewScore`, so this only has to be
 * the same shape, not the same numbers.
 */
function scoreLike(tiles: Tile[]) {
  return (selection: string[]): number | null => {
    const chosen = tiles.filter((tile) => selection.includes(tile.id))
    if (chosen.length !== selection.length) return null
    if (chosen.length < 2 || chosen.length > 5) return null
    const parse = parsePartialHand(chosen)
    return (
      chosen.reduce((sum, tile) => sum + getTilePoints(tile), 0) +
      parse.structurePoints
    )
  }
}

describe('buildCoachAdvice', () => {
  it('finds a higher-scoring play than the most instructive shape', () => {
    // The situation section 1.4 describes: a tidy sequence worth 35, next to a
    // loose-tile selection that pays far more.
    const tiles = [
      tile(TileSuit.Souzu, 3, 'seq-3'),
      tile(TileSuit.Souzu, 4, 'seq-4'),
      tile(TileSuit.Souzu, 5, 'seq-5'),
      tile(TileSuit.Wind, 1, 'east-a'),
      tile(TileSuit.Wind, 1, 'east-b'),
      tile(TileSuit.Dragon, 1, 'white-a'),
      tile(TileSuit.Dragon, 1, 'white-b'),
      tile(TileSuit.Dragon, 3, 'red'),
    ]

    const advice = buildCoachAdvice({
      tiles,
      scoreSelection: scoreLike(tiles),
      remainingToTarget: 300,
      handsRemaining: 4,
    })

    expect(advice).not.toBeNull()
    expect(advice!.best.score).toBeGreaterThan(35)
    expect(advice!.shape).not.toBeNull()
    expect(advice!.shape!.pattern).toBeDefined()
    expect(advice!.best.tileIds).not.toEqual(advice!.shape!.tileIds)
  })

  it('reports the round pressure rather than only the biggest number', () => {
    const tiles = [
      tile(TileSuit.Pinzu, 2, 'p2'),
      tile(TileSuit.Pinzu, 3, 'p3'),
      tile(TileSuit.Pinzu, 4, 'p4'),
    ]
    const advice = buildCoachAdvice({
      tiles,
      scoreSelection: scoreLike(tiles),
      remainingToTarget: 300,
      handsRemaining: 4,
    })

    expect(advice!.requiredPerHand).toBe(75)
    expect(advice!.keepsPace).toBe(false)
  })

  it('says a play keeps pace when it clears its share of the target', () => {
    const tiles = [
      tile(TileSuit.Dragon, 1, 'd1a'),
      tile(TileSuit.Dragon, 1, 'd1b'),
      tile(TileSuit.Dragon, 1, 'd1c'),
    ]
    const advice = buildCoachAdvice({
      tiles,
      scoreSelection: scoreLike(tiles),
      remainingToTarget: 100,
      handsRemaining: 4,
    })

    expect(advice!.requiredPerHand).toBe(25)
    expect(advice!.keepsPace).toBe(true)
  })

  it('never prices a concealed tile', () => {
    const tiles = [
      tile(TileSuit.Souzu, 3, 'seq-3'),
      tile(TileSuit.Souzu, 4, 'seq-4'),
      tile(TileSuit.Souzu, 5, 'seq-5'),
      tile(TileSuit.Dragon, 2, 'hidden'),
    ]
    const advice = buildCoachAdvice({
      tiles,
      concealedIds: new Set(['hidden']),
      scoreSelection: scoreLike(tiles),
      remainingToTarget: 200,
      handsRemaining: 3,
    })

    expect(advice!.best.tileIds).not.toContain('hidden')
    expect(advice!.shape?.tileIds ?? []).not.toContain('hidden')
  })

  it('offers nothing when the hand cannot make a legal play', () => {
    const tiles = [tile(TileSuit.Manzu, 5, 'lonely')]
    expect(
      buildCoachAdvice({
        tiles,
        scoreSelection: scoreLike(tiles),
        remainingToTarget: 200,
        handsRemaining: 3,
      })
    ).toBeNull()
  })

  it('drops the shape advice when the best play already is the shape', () => {
    const tiles = [
      tile(TileSuit.Dragon, 3, 'red-a'),
      tile(TileSuit.Dragon, 3, 'red-b'),
      tile(TileSuit.Dragon, 3, 'red-c'),
    ]
    const advice = buildCoachAdvice({
      tiles,
      scoreSelection: scoreLike(tiles),
      remainingToTarget: 200,
      handsRemaining: 3,
    })

    expect(advice!.best.pattern).toBe(MeldType.Triplet)
    expect(advice!.shape).toBeNull()
  })
})
