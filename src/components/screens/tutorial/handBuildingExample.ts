import { TileSuit } from '../../../core/Tile'

export interface ExampleTileGroup {
  suit: TileSuit
  ranks: number[]
}

/**
 * The Codex's worked bigger-hand example, tested by an actual engine REDRAW
 * and play. Not a seed forecast: the replacements are one possible draw.
 */
export const HAND_BUILDING_EXAMPLE = {
  // Two finished sequences, Circles 2–3 and 5–6 waiting on 1/4 and 4/7, East pair.
  keep: [
    { suit: TileSuit.Manzu, ranks: [1, 2, 3] },
    { suit: TileSuit.Souzu, ranks: [4, 5, 6] },
    { suit: TileSuit.Pinzu, ranks: [2, 3] },
    { suit: TileSuit.Pinzu, ranks: [5, 6] },
    { suit: TileSuit.Wind, ranks: [1, 1] },
  ],
  exchange: [{ suit: TileSuit.Dragon, ranks: [1, 3] }],
  replacements: [{ suit: TileSuit.Pinzu, ranks: [1, 4] }],
  complete: [
    { suit: TileSuit.Manzu, ranks: [1, 2, 3] },
    { suit: TileSuit.Souzu, ranks: [4, 5, 6] },
    { suit: TileSuit.Pinzu, ranks: [1, 2, 3] },
    { suit: TileSuit.Pinzu, ranks: [4, 5, 6] },
    { suit: TileSuit.Wind, ranks: [1, 1] },
  ],
} satisfies Record<string, ExampleTileGroup[]>
