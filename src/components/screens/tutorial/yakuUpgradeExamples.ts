/**
 * Example plays for each Yaku upgrade family, shown as tiles in the Codex.
 *
 * Each example is written as the groups a player would see. Ordinary plays
 * are read by the same parser, classifier and family rule as a real play, so
 * the Codex can name the pattern and list every family the play scores; a
 * test checks that every example scores the family it illustrates.
 *
 * @module components/screens/tutorial/yakuUpgradeExamples
 */

import { Tile, TileSuit } from '../../../core/Tile'
import { parsePlay } from '../../../rules/PartialHandParser'
import { classifyPlay, type PlayPatternId } from '../../../rules/PlayPattern'
import {
  playOrbCategories,
  type YakuCategory,
} from '../../../systems/CelestialOrbSystem'

export interface UpgradeExampleGroup {
  suit: TileSuit
  ranks: number[]
}

export interface UpgradeExample {
  groups: UpgradeExampleGroup[]
  /** A complete Mahjong hand: it scores families through its Yaku. */
  complete?: boolean
}

export type UpgradeFamily = Exclude<YakuCategory, 'All'>

const m = (...ranks: number[]) => ({ suit: TileSuit.Manzu, ranks })
const p = (...ranks: number[]) => ({ suit: TileSuit.Pinzu, ranks })
const s = (...ranks: number[]) => ({ suit: TileSuit.Souzu, ranks })
/** Winds: 1 East, 2 South, 3 West, 4 North. */
const wind = (...ranks: number[]) => ({ suit: TileSuit.Wind, ranks })
/** Dragons: 1 White, 2 Green, 3 Red. */
const dragon = (...ranks: number[]) => ({ suit: TileSuit.Dragon, ranks })

/** Families an ordinary play can score, in the order the Codex lists them. */
export const PLAY_UPGRADE_FAMILIES = [
  'Pairs',
  'Pinfu',
  'Ittsu',
  'Toitoi',
  'Yakuhai',
  'Tanyao',
  'Chinitsu',
  'Honitsu',
  'Sanshoku',
] as const satisfies readonly UpgradeFamily[]

/** Families only a complete Mahjong hand can score. */
export const COMPLETE_HAND_UPGRADE_FAMILIES = [
  'SevenPairs',
  'Chanta',
  'Kokushi',
] as const satisfies readonly UpgradeFamily[]

export const UPGRADE_FAMILY_EXAMPLES: Record<UpgradeFamily, UpgradeExample[]> =
  {
    Pairs: [{ groups: [m(5, 5)] }, { groups: [m(3, 3), p(7, 7), s(8, 8)] }],
    Pinfu: [{ groups: [p(3, 4, 5)] }, { groups: [m(1, 2, 3), s(7, 8, 9)] }],
    Ittsu: [{ groups: [s(3, 4, 5, 6)] }, { groups: [m(2, 3, 4, 5, 6, 7)] }],
    Toitoi: [{ groups: [p(7, 7, 7)] }, { groups: [m(1, 1, 1), s(9, 9, 9)] }],
    Yakuhai: [
      { groups: [dragon(3, 3, 3)] },
      { groups: [wind(2, 2), wind(4, 4)] },
    ],
    Tanyao: [
      { groups: [m(2, 3, 4), p(5, 6, 7)] },
      { groups: [s(8, 8, 8), p(2, 2)] },
    ],
    Chinitsu: [
      { groups: [m(1, 2, 3), m(7, 8, 9)] },
      { groups: [p(5, 5, 5), p(3, 4, 5)] },
    ],
    Honitsu: [
      { groups: [m(3, 4, 5), dragon(3, 3)] },
      { groups: [wind(1, 1, 1), s(5, 5)] },
    ],
    Sanshoku: [
      { groups: [m(2, 3, 4), p(2, 3, 4)] },
      { groups: [s(5, 5), p(5, 5, 5)] },
    ],
    SevenPairs: [
      {
        complete: true,
        groups: [
          m(1, 1),
          m(4, 4),
          p(7, 7),
          s(2, 2),
          s(9, 9),
          wind(1, 1),
          dragon(3, 3),
        ],
      },
    ],
    Chanta: [
      {
        complete: true,
        groups: [m(1, 2, 3), p(7, 8, 9), s(1, 1, 1), m(9, 9, 9), wind(1, 1)],
      },
    ],
    Kokushi: [
      {
        complete: true,
        groups: [
          m(1, 9),
          p(1, 9),
          s(1, 9),
          wind(1, 2, 3, 4),
          dragon(1, 2, 3, 3),
        ],
      },
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

/** How an ordinary example reads: its pattern and every family it scores. */
export function readUpgradeExample(example: UpgradeExample): {
  pattern: PlayPatternId
  families: YakuCategory[]
} {
  const tiles = exampleTiles(example)
  const parse = parsePlay(tiles)
  const pattern = classifyPlay(parse.groups).id
  return { pattern, families: playOrbCategories(pattern, parse.groups, tiles) }
}
