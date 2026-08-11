/**
 * Tests for the partial hand parser.
 *
 * Most Tensho plays are not complete winning hands, so this decomposition is
 * what pays the player for the structure they actually assembled.
 */

import { describe, it, expect } from 'vitest'
import { Tile, TileSuit, WindType, DragonType } from '../core/Tile'
import { MeldType } from '../core/Meld'
import { getMeldStructurePoints } from './ScoringEngine'
import { parsePartialHand, toPartialParsedHand } from './PartialHandParser'

function suited(suit: TileSuit, rank: number, index = 0): Tile {
  return new Tile(suit, rank, `${suit}-${rank}-${index}`)
}

describe('parsePartialHand', () => {
  it('finds a triplet and scores its structure', () => {
    const tiles = [
      suited(TileSuit.Manzu, 5, 0),
      suited(TileSuit.Manzu, 5, 1),
      suited(TileSuit.Manzu, 5, 2),
    ]

    const parse = parsePartialHand(tiles)

    expect(parse.groups).toHaveLength(1)
    expect(parse.groups[0].type).toBe(MeldType.Triplet)
    expect(parse.structurePoints).toBe(30)
    expect(parse.leftovers).toHaveLength(0)
  })

  it('finds a sequence in a suit', () => {
    const tiles = [
      suited(TileSuit.Souzu, 3),
      suited(TileSuit.Souzu, 4),
      suited(TileSuit.Souzu, 5),
    ]

    const parse = parsePartialHand(tiles)

    expect(parse.groups).toHaveLength(1)
    expect(parse.groups[0].type).toBe(MeldType.Sequence)
    expect(parse.structurePoints).toBe(20)
  })

  it('never forms a sequence across suits', () => {
    const tiles = [
      suited(TileSuit.Manzu, 3),
      suited(TileSuit.Pinzu, 4),
      suited(TileSuit.Souzu, 5),
    ]

    const parse = parsePartialHand(tiles)

    expect(parse.groups).toHaveLength(0)
    expect(parse.structurePoints).toBe(0)
    expect(parse.leftovers).toHaveLength(3)
  })

  it('does not form sequences from honor tiles', () => {
    const tiles = [
      Tile.createWind(WindType.East, 'e1'),
      Tile.createWind(WindType.South, 's1'),
      Tile.createWind(WindType.West, 'w1'),
    ]

    const parse = parsePartialHand(tiles)

    expect(parse.groups).toHaveLength(0)
    expect(parse.leftovers).toHaveLength(3)
  })

  it('groups honor tiles into triplets', () => {
    const tiles = [
      Tile.createDragon(DragonType.Red, 'r1'),
      Tile.createDragon(DragonType.Red, 'r2'),
      Tile.createDragon(DragonType.Red, 'r3'),
    ]

    const parse = parsePartialHand(tiles)

    expect(parse.groups[0].type).toBe(MeldType.Triplet)
    expect(parse.structurePoints).toBe(30)
  })

  it('picks the decomposition worth the most, not the first one found', () => {
    // 1-1-1-2-3 can be read as a triplet (30) leaving 2,3 loose, or as a
    // sequence 1-2-3 (20) plus a pair of 1s (10). Both use five tiles, but the
    // triplet reading is worth more only if nothing better exists; here the
    // sequence-plus-pair reading ties at 30 while using every tile. The parser
    // must land on a maximum, never below it.
    const tiles = [
      suited(TileSuit.Pinzu, 1, 0),
      suited(TileSuit.Pinzu, 1, 1),
      suited(TileSuit.Pinzu, 1, 2),
      suited(TileSuit.Pinzu, 2, 0),
      suited(TileSuit.Pinzu, 3, 0),
    ]

    const parse = parsePartialHand(tiles)

    expect(parse.structurePoints).toBe(30)
  })

  it('prefers two sequences over a single triplet when that scores more', () => {
    // 1-1-2-2-3-3 is two 1-2-3 sequences (40) rather than three pairs (30).
    const tiles = [
      suited(TileSuit.Souzu, 1, 0),
      suited(TileSuit.Souzu, 1, 1),
      suited(TileSuit.Souzu, 2, 0),
      suited(TileSuit.Souzu, 2, 1),
      suited(TileSuit.Souzu, 3, 0),
      suited(TileSuit.Souzu, 3, 1),
    ]

    const parse = parsePartialHand(tiles)

    expect(parse.structurePoints).toBe(40)
    expect(parse.groups.every((group) => group.type === MeldType.Sequence)).toBe(true)
  })

  it('scores a quad above a triplet plus a loose tile', () => {
    const tiles = [
      suited(TileSuit.Manzu, 9, 0),
      suited(TileSuit.Manzu, 9, 1),
      suited(TileSuit.Manzu, 9, 2),
      suited(TileSuit.Manzu, 9, 3),
    ]

    const parse = parsePartialHand(tiles)

    expect(parse.groups[0].type).toBe(MeldType.Quad)
    expect(parse.structurePoints).toBe(50)
  })

  it('reports structure points that agree with the scoring engine', () => {
    const tiles = [
      suited(TileSuit.Manzu, 2, 0),
      suited(TileSuit.Manzu, 3, 0),
      suited(TileSuit.Manzu, 4, 0),
      suited(TileSuit.Pinzu, 7, 0),
      suited(TileSuit.Pinzu, 7, 1),
    ]

    const parse = parsePartialHand(tiles)
    const fromEngine = parse.groups.reduce(
      (sum, group) => sum + getMeldStructurePoints(group),
      0
    )

    expect(parse.structurePoints).toBe(fromEngine)
    expect(parse.structurePoints).toBe(30) // sequence 20 + pair 10
  })

  it('never assigns one tile to two groups', () => {
    const tiles = [
      suited(TileSuit.Souzu, 1, 0),
      suited(TileSuit.Souzu, 1, 1),
      suited(TileSuit.Souzu, 2, 0),
      suited(TileSuit.Souzu, 3, 0),
      suited(TileSuit.Souzu, 3, 1),
      suited(TileSuit.Souzu, 5, 0),
    ]

    const parse = parsePartialHand(tiles)
    const usedIds = parse.groups.flatMap((group) => group.tiles.map((tile) => tile.id))

    expect(new Set(usedIds).size).toBe(usedIds.length)
    expect(usedIds.length + parse.leftovers.length).toBe(tiles.length)
  })

  it('handles an empty selection without throwing', () => {
    const parse = parsePartialHand([])

    expect(parse.groups).toHaveLength(0)
    expect(parse.structurePoints).toBe(0)
    expect(parse.pair).toBeNull()
  })
})

describe('toPartialParsedHand', () => {
  it('separates the pair from the remaining melds', () => {
    const tiles = [
      suited(TileSuit.Manzu, 2, 0),
      suited(TileSuit.Manzu, 3, 0),
      suited(TileSuit.Manzu, 4, 0),
      suited(TileSuit.Pinzu, 7, 0),
      suited(TileSuit.Pinzu, 7, 1),
    ]

    const parse = parsePartialHand(tiles)
    const parsedHand = toPartialParsedHand(parse, tiles)

    expect(parsedHand.pair.type).toBe(MeldType.Pair)
    expect(parsedHand.melds.every((meld) => meld.type !== MeldType.Pair)).toBe(true)
  })

  it('supplies an empty placeholder pair when the selection has none', () => {
    const tiles = [suited(TileSuit.Manzu, 2), suited(TileSuit.Pinzu, 5)]

    const parse = parsePartialHand(tiles)
    const parsedHand = toPartialParsedHand(parse, tiles)

    expect(parse.pair).toBeNull()
    expect(parsedHand.pair.tiles).toHaveLength(0)
  })
})
