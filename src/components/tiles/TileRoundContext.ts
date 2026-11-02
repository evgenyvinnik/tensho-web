/**
 * The round a table's tiles are being played in. Editions that read it (a
 * Bonus Edition grows with the Act, a Lucky Edition rolls each round) show
 * their current value on the tile and in its details. Outside a round (the
 * Tea House, packs, the guide) there is none, and tiles show their rules.
 *
 * @module components/tiles/TileRoundContext
 */

import { createContext, useContext } from 'react'
import type { EditionRound } from '../../core/TileModifier'

/** The Act and this round's roll per Lucky tile id. */
export type TileRound = Required<EditionRound>

export const TileRoundContext = createContext<TileRound | null>(null)

export function useTileRound(): TileRound | null {
  return useContext(TileRoundContext)
}
