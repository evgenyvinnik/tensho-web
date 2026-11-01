import { Tile, TileSuit, WindType } from './Tile'

/** Preserve numbered ranks; Honors cycle through their actual identities. */
export function suitConversionRank(rank: number, suit: TileSuit): number {
  if (!Number.isInteger(rank) || rank < 1 || rank > 9)
    throw new Error('Suit conversion requires a numbered rank from 1 to 9')
  if (suit === TileSuit.Flower || suit === TileSuit.Season)
    throw new Error('Suit conversion cannot create bonus tiles')
  const count = suit === TileSuit.Wind ? 4 : suit === TileSuit.Dragon ? 3 : 9
  return ((rank - 1) % count) + 1
}

/** Pure conversion shared by settlement and analysis; no randomness or new ID. */
export function convertSuitedTile(tile: Tile, suit: TileSuit): Tile {
  if (!tile.isSuited || tile.suit === suit) return tile
  const rank = suitConversionRank(tile.rank, suit)
  const isHonor = suit === TileSuit.Wind || suit === TileSuit.Dragon
  return new Tile(
    suit,
    rank,
    tile.id,
    !isHonor && tile.isRed && rank === 5,
    tile.modifiers
  )
}

/** Change a physical numbered tile, retaining aka-dora only while it is five. */
export function convertSuitedTileRank(tile: Tile, rank: number): Tile {
  if (!tile.isSuited) return tile
  if (!Number.isInteger(rank) || rank < 1 || rank > 9)
    throw new Error('Rank conversion requires a numbered rank from 1 to 9')
  if (tile.rank === rank) return tile
  return new Tile(
    tile.suit,
    rank,
    tile.id,
    tile.isRed && rank === 5,
    tile.modifiers
  )
}

/**
 * Whether a tile can become one named honor: not a Flower or Season, not a
 * Stone (it has no face to change), and not that honor already.
 */
export function canBecomeHonor(
  tile: Tile,
  suit: TileSuit,
  rank: number
): boolean {
  return (
    !tile.isBonus &&
    !tile.isStone &&
    !(tile.suit === suit && tile.rank === rank)
  )
}

/**
 * Turn a tile into one named honor, whatever it was. Unlike a suit conversion
 * nothing cycles: the result is always this Wind or Dragon. The tile keeps its
 * id and its Mark, Stamp or Edition; an honor is never a red five.
 */
export function convertTileToHonor(
  tile: Tile,
  suit: TileSuit,
  rank: number
): Tile {
  const count = suit === TileSuit.Wind ? 4 : suit === TileSuit.Dragon ? 3 : 0
  if (!count) throw new Error('Honor conversion needs a Wind or Dragon')
  if (!Number.isInteger(rank) || rank < 1 || rank > count)
    throw new Error(`Honor conversion needs a rank from 1 to ${count}`)
  if (!canBecomeHonor(tile, suit, rank)) return tile
  return new Tile(suit, rank, tile.id, false, tile.modifiers)
}

/** The public legend is derived from the same rank rule as actual conversion. */
export const UNITY_WIND_CONVERSIONS = [
  { wind: WindType.East, key: 'east' },
  { wind: WindType.South, key: 'south' },
  { wind: WindType.West, key: 'west' },
  { wind: WindType.North, key: 'north' },
].map((entry) => ({
  ...entry,
  ranks: Array.from({ length: 9 }, (_, i) => i + 1).filter(
    (rank) => suitConversionRank(rank, TileSuit.Wind) === entry.wind
  ),
}))
