import { TileSuit } from '../core/Tile'

export interface GuideTileGroup {
  label: string
  suit: TileSuit
  ranks: number[]
}
export interface GuideTileExample {
  title: string
  caption: string
  groups: GuideTileGroup[]
}

/** Authored example, tested by actual engine redraw and declaration. Not a seed forecast. */
export const HAND_BUILDING_EXAMPLE = {
  keep: [
    { label: 'Finished sequence', suit: TileSuit.Manzu, ranks: [1, 2, 3] },
    { label: 'Finished sequence', suit: TileSuit.Souzu, ranks: [4, 5, 6] },
    { label: 'Needs 1 or 4 of Circles', suit: TileSuit.Pinzu, ranks: [2, 3] },
    { label: 'Needs 4 or 7 of Circles', suit: TileSuit.Pinzu, ranks: [5, 6] },
    { label: 'The pair', suit: TileSuit.Wind, ranks: [1, 1] },
  ],
  exchange: [
    { label: 'Two unmatched Dragons', suit: TileSuit.Dragon, ranks: [1, 3] },
  ],
  replacements: [
    {
      label: 'One possible draw, not a prediction',
      suit: TileSuit.Pinzu,
      ranks: [1, 4],
    },
  ],
  complete: [
    { label: 'Sequence', suit: TileSuit.Manzu, ranks: [1, 2, 3] },
    { label: 'Sequence', suit: TileSuit.Souzu, ranks: [4, 5, 6] },
    { label: 'Sequence', suit: TileSuit.Pinzu, ranks: [1, 2, 3] },
    { label: 'Sequence', suit: TileSuit.Pinzu, ranks: [4, 5, 6] },
    { label: 'Pair', suit: TileSuit.Wind, ranks: [1, 1] },
  ],
} satisfies Record<string, GuideTileGroup[]>

export const HAND_BUILDING_PANELS: GuideTileExample[] = [
  {
    title: 'Keep the useful structure',
    groups: HAND_BUILDING_EXAMPLE.keep,
    caption:
      'Twelve tiles: two finished sequences, two unfinished sequences, and an East pair. These are ordinary same-suit groups, without rule-changing effects.',
  },
  {
    title: 'One redraw, two exchanged tiles',
    groups: HAND_BUILDING_EXAMPLE.exchange,
    caption:
      'The starting rack also contains these two unmatched Dragons. Exchanging both costs one redraw, not two. A different build might value these Honors; check your effects first.',
  },
  {
    title: 'If the replacements are 1 and 4 of Circles…',
    groups: HAND_BUILDING_EXAMPLE.complete,
    caption:
      'The resulting fourteen tiles make four sequences and a pair. The drawn 1 and 4 finish separate groups; one physical 4 cannot complete both. This is an example outcome, not a promised draw or guaranteed round win.',
  },
]
