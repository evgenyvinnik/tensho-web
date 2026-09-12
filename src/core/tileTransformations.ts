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
