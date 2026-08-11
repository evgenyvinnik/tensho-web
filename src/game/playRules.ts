/** Minimum number of tiles in an ordinary tactical play. */
export const MIN_TACTICAL_PLAY_TILES = 2

/**
 * Maximum number of tiles that may be cycled without declaring a complete
 * Mahjong hand. Keeping this small makes tile choice meaningful and prevents
 * full-hand cycling from dominating every turn.
 */
export const MAX_TACTICAL_PLAY_TILES = 5

export function isTacticalPlaySize(tileCount: number): boolean {
  return (
    tileCount >= MIN_TACTICAL_PLAY_TILES &&
    tileCount <= MAX_TACTICAL_PLAY_TILES
  )
}
