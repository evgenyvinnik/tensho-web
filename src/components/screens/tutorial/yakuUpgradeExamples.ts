/**
 * Example plays for each Yaku upgrade family, shown as tiles in the Codex.
 *
 * Each example is written as the groups and loose tiles a player would see.
 * It is read by the same parser, classifier and family rule as a real play,
 * so the Codex names the pattern and lists every family the play scores; a
 * test checks that every example scores the family it illustrates.
 *
 * @module components/screens/tutorial/yakuUpgradeExamples
 */

import { Tile, TileSuit } from '../../../core/Tile'
import { parsePlay } from '../../../rules/PartialHandParser'
import { classifyPlay, type PlayPatternId } from '../../../rules/PlayPattern'
import {
  TILE_FAMILY_IDS,
  playOrbCategories,
  type YakuCategory,
} from '../../../systems/CelestialOrbSystem'

export interface UpgradeExampleGroup {
  suit: TileSuit
  ranks: number[]
}

export interface UpgradeExample {
  groups: UpgradeExampleGroup[]
}

export type UpgradeFamily = Exclude<YakuCategory, 'All'>

const m = (...ranks: number[]) => ({ suit: TileSuit.Manzu, ranks })
const p = (...ranks: number[]) => ({ suit: TileSuit.Pinzu, ranks })
const s = (...ranks: number[]) => ({ suit: TileSuit.Souzu, ranks })
/** Winds: 1 East, 2 South, 3 West, 4 North. */
const wind = (...ranks: number[]) => ({ suit: TileSuit.Wind, ranks })
/** Dragons: 1 White, 2 Green, 3 Red. */
const dragon = (...ranks: number[]) => ({ suit: TileSuit.Dragon, ranks })

/** Pattern families: a play scores the one its groups make. */
export const PATTERN_UPGRADE_FAMILIES = [
  'Pairs',
  'ThreePairs',
  'Sequence',
  'SequencePair',
  'TwoSequences',
  'Triplets',
  'FullHouse',
  'Straights',
  'Quads',
] as const satisfies readonly UpgradeFamily[]

/** Tile families: they stack on the pattern family. */
export const TILE_UPGRADE_FAMILIES = TILE_FAMILY_IDS

export const UPGRADE_FAMILY_EXAMPLES: Record<UpgradeFamily, UpgradeExample[]> =
  {
    Pairs: [{ groups: [m(5, 5)] }, { groups: [m(3, 3), m(7, 7)] }],
    ThreePairs: [{ groups: [s(2, 2), s(6, 6), s(8, 8)] }],
    Sequence: [{ groups: [p(3, 4, 5)] }, { groups: [m(7, 8, 9)] }],
    SequencePair: [{ groups: [s(2, 3, 4), s(9, 9)] }],
    TwoSequences: [{ groups: [m(1, 2, 3), m(7, 8, 9)] }],
    Triplets: [{ groups: [p(7, 7, 7)] }, { groups: [m(1, 1, 1), m(3, 4, 5)] }],
    FullHouse: [{ groups: [s(8, 8, 8), s(2, 2)] }],
    Straights: [{ groups: [s(3, 4, 5, 6)] }, { groups: [m(2, 3, 4, 5, 6, 7)] }],
    Quads: [{ groups: [p(5, 5, 5, 5)] }, { groups: [m(9, 9, 9, 9), m(1, 1)] }],
    Winds: [
      { groups: [m(3, 4, 5), wind(1)] },
      { groups: [wind(2, 2), wind(4, 4)] },
    ],
    Dragons: [
      { groups: [dragon(3, 3, 3)] },
      { groups: [p(2, 3, 4), dragon(2, 2)] },
    ],
    MixedSuits: [
      { groups: [m(2, 3, 4), p(6, 7, 8)] },
      { groups: [m(5, 5), p(5, 5)] },
    ],
    Loose: [
      { groups: [m(3, 4, 5), m(9), m(1)] },
      { groups: [m(7, 7), dragon(3), wind(1)] },
    ],
  }

/** Fresh tiles for an example, in the order its groups list them. */
export function exampleTiles(example: UpgradeExample): Tile[] {
  return example.groups.flatMap((group, g) =>
    group.ranks.map(
      (rank, r) => new Tile(group.suit, rank, `codex-upgrade-${g}-${r}`)
    )
  )
}

/**
 * How an example reads: its pattern, and each family it scores with how many
 * times it pays (Loose Tiles pays once per loose tile).
 */
export function readUpgradeExample(example: UpgradeExample): {
  pattern: PlayPatternId
  families: { family: YakuCategory; times: number }[]
} {
  const tiles = exampleTiles(example)
  const parse = parsePlay(tiles)
  const pattern = classifyPlay(parse.groups).id
  const families: { family: YakuCategory; times: number }[] = []
  for (const family of playOrbCategories(pattern, parse.groups, tiles)) {
    const seen = families.find((entry) => entry.family === family)
    if (seen) seen.times += 1
    else families.push({ family, times: 1 })
  }
  return { pattern, families }
}
