import { Tile, TileSuit } from '../core/Tile'
import { KOKUSHI_TILES, type HandValidationOptions } from './HandValidator'

/** Find a physical hand by assembling shapes, not by enumerating rack subsets.
 * The caller remains authoritative for legality and rule interpretation.
 * First accepted result is stable, but is not promised to maximize score.
 */
export function findCompleteHandSubset(
  tiles: readonly Tile[],
  accept: (ids: string[]) => boolean,
  requiredIds: readonly string[] = [],
  options: Omit<HandValidationOptions, 'wildcardCount'> = {}
): string[] | null {
  if (
    tiles.some((t) => t.isBonus) ||
    new Set(tiles.map((t) => t.id)).size !== tiles.length
  )
    return null
  const required = new Set(requiredIds)
  if (requiredIds.some((id) => !tiles.some((t) => t.id === id))) return null
  const buckets = new Map<string, Tile[]>()
  for (const tile of tiles) {
    const bucket = buckets.get(tile.typeKey) ?? []
    bucket.push(tile)
    buckets.set(tile.typeKey, bucket)
  }
  const groups = [...buckets.values()].map((bucket) =>
    [...bucket].sort(
      (a, b) => Number(required.has(b.id)) - Number(required.has(a.id))
    )
  )
  const counts = groups.map((g) => g.length)
  const used = counts.map(() => 0)
  const seen = new Set<string>()
  const offer = (): string[] | null => {
    const selected = new Set(
      groups.flatMap((g, i) => g.slice(0, used[i]).map((t) => t.id))
    )
    if (requiredIds.some((id) => !selected.has(id))) return null
    const ids = tiles.filter((t) => selected.has(t.id)).map((t) => t.id)
    const key = JSON.stringify(ids)
    if (seen.has(key)) return null
    seen.add(key)
    return accept(ids) ? ids : null
  }
  const adjustCounts = (indices: number[], delta: number) => {
    for (const i of indices) used[i] += delta
  }
  const fits = (indices: number[]) => {
    const needed = new Map<number, number>()
    for (const i of indices) needed.set(i, (needed.get(i) ?? 0) + 1)
    return [...needed].every(([i, n]) => used[i] + n <= counts[i])
  }

  // Every possible triplet/sequence of types in this rack. Physical duplicates
  // are interchangeable for structure; required copies are always chosen first.
  const melds: number[][] = []
  groups.forEach((g, i) => {
    if (g.length >= 3) melds.push([i, i, i])
    const first = g[0]
    if (!first.isSuited) return
    for (const [a, b] of options.allowSequenceSkip
      ? [
          [1, 2],
          [1, 3],
          [2, 3],
        ]
      : [[1, 2]]) {
      const matches = (offset: number) =>
        groups.flatMap((other, j) =>
          other[0].isSuited &&
          other[0].rank === first.rank + offset &&
          (options.suitsMatchForSequences || other[0].suit === first.suit)
            ? [j]
            : []
        )
      for (const second of matches(a))
        for (const third of matches(b)) melds.push([i, second, third])
    }
  })
  const failed = new Set<string>()
  const searchMelds = (left: number, start: number): string[] | null => {
    if (left === 0) return offer()
    const key = `${left}:${start}:${used.join(',')}`
    if (failed.has(key)) return null
    for (let i = start; i < melds.length; i++) {
      if (!fits(melds[i])) continue
      adjustCounts(melds[i], 1)
      const found = searchMelds(left - 1, i)
      adjustCounts(melds[i], -1)
      if (found) return found
    }
    failed.add(key)
    return null
  }
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] < 2) continue
    used[i] = 2
    const found = searchMelds(4, 0)
    used[i] = 0
    if (found) return found
  }
  if (options.meldMayServeAsPair) {
    const found = searchMelds(4, 0)
    if (found) return found
  }

  const pairs = counts.flatMap((n, i) => (n >= 2 ? [i] : []))
  const searchPairs = (left: number, start: number): string[] | null => {
    if (left === 0) return offer()
    for (let j = start; j <= pairs.length - left; j++) {
      used[pairs[j]] = 2
      const found = searchPairs(left - 1, j + 1)
      used[pairs[j]] = 0
      if (found) return found
    }
    return null
  }
  const seven = searchPairs(7, 0)
  if (seven) return seven
  const orphans = KOKUSHI_TILES.map(({ suit, rank }) =>
    groups.findIndex((g) => g[0].suit === suit && g[0].rank === rank)
  )
  if (orphans.every((i) => i >= 0)) {
    for (const i of orphans) used[i] = 1
    for (const i of orphans) {
      if (counts[i] < 2) continue
      used[i]++
      const found = offer()
      used[i]--
      if (found) return found
    }
  }
  return null
}

export const REGULAR_TILE_TYPES = [
  [TileSuit.Manzu, 9],
  [TileSuit.Pinzu, 9],
  [TileSuit.Souzu, 9],
  [TileSuit.Wind, 4],
  [TileSuit.Dragon, 3],
] as const
