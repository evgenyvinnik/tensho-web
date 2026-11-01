import { Tile, TileSuit } from '../core/Tile'
import { KOKUSHI_TILES, type HandValidationOptions } from './HandValidator'
import { sequenceOffsets, overlappingSequencePairs } from './sequenceShapes'

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
  // A Stone has no face to build a shape with; a required one rides along.
  const ridingStones = tiles
    .filter((tile) => tile.isStone && requiredIds.includes(tile.id))
    .map((tile) => tile.id)
  tiles = tiles.filter((tile) => !tile.isStone)
  requiredIds = requiredIds.filter((id) => !ridingStones.includes(id))
  if (
    tiles.some((t) => t.isBonus) ||
    new Set(tiles.map((t) => t.id)).size !== tiles.length
  )
    return null
  const required = new Set(requiredIds)
  if (requiredIds.some((id) => !tiles.some((t) => t.id === id))) return null
  // A Wild copy can stand in for other suits, so it never shares a bucket
  // with natural copies of its printed face.
  const bucketKey = (tile: Tile) =>
    tile.isWild && tile.isSuited ? `${tile.typeKey}*` : tile.typeKey
  const buckets = new Map<string, Tile[]>()
  for (const tile of tiles) {
    const bucket = buckets.get(bucketKey(tile)) ?? []
    bucket.push(tile)
    buckets.set(bucketKey(tile), bucket)
  }
  const keys = [...buckets.keys()]
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
    const ids = [
      ...tiles.filter((t) => selected.has(t.id)).map((t) => t.id),
      ...ridingStones,
    ]
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

  // Every possible pair/triplet/sequence of types in this rack. Physical
  // duplicates are interchangeable for structure; required copies are always
  // chosen first. A Wild bucket may join buckets of any suit at its rank;
  // without one, every group is a single face or a same-suit run.
  const hasWild = groups.some((g) => g[0].isWild && g[0].isSuited)
  const pairOptions: number[][] = []
  const melds: number[][] = []
  groups.forEach((g, i) => {
    const first = g[0]
    const later = hasWild
      ? groups.flatMap((other, j) =>
          j > i && first.matches(other[0]) ? [j] : []
        )
      : []
    if (g.length >= 2) pairOptions.push([i, i])
    for (const j of later) pairOptions.push([i, j])
    if (g.length >= 3) melds.push([i, i, i])
    for (const triplet of later.flatMap((j) => [
      [i, i, j],
      [i, j, j],
      ...later.filter((k) => k > j).map((k) => [i, j, k]),
    ]))
      if (fits(triplet) && Tile.shareFace(triplet.map((t) => groups[t][0])))
        melds.push(triplet)
    if (!first.isSuited) return
    const anySuit = !!options.suitsMatchForSequences
    for (const [a, b] of sequenceOffsets(first.rank, options)) {
      const matches = (offset: number) =>
        groups.flatMap((other, j) =>
          other[0].isSuited &&
          other[0].rank === first.rank + offset &&
          (anySuit ||
            other[0].suit === first.suit ||
            first.isWild ||
            other[0].isWild)
            ? [j]
            : []
        )
      for (const second of matches(a))
        for (const third of matches(b))
          if (
            anySuit ||
            !hasWild ||
            Tile.shareSuit([first, groups[second][0], groups[third][0]])
          )
            melds.push([i, second, third])
    }
  })
  const withPair = (search: () => string[] | null): string[] | null => {
    for (const pair of pairOptions) {
      if (!fits(pair)) continue
      adjustCounts(pair, 1)
      const found = search()
      adjustCounts(pair, -1)
      if (found) return found
    }
    return null
  }
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
  const standard = withPair(() => searchMelds(4, 0))
  if (standard) return standard
  if (options.meldMayServeAsPair) {
    const found = searchMelds(4, 0)
    if (found) return found
  }

  if (options.allowSequenceOverlap) {
    const overlapsSeen = new Set<string>()
    for (const pair of overlappingSequencePairs(tiles, options)) {
      const union = new Map(
        pair.flatMap((group) =>
          group.tiles.map((tile) => [tile.id, tile] as const)
        )
      )
      const indices = [...union.values()].map((tile) =>
        keys.indexOf(bucketKey(tile))
      )
      const key = [...indices].sort((a, b) => a - b).join(',')
      if (overlapsSeen.has(key)) continue
      overlapsSeen.add(key)
      adjustCounts(indices, 1)
      const found = withPair(() => searchMelds(2, 0))
      if (found) return found
      if (options.meldMayServeAsPair) {
        const found = searchMelds(2, 0)
        if (found) return found
      }
      adjustCounts(indices, -1)
    }
  }

  // Seven Pairs and Thirteen Orphans are judged on printed faces: seven
  // different faces, two copies each, whether or not a copy is Wild.
  const facePairs = pairOptions.filter(
    ([i, j]) => groups[i][0].typeKey === groups[j][0].typeKey
  )
  const pairedFaces = new Set<string>()
  const searchPairs = (left: number, start: number): string[] | null => {
    if (left === 0) return offer()
    for (let p = start; p <= facePairs.length - left; p++) {
      const pair = facePairs[p]
      const face = groups[pair[0]][0].typeKey
      if (pairedFaces.has(face) || !fits(pair)) continue
      pairedFaces.add(face)
      adjustCounts(pair, 1)
      const found = searchPairs(left - 1, p + 1)
      adjustCounts(pair, -1)
      pairedFaces.delete(face)
      if (found) return found
    }
    return null
  }
  const seven = searchPairs(7, 0)
  if (seven) return seven
  const orphanFaces = KOKUSHI_TILES.map(({ suit, rank }) =>
    groups.flatMap((g, i) =>
      g[0].suit === suit && g[0].rank === rank ? [i] : []
    )
  )
  if (orphanFaces.every((faces) => faces.length > 0)) {
    for (const faces of orphanFaces) used[faces[0]] = 1
    for (const i of orphanFaces.flat()) {
      if (used[i] + 1 > counts[i]) continue
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
