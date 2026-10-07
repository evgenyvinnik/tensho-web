import { Tile } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'

export interface SequenceRules {
  allowSequenceSkip?: boolean
  allowTerminalAnchor?: boolean
  allowSequenceOverlap?: boolean
  suitsMatchForSequences?: boolean
}

/** Ordered offsets keep ordinary parses stable. Bamboo supplies an endpoint
 * anchor beside two adjacent ranks; Winter does not widen that adjacency.
 */
export function sequenceOffsets(
  first: number,
  rules: SequenceRules
): number[][] {
  const patterns = [[1, 2]]
  if (rules.allowSequenceSkip) patterns.push([1, 3], [2, 3])
  if (rules.allowTerminalAnchor) {
    if (first === 1)
      for (let middle = 2; middle < 9; middle++)
        patterns.push([middle - 1, middle])
    if (first < 8) patterns.push([1, 9 - first])
  }
  const seen = new Set<string>()
  return patterns.filter(([a, b]) => {
    const key = `${a}:${b}`
    if (a >= b || first + b > 9 || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Enumerate face shapes once, not every permutation of interchangeable copies. */
function physicalSequences(
  tiles: readonly Tile[],
  rules: SequenceRules
): Meld[] {
  const suited = [
    ...new Map(
      tiles.filter((t) => t.isSuited).map((t) => [t.typeKey, t])
    ).values(),
  ].sort((a, b) => a.rank - b.rank || Tile.compare(a, b))
  const result: Meld[] = []
  for (let i = 0; i < suited.length; i++)
    for (let j = i + 1; j < suited.length; j++)
      for (let k = j + 1; k < suited.length; k++) {
        const a = suited[i],
          b = suited[j],
          c = suited[k]
        if (
          !rules.suitsMatchForSequences &&
          (a.suit !== b.suit || a.suit !== c.suit)
        )
          continue
        if (
          sequenceOffsets(a.rank, rules).some(
            ([x, y]) => a.rank + x === b.rank && a.rank + y === c.rank
          )
        )
          result.push(new Meld(MeldType.Sequence, [a, b, c], true))
      }
  return result
}

/** Plum shares exactly one real tile between two sequences, once per play. */
export function* overlappingSequencePairs(
  tiles: readonly Tile[],
  rules: SequenceRules
): Generator<[Meld, Meld]> {
  const groups = physicalSequences(tiles, rules)
  const pools = new Map<string, Tile[]>()
  for (const tile of tiles) {
    const pool = pools.get(tile.typeKey) ?? []
    pool.push(tile)
    pools.set(tile.typeKey, pool)
  }
  for (let i = 0; i < groups.length; i++)
    for (let j = i; j < groups.length; j++) {
      const a = groups[i],
        b = groups[j]
      for (const bridge of a.tiles.filter((tile) =>
        b.tiles.some((other) => tile.typeKey === other.typeKey)
      )) {
        const used = new Map<string, number>()
        const shared = pools.get(bridge.typeKey)![0]
        const materialized = [a, b].map((group) =>
          group.tiles.map((face) => {
            if (face.typeKey === bridge.typeKey) return shared
            const count = used.get(face.typeKey) ?? 0
            used.set(face.typeKey, count + 1)
            return pools.get(face.typeKey)?.[count]
          })
        )
        if (materialized.some((group) => group.some((tile) => !tile))) continue
        yield materialized.map(
          (group) => new Meld(MeldType.Sequence, group as Tile[], true)
        ) as [Meld, Meld]
      }
    }
}

export interface FlowerSequenceDetails {
  overlapping: Tile[][]
  anchored: Tile[][]
}

/** Explain only groups the authoritative paid parse actually used. */
export function describeFlowerSequences(
  groups: readonly Meld[],
  rules: SequenceRules
): FlowerSequenceDetails | undefined {
  const sequences = groups.filter((group) => group.type === MeldType.Sequence)
  const occurrences = new Map<string, number>()
  for (const group of sequences)
    for (const tile of group.tiles)
      occurrences.set(tile.id, (occurrences.get(tile.id) ?? 0) + 1)
  const overlapping = rules.allowSequenceOverlap
    ? sequences
        .filter((group) =>
          group.tiles.some((tile) => occurrences.get(tile.id)! > 1)
        )
        .map((group) => group.tiles)
    : []
  const anchored = rules.allowTerminalAnchor
    ? sequences
        .filter((group) => {
          const [a, b, c] = group.tiles
            .map((tile) => tile.rank)
            .sort((a, b) => a - b)
          return !sequenceOffsets(a, {
            allowSequenceSkip: rules.allowSequenceSkip,
          }).some(([x, y]) => a + x === b && a + y === c)
        })
        .map((group) => group.tiles)
    : []
  return overlapping.length || anchored.length
    ? { overlapping, anchored }
    : undefined
}
