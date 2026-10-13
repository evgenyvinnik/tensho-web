/** Minimum number of tiles in an ordinary tactical play. */
export const MIN_TACTICAL_PLAY_TILES = 2

/**
 * Maximum number of tiles in a play that is not a complete Mahjong hand.
 * Six is enough for the largest poker-style patterns (Two Sequences, Three
 * Pairs, a Triplet and a Sequence) while keeping each choice a real choice.
 */
export const MAX_TACTICAL_PLAY_TILES = 6

/**
 * Turns per round. Play and REDRAW both spend one Turn: the single budget the
 * HUD shows as "Turns left".
 */
export const TURNS_PER_ROUND = 6

/**
 * A Small or Large round cleared with at least this many Turns to spare earns
 * that round's Omen.
 */
export const SWIFT_CLEAR_SPARE_TURNS = 2

export function isTacticalPlaySize(tileCount: number): boolean {
  return (
    tileCount >= MIN_TACTICAL_PLAY_TILES &&
    tileCount <= MAX_TACTICAL_PLAY_TILES
  )
}
