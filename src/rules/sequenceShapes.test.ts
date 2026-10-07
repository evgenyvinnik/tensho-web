import { expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { parsePartialHand } from './PartialHandParser'
import {
  describeFlowerSequences,
  overlappingSequencePairs,
  type SequenceRules,
} from './sequenceShapes'

const rack = (ranks: number[], suit = TileSuit.Manzu) =>
  ranks.map((rank, i) => new Tile(suit, rank, `${suit}-${i}`))

/** Deliberately enumerate physical copies: a small independent correctness oracle. */
function brutePairs(tiles: Tile[], rules: SequenceRules): [Meld, Meld][] {
  const groups: Meld[] = []
  for (let i = 0; i < tiles.length; i++)
    for (let j = i + 1; j < tiles.length; j++)
      for (let k = j + 1; k < tiles.length; k++) {
        const group = [tiles[i], tiles[j], tiles[k]].sort(
          (a, b) => a.rank - b.rank
        )
        const [a, b, c] = group
        if (group.some((tile) => !tile.isSuited)) continue
        if (
          !rules.suitsMatchForSequences &&
          group.some((tile) => tile.suit !== a.suit)
        )
          continue
        const normal = b.rank === a.rank + 1 && c.rank === b.rank + 1
        const winter =
          rules.allowSequenceSkip &&
          c.rank === a.rank + 3 &&
          b.rank > a.rank &&
          b.rank < c.rank
        const bamboo =
          rules.allowTerminalAnchor &&
          ((a.rank === 1 && b.rank > a.rank && c.rank === b.rank + 1) ||
            (c.rank === 9 && b.rank < c.rank && b.rank === a.rank + 1))
        if (normal || winter || bamboo)
          groups.push(new Meld(MeldType.Sequence, group, true))
      }
  const pairs: [Meld, Meld][] = []
  for (let i = 0; i < groups.length; i++)
    for (let j = i + 1; j < groups.length; j++)
      if (
        groups[i].tiles.filter((tile) =>
          groups[j].tiles.some((other) => other.id === tile.id)
        ).length === 1
      )
        pairs.push([groups[i], groups[j]])
  return pairs
}

const shapeKey = (pair: [Meld, Meld]) => {
  const shared = pair[0].tiles.find((tile) =>
    pair[1].tiles.some((other) => other.id === tile.id)
  )!
  return `${pair
    .map((group) =>
      group.tiles
        .map((tile) => tile.typeKey)
        .sort()
        .join(',')
    )
    .sort()
    .join('|')}:${shared.typeKey}`
}

it.each([
  {},
  { allowSequenceSkip: true },
  { allowTerminalAnchor: true },
  { allowSequenceSkip: true, allowTerminalAnchor: true },
  { allowTerminalAnchor: true, suitsMatchForSequences: true },
])(
  'canonical overlap candidates match physical-copy enumeration: %j',
  (rules) => {
    const fixtures = [
      rack([1, 2, 3, 4, 5]),
      rack([1, 1, 2, 2, 3]), // Two identical facesets, but only one physical bridge.
      rack([1, 2, 4, 5, 6, 9]),
      rack([1, 1, 4, 5, 5, 6, 8, 9]),
      [...rack([1, 2, 3, 4]), ...rack([2, 3, 5, 9], TileSuit.Pinzu)],
      [...rack([1, 2, 3]), ...rack([1, 2, 3], TileSuit.Wind)],
    ]
    for (let seed = 1; seed <= 24; seed++)
      fixtures.push(
        rack(
          Array.from(
            { length: 8 },
            (_, i) => ((seed * (i + 3) + i * i) % 9) + 1
          )
        )
      )
    for (const tiles of fixtures) {
      const actual = [...overlappingSequencePairs(tiles, rules)]
      const oracle = brutePairs(tiles, rules)
      expect(new Set(actual.map(shapeKey))).toEqual(
        new Set(oracle.map(shapeKey))
      )
      for (const pair of actual) {
        expect(
          new Set(pair.flatMap((group) => group.tiles.map((tile) => tile.id)))
            .size
        ).toBe(5)
        expect(
          pair
            .flatMap((group) => group.tiles)
            .every((tile) => tiles.includes(tile))
        ).toBe(true)
      }
      if (rules.suitsMatchForSequences) continue // Tactical parsing intentionally keeps suits distinct.
      let best = parsePartialHand(tiles, rules).structurePoints
      for (const pair of oracle) {
        const used = new Set(
          pair.flatMap((group) => group.tiles.map((tile) => tile.id))
        )
        best = Math.max(
          best,
          60 +
            parsePartialHand(
              tiles.filter((tile) => !used.has(tile.id)),
              rules
            ).structurePoints
        )
      }
      expect(
        parsePartialHand(tiles, { ...rules, allowSequenceOverlap: true })
          .structurePoints
      ).toBe(best)
    }
  }
)

it('does not multiply candidate work by interchangeable physical copies on enlarged racks', () => {
  const rules = {
    allowSequenceSkip: true,
    allowTerminalAnchor: true,
    allowSequenceOverlap: true,
  }
  const twoCopies = rack(Array.from({ length: 18 }, (_, i) => (i % 9) + 1))
  const fourCopies = rack(Array.from({ length: 36 }, (_, i) => (i % 9) + 1))
  expect([...overlappingSequencePairs(fourCopies, rules)].length).toBe(
    [...overlappingSequencePairs(twoCopies, rules)].length
  )
  const tiles = fourCopies.slice(0, 28)
  const parsed = parsePartialHand(tiles, rules)
  expect(parsed.structurePoints).toBe(385)
  const members = parsed.groups.flatMap((group) => group.tiles)
  expect(members.every((tile) => tiles.includes(tile))).toBe(true)
  const shared = new Set(
    members
      .filter(
        (tile, i) => members.findIndex((other) => other.id === tile.id) !== i
      )
      .map((tile) => tile.id)
  )
  expect(shared.size).toBeLessThanOrEqual(1)
})

it('describes only the actual special groups and never attributes ordinary/Winter sequences to Bamboo', () => {
  const tiles = rack([1, 2, 3, 4, 5])
  const groups = parsePartialHand(tiles, { allowSequenceOverlap: true }).groups
  expect(
    describeFlowerSequences(groups, { allowSequenceOverlap: true })?.overlapping
  ).toEqual(groups.map((group) => group.tiles))
  expect(describeFlowerSequences(groups, {})).toBeUndefined()
  const anchored = new Meld(MeldType.Sequence, rack([1, 5, 6]), true)
  const skipped = new Meld(MeldType.Sequence, rack([1, 2, 4]), true)
  expect(
    describeFlowerSequences([anchored, skipped], {
      allowTerminalAnchor: true,
      allowSequenceSkip: true,
    })?.anchored
  ).toEqual([anchored.tiles])
  expect(
    describeFlowerSequences(groups, { allowTerminalAnchor: true })
  ).toBeUndefined()
})
