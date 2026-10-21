import { describe, expect, it } from 'vitest'
import { MeldType } from '../core/Meld'
import { Tile, TileSuit } from '../core/Tile'
import { groupHand } from './handGroups'
import { parsePartialHand } from '../rules/PartialHandParser'

const tile = (suit: TileSuit, rank: number, id: string) =>
  new Tile(suit, rank, id)
const ids = (tiles: Tile[]) => tiles.map((t) => t.id)

describe('groupHand', () => {
  it('keeps each group among the loose tiles of its own suit', () => {
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

    expect(clusters.map((c) => [c.kind, c.suit])).toEqual([
      [MeldType.Sequence, TileSuit.Manzu],
      ['loose', TileSuit.Manzu],
      [MeldType.Pair, TileSuit.Pinzu],
      ['loose', TileSuit.Dragon],
    ])
    expect(clusters.map((c) => ids(c.tiles))).toEqual([
      ['m2', 'm3', 'm4'],
      ['m9'],
      ['p5a', 'p5b'],
      ['white'],
    ])
    expect(clusters.map((c) => c.structurePoints)).toEqual([30, 0, 15, 0])
  })

  it('places groups and loose tiles in rack order within a suit', () => {
    const rack = [
      tile(TileSuit.Manzu, 1, 'm1'),
      tile(TileSuit.Manzu, 3, 'm3'),
      tile(TileSuit.Manzu, 4, 'm4'),
      tile(TileSuit.Manzu, 5, 'm5'),
      tile(TileSuit.Manzu, 7, 'm7a'),
      tile(TileSuit.Manzu, 7, 'm7b'),
      tile(TileSuit.Manzu, 9, 'm9'),
      tile(TileSuit.Pinzu, 3, 'p3'),
      tile(TileSuit.Souzu, 5, 's5a'),
      tile(TileSuit.Souzu, 5, 's5b'),
      tile(TileSuit.Souzu, 5, 's5c'),
      tile(TileSuit.Souzu, 8, 's8'),
      tile(TileSuit.Wind, 1, 'east-a'),
      tile(TileSuit.Wind, 1, 'east-b'),
    ]

    const clusters = groupHand(rack)

    expect(clusters.map((c) => [c.kind, ids(c.tiles)])).toEqual([
      ['loose', ['m1']],
      [MeldType.Sequence, ['m3', 'm4', 'm5']],
      [MeldType.Pair, ['m7a', 'm7b']],
      ['loose', ['m9']],
      ['loose', ['p3']],
      [MeldType.Triplet, ['s5a', 's5b', 's5c']],
      ['loose', ['s8']],
      [MeldType.Pair, ['east-a', 'east-b']],
    ])
  })

  it('keeps a suit together even when the rack splits it', () => {
    const rack = [
      tile(TileSuit.Manzu, 9, 'm9'),
      tile(TileSuit.Pinzu, 5, 'p5a'),
      tile(TileSuit.Souzu, 2, 's2'),
      tile(TileSuit.Souzu, 3, 's3'),
      tile(TileSuit.Souzu, 4, 's4'),
      tile(TileSuit.Pinzu, 5, 'p5b'),
      tile(TileSuit.Manzu, 1, 'm1'),
    ]

    expect(groupHand(rack).map((c) => [c.kind, ids(c.tiles)])).toEqual([
      ['loose', ['m9', 'm1']],
      [MeldType.Pair, ['p5a', 'p5b']],
      [MeldType.Sequence, ['s2', 's3', 's4']],
    ])
  })

  it('keeps every tile exactly once', () => {
    const rack = [1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 7, 7].map((rank, index) =>
      tile(TileSuit.Souzu, rank, `s${rank}-${index}`)
    )

    const placed = groupHand(rack).flatMap((cluster) => ids(cluster.tiles))

    expect(placed.sort()).toEqual(ids(rack).sort())
  })

  it('shows a Straight of four, not a Sequence and a Pair that pay the same', () => {
    const rack = [
      tile(TileSuit.Manzu, 2, 'm2'),
      tile(TileSuit.Manzu, 3, 'm3'),
      tile(TileSuit.Manzu, 4, 'm4'),
      tile(TileSuit.Manzu, 5, 'm5a'),
      tile(TileSuit.Manzu, 5, 'm5b'),
      tile(TileSuit.Pinzu, 9, 'p9'),
    ]

    const clusters = groupHand(rack)

    expect(clusters.map((c) => [c.kind, ids(c.tiles)])).toEqual([
      [MeldType.Straight, ['m2', 'm3', 'm4', 'm5a']],
      ['loose', ['m5b']],
      ['loose', ['p9']],
    ])
    expect(clusters[0].structurePoints).toBe(45)
  })

  it('shows a five-tile run as one Straight, with or without Plum, never a duplicate tile', () => {
    const rack = [1, 2, 3, 4, 5].map((rank) =>
      tile(TileSuit.Manzu, rank, `m${rank}`)
    )
    for (const rules of [{}, { allowSequenceOverlap: true }]) {
      const clusters = groupHand(rack, new Set(), rules)
      expect(clusters).toHaveLength(1)
      expect(clusters[0]).toMatchObject({
        kind: MeldType.Straight,
        structurePoints: 60,
        groupCount: 1,
      })
      expect(ids(clusters[0].tiles)).toEqual(ids(rack))
    }
  })

  it.each(
    [false, true].flatMap((allowSequenceSkip) =>
      [false, true].map((allowTerminalAnchor) => ({
        allowSequenceSkip,
        allowTerminalAnchor,
        allowSequenceOverlap: true,
      }))
    )
  )(
    'keeps physical copies unique while preserving authoritative structure points under %j',
    (rules) => {
      const rack = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 1, 2, 2].map((rank, index) =>
        tile(TileSuit.Manzu, rank, `m${rank}-${index}`)
      )
      const clusters = groupHand(rack, new Set(), rules)
      expect(clusters.flatMap((cluster) => ids(cluster.tiles)).sort()).toEqual(
        ids(rack).sort()
      )
      expect(
        clusters.reduce((total, cluster) => total + cluster.structurePoints, 0)
      ).toBe(parsePartialHand(rack, rules).structurePoints)
    }
  )

  it('never groups a concealed or bonus tile, and puts concealed tiles last', () => {
    const rack = [
      tile(TileSuit.Wind, 1, 'east-a'),
      tile(TileSuit.Wind, 1, 'east-hidden'),
      tile(TileSuit.Flower, 1, 'plum'),
    ]

    const clusters = groupHand(rack, new Set(['east-hidden']))

    expect(clusters.map((c) => [c.kind, c.suit, ids(c.tiles)])).toEqual([
      ['loose', TileSuit.Wind, ['east-a']],
      ['loose', TileSuit.Flower, ['plum']],
      ['loose', null, ['east-hidden']],
    ])
  })

  it('omits the loose cluster when every tile is grouped', () => {
    const rack = [
      tile(TileSuit.Wind, 2, 'south-a'),
      tile(TileSuit.Wind, 2, 'south-b'),
    ]

    expect(groupHand(rack).map((c) => c.kind)).toEqual([MeldType.Pair])
  })
})
