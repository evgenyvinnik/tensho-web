import { describe, expect, it } from 'vitest'
import { MeldType } from '../core/Meld'
import { Tile, TileSuit } from '../core/Tile'
import { groupHand } from './handGroups'

const tile = (suit: TileSuit, rank: number, id: string) =>
  new Tile(suit, rank, id)
const ids = (tiles: Tile[]) => tiles.map((t) => t.id)

describe('groupHand', () => {
  it('shows each scoring group in rack order, then the loose tiles', () => {
    const rack = [
      tile(TileSuit.Manzu, 2, 'm2'),
      tile(TileSuit.Manzu, 3, 'm3'),
      tile(TileSuit.Manzu, 4, 'm4'),
      tile(TileSuit.Manzu, 9, 'm9'),
      tile(TileSuit.Pinzu, 5, 'p5a'),
      tile(TileSuit.Pinzu, 5, 'p5b'),
      tile(TileSuit.Dragon, 1, 'white'),
    ]

    const clusters = groupHand(rack)

    expect(clusters.map((c) => c.kind)).toEqual([
      MeldType.Sequence,
      MeldType.Pair,
      'loose',
    ])
    expect(ids(clusters[0].tiles)).toEqual(['m2', 'm3', 'm4'])
    expect(clusters[0].structurePoints).toBe(30)
    expect(ids(clusters[1].tiles)).toEqual(['p5a', 'p5b'])
    expect(clusters[1].structurePoints).toBe(15)
    expect(ids(clusters[2].tiles)).toEqual(['m9', 'white'])
    expect(clusters[2].structurePoints).toBe(0)
  })

  it('keeps every tile exactly once', () => {
    const rack = [1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 7, 7].map((rank, index) =>
      tile(TileSuit.Souzu, rank, `s${rank}-${index}`)
    )

    const placed = groupHand(rack).flatMap((cluster) => ids(cluster.tiles))

    expect(placed.sort()).toEqual(ids(rack).sort())
  })

  it('never groups a concealed or bonus tile', () => {
    const rack = [
      tile(TileSuit.Wind, 1, 'east-a'),
      tile(TileSuit.Wind, 1, 'east-hidden'),
      tile(TileSuit.Flower, 1, 'plum'),
    ]

    const clusters = groupHand(rack, new Set(['east-hidden']))

    expect(clusters).toHaveLength(1)
    expect(clusters[0].kind).toBe('loose')
    expect(ids(clusters[0].tiles)).toEqual(['east-a', 'east-hidden', 'plum'])
  })

  it('omits the loose cluster when every tile is grouped', () => {
    const rack = [
      tile(TileSuit.Wind, 2, 'south-a'),
      tile(TileSuit.Wind, 2, 'south-b'),
    ]

    expect(groupHand(rack).map((c) => c.kind)).toEqual([MeldType.Pair])
  })
})
