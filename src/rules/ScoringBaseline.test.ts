/**
 * The scoring baseline section 1.1 of `docs/GAMEPLAY_EXPERIMENTS.md` complains
 * about.
 *
 * The complaint is specific and checkable: a player who learns to recognise a
 * sequence can score less than a player who taps three unrelated Honor tiles.
 * These tests pin the comparison so the rule that fixes it cannot quietly
 * regress, and so the cases the document says should *stay* possible do.
 */

import { describe, it, expect } from 'vitest'
import { Tile, TileSuit, DragonType, WindType } from '../core/Tile'
import { parsePartialHand, toPartialParsedHand } from './PartialHandParser'
import { calculateScore, createScoringContext } from './ScoringEngine'

let counter = 0
const t = (suit: TileSuit, rank: number) => new Tile(suit, rank, `b${counter++}`)

/** Score a tactical selection exactly as the orchestrator does. */
function scorePartial(tiles: Tile[]): number {
  const parse = parsePartialHand(tiles)
  const context = createScoringContext(tiles, toPartialParsedHand(parse, tiles), {
    partialMelds: parse.groups,
    previewMode: true,
  })
  return calculateScore(context).finalScore
}

const bambooRun = () => [
  t(TileSuit.Souzu, 3),
  t(TileSuit.Souzu, 4),
  t(TileSuit.Souzu, 5),
]
const looseHonors = () => [
  t(TileSuit.Dragon, DragonType.White),
  t(TileSuit.Dragon, DragonType.Green),
  t(TileSuit.Wind, WindType.East),
]

describe('the section 1.1 comparison', () => {
  it('pays a recognised sequence more than three unrelated Honors', () => {
    expect(scorePartial(bambooRun())).toBeGreaterThan(scorePartial(looseHonors()))
  })

  it('pays a pair of simples more than the same two tiles unrelated', () => {
    const pair = [t(TileSuit.Pinzu, 4), t(TileSuit.Pinzu, 4)]
    const strangers = [t(TileSuit.Pinzu, 4), t(TileSuit.Souzu, 8)]
    expect(scorePartial(pair)).toBeGreaterThan(scorePartial(strangers))
  })
})

describe('what section 1.1 says should stay true', () => {
  it('still lets Honors be worth more than simples, tile for tile', () => {
    // "Different builds should value different things": an Honor triplet must
    // remain better than a run of simples, or the fix has flattened the game.
    const honorTriplet = [
      t(TileSuit.Dragon, DragonType.Red),
      t(TileSuit.Dragon, DragonType.Red),
      t(TileSuit.Dragon, DragonType.Red),
    ]
    expect(scorePartial(honorTriplet)).toBeGreaterThan(scorePartial(bambooRun()))
  })

  it('still pays something for a selection with no group in it', () => {
    // Loose-tile plays should get weaker, not become illegal: the document
    // asks for them to stay possible.
    expect(scorePartial(looseHonors())).toBeGreaterThan(0)
  })

  it('leaves a complete hand unchanged, because every tile is in a group', () => {
    // Four sequences and a pair, all grouped. Structure is what it always was.
    const tiles = [
      ...bambooRun(),
      t(TileSuit.Manzu, 1),
      t(TileSuit.Manzu, 2),
      t(TileSuit.Manzu, 3),
      t(TileSuit.Pinzu, 6),
      t(TileSuit.Pinzu, 7),
      t(TileSuit.Pinzu, 8),
      t(TileSuit.Souzu, 7),
      t(TileSuit.Souzu, 8),
      t(TileSuit.Souzu, 9),
      t(TileSuit.Manzu, 5),
      t(TileSuit.Manzu, 5),
    ]
    const parse = parsePartialHand(tiles)
    expect(parse.leftovers).toHaveLength(0)
    // 4 sequences at 30 plus a pair at 15.
    expect(parse.structurePoints).toBe(135)
  })
})
