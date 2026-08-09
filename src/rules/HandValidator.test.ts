import { describe, expect, it } from 'vitest'
import { Hand } from '../core/Hand'
import { Tile, TileSuit } from '../core/Tile'
import { calculateScore, createScoringContext } from './ScoringEngine'
import { findOneAwayCompletion, validateHand } from './HandValidator'

let tileCounter = 0

function tile(suit: TileSuit, rank: number): Tile {
  return new Tile(suit, rank, `fixture-${tileCounter++}`)
}

function handFrom(groups: Array<[TileSuit, number[]]>): Hand {
  return new Hand(
    groups.flatMap(([suit, ranks]) => ranks.map((rank) => tile(suit, rank)))
  )
}

describe('HandValidator Decree rules and special hands', () => {
  it('only accepts a one-rank broken sequence with Broken Stair authority', () => {
    const hand = handFrom([
      [TileSuit.Manzu, [1, 3, 4]],
      [TileSuit.Pinzu, [2, 3, 4, 5, 6, 7]],
      [TileSuit.Souzu, [6, 7, 8]],
      [TileSuit.Wind, [1, 1]],
    ])

    expect(validateHand(hand).isComplete).toBe(false)
    expect(
      validateHand(hand, undefined, { allowSequenceSkip: true }).isStandardForm
    ).toBe(true)
  })

  it('allows four melds without a separate pair under False Eye', () => {
    const hand = handFrom([
      [TileSuit.Manzu, [1, 2, 3, 4, 5, 6]],
      [TileSuit.Pinzu, [2, 3, 4]],
      [TileSuit.Souzu, [7, 7, 7]],
    ])

    expect(validateHand(hand).isComplete).toBe(false)
    const authorized = validateHand(hand, undefined, {
      meldMayServeAsPair: true,
    })
    expect(authorized.isComplete).toBe(true)
    expect(authorized.parsedHands[0].melds).toHaveLength(4)
  })

  it('provides a scoring parse for Seven Pairs', () => {
    const hand = handFrom([
      [TileSuit.Manzu, [1, 1, 2, 2]],
      [TileSuit.Pinzu, [3, 3, 4, 4]],
      [TileSuit.Souzu, [5, 5, 6, 6]],
      [TileSuit.Wind, [1, 1]],
    ])

    const validation = validateHand(hand)
    expect(validation.isSevenPairs).toBe(true)
    expect(validation.parsedHands).toHaveLength(1)

    const score = calculateScore(
      createScoringContext(hand.allTiles, validation.parsedHands[0], {
        isTsumo: false,
      })
    )
    expect(score.detectedYaku.map((yaku) => yaku.definition.id)).toContain(
      'seven_pairs'
    )
  })

  it('provides a scoring parse for Thirteen Orphans', () => {
    const hand = handFrom([
      [TileSuit.Manzu, [1, 9]],
      [TileSuit.Pinzu, [1, 9]],
      [TileSuit.Souzu, [1, 9]],
      [TileSuit.Wind, [1, 1, 2, 3, 4]],
      [TileSuit.Dragon, [1, 2, 3]],
    ])

    const validation = validateHand(hand)
    expect(validation.isKokushi).toBe(true)
    expect(validation.parsedHands).toHaveLength(1)

    const score = calculateScore(
      createScoringContext(hand.allTiles, validation.parsedHands[0], {
        isTsumo: false,
      })
    )
    expect(score.detectedYaku.map((yaku) => yaku.definition.id)).toEqual([
      'kokushi',
    ])
  })

  it('lets Tanyao Dispensation include terminals but never Honors', () => {
    const terminalHand = handFrom([
      [TileSuit.Manzu, [1, 2, 3, 2, 3, 4]],
      [TileSuit.Pinzu, [3, 4, 5, 5, 5]],
      [TileSuit.Souzu, [6, 7, 8]],
    ])
    const validation = validateHand(terminalHand)
    expect(validation.isComplete).toBe(true)

    const normal = calculateScore(
      createScoringContext(terminalHand.allTiles, validation.parsedHands[0], {
        isTsumo: false,
      })
    )
    const authorized = calculateScore(
      createScoringContext(terminalHand.allTiles, validation.parsedHands[0], {
        isTsumo: false,
        tanyaoAllowsTerminals: true,
      })
    )

    expect(normal.detectedYaku.map((yaku) => yaku.definition.id)).not.toContain(
      'tanyao'
    )
    expect(authorized.detectedYaku.map((yaku) => yaku.definition.id)).toContain(
      'tanyao'
    )
  })

  it('finds a deterministic completion for a 1-shanten hand', () => {
    const hand = handFrom([
      [TileSuit.Manzu, [1, 2, 3, 2, 3, 4]],
      [TileSuit.Pinzu, [3, 4, 5, 5, 5]],
      [TileSuit.Souzu, [6, 7]],
    ])

    const completion = findOneAwayCompletion(hand.allTiles)
    expect(completion).not.toBeNull()
    expect(completion?.completionTile.suit).toBe(TileSuit.Souzu)
    expect(completion?.completionTile.rank).toBe(5)
  })

  it('uses one Celestial Wildcard to repair an otherwise invalid structure', () => {
    const hand = handFrom([
      [TileSuit.Manzu, [1, 1, 1, 2, 3, 4]],
      [TileSuit.Pinzu, [4, 6, 9]],
      [TileSuit.Souzu, [7, 8, 9]],
      [TileSuit.Wind, [1, 1]],
    ])

    expect(validateHand(hand).isComplete).toBe(false)
    expect(
      validateHand(hand, undefined, { wildcardCount: 1 }).isComplete
    ).toBe(true)
  })
})
